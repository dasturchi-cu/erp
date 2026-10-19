import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Approved returns are netted out of revenue/COGS everywhere a sale is
 * counted (reports, analytics, dashboard). A RETURNED / PARTIALLY_RETURNED
 * sale keeps its original totalUzs and cogsUzs, so summing those alone
 * reported refunded money as revenue and returned goods as cost of sales.
 *
 * Returned cost = returned qty × the sale line's average unit COGS (the FIFO
 * cost the goods left at). Returns are attributed to the original sale (its
 * date, cashier, branch), not to the day the return was approved.
 */

/**
 * Raw-SQL subquery: one row per (sale_id, product_id) of APPROVED returns
 * with qty, amount_uzs, amount_usd, cogs_uzs, cogs_usd.
 */
export function approvedReturnLinesSql(companyId: string): Prisma.Sql {
  return Prisma.sql`(
    SELECT
      sr.sale_id,
      sri.product_id,
      SUM(sri.quantity) AS qty,
      SUM(sri.amount_uzs) AS amount_uzs,
      SUM(sri.amount_uzs / NULLIF(sr.exchange_rate_used, 0)) AS amount_usd,
      SUM(sri.quantity * COALESCE(uc.unit_cogs_uzs, 0)) AS cogs_uzs,
      SUM(sri.quantity * COALESCE(uc.unit_cogs_usd, 0)) AS cogs_usd
    FROM sale_returns sr
    JOIN sale_return_items sri ON sri.return_id = sr.id
    LEFT JOIN LATERAL (
      SELECT
        SUM(si2.cogs_uzs) / NULLIF(SUM(si2.quantity), 0) AS unit_cogs_uzs,
        SUM(si2.cogs_usd) / NULLIF(SUM(si2.quantity), 0) AS unit_cogs_usd
      FROM sale_items si2
      WHERE si2.sale_id = sr.sale_id AND si2.product_id = sri.product_id
    ) uc ON true
    WHERE sr.company_id = ${companyId}::uuid
      AND sr.status = 'APPROVED'
    GROUP BY sr.sale_id, sri.product_id
  )`;
}

/** Raw-SQL subquery: APPROVED return totals per sale_id. */
export function approvedReturnsBySaleSql(companyId: string): Prisma.Sql {
  return Prisma.sql`(
    SELECT
      rl.sale_id,
      SUM(rl.amount_uzs) AS amount_uzs,
      SUM(rl.amount_usd) AS amount_usd,
      SUM(rl.cogs_uzs) AS cogs_uzs,
      SUM(rl.cogs_usd) AS cogs_usd
    FROM ${approvedReturnLinesSql(companyId)} rl
    GROUP BY rl.sale_id
  )`;
}

export interface ReturnedAmounts {
  qty: Decimal;
  amountUzs: Decimal;
  amountUsd: Decimal;
  cogsUzs: Decimal;
  cogsUsd: Decimal;
}

export interface ApprovedReturnsSummary {
  total: ReturnedAmounts;
  bySale: Map<string, ReturnedAmounts & { createdAt: Date; cashierId: string; branchId: string }>;
  byProduct: Map<string, ReturnedAmounts>;
}

export function emptyReturned(): ReturnedAmounts {
  return {
    qty: new Decimal(0),
    amountUzs: new Decimal(0),
    amountUsd: new Decimal(0),
    cogsUzs: new Decimal(0),
    cogsUsd: new Decimal(0),
  };
}

function addInto(target: ReturnedAmounts, src: ReturnedAmounts): void {
  target.qty = target.qty.add(src.qty);
  target.amountUzs = target.amountUzs.add(src.amountUzs);
  target.amountUsd = target.amountUsd.add(src.amountUsd);
  target.cogsUzs = target.cogsUzs.add(src.cogsUzs);
  target.cogsUsd = target.cogsUsd.add(src.cogsUsd);
}

type ReturnsClient = {
  saleReturn: { findMany: (args: any) => Promise<any[]> };
  saleItem: { findMany: (args: any) => Promise<any[]> };
};

/** Prisma version for the report providers, scoped by the same sale filter. */
export async function loadApprovedReturns(
  prisma: ReturnsClient,
  companyId: string,
  saleWhere: Prisma.SaleWhereInput,
): Promise<ApprovedReturnsSummary> {
  const returns: Array<{
    saleId: string;
    exchangeRateUsed: Decimal;
    sale: { createdAt: Date; cashierId: string; branchId: string };
    items: Array<{ productId: string; quantity: Decimal; amountUzs: Decimal }>;
  }> = await prisma.saleReturn.findMany({
    where: { companyId, status: 'APPROVED', sale: saleWhere },
    select: {
      saleId: true,
      exchangeRateUsed: true,
      sale: { select: { createdAt: true, cashierId: true, branchId: true } },
      items: { select: { productId: true, quantity: true, amountUzs: true } },
    },
  });

  const summary: ApprovedReturnsSummary = {
    total: emptyReturned(),
    bySale: new Map(),
    byProduct: new Map(),
  };
  if (returns.length === 0) return summary;

  const saleIds = [...new Set(returns.map((r) => r.saleId))];
  const saleItems: Array<{
    saleId: string;
    productId: string;
    quantity: Decimal;
    cogsUzs: Decimal;
    cogsUsd: Decimal;
  }> = await prisma.saleItem.findMany({
    where: { saleId: { in: saleIds } },
    select: { saleId: true, productId: true, quantity: true, cogsUzs: true, cogsUsd: true },
  });
  const lineCost = new Map<string, { qty: Decimal; cogsUzs: Decimal; cogsUsd: Decimal }>();
  for (const si of saleItems) {
    const key = `${si.saleId}:${si.productId}`;
    const e = lineCost.get(key) ?? { qty: new Decimal(0), cogsUzs: new Decimal(0), cogsUsd: new Decimal(0) };
    e.qty = e.qty.add(si.quantity);
    e.cogsUzs = e.cogsUzs.add(si.cogsUzs);
    e.cogsUsd = e.cogsUsd.add(si.cogsUsd);
    lineCost.set(key, e);
  }

  for (const ret of returns) {
    for (const item of ret.items) {
      const cost = lineCost.get(`${ret.saleId}:${item.productId}`);
      const line: ReturnedAmounts = {
        qty: item.quantity,
        amountUzs: item.amountUzs,
        amountUsd: ret.exchangeRateUsed.gt(0)
          ? item.amountUzs.div(ret.exchangeRateUsed)
          : new Decimal(0),
        cogsUzs: cost?.qty.gt(0) ? cost.cogsUzs.div(cost.qty).mul(item.quantity) : new Decimal(0),
        cogsUsd: cost?.qty.gt(0) ? cost.cogsUsd.div(cost.qty).mul(item.quantity) : new Decimal(0),
      };
      addInto(summary.total, line);

      const bySale = summary.bySale.get(ret.saleId) ?? { ...emptyReturned(), ...ret.sale };
      addInto(bySale, line);
      summary.bySale.set(ret.saleId, bySale);

      const byProduct = summary.byProduct.get(item.productId) ?? emptyReturned();
      addInto(byProduct, line);
      summary.byProduct.set(item.productId, byProduct);
    }
  }
  return summary;
}
