# Dashboard UX Specification

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Figma Handoff |
| Last Updated | 2026-06-17 |
| Platform | Windows Desktop (Electron), Future macOS, Tablet Web, Mobile (Flutter) |
| Figma Page | `04 — Dashboard` |
| Related Module | [DASHBOARD.md](../08-modules/DASHBOARD.md) |

---

## 1. Purpose

This document is the **Figma-ready UX specification** for the ERP Dashboard. It defines layout grids, widget dimensions, typography, colors, interactions, responsive behavior, states, and drill-down navigation. Designers implement frames from this spec; developers reference it alongside [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) and [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md).

**Out of scope**: API contracts, business logic, implementation code.

---

## 2. Figma Setup

### 2.1 Frame Naming Convention

```
Dashboard / {Breakpoint} / {State} / {Variant}

Examples:
  Dashboard / Desktop XL / Default / Manager
  Dashboard / Mobile / Loading / Owner
  Dashboard / Tablet / Error / Empty Period
```

### 2.2 Base Frame Sizes

| Breakpoint Token | Frame Width × Height | Columns | Gutter | Margin |
|------------------|----------------------|---------|--------|--------|
| Desktop XL (`2xl`) | 1536 × 900 | 12 | 24px | 32px |
| Desktop LG (`xl`) | 1280 × 800 | 12 | 24px | 24px |
| Desktop MD (`lg`) | 1024 × 768 | 12 | 16px | 16px |
| Tablet (`md`) | 768 × 1024 | 8 | 16px | 16px |
| Mobile (`sm`) | 390 × 844 | 4 | 12px | 16px |

### 2.3 Grid Overlay

- **Desktop**: 12-column fluid grid; column width = `(content width − 11 × gutter) ÷ 12`
- **Tablet**: 8-column grid; same gutter rules
- **Mobile**: 4-column grid; widgets span full width unless noted

### 2.4 Design Tokens (from Design System)

| Token | Value | Dashboard Usage |
|-------|-------|-----------------|
| `--primary` | #2563EB (light) / #3B82F6 (dark) | Links, chart primary series, UZS accent |
| `--success` | #16A34A | Positive trends, USD accent |
| `--destructive` | #DC2626 | Negative trends, error states |
| `--warning` | #D97706 | Stale data, reconnecting |
| `--card` | #FFFFFF / #1E293B | Widget backgrounds |
| `--border` | #E2E8F0 / #334155 | Widget borders |
| `--muted-foreground` | #64748B / #94A3B8 | Labels, axis text |
| Card border radius | 6px | All widgets |
| Card padding | 16px | Internal widget padding |
| Widget gap | 16px (desktop), 12px (mobile) | Between grid items |

---

## 3. Page Shell

### 3.1 Desktop Wireframe (1280px content area)

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

### 3.2 Page Header

| Element | Spec |
|---------|------|
| Page title | `heading-1` (30px / 700), text: "Dashboard" or localized "Boshqaruv paneli" |
| Subtitle (optional) | `body-sm` (12px), muted: company name + period label, e.g. "Market · Today" |
| Right-aligned controls | Horizontal flex, gap 12px, align center |
| Refresh button | Ghost icon button, 36×36px, Lucide `RefreshCw`; tooltip "Refresh data" |
| Last updated | `body-sm`, muted, right of refresh: "Updated 14:32" |

### 3.3 Branch Selector (multi-branch companies only)

| Property | Value |
|----------|-------|
| Component | `Select` searchable |
| Width | 200px (desktop), full width (mobile, stacked) |
| Options | "All Branches" (default for Owner/Admin), individual branches |
| Visibility | Hidden when company has single branch |
| Permission | Requires `dashboard.view`; branch list scoped to user's assigned branches |
| On change | All widgets reload; show skeleton overlay 200ms minimum |

---

## 4. Period Selector UX

### 4.1 Control Type

Segmented control (pill tabs) + custom date range trigger.

