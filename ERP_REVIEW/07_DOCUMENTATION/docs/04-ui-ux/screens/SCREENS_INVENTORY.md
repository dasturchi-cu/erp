# Inventory Screens — Figma Specification

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Figma Handoff |
| Last Updated | 2026-06-17 |
| Platform | Windows Desktop (Electron), Android/iOS (Flutter), Tablet |
| Figma Page | `06 — Inventory` |
| Parent Document | [UI_UX_MASTER_BLUEPRINT.md](../UI_UX_MASTER_BLUEPRINT.md) |
| Screen Registry | [SCREEN_HIERARCHY.md](../SCREEN_HIERARCHY.md) |
| Module Reference | [INVENTORY.md](../../08-modules/INVENTORY.md), [FIFO.md](../../08-modules/FIFO.md) |

---

## 1. Purpose

This document provides **Figma-ready, per-screen UX specifications** for all Inventory module screens. Each screen includes wireframes for desktop, tablet, and mobile; component trees; state management; permissions; data flow; and exhaustive state definitions. Designers must be able to build all frames without additional clarification.

**Out of scope**: Implementation code, API schemas, database DDL.

---

## 2. Figma Setup

### 2.1 Frame Naming Convention

```
Inventory / {Screen Name} / {Breakpoint} / {State}

Examples:
  Inventory / Stock Overview / Desktop LG / Default
  Inventory / Warehouses / Mobile / Empty
  Inventory / Receive Stock / Desktop LG / Confirm Modal
  Inventory / Stock Adjustments / Tablet / Approval Pending
```

### 2.2 Base Frame Sizes

| Breakpoint Token | Frame Width × Height | Columns | Gutter | Margin |
|------------------|----------------------|---------|--------|--------|
| Desktop XL (`2xl`) | 1536 × 900 | 12 | 24px | 32px |
| Desktop LG (`xl`) | 1280 × 800 | 12 | 24px | 24px |
| Desktop MD (`lg`) | 1024 × 768 | 12 | 16px | 16px |
| Tablet (`md`) | 768 × 1024 | 8 | 16px | 16px |
| Mobile (`sm`) | 390 × 844 | 4 | 12px | 16px |

### 2.3 Inventory Shell (Desktop)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TopBar (56px) — global; includes CompanySwitcher, BranchSwitcher, rate     │
├────────┬───────────────────────────────────────────────────────────────────┤
│Sidebar │ Breadcrumbs: Inventory > {Screen}                    (32px row)   │
│ 240px  ├───────────────────────────────────────────────────────────────────┤
│        │ PAGE HEADER (min 72px): Title + subtitle + primary actions         │
│        ├───────────────────────────────────────────────────────────────────┤
│        │ KPI STRIP (optional, 88px) — StatCards for stock summary         │
│        ├───────────────────────────────────────────────────────────────────┤
│        │ FILTER BAR (48–56px) — search, chips, warehouse/branch selectors   │
│        ├───────────────────────────────────────────────────────────────────┤
│        │ MAIN CONTENT — DataTable, Form, or split panel                     │
│        │                                                                   │
└────────┴───────────────────────────────────────────────────────────────────┘
```

### 2.4 Inventory Sidebar Sub-Navigation

| Order | Label (EN) | Label (UZ) | Route | SCR-ID | Permission | Icon |
|-------|------------|------------|-------|--------|------------|------|
| 0 | Stock Overview | Ombor ko'rinishi | `/inventory` | SCR-060 | `inventory.view` | `Package` |
| 1 | Warehouses | Omborxonalar | `/inventory/warehouses` | SCR-061 | `inventory.view` | `Warehouse` |
| 2 | Stock Movements | Harakatlar | `/inventory/movements` | SCR-062 | `inventory.view` | `ArrowLeftRight` |
| 3 | Receive Stock | Qabul qilish | `/inventory/receive` | SCR-063 | `inventory.receive` | `PackagePlus` |
| 4 | Adjustments | Tuzatishlar | `/inventory/adjustments` | SCR-064 | `inventory.adjust` | `SlidersHorizontal` |

Items without permission are **hidden**, not disabled.

### 2.5 Shared Design Tokens

| Token | Value | Inventory Usage |
|-------|-------|-----------------|
| `--primary` | #2563EB | Primary actions, inbound movement accent |
| `--success` | #16A34A | In-stock, positive quantity delta |
| `--warning` | #D97706 | Low stock, pending approval |
| `--destructive` | #DC2626 | Out of stock, negative adjustment |
| UZS accent | `--primary` tint | UZS cost columns |
| USD accent | `--success` tint | USD cost columns |
| Table row height | 40px desktop / 44px tablet | DataTable compact |
| Card radius | 6px | Summary cards, batch cards |

### 2.6 Stock Status Badge Encoding

| Status | Badge Label | Background | Text | Icon |
|--------|-------------|------------|------|------|
| In Stock | In Stock | green 10% | `--success` | `CheckCircle` |
| Low Stock | Low | amber 10% | `--warning` | `AlertTriangle` |
| Out of Stock | Out | red 10% | `--destructive` | `XCircle` |
| Negative | Critical | red 20% | `--destructive` | `AlertOctagon` |

### 2.7 Movement Type Badge Encoding

| Type | Label | Color | Direction Icon |
|------|-------|-------|----------------|
| RECEIPT | Receipt | green | `ArrowDown` |
| SALE | Sale | blue | `ArrowUp` |
| ADJUSTMENT | Adjustment | amber | `Minus` / `Plus` |
| RETURN | Return | teal | `RotateCcw` |
| TRANSFER | Transfer | purple | `ArrowLeftRight` |

---

## 3. Screen Registry

| SCR-ID | Screen Name | Route | Primary Permission | Layout Template |
|--------|-------------|-------|-------------------|-----------------|
| SCR-060 | Inventory / Stock Overview | `/inventory` | `inventory.view` | ListDetailLayout |
| SCR-061 | Warehouses | `/inventory/warehouses` | `inventory.view` | ListDetailLayout |
| SCR-062 | Stock Movements | `/inventory/movements` | `inventory.view` | ListDetailLayout |
| SCR-063 | Receive Stock / Batches | `/inventory/receive` | `inventory.receive` | FormLayout |
| SCR-064 | Stock Adjustments | `/inventory/adjustments` | `inventory.adjust` | FormLayout + List |

---

## 4. SCR-060 — Inventory / Stock Overview

### 4.1 Screen Metadata

| Field | Value |
|-------|-------|
| **Screen ID** | SCR-060 |
| **Route** | `/inventory` |
| **Module** | `inventory` |
| **Layout Template** | CMP-TPL-004 ListDetailLayout |
| **Figma Frame Name** | `Inventory / Stock Overview / {Breakpoint} / {State}` |
| **data-screen-id** | `SCR-060` on page root |

### 4.2 Purpose

Provide a real-time, filterable view of stock levels across all products and warehouses. Warehouse keepers and managers use this screen to identify low-stock items, verify availability before sales, and drill into product or batch detail. Default landing page for the `warehouse` role.

### 4.3 User Roles

| Role | Access | Notes |
|------|--------|-------|
| `admin` | Full view | All branches/warehouses |
| `manager` | Full view | Scoped to assigned branches |
| `warehouse` | Full view | Default landing; branch-scoped |
| `cashier` | No access | Hidden from navigation |
| `viewer` | Read-only | If granted `inventory.view` |

### 4.4 User Permissions

| Permission | Required | Effect |
|------------|----------|--------|
| `inventory.view` | Yes | View screen and data |
| `inventory.receive` | No | Shows "+ Receive Stock" shortcut if granted |
| `products.view` | No | Enables row drill-down to product detail (SCR-042) |
| `inventory.adjust` | No | Shows "Adjust" row action if granted |

### 4.5 Information Architecture

```
Stock Overview
├── Summary KPIs (company/branch scoped)
├── Filter & Search Bar
├── Stock Data Table (primary)
│   ├── Row → Product Detail (SCR-042) [optional]
│   ├── Row action → Receive Stock (SCR-063) pre-filled product
│   └── Row action → Adjust Stock (SCR-064) pre-filled product
└── Export (desktop)
```

### 4.6 Desktop Wireframe Description

```
Content area: 1280px width (Desktop LG), 12-column grid, 24px gutter

