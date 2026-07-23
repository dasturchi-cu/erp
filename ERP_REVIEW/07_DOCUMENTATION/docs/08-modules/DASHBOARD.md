# Dashboard Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Dashboard module provides real-time and period-based Key Performance Indicators (KPIs) for business owners and managers. It aggregates data from Sales, Debt, Inventory, and Products modules into a unified view with dual-currency display (UZS and USD), configurable time periods, and top-product rankings. The dashboard updates in real time via WebSocket events as sales and payments occur throughout the business day.

---

## 2. Time Periods

### 2.1 Available Periods

| Period | Range | Comparison |
|--------|-------|------------|
| **Daily** | Today (00:00 – now) | vs. yesterday |
| **Weekly** | Current week (Mon – now) | vs. previous week |
| **Monthly** | Current month (1st – now) | vs. previous month |
| **Yearly** | Current year (Jan 1 – now) | vs. previous year |
| **Custom** | User-defined date range | vs. equivalent prior period |

### 2.2 Period Selector

```
┌─────────────────────────────────────────────────────┐
│  [Today] [This Week] [This Month] [This Year] [📅]  │
└─────────────────────────────────────────────────────┘
```

Period selection persists per user session. All dashboard widgets update simultaneously when period changes.

---

## 3. KPI Widgets

### 3.1 Revenue KPIs

| KPI | Description | Display |
|-----|-------------|---------|
| **Total Sales** | Gross sales revenue | UZS and USD side by side |
| **Sale Count** | Number of completed transactions | Count with trend arrow |
| **Average Sale Value** | Total sales ÷ sale count | Per currency |
| **Cash Sales** | Sales with full cash payment | UZS and USD |
| **Credit Sales** | Sales creating debt | UZS and USD |

```
┌──────────────────────┐  ┌──────────────────────┐
│  TOTAL SALES (Today) │  │  SALE COUNT (Today)  │
│                      │  │                      │
│  45,200,000 UZS      │  │  127 transactions    │
│  $3,420.00 USD       │  │  ▲ 12% vs yesterday  │
│  ▲ 8% vs yesterday   │  │                      │
└──────────────────────┘  └──────────────────────┘
```

### 3.2 Profit KPIs

| KPI | Description | Display |
|-----|-------------|---------|
| **Gross Profit** | Revenue − COGS (FIFO) | UZS and USD |
| **Gross Margin** | Gross profit ÷ revenue × 100 | Percentage per currency |
| **COGS** | Total cost of goods sold | UZS and USD |

### 3.3 Debt KPIs

| KPI | Description | Display |
|-----|-------------|---------|
| **Outstanding Debt** | Total receivable | UZS and USD |
| **Payments Received** | Payments in period | UZS and USD |
| **New Debt Created** | Credit sales debt in period | UZS and USD |
| **Overdue Debt** | Debt older than 30 days | UZS and USD, customer count |

```
┌──────────────────────┐  ┌──────────────────────┐
│  OUTSTANDING DEBT    │  │  PAYMENTS (Today)    │
│                      │  │                      │
│  128,500,000 UZS     │  │  8,200,000 UZS       │
│  $18,750.00 USD      │  │  $650.00 USD         │
│  42 customers        │  │  15 payments         │
└──────────────────────┘  └──────────────────────┘
```

### 3.4 Inventory KPIs

| KPI | Description | Display |
|-----|-------------|---------|
| **Catalog Value** | Total stock value at sale prices | UZS and USD |
| **Product Count** | Active products with/without stock | Count |
| **Low Stock Alerts** | Products below minimum level | Count with link |
| **Out of Stock** | Products with zero stock | Count with link |

### 3.5 Exchange Rate Widget

```
┌──────────────────────┐
│  EXCHANGE RATE       │
│  1 USD = 12,750 UZS  │
│  Updated: Jun 17     │
└──────────────────────┘
```

---

## 4. Top Products

### 4.1 Rankings

| Ranking | Sort By | Default Count |
|---------|---------|---------------|
| **Top Selling (Qty)** | Units sold in period | Top 10 |
| **Top Selling (Revenue)** | Revenue in period | Top 10 |
| **Top Profit** | Gross profit in period | Top 10 |
| **Slow Moving** | Lowest sales in period | Bottom 10 |

### 4.2 Top Products Table

