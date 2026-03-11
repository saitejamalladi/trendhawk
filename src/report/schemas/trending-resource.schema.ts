import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TrendingResourceDocument = HydratedDocument<TrendingResource>;

@Schema({ timestamps: true, collection: 'trending_resources' })
export class TrendingResource {
  /** Canonical URL of the GitHub repository */
  @Prop({ required: true, unique: true, index: true })
  url!: string;

  /** GitHub owner/repo string, e.g. "vercel/next.js" */
  @Prop({ required: true })
  repoFullName!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop()
  language?: string;

  @Prop({ default: 0 })
  stars!: number;

  @Prop({ default: 0 })
  forks!: number;

  /** Week the repository was discovered (ISO date string, e.g. "2026-03-09") */
  @Prop({ required: true, index: true })
  discoveredWeek!: string;

  /**
   * Full AI-generated report in Markdown.
   * Populated by subtask-06.
   */
  @Prop({ default: '' })
  reportMarkdown!: string;

  /**
   * Vector embedding of the report/description for RAG deduplication.
   * Populated by subtask-05.
   */
  @Prop({ type: [Number], default: [] })
  embedding!: number[];

  /** Topics / tags returned by GitHub */
  @Prop({ type: [String], default: [] })
  topics!: string[];
}

export const TrendingResourceSchema =
  SchemaFactory.createForClass(TrendingResource);

// Text search index for description and name.
// Explicitly set language_override to a non-existent field so that the
// document's `language` property (e.g. "JavaScript") is *not* interpreted
// as a text search language override, which would trigger
// "language override unsupported" errors.
TrendingResourceSchema.index(
  { name: 'text', description: 'text' },
  {
    default_language: 'none',
    language_override: 'searchLanguage',
  },
);

// Compound index to facilitate deduplication lookups within a given week
TrendingResourceSchema.index({ discoveredWeek: 1, url: 1 }, { unique: true });
