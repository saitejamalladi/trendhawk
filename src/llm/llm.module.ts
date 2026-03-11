import { Module } from '@nestjs/common';
import { LlmFactory } from './llm.factory';

@Module({
  providers: [LlmFactory],
  exports: [LlmFactory],
})
export class LlmModule {}
