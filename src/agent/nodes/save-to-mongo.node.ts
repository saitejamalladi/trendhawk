import { Logger } from '@nestjs/common';
import type { AgentStateType } from '../agent.state';
import type { ReportService } from '../../report/report.service';

const logger = new Logger('saveToMongoNode');

/**
 * Node: saveToMongo
 *
 * Persists each validated report to MongoDB via ReportService.
 * Real persistence is already wired through ReportService from subtask-02;
 * this node calls it directly.
 */
export function createSaveToMongoNode(reportService: ReportService) {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    logger.log(`saveToMongo — saving ${state.reports.length} reports`);

    for (const report of state.reports) {
      try {
        await reportService.upsertByUrl({
          url: report.url,
          repoFullName: report.repoFullName,
          name: report.name,
          description: report.description,
          language: report.language,
          stars: report.stars,
          forks: report.forks,
          discoveredWeek: report.discoveredWeek,
          reportMarkdown: report.reportMarkdown,
          embedding: report.embedding,
          topics: report.topics,
        });
        logger.log(`Saved report for ${report.url}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to save ${report.url}: ${message}`);
      }
    }

    return { error: null };
  };
}
