import { createGenerateReportsNode } from './generate-reports.node';
import type { GeneratedReport, ValidationResult } from '../agent.types';
import type { ReportGenerationService } from '../../report/report-generation.service';

describe('createGenerateReportsNode', () => {
  it('delegates report generation for filtered repositories', async () => {
    const generatedReports: GeneratedReport[] = [
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
        reportMarkdown: '# trendhawk',
        embedding: [1, 2, 3],
      },
    ];
    const validationResults: ValidationResult[] = [];

    const reportGenerationService = {
      generateReports: jest.fn().mockResolvedValue(generatedReports),
    } as unknown as ReportGenerationService;

    const node = createGenerateReportsNode(reportGenerationService);
    const result = await node({
      uniqueRepos: generatedReports,
      reports: [],
      validationResults,
    } as never);

    expect(result).toEqual({ reports: generatedReports, error: null });
  });
});
