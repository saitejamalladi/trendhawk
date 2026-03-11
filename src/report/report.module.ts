import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LlmModule } from '../llm/llm.module';
import {
  TrendingResource,
  TrendingResourceSchema,
} from './schemas/trending-resource.schema';
import { ReportRepository } from './report.repository';
import { ReportGenerationService } from './report-generation.service';
import { ReportService } from './report.service';
import { ReportValidationService } from './report-validation.service';
import { ReportController } from './report.controller';

@Module({
  imports: [
    LlmModule,
    MongooseModule.forFeature([
      { name: TrendingResource.name, schema: TrendingResourceSchema },
    ]),
  ],
  controllers: [ReportController],
  providers: [
    ReportGenerationService,
    ReportRepository,
    ReportService,
    ReportValidationService,
  ],
  exports: [ReportGenerationService, ReportService, ReportValidationService],
})
export class ReportModule {}