Region A — Breadcrumbs (row 1, full width, 32px height)
  Inventory > Stock Overview

Region B — Page Header (row 2, cols 1–12, min 72px)
  Left (cols 1–6):
    H1 "Stock Overview" — 30px/700
    Subtitle — 14px muted: "{Company} · {Branch or All Branches} · Updated {HH:mm}"
  Right (cols 7–12, flex-end, gap 12px):
  [Branch ▼ 200px] [Warehouse ▼ 200px] [⟳ Refresh 36×36] [Export ▼] [+ Receive Stock] (primary, if permitted)

Region C — KPI Strip (row 3, cols 1–12, 88px, gap 16px)
  4× StatCard (equal width, 25% each):
    Card 1: "Total SKUs" — count, no currency
    Card 2: "In Stock" — count, green trend
    Card 3: "Low Stock" — count, amber, clickable → applies low-stock filter
    Card 4: "Out of Stock" — count, red, clickable → applies out-of-stock filter

Region D — Filter Bar (row 4, cols 1–12, 56px)
  [🔍 Search products… 320px] [Category ▼] [Status ▼] [Low stock only ☐]
  Active chips row below (if filters applied): [Category: Electronics ×] [Clear all]

Region E — Data Table (row 5+, cols 1–12, fills remaining viewport)
  Sticky header 44px; virtual scroll body; min 8 visible rows
  Columns — see §4.14 Tables
  Pagination footer 48px: "Showing 1–25 of 1,247" | [25▼] | ◀ 1 2 3 … ▶

Optional Region F — Detail Panel (cols 9–12, when row selected, desktop XL only)
  4-column right panel: Product mini-card, stock by warehouse breakdown, last 5 movements
```

**Exact dimensions (Desktop LG)**:
- Sidebar: 240px fixed
- Content padding: 24px all sides
- KPI card internal padding: 16px
- Filter bar top margin from KPI: 16px
- Table top margin from filter: 0 (flush)

### 4.7 Tablet Wireframe Description

```
Frame: 768 × 1024, 8-column grid, 16px gutter

- Sidebar collapsed to icon rail (64px) or hamburger drawer
- Breadcrumbs truncated: Inventory > Stock
- Page header stacks: Title row, then controls row (Branch + Warehouse full width 50/50)
- KPI strip: 2×2 grid (4 cards, 2 per row, 12px gap)
- Filter bar wraps to 2 rows; search full width row 1
- Data table: hide columns Reserved, Last Movement; horizontal scroll for remaining
- No right detail panel; row tap → full-screen product sheet (bottom sheet style)
- Primary action "+ Receive" becomes FAB bottom-right 56×56
```

### 4.8 Mobile Wireframe Description

```
Frame: 390 × 844, 4-column grid

- TopBar only (no persistent sidebar); hamburger → NavigationDrawer
- Title "Stock" 24px; subtitle muted one line
- KPI strip: horizontal scroll carousel, 160px wide cards, snap scroll
- Search bar sticky below KPI (48px): full width with scan icon (barcode lookup)
- Filter button opens bottom sheet: Category, Status, Warehouse, Low stock toggle
- List mode: card per product (not table)
  Card anatomy (min 96px):
    Row 1: Product name (16px/600) + StatusBadge right
    Row 2: SKU · Barcode (12px muted)
    Row 3: Qty available (18px/700) + warehouse name (12px)
    Row 4: Last movement date (12px muted)
