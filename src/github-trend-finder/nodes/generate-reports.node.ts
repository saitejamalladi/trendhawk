import { Logger } from '@nestjs/common';
import type { AgentStateType } from '../github-trend-finder.state';
import type { ReportGenerationService } from '../../report/report-generation.service';

const logger = new Logger('generateReportsNode');

/**
 * Node: generateReports
 *
 * Selects the best 3 unique repositories and generates structured Markdown
 * reports via the LLM.  Real implementation lands in subtask-06.
 * This placeholder produces stub reports for the top-3 unique repos.
 *
 * Target output: state.reports with exactly 3 GeneratedReport objects.
 */
export function createGenerateReportsNode(
  reportGenerationService: ReportGenerationService,
) {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    const candidates = state.uniqueRepos.slice(0, 3);
    logger.log(
      `generateReports — generating reports for ${candidates.length} repos`,
    );

    try {
      const reports = await reportGenerationService.generateReports(
        candidates,
        state.reports,
        state.validationResults,
      );

      return {
        reports,
        error: null,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown report generation failure';
      logger.error(`generateReports failed: ${message}`);

      return {
        reports: [],
        error: `Report generation failed: ${message}`,
      };
    }
  };
}
