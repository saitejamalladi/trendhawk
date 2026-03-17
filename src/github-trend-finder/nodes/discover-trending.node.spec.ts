import { createDiscoverTrendingNode } from './discover-trending.node';
import type { CandidateRepo } from '../github-trend-finder.types';
import type { DiscoveryService } from '../../discovery/discovery.service';

describe('createDiscoverTrendingNode', () => {
  it('writes discovered repositories to both discovery state fields', async () => {
    const repos: CandidateRepo[] = [
      {
        url: 'https://github.com/acme/trendhawk',
        repoFullName: 'acme/trendhawk',
        name: 'trendhawk',
        description: 'Trend detection for GitHub projects',
        language: 'TypeScript',
        whyTrending: 'New launch this week',
        sources: [{ name: 'Hacker News', type: 'hacker-news' }],
        stars: 42,
        forks: 7,
        topics: ['ai'],
        discoveredWeek: '2026-03-09',
      },
    ];

    const discoveryService = {
      discoverTrendingRepositories: jest.fn().mockResolvedValue(repos),
    } as unknown as DiscoveryService;

    const node = createDiscoverTrendingNode(discoveryService);
    const result = await node({} as never);

    expect(result).toEqual({
      discoveredRepos: repos,
      candidateRepos: repos,
      error: null,
    });
  });
});