- Pull-to-refresh enabled
- FAB: Receive Stock (if permitted), 56×56, bottom-right, 16px inset + safe area
- Infinite scroll pagination (25 per page)
```

### 4.9 Layout Structure

| Breakpoint | Grid | KPI Layout | Table vs Cards |
|------------|------|------------|----------------|
| Desktop XL/LG | 12-col | 4 across | DataTable |
| Desktop MD | 12-col | 4 across (smaller) | DataTable, fewer columns |
| Tablet | 8-col | 2×2 | DataTable (condensed) |
| Mobile | 4-col | Horizontal scroll | Card list |

### 4.10 Navigation Pattern

| Direction | Path |
|-----------|------|
| **Arrives from** | Sidebar Inventory → Stock Overview; Command palette "stock"; Dashboard low-stock alert link; Product detail back nav |
| **Leaves to** | SCR-042 Product Detail (row click); SCR-063 Receive (action/pre-fill `?productId=`); SCR-064 Adjust (action); SCR-062 Movements (filter by product) |
| **Deep link** | `/inventory?warehouse={id}&status=low&search={q}` restores filters |
| **Back behavior** | Preserves scroll position and filter state in session storage |

### 4.11 Components (CMP-IDs)

| Component | ID | Usage |
|-----------|-----|-------|
| AppShellLayout | CMP-TPL-001 | Page shell |
| ListDetailLayout | CMP-TPL-004 | Main layout |
| DataTable | CMP-ORG-001 | Stock table |
| FilterBar | CMP-ORG-029 | Filters |
| StatCard | CMP-MOL-008 | KPI cards |
| StatusBadge | CMP-MOL-022 | Stock status |
| SearchField | CMP-MOL-003 | Product search |
| BranchSwitcher | CMP-ORG-020 | Branch filter |
| Select | CMP-MOL-005 | Warehouse dropdown |
| ExportButton | CMP-ORG-030 | CSV export |
| Button | CMP-MOL-001 | Actions |
| EmptyState | CMP-MOL-014 | No results |
| Sheet | CMP-ORG-006 | Mobile filters, detail |
| Breadcrumb | CMP-MOL-011 | Navigation |

### 4.12 Component Tree

```
StockOverviewPage [SCR-060]
├── AppShellLayout [CMP-TPL-001]
│   ├── TopBar [CMP-ORG-003]
│   ├── Sidebar [CMP-ORG-002] — Inventory section active
│   └── MainContent
│       ├── Breadcrumb [CMP-MOL-011]
│       ├── PageHeader
│       │   ├── TitleBlock (H1 + subtitle)
│       │   └── HeaderActions
│       │       ├── BranchSwitcher [CMP-ORG-020]
│       │       ├── WarehouseSelect [CMP-MOL-005]
│       │       ├── RefreshButton [CMP-MOL-001]
│       │       ├── ExportButton [CMP-ORG-030]
│       │       └── ReceiveStockButton [CMP-MOL-001] (conditional)
│       ├── KpiGrid
│       │   ├── StatCard [CMP-MOL-008] × 4
│       ├── FilterBar [CMP-ORG-029]
│       │   ├── SearchField [CMP-MOL-003]
│       │   ├── CategorySelect [CMP-MOL-005]
│       │   ├── StatusSelect [CMP-MOL-005]
│       │   ├── LowStockCheckbox [CMP-MOL-006]
│       │   └── FilterChip [CMP-MOL-026] × n
│       ├── DataTable [CMP-ORG-001] (desktop/tablet)
│       │   ├── SortHeader [CMP-MOL-027] × columns
│       │   ├── TableRow × n
│       │   │   ├── StatusBadge [CMP-MOL-022]
│       │   │   ├── CurrencyDisplay [CMP-MOL-021] (cost cols)
│       │   │   └── RowActions [CMP-MOL-017]
│       │   ├── Pagination [CMP-MOL-015]
│       │   └── EmptyState [CMP-MOL-014]
│       ├── ProductCardList (mobile only)
│       │   └── StockProductCard × n
│       └── DetailPanel [CMP-ORG-007] (desktop XL, optional)
│           ├── ProductSummaryCard
│           └── RecentMovementsList
└── LoadingOverlay [CMP-MOL-030] (initial load)
```

### 4.13 Forms

No primary form on this screen. Filter controls only.

| Control | Type | Validation | Default |
|---------|------|------------|---------|
| Search | Text | Min 0 chars; debounce 300ms | Empty |
| Category | Select | Optional | All |
| Status | Select | Enum: All, In Stock, Low, Out, Negative | All |
| Low stock only | Checkbox | — | Unchecked |
| Branch | Select | Required if multi-branch | User default branch |
| Warehouse | Select | Optional | All warehouses |

### 4.14 Tables

| Column | Width | Sort | Align | Format | Notes |
|--------|-------|------|-------|--------|-------|
| Product | 220px | A–Z | Left | Name + SKU subline | Sticky left desktop |
| Barcode | 120px | — | Left | Monospace | Hidden mobile |
| Category | 140px | A–Z | Left | Text | Hidden tablet |
| Warehouse | 140px | A–Z | Left | Name | Hidden when single warehouse filtered |
| On Hand | 100px | Numeric | Right | `#,###.##` | Bold |
| Reserved | 90px | Numeric | Right | `#,###.##` | Hidden tablet/mobile |
| Available | 100px | Numeric | Right | `#,###.##` | On Hand − Reserved |
| Status | 110px | — | Center | StatusBadge | — |
| Avg Cost (UZS) | 120px | Numeric | Right | Currency | Permission: hide from cashier |
| Avg Cost (USD) | 110px | Numeric | Right | Currency | Permission: hide from cashier |
| Last Movement | 130px | Date ↓ default | Left | Relative + tooltip absolute | — |
| Actions | 80px | — | Center | Icon menu | View, Receive, Adjust |

**Default sort**: Available ascending (low stock surfaces first when combined with status filter).

**Row click**: Navigate to `/products/:id` tab Stock (if `products.view`).

### 4.15 Search Behavior

| Input | Behavior |
|-------|----------|
| SKU exact | Immediate filter, top result pinned |
| Barcode exact | Immediate filter; scanner Enter submits |
| Name partial | Debounced 300ms; min 2 chars |
| Mixed | OR across SKU, barcode, name |
| No results | Empty state with "Clear filters" CTA |
| Scanner wedge | BarcodeInput behavior: rapid keystrokes < 50ms → auto-submit |

### 4.16 Filters

| Filter | Type | Options | Persistence |
|--------|------|---------|-------------|
| Branch | Select | All + assigned branches | URL query `branch` |
| Warehouse | Select | All + branch warehouses | URL query `warehouse` |
| Category | Select searchable | Product categories tree flat | URL query `category` |
| Status | Select | All, In Stock, Low, Out, Negative | URL query `status` |
| Low stock only | Checkbox | Overrides status | URL query `lowStock=true` |

Clear all resets to branch default + no filters.

### 4.17 Modals

| Modal | Trigger | Size | Content |
|-------|---------|------|---------|
| Export Options | Export button | 400px | Format: CSV, Excel; scope: filtered/all; columns checklist |
| Column Settings | Table ··· menu | 480px | Toggle visible columns; drag reorder (desktop) |

### 4.18 Drawers

| Drawer | Platform | Trigger | Content |
|--------|----------|---------|---------|
| Filter Sheet | Mobile/Tablet | Filter chip button | All filters stacked |
| Product Quick View | Tablet/Mobile | Row tap | Stock breakdown, actions |
| Warehouse Breakdown | Desktop | Row expand icon | Per-warehouse qty table |

### 4.19 Charts/Widgets

KPI StatCards only — no charts on this screen. Low-stock count card links to filtered view (not a chart).

### 4.20 Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `Ctrl+R` | Refresh data |
| `Ctrl+E` | Open export |
| `↑` `↓` | Navigate table rows |
| `Enter` | Open selected product |
| `F5` | Receive stock (if permitted) |
| `Esc` | Clear search / close panel |

### 4.21 User Actions

| Type | Action | Permission | Result |
|------|--------|------------|--------|
| Primary | + Receive Stock | `inventory.receive` | Navigate SCR-063 |
| Secondary | Export | `inventory.view` | Download file |
| Secondary | Refresh | `inventory.view` | Reload data |
| Row | View product | `products.view` | Navigate SCR-042 |
| Row | Receive | `inventory.receive` | SCR-063 `?productId=` |
| Row | Adjust | `inventory.adjust` | SCR-064 `?productId=` |
| Destructive | — | — | None on this screen |

### 4.22 Data Flow

| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| Load stock list | GET | `/inventory/stock` | Query: branch, warehouse, category, status, search, page, sort |
| Load KPI summary | GET | `/inventory/stock/summary` | Aggregates for StatCards |
| Export | POST | `/reports/generate` | Template: `inventory_stock` |
| Product drill-down | GET | `/products/:id` | On row navigate |

**WebSocket subscriptions**:

| Event | Handler |
|-------|---------|
| `inventory.stock_changed` | Update matching row qty with 300ms highlight pulse; recalc KPIs |
| `inventory.low_stock` | Increment low-stock KPI; optional toast if product visible |
| `inventory.batch_created` | Update product on-hand if in filtered set |

### 4.23 State Management Requirements

