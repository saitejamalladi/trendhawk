import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportResponseDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  _id!: string;

  @ApiProperty({ example: 'https://github.com/vercel/next.js' })
  url!: string;

  @ApiProperty({ example: 'vercel/next.js' })
  repoFullName!: string;

  @ApiProperty({ example: 'next.js' })
  name!: string;

  @ApiProperty({ example: 'The React Framework for the Web' })
  description!: string;

  @ApiPropertyOptional({ example: 'TypeScript' })
  language?: string;

  @ApiProperty({ example: 120000 })
  stars!: number;

  @ApiProperty({ example: 25000 })
  forks!: number;

  @ApiProperty({ example: '2026-03-09' })
  discoveredWeek!: string;

  @ApiProperty({ example: '## Summary\n\nNext.js is...' })
  reportMarkdown!: string;

  @ApiProperty({ type: [String], example: ['react', 'nextjs'] })
  topics!: string[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ReportListResponseDto {
  @ApiProperty({ type: [ReportResponseDto] })
  data!: ReportResponseDto[];

  @ApiProperty({ example: 3 })
  total!: number;
}
