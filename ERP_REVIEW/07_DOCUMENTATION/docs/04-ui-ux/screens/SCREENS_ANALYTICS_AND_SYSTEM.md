# Screen Specifications — Analytics & System

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Figma Handoff |
| Last Updated | 2026-06-17 |
| Audience | Product Design, Frontend, Mobile, QA, Automation |
| Parent Document | [UI_UX_MASTER_BLUEPRINT.md](../UI_UX_MASTER_BLUEPRINT.md) |
| Screen Registry | [SCREEN_HIERARCHY.md](../SCREEN_HIERARCHY.md) |
| Figma Page | `06 — Analytics & System` |

---

## 1. Purpose

This document provides **standalone, Figma-ready screen specifications** for analytics, reporting, notifications, and company settings surfaces. Each screen includes complete metadata, wireframes, component specs, states, responsive behavior, and accessibility requirements.

**Out of scope**: API contracts, business logic, implementation code.

### 1.1 Per-Screen Template

Every screen in this document follows the same structure:

| Section | Description |
|---------|-------------|
| **Screen Metadata** | ID, route, permissions, platform, shell |
| **Purpose** | Business goal and user intent |
| **Cross-References** | Related UX and module documents |
| **Access & Permissions** | Roles and permission gates |
| **Entry & Exit Points** | Navigation origins and destinations |
| **Page Shell** | Global layout within app chrome |
| **Desktop Wireframe** | ASCII wireframe at primary breakpoint |
| **Layout & Sections** | Section-by-section specification |
| **Components & Controls** | UI elements with dimensions and behavior |
| **Interactions** | User actions and system responses |
| **States** | Loading, empty, error, offline |
| **Tablet Adaptation** | 768–1023px behavior |
| **Mobile Adaptation** | 320–767px behavior |
| **Real-Time Behavior** | WebSocket and live update rules |
| **Accessibility** | WCAG and keyboard requirements |

### 1.2 Shared Shell

All screens in this document use **App Shell** layout unless noted:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TopBar (56px) — logo, company switcher, search, notifications, avatar    │
├────────┬───────────────────────────────────────────────────────────────────┤
│Sidebar │ Breadcrumbs + page content area                                   │
│ 240px  │                                                                   │
│        │                                                                   │
└────────┴───────────────────────────────────────────────────────────────────┘
```

| Shell Element | Spec |
|---------------|------|
| TopBar height | 56px fixed |
| Sidebar width | 240px expanded; 64px collapsed at `lg` |
| Content padding | 24px desktop; 16px tablet/mobile |
| Breadcrumb row | 32px height, `body-sm` muted |

---

## 2. Dashboard (SCR-030)

### 2.1 Screen Metadata

| Field | Value |
|-------|-------|
| **Screen ID** | SCR-030 |
| **Name** | Dashboard |
| **Route** | `/dashboard` |
| **Parent** | — (root landing for privileged roles) |
| **Permission** | `dashboard.view` |
| **Module** | `dashboard` |
| **Platform** | Desktop, Tablet, Mobile (Both) |
| **Shell** | App Shell |
| **Typical Roles** | Owner, Company Admin, Manager, Cashier (variant), Warehouse (variant) |
| **Figma Frame** | `Screens / Dashboard / Desktop XL / Default / Manager` |

### 2.2 Purpose

Real-time operational KPI dashboard for business decision-making. Displays dual-currency revenue, profit, debt, and inventory metrics with interactive charts, top products, and a live activity feed. Serves as the default landing screen for management roles after login.

### 2.3 Cross-References

- [DASHBOARD_UX.md](../DASHBOARD_UX.md) — authoritative widget-level design tokens and chart specs
- [DASHBOARD.md](../../08-modules/DASHBOARD.md) — business KPI definitions
- [CURRENCY_UZS_USD.md](../../08-modules/CURRENCY_UZS_USD.md) — dual-currency display rules
- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — typography and color tokens

### 2.4 Access & Permissions

| Permission | Grants |
|------------|--------|
| `dashboard.view` | Page access, exchange rate widget, activity feed (filtered) |
| `dashboard.revenue` | Revenue KPIs, profit KPIs, sales charts |
| `dashboard.debt` | Debt KPIs, debt aging chart, payment activity |
| `dashboard.inventory` | Inventory KPIs, stock activity |
| `dashboard.top_products` | Top products table and bar chart |

Cashier and Warehouse roles receive **reduced layouts** per role presets (see Section 2.14).

### 2.5 Entry & Exit Points

| Entry Point | Condition |
|-------------|-----------|
| Post-login default | Owner, Admin, Manager roles |
| Sidebar "Dashboard" | `dashboard.view` |
| Command palette | "Go to Dashboard" |
| KPI drill-down return | Back navigation from child screens |

| Exit Point | Trigger |
|------------|---------|
| `/sales/history` | KPI or chart drill-down |
| `/products/:id` | Top product row click |
| `/customers` | Debt KPI drill-down |
| `/inventory/stock` | Inventory KPI drill-down |
| `/reports/sales` | Average sale value KPI |
| `/settings/exchange-rates` | Exchange rate widget (if `currency.manage`) |

### 2.6 Page Shell

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TopBar (56px) — global; not part of dashboard grid                         │
├────────┬───────────────────────────────────────────────────────────────────┤
│Sidebar │ Breadcrumbs: Dashboard                          (32px row)        │
│ 240px  ├───────────────────────────────────────────────────────────────────┤
│        │ PAGE HEADER ROW (auto height, min 72px)                         │
│        │  Dashboard (H1)          [Branch ▼] [Period] [Currency] [⟳]    │
│        ├───────────────────────────────────────────────────────────────────┤
│        │ 12-COLUMN GRID — widgets below                                    │
│        │                                                                   │
└────────┴───────────────────────────────────────────────────────────────────┘
```

