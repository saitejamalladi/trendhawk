import { Injectable, Logger } from '@nestjs/common';
import type { BaseMessageLike } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { EmbeddingService } from '../llm/embedding.service';
import { LlmFactory } from '../llm/llm.factory';
import type {
  CandidateRepo,
  GeneratedReport,
  ValidationResult,
} from '../agent/agent.types';

interface ReportSections {
  whyItMatters: string;
  whatItDoes: string;
  recentMomentum: string;
  technicalSignals: string;
  risksWatchouts: string;
}

type JsonRecord = Record<string, unknown>;

@Injectable()
export class ReportGenerationService {
  private readonly logger = new Logger(ReportGenerationService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly llmFactory: LlmFactory,
  ) {}

  async generateReports(
    candidates: CandidateRepo[],
    existingReports: GeneratedReport[] = [],
    validationResults: ValidationResult[] = [],
  ): Promise<GeneratedReport[]> {
    if (candidates.length === 0) {
      return [];
    }

    const reusableReports = this.getReusableReports(
      existingReports,
      validationResults,
    );
    const targets = candidates.filter(
      (candidate) => !reusableReports.has(candidate.url),
    );

    if (targets.length === 0) {
      return candidates
        .map((candidate) => reusableReports.get(candidate.url))
        .filter((report): report is GeneratedReport => Boolean(report));
    }

    const llm = this.llmFactory.create();
    const generatedDrafts = await Promise.all(
      targets.map(async (candidate) => {
        const retryIssues = validationResults.find(
          (result) => result.repoUrl === candidate.url && !result.valid,
        )?.issues;

        const messages = this.buildGenerationMessages(
          candidate,
          retryIssues,
        );

        this.logger.debug(
          `LLM generation prompt for ${candidate.repoFullName}:\n${messages
            .map((m) => (typeof m === 'string' ? m : JSON.stringify(m)))
            .join('\n')}`,
        );

        const response = await llm.invoke(messages);
        const sections = this.parseSectionsResponse(response.content);

        const usage: any =
          (response as any).usage_metadata ??
          (response as any).response_metadata?.tokenUsage ??
          (response as any).response_metadata?.usage;

        if (usage) {
          const inputTokens =
            usage.input_tokens ?? usage.prompt_tokens ?? usage.inputTokens;
          const outputTokens =
            usage.output_tokens ??
            usage.completion_tokens ??
            usage.outputTokens;
          const totalTokens = usage.total_tokens ?? usage.totalTokens;

          this.logger.debug(
            `LLM generation token usage for ${
              candidate.repoFullName
            } — input: ${inputTokens ?? 'n/a'}, output: ${
              outputTokens ?? 'n/a'
            }, total: ${totalTokens ?? 'n/a'}`,
          );
        }
        const reportMarkdown = this.buildMarkdown(candidate, sections);

        return {
          ...candidate,
          reportMarkdown,
        };
      }),
    );

    const embeddings = await this.embeddingService.embedDocuments(
      generatedDrafts.map((report) => report.reportMarkdown),
    );

    const generatedReports = generatedDrafts.map((report, index) => ({
      ...report,
      embedding: embeddings[index] ?? [],
    }));

    const finalReportsByUrl = new Map<string, GeneratedReport>([
      ...reusableReports.entries(),
      ...generatedReports.map((report): [string, GeneratedReport] => [
        report.url,
        report,
      ]),
    ]);

    const orderedReports = candidates
      .map((candidate) => finalReportsByUrl.get(candidate.url))
      .filter((report): report is GeneratedReport => Boolean(report));

    this.logger.log(`Generated ${orderedReports.length} report draft(s)`);

    return orderedReports;
  }

