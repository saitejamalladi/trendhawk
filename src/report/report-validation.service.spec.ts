import { ReportValidationService } from './report-validation.service';
import type { LlmFactory } from '../llm/llm.factory';

describe('ReportValidationService', () => {
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

  it('accepts reports that satisfy deterministic checks and model validation', async () => {
    const llmFactory = {
      create: jest.fn().mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
          content: JSON.stringify({ valid: true, issues: [] }),
        }),
      }),
    } as unknown as LlmFactory;

    const service = new ReportValidationService(llmFactory);
    const results = await service.validateReports(
      [candidate],
      [
        {
          ...candidate,
          reportMarkdown: [
            '# trendhawk',
            '',
            'Repository: acme/trendhawk',
            'URL: https://github.com/acme/trendhawk',
            'Primary language: TypeScript',
            'Topics: ai',
            'Stars: 42',
            'Forks: 7',
            'Trend sources: Hacker News',
            '',
            '## Why It Matters',
            'This project matters because it helps teams detect meaningful GitHub momentum with enough context to prioritize attention early.',
            '',
            '## What It Does',
            'It gathers trend inputs, normalizes repository signals, and packages them into readable reports for downstream review and storage.',
            '',
            '## Recent Momentum',
            'Launch-week discussion and Hacker News visibility explain its recent momentum and show why the repository is attracting fresh interest.',
            '',
            '## Technical Signals',
            'The repository uses TypeScript, has measurable stars and forks, and focuses on AI-related topics that align with current developer interest.',
            '',
            '## Risks & Watchouts',
            'The project is still young, so teams should watch for execution depth, maintenance consistency, and whether momentum sustains beyond launch.',
          ].join('\n'),
          embedding: [1, 2, 3],
        },
      ],
    );

    expect(results).toEqual([
      { valid: true, issues: [], repoUrl: 'https://github.com/acme/trendhawk' },
    ]);
  });

  it('rejects reports with missing required sections', async () => {
    const llmFactory = {
      create: jest.fn().mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
          content: JSON.stringify({ valid: true, issues: [] }),
        }),
      }),
    } as unknown as LlmFactory;

    const service = new ReportValidationService(llmFactory);
    const results = await service.validateReports(
      [candidate],
      [
        {
          ...candidate,
          reportMarkdown:
            '# trendhawk\n\nRepository: acme/trendhawk\nURL: https://github.com/acme/trendhawk',
          embedding: [],
        },
      ],
    );

    expect(results[0].valid).toBe(false);
    expect(results[0].issues).toEqual(
      expect.arrayContaining([
        'Missing required section: Why It Matters.',
        'Report is too short to be useful.',
      ]),
    );
  });
});
