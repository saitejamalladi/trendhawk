import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportRepository } from './report.repository';
import { CreateReportDto } from './dto/create-report.dto';
import { TrendingResourceDocument } from './schemas/trending-resource.schema';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async create(dto: CreateReportDto): Promise<TrendingResourceDocument> {
    return this.reportRepository.create(dto);
  }

  async upsertByUrl(
    dto: CreateReportDto,
  ): Promise<TrendingResourceDocument | null> {
    return this.reportRepository.upsertByUrl(dto);
  }

  async findAll(
    limit = 50,
    skip = 0,
  ): Promise<{ data: TrendingResourceDocument[]; total: number }> {
    const [data, total] = await Promise.all([
      this.reportRepository.findAll({}, limit, skip),
      this.reportRepository.count(),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<TrendingResourceDocument> {
    const doc = await this.reportRepository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Report with id "${id}" not found`);
    }
    return doc;
  }

  /** Used by subtask-05 for URL-based deduplication */
  async findExistingUrls(urls: string[]): Promise<Set<string>> {
    return this.reportRepository.findExistingUrls(urls);
  }

  /** Used by subtask-05 for embedding-based deduplication */
  async findAllEmbeddings() {
    return this.reportRepository.findAllEmbeddings();
  }
}