### 2.7 Desktop Wireframe (1280px — 12-column grid)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Dashboard                    [All Branches ▼] [Today|Week|Month|Year|📅] │
│  Market · Today              Currency: [UZS][USD][Both]        [⟳] 14:32  │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│ TOTAL SALES  │ SALE COUNT   │ AVG SALE     │ CASH SALES   │ (col 4)      │
│ 45.2M so'm   │ 127          │ 355K so'm    │ 38.1M so'm   │ CREDIT SALES │
│ ▲ 8.2%       │ ▲ 5.1%       │ ▼ 1.2%       │ 84% of total │ 7.1M so'm    │
├──────────────┴──────────────┴──────────────┴──────────────┴──────────────┤
│ GROSS PROFIT (4)     │ GROSS MARGIN (4)     │ COGS (4)                    │
├──────────────────────┴──────────────────────┴────────────────────────────┤
│ OUTSTANDING DEBT │ PAYMENTS TODAY │ NEW DEBT    │ OVERDUE DEBT             │
├──────────────────┴────────────────┴─────────────┴────────────────────────┤
│ INV VALUE │ PRODUCTS │ LOW STOCK │ EXCHANGE RATE 1 USD = 12,800 UZS       │
├───────────────────────────────────────────────┬──────────────────────────┤
│ Sales Trend (8 col)                           │ Cash vs Credit Donut (4) │
│ [line/bar chart — hourly/daily/monthly]       │ [donut chart]            │
├───────────────────────────────┬───────────────┴──────────────────────────┤
│ Debt Aging (6 col)            │ Top Products Table (6 col)               │
├───────────────────────────────┴──────────────────────────────────────────┤
│ Recent Activity (5 col)       │ Top 5 Products Bar Chart (7 col)         │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.8 Layout & Sections

#### 2.8.1 Page Header

| Element | Spec |
|---------|------|
| Page title | `heading-1` 30px / 700 — "Dashboard" / "Boshqaruv paneli" |
| Subtitle | `body-sm` muted — "{company} · {period label}" |
| Branch selector | `Select` searchable, 200px; hidden for single-branch companies |
| Period selector | Segmented control 36px + custom date range popover |
| Currency toggle | Three-way segmented: UZS / USD / Both |
| Refresh button | Ghost icon 36×36px, `RefreshCw`; tooltip "Refresh data" |
| Last updated | `body-sm` muted — "Updated 14:32" |

**Period segments**: Today, This Week, This Month, This Year, Custom (max 366 days).

**Currency formatting**:
- UZS: `45 200 000 so'm` (space-separated thousands)
- USD: `$3,420.00` (comma thousands, 2 decimals)

#### 2.8.2 KPI Rows (StatCard widgets)

| Row | Widgets | Col Span | Height | Permission |
|-----|---------|----------|--------|------------|
| Revenue | Total Sales, Sale Count, Avg Sale, Cash Sales, Credit Sales | 3+3+3+3 or 4+4+4 | 120px | `dashboard.revenue` |
| Profit | Gross Profit, Gross Margin, COGS | 4+4+4 | 120px | `dashboard.revenue` |
| Debt | Outstanding Debt, Payments, New Debt, Overdue | 3+3+3+3 | 120px | `dashboard.debt` |
| Inventory | Inventory Value, Product Count, Low Stock, Out of Stock | 3+3+3+3 | 120px | `dashboard.inventory` |
| Exchange | Exchange Rate widget | 3 (same row as inventory) | 120px | `dashboard.view` |

**StatCard structure**: Label (12px uppercase) → Primary value (28px mono) → Secondary value (Both mode) → Trend row (icon + % + comparison period) → Meta row.

**Trend colors**: Up positive = green; down = red; flat (±0.5%) = muted. Debt KPI exception: debt increase = red.

#### 2.8.3 Sales Trend Chart (8 columns)

| Property | Value |
|----------|-------|
| Title | "Sales Trend" + dynamic date subtitle |
| Height | 320px chart area |
| Type | Hourly (Today), Daily (Week/Month), Monthly (Year), adaptive for Custom |
| Series | UZS `#2563EB`, USD `#16A34A`, comparison dashed `#94A3B8` |
| Interactions | Hover tooltip; click point → `/sales/history?date={date}` |

#### 2.8.4 Cash vs Credit Donut (4 columns)

| Property | Value |
|----------|-------|
| Title | "Cash vs Credit" |
| Segments | Cash (blue), Credit (amber), Partial (slate) |
| Center | Total sale count |
| Click segment | Filter sales history by payment type |

#### 2.8.5 Debt Aging Chart (6 columns)

| Property | Value |
|----------|-------|
| Title | "Debt Aging" |
| Type | Horizontal stacked bar |
| Buckets | 0–7d, 8–30d, 31–60d, 61–90d, 90d+ |
| Click bucket | → `/customers?filter=aging_{bucket}` |

#### 2.8.6 Top Products Table (6 columns)

| Column | Width | Notes |
|--------|-------|-------|
| # | 40px | Rank 1–10 |
| Product | flex | Name + SKU muted |
| Qty | 80px | Units sold |
| Revenue UZS | 120px | Hidden in USD-only mode |
| Revenue USD | 100px | Hidden in UZS-only mode |
| Profit | 100px | Abbreviated (e.g. 4.2M) |

Sort dropdown: By Revenue, By Quantity, By Profit, Slow Moving.

#### 2.8.7 Recent Activity Feed (5 columns)

| Property | Value |
|----------|-------|
| Title | "Recent Activity" |
| Max items | 25 visible; virtual scroll |
| Item height | 64px min |
| Events | Sale, payment, stock, low stock, rate change (permission-gated) |
| Footer | "View all" → audit logs or activity report |

#### 2.8.8 Top Products Bar Chart (7 columns)

Horizontal bar chart, top 5 by selected metric; synced with table sort. Click bar → product detail.

### 2.9 Components & Controls

| Component | Usage |
|-----------|-------|
| `StatCard` | All KPI widgets |
| `PeriodSelector` | Header period control |
| `CurrencyToggle` | Header currency control |
| `BranchSelector` | Multi-branch filter |
| `SalesChart` | Sales trend |
| `DonutChart` | Payment split |
| `DebtAgingChart` | Debt buckets |
| `TopProductsTable` | Product ranking |
| `ActivityFeed` | Live event stream |
| `ConnectionIndicator` | TopBar — live/stale state |

### 2.10 Interactions

| Action | Behavior |
|--------|----------|
| Change period | Debounce 300ms; all widgets skeleton → crossfade 150ms |
| Change branch | All widgets reload; skeleton overlay 200ms minimum |
| Change currency | Display filter only; no data refetch |
| Click KPI card | Navigate to drill-down route (cursor pointer when enabled) |
| Manual refresh | Full reload; icon spins; preserves period/currency |
| Keyboard | Tab through controls; Enter on KPI opens drill-down |

### 2.11 States

| State | Treatment |
|-------|-----------|
| **Loading** | Inline skeleton on all widgets simultaneously; header controls remain interactive |
| **Populated** | Default layout per permissions |
| **Empty (new company)** | Illustration + "No sales yet" + CTA "Create first sale" → POS |
| **Empty period** | Per-widget "No data for this period" in chart areas |
| **Error** | Widget-level error card with Retry; page shell remains functional |
| **Stale (offline)** | Red connection dot; "Stale data" badge on widgets; timestamp frozen |
| **Reconnecting** | Amber banner below header: "Reconnecting…" |

