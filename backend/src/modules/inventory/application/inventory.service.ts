import { Injectable } from '@nestjs/common';
import {
  CompanyStatus,
  InventoryBatchSourceType,
  InventoryMovementType,
  Prisma,
  SupplierReceivePaymentType,
  OriginalCurrency,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { AppException } from '../../../core/exceptions/app.exception';
import {
  formatMoney,
  isNonNegativeMoney,
  isPositiveMoney,
  parseMoney,
  uzsToUsd,
} from '../../../core/utils/money.util';
import {
  buildPaginationMeta,
  paginationSkip,
  parseSort,
} from '../../../core/utils/pagination.util';
import { CurrencyService } from '../../currency/application/currency.service';
import { SupplierDebtService } from '../../suppliers/application/supplier-debt.service';
import {
  AdjustStockRequestDto,
  AdjustStockResponseDto,
  CreateWarehouseRequestDto,
  InventoryBatchResponseDto,
  InventoryListQueryDto,
  ReceiveStockRequestDto,
  ReceiveStockResponseDto,
  StockLevelResponseDto,
  StockMovementResponseDto,
  TransferStockRequestDto,
  TransferStockResponseDto,
  WarehouseDetailResponseDto,
  WarehouseResponseDto,
  UpdateWarehouseRequestDto,
  WarehouseDashboardDto,
  WarehouseReportDto,
  BranchResponseDto,
  TransferHistoryItemDto,
} from '../api/dto/inventory.dto';
import {
  createMovement,
  createReceiptBatch,
  deductFifo,
  getProductStockInWarehouse,
  getProductStockTotal,
} from './inventory.helpers';

type BatchWithRelations = Prisma.InventoryBatchGetPayload<{
  include: { product: true; warehouse: true };
}>;

type MovementWithRelations = Prisma.InventoryMovementGetPayload<{
  include: { product: true; warehouse: true; performer: true };
}>;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly currencyService: CurrencyService,
    private readonly supplierDebt: SupplierDebtService,
  ) {}

  async listStock(companyId: string, query: InventoryListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();

    const conditions: string[] = ['b.company_id = $1::uuid', 'b.remaining_qty > 0'];
    const params: unknown[] = [companyId];
    let paramIndex = 2;

    if (query.productId) {
      conditions.push(`b.product_id = $${paramIndex}::uuid`);
      params.push(query.productId);
      paramIndex++;
    }
    if (query.warehouseId) {
      conditions.push(`b.warehouse_id = $${paramIndex}::uuid`);
      params.push(query.warehouseId);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countRows = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*)::bigint AS count FROM (
        SELECT b.product_id, b.warehouse_id
        FROM inventory_batches b
        WHERE ${whereClause}
        GROUP BY b.product_id, b.warehouse_id
      ) sub`,
      ...params,
    );
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        product_id: string;
        sku: string;
        product_name: string;
        warehouse_id: string;
        stock_qty: Prisma.Decimal;
        batch_count: bigint;
      }>
    >(
      `SELECT
        b.product_id,
        p.sku,
        p.name AS product_name,
        b.warehouse_id,
        SUM(b.remaining_qty) AS stock_qty,
        COUNT(*)::bigint AS batch_count
      FROM inventory_batches b
      JOIN products p ON p.id = b.product_id
      WHERE ${whereClause}
      GROUP BY b.product_id, p.sku, p.name, b.warehouse_id
      ORDER BY p.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ...params,
      limit,
      paginationSkip(page, limit),
    );

    const data: StockLevelResponseDto[] = rows.map((row) => ({
      productId: row.product_id,
      sku: row.sku,
      productName: row.product_name,
      warehouseId: row.warehouse_id,
      stock: formatMoney(row.stock_qty),
      batchCount: Number(row.batch_count),
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  async listBatches(companyId: string, query: InventoryListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.InventoryBatchWhereInput = { companyId };

    if (query.productId) where.productId = query.productId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;

    const sort = parseSort(query.sort, ['receivedAt'], [
      { field: 'receivedAt', direction: 'desc' },
    ]);
    const orderBy = sort.map((s) => ({
      receivedAt: s.field === 'receivedAt' ? s.direction : undefined,
    })) as Prisma.InventoryBatchOrderByWithRelationInput[];

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.inventoryBatch.count({ where }),
      this.prisma.inventoryBatch.findMany({
        where,
        include: { product: true, warehouse: true },
        orderBy: orderBy.length ? orderBy : [{ receivedAt: 'desc' }],
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.toBatchResponse(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getBatch(companyId: string, id: string): Promise<InventoryBatchResponseDto> {
    const batch = await this.prisma.inventoryBatch.findFirst({
      where: { id, companyId },
      include: { product: true, warehouse: true },
    });
    if (!batch) {
      throw AppException.notFound('InventoryBatch', id);
    }
    return this.toBatchResponse(batch);
  }

  async listMovements(companyId: string, query: InventoryListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.InventoryMovementWhereInput = { companyId };

    if (query.productId) where.productId = query.productId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const sort = parseSort(query.sort, ['createdAt'], [
      { field: 'createdAt', direction: 'desc' },
    ]);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        include: { product: true, warehouse: true, performer: true },
        orderBy: [{ createdAt: sort[0]?.direction ?? 'desc' }],
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.toMovementResponse(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async receive(
    companyId: string,
    userId: string,
    dto: ReceiveStockRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<ReceiveStockResponseDto> {
    const quantity = parseMoney(dto.quantity);
    const costInput = parseMoney(dto.unitCostUzs);

    if (!isPositiveMoney(quantity) || !isNonNegativeMoney(costInput)) {
      throw AppException.validation('Validation failed', [
        { field: 'quantity', message: 'Quantity must be greater than 0', code: 'INVALID_QUANTITY' },
      ]);
    }

    await this.ensureProduct(companyId, dto.productId);
    await this.ensureWarehouse(companyId, dto.warehouseId);
    await this.supplierDebt.ensureSupplier(companyId, dto.supplierId);

    const activeRate = await this.currencyService.getActiveRateOrThrow(companyId);
    const exchangeRate = dto.exchangeRateUsed ? parseMoney(dto.exchangeRateUsed) : activeRate.rate;
    const originalCurrency = dto.originalCurrency ?? OriginalCurrency.UZS;

    const unitCostUzs = originalCurrency === OriginalCurrency.UZS ? costInput : costInput.mul(exchangeRate);
    const unitCostUsd = originalCurrency === OriginalCurrency.USD ? costInput : costInput.div(exchangeRate);

    const receiptInput = {
      companyId,
      supplierId: dto.supplierId,
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      quantity,
      unitCostUzs,
      unitCostUsd,
      originalCurrency,
      exchangeRateUsed: exchangeRate,
      note: dto.note ?? null,
      receivedBy: userId,
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const batch = await createReceiptBatch(tx, {
        companyId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        quantity,
        unitCostUzs,
        unitCostUsd,
        sourceType: InventoryBatchSourceType.RECEIPT,
        batchNumber: dto.batchNumber,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      });

      const movement = await createMovement(tx, {
        companyId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        batchId: batch.id,
        type: InventoryMovementType.RECEIPT,
        quantity,
        referenceType: 'receive',
        referenceId: batch.id,
        note: dto.note ?? null,
        performedBy: userId,
      });

      if (dto.paymentType === SupplierReceivePaymentType.CREDIT) {
        await this.supplierDebt.recordReceiptCredit(tx, {
          ...receiptInput,
          inventoryBatchId: batch.id,
        });
      } else {
        await this.supplierDebt.recordCashReceipt(tx, {
          ...receiptInput,
          inventoryBatchId: batch.id,
        });
      }

      const rate = await this.currencyService.getActiveRateOrThrow(companyId);
      await tx.supplierPriceHistory.create({
        data: {
          supplierId: dto.supplierId,
          productId: dto.productId,
          batchId: batch.id,
          currency: OriginalCurrency.UZS,
          exchangeRate: rate.rate,
          quantity,
          unitCost: unitCostUzs,
          userId,
        },
      });

      const productStock = await getProductStockTotal(tx, companyId, dto.productId);

      return { batch, movement, productStock };
    });

    const batchWithRelations = await this.prisma.inventoryBatch.findFirstOrThrow({
      where: { id: result.batch.id },
      include: { product: true, warehouse: true },
    });
    const movementWithRelations = await this.prisma.inventoryMovement.findFirstOrThrow({
      where: { id: result.movement.id },
      include: { product: true, warehouse: true, performer: true },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'inventory_receive',
      entityId: result.batch.id,
      newValue: {
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        supplierId: dto.supplierId,
        paymentType: dto.paymentType,
        quantity: formatMoney(quantity),
      },
      ipAddress: ip,
      requestId,
    });

    return {
      batch: this.toBatchResponse(batchWithRelations),
      movement: this.toMovementResponse(movementWithRelations),
      productStock: formatMoney(result.productStock),
    };
  }

  async receiveInternal(
    tx: Prisma.TransactionClient,
    companyId: string,
    userId: string,
    params: {
      productId: string;
      warehouseId: string;
      quantity: Decimal;
      unitCostUzs: Decimal;
      unitCostUsd: Decimal;
      note?: string;
      referenceType?: string;
    },
  ) {
    const batch = await createReceiptBatch(tx, {
      companyId,
      productId: params.productId,
      warehouseId: params.warehouseId,
      quantity: params.quantity,
      unitCostUzs: params.unitCostUzs,
      unitCostUsd: params.unitCostUsd,
      sourceType: InventoryBatchSourceType.RECEIPT,
    });

    await createMovement(tx, {
      companyId,
      productId: params.productId,
      warehouseId: params.warehouseId,
      batchId: batch.id,
      type: InventoryMovementType.RECEIPT,
      quantity: params.quantity,
      referenceType: params.referenceType ?? 'receive',
      referenceId: batch.id,
      note: params.note ?? null,
      performedBy: userId,
    });

    return batch;
  }

  async adjust(
    companyId: string,
    userId: string,
    dto: AdjustStockRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<AdjustStockResponseDto> {
    const delta = parseMoney(dto.quantityDelta);
    if (delta.isZero()) {
      throw AppException.validation('Validation failed', [
        {
          field: 'quantityDelta',
          message: 'quantityDelta must not be zero',
          code: 'INVALID_DELTA',
        },
      ]);
    }

    await this.ensureProduct(companyId, dto.productId);
    await this.ensureWarehouse(companyId, dto.warehouseId);

    const result = await this.prisma.$transaction(async (tx) => {
      let movement;

      if (delta.lt(0)) {
        const quantityToDeduct = delta.abs();
        const allocations = await deductFifo(tx, {
          companyId,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: quantityToDeduct,
        });

        const first = allocations[0];
        movement = await createMovement(tx, {
          companyId,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          batchId: first?.batchId ?? null,
          type: InventoryMovementType.ADJUSTMENT,
          quantity: delta,
          referenceType: 'adjust',
          note: dto.reason,
          performedBy: userId,
        });
      } else {
        const product = await tx.product.findFirstOrThrow({
          where: { id: dto.productId, companyId },
          include: { prices: true },
        });
        const unitCostUzs = product.prices?.purchasePriceUzs ?? new Decimal(0);
        const unitCostUsd = product.prices?.purchasePriceUsd ?? new Decimal(0);

        const batch = await createReceiptBatch(tx, {
          companyId,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: delta,
          unitCostUzs,
          unitCostUsd,
          sourceType: InventoryBatchSourceType.ADJUSTMENT,
        });

        movement = await createMovement(tx, {
          companyId,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          batchId: batch.id,
          type: InventoryMovementType.ADJUSTMENT,
          quantity: delta,
          referenceType: 'adjust',
          referenceId: batch.id,
          note: dto.reason,
          performedBy: userId,
        });
      }

      const productStock = await getProductStockTotal(tx, companyId, dto.productId);
      return { movement, productStock };
    });

    const movementWithRelations = await this.prisma.inventoryMovement.findFirstOrThrow({
      where: { id: result.movement.id },
      include: { product: true, warehouse: true, performer: true },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'inventory_adjust',
      entityId: result.movement.id,
      newValue: {
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        quantityDelta: formatMoney(delta),
        reasonCode: dto.reasonCode ?? null,
      },
      ipAddress: ip,
      requestId,
    });

    return {
      movement: this.toMovementResponse(movementWithRelations),
      productStock: formatMoney(result.productStock),
    };
  }

  async transfer(
    companyId: string,
    userId: string,
    dto: TransferStockRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<TransferStockResponseDto> {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw AppException.businessRule('Source and destination warehouses must differ');
    }

    const quantity = parseMoney(dto.quantity);
    if (!isPositiveMoney(quantity)) {
      throw AppException.validation('Validation failed', [
        { field: 'quantity', message: 'Quantity must be greater than 0', code: 'INVALID_QUANTITY' },
      ]);
    }

    await this.ensureProduct(companyId, dto.productId);
    const fromWarehouse = await this.ensureWarehouse(companyId, dto.fromWarehouseId);
    const toWarehouse = await this.ensureWarehouse(companyId, dto.toWarehouseId);

    if (fromWarehouse.branchId !== toWarehouse.branchId) {
      throw AppException.businessRule('Transfers must be within the same branch');
    }

    const movementIds = await this.prisma.$transaction(async (tx) => {
      const allocations = await deductFifo(tx, {
        companyId,
        productId: dto.productId,
        warehouseId: dto.fromWarehouseId,
        quantity,
      });

      const ids: string[] = [];
      let transferGroupId: string | null = null;

      for (const allocation of allocations) {
        const outMovement = await createMovement(tx, {
          companyId,
          productId: dto.productId,
          warehouseId: dto.fromWarehouseId,
          batchId: allocation.batchId,
          type: InventoryMovementType.TRANSFER,
          quantity: allocation.quantity.neg(),
          referenceType: 'transfer',
          referenceId: transferGroupId,
          note: dto.note ?? null,
          performedBy: userId,
        });
        if (!transferGroupId) {
          transferGroupId = outMovement.id;
        }
        ids.push(outMovement.id);

        const inBatch = await createReceiptBatch(tx, {
          companyId,
          productId: dto.productId,
          warehouseId: dto.toWarehouseId,
          quantity: allocation.quantity,
          unitCostUzs: allocation.unitCostUzs,
          unitCostUsd: allocation.unitCostUsd,
          sourceType: InventoryBatchSourceType.TRANSFER_IN,
          sourceId: allocation.batchId,
          receivedAt: new Date(),
        });

        const inMovement = await createMovement(tx, {
          companyId,
          productId: dto.productId,
          warehouseId: dto.toWarehouseId,
          batchId: inBatch.id,
          type: InventoryMovementType.TRANSFER,
          quantity: allocation.quantity,
          referenceType: 'transfer',
          referenceId: transferGroupId,
          note: dto.note ?? null,
          performedBy: userId,
        });
        ids.push(inMovement.id);
      }

      if (transferGroupId) {
        await tx.inventoryMovement.updateMany({
          where: { id: { in: ids } },
          data: { referenceId: transferGroupId },
        });
      }

      return ids;
    });

    const movements = await this.prisma.inventoryMovement.findMany({
      where: { id: { in: movementIds } },
      include: { product: true, warehouse: true, performer: true },
      orderBy: { createdAt: 'asc' },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'inventory_transfer',
      entityId: movementIds[0] ?? null,
      newValue: {
        productId: dto.productId,
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        quantity: formatMoney(quantity),
      },
      ipAddress: ip,
      requestId,
    });

    return {
      movements: movements.map((m) => this.toMovementResponse(m)),
    };
  }

  async listTransfers(companyId: string, query: InventoryListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();

    const createdAt: Prisma.DateTimeFilter | undefined =
      query.from || query.to
        ? {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to
              ? {
                  lte: (() => {
                    const d = new Date(query.to!);
                    d.setHours(23, 59, 59, 999);
                    return d;
                  })(),
                }
              : {}),
          }
        : undefined;

    const outMovements = await this.prisma.inventoryMovement.findMany({
      where: {
        companyId,
        type: InventoryMovementType.TRANSFER,
        quantity: { lt: 0 },
        ...(createdAt ? { createdAt } : {}),
      },
      include: { product: true, warehouse: true, performer: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const groupMap = new Map<string, typeof outMovements>();
    for (const m of outMovements) {
      const groupId = m.referenceId ?? m.id;
      const list = groupMap.get(groupId) ?? [];
      list.push(m);
      groupMap.set(groupId, list);
    }

    const groupIds = [...groupMap.keys()].sort((a, b) => {
      const aDate = groupMap.get(a)![0]!.createdAt.getTime();
      const bDate = groupMap.get(b)![0]!.createdAt.getTime();
      return bDate - aDate;
    });

    const total = groupIds.length;
    const pageIds = groupIds.slice(paginationSkip(page, limit), paginationSkip(page, limit) + limit);

    const data: TransferHistoryItemDto[] = [];
    for (const groupId of pageIds) {
      const outs = groupMap.get(groupId)!;
      const first = outs[0]!;
      const totalQty = outs.reduce((sum, m) => sum.add(m.quantity.abs()), new Decimal(0));

      const inMovement = await this.prisma.inventoryMovement.findFirst({
        where: {
          companyId,
          type: InventoryMovementType.TRANSFER,
          referenceId: groupId,
          quantity: { gt: 0 },
        },
        include: { warehouse: true },
        orderBy: { createdAt: 'asc' },
      });

      if (query.warehouseId && inMovement?.warehouseId !== query.warehouseId && first.warehouseId !== query.warehouseId) {
        continue;
      }

      data.push({
        id: groupId,
        productId: first.productId,
        productName: first.product.name,
        sku: first.product.sku,
        fromWarehouseId: first.warehouseId,
        fromWarehouseName: first.warehouse.name,
        toWarehouseId: inMovement?.warehouseId ?? '',
        toWarehouseName: inMovement?.warehouse.name ?? '—',
        quantity: formatMoney(totalQty),
        performedBy: `${first.performer.firstName} ${first.performer.lastName}`.trim(),
        note: first.note,
        createdAt: first.createdAt.toISOString(),
      });
    }

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  async listBranches(companyId: string): Promise<{ data: BranchResponseDto[] }> {
    const branches = await this.prisma.branch.findMany({
      where: { companyId, status: CompanyStatus.ACTIVE },
      orderBy: { name: 'asc' },
    });
    return {
      data: branches.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        isDefault: b.isDefault,
        status: b.status,
      })),
    };
  }

  async listWarehouses(companyId: string): Promise<{ data: WarehouseResponseDto[] }> {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { companyId, status: CompanyStatus.ACTIVE },
      include: { branch: true },
      orderBy: { name: 'asc' },
    });

    const data = await Promise.all(
      warehouses.map(async (wh) => this.toWarehouseResponse(companyId, wh)),
    );

    return { data };
  }

  async getWarehouse(companyId: string, id: string): Promise<WarehouseDetailResponseDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, companyId },
      include: { branch: true },
    });
    if (!warehouse) {
      throw AppException.notFound('Warehouse', id);
    }

    const base = await this.toWarehouseResponse(companyId, warehouse);

    const batches = await this.prisma.inventoryBatch.findMany({
      where: { companyId, warehouseId: id, remainingQty: { gt: 0 } },
      include: { product: true, warehouse: true },
      orderBy: { receivedAt: 'desc' },
      take: 100,
    });

    const movements = await this.prisma.inventoryMovement.findMany({
      where: { companyId, warehouseId: id },
      include: { product: true, warehouse: true, performer: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      ...base,
      batches: batches.map((b) => this.toBatchResponse(b)),
      movements: movements.map((m) => this.toMovementResponse(m)),
    };
  }

  async createWarehouse(
    companyId: string,
    userId: string,
    dto: CreateWarehouseRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<WarehouseResponseDto> {
    let branch = dto.branchId
      ? await this.prisma.branch.findFirst({ where: { id: dto.branchId, companyId } })
      : await this.prisma.branch.findFirst({ where: { companyId } });

    if (!branch) {
      branch = await this.prisma.branch.create({
        data: {
          companyId,
          name: 'Asosiy Filial',
          isDefault: true,
          status: CompanyStatus.ACTIVE,
        },
      });
    }

    try {
      const warehouseCount = await this.prisma.warehouse.count({ where: { companyId } });
      const isDefault = dto.isDefault ?? warehouseCount === 0;

      if (isDefault) {
        await this.prisma.warehouse.updateMany({
          where: { companyId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const created = await this.prisma.warehouse.create({
        data: {
          companyId,
          branchId: branch.id,
          name: dto.name.trim(),
          address: dto.address ?? null,
          isDefault,
          status: CompanyStatus.ACTIVE,
        },
        include: { branch: true },
      });

      await this.audit.log({
        companyId,
        userId,
        action: 'CREATE',
        entityType: 'warehouse',
        entityId: created.id,
        newValue: { name: created.name, branchId: created.branchId },
        ipAddress: ip,
        requestId,
      });

      return this.toWarehouseResponse(companyId, created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw AppException.conflict('DUPLICATE_WAREHOUSE', 'Warehouse name already exists');
      }
      throw error;
    }
  }

  async updateWarehouse(
    companyId: string,
    id: string,
    dto: UpdateWarehouseRequestDto,
    userId: string,
    ip?: string,
    requestId?: string,
  ): Promise<WarehouseResponseDto> {
    const existing = await this.prisma.warehouse.findFirst({ where: { id, companyId } });
    if (!existing) throw AppException.notFound('Warehouse', id);

    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, companyId },
      });
      if (!branch) throw AppException.notFound('Branch', dto.branchId);
    }

    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    try {
      const updated = await this.prisma.warehouse.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          address: dto.address,
          branchId: dto.branchId,
          isDefault: dto.isDefault,
        },
        include: { branch: true },
      });

      await this.audit.log({
        companyId,
        userId,
        action: 'UPDATE',
        entityType: 'warehouse',
        entityId: id,
        newValue: dto,
        ipAddress: ip,
        requestId,
      });

      return this.toWarehouseResponse(companyId, updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw AppException.conflict('DUPLICATE_WAREHOUSE', 'Warehouse name already exists');
      }
      throw error;
    }
  }

  async deactivateWarehouse(
    companyId: string,
    id: string,
    userId: string,
    ip?: string,
    requestId?: string,
  ): Promise<WarehouseResponseDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, companyId, status: CompanyStatus.ACTIVE },
      include: { branch: true },
    });
    if (!warehouse) throw AppException.notFound('Warehouse', id);

    const stockRows = await this.prisma.inventoryBatch.aggregate({
      where: { companyId, warehouseId: id, remainingQty: { gt: 0 } },
      _sum: { remainingQty: true },
    });
    const stock = stockRows._sum.remainingQty ?? new Decimal(0);
    if (stock.gt(0)) {
      throw AppException.businessRule('Cannot deactivate warehouse with remaining stock');
    }

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: { status: CompanyStatus.INACTIVE, isDefault: false },
      include: { branch: true },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'warehouse',
      entityId: id,
      newValue: { status: 'INACTIVE' },
      ipAddress: ip,
      requestId,
    });

    return this.toWarehouseResponse(companyId, updated);
  }

  async getWarehouseDashboard(companyId: string, id: string): Promise<WarehouseDashboardDto> {
    await this.ensureWarehouse(companyId, id);

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const batches = await this.prisma.inventoryBatch.findMany({
      where: { companyId, warehouseId: id, remainingQty: { gt: 0 } },
      include: { product: true },
    });

    let totalValueUzs = new Decimal(0);
    let totalStockQty = new Decimal(0);
    const productStock = new Map<string, { name: string; sku: string; qty: Decimal; value: Decimal }>();

    for (const b of batches) {
      totalStockQty = totalStockQty.add(b.remainingQty);
      const value = b.remainingQty.mul(b.unitCostUzs);
      totalValueUzs = totalValueUzs.add(value);
      const e = productStock.get(b.productId) ?? {
        name: b.product.name,
        sku: b.product.sku,
        qty: new Decimal(0),
        value: new Decimal(0),
      };
      e.qty = e.qty.add(b.remainingQty);
      e.value = e.value.add(value);
      productStock.set(b.productId, e);
    }

    let lowStockCount = 0;
    for (const [productId, stock] of productStock) {
      const product = batches.find((b) => b.productId === productId)!.product;
      if (stock.qty.lt(product.minStockLevel)) lowStockCount += 1;
    }

    const [movementsLast7Days, transfersLast30Days, receiptsLast30Days] = await Promise.all([
      this.prisma.inventoryMovement.count({
        where: { companyId, warehouseId: id, createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.inventoryMovement.count({
        where: {
          companyId,
          warehouseId: id,
          type: InventoryMovementType.TRANSFER,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.inventoryMovement.count({
        where: {
          companyId,
          warehouseId: id,
          type: InventoryMovementType.RECEIPT,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    const topProducts = [...productStock.entries()]
      .sort((a, b) => b[1].value.comparedTo(a[1].value))
      .slice(0, 5)
      .map(([productId, row]) => ({
        productId,
        productName: row.name,
        sku: row.sku,
        stock: formatMoney(row.qty),
        valueUzs: formatMoney(row.value),
      }));

    return {
      productCount: productStock.size,
      totalValueUzs: formatMoney(totalValueUzs),
      totalStockQty: formatMoney(totalStockQty),
      batchCount: batches.length,
      lowStockCount,
      movementsLast7Days,
      transfersLast30Days,
      receiptsLast30Days,
      topProducts,
    };
  }

  async getWarehouseReports(companyId: string, id: string): Promise<WarehouseReportDto> {
    await this.ensureWarehouse(companyId, id);

    const batches = await this.prisma.inventoryBatch.findMany({
      where: { companyId, warehouseId: id, remainingQty: { gt: 0 } },
      include: { product: true },
    });

    let totalValueUzs = new Decimal(0);
    let totalStockQty = new Decimal(0);
    const productStock = new Map<string, { product: (typeof batches)[0]['product']; qty: Decimal }>();

    for (const b of batches) {
      totalStockQty = totalStockQty.add(b.remainingQty);
      totalValueUzs = totalValueUzs.add(b.remainingQty.mul(b.unitCostUzs));
      const e = productStock.get(b.productId) ?? { product: b.product, qty: new Decimal(0) };
      e.qty = e.qty.add(b.remainingQty);
      productStock.set(b.productId, e);
    }

    const movementGroups = await this.prisma.inventoryMovement.groupBy({
      by: ['type'],
      where: { companyId, warehouseId: id },
      _count: { id: true },
    });

    const movementsByType: Record<string, number> = {};
    for (const g of movementGroups) {
      movementsByType[g.type] = g._count.id;
    }

    const transfersCount = movementsByType[InventoryMovementType.TRANSFER] ?? 0;

    const lowStockProducts = [...productStock.entries()]
      .filter(([, row]) => row.qty.lt(row.product.minStockLevel))
      .map(([productId, row]) => ({
        productId,
        productName: row.product.name,
        sku: row.product.sku,
        stock: formatMoney(row.qty),
        minStockLevel: formatMoney(row.product.minStockLevel),
      }));

    return {
      stockSummary: {
        productCount: productStock.size,
        batchCount: batches.length,
        totalValueUzs: formatMoney(totalValueUzs),
        totalStockQty: formatMoney(totalStockQty),
      },
      movementsByType,
      transfersCount,
      lowStockProducts,
    };
  }

  private async toWarehouseResponse(
    companyId: string,
    warehouse: Prisma.WarehouseGetPayload<{ include: { branch: true } }>,
  ): Promise<WarehouseResponseDto> {
    const stats = await this.prisma.inventoryBatch.groupBy({
      by: ['productId'],
      where: { companyId, warehouseId: warehouse.id, remainingQty: { gt: 0 } },
      _sum: { remainingQty: true, unitCostUzs: true },
    });

    let totalValueUzs = new Decimal(0);
    for (const row of stats) {
      const batches = await this.prisma.inventoryBatch.findMany({
        where: {
          companyId,
          warehouseId: warehouse.id,
          productId: row.productId,
          remainingQty: { gt: 0 },
        },
        select: { remainingQty: true, unitCostUzs: true },
      });
      for (const batch of batches) {
        totalValueUzs = totalValueUzs.add(batch.remainingQty.mul(batch.unitCostUzs));
      }
    }

    const productCount = stats.length;

    return {
      id: warehouse.id,
      name: warehouse.name,
      branchId: warehouse.branchId,
      branchName: warehouse.branch.name,
      address: warehouse.address,
      isDefault: warehouse.isDefault,
      status: warehouse.status.toLowerCase(),
      productCount,
      totalValueUzs: formatMoney(totalValueUzs),
    };
  }

  private async ensureProduct(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId, deletedAt: null },
    });
    if (!product) {
      throw AppException.notFound('Product', productId);
    }
    return product;
  }

  private async ensureWarehouse(companyId: string, warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId, status: CompanyStatus.ACTIVE },
    });
    if (!warehouse) {
      throw AppException.notFound('Warehouse', warehouseId);
    }
    return warehouse;
  }

  private toBatchResponse(batch: BatchWithRelations): InventoryBatchResponseDto {
    return {
      id: batch.id,
      productId: batch.productId,
      productName: batch.product.name,
      sku: batch.product.sku,
      quantity: formatMoney(batch.quantity),
      remainingQty: formatMoney(batch.remainingQty),
      unitCostUzs: formatMoney(batch.unitCostUzs),
      unitCostUsd: formatMoney(batch.unitCostUsd),
      warehouseId: batch.warehouseId,
      warehouseName: batch.warehouse.name,
      receivedAt: batch.receivedAt.toISOString(),
    };
  }

  private toMovementResponse(movement: MovementWithRelations): StockMovementResponseDto {
    return {
      id: movement.id,
      type: movement.type,
      productId: movement.productId,
      productName: movement.product.name,
      sku: movement.product.sku,
      quantity: formatMoney(movement.quantity),
      warehouseId: movement.warehouseId,
      warehouseName: movement.warehouse.name,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      note: movement.note,
      createdAt: movement.createdAt.toISOString(),
      performedBy: `${movement.performer.firstName} ${movement.performer.lastName}`.trim(),
    };
  }
}
