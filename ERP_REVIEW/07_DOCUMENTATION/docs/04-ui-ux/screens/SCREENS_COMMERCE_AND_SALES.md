# Screen Specifications — Commerce & Sales

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Figma Handoff |
| Last Updated | 2026-06-17 |
| Figma Page | `05 — Commerce & Sales` |
| Parent | [UI_SCREEN_CATALOG.md](../UI_SCREEN_CATALOG.md) |
| Canonical IDs | [SCREEN_HIERARCHY.md](../SCREEN_HIERARCHY.md) §6–7 |

---

## Document Scope

| SCR-ID | Screen | Route |
|--------|--------|-------|
| SCR-020 | POS — New Sale | `/sales/new` |
| SCR-021 | Sales History | `/sales/history` |
| SCR-022 | Sale Detail | `/sales/history/:id` |
| SCR-023 | Returns List | `/sales/returns` |
| SCR-024 | Return Detail | `/sales/returns/:id` |
| SCR-025 | Receipt View | `/sales/receipt/:id` |
| SCR-040 | Product List | `/products` |
| SCR-041 | Create Product | `/products/new` |
| SCR-042 | Product Detail | `/products/:id` |
| SCR-043 | Edit Product | `/products/:id/edit` |
| SCR-044 | Categories | `/products/categories` |
| SCR-045 | Price Management | `/products/prices` |

---

# SCR-020 — POS (New Sale)

## Purpose
Primary cashier interface for high-volume retail/wholesale. Scan/search products, build cart, assign customer, select UZS/USD, process payment (cash/credit/partial), trigger FIFO allocation server-side.

## Roles & Permissions
| Role | Access | Notes |
|------|--------|-------|
| Cashier | Full | Default landing |
| Manager | Full | |
| Admin | Full | |
| Warehouse | Denied | Redirect SCR-190 |

**Permissions**: `sales.create` (required), `customers.view` (customer attach), `debt.payment` (if taking payment same flow)

