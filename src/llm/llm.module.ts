import { Module } from '@nestjs/common';
import { EmbeddingFactory } from './embedding.factory';
import { EmbeddingService } from './embedding.service';
import { LlmFactory } from './llm.factory';

@Module({
  providers: [EmbeddingFactory, EmbeddingService, LlmFactory],
  exports: [EmbeddingFactory, EmbeddingService, LlmFactory],
})
export class LlmModule {}
