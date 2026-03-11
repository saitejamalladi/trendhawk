import { Logger } from '@nestjs/common';
import type { AgentStateType } from '../agent.state';
import type { ValidationResult } from '../agent.types';

const logger = new Logger('validateOutputNode');

const MAX_RETRIES = 2;

/**
 * Node: validateOutput
 *
 * Checks that each generated report meets minimum quality criteria
 * (non-empty content, correct structure, etc.).
 * Real validation logic lands in subtask-06.
 * This placeholder marks all reports as valid.
 *
 * Returns state.validationResults and increments retryCount if needed.
 */
export function createValidateOutputNode() {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    logger.log(
      `validateOutput — checking ${state.reports.length} reports (retry ${state.retryCount}/${MAX_RETRIES})`,
    );

    const validationResults: ValidationResult[] = state.reports.map(
      (report) => ({
        valid: true, // placeholder: subtask-06 will add real checks
        issues: [],
        repoUrl: report.url,
      }),
    );

    const allValid = validationResults.every((r) => r.valid);

    return {
      validationResults,
      retryCount: allValid ? state.retryCount : state.retryCount + 1,
      error: null,
    };
  };
}

/**
 * Conditional edge: routes from validateOutput to either
 * saveToMongo (all valid) or generateReports (retry) or handleError (max retries).
 */
export function routeAfterValidation(state: AgentStateType): string {
  const allValid = state.validationResults.every((r) => r.valid);

  if (allValid) {
    return 'saveToMongo';
  }

  if (state.retryCount >= MAX_RETRIES) {
    return 'handleError';
  }

  return 'generateReports';
}
