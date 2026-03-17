import { Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GithubTrendFinderService } from '../github-trend-finder/github-trend-finder.service';
import { AgentRunResponseDto } from './dto/agent-run-response.dto';

@ApiTags('github-trend-finder')
@Controller('github-trend-finder')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly trendFinderService: GithubTrendFinderService) {}

  @Post('report/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger on-demand report generation',
    description:
      'Runs the full LangGraph agent: discovers up to 20 trending repos, ' +
      'deduplicates, generates 3 reports, validates, and persists to MongoDB.',
  })
  @ApiResponse({ status: 200, type: AgentRunResponseDto })
  async generate(): Promise<AgentRunResponseDto> {
    this.logger.log('POST /api/github-trend-finder/report/generate received');

    const state = await this.trendFinderService.runAgent();

    return {
      reportsGenerated: state.reports.length,
      error: state.error,
      reports: state.reports.map((r) => ({ url: r.url, name: r.name })),
    };
  }
}
