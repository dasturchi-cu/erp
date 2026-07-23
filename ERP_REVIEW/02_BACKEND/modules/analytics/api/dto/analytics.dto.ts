import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportPeriod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ enum: ReportPeriod, default: ReportPeriod.monthly })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional({ default: 6, minimum: 1, maximum: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class AnalyticsMetricDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  change!: number;

  @ApiProperty()
  period!: string;
}

export class AnalyticsChartPointDto {
  @ApiProperty()
  month!: string;

  @ApiProperty()
  revenue!: number;

  @ApiProperty()
  profit!: number;

  @ApiProperty()
  orders!: number;
}

export class AnalyticsOverviewResponseDto {
  @ApiProperty({ type: [AnalyticsMetricDto] })
  metrics!: AnalyticsMetricDto[];

  @ApiProperty({ type: [AnalyticsChartPointDto] })
  chart!: AnalyticsChartPointDto[];

  @ApiProperty()
  highlights!: {
    peakMonth: { label: string; revenue: number };
    avgCheckChange: { percent: number; period: string };
  };
}