### 2.12 Tablet Adaptation

- Sidebar: overlay drawer via hamburger
- Header controls wrap to second row
- Period selector: horizontal scroll if overflow
- KPI cards: 2 per row (span 2 in 4-column effective grid)
- Charts: full width, 280px height
- Tables: horizontal scroll with frozen first column OR card view
- Touch targets: 44px minimum

### 2.13 Mobile Adaptation

```
┌─────────────────────────┐
│ ☰  Market        🔔 ●  │
├─────────────────────────┤
│ Dashboard               │
│ [Today][Week][Month]…   │
│ [UZS][USD][Both]        │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ TOTAL SALES         │ │
│ │ 45 200 000 so'm     │ │
│ │ ▲ 8% vs yesterday   │ │
│ └─────────────────────┘ │
│ (KPI cards — 1 per row) │
├─────────────────────────┤
│ ○ ● ○ ○  chart carousel │
│ [    Sales Chart      ] │
├─────────────────────────┤
│ Recent Activity (10)    │
│ [See all →]             │
└─────────────────────────┘
```

- Bottom tab: Dashboard = Home tab
- Pull-to-refresh on entire page
- Charts: swipeable carousel with dot indicators, 240px per slide
- Top products: card list with rank badge
- Branch selector: bottom sheet picker

### 2.14 Real-Time Behavior

| Event | Affected Widgets | Animation |
|-------|------------------|-----------|
| `sale.completed` | Revenue KPIs, charts, top products, activity | Count-up 400ms |
| `sale.cancelled` | Same | Count-down |
| `debt.payment_received` | Debt KPIs, activity | Count-up |
| `inventory.stock_changed` | Inventory KPIs, activity | Count-up |
| `currency.rate_changed` | Exchange rate, USD displays | Crossfade |

Debounce rapid events within 500ms. Real-time applies to period-scoped KPIs only when period includes "now" (e.g. Today). Outstanding debt always live.

On reconnect: fetch delta, reconcile widgets, toast "Dashboard updated" (3s).

### 2.15 Accessibility

- KPI values: `aria-live="polite"` on update
- Charts: data table fallback hidden for screen readers; summary text announced
- Period selector: arrow keys move selection; Enter applies
- Color not sole indicator: trend icons accompany color
- Focus ring: 2px `--primary` offset 2px on interactive cards

### 2.16 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `R` | Refresh dashboard data |
| `1–5` | Select period segment (when header focused) |
| `Enter` | Open drill-down for focused KPI |

---

## 3. Reports (SCR-130)

### 3.1 Screen Metadata

| Field | Value |
|-------|-------|
| **Screen ID** | SCR-130 |
| **Name** | Reports |
| **Route** | `/reports` |
| **Parent** | — |
| **Permission** | `reports.view` |
| **Module** | `reports` |
| **Platform** | Desktop, Tablet, Mobile (Both) |
| **Shell** | App Shell |
| **Typical Roles** | Owner, Company Admin, Manager |
| **Figma Frame** | `Screens / Reports / Desktop / Hub Default` |

### 3.2 Purpose

Central catalog for generating, previewing, and downloading business reports. Users browse report categories, configure parameters, export to PDF/Excel/CSV, and access recent export history. Reports respect company isolation, dual-currency separation, and frozen exchange rates.

### 3.3 Cross-References

- [REPORTS.md](../../08-modules/REPORTS.md) — report catalog and export rules
- [USER_FLOWS.md](../USER_FLOWS.md) — Flow 9: Report Export
- [FIFO.md](../../08-modules/FIFO.md) — COGS report accuracy

### 3.4 Access & Permissions

| Permission | Grants |
|------------|--------|
| `reports.view` | Access reports hub and on-screen previews |
| `reports.generate` | Export PDF, Excel, CSV; access Export Center |
| `sales.view` | Sales category reports |
| `inventory.view` | Inventory category reports |
| `debt.view` | Debt category reports |

### 3.5 Entry & Exit Points

| Entry Point | Condition |
|-------------|-----------|
| Sidebar "Reports" | `reports.view` |
| Command palette | "Open Reports" |
| Dashboard KPI drill-down | Pre-filtered report link |
| Notification `REPORT_READY` | Deep link to export detail |

| Exit Point | Trigger |
|------------|---------|
| Report configurator | Select report card |
| `/reports/exports` | "Recent Exports" link |
| Entity detail | Click entity in preview table |
| Notification Center | Export complete notification |

### 3.6 Page Shell

Standard App Shell with breadcrumbs: `Reports`.

### 3.7 Desktop Wireframe

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Reports                                              [Recent Exports →]   │
│  Generate and download business reports                                    │
├────────────────────────────────────────────────────────────────────────────┤
│ [Search reports...]                              [Category ▼] [Clear]      │
├────────────────────────────────────────────────────────────────────────────┤
│ SALES REPORTS                                                              │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│ │ 📊 Daily Sales  │ │ 📋 Sales Detail │ │ 📦 By Product   │               │
│ │ Summary         │ │                 │ │                 │               │
│ │ PDF·Excel·CSV   │ │ PDF·Excel·CSV   │ │ PDF·Excel·CSV   │               │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│ │ By Category     │ │ By Cashier      │ │ By Branch       │               │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘               │
├────────────────────────────────────────────────────────────────────────────┤
│ INVENTORY REPORTS                                                          │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│ │ Stock Level     │ │ Stock Valuation │ │ Low Stock       │               │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘               │
├────────────────────────────────────────────────────────────────────────────┤
│ DEBT REPORTS          │  FINANCIAL REPORTS                                 │
│ ┌─────────────────┐   │  ┌─────────────────┐ ┌─────────────────┐          │
│ │ Debt Summary    │   │  │ Gross Profit    │ │ Profit by Product│          │
│ │ Debt Aging      │   │  └─────────────────┘ └─────────────────┘          │
│ └─────────────────┘   │                                                    │
├────────────────────────────────────────────────────────────────────────────┤
│ RECENT EXPORTS (last 5)                                                    │
│ Daily Sales · Jun 17 · PDF · ✓ Ready · [Download]                         │
│ Debt Aging · Jun 16 · Excel · ✓ Ready · [Download]                        │
│                                              [View all exports →]          │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.8 Layout & Sections

#### 3.8.1 Section Header

| Element | Spec |
|---------|------|
| Title | `heading-1` — "Reports" |
| Description | `body` muted — "Generate and download business reports" |
| Secondary action | Ghost link "Recent Exports" → `/reports/exports` |

#### 3.8.2 Filter Bar

