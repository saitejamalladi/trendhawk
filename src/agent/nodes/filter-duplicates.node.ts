import { Logger } from '@nestjs/common';
import type { AgentStateType } from '../agent.state';
import type { DeduplicationService } from '../../dedup/deduplication.service';

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
export function createFilterDuplicatesNode(
  deduplicationService: DeduplicationService,
) {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    logger.log(
      `filterDuplicates — evaluating ${state.candidateRepos.length} candidates`,
    );

    const result = await deduplicationService.deduplicateCandidates(
      state.candidateRepos,
    );

    logger.log(
      `filterDuplicates — selected ${result.uniqueRepos.length} unique repo(s), ${result.decisions.filter((decision) => decision.action === 'excluded').length} excluded`,
    );

    return {
      uniqueRepos: result.uniqueRepos,
      deduplicationDecisions: result.decisions,
      error: state.error,
    };
  };
}
