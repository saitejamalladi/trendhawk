import { Logger } from '@nestjs/common';
import type { AgentStateType } from '../agent.state';
import type { DiscoveryService } from '../../discovery/discovery.service';

const logger = new Logger('discoverTrendingNode');

/**
 * Node: discoverTrending
 *
 * Queries the web for trending GitHub repositories from the past week.
 * Real implementation lands in subtask-04. This placeholder returns an
 * empty list so the graph compiles and the flow can be exercised end-to-end.
 *
 * Target output: up to 20 CandidateRepo objects in state.candidateRepos.
 */
export function createDiscoverTrendingNode(discoveryService: DiscoveryService) {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    logger.log('discoverTrending — researching trending repositories');
    void state;

    try {
      const discoveredRepos =
        await discoveryService.discoverTrendingRepositories();

      logger.log(
        `discoverTrending — discovered ${discoveredRepos.length} candidate repo(s)`,
      );

      return {
        discoveredRepos,
        candidateRepos: discoveredRepos,
        error: null,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown discovery failure';
      logger.error(`discoverTrending failed: ${message}`);

      return {
        discoveredRepos: [],
        candidateRepos: [],
        error: `Discovery failed: ${message}`,
      };
    }
  };
}
