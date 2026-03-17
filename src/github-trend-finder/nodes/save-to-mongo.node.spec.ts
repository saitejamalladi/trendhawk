import { createSaveToMongoNode } from './save-to-mongo.node';
import type { ReportService } from '../../report/report.service';
import type { GeneratedReport } from '../github-trend-finder.types';

describe('createSaveToMongoNode', () => {
  it('skips saving when there are no reports', async () => {
    const reportService = {
      upsertByUrl: jest.fn(),
    } as unknown as ReportService;

    const node = createSaveToMongoNode(reportService);
    const result = await node({ reports: [], validationResults: [] } as never);

    expect(reportService.upsertByUrl).not.toHaveBeenCalled();
    expect(result).toEqual({ error: undefined });
  });

  it('saves only valid reports', async () => {
    const reports: GeneratedReport[] = [
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
        reportMarkdown: '# Foo',
        embedding: [0.1],
      },
    ];

    const reportService = {
      upsertByUrl: jest.fn().mockResolvedValue(undefined),
    } as unknown as ReportService;

    const node = createSaveToMongoNode(reportService);
    const result = await node({
      reports,
      validationResults: [{ valid: true, issues: [], repoUrl: reports[0].url }],
    } as never);

    expect(reportService.upsertByUrl).toHaveBeenCalled();
    expect(result).toEqual({ error: undefined });
  });
});