| Control | Spec |
|---------|------|
| Search | 280px, debounce 300ms; filters cards by name and description |
| Category filter | Select: All, Sales, Inventory, Debt, Financial, Operational |
| Clear filters | Text link when any filter active |

#### 3.8.3 Report Category Cards (`ReportCard`)

| Property | Value |
|----------|-------|
| Size | 200 × 140px |
| Content | Icon, report name, format badges (PDF / Excel / CSV) |
| Hover | Subtle shadow; cursor pointer |
| Disabled | Grayed if missing sub-permission; tooltip explains required permission |
| Click | Opens Report Configurator panel (slide-over 560px) |

#### 3.8.4 Report Configurator Panel (slide-over)

```
┌─────────────────────────────────────┐
│ [←] Daily Sales Summary        [✕]  │
├─────────────────────────────────────┤
│ Date Range *                        │
│ [Jun 1, 2026] — [Jun 17, 2026]     │
│                                     │
│ Branch                              │
│ [All Branches ▼]                    │
│                                     │
│ Currency Display                    │
│ ( ) UZS  ( ) USD  (●) Both          │
│                                     │
│ Output Format *                     │
│ [PDF] [Excel] [CSV]                 │
│                                     │
│ Preview Summary                     │
│ ┌─────────────────────────────────┐ │
│ │ ~127 sales · 45.2M UZS          │ │
│ │ Est. rows: 127 · ~2s generation │ │
│ └─────────────────────────────────┘ │
│                                     │
│         [Cancel]  [Generate Report] │
└─────────────────────────────────────┘
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Date range | DateRangePicker | ✓ | End ≥ start; max 366 days |
| Branch | Select | — | Scoped to user branches |
| Currency display | Radio | ✓ | UZS / USD / Both |
| Output format | Segmented | ✓ | PDF / Excel / CSV |

#### 3.8.5 Generation Progress Modal

```
┌─────────────────────────────────────────┐
│  Generating report...                ✕  │
├─────────────────────────────────────────┤
│  Daily Sales Summary                    │
│  Jun 1 – Jun 17, 2026                   │
│                                         │
│  ████████████░░░░░░░░  62%              │
│  Processing sales data...               │
│                                         │
│  You can close this — we'll notify you  │
│  when the report is ready.              │
│                                         │
│                        [Run in Background]│
└─────────────────────────────────────────┘
```

#### 3.8.6 Recent Exports Strip

Last 5 exports inline; columns: Report name, Date, Format, Status, Download action. Link to full Export Center.

### 3.9 Components & Controls

| Component | Usage |
|-----------|-------|
| `ReportCard` | Category grid items |
| `ReportConfigurator` | Slide-over panel |
| `DateRangePicker` | Date range parameter |
| `ExportFormatSelector` | PDF / Excel / CSV |
| `GenerationProgress` | Async job modal |
| `ExportStatusBadge` | Ready / Processing / Failed |

### 3.10 Interactions

| Action | Behavior |
|--------|----------|
| Click report card | Open configurator with report pre-selected |
| Generate | POST async job; show progress modal |
| Background | Close modal; notify on `REPORT_READY` |
| Download ready | Auto-download or toast with Download action |
| Search | Filter visible cards in real time |
| Preview summary | Client-side estimate from cached aggregates |

### 3.11 States

| State | Treatment |
|-------|-----------|
| **Loading** | 6 skeleton cards per category row |
| **Populated** | Full category grid |
| **Empty search** | "No reports match '{query}'" + Clear |
| **No permission** | Category section hidden entirely |
| **Generation failed** | Error in modal + Retry; toast with details |
| **No data** | Preview shows "No data for selected period" — Generate disabled |
| **Offline** | Banner: "Reports require connection"; Generate disabled |

### 3.12 Tablet Adaptation

- Report cards: 3 per row
- Configurator: full-width sheet from bottom
- Recent exports: horizontal scroll strip

### 3.13 Mobile Adaptation

```
┌─────────────────────────┐
│ ← Reports               │
├─────────────────────────┤
│ [Search reports...]     │
│ [All ▼] [Sales ▼]       │
├─────────────────────────┤
│ Sales Reports           │
│ ┌─────────────────────┐ │
│ │ Daily Sales Summary │ │
│ │ PDF · Excel · CSV   │ │
│ └─────────────────────┘ │
│ (card list per category)│
├─────────────────────────┤
│ Recent Exports          │
│ Daily Sales · Download  │
└─────────────────────────┘
```

- Card list (not grid); tap opens full-screen configurator
- Export: view on mobile; download supported; large exports desktop-preferred
- PDF preview: open in system viewer

### 3.14 Real-Time Behavior

| Event | Behavior |
|-------|----------|
| `report.completed` | Toast + update Recent Exports; badge on sidebar Reports |
| `report.failed` | Toast destructive with "View details" |

### 3.15 Accessibility

- Report cards: `role="button"` with descriptive `aria-label` including formats
- Progress modal: `aria-live="polite"` for percentage updates
- Format selector: radio group with visible labels
- Category headings: proper heading hierarchy (`h2`)

### 3.16 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `Enter` | Open focused report card |
| `Esc` | Close configurator panel |

---

## 4. Analytics (SCR-131)

### 4.1 Screen Metadata

| Field | Value |
|-------|-------|
| **Screen ID** | SCR-131 |
| **Name** | Analytics |
| **Route** | `/analytics` |
| **Parent** | — |
| **Permission** | `reports.view` + `dashboard.view` |
| **Module** | `dashboard`, `reports` |
| **Platform** | Desktop, Tablet (Mobile read-only summary) |
| **Shell** | App Shell |
| **Typical Roles** | Owner, Company Admin, Manager |
| **Figma Frame** | `Screens / Analytics / Desktop / Default` |

### 4.2 Purpose

Interactive analytics workspace for ad-hoc exploration beyond static reports. Users build custom chart views, compare periods and branches, save favorite views, and drill into dimensional breakdowns (product, cashier, category, branch). Complements the Dashboard (real-time KPIs) and Reports (export-oriented documents).

### 4.3 Cross-References

- [DASHBOARD_UX.md](../DASHBOARD_UX.md) — chart component specs
- [REPORTS.md](../../08-modules/REPORTS.md) — underlying data dimensions
- [DASHBOARD.md](../../08-modules/DASHBOARD.md) — KPI definitions

### 4.4 Access & Permissions

| Permission | Grants |
|------------|--------|
| `dashboard.view` | Page access |
| `dashboard.revenue` | Revenue and profit analytics |
| `dashboard.debt` | Debt analytics |
| `dashboard.inventory` | Inventory analytics |
| `reports.generate` | Export current analytics view |

### 4.5 Entry & Exit Points

| Entry Point | Condition |
|-------------|-----------|
| Sidebar "Analytics" | Both permissions |
| Dashboard chart "Explore" link | Pre-filled metric and period |
| Command palette | "Open Analytics" |

| Exit Point | Trigger |
|------------|---------|
| `/reports` | "Export as report" action |
| `/sales/history` | Data point drill-down |
| `/products/:id` | Product dimension click |
| Saved view restore | URL query params |

### 4.6 Page Shell

Standard App Shell with breadcrumbs: `Analytics`.

### 4.7 Desktop Wireframe

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Analytics                                    [Save View] [Export ▼] [⟳]  │
│  Explore trends and compare performance                                    │
├────────────────────────────────────────────────────────────────────────────┤
│ METRIC: [Revenue ▼]  DIMENSION: [By Day ▼]  COMPARE: [☑ Prior Period]     │
│ [Jun 1 – Jun 17 ▼]  [All Branches ▼]  Currency: [UZS][USD][Both]         │
├────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │              PRIMARY CHART (line / bar / area)                       │ │
│ │              with comparison overlay (dashed prior period)           │ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────┬─────────────────────────────────────────────┤
│ BREAKDOWN TABLE (6 col)      │ SECONDARY CHART (6 col)                     │
│ Dimension │ Value │ % │ Δ    │ [horizontal bar — top 10 by dimension]     │
│ Product A │ 12.1M │ 28│ ▲8%  │                                            │
│ Product B │  8.4M │ 19│ ▼2%  │                                            │
│ ...        │       │   │      │                                            │
├──────────────────────────────┴─────────────────────────────────────────────┤
│ SAVED VIEWS (horizontal chips)                                             │
│ [Revenue by Day ★] [Margin by Category] [Debt Trend] [+ Save current]      │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.8 Layout & Sections

#### 4.8.1 Analytics Toolbar

| Control | Options | Behavior |
|---------|---------|----------|
| Metric | Revenue, Profit, Margin %, Sale Count, Avg Ticket, Debt Outstanding, Payments, Stock Value, COGS | Permission-gated options hidden |
| Dimension | By Day, By Week, By Month, By Product, By Category, By Cashier, By Branch, By Payment Type | Changes chart granularity and table rows |
| Compare prior period | Checkbox | Overlays dashed comparison series |
| Date range | DateRangePicker | Max 366 days |
| Branch | Multi-select | Default all accessible branches |
| Currency | UZS / USD / Both | Display filter |

#### 4.8.2 Primary Chart Area

| Property | Value |
|----------|-------|
| Height | 400px |
| Types | Line (time dimensions), Bar (categorical dimensions), Area (trends with fill) |
| Comparison | Prior equivalent period (e.g. Jun 1–17 vs May 15–31) |
| Tooltip | Value, % of total, delta vs comparison |
| Click | Drill to breakdown row or entity detail |
| Zoom | Brush selection on time charts (desktop) |

#### 4.8.3 Breakdown Table

| Column | Notes |
|--------|-------|
| Dimension | Product name, date, cashier, etc. |
| Value | Primary metric formatted per currency |
| % of Total | Share |
| Δ vs Prior | Trend arrow + percentage |
| Sparkline | Mini 7-point trend (optional column) |

Sort by Value (default), % of Total, or Delta. Top 50 rows; "Show all" paginates.

#### 4.8.4 Secondary Chart

Auto-selected complement: horizontal bar for categorical dimensions; donut for payment type; stacked area for debt aging when debt metric selected.

#### 4.8.5 Saved Views

| Property | Value |
|----------|-------|
| Storage | Per user per company (server + URL sync) |
| Chip | View name; star = default view |
| Max saved | 20 views |
| Save modal | Name input + "Set as default" checkbox |

### 4.9 Components & Controls

| Component | Usage |
|-----------|-------|
| `AnalyticsToolbar` | Metric/dimension/filter controls |
| `ComparisonChart` | Primary chart with overlay |
| `BreakdownTable` | Dimensional data table |
| `SavedViewChips` | Quick view switcher |
| `SaveViewModal` | Name and save action |
| `ExportMenu` | PNG snapshot, CSV data, "Open in Reports" |

### 4.10 Interactions

| Action | Behavior |
|--------|----------|
| Change metric | Chart and table reload; URL query updated |
| Change dimension | Chart type adapts; table columns adjust |
| Toggle compare | Animate comparison series in/out |
| Click table row | Highlight chart segment; optional drill-down |
| Save view | Persist filter state; toast "View saved" |
| Export PNG | Download chart image with watermark (company name, date) |
| Export CSV | Download breakdown table data |
| Brush zoom | Narrow date range to selection |

### 4.11 States

| State | Treatment |
|-------|-----------|
| **Loading** | Chart shimmer + 8-row table skeleton |
| **Populated** | Default interactive view |
| **Empty** | "No data for selected filters" + widen range suggestion |
| **Error** | Banner + Retry |
| **Unsaved changes** | Dot on Save View when toolbar modified |
| **Offline** | Read-only last-loaded view; stale badge; controls disabled |

### 4.12 Tablet Adaptation

- Toolbar wraps to 2 rows
- Primary chart full width, 320px height
- Breakdown table and secondary chart stack vertically
- Saved views: horizontal scroll chips

### 4.13 Mobile Adaptation

- Summary-only mode: 4 KPI cards + single simplified chart
- Banner: "Full analytics available on desktop"
- Read-only; no save view or export
- Pull-to-refresh reloads summary

### 4.14 Real-Time Behavior

- Analytics is **snapshot-oriented**; no live tick updates
- Manual refresh or 5-minute auto-refresh when tab focused
- Stale indicator if data older than 5 minutes

### 4.15 Accessibility

- Chart: textual summary announced on metric change
- Table: sortable headers with `aria-sort`
- Toolbar: logical tab order left-to-right
- Saved views: `role="tablist"` for chip navigation

### 4.16 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `S` | Save current view |
| `E` | Open export menu |
| `R` | Refresh data |
| `←/→` | Cycle saved views |

---

## 5. Notifications Center (SCR-140)

### 5.1 Screen Metadata

| Field | Value |
|-------|-------|
| **Screen ID** | SCR-140 |
| **Name** | Notifications Center |
| **Route** | `/notifications` |
| **Parent** | — |
| **Permission** | Authenticated (any logged-in user) |
| **Module** | `notifications` |
| **Platform** | Desktop, Tablet, Mobile (Both) |
| **Shell** | App Shell |
| **Typical Roles** | All authenticated roles |
| **Figma Frame** | `Screens / Notifications / Desktop / Default` |

### 5.2 Purpose

Full-page notification history and management. Users review business, debt, system, and administrative events; mark items read/unread; filter by type and date; and navigate to related entities via deep links. Complements the TopBar notification panel (quick glance) with persistent searchable history.

### 5.3 Cross-References

- [NOTIFICATIONS.md](../../08-modules/NOTIFICATIONS.md) — notification types and delivery rules
- [WEBSOCKET_EVENTS.md](../../06-api/WEBSOCKET_EVENTS.md) — real-time events
- [USER_FLOWS.md](../USER_FLOWS.md) — notification-driven flows

### 5.4 Access & Permissions

| Rule | Detail |
|------|--------|
| Authentication | Any valid session |
| Type filtering | Users only see notification types they have permission to view |
| Admin events | `admin.*` notifications visible only to admins |
| Company scope | Notifications scoped to active company |

### 5.5 Entry & Exit Points

| Entry Point | Condition |
|-------------|-----------|
| TopBar bell → "View All" | Any authenticated user |
| Sidebar "Notifications" | Any authenticated user |
| Toast notification click | Deep link with notification context |
| Push/deep link `erp://notifications` | Mobile |

