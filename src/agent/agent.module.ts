import { Module } from '@nestjs/common';
import { DedupModule } from '../dedup/dedup.module';
import { DiscoveryModule } from '../discovery/discovery.module';
import { LlmModule } from '../llm/llm.module';
import { ReportModule } from '../report/report.module';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';

@Module({
  imports: [DedupModule, DiscoveryModule, LlmModule, ReportModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
