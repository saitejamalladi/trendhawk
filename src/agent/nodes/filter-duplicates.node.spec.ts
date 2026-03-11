import { createFilterDuplicatesNode } from './filter-duplicates.node';
import type { CandidateRepo, DeduplicationDecision } from '../agent.types';
import type { DeduplicationService } from '../../dedup/deduplication.service';

describe('createFilterDuplicatesNode', () => {
  it('stores unique repositories and deduplication decisions in graph state', async () => {
    const uniqueRepos: CandidateRepo[] = [
      {
        url: 'https://github.com/acme/trendhawk',
        repoFullName: 'acme/trendhawk',
        name: 'trendhawk',
        description: 'Trend detection for GitHub projects',
        language: 'TypeScript',
        whyTrending: 'Launched publicly this week',
        sources: [{ name: 'Hacker News', type: 'hacker-news' }],
        stars: 42,
        forks: 7,
        topics: ['ai'],
        discoveredWeek: '2026-03-09',
      },
    ];
    const decisions: DeduplicationDecision[] = [
      {
        action: 'kept',
        category: 'selected',
        repoUrl: uniqueRepos[0].url,
        repoFullName: uniqueRepos[0].repoFullName,
        reason: 'Selected as a top unique repository after deduplication.',
      },
    ];

    const deduplicationService = {
      deduplicateCandidates: jest.fn().mockResolvedValue({
        uniqueRepos,
        decisions,
        fallbackApplied: false,
      }),
    } as unknown as DeduplicationService;

    const node = createFilterDuplicatesNode(deduplicationService);
    const result = await node({
      candidateRepos: uniqueRepos,
      error: null,
    } as never);

    expect(result).toEqual({
      uniqueRepos,
      deduplicationDecisions: decisions,
      error: null,
    });
  });
});
