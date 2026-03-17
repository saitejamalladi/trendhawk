import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { GithubTrendFinderModule } from '../github-trend-finder/github-trend-finder.module';

@Module({
  imports: [GithubTrendFinderModule],
  controllers: [AgentController],
})
export class AgentModule {}
