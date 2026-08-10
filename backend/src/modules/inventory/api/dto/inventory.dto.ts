import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../core/dto/pagination-query.dto';
import { InventoryMovementType, SupplierReceivePaymentType, OriginalCurrency } from '@prisma/client';

const MONEY_PATTERN = /^-?\d+(\.\d{1,4})?$/;
const POSITIVE_MONEY_PATTERN = /^\d+(\.\d{1,4})?$/;

export class InventoryListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsEnum(InventoryMovementType)
  type?: InventoryMovementType;

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

export class ReceiveStockRequestDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsString()
  @Matches(POSITIVE_MONEY_PATTERN)
  quantity!: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  unitCostUzs!: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  unitCostUsd?: string;

  @IsOptional()
  @IsEnum(OriginalCurrency)
  originalCurrency?: OriginalCurrency;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  exchangeRateUsed?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  batchNumber?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsUUID()
  supplierId!: string;

  @IsEnum(SupplierReceivePaymentType)
  paymentType!: SupplierReceivePaymentType;
}

export class AdjustStockRequestDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  quantityDelta!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  reasonCode?: string;
}

export class TransferStockRequestDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  fromWarehouseId!: string;

  @IsUUID()
  toWarehouseId!: string;

  @IsString()
  @Matches(POSITIVE_MONEY_PATTERN)
  quantity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class CreateWarehouseRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateWarehouseRequestDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class InventoryBatchResponseDto {
  id!: string;
  productId!: string;
  productName!: string;
  sku!: string;
  quantity!: string;
  remainingQty!: string;
  unitCostUzs!: string;
  unitCostUsd!: string;
  warehouseId!: string;
  warehouseName!: string;
  receivedAt!: string;
}

export class StockMovementResponseDto {
  id!: string;
  type!: string;
  productId!: string;
  productName!: string;
  sku!: string;
  quantity!: string;
  warehouseId!: string;
  warehouseName!: string;
  referenceType!: string | null;
  referenceId!: string | null;
  note!: string | null;
  createdAt!: string;
  performedBy!: string;
}

export class StockLevelResponseDto {
  productId!: string;
  sku!: string;
  productName!: string;
  warehouseId!: string;
  stock!: string;
  batchCount!: number;
}

export class WarehouseResponseDto {
  id!: string;
  name!: string;
  branchId!: string;
  branchName!: string;
  address!: string | null;
  isDefault!: boolean;
  status!: string;
  productCount!: number;
  totalValueUzs!: string;
}

export class ReceiveStockResponseDto {
  batch!: InventoryBatchResponseDto;
  movement!: StockMovementResponseDto;
  productStock!: string;
}

export class AdjustStockResponseDto {
  movement!: StockMovementResponseDto;
  productStock!: string;
}

export class TransferStockResponseDto {
  movements!: StockMovementResponseDto[];
}

export class WarehouseDetailResponseDto extends WarehouseResponseDto {
  batches!: InventoryBatchResponseDto[];
  movements!: StockMovementResponseDto[];
}

export class TransferHistoryItemDto {
  id!: string;
  productId!: string;
  productName!: string;
  sku!: string;
  fromWarehouseId!: string;
  fromWarehouseName!: string;
  toWarehouseId!: string;
  toWarehouseName!: string;
  quantity!: string;
  performedBy!: string;
  note!: string | null;
  createdAt!: string;
}

export class WarehouseDashboardDto {
  productCount!: number;
  totalValueUzs!: string;
  totalStockQty!: string;
  batchCount!: number;
  lowStockCount!: number;
  movementsLast7Days!: number;
  transfersLast30Days!: number;
  receiptsLast30Days!: number;
  topProducts!: Array<{
    productId: string;
    productName: string;
    sku: string;
    stock: string;
    valueUzs: string;
  }>;
}

export class WarehouseReportDto {
  stockSummary!: {
    productCount: number;
    batchCount: number;
    totalValueUzs: string;
    totalStockQty: string;
  };
  movementsByType!: Record<string, number>;
  transfersCount!: number;
  lowStockProducts!: Array<{
    productId: string;
    productName: string;
    sku: string;
    stock: string;
    minStockLevel: string;
  }>;
}

export class BranchResponseDto {
  id!: string;
  name!: string;
  address!: string | null;
  isDefault!: boolean;
  status!: string;
}
