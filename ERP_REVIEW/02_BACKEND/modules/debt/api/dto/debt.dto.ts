import {
  DebtPaymentMethod,
  DebtPaymentType,
  OriginalCurrency,
} from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../core/dto/pagination-query.dto';

const MONEY_PATTERN = /^\d+(\.\d{1,4})?$/;

export class CreateDebtPaymentRequestDto {
  @IsUUID()
  customerId!: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  amount!: string;

  @IsEnum(OriginalCurrency)
  currency!: OriginalCurrency;

  @IsEnum(DebtPaymentMethod)
  paymentMethod!: DebtPaymentMethod;

  @IsEnum(DebtPaymentType)
  paymentType!: DebtPaymentType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ReverseDebtPaymentRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  reason?: string;
}

export class DebtPaymentListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsEnum(OriginalCurrency)
  currency?: OriginalCurrency;

  @IsOptional()
  @IsEnum(DebtPaymentMethod)
  paymentMethod?: DebtPaymentMethod;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}

export interface DebtPaymentResponseDto {
  id: string;
  customerId: string;
  customerName: string;
  amount: string;
  currency: OriginalCurrency;
  amountUzs: string;
  amountUsd: string;
  exchangeRateUsed: string;
  paymentType: DebtPaymentType;
  paymentMethod: DebtPaymentMethod;
  createdAt: string;
  recordedBy: string;
  notes: string | null;
}

export interface DebtSummaryResponseDto {
  totalDebtUzs: string;
  totalDebtUsd: string;
  customerCount: number;
  overdueCustomerCount: number;
}

export type { DebtAgingResponseDto, DebtAgingBucketDto } from './debt-aging.dto';

export interface CustomerDebtListItemDto {
  id: string;
  name: string;
  phone: string;
  debtUzs: string;
  debtUsd: string;
  lastPurchaseAt: string | null;
  lastPaymentAt: string | null;
}
