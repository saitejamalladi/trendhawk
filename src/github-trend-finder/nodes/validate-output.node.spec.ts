import {
  createValidateOutputNode,
  routeAfterValidation,
} from './validate-output.node';
import type { ReportValidationService } from '../../report/report-validation.service';
import type { ValidationResult } from '../github-trend-finder.types';

describe('createValidateOutputNode', () => {
  it('validates reports and increments retry count when invalid', async () => {
    const validationResults: ValidationResult[] = [
      { valid: false, issues: ['missing sections'], repoUrl: 'x' },
    ];

    const reportValidationService = {
      validateReports: jest.fn().mockResolvedValue(validationResults),
    } as unknown as ReportValidationService;

    const node = createValidateOutputNode(reportValidationService);
    const result = await node({
      uniqueRepos: [],
      reports: [],
      retryCount: 0,
      error: null,
    } as never);

    expect(result).toEqual({
      validationResults,
      retryCount: 1,
      error: null,
    });
  });
});

describe('routeAfterValidation', () => {
  it('routes to saveToMongo when all reports are valid', () => {
    expect(
      routeAfterValidation({
        validationResults: [{ valid: true, issues: [], repoUrl: 'x' }],
        retryCount: 0,
      } as never),
    ).toBe('saveToMongo');
  });

  it('routes to generateReports when invalid and retries remaining', () => {
    expect(
      routeAfterValidation({
        validationResults: [{ valid: false, issues: ['x'], repoUrl: 'x' }],
        retryCount: 0,
      } as never),
    ).toBe('generateReports');
  });

  it('routes to handleError when invalid and retries exceeded', () => {
    expect(
      routeAfterValidation({
        validationResults: [{ valid: false, issues: ['x'], repoUrl: 'x' }],
        retryCount: 20,
      } as never),
    ).toBe('handleError');
  });
});
