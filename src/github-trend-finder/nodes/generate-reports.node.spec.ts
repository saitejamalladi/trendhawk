import { createGenerateReportsNode } from './generate-reports.node';
import type { GeneratedReport, ValidationResult } from '../github-trend-finder.types';
import type { ReportGenerationService } from '../../report/report-generation.service';

describe('createGenerateReportsNode', () => {
  it('generates reports from unique repos', async () => {
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

    const reportGenerationService = {
      generateReports: jest.fn().mockResolvedValue(reports),
    } as unknown as ReportGenerationService;

    const node = createGenerateReportsNode(reportGenerationService);

    const result = await node({
      uniqueRepos: reports,
      reports: [],
      validationResults: [] as ValidationResult[],
    } as never);

    expect(result).toEqual({ reports, error: null });
  });
});
