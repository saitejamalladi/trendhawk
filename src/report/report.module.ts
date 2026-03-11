import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TrendingResource,
  TrendingResourceSchema,
} from './schemas/trending-resource.schema';
import { ReportRepository } from './report.repository';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrendingResource.name, schema: TrendingResourceSchema },
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportRepository, ReportService],
  exports: [ReportService],
})
export class ReportModule {}