| State | Scope | Storage | Persistence |
|-------|-------|---------|-------------|
| `stockList` | Page | Client cache (React Query / Riverpod) | Stale 30s |
| `filters` | Page | URL search params + session | Session scroll restore |
| `sort` | Page | URL | Per session |
| `pagination` | Page | URL `page`, `pageSize` | Per session |
| `selectedRowId` | Page | Memory | Cleared on navigate |
| `kpiSummary` | Page | Client cache | Invalidated on WS events |
| `branchId` | Global | User context store | Persisted per user |
| `warehouseId` | Page | URL | Per session |

Optimistic updates: **No** — stock figures are server-authoritative.

### 4.24 Empty State

| Condition | Illustration | Title | Body | CTA |
|-----------|--------------|-------|------|-----|
| No products in catalog | Empty shelf | No products yet | Add products before tracking stock | Go to Products (SCR-040) |
| No stock records | Empty box | No stock data | Receive goods to create inventory | Receive Stock (SCR-063) |
| Filters no match | Search magnifier | No matching products | Try different filters | Clear filters |

### 4.25 Loading State

| Region | Pattern |
|--------|---------|
| Initial page | Full content skeleton: 4 KPI rectangles + filter bar skeleton + 10 table row skeletons |
| Refresh | Subtle overlay on table only; KPIs show shimmer |
| Filter change | Table body skeleton; KPIs unchanged |
| WS update | Row-level shimmer on affected row only (200ms) |

Minimum skeleton display: 200ms to avoid flash.

### 4.26 Error State

| Error | UI |
|-------|-----|
| Network failure | Inline Alert above table: "Unable to load stock. Check connection." [Retry] |
| 403 Forbidden | Redirect SCR-190 |
| Partial KPI failure | KPI cards show "—" with warning icon; table may still load |
| WS disconnected | ConnectionIndicator in TopBar; data labeled "May be stale" after 60s |

### 4.27 Success State

| Action | Feedback |
|--------|----------|
| Export complete | Toast: "Export ready" with download link |
| Filter applied | Filter chips visible; results count updates |
| Real-time update | Row highlight pulse green 2s; KPI counter animates |

### 4.28 Real-Time Update Behavior

- Subscribe on mount to company-scoped `inventory.*` channel
- `inventory.stock_changed`: match `productId` + `warehouseId`; update On Hand, Available, Status badge; animate cell
- Debounce KPI recalculation 500ms when multiple events arrive (bulk sale)
- If sorted column affected, re-sort client-side or refetch page based on config

### 4.29 Accessibility (WCAG 2.2)

| Requirement | Implementation |
|-------------|----------------|
| Table | `<table>` semantics or ARIA grid; sort announced via `aria-sort` |
| Status | Badge text not color-only; icon + label |
| Live updates | `aria-live="polite"` region for KPI changes |
| Focus | Skip link to table; row focus ring 2px `--ring` |
| Contrast | Status badges meet 4.5:1 |
| Keyboard | Full table navigation per §4.20 |

---

## 5. SCR-061 — Warehouses

### 5.1 Screen Metadata

| Field | Value |
|-------|-------|
| **Screen ID** | SCR-061 |
| **Route** | `/inventory/warehouses` |
| **Module** | `inventory` |
| **Layout Template** | CMP-TPL-004 ListDetailLayout |
| **Figma Frame Name** | `Inventory / Warehouses / {Breakpoint} / {State}` |

### 5.2 Purpose

Manage physical storage locations within branches. Users create and configure warehouses, designate default receiving locations, view stock totals per warehouse, and deactivate warehouses when empty. Foundation for receiving, movements, and branch-scoped stock.

### 5.3 User Roles

| Role | Access |
|------|--------|
| `admin` | Full CRUD |
| `manager` | Create/edit within assigned branches |
| `warehouse` | View + edit notes; no delete |
| `cashier` | No access |

### 5.4 User Permissions

| Permission | Effect |
|------------|--------|
| `inventory.view` | View list and detail |
| `inventory.warehouse.manage` | Create, edit, deactivate warehouses |
| `settings.branches` | Required to assign warehouse to new branch |

### 5.5 Information Architecture

```
Warehouses
├── Branch Selector (multi-branch)
├── Warehouse List (table/cards)
│   ├── Row → Warehouse Detail Panel
│   └── Actions: Edit, Set Default, Deactivate
├── Create Warehouse Modal
└── Warehouse Detail
    ├── Info card (code, address, status)
    ├── Stock summary (SKU count, total units)
    └── Products in warehouse (top 10 + link to SCR-060 filtered)
```

### 5.6 Desktop Wireframe Description

```
Region A — Breadcrumbs: Inventory > Warehouses

Region B — Page Header (72px)
  Left: H1 "Warehouses" + subtitle "{n} active warehouses · {Branch}"
  Right: [Branch ▼ 200px] [+ Create Warehouse] primary (if manage permission)

Region C — Split Layout (cols 1–12, remaining height)
  Left Panel (cols 1–5, 40%):
    DataTable / master list
    Columns: Code, Name, Branch, Status, Default badge
    Row height 44px; selected row `--primary` 8% background
  Right Panel (cols 6–12, 60%):
    Warehouse Detail Card (fills panel)
    ┌─────────────────────────────────────────────┐
    │ WH-01 · Showroom Floor          [Default]   │
    │ Branch: Tashkent Main          [ACTIVE]     │
    │ Address: Ground floor, Section A              │
    │ Code: WH-01 · Created 2024-01-15            │
    ├─────────────────────────────────────────────┤
    │ STOCK SUMMARY                                 │
    │ 142 SKUs · 12,450 units · 3 low-stock alerts  │
    ├─────────────────────────────────────────────┤
    │ TOP PRODUCTS BY QTY (mini table, 5 rows)      │
    ├─────────────────────────────────────────────┤
    │ [View All Stock] [Edit] [Set as Default]      │
    │ [Deactivate] (destructive, if empty)          │
    └─────────────────────────────────────────────┘

Empty right panel (no selection):
  EmptyState "Select a warehouse to view details"
```

### 5.7 Tablet Wireframe Description

- Master-detail becomes stacked: list full width top 50%
- Selecting row expands detail card below list (push layout)
- Create button in header; edit opens full-width Sheet from right (400px)
- Branch selector full width above list

### 5.8 Mobile Wireframe Description

- Card list only (no split panel)
- Card: Name (16px/600), Code + Branch (12px), Status badge, stock count
- Tap card → navigate to `/inventory/warehouses/:id` full-screen detail
- FAB: + Create (if permitted)
- Detail screen: header with back, info sections stacked, actions in sticky footer

### 5.9 Layout Structure

| Breakpoint | Master-Detail | List Columns |
|------------|---------------|--------------|
| Desktop | 40/60 split | 5 columns |
| Tablet | Stacked | 4 columns |
| Mobile | Separate routes | Card layout |

### 5.10 Navigation Pattern

| Direction | Path |
|-----------|------|
| Arrives from | Sidebar; SCR-063 warehouse selector "Manage warehouses" link |
| Leaves to | SCR-060 filtered `?warehouse={id}`; SCR-063 with warehouse pre-selected |
| Create | Modal (desktop) / full page (mobile) |

### 5.11 Components

