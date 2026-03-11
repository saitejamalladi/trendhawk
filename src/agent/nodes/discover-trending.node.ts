import { Logger } from '@nestjs/common';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AgentStateType } from '../agent.state';

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
export function createDiscoverTrendingNode(llm: BaseChatModel) {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    logger.log('discoverTrending — placeholder (subtask-04 will implement)');
    void llm; // will be used in subtask-04
    void state;

    return {
      candidateRepos: [],
      error: null,
    };
  };
}
