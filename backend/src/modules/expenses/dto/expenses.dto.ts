import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
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
  // Decimal(18,4) column: larger values overflow in Postgres.
  @Max(99_999_999_999_999)
  amount!: number;

  // An unparseable date used to reach new Date() → Invalid Date → 500.
  @IsDateString()
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

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