| Exit Point | Trigger |
|------------|---------|
| Entity detail | Click notification with `data.route` |
| `/notifications/:id` | Expand notification detail (Phase 1: inline expand) |
| Settings preferences | "Notification settings" link |

### 5.6 Page Shell

Standard App Shell with breadcrumbs: `Notifications`.

### 5.7 Desktop Wireframe

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Notifications (3 unread)                    [Mark all read] [Settings ⚙] │
│  Stay informed about business activity                                     │
├────────────────────────────────────────────────────────────────────────────┤
│ [Search notifications...]  [Type ▼] [Status ▼] [Date range]  Clear filters │
├────────────────────────────────────────────────────────────────────────────┤
│ TODAY                                                                      │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ ●  Sale #MKT-004521 completed                              2 min ago  │ │
│ │    700,000 UZS · Dilshod · Cash sale                    [Mark read]  │ │
│ ├────────────────────────────────────────────────────────────────────────┤ │
│ │ ●  Payment received: 500,000 UZS                         15 min ago  │ │
│ │    Alisher Qurilish · Manager                           [Mark read]  │ │
│ ├────────────────────────────────────────────────────────────────────────┤ │
│ │ ○  Low stock: Cement 50kg                                 1 hr ago   │ │
│ │    15 units remaining (min: 50)                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ YESTERDAY                                                                  │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ ○  Exchange rate updated: 1 USD = 12,800 UZS              Yesterday  │ │
│ │ ○  Daily backup completed successfully                      Yesterday  │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────┤
│                              Showing 1–25 of 142          ◀  1  2  3  ▶  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.8 Layout & Sections