| Component | ID |
|-----------|-----|
| DataTable | CMP-ORG-001 |
| Card | CMP-ORG-007 |
| Form | CMP-ORG-009 |
| Dialog | CMP-ORG-005 |
| ConfirmDialog | CMP-MOL-028 |
| StatusBadge | CMP-MOL-022 |
| StatCard | CMP-MOL-008 |
| BranchSwitcher | CMP-ORG-020 |
| Sheet | CMP-ORG-006 |

### 5.12 Component Tree

```
WarehousesPage [SCR-061]
├── AppShellLayout
│   ├── PageHeader
│   │   ├── BranchSwitcher
│   │   └── CreateWarehouseButton
│   ├── MasterDetailLayout
│   │   ├── WarehouseTable [CMP-ORG-001]
│   │   │   └── WarehouseRow × n
│   │   └── WarehouseDetailPanel [CMP-ORG-007]
│   │       ├── WarehouseHeader
│   │       ├── StockSummaryStats
│   │       ├── TopProductsMiniTable
│   │       └── ActionBar
│   └── CreateWarehouseDialog [CMP-ORG-005]
│       └── WarehouseForm [CMP-ORG-009]
```

### 5.13 Forms — Create/Edit Warehouse

| Field | Label (EN/UZ) | Type | Required | Validation |
|-------|---------------|------|----------|------------|
| `name` | Warehouse Name / Omborxona nomi | Text | Yes | 2–100 chars; unique per branch |
| `code` | Code / Kod | Text | Yes | 2–10 chars; alphanumeric + hyphen; unique per company |
| `branch_id` | Branch / Filial | Select | Yes | Must be active branch |
| `address` | Location / Manzil | Textarea | No | Max 500 chars |
| `is_default` | Default for receiving / Qabul uchun asosiy | Checkbox | No | Auto-unchecks previous default |
| `notes` | Notes / Izohlar | Textarea | No | Max 1000 chars |

**Edit only**: `status` — ACTIVE / INACTIVE (cannot deactivate if stock > 0).

### 5.14 Tables — Warehouse List

| Column | Sort | Notes |
|--------|------|-------|
| Code | A–Z | Monospace |
| Name | A–Z | Primary identifier |
| Branch | A–Z | Hidden if single branch company |
| Products | Numeric | SKU count |
| Total Units | Numeric | Sum qty |
| Status | — | ACTIVE / INACTIVE badge |
| Default | — | Star icon if default |

### 5.15 Search Behavior

Search filters by name, code, address. Debounce 300ms. Prefix match prioritized.

### 5.16 Filters

| Filter | Options |
|--------|---------|
| Branch | All / specific |
| Status | Active, Inactive, All |
| Has low stock | Yes/No |

### 5.17 Modals

| Modal | Size | Purpose |
|-------|------|---------|
| Create Warehouse | 560px | New warehouse form |
| Edit Warehouse | 560px | Edit form |
| Set Default Confirm | 400px | "Set WH-02 as default for Tashkent Main?" |
| Deactivate Confirm | 400px | Destructive; lists consequences; blocked if stock > 0 |

### 5.18 Drawers

Mobile edit/create uses full-screen Sheet (100% width).

### 5.19 Charts/Widgets

Stock summary mini-stats only (SKU count, units, low-stock count) — no charts.

### 5.20 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | New warehouse (if permitted) |
| `↑` `↓` | Select warehouse in list |
| `Enter` | Confirm selection / open edit |
| `E` | Edit selected |
| `/` | Focus search |

### 5.21 User Actions

| Type | Action |
|------|--------|
| Primary | Create Warehouse |
| Secondary | View All Stock (filtered SCR-060) |
| Secondary | Set as Default |
| Destructive | Deactivate (only when zero stock) |

### 5.22 Data Flow

| Operation | Endpoint |
|-----------|----------|
| List | GET `/inventory/warehouses?branch={id}` |
| Detail | GET `/inventory/warehouses/:id` |
| Create | POST `/inventory/warehouses` |
| Update | PATCH `/inventory/warehouses/:id` |
| Stock summary | GET `/inventory/warehouses/:id/summary` |

**WebSocket**: `inventory.stock_changed` updates stock summary counts in detail panel.

### 5.23 State Management

| State | Storage |
|-------|---------|
| `warehouses` | Server cache |
| `selectedWarehouseId` | URL `/inventory/warehouses/:id` or memory |
| `branchFilter` | URL query |
| `formDraft` | Memory; warn on navigate away |

### 5.24 Empty State

"No warehouses configured" — CTA Create Warehouse. If branch has none: "Create the first warehouse for {Branch}".

### 5.25 Loading State

Master list skeleton 8 rows; detail panel skeleton card when selection changes.

### 5.26 Error State

Duplicate code: inline field error. Deactivate with stock: modal error "Cannot deactivate — 142 SKUs have stock on hand."

### 5.27 Success State

Toast "Warehouse created" / "Default warehouse updated"; list refreshes; new row highlight 2s.

### 5.28 Real-Time Update Behavior

Detail panel stock counts update on `inventory.stock_changed` for warehouse scope.

### 5.29 Accessibility

List-detail relationship via `aria-owns`; default badge has `aria-label="Default receiving warehouse"`.

---

## 6. SCR-062 — Stock Movements

### 6.1 Screen Metadata

| Field | Value |
|-------|-------|
| **Screen ID** | SCR-062 |
| **Route** | `/inventory/movements` |
| **Module** | `inventory` |
| **Layout Template** | CMP-TPL-004 ListDetailLayout |
| **Figma Frame Name** | `Inventory / Stock Movements / {Breakpoint} / {State}` |

### 6.2 Purpose

Immutable audit trail of every stock quantity change. Managers and warehouse staff trace receipts, sales, adjustments, returns, and transfers back to originating transactions. Primary tool for discrepancy investigation and audit compliance.

### 6.3 User Roles

| Role | Access |
|------|--------|
| `admin` | Full view + export |
| `manager` | Full view + export |
| `warehouse` | View scoped to assigned warehouses |
| `cashier` | No access |

### 6.4 User Permissions

| Permission | Effect |
|------------|--------|
| `inventory.view` | Required |
| `reports.generate` | Required for export |
| `sales.view` | Enables drill-down to sale reference |
| `audit.view` | Shows extended metadata in detail drawer |

### 6.5 Information Architecture

```
Stock Movements
├── Date Range + Filters
├── Movement Data Table
│   └── Row → Movement Detail Drawer
│       └── Reference link → Sale / Batch / Adjustment
└── Export
```

### 6.6 Desktop Wireframe Description

```
Region A — Breadcrumbs: Inventory > Stock Movements

Region B — Page Header
  H1 "Stock Movements"
  Subtitle: "Complete audit trail of inventory changes"
  Right: [Export ▼]

Region C — Filter Bar (64px, two rows allowed)
  Row 1: [DateRangePicker 280px] [Type ▼] [Warehouse ▼] [Product search 240px]
  Row 2: [User ▼] [Reference #] [Clear all]

Region D — Data Table (full width)
  Default sort: performed_at DESC
  12 columns — see §6.14
  Expandable row (optional): shows notes + batch allocation detail
  Color: positive qty green prefix +; negative red prefix −

Region E — Pagination (48px)
```

