import { Logger } from '@nestjs/common';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AgentStateType } from '../agent.state';
import type { GeneratedReport } from '../agent.types';

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
export function createGenerateReportsNode(llm: BaseChatModel) {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    const candidates = state.uniqueRepos.slice(0, 3);
    logger.log(
      `generateReports — generating stubs for ${candidates.length} repos (subtask-06 will implement)`,
    );
    void llm; // will be used in subtask-06

    const reports: GeneratedReport[] = candidates.map((repo) => ({
      ...repo,
      reportMarkdown: `# ${repo.name}\n\n_Report generation coming in subtask-06._`,
      embedding: [],
    }));

    return {
      reports,
      error: state.error,
    };
  };
}
