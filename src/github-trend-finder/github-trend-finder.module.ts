import { Module } from '@nestjs/common';
import { DedupModule } from '../dedup/dedup.module';
import { DiscoveryModule } from '../discovery/discovery.module';
import { ReportModule } from '../report/report.module';
import { GithubTrendFinderService } from './github-trend-finder.service';

@Module({
  imports: [DedupModule, DiscoveryModule, ReportModule],
  providers: [GithubTrendFinderService],
  exports: [GithubTrendFinderService],
})
export class GithubTrendFinderModule {}
