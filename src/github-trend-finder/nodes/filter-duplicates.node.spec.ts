import { createFilterDuplicatesNode } from './filter-duplicates.node';
import type { CandidateRepo, DeduplicationDecision } from '../github-trend-finder.types';
import type { DeduplicationService } from '../../dedup/deduplication.service';

describe('createFilterDuplicatesNode', () => {
  it('writes unique repos and decisions to state', async () => {
    const candidateRepos: CandidateRepo[] = [
      {
        url: 'https://github.com/acme/foo',
        repoFullName: 'acme/foo',
        name: 'foo',
        description: 'foo',
        whyTrending: 'foo',
        sources: [{ name: 'GitHub Trending', type: 'github-trending' }],
        stars: 1,
        forks: 1,
        topics: [],
        discoveredWeek: '2026-03-09',
      },
    ];

    const decisions: DeduplicationDecision[] = [
      {
        action: 'kept',
        category: 'selected',
        repoUrl: candidateRepos[0].url,
        repoFullName: candidateRepos[0].repoFullName,
        reason: 'first pick',
      },
    ];

    const deduplicationService = {
      deduplicateCandidates: jest
        .fn()
        .mockResolvedValue({ uniqueRepos: candidateRepos, decisions }),
    } as unknown as DeduplicationService;

    const node = createFilterDuplicatesNode(deduplicationService);
    const result = await node({ candidateRepos } as never);

    expect(result).toEqual({
      uniqueRepos: candidateRepos,
      deduplicationDecisions: decisions,
      error: undefined,
    });
  });
});
