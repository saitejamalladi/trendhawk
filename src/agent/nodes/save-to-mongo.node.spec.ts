import { createSaveToMongoNode } from './save-to-mongo.node';
import type { ReportService } from '../../report/report.service';

describe('createSaveToMongoNode', () => {
  it('persists only reports that passed validation', async () => {
    const upsertByUrl = jest.fn().mockResolvedValue({});
    const reportService = {
      upsertByUrl,
    } as unknown as ReportService;

    const node = createSaveToMongoNode(reportService);
    const result = await node({
      reports: [
        {
          url: 'https://github.com/acme/valid',
          repoFullName: 'acme/valid',
          name: 'valid',
          description: 'valid',
          language: 'TypeScript',
          whyTrending: 'valid',
          sources: [],
          stars: 1,
          forks: 1,
          topics: [],
          discoveredWeek: '2026-03-09',
          reportMarkdown: '# valid',
          embedding: [1],
        },
        {
          url: 'https://github.com/acme/invalid',
          repoFullName: 'acme/invalid',
          name: 'invalid',
          description: 'invalid',
          language: 'TypeScript',
          whyTrending: 'invalid',
          sources: [],
          stars: 1,
          forks: 1,
          topics: [],
          discoveredWeek: '2026-03-09',
          reportMarkdown: '# invalid',
          embedding: [2],
        },
      ],
      validationResults: [
        { valid: true, issues: [], repoUrl: 'https://github.com/acme/valid' },
        {
          valid: false,
          issues: ['Missing section'],
          repoUrl: 'https://github.com/acme/invalid',
        },
      ],
      error: null,
    } as never);

    expect(upsertByUrl).toHaveBeenCalledTimes(1);
    expect(upsertByUrl).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://github.com/acme/valid' }),
    );
    expect(result).toEqual({ error: null });
  });
});