```
┌──────────────────────────────────────────────────────────────────────┐
│  [ Today ] [ This Week ] [ This Month ] [ This Year ]  [ 📅 Custom ] │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Segmented Control Spec

| Property | Value |
|----------|-------|
| Height | 36px |
| Segment padding | 12px horizontal, 8px vertical |
| Typography | `body` 14px / 500 |
| Border | 1px `--border`, outer radius 6px |
| Active segment | Background `--primary`, text `--primary-foreground` |
| Inactive segment | Background transparent, text `--foreground` |
| Hover | Background `--secondary` |
| Keyboard | Arrow keys move selection; Enter applies |

### 4.3 Period Definitions (display labels)

| Segment | Internal Key | Date Range | Comparison Label |
|---------|--------------|------------|------------------|
| Today | `daily` | 00:00 local – now | "vs yesterday" |
| This Week | `weekly` | Mon 00:00 – now | "vs last week" |
| This Month | `monthly` | 1st 00:00 – now | "vs last month" |
| This Year | `yearly` | Jan 1 00:00 – now | "vs last year" |
| Custom | `custom` | User-picked range | "vs prior equivalent period" |

### 4.4 Custom Date Range

| Property | Value |
|----------|-------|
| Trigger | Calendar icon segment; opens `DateRangePicker` popover |
| Popover width | 320px |
| Presets inside popover | Last 7 days, Last 30 days, Last 90 days, This quarter |
| Max range | 366 days |
| Apply button | Primary, disabled until both dates selected |
| Validation error | "End date must be after start date" below picker |

### 4.5 Persistence

- Selected period stored in user session preferences (local + server)
- On return visit: restore last period
- Custom range persists start/end dates

### 4.6 Loading on Period Change

1. Segmented control remains interactive (debounce 300ms)
2. All widgets show inline skeleton simultaneously
3. Crossfade to new data over 150ms
4. Trend arrows recalculate after data load

---

## 5. Currency Toggle UX

### 5.1 Control Layout

```
┌─────────────────────────────────────┐
│  Currency:  [ UZS ] [ USD ] [ Both ]│
└─────────────────────────────────────┘
```

### 5.2 Spec

| Property | Value |
|----------|-------|
| Control type | Three-way segmented toggle |
| Height | 36px |
| Default | `Both` for Owner/Admin/Manager; `UZS` for roles with single-currency view |
| UZS active color | Text/indicator `#2563EB` (blue) |
| USD active color | Text/indicator `#16A34A` (green) |
| Both mode | Show UZS line primary, USD secondary in dual-line KPI cards |

### 5.3 Display Rules by Mode

| Mode | KPI Cards | Charts | Top Products Table |
|------|-----------|--------|-------------------|
| UZS | UZS only, blue label | UZS axis and series | UZS columns only |
| USD | USD only, green label | USD axis and series | USD columns only |
| Both | UZS primary line, USD secondary (12px below) | Dual axis or toggle chip on chart | Both currency columns visible |

### 5.4 Formatting

| Currency | Format | Example |
|----------|--------|---------|
| UZS | Space-separated thousands + `so'm` suffix | `45 200 000 so'm` |
| USD | `$` prefix, 2 decimals, comma thousands | `$3,420.00` |

### 5.5 Persistence

Stored per user per company in preferences. Does not affect underlying data — display filter only.

---

## 6. Layout Grid — Desktop (12 Columns)

### 6.1 Default Layout — Owner / Admin (all permissions)

Row assignments at **1280px (xl)** content width:

| Row | Widget | Col Span | Height |
|-----|--------|----------|--------|
| 1 | KPI Row A — Revenue | 3+3+3+3 = 12 | 120px |
| 2 | KPI Row B — Profit | 4+4+4 = 12 | 120px |
| 3 | KPI Row C — Debt | 3+3+3+3 = 12 | 120px |
| 4 | KPI Row D — Inventory + Exchange Rate | 3+3+3+3 = 12 | 120px |
| 5 | Sales Trend Chart | 8 | 320px |
| 5 | Payment vs Credit Donut | 4 | 320px |
| 6 | Debt Aging Chart | 6 | 280px |
| 6 | Top Products (table) | 6 | 280px |
| 7 | Recent Activity Feed | 5 | min 360px, grows |
| 7 | Top Products Bar Chart | 7 | 360px |

**1536px (2xl)**: Same structure; charts gain horizontal breathing room; table shows all columns without scroll.

**1024px (lg)**: KPI rows wrap to 2×2 per group (6+6); Row 5 stacks (chart full 12, donut full 12); Row 6 stacks; Row 7 stacks.

### 6.2 KPI Card — Base Component (`StatCard`)

| Property | Value |
|----------|-------|
| Min height | 120px |
| Background | `--card` |
| Border | 1px solid `--border` |
| Border radius | 6px |
| Padding | 16px |
| Shadow | None (flat); hover: subtle 0 1px 3px rgba(0,0,0,0.06) |
| Cursor | `pointer` when drill-down enabled |
| Focus ring | 2px `--primary` offset 2px |

