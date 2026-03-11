import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { ReportModule } from '../report/report.module';
import { DeduplicationService } from './deduplication.service';

@Module({
  imports: [LlmModule, ReportModule],
  providers: [DeduplicationService],
  exports: [DeduplicationService],
})
export class DedupModule {}
