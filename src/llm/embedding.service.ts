import { Injectable, Logger } from '@nestjs/common';
import type { LlmProvider } from './llm.factory';
import { EmbeddingFactory } from './embedding.factory';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly embeddingFactory: EmbeddingFactory) {}

  async embedQuery(
    text: string,
    overrideProvider?: LlmProvider,
  ): Promise<number[] | null> {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }

    const embeddings = this.getEmbeddings(overrideProvider);
    if (!embeddings) {
      return null;
    }

    return embeddings.embedQuery(trimmed);
  }

  async embedDocuments(
    texts: string[],
    overrideProvider?: LlmProvider,
  ): Promise<number[][]> {
    const documents = texts.map((text) => text.trim()).filter(Boolean);
    if (documents.length === 0) {
      return [];
    }

    const embeddings = this.getEmbeddings(overrideProvider);
    if (!embeddings) {
      return [];
    }

    return embeddings.embedDocuments(documents);
  }

  private getEmbeddings(overrideProvider?: LlmProvider) {
    try {
      return this.embeddingFactory.create(overrideProvider);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown embeddings error';
      this.logger.warn(`Embeddings unavailable: ${message}`);
      return null;
    }
  }
}
