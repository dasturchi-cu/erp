import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportExportFormat } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../core/dto/pagination-query.dto';

export class DebtAgingQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['customer', 'supplier', 'all'], default: 'all' })
  @IsOptional()
  @IsString()
  entityType?: 'customer' | 'supplier' | 'all';

  @ApiPropertyOptional({ enum: ['0-30', '31-60', '61-90', '91-120', '120+'] })
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  asOf?: string;
}

export class DebtAgingExportDto extends DebtAgingQueryDto {
  @ApiProperty({ enum: ReportExportFormat })
  @IsEnum(ReportExportFormat)
  format!: ReportExportFormat;
}

export interface AgingBucketDto {
  label: string;
  debtUzs: string;
  debtUsd?: string;
  entityCount: number;
}

export interface AgingEntityRowDto {
  id: string;
  entityType: 'customer' | 'supplier';
  name: string;
  phone: string;
  debtUzs: string;
  debtUsd: string;
  ageDays: number;
  bucket: string;
  oldestCreditDate: string | null;
}

export interface DebtAgingSummaryDto {
  asOf: string;
  customers: {
    totalDebtUzs: string;
    totalDebtUsd: string;
    entityCount: number;
    buckets: AgingBucketDto[];
  };
  suppliers: {
    totalDebtUzs: string;
    entityCount: number;
    buckets: AgingBucketDto[];
  };
}

export interface DebtAgingReportDto {
  asOf: string;
  summary: DebtAgingSummaryDto;
  buckets: AgingBucketDto[];
  data: AgingEntityRowDto[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** Legacy dashboard bucket shape for GET /debt/aging */
export interface DebtAgingBucketDto {
  label: string;
  debtUzs: string;
  debtUsd: string;
  customerCount: number;
}

export interface DebtAgingResponseDto {
  asOf: string;
  buckets: DebtAgingBucketDto[];
  suppliers?: AgingBucketDto[];
}
