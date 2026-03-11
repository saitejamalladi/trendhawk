import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { ReportModule } from '../report/report.module';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';

@Module({
  imports: [LlmModule, ReportModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
