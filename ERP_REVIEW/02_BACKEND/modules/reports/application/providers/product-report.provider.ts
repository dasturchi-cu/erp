import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../../core/database/prisma.service';
import { formatMoney } from '../../../../core/utils/money.util';
import { paginationSkip } from '../../../../core/utils/pagination.util';
import { ReportQueryContext, ReportProviderResult } from '../report.types';
import { applySearch, moneyFields, paginateRows, sortRows, sumDecimal } from './report-query.helpers';

@Injectable()
export class ProductReportProvider {
  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    switch (ctx.template) {
      case 'top_selling':
        return this.topSelling(ctx);
      case 'slow_moving':
        return this.slowMoving(ctx);
      case 'turnover':
      default:
        return this.turnover(ctx);
    }
  }

  private async turnover(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          companyId: ctx.companyId,
          status: { not: 'CANCELLED' },
          createdAt: { gte: ctx.dateFrom, lte: ctx.dateTo },
        },
      },
      include: { product: { select: { sku: true, name: true } } },
    });

    const map = new Map<string, { sku: string; name: string; qty: Decimal; revenueUzs: Decimal }>();
    for (const item of items) {
      const e = map.get(item.productId) ?? {
        sku: item.product.sku,
        name: item.product.name,
        qty: new Decimal(0),
        revenueUzs: new Decimal(0),
      };
      e.qty = e.qty.add(item.quantity);
      e.revenueUzs = e.revenueUzs.add(item.totalUzs);
      map.set(item.productId, e);
    }

    let rows = Array.from(map.values()).map((v) => ({
      sku: v.sku,
      name: v.name,
      quantitySold: formatMoney(v.qty),
      revenueUzs: formatMoney(v.revenueUzs),
    }));

    rows = sortRows(rows, ctx.sort, ['name', 'quantitySold', 'revenueUzs'], 'revenueUzs');
    rows = applySearch(rows, ctx.q, ['sku', 'name']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    return {
      data,
      total,
      summary: { productCount: map.size },
      totals: { productCount: map.size },
      kpi: [
        { id: 'kpi_products', label: 'Faol mahsulotlar', value: String(map.size) },
        {
          id: 'kpi_revenue',
          label: 'Jami aylanma UZS',
          value: formatMoney(sumDecimal(Array.from(map.values()).map((v) => v.revenueUzs))),
        },
      ],
    };
  }

  private async topSelling(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const result = await this.turnover({ ...ctx, sort: 'revenueUzs:desc' });
    return result;
  }

  private async slowMoving(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const soldProductIds = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          companyId: ctx.companyId,
          status: { not: 'CANCELLED' },
          createdAt: { gte: ctx.dateFrom, lte: ctx.dateTo },
        },
      },
      select: { productId: true },
      distinct: ['productId'],
    });
    const soldSet = new Set(soldProductIds.map((p) => p.productId));

    const products = await this.prisma.product.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, sku: true, name: true },
    });

    let rows = products
      .filter((p) => !soldSet.has(p.id))
      .map((p) => ({ sku: p.sku, name: p.name, quantitySold: '0.0000', revenueUzs: '0.0000' }));

    rows = applySearch(rows, ctx.q, ['sku', 'name']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    return {
      data,
      total,
      summary: { slowMovingCount: rows.length },
      totals: { slowMovingCount: rows.length },
      kpi: [{ id: 'kpi_slow', label: 'Sekin aylanuvchi', value: String(rows.length) }],
    };
  }
}
