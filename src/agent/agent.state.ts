import { Annotation } from '@langchain/langgraph';
import type {
  CandidateRepo,
  GeneratedReport,
  ValidationResult,
} from './agent.types';

/**
 * LangGraph state annotation for the TrendHawk agent.
 *
 * Each field uses LangGraph's Annotation helper so the graph
 * knows how to merge partial updates returned by each node.
 */
export const AgentState = Annotation.Root({
  /** Raw candidates discovered by discoverTrending (up to 20). */
  discoveredRepos: Annotation<CandidateRepo[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  /** Raw candidates discovered by discoverTrending (up to 20). */
  candidateRepos: Annotation<CandidateRepo[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  /** Candidates remaining after URL/embedding deduplication. */
  uniqueRepos: Annotation<CandidateRepo[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  /** Final AI-generated reports (target: 3). */
  reports: Annotation<GeneratedReport[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  /** Per-report validation outcomes from validateOutput. */
  validationResults: Annotation<ValidationResult[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  /** Number of generate→validate retry cycles attempted. */
  retryCount: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),

  /** Set to a message when any node encounters a fatal error. */
  error: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

/** Inferred TypeScript type for the full agent state. */
export type AgentStateType = typeof AgentState.State;
