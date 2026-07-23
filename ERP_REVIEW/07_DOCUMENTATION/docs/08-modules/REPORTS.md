# Reports Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Reports module provides comprehensive business reporting with export capabilities in PDF, Excel, and CSV formats. Reports cover sales, inventory, debt, profit, and operational metrics — all respecting company isolation, dual-currency separation, and frozen exchange rates. Reports are generated server-side to ensure data accuracy and support large datasets common in high-volume wholesale operations.

---

## 2. Export Formats

### 2.1 PDF

| Aspect | Specification |
|--------|--------------|
| Engine | Server-side HTML-to-PDF rendering |
| Use case | Formal reports, printing, sharing with stakeholders |
| Features | Company logo, headers/footers, page numbers, date range |
| Branding | Company name, branch, generation timestamp |
| Language | Uzbek / Russian labels (configurable) |

### 2.2 Excel (XLSX)

| Aspect | Specification |
|--------|--------------|
| Engine | Server-side XLSX generation |
| Use case | Further analysis, pivot tables, accountant workflows |
| Features | Multiple sheets, formatted numbers, column headers, totals row |
| Limits | Up to 100,000 rows per export |

### 2.3 CSV

| Aspect | Specification |
|--------|--------------|
| Engine | Server-side CSV generation |
| Use case | Data import to other systems, lightweight export |
| Encoding | UTF-8 with BOM (Excel compatibility) |
| Delimiter | Comma (configurable to semicolon) |
| Limits | Up to 500,000 rows per export |

### 2.4 Export Workflow

```
1. User selects report type
2. Sets parameters (date range, filters, currency)
3. Previews summary (row count, date range, totals)
4. Selects format: PDF | Excel | CSV
5. System generates report asynchronously (for large datasets)
6. Download link provided; notification on completion
7. Generated file available for 24 hours
```

---

## 3. Report Catalog

### 3.1 Sales Reports

| Report | Description | Key Columns |
|--------|-------------|-------------|
| **Daily Sales Summary** | Sales totals by day | Date, sale count, total UZS, total USD, cash, credit |
| **Sales Detail** | Every sale in period | Sale #, date, customer, cashier, items, total, payment type |
| **Sales by Product** | Revenue per product | SKU, name, qty sold, revenue UZS, revenue USD, COGS, profit |
| **Sales by Category** | Revenue per category | Category, qty, revenue UZS, revenue USD |
| **Sales by Cashier** | Performance per cashier | Cashier, sale count, total UZS, total USD |
| **Sales by Branch** | Revenue per branch | Branch, sale count, total UZS, total USD |
| **Returns Report** | All returns in period | Return #, original sale, items, amount, reason |

### 3.2 Inventory Reports

| Report | Description | Key Columns |
|--------|-------------|-------------|
| **Stock Level** | Current stock all products | SKU, name, warehouse, qty, value UZS, value USD |
| **Stock Valuation** | Inventory value summary | Category, total units, value UZS, value USD |
| **Low Stock** | Products below minimum | SKU, name, current qty, min level, deficit |
| **Movement History** | All movements in period | Date, product, type, qty, warehouse, reference, user |
| **Batch Report** | Active batches detail | Batch #, product, qty remaining, cost UZS, cost USD, age |
| **Batch Aging** | Stock age analysis | Product, batch, qty, days since receipt |

### 3.3 Debt Reports

| Report | Description | Key Columns |
|--------|-------------|-------------|
| **Debt Summary** | All customers with debt | Customer, phone, debt UZS, debt USD, last payment |
| **Debt Aging** | Aging bucket analysis | Customer, current, 8-30d, 31-60d, 61-90d, 90+d |
| **Payment History** | All payments in period | Date, customer, amount, currency, type, received by |
| **Top Debtors** | Highest debt balances | Customer, debt UZS, debt USD, oldest debt date |

### 3.4 Financial Reports

| Report | Description | Key Columns |
|--------|-------------|-------------|
| **Gross Profit** | Revenue minus COGS | Period, revenue UZS, revenue USD, COGS UZS, COGS USD, profit |
| **Profit by Product** | Per-product profitability | SKU, name, revenue, COGS, gross profit, margin % |
| **Profit by Category** | Per-category profitability | Category, revenue, COGS, profit, margin % |
| **COGS Detail** | FIFO allocation detail | Sale #, product, batch, qty, unit cost, total COGS |

### 3.5 Operational Reports

