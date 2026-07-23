import { Decimal } from '@prisma/client/runtime/library';
import {
  InventoryBatchSourceType,
  InventoryMovementType,
  Prisma,
} from '@prisma/client';
import { AppException } from '../../../core/exceptions/app.exception';
import { formatMoney } from '../../../core/utils/money.util';

export interface FifoDeductionResult {
  batchId: string;
  quantity: Decimal;
  unitCostUzs: Decimal;
  unitCostUsd: Decimal;
}

export async function deductFifo(
  tx: Prisma.TransactionClient,
  params: {
    companyId: string;
    productId: string;
    warehouseId: string;
    quantity: Decimal;
  },
): Promise<FifoDeductionResult[]> {
  // Lock inventory batch rows for this product/warehouse to ensure concurrent requests are queued
  await tx.$executeRaw`
    SELECT id FROM inventory_batches
    WHERE company_id = ${params.companyId}::uuid
      AND product_id = ${params.productId}::uuid
      AND warehouse_id = ${params.warehouseId}::uuid
      AND remaining_qty > 0
    FOR UPDATE
  `;

  const batches = await tx.inventoryBatch.findMany({
    where: {
      companyId: params.companyId,
      productId: params.productId,
      warehouseId: params.warehouseId,
      remainingQty: { gt: 0 },
    },
    orderBy: [{ receivedAt: 'asc' }, { createdAt: 'asc' }],
  });

  let remaining = params.quantity;
  const allocations: FifoDeductionResult[] = [];

  for (const batch of batches) {
    if (remaining.lte(0)) {
      break;
    }

    const available = batch.remainingQty;
    const take = Decimal.min(available, remaining);

    const updated = await tx.inventoryBatch.updateMany({
      where: {
        id: batch.id,
        companyId: params.companyId,
        remainingQty: { gte: take },
      },
      data: {
        remainingQty: { decrement: take },
      },
    });

    if (updated.count === 0) {
      const totalAvailable = params.quantity.sub(remaining);
      throw AppException.insufficientStock(
        params.productId,
        formatMoney(totalAvailable),
        formatMoney(params.quantity),
      );
    }

    allocations.push({
      batchId: batch.id,
      quantity: take,
      unitCostUzs: batch.unitCostUzs,
      unitCostUsd: batch.unitCostUsd,
    });

    remaining = remaining.sub(take);
  }

  if (remaining.gt(0)) {
    const totalAvailable = params.quantity.sub(remaining);
    throw AppException.insufficientStock(
      params.productId,
      formatMoney(totalAvailable),
      formatMoney(params.quantity),
    );
  }

  return allocations;
}

export async function getProductStockTotal(
  tx: Prisma.TransactionClient | PrismaServiceLike,
  companyId: string,
  productId: string,
): Promise<Decimal> {
  const result = await tx.inventoryBatch.aggregate({
    where: { companyId, productId, remainingQty: { gt: 0 } },
    _sum: { remainingQty: true },
  });
  return result._sum.remainingQty ?? new Decimal(0);
}

export async function getProductStockInWarehouse(
  tx: Prisma.TransactionClient | PrismaServiceLike,
  companyId: string,
  productId: string,
  warehouseId: string,
): Promise<Decimal> {
  const result = await tx.inventoryBatch.aggregate({
    where: { companyId, productId, warehouseId, remainingQty: { gt: 0 } },
    _sum: { remainingQty: true },
  });
  return result._sum.remainingQty ?? new Decimal(0);
}

type PrismaServiceLike = {
  inventoryBatch: Prisma.TransactionClient['inventoryBatch'];
};

export async function createMovement(
  tx: Prisma.TransactionClient,
  params: {
    companyId: string;
    productId: string;
    warehouseId: string;
    batchId?: string | null;
    type: InventoryMovementType;
    quantity: Decimal;
    referenceType?: string | null;
    referenceId?: string | null;
    note?: string | null;
    performedBy: string;
  },
) {
  return tx.inventoryMovement.create({
    data: {
      companyId: params.companyId,
      productId: params.productId,
      warehouseId: params.warehouseId,
      batchId: params.batchId ?? null,
      type: params.type,
      quantity: params.quantity,
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      note: params.note ?? null,
      performedBy: params.performedBy,
    },
  });
}

export async function createReceiptBatch(
  tx: Prisma.TransactionClient,
  params: {
    companyId: string;
    productId: string;
    warehouseId: string;
    quantity: Decimal;
    unitCostUzs: Decimal;
    unitCostUsd: Decimal;
    sourceType?: InventoryBatchSourceType;
    sourceId?: string | null;
    receivedAt?: Date;
    batchNumber?: string;
    expiresAt?: Date;
  },
) {
  const now = params.receivedAt ?? new Date();
  return tx.inventoryBatch.create({
    data: {
      companyId: params.companyId,
      productId: params.productId,
      warehouseId: params.warehouseId,
      quantity: params.quantity,
      remainingQty: params.quantity,
      unitCostUzs: params.unitCostUzs,
      unitCostUsd: params.unitCostUsd,
      receivedAt: now,
      sourceType: params.sourceType ?? InventoryBatchSourceType.RECEIPT,
      sourceId: params.sourceId ?? null,
      batchNumber: params.batchNumber ?? null,
      expiryDate: params.expiresAt ?? null,
    },
  });
}

export interface FifoAllocationRestoreInput {
  batchId: string;
  productId: string;
  warehouseId: string;
  quantity: Decimal;
  unitCostUzs: Decimal;
  unitCostUsd: Decimal;
}

export async function restoreFifoAllocations(
  tx: Prisma.TransactionClient,
  params: {
    companyId: string;
    saleId: string;
    warehouseId: string;
    allocations: FifoAllocationRestoreInput[];
    performedBy: string;
    note?: string | null;
  },
): Promise<void> {
  for (const alloc of params.allocations) {
    const batch = await tx.inventoryBatch.findFirst({
      where: { id: alloc.batchId, companyId: params.companyId },
    });

    if (batch) {
      const restored = Decimal.min(batch.quantity, batch.remainingQty.add(alloc.quantity));
      await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: { remainingQty: restored },
      });

      await createMovement(tx, {
        companyId: params.companyId,
        productId: alloc.productId,
        warehouseId: alloc.warehouseId,
        batchId: batch.id,
        type: InventoryMovementType.VOID_RESTORE,
        quantity: alloc.quantity,
        referenceType: 'sale_void',
        referenceId: params.saleId,
        note: params.note ?? null,
        performedBy: params.performedBy,
      });
      continue;
    }

    const fallbackBatch = await createReceiptBatch(tx, {
      companyId: params.companyId,
      productId: alloc.productId,
      warehouseId: params.warehouseId,
      quantity: alloc.quantity,
      unitCostUzs: alloc.unitCostUzs,
      unitCostUsd: alloc.unitCostUsd,
      sourceType: InventoryBatchSourceType.VOID_RESTORE,
      sourceId: params.saleId,
    });

    await createMovement(tx, {
      companyId: params.companyId,
      productId: alloc.productId,
      warehouseId: params.warehouseId,
      batchId: fallbackBatch.id,
      type: InventoryMovementType.VOID_RESTORE,
      quantity: alloc.quantity,
      referenceType: 'sale_void',
      referenceId: params.saleId,
      note: params.note ?? null,
      performedBy: params.performedBy,
    });
  }
}
