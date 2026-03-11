import { Logger } from '@nestjs/common';
import type { AgentStateType } from '../agent.state';
import type { ReportValidationService } from '../../report/report-validation.service';

const logger = new Logger('validateOutputNode');

const MAX_RETRIES = 20;

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
export function createValidateOutputNode(
  reportValidationService: ReportValidationService,
) {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    logger.log(
      `validateOutput — checking ${state.reports.length} reports (retry ${state.retryCount}/${MAX_RETRIES})`,
    );

    try {
      const validationResults = await reportValidationService.validateReports(
        state.uniqueRepos,
        state.reports,
      );
      const allValid = validationResults.every((result) => result.valid);

      return {
        validationResults,
        retryCount: allValid ? state.retryCount : state.retryCount + 1,
        error: allValid ? null : state.error,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown validation failure';
      logger.error(`validateOutput failed: ${message}`);

      return {
        validationResults: state.uniqueRepos.map((repo) => ({
          valid: false,
          issues: [`Validation execution failed: ${message}`],
          repoUrl: repo.url,
        })),
        retryCount: state.retryCount + 1,
        error: `Validation failed: ${message}`,
      };
    }
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
