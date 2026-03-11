import { Logger } from '@nestjs/common';
import type { AgentStateType } from '../agent.state';
import type { ReportService } from '../../report/report.service';

const logger = new Logger('filterDuplicatesNode');

/**
 * Node: filterDuplicates
 *
 * Removes candidates that are already stored in MongoDB (URL match) or
 * that are semantically too similar to existing reports (embedding distance).
 * Real implementation lands in subtask-05. This placeholder passes all
 * candidates through as unique.
 *
 * Target output: state.uniqueRepos with duplicates excluded.
 */
export function createFilterDuplicatesNode(reportService: ReportService) {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    logger.log(
      `filterDuplicates — ${state.candidateRepos.length} candidates (subtask-05 will implement dedup)`,
    );
    void reportService; // will be used in subtask-05

    return {
      uniqueRepos: state.candidateRepos,
      error: null,
    };
  };
}