### 6.7 Tablet Wireframe Description

- Date range full width row
- Filters collapse into "Filters (3)" chip button → Sheet
- Table hides User, Notes columns; horizontal scroll
- Row tap → detail Sheet 50% height

### 6.8 Mobile Wireframe Description

- Sticky filter bar: [Date ▼] [Filters]
- Card list grouped by date (Today, Yesterday, older)
- Card: Time, product name, type badge, qty colored, warehouse
- Tap → full-screen detail
- Infinite scroll
- Export in ··· menu

### 6.9 Layout Structure

12-col desktop table; 4-col mobile cards with date group headers (sticky).

### 6.10 Navigation Pattern

| Arrives | Leaves |
|---------|--------|
| Sidebar; SCR-060 row "View movements"; SCR-063 post-receive | SCR-022 Sale Detail (SALE ref); SCR-063 batch; SCR-064 adjustment |

Deep link: `/inventory/movements?productId=&type=RECEIPT&from=&to=`

### 6.11 Components

DataTable, FilterBar, DateRangePicker, StatusBadge, PeriodSelector, ExportButton, Sheet, Breadcrumb.

### 6.12 Component Tree

```
StockMovementsPage [SCR-062]
├── AppShellLayout
│   ├── PageHeader + ExportButton
│   ├── FilterBar
│   │   ├── DateRangePicker
│   │   ├── MovementTypeSelect
│   │   ├── WarehouseSelect
│   │   ├── ProductSearch
│   │   └── UserSelect
│   ├── DataTable
│   │   ├── MovementRow (expandable)
│   │   └── Pagination
│   └── MovementDetailDrawer [CMP-ORG-006]
│       ├── MovementMetadata
│       ├── ReferenceLink
│       └── BatchAllocationList
```

### 6.13 Forms

Filter-only. Date range required default: Last 7 days.

### 6.14 Tables

| Column | Width | Sort | Format |
|--------|-------|------|--------|
| Date/Time | 150px | DESC default | `DD MMM YYYY, HH:mm` |
| Type | 110px | — | Movement type badge |
| Product | 200px | A–Z | Name + SKU |
| Qty | 90px | Numeric | ±#,###.## colored |
| Warehouse | 130px | — | Name |
| Batch | 120px | — | Batch # link |
| Reference | 140px | — | Sale # / Receipt # link |
| User | 120px | — | Display name |
| Notes | flex | — | Truncated 40 chars + tooltip |

### 6.15 Search Behavior

Product search: name, SKU, barcode. Reference search: exact match on sale/receipt number.

### 6.16 Filters

| Filter | Options |
|--------|---------|
| Date range | Presets + custom (max 1 year range) |
| Type | RECEIPT, SALE, ADJUSTMENT, RETURN, TRANSFER, All |
| Warehouse | All + list |
| Product | Autocomplete |
| User | All users with inventory actions |

### 6.17 Modals

Export modal: format, date range confirmation, row count estimate.

### 6.18 Drawers

**Movement Detail Drawer** (480px desktop / full mobile):

| Field | Value |
|-------|-------|
| Movement ID | UUID truncated |
| Type | Badge |
| Product | Link to SCR-042 |
| Quantity | Large colored |
| Batch | Link if applicable |
| Warehouse | Text |
| Reference | Clickable external link |
| Performed by | Avatar + name + timestamp |
| Notes | Full text |
| FIFO allocation | Table (SALE/TRANSFER out only) |

### 6.19 Charts/Widgets

None.

### 6.20 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `D` | Open date picker |
| `F` | Focus filters |
| `Ctrl+Shift+E` | Export |
| `↑` `↓` | Row navigation |

### 6.21 User Actions

| Type | Action |
|------|--------|
| Primary | — (read-only screen) |
| Secondary | Export |
| Secondary | Open reference |
| Destructive | None — movements are immutable |

### 6.22 Data Flow

| Operation | Endpoint |
|-----------|----------|
| List | GET `/inventory/movements?from&to&type&warehouse&product&user&page` |
| Detail | GET `/inventory/movements/:id` |
| Export | POST `/reports/generate` template `inventory_movements` |

**WebSocket**: `inventory.stock_changed` prepends new movement to list if filters match; row flash 2s.

### 6.23 State Management

| State | Notes |
|-------|-------|
| `filters` | URL-persisted; date range ISO format |
| `expandedRowId` | Memory |
| `movements` | Paginated cache; invalidate on WS |

### 6.24 Empty State

"No movements in selected period" — adjust date range CTA.

### 6.25 Loading State

Table skeleton 15 rows; date filter shows loading spinner in table only on change.

### 6.26 Error State

Date range > 1 year: inline validation "Maximum range is 365 days."

### 6.27 Success State

Export toast; real-time row prepend with subtle slide-in animation.

### 6.28 Real-Time Update Behavior

New movements appear at top when date filter includes today; badge count in sidebar optional Phase 2.

### 6.29 Accessibility

Quantity announced with "inbound" or "outbound"; type badge has text label; table supports sort announcements.

---

## 7. SCR-063 — Receive Stock / Batches

### 7.1 Screen Metadata

| Field | Value |
|-------|-------|
| **Screen ID** | SCR-063 |
| **Route** | `/inventory/receive` |
| **Module** | `inventory` |
| **Layout Template** | CMP-TPL-006 FormLayout |
| **Figma Frame Name** | `Inventory / Receive Stock / {Breakpoint} / {State}` |

### 7.2 Purpose

Primary workflow for receiving goods into inventory. Creates FIFO batches with unit costs in UZS and/or USD, records RECEIPT movements, and updates stock levels. Optimized for barcode scanning and high-throughput warehouse receiving.

### 7.3 User Roles

| Role | Access |
|------|--------|
| `admin` | Full |
| `manager` | Full |
| `warehouse` | Primary user |
| `cashier` | No access |

### 7.4 User Permissions

| Permission | Effect |
|------------|--------|
| `inventory.receive` | Required to access |
| `products.view` | Product search |
| `currency.view` | Show exchange rate reference |

### 7.5 Information Architecture

```
Receive Stock
├── Session Header (warehouse, exchange rate, receipt #)
├── Product Entry (scan/search)
├── Line Items Table (batches pending confirm)
├── Cost Entry Panel
├── Summary Footer
└── Confirm Receipt Modal
```

### 7.6 Desktop Wireframe Description

