import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../../core/database/prisma.service';
import { formatMoney } from '../../../../core/utils/money.util';
import { paginationSkip } from '../../../../core/utils/pagination.util';
import { ReportQueryContext, ReportProviderResult } from '../report.types';
import { applySearch, paginateRows, sortRows, sumDecimal } from './report-query.helpers';

@Injectable()
export class InventoryReportProvider {
  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    switch (ctx.template) {
      case 'valuation':
        return this.valuation(ctx);
      case 'low_stock':
        return this.lowStock(ctx);
      case 'movements':
        return this.movements(ctx);
      case 'batches':
        return this.batches(ctx);
      case 'stock_level':
      default:
        return this.stockLevel(ctx);
    }
  }

  private batchWhere(ctx: ReportQueryContext): Prisma.InventoryBatchWhereInput {
    const where: Prisma.InventoryBatchWhereInput = {
      companyId: ctx.companyId,
      remainingQty: { gt: 0 },
    };
    if (ctx.warehouseId) where.warehouseId = ctx.warehouseId;
    return where;
  }

  private async stockLevel(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const batches = await this.prisma.inventoryBatch.findMany({
      where: this.batchWhere(ctx),
      include: {
        product: { select: { sku: true, name: true } },
        warehouse: { select: { name: true } },
      },
    });

    const map = new Map<string, { sku: string; name: string; warehouse: string; qty: Decimal; valueUzs: Decimal; valueUsd: Decimal }>();
    for (const b of batches) {
      const key = `${b.productId}:${b.warehouseId}`;
      const e = map.get(key) ?? {
        sku: b.product.sku,
        name: b.product.name,
        warehouse: b.warehouse.name,
        qty: new Decimal(0),
        valueUzs: new Decimal(0),
        valueUsd: new Decimal(0),
      };
      e.qty = e.qty.add(b.remainingQty);
      e.valueUzs = e.valueUzs.add(b.remainingQty.mul(b.unitCostUzs));
      e.valueUsd = e.valueUsd.add(b.remainingQty.mul(b.unitCostUsd));
      map.set(key, e);
    }

    let rows = Array.from(map.values()).map((v) => ({
      sku: v.sku,
      name: v.name,
      warehouse: v.warehouse,
      quantity: formatMoney(v.qty),
      valueUzs: formatMoney(v.valueUzs),
      valueUsd: formatMoney(v.valueUsd),
    }));

    rows = sortRows(rows, ctx.sort, ['name', 'quantity', 'valueUzs'], 'valueUzs');
    rows = applySearch(rows, ctx.q, ['sku', 'name', 'warehouse']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    const totalValUzs = sumDecimal(Array.from(map.values()).map((v) => v.valueUzs));

    return {
      data,
      total,
      summary: { skuCount: map.size },
      totals: { skuCount: map.size, totalValueUzs: formatMoney(totalValUzs) },
      kpi: [
        { id: 'kpi_skus', label: 'Pozitsiyalar', value: String(map.size) },
        { id: 'kpi_value', label: 'Ombor qiymati UZS', value: formatMoney(totalValUzs) },
      ],
    };
  }

  private async valuation(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const batches = await this.prisma.inventoryBatch.findMany({
      where: this.batchWhere(ctx),
      include: { product: { include: { category: { select: { name: true } } } } },
    });

    const map = new Map<string, { category: string; units: Decimal; valueUzs: Decimal; valueUsd: Decimal }>();
    for (const b of batches) {
      const cat = b.product.category?.name ?? 'Boshqa';
      const e = map.get(cat) ?? { category: cat, units: new Decimal(0), valueUzs: new Decimal(0), valueUsd: new Decimal(0) };
      e.units = e.units.add(b.remainingQty);
      e.valueUzs = e.valueUzs.add(b.remainingQty.mul(b.unitCostUzs));
      e.valueUsd = e.valueUsd.add(b.remainingQty.mul(b.unitCostUsd));
      map.set(cat, e);
    }

    let rows = Array.from(map.values()).map((v) => ({
      category: v.category,
      totalUnits: formatMoney(v.units),
      valueUzs: formatMoney(v.valueUzs),
      valueUsd: formatMoney(v.valueUsd),
    }));

    rows = sortRows(rows, ctx.sort, ['category', 'valueUzs'], 'valueUzs');
    rows = applySearch(rows, ctx.q, ['category']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    return {
      data,
      total,
      summary: { categoryCount: map.size },
      totals: { categoryCount: map.size },
      kpi: [{ id: 'kpi_categories', label: 'Kategoriyalar', value: String(map.size) }],
    };
  }

  private async lowStock(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const batches = await this.prisma.inventoryBatch.findMany({
      where: this.batchWhere(ctx),
      include: { product: { select: { sku: true, name: true, minStockLevel: true } } },
    });

    const stockMap = new Map<string, { sku: string; name: string; qty: Decimal; minLevel: Decimal }>();
    for (const b of batches) {
      const e = stockMap.get(b.productId) ?? {
        sku: b.product.sku,
        name: b.product.name,
        qty: new Decimal(0),
        minLevel: b.product.minStockLevel,
      };
      e.qty = e.qty.add(b.remainingQty);
      stockMap.set(b.productId, e);
    }

    let rows = Array.from(stockMap.values())
      .filter((v) => v.qty.lt(v.minLevel))
      .map((v) => ({
        sku: v.sku,
        name: v.name,
        currentQty: formatMoney(v.qty),
        minLevel: formatMoney(v.minLevel),
        deficit: formatMoney(v.minLevel.sub(v.qty)),
      }));

    rows = sortRows(rows, ctx.sort, ['name', 'deficit'], 'deficit');
    rows = applySearch(rows, ctx.q, ['sku', 'name']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    return {
      data,
      total,
      summary: { lowStockCount: rows.length },
      totals: { lowStockCount: rows.length },
      kpi: [{ id: 'kpi_low', label: 'Kam qoldiq', value: String(rows.length) }],
    };
  }

  private async movements(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where: Prisma.InventoryMovementWhereInput = {
      companyId: ctx.companyId,
      createdAt: { gte: ctx.dateFrom, lte: ctx.dateTo },
    };
    if (ctx.warehouseId) where.warehouseId = ctx.warehouseId;
    if (ctx.q) {
      where.product = { name: { contains: ctx.q, mode: 'insensitive' } };
    }

    const [total, movements] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
          performer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: paginationSkip(ctx.page, ctx.limit),
        take: ctx.limit,
      }),
    ]);

    const data = movements.map((m) => ({
      date: m.createdAt.toISOString(),
      product: m.product.name,
      sku: m.product.sku,
      type: m.type,
      quantity: formatMoney(m.quantity),
      warehouse: m.warehouse.name,
      reference: m.referenceType ?? '—',
      performedBy: `${m.performer.firstName} ${m.performer.lastName}`,
    }));

    return {
      data,
      total,
      summary: { movementCount: total },
      totals: { movementCount: total },
      kpi: [{ id: 'kpi_movements', label: 'Harakatlar', value: String(total) }],
    };
  }

  private async batches(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where = this.batchWhere(ctx);
    const [total, batches] = await this.prisma.$transaction([
      this.prisma.inventoryBatch.count({ where }),
      this.prisma.inventoryBatch.findMany({
        where,
        include: {
          product: { select: { sku: true, name: true } },
          warehouse: { select: { name: true } },
        },
        orderBy: { receivedAt: 'asc' },
        skip: paginationSkip(ctx.page, ctx.limit),
        take: ctx.limit,
      }),
    ]);

    const now = Date.now();
    const data = batches.map((b) => {
      const ageDays = Math.floor((now - b.receivedAt.getTime()) / 86400000);
      return {
        batchId: b.id,
        product: b.product.name,
        sku: b.product.sku,
        warehouse: b.warehouse.name,
        remainingQty: formatMoney(b.remainingQty),
        unitCostUzs: formatMoney(b.unitCostUzs),
        unitCostUsd: formatMoney(b.unitCostUsd),
        ageDays,
        receivedAt: b.receivedAt.toISOString(),
      };
    });

    return {
      data,
      total,
      summary: { batchCount: total },
      totals: { batchCount: total },
      kpi: [{ id: 'kpi_batches', label: 'Faol partiyalar', value: String(total) }],
    };
  }
}