**Internal structure (top to bottom):**

1. **Label row** — `body-sm` 12px uppercase tracking 0.5px, `--muted-foreground`, truncate
2. **Primary value** — 28px / 700 mono for numbers, `--foreground`
3. **Secondary value** (Both mode) — 16px / 600, currency-colored
4. **Trend row** — 12px; icon 14px + percentage + comparison period text
5. **Meta row** (optional) — e.g. "127 transactions", `body-sm` muted

**Trend indicators:**

| Direction | Icon | Color | Text pattern |
|-----------|------|-------|--------------|
| Up (positive for revenue/profit) | `TrendingUp` | `--success` | `▲ 8.2% vs yesterday` |
| Down | `TrendingDown` | `--destructive` | `▼ 3.1% vs yesterday` |
| Flat (±0.5%) | `Minus` | `--muted-foreground` | `— 0.0% vs yesterday` |

**Debt KPI exception**: Increase in outstanding debt trends red; payments received trends green.

---

## 7. KPI Widget Catalog

Each widget maps to a Figma component variant: `KPI / {Category} / {Name}`.

### 7.1 Revenue KPIs (Permission: `dashboard.revenue`)

#### 7.1.1 Total Sales

| Property | Value |
|----------|-------|
| Label | "TOTAL SALES" + period suffix, e.g. "(Today)" |
| Primary metric | Sum of completed sale totals in period |
| Secondary | Sale count in meta row: "{n} transactions" |
| Trend | vs comparison period per Section 4.3 |
| Drill-down | → `/sales/history?period={selected}` |
| Real-time | Updates on `sale.completed`, `sale.cancelled` |

#### 7.1.2 Sale Count

| Property | Value |
|----------|-------|
| Label | "SALE COUNT" |
| Primary metric | Integer count |
| Meta | Average sale value (respects currency toggle) |
| Drill-down | → `/sales/history?period={selected}` |

#### 7.1.3 Average Sale Value

| Property | Value |
|----------|-------|
| Label | "AVG SALE VALUE" |
| Primary metric | Total sales ÷ sale count per currency |
| Drill-down | → `/reports/sales?report=average_ticket` |

#### 7.1.4 Cash Sales

| Property | Value |
|----------|-------|
| Label | "CASH SALES" |
| Primary metric | Sales with payment_type CASH or full immediate payment |
| Meta | "% of total sales" |
| Drill-down | → `/sales/history?payment=cash&period={selected}` |

#### 7.1.5 Credit Sales

| Property | Value |
|----------|-------|
| Label | "CREDIT SALES" |
| Primary metric | Sales creating debt |
| Meta | New debt amount created in period |
| Drill-down | → `/sales/history?payment=credit&period={selected}` |

### 7.2 Profit KPIs (Permission: `dashboard.revenue`)

#### 7.2.1 Gross Profit

| Property | Value |
|----------|-------|
| Label | "GROSS PROFIT" |
| Primary metric | Revenue − COGS (FIFO) |
| Trend | vs comparison period |
| Drill-down | → `/reports/sales?report=profit&period={selected}` |

#### 7.2.2 Gross Margin

| Property | Value |
|----------|-------|
| Label | "GROSS MARGIN" |
| Primary metric | Percentage to 1 decimal, e.g. `24.3%` |
| Meta | Shown per active currency mode |
| Drill-down | → `/reports/sales?report=margin` |

#### 7.2.3 COGS

| Property | Value |
|----------|-------|
| Label | "COST OF GOODS SOLD" |
| Primary metric | Total FIFO cost for sold items |
| Drill-down | → `/reports/inventory?report=cogs` |

### 7.3 Debt KPIs (Permission: `dashboard.debt`)

#### 7.3.1 Outstanding Debt

| Property | Value |
|----------|-------|
| Label | "OUTSTANDING DEBT" |
| Primary metric | Total receivable (all time, not period-scoped) |
| Meta | "{n} customers with balance" |
| Trend | Compare total vs comparison period end snapshot |
| Drill-down | → `/customers?filter=has_debt` |

#### 7.3.2 Payments Received

| Property | Value |
|----------|-------|
| Label | "PAYMENTS" + period suffix |
| Primary metric | Sum of payments in period |
| Meta | "{n} payments" |
| Real-time | Updates on `debt.payment_received` |
| Drill-down | → `/customers/debt?tab=payments&period={selected}` |

#### 7.3.3 New Debt Created