#### 5.8.1 Section Header

| Element | Spec |
|---------|------|
| Title | `heading-1` — "Notifications" |
| Unread badge | Count in title: "(3 unread)" |
| Mark all read | Ghost button; disabled when 0 unread |
| Settings | Icon button → `/settings/preferences#notifications` |

#### 5.8.2 Filter Bar

| Control | Options |
|---------|---------|
| Search | Full-text on title and body; debounce 300ms |
| Type | All, Sales, Payments, Inventory, Debt, System, Admin |
| Status | All, Unread, Read |
| Date range | Presets: Today, 7 days, 30 days, Custom |

#### 5.8.3 Notification List (`NotificationItem`)

| Element | Spec |
|---------|------|
| Unread indicator | 8px blue dot left of icon |
| Icon | 32×32px circle, type-colored background 10% opacity |
| Title | `body` 14px / 600 for unread; / 400 for read |
| Body | `body-sm` 12px muted — secondary details |
| Timestamp | Relative; absolute on hover tooltip |
| Row height | 72px min |
| Grouping | Date headers: Today, Yesterday, {date} |
| Row action | "Mark read" text button on hover (unread only) |

#### 5.8.4 Notification Type Icons

| Type Category | Icon | Color |
|---------------|------|-------|
| Sales | `ShoppingCart` | Blue |
| Payments / Debt | `Banknote` | Green |
| Inventory | `Package` | Purple |
| System | `Settings` | Slate |
| Admin / Security | `Shield` | Amber |
| Reports | `FileText` | Indigo |

