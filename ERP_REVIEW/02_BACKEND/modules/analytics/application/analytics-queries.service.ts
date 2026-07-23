import { Injectable } from '@nestjs/common';
import { Prisma, ReportPeriod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../core/database/prisma.service';
import { chartBucketSql } from './analytics-period.util';

export interface SalesAggRow {
  revenue_uzs: Decimal;
  revenue_usd: Decimal;
  cogs_uzs: Decimal;
  order_count: bigint;
}

export interface ChartBucketRow {
  bucket: Date;
  revenue: Decimal;
  profit: Decimal;
  orders: bigint;
}

export interface TopProductRow {
  product_id: string;
  name: string;
  sku: string;
  quantity: Decimal;
  revenue_uzs: Decimal;
}

export interface TopCustomerRow {
  customer_id: string;
  name: string;
  phone: string;
  order_count: bigint;
  revenue_uzs: Decimal;
}

export interface TopSupplierRow {
  supplier_id: string;
  name: string;
  receipt_count: bigint;
  total_cost_uzs: Decimal;
  debt_uzs: Decimal;
}

export interface AnalyticsQueryScope {
  companyId: string;
  dateFrom: Date;
  dateTo: Date;
  branchId?: string;
  cashierId?: string;
}

@Injectable()
export class AnalyticsQueriesService {
  constructor(private readonly prisma: PrismaService) {}

  private saleFilters(scope: AnalyticsQueryScope): Prisma.Sql {
    const parts: Prisma.Sql[] = [
      Prisma.sql`s.company_id = ${scope.companyId}::uuid`,
      Prisma.sql`s.status != 'CANCELLED'`,
      Prisma.sql`s.created_at >= ${scope.dateFrom}`,
      Prisma.sql`s.created_at <= ${scope.dateTo}`,
    ];
    if (scope.branchId) parts.push(Prisma.sql`s.branch_id = ${scope.branchId}::uuid`);
    if (scope.cashierId) parts.push(Prisma.sql`s.cashier_id = ${scope.cashierId}::uuid`);
    return Prisma.join(parts, ' AND ');
  }

  async aggregateSales(scope: AnalyticsQueryScope): Promise<SalesAggRow> {
    const where = this.saleFilters(scope);
    const rows = await this.prisma.$queryRaw<SalesAggRow[]>`
      SELECT
        COALESCE(SUM(s.total_uzs), 0) AS revenue_uzs,
        COALESCE(SUM(s.total_usd), 0) AS revenue_usd,
        COALESCE(SUM(si.cogs_uzs), 0) AS cogs_uzs,
        COUNT(s.id)::bigint AS order_count
      FROM sales s
      LEFT JOIN (
        SELECT sale_id, SUM(cogs_uzs) AS cogs_uzs
        FROM sale_items
        GROUP BY sale_id
      ) si ON si.sale_id = s.id
      WHERE ${where}
    `;
    return rows[0] ?? {
      revenue_uzs: new Decimal(0),
      revenue_usd: new Decimal(0),
      cogs_uzs: new Decimal(0),
      order_count: BigInt(0),
    };
  }

  async chartBuckets(
    scope: AnalyticsQueryScope,
    period: ReportPeriod,
    points: number,
  ): Promise<ChartBucketRow[]> {
    const trunc = chartBucketSql(period);
    const truncLiteral = Prisma.raw(`'${trunc}'`);
    const where = this.saleFilters(scope);

    return this.prisma.$queryRaw<ChartBucketRow[]>`
      SELECT
        date_trunc(${truncLiteral}, s.created_at) AS bucket,
        COALESCE(SUM(s.total_uzs), 0) AS revenue,
        COALESCE(SUM(s.total_uzs) - SUM(COALESCE(si.cogs_uzs, 0)), 0) AS profit,
        COUNT(s.id)::bigint AS orders
      FROM sales s
      LEFT JOIN (
        SELECT sale_id, SUM(cogs_uzs) AS cogs_uzs
        FROM sale_items
        GROUP BY sale_id
      ) si ON si.sale_id = s.id
      WHERE ${where}
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT ${points}
    `;
  }

  async countNewCustomers(scope: AnalyticsQueryScope): Promise<number> {
    const rows = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM customers c
      WHERE c.company_id = ${scope.companyId}::uuid
        AND c.deleted_at IS NULL
        AND c.created_at >= ${scope.dateFrom}
        AND c.created_at <= ${scope.dateTo}
    `;
    return Number(rows[0]?.count ?? 0);
  }

  async returnRate(scope: AnalyticsQueryScope): Promise<{ returnAmount: Decimal; saleAmount: Decimal }> {
    const saleWhere = this.saleFilters(scope);
    const rows = await this.prisma.$queryRaw<[{ return_amount: Decimal; sale_amount: Decimal }]>`
      SELECT
        COALESCE((
          SELECT SUM(sr.amount_uzs)
          FROM sale_returns sr
          WHERE sr.company_id = ${scope.companyId}::uuid
            AND sr.status = 'APPROVED'
            AND sr.created_at >= ${scope.dateFrom}
            AND sr.created_at <= ${scope.dateTo}
        ), 0) AS return_amount,
        COALESCE((
          SELECT SUM(s.total_uzs)
          FROM sales s
          WHERE ${saleWhere}
        ), 0) AS sale_amount
    `;
    return {
      returnAmount: rows[0]?.return_amount ?? new Decimal(0),
      saleAmount: rows[0]?.sale_amount ?? new Decimal(0),
    };
  }

  async topProducts(scope: AnalyticsQueryScope, limit: number): Promise<TopProductRow[]> {
    const where = this.saleFilters(scope);
    return this.prisma.$queryRaw<TopProductRow[]>`
      SELECT
        p.id AS product_id,
        p.name,
        p.sku,
        COALESCE(SUM(si.quantity), 0) AS quantity,
        COALESCE(SUM(si.total_uzs), 0) AS revenue_uzs
      FROM sale_items si
      INNER JOIN sales s ON s.id = si.sale_id
      INNER JOIN products p ON p.id = si.product_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.sku
      ORDER BY revenue_uzs DESC
      LIMIT ${limit}
    `;
  }

  async topCustomers(scope: AnalyticsQueryScope, limit: number): Promise<TopCustomerRow[]> {
    const where = this.saleFilters(scope);
    return this.prisma.$queryRaw<TopCustomerRow[]>`
      SELECT
        c.id AS customer_id,
        c.name,
        c.phone,
        COUNT(s.id)::bigint AS order_count,
        COALESCE(SUM(s.total_uzs), 0) AS revenue_uzs
      FROM sales s
      INNER JOIN customers c ON c.id = s.customer_id
      WHERE ${where}
        AND s.customer_id IS NOT NULL
      GROUP BY c.id, c.name, c.phone
      ORDER BY revenue_uzs DESC
      LIMIT ${limit}
    `;
  }

  async topSuppliers(scope: AnalyticsQueryScope, limit: number): Promise<TopSupplierRow[]> {
    return this.prisma.$queryRaw<TopSupplierRow[]>`
      SELECT
        sup.id AS supplier_id,
        sup.name,
        COUNT(sr.id)::bigint AS receipt_count,
        COALESCE(SUM(sr.total_cost_uzs), 0) AS total_cost_uzs,
        sup.total_debt_uzs AS debt_uzs
      FROM suppliers sup
      LEFT JOIN supplier_receipts sr ON sr.supplier_id = sup.id
        AND sr.company_id = ${scope.companyId}::uuid
        AND sr.created_at >= ${scope.dateFrom}
        AND sr.created_at <= ${scope.dateTo}
      WHERE sup.company_id = ${scope.companyId}::uuid
        AND sup.deleted_at IS NULL
      GROUP BY sup.id, sup.name, sup.total_debt_uzs
      ORDER BY total_cost_uzs DESC
      LIMIT ${limit}
    `;
  }

  async supplierSummary(scope: AnalyticsQueryScope): Promise<{
    count: number;
    totalDebt: Decimal;
    totalReceipts: Decimal;
    paymentTotal: Decimal;
  }> {
    const rows = await this.prisma.$queryRaw<
      [{ supplier_count: bigint; total_debt: Decimal; total_receipts: Decimal; payment_total: Decimal }]
    >`
      SELECT
        (SELECT COUNT(*)::bigint FROM suppliers WHERE company_id = ${scope.companyId}::uuid AND deleted_at IS NULL) AS supplier_count,
        (SELECT COALESCE(SUM(total_debt_uzs), 0) FROM suppliers WHERE company_id = ${scope.companyId}::uuid AND deleted_at IS NULL) AS total_debt,
        (SELECT COALESCE(SUM(total_cost_uzs), 0) FROM supplier_receipts WHERE company_id = ${scope.companyId}::uuid AND created_at >= ${scope.dateFrom} AND created_at <= ${scope.dateTo}) AS total_receipts,
        (SELECT COALESCE(SUM(amount_uzs), 0) FROM supplier_payments WHERE company_id = ${scope.companyId}::uuid AND created_at >= ${scope.dateFrom} AND created_at <= ${scope.dateTo}) AS payment_total
    `;
    const r = rows[0];
    return {
      count: Number(r?.supplier_count ?? 0),
      totalDebt: r?.total_debt ?? new Decimal(0),
      totalReceipts: r?.total_receipts ?? new Decimal(0),
      paymentTotal: r?.payment_total ?? new Decimal(0),
    };
  }

  async customerSummary(scope: AnalyticsQueryScope): Promise<{
    totalCustomers: number;
    activeBuyers: number;
    totalDebt: Decimal;
  }> {
    const rows = await this.prisma.$queryRaw<
      [{ total_customers: bigint; active_buyers: bigint; total_debt: Decimal }]
    >`
      SELECT
        (SELECT COUNT(*)::bigint FROM customers WHERE company_id = ${scope.companyId}::uuid AND deleted_at IS NULL) AS total_customers,
        (SELECT COUNT(DISTINCT s.customer_id)::bigint FROM sales s WHERE ${this.saleFilters(scope)} AND s.customer_id IS NOT NULL) AS active_buyers,
        (SELECT COALESCE(SUM(total_debt_uzs), 0) FROM customers WHERE company_id = ${scope.companyId}::uuid AND deleted_at IS NULL) AS total_debt
    `;
    const r = rows[0];
    return {
      totalCustomers: Number(r?.total_customers ?? 0),
      activeBuyers: Number(r?.active_buyers ?? 0),
      totalDebt: r?.total_debt ?? new Decimal(0),
    };
  }

  async expenseTotal(scope: AnalyticsQueryScope): Promise<Decimal> {
    const rows = await this.prisma.$queryRaw<[{ total: Decimal }]>`
      SELECT COALESCE(SUM(amount_uzs), 0) AS total
      FROM expenses
      WHERE company_id = ${scope.companyId}::uuid
        AND deleted_at IS NULL
        AND expense_date >= ${scope.dateFrom}
        AND expense_date <= ${scope.dateTo}
    `;
    return rows[0]?.total ?? new Decimal(0);
  }

  async inventoryValue(companyId: string): Promise<Decimal> {
    const rows = await this.prisma.$queryRaw<[{ total: Decimal }]>`
      SELECT COALESCE(SUM(remaining_qty * unit_cost_uzs), 0) AS total
      FROM inventory_batches
      WHERE company_id = ${companyId}::uuid
        AND remaining_qty > 0
    `;
    return rows[0]?.total ?? new Decimal(0);
  }
}