| Property | Value |
|----------|-------|
| Label | "NEW DEBT" |
| Primary metric | Credit portion of sales in period |
| Drill-down | → `/sales/history?payment=credit&period={selected}` |

#### 7.3.4 Overdue Debt

| Property | Value |
|----------|-------|
| Label | "OVERDUE DEBT" |
| Primary metric | Debt older than 30 days |
| Meta | "{n} customers overdue" |
| Badge | Warning badge if > 0: "Action needed" |
| Drill-down | → `/customers?filter=overdue` |

### 7.4 Inventory KPIs (Permission: `dashboard.inventory`)

#### 7.4.1 Catalog Value (Inventory Value)

| Property | Value |
|----------|-------|
| Label | "INVENTORY VALUE" |
| Primary metric | Total stock × sale price, UZS and USD |
| Sub-label | "At sale prices" in `body-sm` muted |
| Real-time | Updates on `inventory.stock_changed` |
| Drill-down | → `/inventory/stock` |

#### 7.4.2 Product Count

| Property | Value |
|----------|-------|
| Label | "PRODUCTS" |
| Primary metric | Active products count |
| Meta | "{in_stock} in stock · {out_of_stock} out of stock" |
| Drill-down | → `/products` |

#### 7.4.3 Low Stock Alerts

| Property | Value |
|----------|-------|
| Label | "LOW STOCK" |
| Primary metric | Count below minimum level |
| Badge | Warning color when > 0 |
| Drill-down | → `/inventory/stock?filter=low` |

#### 7.4.4 Out of Stock

| Property | Value |
|----------|-------|
| Label | "OUT OF STOCK" |
| Primary metric | Zero-quantity active products |
| Badge | Destructive color when > 0 |
| Drill-down | → `/inventory/stock?filter=out` |

### 7.5 Exchange Rate Widget (Permission: `dashboard.view`)

| Property | Value |
|----------|-------|
| Label | "EXCHANGE RATE" |
| Primary display | `1 USD = {rate} UZS` — 20px / 600 |
| Secondary | "Updated {date}" — `body-sm` muted |
| Width | 3 columns (same row as inventory KPIs) |
| Real-time | Updates on `currency.rate_changed` |
| Drill-down | → `/settings/exchange-rates` (if `currency.manage`) or read-only modal |

---

## 8. Chart Specifications

### 8.1 Shared Chart Container

| Property | Value |
|----------|-------|
| Background | `--card` |
| Border | 1px `--border`, radius 6px |
| Padding | 16px |
| Header height | 48px — title left, actions right |
| Title typography | `heading-3` 20px / 600 |
| Chart area | Remaining height below header |
| Empty state | Centered illustration + "No data for this period" |
| Loading | Animated shimmer on chart area |

### 8.2 Sales Trend Chart (Line / Bar Combo)

| Property | Value |
|----------|-------|
| Position | Row 5, cols 1–8 (desktop) |
| Title | "Sales Trend" |
| Subtitle | Dynamic period, e.g. "Jun 10 – Jun 17, 2026" |
| Chart type | **Daily/Weekly/Monthly/Yearly**: adaptive (see below) |
| Height | 320px chart area |

**Chart type by period:**

| Period | X-Axis Granularity | Chart Type |
|--------|-------------------|------------|
| Daily | Hourly (00–23) | Line, single day |
| Weekly | Daily (Mon–Sun) | Line with area fill 10% opacity |
| Monthly | Daily (1–31) | Line |
| Yearly | Monthly (Jan–Dec) | Bar |
| Custom ≤ 31 days | Daily | Line |
| Custom > 31 days | Weekly buckets | Bar |

**Axes:**

| Axis | Spec |
|------|------|
| Y-left | Revenue; label "Revenue (millions UZS)" or "Revenue (USD)" per toggle |
| Y-right | (Both mode only) Secondary currency; green axis |
| X | Time labels; `body-sm` 11px, `--muted-foreground` |
| Grid | Horizontal only, dashed, `--border` 50% opacity |

**Series colors:**

| Series | Color | Stroke |
|--------|-------|--------|
| UZS revenue | `#2563EB` | 2px |
| USD revenue | `#16A34A` | 2px |
| Comparison (prior period) | `#94A3B8` | 1.5px dashed |

**Interactions:**

| Action | Behavior |
|--------|----------|
| Hover point/bar | Tooltip card: date, UZS, USD, sale count, vs prior period % |
| Click point/bar | Navigate to `/sales/history?date={clicked_date}` |
| Legend click | Toggle series visibility |
| Pinch (tablet/mobile) | Horizontal zoom within period |