  private buildGenerationMessages(
    candidate: CandidateRepo,
    retryIssues?: string[],
  ): BaseMessageLike[] {
    const retryBlock = retryIssues?.length
      ? `Previous validation issues to fix: ${retryIssues.join('; ')}`
      : 'No previous validation issues.';

    return [
      new SystemMessage(
        [
          'You write concise TrendHawk repository reports.',
          'Return valid JSON only.',
          'Keep every section grounded in the provided repository metadata.',
          'Do not invent facts that are not supported by the input.',
          'Each section should be 2-4 sentences and the total output should stay compact.',
        ].join(' '),
      ),
      new HumanMessage(
        [
          'Generate a structured report for this repository.',
          `Repository: ${candidate.repoFullName}`,
          `Name: ${candidate.name}`,
          `URL: ${candidate.url}`,
          `Description: ${candidate.description}`,
          `Language: ${candidate.language ?? 'Unknown'}`,
          `Why trending: ${candidate.whyTrending}`,
          `Stars: ${candidate.stars}`,
          `Forks: ${candidate.forks}`,
          `Topics: ${candidate.topics.join(', ') || 'None provided'}`,
          `Sources: ${candidate.sources.map((source) => source.name).join(', ')}`,
          retryBlock,
          'Return JSON with exactly these keys:',
          '{"whyItMatters":"...","whatItDoes":"...","recentMomentum":"...","technicalSignals":"...","risksWatchouts":"..."}',
          'The recentMomentum section must reference the supplied trend signal and sources.',
          'The technicalSignals section should reference language, stars, forks, and topics only when provided.',
        ].join('\n'),
      ),
    ];
  }

  private buildMarkdown(
    candidate: CandidateRepo,
    sections: ReportSections,
  ): string {
    const metadataLines = [
      `Repository: ${candidate.repoFullName}`,
      `URL: ${candidate.url}`,
      `Primary language: ${candidate.language ?? 'Unknown'}`,
      `Topics: ${candidate.topics.join(', ') || 'None provided'}`,
      `Stars: ${candidate.stars}`,
      `Forks: ${candidate.forks}`,
      `Trend sources: ${candidate.sources.map((source) => source.name).join(', ')}`,
    ];

    return [
      `# ${candidate.name}`,
      '',
      ...metadataLines,
      '',
      '## Why It Matters',
      sections.whyItMatters,
      '',
      '## What It Does',
      sections.whatItDoes,
      '',
      '## Recent Momentum',
      sections.recentMomentum,
      '',
      '## Technical Signals',
      sections.technicalSignals,
      '',
      '## Risks & Watchouts',
      sections.risksWatchouts,
    ].join('\n');
  }

  private parseSectionsResponse(content: unknown): ReportSections {
    const rawText = this.getMessageText(content);
    const parsed = this.parseJsonPayload(rawText);

    if (!this.isRecord(parsed)) {
      throw new Error('Report generation response was not a JSON object');
    }

    const sections: ReportSections = {
      whyItMatters: this.getRequiredString(parsed, 'whyItMatters'),
      whatItDoes: this.getRequiredString(parsed, 'whatItDoes'),
      recentMomentum: this.getRequiredString(parsed, 'recentMomentum'),
      technicalSignals: this.getRequiredString(parsed, 'technicalSignals'),
      risksWatchouts: this.getRequiredString(parsed, 'risksWatchouts'),
    };

    return sections;
  }

  private getReusableReports(
    existingReports: GeneratedReport[],
    validationResults: ValidationResult[],
  ): Map<string, GeneratedReport> {
    const invalidUrls = new Set(
      validationResults
        .filter((result) => !result.valid)
        .map((result) => result.repoUrl),
    );

    return new Map(
      existingReports
        .filter((report) => !invalidUrls.has(report.url))
        .map((report) => [report.url, report]),
    );
  }

  private getRequiredString(record: JsonRecord, key: string): string {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    throw new Error(`Missing required report section: ${key}`);
  }

  private parseJsonPayload(rawText: string): unknown {
    const candidates = [
      rawText.trim(),
      this.extractFencedJson(rawText),
      this.extractBetween(rawText, '{', '}'),
    ].filter((value): value is string => Boolean(value?.trim()));

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    throw new Error('Unable to parse report generation JSON');
  }

  private extractFencedJson(rawText: string): string | null {
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return match?.[1]?.trim() ?? null;
  }

  private extractBetween(
    rawText: string,
    openChar: '{',
    closeChar: '}',
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

  private isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null;
  }
}