| Report | Description | Key Columns |
|--------|-------------|-------------|
| **Cashier Reconciliation** | End-of-day cash count | Cashier, expected cash, actual, variance |
| **Exchange Rate History** | Rate changes over time | Date, rate, set by, notes |
| **Audit Log Export** | System activity log | Timestamp, user, action, entity, old/new values |
| **User Activity** | User actions summary | User, login count, sales count, last active |

---

## 4. Report Parameters

### 4.1 Common Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `date_from` | Date | Start of reporting period |
| `date_to` | Date | End of reporting period |
| `branch_id` | UUID | Filter by branch (optional) |
| `warehouse_id` | UUID | Filter by warehouse (optional) |
| `currency` | Enum | `UZS`, `USD`, `BOTH` (default: both columns) |
| `format` | Enum | `PDF`, `XLSX`, `CSV` |

### 4.2 Quick Date Presets

| Preset | Range |
|--------|-------|
| Today | Current day |
| Yesterday | Previous day |
| This Week | Monday to today |
| This Month | 1st to today |
| Last Month | Full previous month |
| This Quarter | Quarter start to today |
| This Year | January 1 to today |
| Custom | User-defined range |

---

## 5. Report Generation

### 5.1 Synchronous vs Asynchronous

| Condition | Mode |
|-----------|------|
| Estimated rows < 1,000 | Synchronous (immediate download) |
| Estimated rows ≥ 1,000 | Asynchronous (background job) |

### 5.2 Background Job Flow

```
1. Report job queued
2. User sees "Generating..." with progress indicator
3. Job executes with company_id scope
4. File stored in temporary storage
5. Notification sent: "Report ready for download"
6. Download link active for 24 hours
7. File auto-deleted after 24 hours
```

### 5.3 Scheduled Reports (Future)

Registered for Phase 2:
- Daily sales summary emailed at 20:00
- Weekly debt aging report
- Monthly profit report

---

## 6. Report UI

### 6.1 Report Center Layout

```
┌─────────────────────────────────────────────────────────────┐
│  REPORTS                                                    │
├──────────────────┬──────────────────────────────────────────┤
│  Categories      │  Report Detail                           │
│                  │                                          │
│  ► Sales         │  Daily Sales Summary                     │
│    Inventory     │  ─────────────────────────────────────   │
│    Debt          │  Period: [This Month ▼]                  │
│    Financial     │  Branch:  [All Branches ▼]               │
│    Operational   │  Format:  ○ PDF  ● Excel  ○ CSV         │
│                  │                                          │
│                  │  Preview: 342 sales, 45.2M UZS, $3,420  │
│                  │                                          │
│                  │  [Generate Report]                       │
├──────────────────┴──────────────────────────────────────────┤
│  Recent Reports                                             │
│  Daily Sales Jun 17 — Excel — 2 min ago — [Download]       │
│  Debt Aging Jun 16 — PDF — yesterday — [Download]            │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Data Integrity

### 7.1 Scoping Rules

| Rule | Description |
|------|-------------|
| REP-01 | All reports scoped to JWT `company_id` |
| REP-02 | Branch filter further scopes within company |
| REP-03 | No cross-company data in any report |
| REP-04 | Cancelled sales excluded from revenue reports |
| REP-05 | Returns shown as separate line items (not netted) |

### 7.2 Currency Handling

- UZS and USD columns shown separately (never converted totals)
- Frozen exchange rates used for any cross-reference display
- Profit calculated per currency independently

---

## 8. Permissions

| Permission | Description |
|------------|-------------|
| `reports.view` | Access report center |
| `reports.sales` | Generate sales reports |
| `reports.inventory` | Generate inventory reports |
| `reports.debt` | Generate debt reports |
| `reports.financial` | Generate profit/COGS reports |
| `reports.audit` | Generate audit log exports |
| `reports.schedule` | Schedule recurring reports (future) |

---

## 9. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports/catalog` | Available report types |
| POST | `/api/v1/reports/generate` | Generate report (returns job ID or file) |
| GET | `/api/v1/reports/jobs/:id` | Check generation status |
| GET | `/api/v1/reports/jobs/:id/download` | Download completed report |
| GET | `/api/v1/reports/history` | User's recent reports |

---

## 10. Related Documents

- [SALES.md](./SALES.md)
- [INVENTORY.md](./INVENTORY.md)
- [DEBT_MANAGEMENT.md](./DEBT_MANAGEMENT.md)
- [FIFO.md](./FIFO.md)
- [DASHBOARD.md](./DASHBOARD.md)
- [AUDIT_LOGS.md](./AUDIT_LOGS.md)