### 8.3 Payment vs Credit Split (Donut)

| Property | Value |
|----------|-------|
| Position | Row 5, cols 9–12 |
| Title | "Cash vs Credit" |
| Chart type | Donut, inner radius 60% |
| Segments | Cash (primary blue), Credit (amber `#D97706`), Partial (slate `#64748B`) |
| Center label | Total sales count |
| Legend | Below chart, horizontal |
| Click segment | Filter sales history by payment type |

### 8.4 Debt Aging Distribution (Stacked Bar)

| Property | Value |
|----------|-------|
| Position | Row 6, cols 1–6 |
| Title | "Debt Aging" |
| Chart type | Horizontal stacked bar |
| Buckets | Current (0–7d), 8–30d, 31–60d, 61–90d, 90d+ |
| Colors | Gradient green → yellow → red across buckets |
| X-axis | Amount (currency per toggle) |
| Click bucket | → `/customers?filter=aging_{bucket}` |

### 8.5 Top Products Bar Chart

| Property | Value |
|----------|-------|
| Position | Row 7, cols 6–12 |
| Title | "Top 5 Products" |
| Chart type | Horizontal bar |
| Data | Top 5 by selected ranking metric (synced with table) |
| Bar color | `#2563EB` (UZS) / `#16A34A` (USD) |
| Y-axis | Product name, truncated 20 chars |
| Click bar | → `/products/{id}` |

---

## 9. Top Products Widget

### 9.1 Container

| Property | Value |
|----------|-------|
| Position | Row 6, cols 7–12 (table); pairs with bar chart in row 7 |
| Permission | `dashboard.top_products` |
| Min height | 280px |

### 9.2 Header

| Element | Spec |
|---------|------|
| Title | "Top Products" + period in muted parens |
| Sort dropdown | `Select` width 160px: "By Revenue", "By Quantity", "By Profit", "Slow Moving" |
| Row count | Default 10; "Show all" link → reports |

### 9.3 Table Columns (Desktop)

| Column | Width | Align | Content |
|--------|-------|-------|---------|
| # | 40px | center | Rank 1–10 |
| Product | flex | left | Name + SKU `body-sm` muted |
| Qty | 80px | right | Units sold |
| Revenue UZS | 120px | right | Formatted UZS |
| Revenue USD | 100px | right | Formatted USD |
| Profit | 100px | right | Gross profit, abbreviated (e.g. 4.2M) |

**Column visibility by currency toggle**: Hide UZS or USD column in single-currency modes.

### 9.4 Row Interactions

| Action | Behavior |
|--------|----------|
| Row hover | Background `--secondary` |
| Row click | → `/products/{id}` |
| Keyboard | Up/down navigates rows; Enter opens product |

### 9.5 Slow Moving Mode

- Shows bottom 10 by quantity
- Rank numbers gray; optional "Low" badge on items with zero sales

### 9.6 Tablet

- Hide Profit column; horizontal scroll if needed
- SKU moves to subtitle under name

### 9.7 Mobile

- Table becomes card list (see Section 12)
- Each card: rank badge, name, primary metric, chevron

---

## 10. Recent Activity Feed

### 10.1 Container

| Property | Value |
|----------|-------|
| Position | Row 7, cols 1–5 |
| Permission | `dashboard.view` (content filtered by other permissions) |
| Title | "Recent Activity" |
| Max items | 25 visible; virtual scroll for more |
| Min height | 360px |

### 10.2 Feed Item Structure

