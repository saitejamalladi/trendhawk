export type DiscoverySourceType =
  | 'github-trending'
  | 'hacker-news'
  | 'reddit'
  | 'devto'
  | 'blog'
  | 'other';

export interface DiscoverySource {
  name: string;
  type: DiscoverySourceType;
  url?: string;
}

export interface DiscoveryRepositoryInput {
  url: string;
  repoFullName?: string;
  name: string;
  description: string;
  language?: string;
  whyTrending: string;
  sources: DiscoverySource[];
  stars?: number;
  forks?: number;
  topics?: string[];
}

export interface DiscoveryOptions {
  asOf?: Date;
  lookbackDays?: number;
  maxCandidates?: number;
  prioritizedSources?: string[];
}

export interface DiscoveryModelResponse {
  candidates: DiscoveryRepositoryInput[];
}
