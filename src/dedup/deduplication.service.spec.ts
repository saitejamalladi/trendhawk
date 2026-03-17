import type { CandidateRepo } from '../github-trend-finder/github-trend-finder.types';
import { DeduplicationService } from './deduplication.service';
import type { EmbeddingService } from '../llm/embedding.service';
import type { ReportService } from '../report/report.service';

describe('DeduplicationService', () => {
  const createRepo = (
    name: string,
    overrides: Partial<CandidateRepo> = {},
  ): CandidateRepo => ({
    url: `https://github.com/acme/${name}`,
    repoFullName: `acme/${name}`,
    name,
    description: `${name} description`,
    language: 'TypeScript',
    whyTrending: `${name} gained momentum this week`,
    sources: [{ name: 'GitHub Trending', type: 'github-trending' }],
    stars: 100,
    forks: 10,
    topics: ['ai'],
    discoveredWeek: '2026-03-09',
    ...overrides,
  });

  const createConfig = () => ({
    get: jest.fn((key: string, defaultValue: number) => defaultValue),
  });

  it('excludes historical URLs and current batch duplicates, then caps to top 3', async () => {
    const reportService = {
      findExistingUrls: jest
        .fn()
        .mockResolvedValue(new Set(['https://github.com/acme/already-seen'])),
      findAllEmbeddings: jest.fn().mockResolvedValue([]),
    } as unknown as ReportService;

    const embeddingService = {
      embedDocuments: jest.fn().mockResolvedValue([]),
    } as unknown as EmbeddingService;

    const service = new DeduplicationService(
      createConfig() as never,
      embeddingService,
      reportService,
    );

    const result = await service.deduplicateCandidates([
      createRepo('already-seen', { stars: 999 }),
      createRepo('alpha', { stars: 500 }),
      createRepo('alpha-copy', {
        repoFullName: 'acme/alpha',
        name: 'alpha',
        description: 'alpha description',
      }),
      createRepo('beta', { stars: 400 }),
      createRepo('gamma', { stars: 300 }),
      createRepo('delta', { stars: 200 }),
    ]);

    expect(result.fallbackApplied).toBe(false);
    expect(result.uniqueRepos.map((repo) => repo.repoFullName)).toEqual([
      'acme/alpha',
      'acme/beta',
      'acme/gamma',
    ]);
    expect(result.decisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'historical-url',
          repoFullName: 'acme/already-seen',
        }),
        expect.objectContaining({
          category: 'batch-url',
          repoUrl: 'https://github.com/acme/alpha-copy',
        }),
        expect.objectContaining({
          category: 'selection-cap',
          repoFullName: 'acme/delta',
        }),
      ]),
    );
  });

  it('excludes semantically similar repositories against stored embeddings', async () => {
    const reportService = {
      findExistingUrls: jest.fn().mockResolvedValue(new Set()),
      findAllEmbeddings: jest.fn().mockResolvedValue([
        {
          _id: '1',
          url: 'https://github.com/acme/existing',
          embedding: [1, 0],
        },
      ]),
    } as unknown as ReportService;

    const embeddingService = {
      embedDocuments: jest.fn().mockResolvedValue([
        [1, 0],
        [0, 1],
      ]),
    } as unknown as EmbeddingService;

    const service = new DeduplicationService(
      createConfig() as never,
      embeddingService,
      reportService,
    );

    const result = await service.deduplicateCandidates([
      createRepo('semantic-dupe'),
      createRepo('unique'),
    ]);

    expect(result.uniqueRepos.map((repo) => repo.repoFullName)).toEqual([
      'acme/unique',
    ]);
    expect(result.decisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'historical-semantic',
          repoFullName: 'acme/semantic-dupe',
          matchedRepoUrl: 'https://github.com/acme/existing',
          similarity: 1,
        }),
      ]),
    );
  });

  it('uses a safe fallback path when historical lookup fails', async () => {
    const reportService = {
      findExistingUrls: jest
        .fn()
        .mockRejectedValue(new Error('db unavailable')),
      findAllEmbeddings: jest.fn(),
    } as unknown as ReportService;

    const embeddingService = {
      embedDocuments: jest.fn(),
    } as unknown as EmbeddingService;

    const service = new DeduplicationService(
      createConfig() as never,
      embeddingService,
      reportService,
    );

    const result = await service.deduplicateCandidates([
      createRepo('alpha', { stars: 300 }),
      createRepo('beta', { stars: 200 }),
      createRepo('gamma', { stars: 100 }),
      createRepo('delta', { stars: 50 }),
    ]);

    expect(result.fallbackApplied).toBe(true);
    expect(result.uniqueRepos.map((repo) => repo.repoFullName)).toEqual([
      'acme/alpha',
      'acme/beta',
      'acme/gamma',
    ]);
    expect(
      result.decisions.every((decision) => decision.category === 'fallback'),
    ).toBe(true);
  });
});
