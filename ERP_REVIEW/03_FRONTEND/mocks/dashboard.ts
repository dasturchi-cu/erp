import type { DashboardPeriod } from '@/types';

interface DashboardDataSet {
  kpis: {
    totalSales: { uzs: string; usd: string; trend: number; meta: string };
    saleCount: { value: string; trend: number; meta: string };
    avgSale: { uzs: string; usd: string; trend: number };
    cashSales: { uzs: string; usd: string; trend: number; meta: string };
    grossProfit: { uzs: string; usd: string; trend: number };
    grossMargin: { value: string; trend: number };
    cogs: { uzs: string; usd: string; trend: number };
    outstandingDebt: { uzs: string; usd: string; trend: number; meta: string };
    payments: { uzs: string; usd: string; trend: number; meta: string };
    newDebt: { uzs: string; usd: string; trend: number };
    overdueDebt: { uzs: string; usd: string; trend: number; meta: string };
    inventoryValue: { uzs: string; usd: string; trend: number; meta: string };
    exchangeRate: { value: string; trend: number; meta: string };
  };
  salesTrend: Array<{ date: string; uzs: number; usd: number }>;
  paymentSplit: Array<{ name: string; value: number; color: string }>;
  topProducts: Array<{ name: string; qty: number; revenueUzs: string; revenueUsd: string }>;
  recentActivity: Array<{ id: string; text: string; time: string; type: string }>;
}

