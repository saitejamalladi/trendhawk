import { Logger } from '@nestjs/common';
import type { AgentStateType } from '../github-trend-finder.state';

const logger = new Logger('handleErrorNode');

/**
 * Node: handleError
 *
 * Terminal node reached when the graph cannot recover (max retries exceeded
 * or an unhandled exception was caught by a try/catch in another node).
 * Logs the current error and leaves state unchanged so callers can inspect it.
 */
export function createHandleErrorNode() {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    const message =
      state.error ??
      `Validation failed after ${state.retryCount} retries with no recoverable error message`;

    logger.error(`handleError — ${message}`);

    return {
      error: message,
    };
  };
}