```
┌─────────────────────────────────────────────────────┐
│ [icon]  Sale completed · Cement 50kg × 10           │
│         45 200 000 so'm · Dilshod · 2 min ago     │
├─────────────────────────────────────────────────────┤
│ [icon]  Payment received · Alisher Karimov          │
│         1 500 000 so'm · Manager · 5 min ago        │
└─────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Item height | 64px min |
| Icon circle | 32×32px, colored background 10% opacity |
| Line 1 | `body` 14px / 500 — action + primary entity |
| Line 2 | `body-sm` 12px muted — amount, actor, relative time |
| Divider | 1px `--border` between items |
| Unread dot | 6px primary dot for items since last view (optional P2) |

### 10.3 Event Types & Icons

| Event | Icon | Color | Permission Gate |
|-------|------|-------|-----------------|
| Sale completed | `ShoppingCart` | Blue | `dashboard.revenue` |
| Sale cancelled | `XCircle` | Red | `dashboard.revenue` |
| Payment received | `Banknote` | Green | `dashboard.debt` |
| Stock received | `PackagePlus` | Purple | `dashboard.inventory` |
| Low stock alert | `AlertTriangle` | Amber | `dashboard.inventory` |
| New customer debt | `UserPlus` | Amber | `dashboard.debt` |
| Exchange rate change | `ArrowLeftRight` | Slate | `dashboard.view` |

### 10.4 Interactions

| Action | Behavior |
|--------|----------|
| Click item | Navigate to entity detail (sale, customer, product) |
| "View all" footer link | → `/admin/audit-logs` (admin) or filtered activity report |
| Real-time | New items prepend with slide-down animation 200ms; list auto-scrolls if user at top |

### 10.5 Empty State

Illustration + "No activity in this period" + suggestion to widen period.

---

## 11. Real-Time Update Behavior

### 11.1 Connection Indicator

Uses global TopBar `ConnectionIndicator`:

| State | Visual | Dashboard behavior |
|-------|--------|-------------------|
| Connected | Green dot | Live updates enabled |
| Reconnecting | Amber pulsing dot | Banner below header: "Reconnecting…" |
| Offline | Red dot | Stale data badge on widgets; timestamp frozen |

### 11.2 WebSocket Events → Widget Mapping

| Event | Affected Widgets | Animation |
|-------|------------------|-----------|
| `sale.completed` | Total Sales, Sale Count, Cash/Credit, Profit, Top Products, Sales Trend, Activity | Count-up 400ms ease-out |
| `sale.cancelled` | Same as above | Count-down |
| `debt.payment_received` | Payments, Outstanding Debt, Activity | Count-up |
| `inventory.stock_changed` | Catalog Value, Low Stock, Out of Stock, Activity | Count-up |
| `currency.rate_changed` | Exchange Rate, USD displays | Crossfade values |

### 11.3 Update Rules

| Rule | Detail |
|------|--------|
| Debounce | Batch rapid events within 500ms window |
| Period scope | Real-time updates apply only to KPIs scoped to current period (e.g. "Today") |
| Outstanding debt | Always live regardless of period |
| Chart updates | Append/reconcile data point; no full chart flash |
| Top products | Re-sort if rank changes; highlight changed row 1s amber background |
| Sound | None by default; optional in settings (P2) |

### 11.4 Reconnection Flow

1. Show reconnecting banner
2. On reconnect: fetch delta since `last_event_id`
3. Reconcile all widget values
4. Toast: "Dashboard updated" (3s, info)
5. Remove stale badges

### 11.5 Manual Refresh

- Refresh button triggers full KPI reload
- Icon spins 360° during load
- Does not reset period or currency selection

---

## 12. Role-Based Widget Visibility

### 12.1 Permission Matrix

| Widget Group | `dashboard.view` | `dashboard.revenue` | `dashboard.debt` | `dashboard.inventory` | `dashboard.top_products` |
|--------------|------------------|---------------------|------------------|----------------------|--------------------------|
| Page access | ✓ | — | — | — | — |
| Revenue KPIs | — | ✓ | — | — | — |
| Profit KPIs | — | ✓ | — | — | — |
| Debt KPIs | — | — | ✓ | — | — |
| Inventory KPIs | — | — | — | ✓ | — |
| Exchange Rate | ✓ | — | — | — | — |
| Sales charts | — | ✓ | — | — | — |
| Debt aging | — | — | ✓ | — | — |
| Top products | — | — | — | — | ✓ |
| Activity (sales) | — | ✓ | — | — | — |
| Activity (payments) | — | — | ✓ | — | — |
| Activity (inventory) | — | — | — | ✓ | — |

### 12.2 Role Presets (Default Layouts)

#### Owner / Company Admin

- Full 12-column layout per Section 6.1
- All widgets visible per permissions
- Branch selector: all branches

#### Manager

- Revenue, profit, debt, inventory KPIs
- Sales trend, payment split, debt aging
- Top products table + chart
- Activity feed
- No exchange rate edit; view only

#### Cashier (limited dashboard)

- Redirect from `/dashboard` to **Cashier Summary** variant OR show reduced layout:
  - Personal sales today (KPI)
  - Branch sales summary (KPI, read-only)
  - Personal recent sales list (replaces activity feed)
- No profit, debt aging, or company-wide inventory value

#### Warehouse

- Inventory KPIs only (4 cards)
- Low stock + out of stock prominent
- Stock activity feed
- No revenue or debt widgets

### 12.3 Layout Customization (P2 — design reserved)

- Drag handle on widget hover (6-dot grip top-left)
- Drag to reorder; snap to grid
- "Reset layout" in user menu
- Saved per user per company

### 12.4 Hidden Widget Behavior

- Widget slot collapses; grid reflows
- No empty placeholders
- No "upgrade" teasers

---

## 13. Responsive Layouts

### 13.1 Desktop XL (≥ 1536px)

- Full layout per Section 6.1
- Sidebar expanded 240px
- All table columns visible

### 13.2 Desktop LG (1280–1535px)

- Same grid; slightly narrower chart tooltips
- Top products: profit column may abbreviate more aggressively

### 13.3 Desktop MD (1024–1279px)

- Sidebar collapsed to 64px icons
- KPI groups: 2 cards per row (6+6)
- Charts stack full width
- Activity feed below top products

```
┌────────────────────────────┐
│ Header + controls (stacked │
│  if needed)                │
├─────────────┬──────────────┤
│ KPI (6)     │ KPI (6)      │
├─────────────┴──────────────┤
│ Sales Trend (12)           │
├────────────────────────────┤
│ Donut (12)                 │
├────────────────────────────┤
│ Debt Aging (12)            │
├────────────────────────────┤
│ Top Products Table (12)    │
├────────────────────────────┤
│ Activity Feed (12)           │
└────────────────────────────┘
```

### 13.4 Tablet (768–1023px)

- Sidebar: overlay drawer (hamburger)
- Page header: title full width; controls wrap to second row
- Period selector: horizontal scroll if overflow
- KPI cards: 2 per row (4-column grid → span 2)
- Charts: full width, height 280px
- Tables: card view OR horizontal scroll with frozen first column
- Touch targets: 44px minimum

### 13.5 Mobile (320–767px) — Flutter

- Bottom tab: Dashboard is Home tab
- App bar: company name + connection dot
- Pull-to-refresh on entire page
- Period selector: horizontal scroll chips
- Currency toggle: full width below period
- KPI cards: 1 per row (4-col span 4)
- Charts: swipeable carousel (Sales → Donut → Debt → Top 5)
  - Dot indicators below carousel
  - Height 240px per slide
- Top products: card list

**Mobile product card:**

```
┌──────────────────────────────────────┐
│ #1  Cement 50kg                  ›  │
│     MKT-CEM-50                       │
│     450 sold · 20.25M so'm           │
└──────────────────────────────────────┘
```

- Activity feed: last 10 items; "See all" → full-screen list
- Branch selector: bottom sheet picker

### 13.6 Mobile Wireframe

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
│ ┌─────────────────────┐ │
│ │ GROSS PROFIT        │ │
│ │ ...                 │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ ○ ● ○ ○  (chart carousel)│
│ [    Sales Chart      ] │
├─────────────────────────┤
│ Recent Activity         │
│ · Sale completed...     │
└─────────────────────────┘
│ 🏠  💰  📦  👥  ⋯      │
└─────────────────────────┘
```