export const mockDashboardData: Record<DashboardPeriod, DashboardDataSet> = {
  daily: {
    kpis: {
      totalSales: { uzs: "45 200 000 so'm", usd: '$3,420.00', trend: 8.2, meta: '127 ta tranzaksiya' },
      saleCount: { value: '127', trend: 5.4, meta: 'O\'rtacha 355 905 so\'m' },
      avgSale: { uzs: "355 905 so'm", usd: '$26.93', trend: 2.1 },
      cashSales: { uzs: "32 100 000 so'm", usd: '$2,430.00', trend: 6.8, meta: '71% jami savdodan' },
      grossProfit: { uzs: "11 050 000 so'm", usd: '$836.50', trend: 7.5 },
      grossMargin: { value: '24.4%', trend: 0.3 },
      cogs: { uzs: "34 150 000 so'm", usd: '$2,583.50', trend: 8.9 },
      outstandingDebt: { uzs: "128 500 000 so'm", usd: '$9,720.00', trend: -2.1, meta: '34 ta mijozda qarz' },
      payments: { uzs: "8 400 000 so'm", usd: '$635.00', trend: 12.3, meta: '18 ta to\'lov' },
      newDebt: { uzs: "4 200 000 so'm", usd: '$318.00', trend: -4.5 },
      overdueDebt: { uzs: "22 100 000 so'm", usd: '$1,672.00', trend: 1.2, meta: '7 ta mijozning muddati o\'tgan' },
      inventoryValue: { uzs: "890 000 000 so'm", usd: '$67,320.00', trend: 0.8, meta: 'Sotuv narxlari bo\'yicha' },
      exchangeRate: { value: '12 620 so\'m', trend: 0.0, meta: '1 USD = 12 620 so\'m' },
    },
    salesTrend: [
      { date: '08:00', uzs: 3200000, usd: 253 },
      { date: '10:00', uzs: 5800000, usd: 460 },
      { date: '12:00', uzs: 9200000, usd: 729 },
      { date: '14:00', uzs: 12400000, usd: 983 },
      { date: '16:00', uzs: 15800000, usd: 1252 },
      { date: '18:00', uzs: 45200000, usd: 3420 },
    ],
    paymentSplit: [
      { name: 'Naqd', value: 71, color: '#2563EB' },
      { name: 'Nasiya', value: 29, color: '#16A34A' },
    ],
    topProducts: [
      { name: 'Samsung A54', qty: 24, revenueUzs: "9 600 000 so'm", revenueUsd: '$760.00' },
      { name: 'iPhone 15 Case', qty: 89, revenueUzs: "4 450 000 so'm", revenueUsd: '$352.00' },
      { name: 'USB-C Cable 2m', qty: 156, revenueUzs: "3 120 000 so'm", revenueUsd: '$247.00' },
      { name: 'Wireless Earbuds', qty: 42, revenueUzs: "8 400 000 so'm", revenueUsd: '$665.00' },
      { name: 'Screen Protector', qty: 201, revenueUzs: "2 010 000 so'm", revenueUsd: '$159.00' },
    ],
    recentActivity: [
      { id: '1', text: 'Sotuv #4521 yakunlandi — 850 000 so\'m', time: '2 daqiqa oldin', type: 'sale' },
      { id: '2', text: 'Aziz Karimov to\'lov qildi', time: '15 daqiqa oldin', type: 'payment' },
      { id: '3', text: 'Zaxira tuzatildi: USB-C kabel +50', time: '32 daqiqa oldin', type: 'inventory' },
      { id: '4', text: 'Sotuv #4520 yakunlandi — $45.00', time: '1 soat oldin', type: 'sale' },
      { id: '5', text: 'Yangi mijoz ro\'yxatdan o\'tdi: Malika S.', time: '2 soat oldin', type: 'customer' },
    ],
  },
  weekly: {
    kpis: {
      totalSales: { uzs: "312 800 000 so'm", usd: '$23,680.00', trend: 12.1, meta: '892 ta tranzaksiya' },
      saleCount: { value: '892', trend: 9.8, meta: 'O\'rtacha 350 672 so\'m' },
      avgSale: { uzs: "350 672 so'm", usd: '$26.55', trend: 1.8 },
      cashSales: { uzs: "218 960 000 so'm", usd: '$16,576.00', trend: 10.2, meta: '70% jami savdodan' },
      grossProfit: { uzs: "76 384 000 so'm", usd: '$5,784.00', trend: 11.4 },
      grossMargin: { value: '24.4%', trend: 0.1 },
      cogs: { uzs: "236 416 000 so'm", usd: '$17,896.00', trend: 12.5 },
      outstandingDebt: { uzs: "128 500 000 so'm", usd: '$9,720.00', trend: -2.1, meta: '34 ta mijozda qarz' },
      payments: { uzs: "52 600 000 so'm", usd: '$3,980.00', trend: 18.7, meta: '94 ta to\'lov' },
      newDebt: { uzs: "28 400 000 so'm", usd: '$2,150.00', trend: 3.2 },
      overdueDebt: { uzs: "22 100 000 so'm", usd: '$1,672.00', trend: 1.2, meta: '7 ta mijozning muddati o\'tgan' },
      inventoryValue: { uzs: "890 000 000 so'm", usd: '$67,320.00', trend: 0.8, meta: 'Sotuv narxlari bo\'yicha' },
      exchangeRate: { value: '12 620 so\'m', trend: 0.0, meta: '1 USD = 12 620 so\'m' },
    },
    salesTrend: [
      { date: 'Dush', uzs: 42000000, usd: 3180 },
      { date: 'Sesh', uzs: 38500000, usd: 2915 },
      { date: 'Chor', uzs: 51200000, usd: 3875 },
      { date: 'Pay', uzs: 47800000, usd: 3618 },
      { date: 'Jum', uzs: 62100000, usd: 4700 },
      { date: 'Shan', uzs: 45200000, usd: 3420 },
      { date: 'Yak', uzs: 26800000, usd: 2028 },
    ],
    paymentSplit: [
      { name: 'Naqd', value: 70, color: '#2563EB' },
      { name: 'Nasiya', value: 30, color: '#16A34A' },
    ],
    topProducts: [
      { name: 'Samsung A54', qty: 168, revenueUzs: "67 200 000 so'm", revenueUsd: '$5,080.00' },
      { name: 'Wireless Earbuds', qty: 294, revenueUzs: "58 800 000 so'm", revenueUsd: '$4,450.00' },
      { name: 'iPhone 15 Case', qty: 623, revenueUzs: "31 150 000 so'm", revenueUsd: '$2,358.00' },
      { name: 'USB-C Cable 2m', qty: 1092, revenueUzs: "21 840 000 so'm", revenueUsd: '$1,652.00' },
      { name: 'Screen Protector', qty: 1407, revenueUzs: "14 070 000 so'm", revenueUsd: '$1,064.00' },
    ],
    recentActivity: [
      { id: '1', text: 'Haftalik hisobot yaratildi', time: '1 soat oldin', type: 'report' },
      { id: '2', text: 'Sotuv #4521 yakunlandi — 850 000 so\'m', time: '2 soat oldin', type: 'sale' },
      { id: '3', text: 'Aziz Karimov to\'lov qildi', time: '3 soat oldin', type: 'payment' },
    ],
  },
  monthly: {
    kpis: {
      totalSales: { uzs: "1 284 000 000 so'm", usd: '$97,140.00', trend: 15.3, meta: '3 842 ta tranzaksiya' },
      saleCount: { value: '3,842', trend: 11.2, meta: 'O\'rtacha 334 200 so\'m' },
      avgSale: { uzs: "334 200 so'm", usd: '$25.28', trend: 3.5 },
      cashSales: { uzs: "898 800 000 so'm", usd: '$67,998.00', trend: 14.1, meta: '70% jami savdodan' },
      grossProfit: { uzs: "313 296 000 so'm", usd: '$23,712.00', trend: 16.2 },
      grossMargin: { value: '24.4%', trend: 0.2 },
      cogs: { uzs: "970 704 000 so'm", usd: '$73,428.00', trend: 14.8 },
      outstandingDebt: { uzs: "128 500 000 so'm", usd: '$9,720.00', trend: -2.1, meta: '34 ta mijozda qarz' },
      payments: { uzs: "198 400 000 so'm", usd: '$15,010.00', trend: 22.4, meta: '412 ta to\'lov' },
      newDebt: { uzs: "112 600 000 so'm", usd: '$8,520.00', trend: 5.8 },
      overdueDebt: { uzs: "22 100 000 so'm", usd: '$1,672.00', trend: 1.2, meta: '7 ta mijozning muddati o\'tgan' },
      inventoryValue: { uzs: "890 000 000 so'm", usd: '$67,320.00', trend: 0.8, meta: 'Sotuv narxlari bo\'yicha' },
      exchangeRate: { value: '12 620 so\'m', trend: 0.0, meta: '1 USD = 12 620 so\'m' },
    },
    salesTrend: [
      { date: '1-hafta', uzs: 280000000, usd: 21200 },
      { date: '2-hafta', uzs: 312000000, usd: 23620 },
      { date: '3-hafta', uzs: 298000000, usd: 22560 },
      { date: '4-hafta', uzs: 394000000, usd: 29760 },
    ],
    paymentSplit: [
      { name: 'Naqd', value: 70, color: '#2563EB' },
      { name: 'Nasiya', value: 30, color: '#16A34A' },
    ],
    topProducts: [
      { name: 'Samsung A54', qty: 720, revenueUzs: "288 000 000 so'm", revenueUsd: '$21,780.00' },
      { name: 'Wireless Earbuds', qty: 1260, revenueUzs: "252 000 000 so'm", revenueUsd: '$19,060.00' },
      { name: 'iPhone 15 Case', qty: 2670, revenueUzs: "133 500 000 so'm", revenueUsd: '$10,100.00' },
      { name: 'USB-C Cable 2m', qty: 4680, revenueUzs: "93 600 000 so'm", revenueUsd: '$7,080.00' },
      { name: 'Screen Protector', qty: 6030, revenueUzs: "60 300 000 so'm", revenueUsd: '$4,560.00' },
    ],
    recentActivity: [
      { id: '1', text: 'Oylik yopish boshlandi', time: '3 soat oldin', type: 'report' },
      { id: '2', text: 'Valyuta kursi 12 620 ga yangilandi', time: '1 kun oldin', type: 'currency' },
    ],
  },
  yearly: {
    kpis: {
      totalSales: { uzs: "14 520 000 000 so'm", usd: '$1,099,840.00', trend: 22.8, meta: '42 180 ta tranzaksiya' },
      saleCount: { value: '42,180', trend: 18.4, meta: 'O\'rtacha 344 240 so\'m' },
      avgSale: { uzs: "344 240 so'm", usd: '$26.04', trend: 3.7 },
      cashSales: { uzs: "10 164 000 000 so'm", usd: '$769,888.00', trend: 21.2, meta: '70% jami savdodan' },
      grossProfit: { uzs: "3 542 880 000 so'm", usd: '$268,160.00', trend: 24.1 },
      grossMargin: { value: '24.4%', trend: 0.3 },
      cogs: { uzs: "10 977 120 000 so'm", usd: '$831,680.00', trend: 22.5 },
      outstandingDebt: { uzs: "128 500 000 so'm", usd: '$9,720.00', trend: -2.1, meta: '34 ta mijozda qarz' },
      payments: { uzs: "2 280 000 000 so'm", usd: '$172,580.00', trend: 28.6, meta: '4 820 ta to\'lov' },
      newDebt: { uzs: "1 356 000 000 so'm", usd: '$102,540.00', trend: 8.4 },
      overdueDebt: { uzs: "22 100 000 so'm", usd: '$1,672.00', trend: 1.2, meta: '7 ta mijozning muddati o\'tgan' },
      inventoryValue: { uzs: "890 000 000 so'm", usd: '$67,320.00', trend: 0.8, meta: 'Sotuv narxlari bo\'yicha' },
      exchangeRate: { value: '12 620 so\'m', trend: 0.0, meta: '1 USD = 12 620 so\'m' },
    },
    salesTrend: [
      { date: 'Yan', uzs: 980000000, usd: 74200 },
      { date: 'Mar', uzs: 1120000000, usd: 84700 },
      { date: 'May', uzs: 1280000000, usd: 96800 },
      { date: 'Iyul', uzs: 1180000000, usd: 89200 },
      { date: 'Sen', uzs: 1350000000, usd: 102100 },
      { date: 'Noy', uzs: 1420000000, usd: 107400 },
    ],
    paymentSplit: [
      { name: 'Naqd', value: 70, color: '#2563EB' },
      { name: 'Nasiya', value: 30, color: '#16A34A' },
    ],
    topProducts: [
      { name: 'Samsung A54', qty: 8640, revenueUzs: "3 456 000 000 so'm", revenueUsd: '$261,360.00' },
      { name: 'Wireless Earbuds', qty: 15120, revenueUzs: "3 024 000 000 so'm", revenueUsd: '$228,720.00' },
      { name: 'iPhone 15 Case', qty: 32040, revenueUzs: "1 602 000 000 so'm", revenueUsd: '$121,200.00' },
      { name: 'USB-C Cable 2m', qty: 56160, revenueUzs: "1 123 200 000 so'm", revenueUsd: '$84,960.00' },
      { name: 'Screen Protector', qty: 72360, revenueUzs: "723 600 000 so'm", revenueUsd: '$54,720.00' },
    ],
    recentActivity: [
      { id: '1', text: 'Yillik xulosa mavjud', time: '2 kun oldin', type: 'report' },
    ],
  },
  custom: {
    kpis: {
      totalSales: { uzs: "156 400 000 so'm", usd: '$11,840.00', trend: 9.4, meta: '468 ta tranzaksiya' },
      saleCount: { value: '468', trend: 7.2, meta: 'O\'rtacha 334 188 so\'m' },
      avgSale: { uzs: "334 188 so'm", usd: '$25.30', trend: 2.0 },
      cashSales: { uzs: "109 480 000 so'm", usd: '$8,288.00', trend: 8.1, meta: '70% jami savdodan' },
      grossProfit: { uzs: "38 161 600 so'm", usd: '$2,888.96', trend: 10.2 },
      grossMargin: { value: '24.4%', trend: 0.2 },
      cogs: { uzs: "118 238 400 so'm", usd: '$8,951.04', trend: 9.0 },
      outstandingDebt: { uzs: "128 500 000 so'm", usd: '$9,720.00', trend: -2.1, meta: '34 ta mijozda qarz' },
      payments: { uzs: "24 800 000 so'm", usd: '$1,876.00', trend: 14.8, meta: '52 ta to\'lov' },
      newDebt: { uzs: "14 200 000 so'm", usd: '$1,074.00', trend: 2.8 },
      overdueDebt: { uzs: "22 100 000 so'm", usd: '$1,672.00', trend: 1.2, meta: '7 ta mijozning muddati o\'tgan' },
      inventoryValue: { uzs: "890 000 000 so'm", usd: '$67,320.00', trend: 0.8, meta: 'Sotuv narxlari bo\'yicha' },
      exchangeRate: { value: '12 620 so\'m', trend: 0.0, meta: '1 USD = 12 620 so\'m' },
    },
    salesTrend: [
      { date: '1-kun', uzs: 22000000, usd: 1665 },
      { date: '5-kun', uzs: 48000000, usd: 3630 },
      { date: '10-kun', uzs: 72000000, usd: 5445 },
      { date: '15-kun', uzs: 98000000, usd: 7410 },
      { date: '20-kun', uzs: 124000000, usd: 9375 },
      { date: '25-kun', uzs: 156400000, usd: 11840 },
    ],
    paymentSplit: [
      { name: 'Naqd', value: 70, color: '#2563EB' },
      { name: 'Nasiya', value: 30, color: '#16A34A' },
    ],
    topProducts: [
      { name: 'Samsung A54', qty: 88, revenueUzs: "35 200 000 so'm", revenueUsd: '$2,660.00' },
      { name: 'Wireless Earbuds', qty: 154, revenueUzs: "30 800 000 so'm", revenueUsd: '$2,330.00' },
      { name: 'iPhone 15 Case', qty: 326, revenueUzs: "16 300 000 so'm", revenueUsd: '$1,233.00' },
    ],
    recentActivity: [
      { id: '1', text: 'Maxsus davr tanlandi', time: 'Hozir', type: 'report' },
    ],
  },
};
