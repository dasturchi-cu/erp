import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ExpenseCategory, OriginalCurrency } from '@prisma/client';

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsString()
  description!: string;

  @IsEnum(OriginalCurrency)
  originalCurrency!: OriginalCurrency;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  expenseDate!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class ExpenseQueryDto {
  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