---

## 14. Empty, Loading, and Error States

### 14.1 Loading — Initial Page Load

| Element | Treatment |
|---------|-----------|
| KPI cards | `LoadingSkeleton` — 3 gray bars per card |
| Charts | Shimmer rectangle full chart area |
| Table | 5 skeleton rows, 40px height |
| Activity | 6 skeleton items |
| Duration | Show skeleton minimum 300ms to avoid flash |
| Header controls | Remain interactive |

### 14.2 Loading — Period Change

- Inline skeleton overlay per widget (not full page)
- Segmented controls stay visible
- No blocking modal

### 14.3 Empty — No Sales in Period

| Widget | Empty Message | CTA |
|--------|---------------|-----|
| Revenue KPIs | `0` with flat trend | — |
| Sales chart | Illustration (empty chart) + "No sales in this period" | "View sales history" link |
| Top products | "No products sold" | — |
| Activity | "No activity in this period" | "Try a wider date range" |

### 14.4 Empty — New Company / No Data Ever

- Full-page empty state centered in grid area
- Illustration: dashboard outline
- Headline: "Your dashboard will come alive with your first sale"
- Primary CTA: "Create first sale" → `/sales/new` (if permitted)
- Secondary: "Add products" → `/products` (if permitted)

### 14.5 Empty — Permission Restricted

