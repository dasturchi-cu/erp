import {
  DebtPaymentMethod,
  DebtPaymentType,
  OriginalCurrency,
  SalePaymentType,
  SaleReturnStatus,
  SaleStatus,
} from '@prisma/client';
import {
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../../core/dto/pagination-query.dto';

const MONEY_PATTERN = /^\d+(\.\d{1,4})?$/;

export class SaleLineItemRequestDto {
  @IsUUID()
  productId!: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  quantity!: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  unitPriceUzs?: string;
}

export class CreateSaleRequestDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsEnum(OriginalCurrency)
  originalCurrency!: OriginalCurrency;

  @IsEnum(SalePaymentType)
  paymentType!: SalePaymentType;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  amountPaidUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  amountPaidUsd?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleLineItemRequestDto)
  lineItems!: SaleLineItemRequestDto[];
}

export class VoidSaleRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class SaleReturnLineItemRequestDto {
  @IsUUID()
  productId!: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  quantity!: string;
}

export class CreateSaleReturnRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleReturnLineItemRequestDto)
  lineItems!: SaleReturnLineItemRequestDto[];
}

export class ReturnDecisionRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class SaleListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsOptional()
  @IsEnum(SalePaymentType)
  paymentType?: SalePaymentType;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  cashierId?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}

export class SaleReturnListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SaleReturnStatus)
  status?: SaleReturnStatus;
}

export interface SaleLineItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: string;
  unitPriceUzs: string;
  unitPriceUsd: string;
  totalUzs: string;
  totalUsd: string;
  cogsUzs: string;
  cogsUsd: string;
}

export interface FifoAllocationResponseDto {
  id: string;
  saleItemId: string;
  batchId: string;
  productId: string;
  productName: string;
  quantity: string;
  unitCostUzs: string;
  unitCostUsd: string;
  costUzs: string;
  costUsd: string;
}

export interface SalePaymentResponseDto {
  method: SalePaymentType;
  amountUzs: string;
  amountUsd: string;
  receivedUzs: string;
  changeUzs: string;
}

export interface SaleResponseDto {
  id: string;
  number: string;
  customerId: string | null;
  customerName: string | null;
  cashierId: string;
  cashierName: string;
  originalCurrency: OriginalCurrency;
  exchangeRateUsed: string;
  totalUzs: string;
  totalUsd: string;
  paymentType: SalePaymentType;
  amountPaidUzs: string;
  amountPaidUsd: string;
  status: SaleStatus;
  createdAt: string;
  lineItems: SaleLineItemResponseDto[];
  fifoAllocations: FifoAllocationResponseDto[];
  payments: SalePaymentResponseDto[];
}

export interface SaleReturnLineItemResponseDto {
  productId: string;
  productName: string;
  quantity: string;
  amountUzs: string;
}

export interface SaleReturnResponseDto {
  id: string;
  saleId: string;
  saleNumber: string;
  customerId: string | null;
  customerName: string | null;
  amountUzs: string;
  amountUsd: string;
  exchangeRateUsed: string;
  reason: string;
  status: SaleReturnStatus;
  createdAt: string;
  lineItems: SaleReturnLineItemResponseDto[];
}
