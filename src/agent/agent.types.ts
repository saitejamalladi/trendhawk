import type { DiscoverySource } from '../discovery/discovery.types';

/**
 * Shared domain types for the TrendHawk agent flow.
 * These are plain data objects — no ORM dependencies.
 */

/** A raw GitHub repository candidate discovered in the discovery step. */
export interface CandidateRepo {
  url: string;
  repoFullName: string;
  name: string;
  description: string;
  language?: string;
  whyTrending: string;
  sources: DiscoverySource[];
  stars: number;
  forks: number;
  topics: string[];
  discoveredWeek: string;
}

/** A validated, AI-generated report ready to be saved. */
export interface GeneratedReport extends CandidateRepo {
  reportMarkdown: string;
  embedding: number[];
}

/** Result produced by the validateOutput node. */
export interface ValidationResult {
  valid: boolean;
  issues: string[];
  repoUrl: string;
}

/** Names used for LangGraph graph nodes. */
export const GRAPH_NODES = {
  DISCOVER_TRENDING: 'discoverTrending',
  FILTER_DUPLICATES: 'filterDuplicates',
  GENERATE_REPORTS: 'generateReports',
  VALIDATE_OUTPUT: 'validateOutput',
  SAVE_TO_MONGO: 'saveToMongo',
  HANDLE_ERROR: 'handleError',
} as const;