#### 5.8.5 Expanded Detail (inline accordion)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ▼  Sale #MKT-004521 completed                                   2 min ago  │
├────────────────────────────────────────────────────────────────────────────┤
│  Sale #MKT-004521 was completed for 700,000 UZS (cash) by Dilshod.      │
│  Customer: Walk-in · Branch: Tashkent Main                                 │
│                                                                            │
│  [View Sale →]                                    [Mark unread] [Delete]   │
└────────────────────────────────────────────────────────────────────────────┘
```

Delete removes from user history only (soft delete client-side; server retains 90 days).

### 5.9 Components & Controls

| Component | Usage |
|-----------|-------|
| `NotificationList` | Grouped virtualized list |
| `NotificationItem` | Single notification row |
| `NotificationFilterBar` | Search and filters |
| `NotificationTypeIcon` | Category icon badge |
| `MarkAllReadButton` | Bulk read action |

### 5.10 Interactions

| Action | Behavior |
|--------|----------|
| Click row | Expand detail OR navigate if single-action notification |
| Click "View →" | Navigate to `data.route` |
| Mark read | Remove blue dot; decrement TopBar badge |
| Mark all read | Batch API; animate dots fading |
| Mark unread | Restore unread state |
| Real-time prepend | New notification slides in at top with 200ms animation |
| Pagination | 25 per page; infinite scroll on mobile |

### 5.11 States

| State | Treatment |
|-------|-----------|
| **Loading** | 8 skeleton notification rows |
| **Populated** | Grouped list |
| **Empty (no notifications)** | Illustration + "No notifications yet" |
| **Empty (filtered)** | "No notifications match filters" + Clear |
| **Error** | Banner + Retry |
| **All read** | Title shows no unread count; positive tone |

### 5.12 Tablet Adaptation

- Full-width list; filters wrap to two rows
- Expanded detail: full row width
- Swipe right on row → Mark read (optional gesture)

### 5.13 Mobile Adaptation

```
┌─────────────────────────┐
│ ← Notifications    ✓✓   │
├─────────────────────────┤
│ [Search...] [Filter ▼]  │
├─────────────────────────┤
│ TODAY                   │
│ ● Sale completed        │
│   700K UZS · 2m ago   › │
│ ● Payment received      │
│   500K · 15m ago      › │
├─────────────────────────┤
│ (infinite scroll)       │
└─────────────────────────┘
```

- `✓✓` = Mark all read in app bar
- Tap row → full-screen detail
- Pull-to-refresh
- Filter: bottom sheet

### 5.14 Real-Time Behavior

| Event | Behavior |
|-------|----------|
| `notification.created` | Prepend to list if matches filters; increment unread |
| `notification.read` (sync) | Update from other device/tab |
| TopBar badge | Synced bidirectionally |

High-priority types also trigger toast (max 3 concurrent, 5s auto-dismiss) when user is on another screen.

### 5.15 Accessibility

- Unread count in page title announced on change
- List: `role="feed"` with `aria-busy` during load
- Mark all read: confirmation not required; action announced
- Icons decorative; title text carries meaning

### 5.16 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `M` | Mark focused notification read |
| `Shift+M` | Mark all read |
| `J/K` | Navigate list items |
| `Enter` | Open focused notification |

---

## 6. Settings (SCR-150)

### 6.1 Screen Metadata

| Field | Value |
|-------|-------|
| **Screen ID** | SCR-150 |
| **Name** | Settings |
| **Route** | `/settings` |
| **Parent** | — |
| **Permission** | `settings.view` (hub); sub-sections vary |
| **Module** | `company`, `currency`, `core` |
| **Platform** | Desktop, Tablet (Mobile via drawer) |
| **Shell** | App Shell with settings sub-nav |
| **Typical Roles** | Owner, Company Admin (full); Manager (partial); all users (preferences) |
| **Figma Frame** | `Screens / Settings / Desktop / Hub Default` |

### 6.2 Purpose

Central hub for company configuration and personal preferences. Provides navigable access to company profile, exchange rates, branch management, and user preferences. Non-admin users see only Preferences; admins see all sections permitted by role.

### 6.3 Cross-References

- [MULTI_COMPANY.md](../../08-modules/MULTI_COMPANY.md) — company profile rules
- [CURRENCY_UZS_USD.md](../../08-modules/CURRENCY_UZS_USD.md) — exchange rate management
- [BRANCH_MANAGEMENT.md](../../08-modules/BRANCH_MANAGEMENT.md) — branch CRUD
- [SCREEN_HIERARCHY.md](../SCREEN_HIERARCHY.md) — child screen routes

### 6.4 Access & Permissions

| Section | Route | Permission | Roles |
|---------|-------|------------|-------|
| Company Profile | `/settings/company` | `settings.company` | Admin, Manager |
| Exchange Rates | `/settings/exchange-rates` | `currency.manage` | Admin, Manager |
| Branches | `/settings/branches` | `settings.branches` | Admin |
| User Preferences | `/settings/preferences` | Authenticated | All |

### 6.5 Entry & Exit Points

| Entry Point | Condition |
|-------------|-----------|
| Avatar menu → Settings | Any user |
| Sidebar "Settings" | `settings.view` or authenticated (preferences only) |
| Dashboard exchange rate widget | `currency.manage` → Exchange Rates |
| Admin company detail tab | Cross-link |

| Exit Point | Trigger |
|------------|---------|
| Sub-section pages | Click settings nav item |
| `/admin/companies/:id` | Admin cross-link from company profile |
| Back to previous screen | Breadcrumb or browser back |

### 6.6 Page Shell

Settings uses **split navigation** layout on desktop:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TopBar (56px)                                                              │
├────────┬──────────┬────────────────────────────────────────────────────────┤
│ App    │ Settings │  {Section Content}                                     │
│ Side   │ Sub-nav  │                                                        │
│ bar    │ 200px    │                                                        │
│ 240px  │          │                                                        │
└────────┴──────────┴────────────────────────────────────────────────────────┘
```

### 6.7 Desktop Wireframe — Settings Hub (`/settings`)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                  │
│  Manage company configuration and personal preferences                     │
├──────────┬─────────────────────────────────────────────────────────────────┤
│ Company  │  SETTINGS OVERVIEW                                              │
│ Exchange │  ┌─────────────────────┐ ┌─────────────────────┐               │
│ Branches │  │ 🏢 Company Profile  │ │ 💱 Exchange Rates   │               │
│ ──────── │  │ Name, logo, tax ID  │ │ 1 USD = 12,800 UZS  │               │
│ Prefs    │  │ [Manage →]          │ │ [Manage →]          │               │
│          │  └─────────────────────┘ └─────────────────────┘               │
│          │  ┌─────────────────────┐ ┌─────────────────────┐               │
│          │  │ 📍 Branches (2)     │ │ ⚙ User Preferences  │               │
│          │  │ TSH-MAIN, SMK-01    │ │ Theme, language     │               │
│          │  │ [Manage →]          │ │ [Manage →]          │               │
│          │  └─────────────────────┘ └─────────────────────┘               │
└──────────┴─────────────────────────────────────────────────────────────────┘
```

### 6.8 Layout & Sections

#### 6.8.1 Settings Sub-Navigation (persistent left panel)

| Item | Icon | Visibility |
|------|------|------------|
| Overview | `LayoutGrid` | Always (default `/settings`) |
| Company Profile | `Building2` | `settings.company` |
| Exchange Rates | `ArrowLeftRight` | `currency.manage` |
| Branches | `MapPin` | `settings.branches` |
| User Preferences | `User` | Always |

Hidden items are not shown (not disabled).

#### 6.8.2 Overview Cards

Summary cards with key field preview and "Manage →" link. Cards for sections without permission are omitted.

#### 6.8.3 Company Profile (`/settings/company`)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Company Profile                                          [Save Changes]   │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐                                                              │
│  │  [Logo]  │  Company Name *                                              │
│  │  Upload  │  [Market LLC________________]                                │
│  └──────────┘                                                              │
│                                                                            │
│  Legal Name              Tax ID (INN)                                      │
│  [________________]      [________________]                                │
│                                                                            │
│  Address                                                                   │
│  [________________________________________________]                        │
│                                                                            │
│  Phone                   Email                                             │
│  [+998 ___________]      [________________]                                │
│                                                                            │
│  Default Currency        Fiscal Year Start                                 │
│  [UZS ▼]                 [January ▼]                                       │
└────────────────────────────────────────────────────────────────────────────┘
```

| Field | Validation |
|-------|------------|
| Company name | Required, 2–100 chars |
| Logo | PNG/JPG, max 2MB, 256×256 recommended |
| Tax ID | Optional; format hint for Uzbekistan INN |
| Save | Disabled until dirty; toast on success |

