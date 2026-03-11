import { DiscoveryService } from './discovery.service';
import type { LlmFactory } from '../llm/llm.factory';

describe('DiscoveryService', () => {
  it('normalizes discovery output, filters invalid repos, and caps results at 20', async () => {
    const payload = {
      candidates: [
        {
          url: 'https://example.com/not-github',
          repoFullName: 'bad/repo',
          name: 'bad',
          description: 'invalid source repo',
          whyTrending: 'Not a GitHub URL',
          sources: [{ name: 'Reddit', type: 'reddit' }],
        },
        ...Array.from({ length: 21 }, (_, index) => ({
          url: `https://github.com/example/project-${index}/issues`,
          repoFullName: `example/project-${index}`,
          name: `project-${index}`,
          description: `Project ${index} description`,
          language: 'TypeScript',
          whyTrending: `Project ${index} picked up traction this week`,
          sources: [
            {
              name: 'GitHub Trending',
              type: 'github-trending',
              url: 'https://github.com/trending',
            },
            { name: 'GitHub Trending', type: 'github trending' },
          ],
          stars: `${1000 + index}`,
          forks: index,
          topics: ['ai', 'AI', 'tooling'],
        })),
      ],
    };

    const llmFactory = {
      create: jest.fn().mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
          content: `\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\`\n`,
        }),
      }),
    } as unknown as LlmFactory;

    const service = new DiscoveryService(llmFactory);
    const result = await service.discoverTrendingRepositories({
      asOf: new Date('2026-03-11T12:00:00.000Z'),
    });

    expect(result).toHaveLength(20);
    expect(result[0]).toMatchObject({
      url: 'https://github.com/example/project-0',
      repoFullName: 'example/project-0',
      name: 'project-0',
      language: 'TypeScript',
      whyTrending: 'Project 0 picked up traction this week',
      stars: 1000,
      forks: 0,
      discoveredWeek: '2026-03-09',
    });
    expect(result[0].sources).toEqual([
      {
        name: 'GitHub Trending',
        type: 'github-trending',
        url: 'https://github.com/trending',
      },
    ]);
    expect(result[0].topics).toEqual(['ai', 'tooling']);
  });
});
