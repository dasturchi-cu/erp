import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportExportFormat, ReportPeriod } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../core/dto/pagination-query.dto';

export class ReportCatalogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, category, description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by category name or code' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'name:asc' })
  @IsOptional()
  @IsString()
  sort?: string;
}

export class BaseReportQueryDto extends PaginationQueryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @ApiPropertyOptional({ enum: ['UZS', 'USD', 'BOTH'], default: 'BOTH' })
  @IsOptional()
  @IsIn(['UZS', 'USD', 'BOTH'])
  currency?: 'UZS' | 'USD' | 'BOTH';

  @ApiPropertyOptional({ description: 'Report template within category' })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({ example: 'name:desc' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Search filter' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}

export class GenerateReportRequestDto {
  @ApiProperty({ example: 'daily_summary' })
  @IsString()
  template!: string;

  @ApiProperty({ example: 'sales', enum: ['sales', 'products', 'inventory', 'customers', 'suppliers', 'debt', 'expenses', 'profit'] })
  @IsString()
  category!: string;

  @ApiProperty({ enum: ReportExportFormat })
  @IsEnum(ReportExportFormat)
  format!: ReportExportFormat;

  @ApiPropertyOptional({ enum: ReportPeriod })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @ApiPropertyOptional({ enum: ['UZS', 'USD', 'BOTH'] })
  @IsOptional()
  @IsIn(['UZS', 'USD', 'BOTH'])
  currency?: 'UZS' | 'USD' | 'BOTH';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;
}

export class ReportHistoryQueryDto extends PaginationQueryDto {}

export class ReportCatalogItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  lastGenerated?: string;
}

export class ReportKpiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;

  @ApiPropertyOptional()
  change?: number;

  @ApiPropertyOptional()
  period?: string;
}

export class ReportDataResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  data!: Record<string, unknown>[];

  @ApiProperty()
  meta!: { page: number; limit: number; total: number; totalPages: number };

  @ApiProperty()
  summary!: Record<string, unknown>;

  @ApiProperty()
  totals!: Record<string, unknown>;

  @ApiProperty({ type: [ReportKpiDto] })
  kpi!: ReportKpiDto[];
}

export class ReportJobResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  progress!: number;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  rowCount?: number;

  @ApiPropertyOptional()
  errorMessage?: string;
}

export class GenerateReportResponseDto {
  @ApiProperty()
  jobId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  async!: boolean;

  @ApiPropertyOptional()
  rowCount?: number;

  @ApiPropertyOptional()
  downloadUrl?: string;
}
