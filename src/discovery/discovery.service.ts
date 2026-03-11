import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { LlmFactory } from '../llm/llm.factory';
import type { CandidateRepo } from '../agent/agent.types';
import type {
  DiscoveryModelResponse,
  DiscoveryOptions,
  DiscoveryRepositoryInput,
  DiscoverySource,
  DiscoverySourceType,
} from './discovery.types';

type JsonRecord = Record<string, unknown>;

const DEFAULT_MAX_CANDIDATES = 20;
const DEFAULT_LOOKBACK_DAYS = 7;
const DEFAULT_PRIORITIZED_SOURCES = [
  'GitHub Trending',
  'Hacker News',
  'Reddit',
  'Dev.to',
  'developer blogs',
];

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(private readonly llmFactory: LlmFactory) {}

  async discoverTrendingRepositories(
    options: DiscoveryOptions = {},
  ): Promise<CandidateRepo[]> {
    const maxCandidates = Math.min(
      options.maxCandidates ?? DEFAULT_MAX_CANDIDATES,
      DEFAULT_MAX_CANDIDATES,
    );
    const lookbackDays = options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
    const asOf = options.asOf ?? new Date();
    const discoveredWeek = this.getDiscoveredWeek(asOf);
    const llm = this.llmFactory.create();

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt({
      asOf,
      lookbackDays,
      maxCandidates,
      prioritizedSources:
        options.prioritizedSources ?? DEFAULT_PRIORITIZED_SOURCES,
    });

    this.logger.debug(`LLM discovery system prompt for ${discoveredWeek}:\n${systemPrompt}`);
    this.logger.debug(`LLM discovery user prompt for ${discoveredWeek}:\n${userPrompt}`);

    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    this.logger.debug(
      `LLM discovery raw response for ${discoveredWeek}:\n${this.getMessageText(
        response.content,
      )}`,
    );

    const usage: any =
      (response as any).usage_metadata ??
      (response as any).response_metadata?.tokenUsage ??
      (response as any).response_metadata?.usage;

    if (usage) {
      const inputTokens =
        usage.input_tokens ?? usage.prompt_tokens ?? usage.inputTokens;
      const outputTokens =
        usage.output_tokens ?? usage.completion_tokens ?? usage.outputTokens;
      const totalTokens = usage.total_tokens ?? usage.totalTokens;

      this.logger.debug(
        `LLM discovery token usage — input: ${inputTokens ?? 'n/a'}, output: ${
          outputTokens ?? 'n/a'
        }, total: ${totalTokens ?? 'n/a'}`,
      );
    }

    const parsed = this.parseModelResponse(response.content);
    const normalized = this.normalizeCandidates(
      parsed.candidates,
      discoveredWeek,
      maxCandidates,
    );

    this.logger.log(
      `Discovery normalized ${normalized.length} candidate repo(s) for ${discoveredWeek}`,
    );

    return normalized;
  }

  private buildSystemPrompt(): string {
    return [
      'You are TrendHawk, a concise research assistant for trending GitHub repositories.',
      'Focus only on repositories with notable community momentum during the requested time window.',
      'Prefer widely discussed open-source projects and avoid speculative or stale picks.',
      'Return valid JSON only with no markdown fences or extra commentary.',
    ].join(' ');
  }

  private buildUserPrompt(options: Required<DiscoveryOptions>): string {
    const endDate = this.toIsoDate(options.asOf);
    const startDate = this.toIsoDate(
      new Date(
        options.asOf.getTime() -
          (options.lookbackDays - 1) * 24 * 60 * 60 * 1000,
      ),
    );

    return [
      `Research the strongest GitHub repository momentum from ${startDate} to ${endDate} (inclusive).`,
      `Prioritize these sources in order: ${options.prioritizedSources.join(', ')}.`,
      `Return at most ${options.maxCandidates} repositories.`,
      'Each candidate must be an actual GitHub repository from the last week and include:',
      '- url: canonical GitHub repo URL',
      '- repoFullName: owner/repo',
      '- name: short repository name',
      '- description: one-sentence summary',
      '- language: primary language if known',
      '- whyTrending: concise explanation tied to recent momentum',
      '- sources: array of { name, type, url } describing where the momentum was observed',
      '- stars, forks, topics when known',
      'Use this JSON shape exactly:',
      '{"candidates":[{"url":"https://github.com/owner/repo","repoFullName":"owner/repo","name":"repo","description":"summary","language":"TypeScript","whyTrending":"reason","sources":[{"name":"GitHub Trending","type":"github-trending","url":"https://github.com/trending"}],"stars":0,"forks":0,"topics":["ai"]}]}',
      'Do not include repositories without enough confidence, and never exceed the maximum count.',
    ].join('\n');
  }

  private parseModelResponse(content: unknown): DiscoveryModelResponse {
    const rawText = this.getMessageText(content);
    const parsed = this.parseJsonPayload(rawText);

    if (Array.isArray(parsed)) {
      return {
        candidates: parsed.filter((item): item is DiscoveryRepositoryInput =>
          this.isRecord(item),
        ),
      };
    }

    if (this.isRecord(parsed)) {
      const candidateKeys = ['candidates', 'repositories', 'repos'];

      for (const key of candidateKeys) {
        const value = parsed[key];
        if (Array.isArray(value)) {
          return {
            candidates: value.filter((item): item is DiscoveryRepositoryInput =>
              this.isRecord(item),
            ),
          };
        }
      }
    }

    throw new Error(
      'LLM discovery response did not contain a candidates array',
    );
  }

  private normalizeCandidates(
    candidates: DiscoveryRepositoryInput[],
    discoveredWeek: string,
    maxCandidates: number,
  ): CandidateRepo[] {
    const deduped = new Map<string, CandidateRepo>();

    for (const candidate of candidates) {
      const normalized = this.normalizeCandidate(candidate, discoveredWeek);
      if (!normalized) {
        continue;
      }

      if (!deduped.has(normalized.repoFullName)) {
        deduped.set(normalized.repoFullName, normalized);
      }

      if (deduped.size >= maxCandidates) {
        break;
      }
    }

    return [...deduped.values()];
  }

  private normalizeCandidate(
    candidate: DiscoveryRepositoryInput,
    discoveredWeek: string,
  ): CandidateRepo | null {
    const record = candidate as unknown as JsonRecord;
    const url = this.normalizeGithubRepoUrl(
      this.pickString(record, ['url', 'repoUrl', 'githubUrl']),
    );

    if (!url) {
      return null;
    }

    const repoFullName =
      this.normalizeRepoFullName(
        this.pickString(record, ['repoFullName', 'fullName', 'repository']),
      ) ?? this.getRepoFullNameFromUrl(url);

    if (!repoFullName) {
      return null;
    }

    const description = this.pickString(record, ['description', 'summary']);
    const whyTrending = this.pickString(record, [
      'whyTrending',
      'trendReason',
      'reason',
    ]);

    if (!description || !whyTrending) {
      return null;
    }

    const sources = this.normalizeSources(record.sources);

    if (sources.length === 0) {
      return null;
    }

    return {
      url,
      repoFullName,
      name:
        this.pickString(record, ['name', 'repoName']) ??
        repoFullName.split('/')[1],
      description,
      language:
        this.pickString(record, ['language', 'primaryLanguage']) ?? undefined,
      whyTrending,
      sources,
      stars: this.pickNumber(record, ['stars', 'stargazersCount']) ?? 0,
      forks: this.pickNumber(record, ['forks', 'forksCount']) ?? 0,
      topics: this.normalizeStringArray(record.topics),
      discoveredWeek,
    };
  }

  private normalizeSources(input: unknown): DiscoverySource[] {
    if (!Array.isArray(input)) {
      return [];
    }

    const sources = new Map<string, DiscoverySource>();

    for (const source of input) {
      let normalized: DiscoverySource | null = null;

      if (typeof source === 'string') {
        const name = source.trim();
        if (name) {
          normalized = {
            name,
            type: this.inferSourceType(name),
          };
        }
      } else if (this.isRecord(source)) {
        const name = this.pickString(source, ['name', 'title', 'label']);
        if (!name) {
          continue;
        }

        const url = this.normalizeHttpUrl(
          this.pickString(source, ['url', 'link', 'href']),
        );
        const type = this.normalizeSourceType(
          this.pickString(source, ['type', 'kind', 'sourceType']),
          name,
        );

        normalized = {
          name,
          type,
          ...(url ? { url } : {}),
        };
      }

      if (!normalized) {
        continue;
      }

      const key = `${normalized.type}:${normalized.name.toLowerCase()}`;
      const existing = sources.get(key);

      if (!existing || (!existing.url && normalized.url)) {
        sources.set(key, normalized);
      }

      if (sources.size >= 5) {
        break;
      }
    }

    return [...sources.values()];
  }

  private normalizeStringArray(input: unknown): string[] {
    if (!Array.isArray(input)) {
      return [];
    }

    const seen = new Set<string>();
    const values: string[] = [];

    for (const item of input) {
      if (typeof item !== 'string') {
        continue;
      }

      const value = item.trim();
      if (!value) {
        continue;
      }

      const key = value.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      values.push(value);
    }

    return values;
  }

  private normalizeGithubRepoUrl(url: string | null): string | null {
    if (!url) {
      return null;
    }

    try {
      const parsed = new URL(url.trim());
      const hostname = parsed.hostname.toLowerCase();
      if (hostname !== 'github.com' && hostname !== 'www.github.com') {
        return null;
      }

      const segments = parsed.pathname
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean);

      if (segments.length < 2) {
        return null;
      }

      const owner = segments[0];
      const repo = segments[1].replace(/\.git$/i, '');

      if (
        !this.isValidGithubSegment(owner) ||
        !this.isValidGithubSegment(repo)
      ) {
        return null;
      }

      return `https://github.com/${owner}/${repo}`;
    } catch {
      return null;
    }
  }

  private normalizeHttpUrl(url: string | null): string | undefined {
    if (!url) {
      return undefined;
    }

    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return undefined;
      }

      return parsed.toString();
    } catch {
      return undefined;
    }
  }

  private normalizeRepoFullName(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim().replace(/^https?:\/\/github\.com\//i, '');
    const segments = trimmed.split('/').filter(Boolean);

    if (segments.length < 2) {
      return null;
    }

    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/i, '');

    if (!this.isValidGithubSegment(owner) || !this.isValidGithubSegment(repo)) {
      return null;
    }

    return `${owner}/${repo}`;
  }

  private getRepoFullNameFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length < 2) {
        return null;
      }

      return `${segments[0]}/${segments[1]}`;
    } catch {
      return null;
    }
  }

  private normalizeSourceType(
    type: string | null,
    fallbackName: string,
  ): DiscoverySourceType {
    if (!type) {
      return this.inferSourceType(fallbackName);
    }

    const normalized = type.trim().toLowerCase();

    switch (normalized) {
      case 'github-trending':
      case 'github trending':
        return 'github-trending';
      case 'hacker-news':
      case 'hacker news':
      case 'hn':
        return 'hacker-news';
      case 'reddit':
        return 'reddit';
      case 'devto':
      case 'dev.to':
        return 'devto';
      case 'blog':
      case 'blogs':
      case 'developer blog':
      case 'developer blogs':
        return 'blog';
      default:
        return this.inferSourceType(type);
    }
  }

  private inferSourceType(value: string): DiscoverySourceType {
    const normalized = value.trim().toLowerCase();

    if (normalized.includes('github')) {
      return 'github-trending';
    }
    if (normalized.includes('hacker news') || normalized === 'hn') {
      return 'hacker-news';
    }
    if (normalized.includes('reddit')) {
      return 'reddit';
    }
    if (normalized.includes('dev.to') || normalized.includes('devto')) {
      return 'devto';
    }
    if (normalized.includes('blog')) {
      return 'blog';
    }

    return 'other';
  }

  private pickString(record: JsonRecord, keys: string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private pickNumber(record: JsonRecord, keys: string[]): number | null {
    for (const key of keys) {
      const value = record[key];

      if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(0, Math.round(value));
      }

      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value.replace(/,/g, ''));
        if (Number.isFinite(parsed)) {
          return Math.max(0, Math.round(parsed));
        }
      }
    }

    return null;
  }

  private parseJsonPayload(rawText: string): unknown {
    const candidates = [
      rawText.trim(),
      this.extractFencedJson(rawText),
      this.extractBetween(rawText, '{', '}'),
      this.extractBetween(rawText, '[', ']'),
    ].filter((value): value is string => Boolean(value && value.trim()));

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    throw new Error('Unable to parse discovery JSON from LLM response');
  }

  private extractFencedJson(rawText: string): string | null {
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return match?.[1]?.trim() ?? null;
  }

  private extractBetween(
    rawText: string,
    openChar: '{' | '[',
    closeChar: '}' | ']',
  ): string | null {
    const start = rawText.indexOf(openChar);
    const end = rawText.lastIndexOf(closeChar);

    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    return rawText.slice(start, end + 1).trim();
  }

  private getMessageText(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }

          if (this.isRecord(part) && typeof part.text === 'string') {
            return part.text;
          }

          return '';
        })
        .join('\n')
        .trim();
    }

    return '';
  }

  private getDiscoveredWeek(date: Date): string {
    const utcDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const utcDay = utcDate.getUTCDay();
    const daysFromMonday = (utcDay + 6) % 7;
    utcDate.setUTCDate(utcDate.getUTCDate() - daysFromMonday);

    return this.toIsoDate(utcDate);
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private isValidGithubSegment(value: string): boolean {
    return /^[A-Za-z0-9_.-]+$/.test(value);
  }

  private isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null;
  }
}
