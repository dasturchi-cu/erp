import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { normalizeLimit, normalizePage } from '../utils/pagination.util';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  resolvedPage(): number {
    return normalizePage(this.page);
  }

  resolvedLimit(max = 1000): number {
    return normalizeLimit(this.limit, max);
  }
}