- User has `dashboard.view` only (no sub-permissions)
- Show exchange rate widget + message card: "Contact your administrator for access to sales and inventory metrics"

### 14.6 Error — API Failure

| Scope | Treatment |
|-------|-----------|
| Full page | Banner: "Couldn't load dashboard" + Retry button |
| Single widget | Widget-level error: icon `AlertCircle` + "Failed to load" + inline Retry |
| Partial data | Load available widgets; failed ones show error state |
| Stale cache | Show last known values + amber badge "Data may be outdated" |

### 14.7 Error — WebSocket Failure

- KPIs show last REST-fetched values
- Banner: "Live updates unavailable" + reconnect status
- Polling fallback every 60s (indicator in banner)

### 14.8 Error — Branch Not Found

- Toast error if selected branch deleted
- Reset to "All Branches"

---

## 15. Drill-Down Navigation

### 15.1 Navigation Map

| Source | Target | Parameters |
|--------|--------|------------|
| Total Sales KPI | Sales History | `period`, `branch` |
| Sale Count KPI | Sales History | same |
| Cash/Credit KPIs | Sales History | `payment_type` |
| Gross Profit KPI | Sales Profit Report | `period` |
| Outstanding Debt | Customer List | `filter=has_debt` |
| Payments KPI | Debt Payments | `period` |
| Overdue Debt | Customer List | `filter=overdue` |
| Inventory Value | Stock Overview | `branch` |
| Low/Out of Stock | Stock Overview | `filter` |
| Exchange Rate | Exchange Rate Settings | — |
| Sales chart point | Sales History | `date` |
| Donut segment | Sales History | `payment_type` |
| Debt aging bucket | Customer List | `aging_bucket` |
| Top product row | Product Detail | `product_id` |
| Activity item | Entity detail | contextual |

### 15.2 Drill-Down Interaction Pattern

1. Hover: widget shows subtle elevation + "View details" tooltip on KPI cards
2. Click/tap: navigate with breadcrumb context preserved
3. Back navigation: browser back returns to dashboard with **period, currency, branch preserved** (session state)
4. Keyboard: Enter on focused widget triggers drill-down

### 15.3 Breadcrumb on Target Page

Example after drilling from dashboard:

```
Dashboard > Sales History
```

"Dashboard" is clickable; restores dashboard state.

### 15.4 Modal Drill-Down (optional quick view)

- Alt+click (desktop) on KPI opens `Sheet` (480px right panel) with mini table preview
- "Open full report" link at bottom of sheet
- P2 feature — wireframe reserved in Figma page `Dashboard / Modals / Quick View`

---

## 16. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | WCAG AA for all text on cards |
| Trend not color-only | Icon + text for direction |
| Chart data | Accessible table toggle ("View as table") on each chart |
| Focus order | Header controls → KPI row L→R, T→B → charts → tables → feed |
| Screen reader | KPI announces: "{label}: {value}, {trend}" |
| Reduced motion | Disable count-up animation; instant value swap |

See [ACCESSIBILITY.md](./ACCESSIBILITY.md).

---

## 17. Localization Notes

| Element | Uzbek (uz) | Russian (ru) |
|---------|------------|--------------|
| Page title | Boshqaruv paneli | Панель управления |
| Today | Bugun | Сегодня |
| vs yesterday | kechagi bilan | vs вчера |
| Currency so'm | so'm | сум |

Number formatting always follows locale; currency symbols stay as specified.

---

## 18. Figma Deliverables Checklist

| Artifact | Frames Required |
|----------|-----------------|
| Desktop default | Owner, Manager, Warehouse, Cashier |
| Tablet | Manager default |
| Mobile | Manager + Cashier summary |
| Period selector | All segments + custom popover |
| Currency toggle | UZS, USD, Both |
| Each KPI card | Default, loading, error, hover |
| Each chart | Populated, empty, loading |
| Top products | Table + mobile cards |
| Activity feed | Populated, empty |
| Real-time | Reconnecting banner, stale badge |
| Drill-down sheet | P2 quick view |

---

## Related Documents

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
- [DESKTOP_UI_SPEC.md](./DESKTOP_UI_SPEC.md)
- [MOBILE_UI_SPEC.md](./MOBILE_UI_SPEC.md)
- [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md)
- [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md)
- [../08-modules/DASHBOARD.md](../08-modules/DASHBOARD.md)
- [../08-modules/BRANCH_MANAGEMENT.md](../08-modules/BRANCH_MANAGEMENT.md)
