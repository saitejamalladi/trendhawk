import type { GeneratedReport, ValidationResult } from '../agent/agent.types';
import { ReportGenerationService } from './report-generation.service';
import type { EmbeddingService } from '../llm/embedding.service';
import type { LlmFactory } from '../llm/llm.factory';

describe('ReportGenerationService', () => {
  it('generates structured markdown reports and embeddings for selected repositories', async () => {
    const candidate = {
      url: 'https://github.com/acme/trendhawk',
      repoFullName: 'acme/trendhawk',
      name: 'trendhawk',
      description: 'Trend detection for GitHub projects',
      language: 'TypeScript',
      whyTrending: 'Launched publicly this week',
      sources: [{ name: 'Hacker News', type: 'hacker-news' as const }],
      stars: 42,
      forks: 7,
      topics: ['ai'],
      discoveredWeek: '2026-03-09',
    };

    const llmFactory = {
      create: jest.fn().mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
          content: JSON.stringify({
            whyItMatters:
              'This project matters because it helps developers detect fast-moving open-source momentum before it becomes mainstream.',
            whatItDoes:
              'It collects community signals, ranks repositories, and prepares structured summaries for downstream analysis.',
            recentMomentum:
              'Recent discussion on Hacker News and launch-week interest explain why it is gaining traction right now.',
            technicalSignals:
              'It is built with TypeScript, has early traction in stars and forks, and focuses on AI-oriented workflows.',
            risksWatchouts:
              'The project is still early, so users should watch for maturity, maintenance cadence, and evidence of sustained adoption.',
          }),
        }),
      }),
    } as unknown as LlmFactory;
    const embeddingService = {
      embedDocuments: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    } as unknown as EmbeddingService;

    const service = new ReportGenerationService(embeddingService, llmFactory);
    const reports = await service.generateReports([candidate]);

    expect(reports).toHaveLength(1);
    expect(reports[0].reportMarkdown).toContain('# trendhawk');
    expect(reports[0].reportMarkdown).toContain('## Why It Matters');
    expect(reports[0].reportMarkdown).toContain('Repository: acme/trendhawk');
    expect(reports[0].embedding).toEqual([0.1, 0.2, 0.3]);
  });

  it('reuses previously valid reports and regenerates only invalid ones', async () => {
    const candidate = {
      url: 'https://github.com/acme/trendhawk',
      repoFullName: 'acme/trendhawk',
      name: 'trendhawk',
      description: 'Trend detection for GitHub projects',
      language: 'TypeScript',
      whyTrending: 'Launched publicly this week',
      sources: [{ name: 'Hacker News', type: 'hacker-news' as const }],
      stars: 42,
      forks: 7,
      topics: ['ai'],
      discoveredWeek: '2026-03-09',
    };
    const existingReport: GeneratedReport = {
      ...candidate,
      reportMarkdown: '# trendhawk\n\nExisting valid report',
      embedding: [1, 2, 3],
    };
    const validationResults: ValidationResult[] = [
      { valid: true, issues: [], repoUrl: candidate.url },
    ];

    const llmFactory = {
      create: jest.fn(),
    } as unknown as LlmFactory;
    const embeddingService = {
      embedDocuments: jest.fn(),
    } as unknown as EmbeddingService;

    const service = new ReportGenerationService(embeddingService, llmFactory);
    const reports = await service.generateReports(
      [candidate],
      [existingReport],
      validationResults,
    );

    expect(reports).toEqual([existingReport]);
  });
});