```
┌──────────────────────────────────────────────────────────────┐
│  TOP PRODUCTS (This Month)                    [By Revenue ▼] │
├────┬──────────────────┬──────┬────────────┬──────────┬───────┤
│  # │ Product          │ Qty  │ Revenue UZS│ Rev USD  │ Profit│
├────┼──────────────────┼──────┼────────────┼──────────┼───────┤
│  1 │ Cement 50kg      │  450 │ 20,250,000 │ $1,588   │ 4.2M  │
│  2 │ Brick Standard   │ 8000 │ 4,000,000  │  $314    │ 1.1M  │
│  3 │ Silicone 300ml   │  320 │ 3,840,000  │  $301    │ 1.8M  │
│  4 │ Power Drill XT   │   45 │ 11,250,000 │  $882    │ 2.9M  │
│  5 │ Insulation Roll  │  120 │ 2,400,000  │  $188    │  720K │
└────┴──────────────────┴──────┴────────────┴──────────┴───────┘
```

### 4.3 Top Products Chart

Bar chart visualization of top 5 products by selected metric. Toggle between UZS and USD display.

---

## 5. Charts and Visualizations

### 5.1 Sales Trend

Line chart showing daily sales over selected period:

```
Revenue (UZS millions)
 50 ┤                    ╭─╮
 40 ┤              ╭─╮  │ │
 30 ┤        ╭─╮  │ │  │ │  ╭─
 20 ┤   ╭─╮  │ │  │ │  │ │  │ │
 10 ┤╭─╮│ │  │ │  │ │  │ │  │ │
  0 ┼┴─┴┴─┴──┴─┴──┴─┴──┴─┴──┴─┴─
    Mon Tue Wed Thu Fri Sat Sun
```

### 5.2 Payment vs Credit Split

Donut chart showing cash vs credit sales ratio for the period.

### 5.3 Debt Aging Distribution

Stacked bar showing debt distribution across aging buckets.

---

## 6. Real-Time Updates

### 6.1 WebSocket Events

Dashboard subscribes to company-scoped events:

| Event | Widget Updated |
|-------|---------------|
| `sale.completed` | Revenue, sale count, top products |
| `debt.payment_received` | Payments, outstanding debt |
| `inventory.stock_changed` | Catalog value, stock alerts |
| `currency.rate_changed` | Exchange rate widget |

### 6.2 Update Behavior

- KPI numbers animate on change (count-up effect)
- Trend arrows recalculate on period comparison
- Top products table re-sorts if ranking changes
- No full page reload required

### 6.3 Reconnection

On WebSocket disconnect:
1. Client shows "Reconnecting..." indicator
2. On reconnect, fetches delta since last event ID
3. Reconciles all widget values with server state

---

## 7. Role-Based Views

| Role | Default Dashboard |
|------|-------------------|
| **Owner / Admin** | Full dashboard — all KPIs, charts, top products |
| **Manager** | Sales, debt, inventory KPIs; top products |
| **Cashier** | Personal sales today; branch sales summary |
| **Warehouse** | Inventory KPIs; low stock; receiving summary |

Users see only widgets permitted by their role. Widget layout customizable via drag-and-drop (saved per user).

---

## 8. Branch Filtering

Multi-branch companies can filter dashboard by branch:

```
Branch: [All Branches ▼]  or  [Tashkent Main ▼]
```

- "All Branches" — aggregated company-wide KPIs
- Specific branch — scoped to branch sales, debt, inventory

---

## 9. Permissions

| Permission | Description |
|------------|-------------|
| `dashboard.view` | Access dashboard |
| `dashboard.revenue` | View revenue and profit KPIs |
| `dashboard.debt` | View debt KPIs |
| `dashboard.inventory` | View inventory KPIs |
| `dashboard.top_products` | View product rankings |

---

## 10. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/kpis` | All KPI values for period |
| GET | `/api/v1/dashboard/top-products` | Product rankings |
| GET | `/api/v1/dashboard/sales-trend` | Daily sales trend data |
| GET | `/api/v1/dashboard/debt-aging` | Debt aging distribution |

---

## 11. Performance

| Metric | Target |
|--------|--------|
| Initial load | < 2 seconds |
| Period change | < 500ms |
| Real-time update latency | < 1 second from event |
| KPI data freshness | Real-time (event-driven) + 5-minute cache fallback |

---

## 12. Related Documents

- [SALES.md](./SALES.md)
- [DEBT_MANAGEMENT.md](./DEBT_MANAGEMENT.md)
- [INVENTORY.md](./INVENTORY.md)
- [CURRENCY_UZS_USD.md](./CURRENCY_UZS_USD.md)
- [REPORTS.md](./REPORTS.md)
- [NOTIFICATIONS.md](./NOTIFICATIONS.md)