```
Two-column layout 55/45 within content area

LEFT COLUMN (cols 1–7) — Product Entry
  ┌─────────────────────────────────────────┐
  │ BarcodeInput (auto-focus, 48px)         │
  │ "Scan or search product…"               │
  ├─────────────────────────────────────────┤
  │ ProductPicker results grid (scroll)     │
  │ 3-column tile grid, 120px tiles         │
  │ Image, name, SKU, current stock         │
  └─────────────────────────────────────────┘

RIGHT COLUMN (cols 8–12) — Receipt Panel
  ┌─────────────────────────────────────────┐
  │ RECEIPT DETAILS                         │
  │ Warehouse [▼ WH-01] (required)          │
  │ Supplier Ref [________] (optional)      │
  │ Notes [________________]                │
  ├─────────────────────────────────────────┤
  │ PENDING LINES (CartTable style)         │
  │ Product | Qty | Cost UZS | Cost USD | × │
  │ ─────────────────────────────────────── │
  │ (empty: "Scan products to add")         │
  ├─────────────────────────────────────────┤
  │ SUMMARY                                 │
  │ Lines: 3 · Units: 150                   │
  │ Total cost UZS: 12,500,000              │
  │ Total cost USD: $980.00                 │
  │ Exchange rate: 12,750 (read-only ref)   │
  ├─────────────────────────────────────────┤
  │ [Clear All]        [Confirm Receipt]    │
  └─────────────────────────────────────────┘
```

### 7.7 Tablet Wireframe Description

- Single column; product grid top 45%
- Receipt panel bottom 55% sticky
- BarcodeInput sticky top when scrolling lines

### 7.8 Mobile Wireframe Description

```
Screen 1 — Product scan (default)
  Full-width BarcodeInput + camera scan button [CMP-ORG-034]
  Recent products horizontal scroll
  Cart badge in header (count)

Screen 2 — Line editor (bottom sheet 70%)
  Product header
  Quantity stepper (44pt targets)
  Cost UZS / Cost USD inputs (at least one required)
  [Add to receipt]

Screen 3 — Review (sheet full)
  Line list + Confirm button sticky footer
```

### 7.9 Layout Structure

Desktop: 7+5 column split. Mobile: wizard-like sheets.

### 7.10 Navigation Pattern

| Arrives | Leaves |
|---------|--------|
| Sidebar; SCR-060/061 actions; deep link `?productId=` | SCR-062 filtered RECEIPT; SCR-060 updated stock; success toast |

Unsaved lines warning on navigate away.

### 7.11 Components

ProductPicker, BarcodeInput, BarcodeScanner, Form, CartTable (variant), CurrencyInput, Select, ConfirmDialog, Dialog.

### 7.12 Component Tree

```
ReceiveStockPage [SCR-063]
├── AppShellLayout
│   ├── PageHeader ("Receive Stock")
│   ├── TwoColumnLayout
│   │   ├── ProductEntryColumn
│   │   │   ├── BarcodeInput [CMP-MOL-020]
│   │   │   └── ProductPicker [CMP-ORG-011]
│   │   └── ReceiptPanel [CMP-ORG-007]
│   │       ├── WarehouseForm [CMP-ORG-009]
│   │       ├── ReceiptLinesTable
│   │       ├── ReceiptSummary
│   │       └── ConfirmBar
│   ├── AddLineDialog (qty + cost entry)
│   └── ConfirmReceiptDialog [CMP-MOL-028]
```

### 7.13 Forms

**Warehouse header fields**:

| Field | Required | Validation |
|-------|----------|------------|
| Warehouse | Yes | Active warehouse |
| Supplier ref | No | Max 50 chars |
| Notes | No | Max 500 chars |

**Per-line modal** (after product select):

| Field | Required | Validation |
|-------|----------|------------|
| Quantity | Yes | > 0, max 999,999; decimal 2 places |
| Unit cost UZS | Conditional | ≥ 0; at least one cost required |
| Unit cost USD | Conditional | ≥ 0, 2 decimals |
| Batch number | No | Auto-generated if empty; unique per product |

### 7.14 Tables — Pending Lines

| Column | Editable | Notes |
|--------|----------|-------|
| Product | No | Thumbnail + name |
| Qty | Yes inline | Number input |
| Unit cost UZS | Yes | CurrencyInput |
| Unit cost USD | Yes | CurrencyInput |
| Line total | Computed | Read-only |
| Remove | Action | × icon |

### 7.15 Search Behavior

ProductPicker: same as POS — barcode exact, name fuzzy, SKU prefix.

### 7.16 Filters

N/A — receiving is transactional, not list filter.

### 7.17 Modals

| Modal | Content |
|-------|---------|
| Add Line | Qty + costs for selected product |
| Confirm Receipt | Summary table, batch count, irreversible warning |
| Duplicate product | "Product already in receipt — add quantity?" Merge or separate line |

### 7.18 Drawers

Mobile line editor and review as bottom sheets.

### 7.19 Charts/Widgets

Summary totals only in receipt panel.

### 7.20 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F2` | Focus barcode |
| `Ctrl+Enter` | Confirm receipt |
| `Delete` | Remove selected line |
| `Tab` | Cycle line cost fields |

### 7.21 User Actions

| Type | Action |
|------|--------|
| Primary | Confirm Receipt |
| Secondary | Clear All |
| Secondary | Add product |
| Destructive | Remove line |

### 7.22 Data Flow

| Operation | Endpoint |
|-----------|----------|
| Product search | GET `/products/search?q=` |
| Submit receipt | POST `/inventory/receive` body: `{ warehouseId, lines[], supplierRef, notes }` |
| Exchange rate | GET `/currency/rate` (display only) |

**WebSocket emit**: `inventory.batch_created`, `inventory.stock_changed` on success.

### 7.23 State Management

| State | Persistence |
|-------|-------------|
| `pendingLines` | Session storage (restore on accidental refresh) |
| `warehouseId` | Memory; default from branch default warehouse |
| `isSubmitting` | Memory |
| Clear on success | All pending state cleared |

### 7.24 Empty State

Receipt panel: illustration + "Scan or search to add products to this receipt."

### 7.25 Loading State

Submit button spinner; overlay on panel; disable all inputs.

### 7.26 Error State

| Error | UI |
|-------|-----|
| Validation | Inline per field |
| Product discontinued | Alert in line row |
| Server 409 | Toast "Receipt failed — retry" |

### 7.27 Success State

Success modal: "Received {n} batches · {units} units" [View Movements] [Receive More] [Done]

Confetti animation: **No** (enterprise tone — green check icon only).

### 7.28 Real-Time Update Behavior

Other clients see stock updates via WS; this screen shows success state locally.

### 7.29 Accessibility

Barcode field `aria-label="Barcode scanner input"`; cost fields announce currency; confirm dialog focus trap.

---

## 8. SCR-064 — Stock Adjustments

### 8.1 Screen Metadata

| Field | Value |
|-------|-------|
| **Screen ID** | SCR-064 |
| **Route** | `/inventory/adjustments` |
| **Module** | `inventory` |
| **Layout Template** | FormLayout + list (tabbed) |
| **Figma Frame Name** | `Inventory / Stock Adjustments / {Breakpoint} / {State}` |

### 8.2 Purpose

Record stock corrections from physical counts, damage, theft, expiry, or system errors. Creates ADJUSTMENT movements, applies FIFO rules for negative deltas, and may require manager approval above threshold.

### 8.3 User Roles

| Role | Access |
|------|--------|
| `admin` | Create + approve |
| `manager` | Create + approve |
| `warehouse` | Create; approval if over threshold |

### 8.4 User Permissions

| Permission | Effect |
|------------|--------|
| `inventory.adjust` | Create adjustments |
| `inventory.adjust.approve` | Approve pending adjustments |
| `inventory.view` | View history tab |

