import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentRunResponseDto {
  @ApiProperty({ example: 3 })
  reportsGenerated!: number;

  @ApiPropertyOptional({ example: null, nullable: true })
  error!: string | null;

  @ApiProperty({
    type: [Object],
    description: 'Summaries of generated reports',
  })
  reports!: Array<{ url: string; name: string }>;
}
