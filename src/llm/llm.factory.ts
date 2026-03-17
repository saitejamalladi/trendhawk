import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export type LlmProvider = 'openai' | 'anthropic' | 'google';

@Injectable()
export class LlmFactory {
  private readonly logger = new Logger(LlmFactory.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Returns a chat model for the configured LLM_PROVIDER.
   * Throws immediately when the required API key is missing so the
   * agent fails fast before the graph runs.
   */
  create(overrideProvider?: LlmProvider): BaseChatModel {
    const provider: LlmProvider =
      overrideProvider ??
      (this.config.get<string>('LLM_PROVIDER', 'openai') as LlmProvider);

    this.logger.log(`Creating LLM for provider: ${provider}`);

    switch (provider) {
      case 'openai':
        return this.createOpenAI();
      case 'anthropic':
        return this.createAnthropic();
      case 'google':
        return this.createGoogle();
      default:
        throw new Error(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Unknown LLM_PROVIDER "${provider}". Supported: openai, anthropic, google`,
        );
    }
  }

  private createOpenAI(): ChatOpenAI {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    const baseURL =
      this.config.get<string>('OPENAI_CHAT_BASE_URL') ??
      this.config.get<string>('OPENAI_BASE_URL');

    if (baseURL) {
      this.logger.log(`Using OpenAI-compatible baseURL for chat: ${baseURL}`);
    }

    return new ChatOpenAI({
      apiKey,
      model: this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
      temperature: 0.3,
      configuration: baseURL ? { baseURL } : undefined,
    });
  }

  private createAnthropic(): ChatAnthropic {
    const apiKey = this.config.getOrThrow<string>('ANTHROPIC_API_KEY');
    return new ChatAnthropic({
      apiKey,
      model: this.config.get<string>(
        'ANTHROPIC_MODEL',
        'claude-3-5-haiku-latest',
      ),
      temperature: 0.3,
    });
  }

  private createGoogle(): ChatGoogleGenerativeAI {
    const apiKey = this.config.getOrThrow<string>('GOOGLE_API_KEY');
    return new ChatGoogleGenerativeAI({
      apiKey,
      model: this.config.get<string>('GOOGLE_MODEL', 'gemini-2.0-flash'),
      temperature: 0.3,
    });
  }
}