#### 6.8.4 Exchange Rates (`/settings/exchange-rates`)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Exchange Rates                                 [Set New Rate]             │
│  Current: 1 USD = 12,800 UZS · Updated Jun 17, 2026 by Sarvar           │
├────────────────────────────────────────────────────────────────────────────┤
│  RATE HISTORY                                                              │
│ ┌──────────┬──────────┬──────────────┬─────────────────────────────────┐  │
│ │ Date     │ Rate     │ Set By       │ Notes                           │  │
│ ├──────────┼──────────┼──────────────┼─────────────────────────────────┤  │
│ │ Jun 17   │ 12,800   │ Sarvar R.    │ Market adjustment               │  │
│ │ Jun 10   │ 12,750   │ Sarvar R.    │ —                               │  │
│ └──────────┴──────────┴──────────────┴─────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Set New Rate modal**: Rate input (numeric), Notes (optional), warning "New sales will use this rate. Existing sales retain frozen rates."

#### 6.8.5 Branches (`/settings/branches`)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Branches                                                 [+ Add Branch]   │
├────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┬──────────┬──────────────┬──────────┬───────────────────┐  │
│ │ Branch       │ Code     │ Phone        │ Status   │ Default           │  │
│ ├──────────────┼──────────┼──────────────┼──────────┼───────────────────┤  │
│ │ Tashkent Main│ TSH-MAIN │ +998 90 ...  │ ACTIVE   │ ★                 │  │
│ │ Samarkand    │ SMK-01   │ +998 91 ...  │ ACTIVE   │                   │  │
│ └──────────────┴──────────┴──────────────┴──────────┴───────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

Create/Edit modal: Name, Code (unique within company), Address, Phone, Set as default checkbox.

#### 6.8.6 User Preferences (`/settings/preferences`)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  User Preferences                                          [Save]          │
├────────────────────────────────────────────────────────────────────────────┤
│  APPEARANCE                                                                │
│  Theme          ( ) Light  (●) Dark  ( ) System                            │
│                                                                            │
│  LANGUAGE                                                                  │
│  Interface      [O'zbek ▼]                                                 │
│                                                                            │
│  DISPLAY                                                                   │
│  Default currency display   [Both ▼]                                       │
│  Number format              [1 234 567,89 ▼]                               │
│                                                                            │
│  NOTIFICATIONS                                                             │
│  In-app toasts              [ON]                                           │
│  Sound alerts               [OFF]                                          │
│  Email digest               [Off ▼]                                        │
│                                                                            │
│  SIDEBAR                                                                   │
│  Collapsed by default       [OFF]                                          │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.9 Components & Controls

| Component | Usage |
|-----------|-------|
| `SettingsLayout` | Split nav + content |
| `SettingsNav` | Sub-navigation list |
| `SettingsOverviewCard` | Hub summary cards |
| `CompanyProfileForm` | Company fields |
| `ExchangeRateHistory` | Rate table |
| `SetRateModal` | New rate entry |
| `BranchTable` | Branch list |
| `PreferencesForm` | User settings |

### 6.10 Interactions

| Action | Behavior |
|--------|----------|
| Navigate sub-section | Client-side route; sub-nav highlight updates |
| Save company profile | Validate → PATCH → toast "Company updated" |
| Set exchange rate | Modal → confirm → broadcast `currency.rate_changed` |
| Add branch | Modal → create → table refresh |
| Save preferences | Immediate apply for theme; toast for others |
| Unsaved changes | `beforeunload` warning on navigation away |

### 6.11 States

| State | Treatment |
|-------|-----------|
| **Loading** | Form field skeletons |
| **Populated** | Default |
| **Validation error** | Inline field errors; Save disabled |
| **Permission denied** | Redirect to Preferences only; or 403 section page |
| **Empty branches** | "No branches" + Add Branch CTA (should not occur — default branch on create) |
| **Offline** | Banner; Save disabled; read cached values with stale badge |

### 6.12 Tablet Adaptation

- Sub-nav collapses to horizontal tabs below header
- Forms: single column, full width fields
- Branch table: card view

### 6.13 Mobile Adaptation

```
┌─────────────────────────┐
│ ← Settings              │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Company Profile   › │ │
│ ├─────────────────────┤ │
│ │ Exchange Rates    › │ │
│ ├─────────────────────┤ │
│ │ Branches          › │ │
│ ├─────────────────────┤ │
│ │ Preferences       › │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

- List-style navigation (no split panel)
- Each section: full-screen form
- Exchange rate set: desktop/tablet preferred; view-only on mobile for non-admins

### 6.14 Real-Time Behavior

| Event | Behavior |
|-------|----------|
| `currency.rate_changed` | Update current rate display; prepend history row |
| `company.updated` | Refresh company profile if open |
| `branch.created/updated` | Refresh branch table |

### 6.15 Accessibility

- Settings nav: `role="navigation"` with `aria-current="page"`
- Form fields: associated labels and error `aria-describedby`
- Theme toggle: immediate visual change; respects `prefers-reduced-motion`
- Exchange rate warning: `role="alert"` in modal

### 6.16 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save current form |
| `1–4` | Jump to settings section (when sub-nav focused) |

---

## 7. Cross-Cutting States (All Screens)

| State | Pattern |
|-------|---------|
| **Loading** | Skeleton screens matching layout; no full-page spinner |
| **Empty** | Illustration + message + primary CTA where applicable |
| **Error** | Inline Retry for data; toast for action failures |
| **403** | Full page: "You don't have access" + link to Dashboard |
| **Module disabled** | Redirect to Dashboard with banner |
| **Offline** | TopBar banner; read-only where safe; destructive actions disabled |

---

## 8. Figma Deliverables Checklist

| Screen | Frames Required |
|--------|-----------------|
| SCR-030 Dashboard | Desktop XL/LG/MD, Tablet, Mobile, Loading, Empty, Cashier variant, Warehouse variant |
| SCR-130 Reports | Hub, Configurator, Progress modal, Empty search, Mobile list |
| SCR-131 Analytics | Default, Compare on, Saved views, Empty, Mobile summary |
| SCR-140 Notifications | List, Expanded detail, Empty, Filtered empty, Mobile |
| SCR-150 Settings | Hub, Company, Exchange Rates, Branches, Preferences, Mobile list |

---

## Related Documents

- [DASHBOARD_UX.md](../DASHBOARD_UX.md)
- [ADMIN_PANEL_UX.md](../ADMIN_PANEL_UX.md)
- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)
- [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md)
- [SCREEN_HIERARCHY.md](../SCREEN_HIERARCHY.md)
- [NAVIGATION_ARCHITECTURE.md](../NAVIGATION_ARCHITECTURE.md)
- [ACCESSIBILITY.md](../ACCESSIBILITY.md)
