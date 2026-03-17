import { Logger } from '@nestjs/common';
import type { AgentStateType } from '../github-trend-finder.state';
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
    const validReportUrls = new Set(
      state.validationResults
        .filter((result) => result.valid)
        .map((result) => result.repoUrl),
    );
    const reportsToSave = state.reports.filter((report) =>
      validReportUrls.has(report.url),
    );
    logger.log(`saveToMongo — saving ${reportsToSave.length} valid report(s)`);

    const failures: string[] = [];

    for (const report of reportsToSave) {
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
        failures.push(`${report.url}: ${message}`);
      }
    }

    return {
      error:
        failures.length > 0
          ? `Failed to save ${failures.length} report(s): ${failures.join('; ')}`
          : state.error,
    };
  };
}
