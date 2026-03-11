import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TrendingResource,
  TrendingResourceDocument,
} from './schemas/trending-resource.schema';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectModel(TrendingResource.name)
    private readonly model: Model<TrendingResourceDocument>,
  ) {}

  /**
   * Persist a new report. Throws on duplicate url + discoveredWeek.
   */
  async create(dto: CreateReportDto): Promise<TrendingResourceDocument> {
    return this.model.create(dto);
  }

  /**
   * Upsert by url — updates the existing document if the url already exists.
   */
  async upsertByUrl(
    dto: CreateReportDto,
  ): Promise<TrendingResourceDocument | null> {
    return this.model.findOneAndUpdate(
      { url: dto.url },
      dto,
      {
        upsert: true,
        // `new` is kept for backwards compatibility; `returnDocument`
        // is the modern option that avoids deprecation warnings.
        new: true,
        returnDocument: 'after',
      },
    );
  }

  async findById(id: string): Promise<TrendingResourceDocument | null> {
    return this.model.findById(id).exec();
  }

  async findAll(
    filter: Record<string, any> = {},
    limit = 50,
    skip = 0,
  ): Promise<TrendingResourceDocument[]> {
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  /**
   * Check if any of the supplied URLs already exist in the database.
   * Returns the set of existing URLs — used for deduplication in subtask-05.
   */
  async findExistingUrls(urls: string[]): Promise<Set<string>> {
    const docs = await this.model
      .find({ url: { $in: urls } }, { url: 1 })
      .lean()
      .exec();
    return new Set(docs.map((d) => d.url));
  }

  /**
   * Return embeddings of previously stored reports for RAG deduplication.
   * Subtask-05 will call this to compare candidate embeddings.
   */
  async findAllEmbeddings(): Promise<
    Array<{ _id: string; url: string; embedding: number[] }>
  > {
    const docs = await this.model
      .find({ embedding: { $ne: [] } }, { url: 1, embedding: 1 })
      .lean()
      .exec();
    return docs.map((d) => ({
      _id: String(d._id),
      url: d.url,
      embedding: d.embedding,
    }));
  }
}
