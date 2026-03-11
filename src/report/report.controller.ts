import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';
import {
  ReportListResponseDto,
  ReportResponseDto,
} from './dto/report-response.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  @ApiOperation({ summary: 'List all generated reports' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, type: ReportListResponseDto })
  async findAll(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
  ): Promise<ReportListResponseDto> {
    const { data, total } = await this.reportService.findAll(limit, skip);
    return { data: data as unknown as ReportResponseDto[], total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single report by ID' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async findOne(@Param('id') id: string): Promise<ReportResponseDto> {
    const doc = await this.reportService.findOne(id);
    return doc as unknown as ReportResponseDto;
  }
}
