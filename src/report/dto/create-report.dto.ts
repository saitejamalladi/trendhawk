import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  repoFullName!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  language?: string;

  @ApiPropertyOptional({ default: 0 })
  stars?: number;

  @ApiPropertyOptional({ default: 0 })
  forks?: number;

  @ApiProperty()
  discoveredWeek!: string;

  @ApiPropertyOptional({ default: '' })
  reportMarkdown?: string;

  @ApiPropertyOptional({ type: [Number], default: [] })
  embedding?: number[];

  @ApiPropertyOptional({ type: [String], default: [] })
  topics?: string[];
}
