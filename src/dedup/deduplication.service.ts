import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CandidateRepo,
  DeduplicationDecision,
} from '../github-trend-finder/github-trend-finder.types';
import { EmbeddingService } from '../llm/embedding.service';
import { ReportService } from '../report/report.service';
import {
  buildCandidateEmbeddingText,
  cosineSimilarity,
  isObviousBatchDuplicate,
} from './similarity.utils';

interface RankedCandidate {
  repo: CandidateRepo;
  rank: number;
}

interface DeduplicationResult {
  uniqueRepos: CandidateRepo[];
  decisions: DeduplicationDecision[];
  fallbackApplied: boolean;
}

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly embeddingService: EmbeddingService,
    private readonly reportService: ReportService,
  ) {}

  async deduplicateCandidates(
    candidates: CandidateRepo[],
  ): Promise<DeduplicationResult> {
    const rankedCandidates = this.rankCandidates(candidates);

    try {
      return await this.runDeduplication(rankedCandidates);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown deduplication error';
      this.logger.warn(`Deduplication fallback activated: ${message}`);
      return this.buildFallbackResult(rankedCandidates, message);
    }
  }

  private async runDeduplication(
    candidates: RankedCandidate[],
  ): Promise<DeduplicationResult> {
    const decisions: DeduplicationDecision[] = [];
    const maxUniqueRepos = this.config.get<number>('DEDUP_MAX_UNIQUE_REPOS', 3);
    const stringThreshold = this.config.get<number>(
      'DEDUP_STRING_SIMILARITY_THRESHOLD',
      0.92,
    );
    const semanticThreshold = this.config.get<number>(
      'DEDUP_SEMANTIC_SIMILARITY_THRESHOLD',
      0.94,
    );

    const existingUrls = await this.reportService.findExistingUrls(
      candidates.map(({ repo }) => repo.url),
    );

    const urlFiltered = candidates.filter(({ repo }) => {
      if (!existingUrls.has(repo.url)) {
        return true;
      }

      decisions.push({
        action: 'excluded',
        category: 'historical-url',
        repoFullName: repo.repoFullName,
        repoUrl: repo.url,
        reason: 'Repository URL already exists in historical reports.',
      });
      return false;
    });

    const batchFiltered: RankedCandidate[] = [];

    for (const candidate of urlFiltered) {
      const duplicate = batchFiltered.find((kept) =>
        isObviousBatchDuplicate(candidate.repo, kept.repo, stringThreshold),
      );

      if (!duplicate) {
        batchFiltered.push(candidate);
        continue;
      }

      decisions.push({
        action: 'excluded',
        category:
          candidate.repo.url === duplicate.repo.url ||
          candidate.repo.repoFullName === duplicate.repo.repoFullName
            ? 'batch-url'
            : 'batch-string',
        repoFullName: candidate.repo.repoFullName,
        repoUrl: candidate.repo.url,
        matchedRepoUrl: duplicate.repo.url,
        reason: `Repository is an obvious duplicate of ${duplicate.repo.repoFullName} in the current candidate batch.`,
      });
    }

    const semanticFiltered = await this.excludeSemanticDuplicates(
      batchFiltered,
      decisions,
      semanticThreshold,
    );

    const selected = semanticFiltered.slice(0, maxUniqueRepos);
    const deferred = semanticFiltered.slice(maxUniqueRepos);

    for (const candidate of selected) {
      decisions.push({
        action: 'kept',
        category: 'selected',
        repoFullName: candidate.repo.repoFullName,
        repoUrl: candidate.repo.url,
        reason: 'Selected as a top unique repository after deduplication.',
      });
    }

    for (const candidate of deferred) {
      decisions.push({
        action: 'excluded',
        category: 'selection-cap',
        repoFullName: candidate.repo.repoFullName,
        repoUrl: candidate.repo.url,
        reason: `Repository remained unique but fell below the top ${maxUniqueRepos} selection cutoff.`,
      });
    }

    return {
      uniqueRepos: selected.map(({ repo }) => repo),
      decisions,
      fallbackApplied: false,
    };
  }

  private async excludeSemanticDuplicates(
    candidates: RankedCandidate[],
    decisions: DeduplicationDecision[],
    semanticThreshold: number,
  ): Promise<RankedCandidate[]> {
    const historicalEmbeddings = await this.reportService.findAllEmbeddings();
    if (historicalEmbeddings.length === 0 || candidates.length === 0) {
      return candidates;
    }

    const candidateEmbeddings = await this.embeddingService.embedDocuments(
      candidates.map(({ repo }) => buildCandidateEmbeddingText(repo)),
    );

    if (candidateEmbeddings.length !== candidates.length) {
      this.logger.warn(
        'Candidate embeddings unavailable; continuing with URL and string-based deduplication only.',
      );
      return candidates;
    }

    return candidates.filter((candidate, index) => {
      let bestSimilarity = 0;
      let matchedRepoUrl: string | undefined;

      for (const stored of historicalEmbeddings) {
        const similarity = cosineSimilarity(
          candidateEmbeddings[index],
          stored.embedding,
        );

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          matchedRepoUrl = stored.url;
        }
      }

      if (bestSimilarity < semanticThreshold) {
        return true;
      }

      decisions.push({
        action: 'excluded',
        category: 'historical-semantic',
        repoFullName: candidate.repo.repoFullName,
        repoUrl: candidate.repo.url,
        matchedRepoUrl,
        similarity: Number(bestSimilarity.toFixed(4)),
        reason:
          'Repository is semantically too similar to an existing stored report.',
      });
      return false;
    });
  }

  private buildFallbackResult(
    candidates: RankedCandidate[],
    message: string,
  ): DeduplicationResult {
    const maxUniqueRepos = this.config.get<number>('DEDUP_MAX_UNIQUE_REPOS', 3);
    const uniqueByIdentity = new Map<string, CandidateRepo>();

    for (const candidate of candidates) {
      const key = `${candidate.repo.url}::${candidate.repo.repoFullName}`;
      if (!uniqueByIdentity.has(key)) {
        uniqueByIdentity.set(key, candidate.repo);
      }
      if (uniqueByIdentity.size >= maxUniqueRepos) {
        break;
      }
    }

    const uniqueRepos = [...uniqueByIdentity.values()];
    const decisions: DeduplicationDecision[] = uniqueRepos.map((repo) => ({
      action: 'kept',
      category: 'fallback',
      repoFullName: repo.repoFullName,
      repoUrl: repo.url,
      reason: `Safe fallback path used after deduplication failure: ${message}`,
    }));

    return {
      uniqueRepos,
      decisions,
      fallbackApplied: true,
    };
  }

  private rankCandidates(candidates: CandidateRepo[]): RankedCandidate[] {
    return candidates
      .map((repo, index) => ({ repo, rank: index }))
      .sort((left, right) => {
        const sourceDelta =
          right.repo.sources.length - left.repo.sources.length;
        if (sourceDelta !== 0) {
          return sourceDelta;
        }

        const starDelta = right.repo.stars - left.repo.stars;
        if (starDelta !== 0) {
          return starDelta;
        }

        const forkDelta = right.repo.forks - left.repo.forks;
        if (forkDelta !== 0) {
          return forkDelta;
        }

        return left.rank - right.rank;
      });
  }
}
