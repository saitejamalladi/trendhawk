import {
  createValidateOutputNode,
  routeAfterValidation,
} from './validate-output.node';
import type { ReportValidationService } from '../../report/report-validation.service';

describe('createValidateOutputNode', () => {
  it('stores validation results and keeps retry count when all reports are valid', async () => {
    const reportValidationService = {
      validateReports: jest.fn().mockResolvedValue([
        {
          valid: true,
          issues: [],
          repoUrl: 'https://github.com/acme/trendhawk',
        },
      ]),
    } as unknown as ReportValidationService;

    const node = createValidateOutputNode(reportValidationService);
    const result = await node({
      uniqueRepos: [{ url: 'https://github.com/acme/trendhawk' }],
      reports: [{ url: 'https://github.com/acme/trendhawk' }],
      retryCount: 0,
      error: null,
    } as never);

    expect(result).toEqual({
      validationResults: [
        {
          valid: true,
          issues: [],
          repoUrl: 'https://github.com/acme/trendhawk',
        },
      ],
      retryCount: 0,
      error: null,
    });
  });
});

describe('routeAfterValidation', () => {
  it('routes invalid results back to generation until max retries', () => {
    expect(
      routeAfterValidation({
        validationResults: [{ valid: false, issues: ['bad'], repoUrl: 'x' }],
        retryCount: 1,
      } as never),
    ).toBe('generateReports');
  });

  it('routes to handleError after max retries', () => {
    expect(
      routeAfterValidation({
        validationResults: [{ valid: false, issues: ['bad'], repoUrl: 'x' }],
        retryCount: 2,
      } as never),
    ).toBe('handleError');
  });
});
