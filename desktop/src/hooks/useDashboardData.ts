import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { formatUzs, formatUsd } from '@/utils/format';

export interface DashboardData {
  todaySales: { uzs: string; usd: string; trend: number };
  weeklySales: { uzs: string; usd: string; trend: number };
  monthlySales: { uzs: string; usd: string; trend: number };
  yearlySales: { uzs: string; usd: string; trend: number };
  totalStockQuantity: number;
  warehouseValueAtCost: { uzs: string; usd: string };
  totalSupplierDebt: { uzs: string; usd: string };
  totalCustomerDebt: { uzs: string; usd: string };
  netProfit: { uzs: string; usd: string; trend: number };
  bestSellerProduct: { name: string; quantity: number };
  salesTrend: Array<{ date: string; uzs: number; usd: number; profitUzs: number; profitUsd: number }>;
  paymentSplit: Array<{ name: string; value: number; color: string }>;
  topProducts: Array<{ name: string; qty: number; revenueUzs: string; revenueUsd: string }>;
  topCustomers: Array<{ name: string; revenueUzs: string; revenueUsd: string }>;
  recentActivity: Array<{ id: string; text: string; time: string; type: string }>;
  suppliers: {
    recentPayments: Array<{ id: string; text: string; time: string }>;
  };
}

export function useDashboardData(period?: string, exchangeRate?: number) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: ent } = await apiClient.get<any>('/analytics/dashboard/enterprise');

      setData({
        todaySales: {
          uzs: formatUzs(ent.todaySales.uzs),
          usd: formatUsd(ent.todaySales.usd),
          trend: ent.todaySales.trend,
        },
        weeklySales: {
          uzs: formatUzs(ent.weeklySales.uzs),
          usd: formatUsd(ent.weeklySales.usd),
          trend: ent.weeklySales.trend,
        },
        monthlySales: {
          uzs: formatUzs(ent.monthlySales.uzs),
          usd: formatUsd(ent.monthlySales.usd),
          trend: ent.monthlySales.trend,
        },
        yearlySales: {
          uzs: formatUzs(ent.yearlySales.uzs),
          usd: formatUsd(ent.yearlySales.usd),
          trend: ent.yearlySales.trend,
        },
        totalStockQuantity: ent.totalStockQuantity,
        warehouseValueAtCost: {
          uzs: formatUzs(ent.warehouseValue.uzs),
          usd: formatUsd(ent.warehouseValue.usd),
        },
        totalSupplierDebt: {
          uzs: formatUzs(ent.supplierDebt.uzs),
          usd: formatUsd(ent.supplierDebt.usd),
        },
        totalCustomerDebt: {
          uzs: formatUzs(ent.customerDebt.uzs),
          usd: formatUsd(ent.customerDebt.usd),
        },
        netProfit: {
          uzs: formatUzs(ent.netProfit.uzs),
          usd: formatUsd(ent.netProfit.usd),
          trend: ent.netProfit.trend,
        },
        bestSellerProduct: {
          name: ent.topProducts[0]?.name ?? '—',
          quantity: ent.topProducts[0]?.qty ?? 0,
        },
        salesTrend: ent.last30DaysChart.map((p: any) => ({
          date: p.date,
          uzs: p.salesUzs,
          usd: p.salesUsd,
          profitUzs: p.profitUzs,
          profitUsd: p.profitUsd,
        })),
        paymentSplit: [
          { name: 'Naqd', value: 100, color: '#2563EB' },
          { name: 'Nasiya', value: 0, color: '#16A34A' },
        ],
        topProducts: ent.topProducts.map((p: any) => ({
          name: p.name,
          qty: p.qty,
          revenueUzs: formatUzs(p.revenueUzs),
          revenueUsd: formatUsd(p.revenueUsd),
        })),
        topCustomers: ent.topCustomers.map((c: any) => ({
          name: c.name,
          revenueUzs: formatUzs(c.revenueUzs),
          revenueUsd: formatUsd(c.revenueUsd),
        })),
        recentActivity: [],
        suppliers: {
          recentPayments: [],
        },
      });
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Dashboard yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