### 8.5 Information Architecture

```
Stock Adjustments
├── Tabs: [ New Adjustment ] [ History ]
├── New Adjustment Form
│   ├── Product + Warehouse selection
│   ├── Counted qty vs system qty (delta preview)
│   ├── Reason code + notes
│   └── Submit → Approval or Immediate
└── History table (past adjustments)
```

### 8.6 Desktop Wireframe Description

```
Region B — Page Header
  H1 "Stock Adjustments"
  Tabs below title (40px): New Adjustment | History (badge if pending approvals)

TAB: New Adjustment
  Form card (max-width 720px, centered)
  ┌──────────────────────────────────────────────┐
  │ Product [Search________________] [Scan]       │
  │ Warehouse [▼]                                 │
  │                                               │
  │ SYSTEM QTY        COUNTED QTY                 │
  │     125.00      [  120.00  ]                  │
  │                                               │
  │ DELTA PREVIEW (auto)                          │
  │ ┌──────────────────────────────────────────┐ │
  │ │  −5.00 units (red)  Write-off from FIFO   │ │
  │ │  Affected batches: 2 (expand)             │ │
  │ └──────────────────────────────────────────┘ │
  │                                               │
  │ Reason [▼ PHYSICAL_COUNT]                     │
  │ Notes [________________________________]      │
  │                                               │
  │ ⚠ Requires manager approval (>50 units)       │
  │                                               │
  │ [Cancel]              [Submit Adjustment]     │
  └──────────────────────────────────────────────┘

TAB: History
  Filter bar + DataTable
  Columns: Date, Product, Warehouse, Delta, Reason, Status, User, Actions
  Status: APPLIED, PENDING, REJECTED
```

### 8.7 Tablet Wireframe Description

Tabs full width; form full width with 16px padding; delta preview stacked.

### 8.8 Mobile Wireframe Description

Segmented control top: New | History
New: vertical form, sticky submit footer
History: card list with status badge; tap → detail
Approval actions in detail for managers

### 8.9 Layout Structure

Single-column form max 720px; history full-width table.

### 8.10 Navigation Pattern

| Arrives | Leaves |
|---------|--------|
| SCR-060 row action; sidebar | SCR-062 filtered ADJUSTMENT; stay on History tab after submit |

### 8.11 Components

Form, ProductPicker, BarcodeInput, Select, Alert, DataTable, Tabs, ConfirmDialog, StatusBadge.

### 8.12 Component Tree

```
StockAdjustmentsPage [SCR-064]
├── AppShellLayout
│   ├── PageHeader + Tabs [CMP-ORG-008]
│   ├── TabPanel "new"
│   │   └── AdjustmentForm [CMP-ORG-009]
│   │       ├── ProductPicker
│   │       ├── WarehouseSelect
│   │       ├── QuantityComparison
│   │       ├── DeltaPreviewCard [CMP-ORG-007]
│   │       ├── ReasonSelect
│   │       └── SubmitActions
│   └── TabPanel "history"
│       ├── FilterBar
│       └── AdjustmentsTable [CMP-ORG-001]
```

### 8.13 Forms

| Field | Required | Validation |
|-------|----------|------------|
| Product | Yes | Active product |
| Warehouse | Yes | Active warehouse with stock |
| Counted qty | Yes | ≥ 0 decimal |
| Reason | Yes | Enum reason codes |
| Notes | Conditional | Required if reason THEFT or SYSTEM_ERROR |

**Reason codes**: PHYSICAL_COUNT, DAMAGE, THEFT, EXPIRY, SYSTEM_ERROR.

### 8.14 Tables — History

| Column | Notes |
|--------|-------|
| Date | performed_at |
| Product | Name + SKU |
| Warehouse | — |
| Delta | Colored ± |
| Reason | Code label |
| Status | PENDING / APPLIED / REJECTED |
| User | Created by |
| Actions | Approve/Reject (if pending + permission) |

### 8.15 Search Behavior

History tab: product search + date range.

### 8.16 Filters (History)

Date range, warehouse, reason, status, user.

### 8.17 Modals

| Modal | Purpose |
|-------|---------|
| Submit confirm | Show delta + FIFO impact summary |
| Approve | Manager confirm |
| Reject | Reason required |

### 8.18 Drawers

Adjustment detail drawer with FIFO batch allocation breakdown.

### 8.19 Charts/Widgets

Delta preview card only — shows affected batch list expandable.

### 8.20 Keyboard Shortcuts

`Ctrl+Enter` submit; `/` product search focus.

### 8.21 User Actions

| Type | Action |
|------|--------|
| Primary | Submit Adjustment |
| Secondary | Cancel |
| Secondary | Approve (history) |
| Destructive | Reject (history) |

### 8.22 Data Flow

| Operation | Endpoint |
|-----------|----------|
| Preview delta | POST `/inventory/adjust/preview` |
| Submit | POST `/inventory/adjust` |
| History | GET `/inventory/adjustments` |
| Approve | POST `/inventory/adjustments/:id/approve` |
| Reject | POST `/inventory/adjustments/:id/reject` |

**WebSocket**: `inventory.stock_changed` on applied adjustments.

### 8.23 State Management

| State | Notes |
|-------|-------|
| `form` | Dirty tracking; unload warning |
| `preview` | Server-computed delta + batches |
| `activeTab` | URL `?tab=history` |
| `pendingCount` | Badge on History tab |

### 8.24 Empty State

History: "No adjustments recorded" with link to New tab.

### 8.25 Loading State

Preview card skeleton when product/qty changes (debounce 400ms).

### 8.26 Error State

Insufficient stock for negative adjustment: delta preview red border + "Insufficient FIFO stock."

### 8.27 Success State

APPLIED: toast + switch to History tab highlighting new row.
PENDING: toast "Submitted for approval."

### 8.28 Real-Time Update Behavior

Pending count badge updates for managers on `inventory.adjustment_pending` event.

### 8.29 Accessibility

Delta announced: "Adjustment minus 5 units"; approval buttons labeled with adjustment ID.

---

## 9. Cross-Screen Patterns

### 9.1 Unsaved Changes

SCR-063 and SCR-064 forms warn on navigation when dirty.

### 9.2 Currency Display

All cost fields show UZS and USD with color coding per [CURRENCY_UZS_USD.md](../../08-modules/CURRENCY_UZS_USD.md).

### 9.3 FIFO Transparency

Any screen showing outbound quantity includes expandable FIFO allocation (oldest batches first).

### 9.4 Related Documents

| Document | Relevance |
|----------|-----------|
| [FIFO.md](../../08-modules/FIFO.md) | Batch allocation display |
| [NAVIGATION_ARCHITECTURE.md](../NAVIGATION_ARCHITECTURE.md) | Routes and sidebar |
| [COMPONENT_HIERARCHY.md](../COMPONENT_HIERARCHY.md) | CMP registry |
| [MOBILE_UI_SPEC.md](../MOBILE_UI_SPEC.md) | Mobile adaptations |

---

*End of Inventory Screens Specification*