## Desktop Wireframe (1280×800)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TopBar 56px                                                                │
├────────┬───────────────────────────────────┬───────────────────────────────┤
│Sidebar │ POS — Yangi sotuv    [Yangi savat]│ CART PANEL 40% w=420px       │
│        ├───────────────────────────────────┤ ┌───────────────────────────┐ │
│        │ BARCODE INPUT h=56 full-width     │ │ Mijoz: [Qidirish...]    │ │
│        │ autofocus, placeholder "Shtrix..."  │ ├───────────────────────────┤ │
│        ├───────────────────────────────────┤ │ Valyuta: [UZS] [USD]      │ │
│        │ SEARCH h=48 + category chips        │ ├───────────────────────────┤ │
│        ├───────────────────────────────────┤ │ CartTable scroll          │ │
│        │ PRODUCT GRID 4 cols gap=12        │ │ Product | Qty | Summa     │ │
│        │ Card 160×120: img, name, price,   │ │ ...                       │ │
│        │ stock badge                       │ ├───────────────────────────┤ │
│        │                                   │ │ Jami UZS: 1 250 000       │ │
│        │                                   │ │ Jami USD: —               │ │
│        │                                   │ ├───────────────────────────┤ │
│        │                                   │ │ [To'lov]  [Sotuvni yakunlash]│
│        │                                   │ │ primary h=56 full-width   │ │
│        └───────────────────────────────────┴─┴───────────────────────────┘ │
```

## Tablet (768px)
- Split 50/50; product grid 3 columns
- Cart panel min-width 320px

## Mobile (390px)
- Full-width product search + 2-col grid
- FAB "Savat (3)" opens bottom sheet 70vh
- Complete sale in sheet footer

## Components
`BarcodeInput`, `ProductPicker`, `ProductCard`, `CartTable`, `CustomerPicker`, `CurrencyToggle`, `PaymentDialog`, `StockBadge`, `CompleteSaleButton`

## Keyboard Shortcuts (Desktop)
| Key | Action |
|-----|--------|
| F2 | Focus barcode |
| F3 | Focus product search |
| F4 | Customer search |
| F8 | Payment dialog |
| F9 | Complete sale |
| Ctrl+N | New cart |
| Delete | Remove selected line |
| +/- | Qty selected line |

## Modals
- **PaymentDialog** (md 560px): amount received, change, credit toggle, partial amount
- **InsufficientStockDialog**: show available qty, offer reduce qty
- **DiscountApproval** (manager): if discount > 10%

## States
| State | Treatment |
|-------|-----------|
| Empty cart | Grid visible; cart shows dashed "Mahsulot qo'shing" |
| Processing | Full cart overlay spinner; disable complete |
| Success | Receipt preview 1.5s → auto new cart |
| Offline | Banner; block complete |

## Data Flow
- `GET /products/search?q=` — debounced
- `POST /sales` — body: items, customerId, currency, payment, idempotencyKey
- WS: `inventory.stock_changed`, `sale.completed`

## Component Tree
```
POSPage [SCR-020]
├── AppShell
├── POSWorkspace
│   ├── ProductPane
│   │   ├── BarcodeInput
│   │   ├── ProductSearch
│   │   └── ProductGrid → ProductCard[]
│   └── CartPane
│       ├── CustomerPicker
│       ├── CurrencyToggle
│       ├── CartTable
│       ├── CartTotals
│       └── CartActions
├── PaymentDialog
└── SaleSuccessOverlay
```

## State Management
See [UI_STATE_MANAGEMENT.md](../UI_STATE_MANAGEMENT.md) §5 SCR-020 — `posCartStore` for cart, currency, customer; server for stock validation.

---

# SCR-021 — Sales History

## Purpose
Searchable ledger of all sales with filters, export, drill-down to detail/return/receipt.

## Permissions
`sales.view`; cashier scoped to own unless `sales.view_all`

## Desktop Wireframe
- Page header: "Sotuvlar tarixi" + Export dropdown
- Filter bar: DateRange (default today), Status, Cashier, Customer, Payment type, Currency
- Table columns: №, Sana, Kassir, Mijoz, Jami UZS, Jami USD, To'lov turi, Holat, Actions
- Row actions: View, Print, Cancel (if allowed), Return

## Mobile
- Card list: receipt #, time, total, status chip
- Filters in bottom sheet

## States
Empty: "Bugun sotuv yo'q" + CTA "Yangi sotuv" → SCR-020

## Data Flow
`GET /sales?filters` paginated; WS prepends new rows

---

# SCR-022 — Sale Detail

## Purpose
Immutable sale record: line items, FIFO allocations, payment breakdown, audit.

## Layout
- Header: Sale #12345, date, cashier, status badge
- Tabs: **Tafsilotlar** | **Mahsulotlar** | **FIFO** | **To'lov** | **Audit** (admin)
- Sidebar card: customer, totals UZS/USD, exchange rate used (frozen)
- Actions: Print receipt, Cancel sale, Initiate return

## Mobile
Tabs → scrollable chip row; sidebar content above tabs

---

# SCR-023 / SCR-024 — Returns

## Purpose
List and detail of return transactions linked to original sales; inventory restoration visible.

## Permissions
`sales.return`

## Desktop
- Master list table → detail split or navigate SCR-024
- Return form: select original sale, pick lines, qty, reason

---

# SCR-040 — Product List

## Purpose
Catalog management and lookup hub.

## Permissions
`products.view`; create button requires `products.create`

## Desktop Wireframe
```
PageHeader: Mahsulotlar [+ Qo'shish]
FilterBar: Search 320px | Category ▼ | Status ▼ | Stock ▼ | [Tozalash]
DataTable dense:
  SKU | Nomi | Shtrix | Kategoriya | Qoldiq | Olish UZS | Sotish UZS | Olish USD | Sotish USD | Holat | ⋮
Pagination footer
```

## Mobile
Search sticky top; infinite scroll cards with SKU, name, stock, price

## Real-time
`product.updated` → row flash; `inventory.stock_changed` → qoldiq column

---

# SCR-042 — Product Detail

## Purpose
360° product view: pricing, stock, batches, sales history.

## Layout (desktop 12-col)
- Col 8: Tabs content
- Col 4: Summary card (stock, value UZS/USD, category, status)
- Header: name H1 + SKU mono + barcode + Edit/Delete

## Tabs
1. **Umumiy** — description, dates
2. **Narxlar** — 4 price fields read-only (edit → SCR-043)
3. **Ombor** — batch table mini, link SCR-060 filtered
4. **Sotuvlar** — recent sales table

---

# SCR-044 — Categories

## Purpose
Hierarchical category tree for product organization.

## Layout
- Left 40%: tree with expand/collapse, drag reorder
- Right 60%: selected category detail + product count + assign products

## Actions
Add root, add child, rename, delete (if empty), merge (Phase 2)

---

# SCR-045 — Price Management

## Purpose
Bulk inline edit of purchase/sale prices UZS/USD.

## Layout
Spreadsheet-style grid; filter by category; unsaved row highlight; Save all / Discard

## Validation
All prices ≥ 0; confirm if sale < purchase (warning, not block)

---

## Figma Deliverables Checklist (Commerce)

| Screen | Frames required |
|--------|-----------------|
| SCR-020 | Desktop/Tablet/Mobile × Default, Empty cart, Payment modal, Success, Offline |
| SCR-021 | Desktop/Mobile × Populated, Empty, Filtered empty |
| SCR-022 | Desktop/Mobile × All tabs |
| SCR-040–045 | List, Detail, Create/Edit modals, Empty, Loading |

---

## Related Documents
- [SALES.md](../../08-modules/SALES.md)
- [PRODUCTS.md](../../08-modules/PRODUCTS.md)
- [DESKTOP_UX.md](../DESKTOP_UX.md)
- [DASHBOARD_UX.md](../DASHBOARD_UX.md)
