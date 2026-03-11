import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { DiscoveryService } from './discovery.service';

@Module({
  imports: [LlmModule],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
