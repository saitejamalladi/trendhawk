import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Embeddings } from '@langchain/core/embeddings';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { OpenAIEmbeddings } from '@langchain/openai';
import type { LlmProvider } from './llm.factory';

@Injectable()
export class EmbeddingFactory {
  private readonly logger = new Logger(EmbeddingFactory.name);

  constructor(private readonly config: ConfigService) {}

  create(overrideProvider?: LlmProvider): Embeddings | null {
    const provider =
      overrideProvider ??
      (this.config.get<string>('LLM_PROVIDER', 'openai') as LlmProvider);

    this.logger.log(`Creating embeddings for provider: ${provider}`);

    switch (provider) {
      case 'openai':
        return this.createOpenAIEmbeddings();
      case 'google':
        return this.createGoogleEmbeddings();
      case 'anthropic':
        this.logger.warn(
          'Anthropic does not have a configured embeddings provider; semantic deduplication will fall back to string and URL checks.',
        );
        return null;
      default:
        throw new Error(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Unknown LLM_PROVIDER "${provider}". Supported: openai, anthropic, google`,
        );
    }
  }

  private createOpenAIEmbeddings(): OpenAIEmbeddings {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');

    return new OpenAIEmbeddings({
      apiKey,
      model: this.config.get<string>(
        'OPENAI_EMBEDDING_MODEL',
        'text-embedding-3-small',
      ),
    });
  }

  private createGoogleEmbeddings(): GoogleGenerativeAIEmbeddings {
    const apiKey = this.config.getOrThrow<string>('GOOGLE_API_KEY');

    return new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: this.config.get<string>(
        'GOOGLE_EMBEDDING_MODEL',
        'text-embedding-004',
      ),
    });
  }
}
