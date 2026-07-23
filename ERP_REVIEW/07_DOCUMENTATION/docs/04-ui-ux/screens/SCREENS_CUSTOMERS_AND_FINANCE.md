# Screen Specifications — Customers & Finance

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Figma Handoff |
| Last Updated | 2026-06-17 |
| Figma Page | `07 — Customers & Finance` |
| Parent | [UI_SCREEN_CATALOG.md](../UI_SCREEN_CATALOG.md) |
| Canonical IDs | [SCREEN_HIERARCHY.md](../SCREEN_HIERARCHY.md) §9, §11 |

---

## Document Scope

| SCR-ID | Screen | Route |
|--------|--------|-------|
| SCR-080 | Customer List | `/customers` |
| SCR-081 | Create Customer | `/customers/new` |
| SCR-082 | Customer Detail / Profile | `/customers/:id` |
| SCR-083 | Edit Customer | `/customers/:id/edit` |
| SCR-084 | Debt Overview | `/customers/debt` |
| SCR-085 | Record Payment | `/customers/:id/payment` |
| SCR-122 | Exchange Rates | `/settings/exchange-rates` |

---

# SCR-080 — Customer List

## Purpose
Directory of all customers with phone-first search, debt visibility at a glance, fast navigation to profile and payment.

## Roles & Permissions
| Role | Access |
|------|--------|
| Cashier | View, create, open profile |
| Manager | Full |
| Admin | Full |

**Permission**: `customers.view`; create CTA needs `customers.create`

## Information Architecture
```
Customers (SCR-080)
├── Search (phone primary)
├── Filters: debt status, branch, sort
├── Table / Card list
└── Row → Customer Profile (SCR-082)
```

## Desktop Wireframe (1280×800)

```
PageHeader: Mijozlar                    [+ Mijoz qo'shish]
FilterBar h=48:
  [Telefon yoki ism bo'yicha qidirish — 360px] [Qarz holati ▼] [Filial ▼] [Saralash ▼]

DataTable:
| Ism | Telefon | Manzil | Qarz UZS | Qarz USD | Oxirgi xarid | Holat | ⋮ |
|-----|---------|--------|----------|----------|--------------|-------|---|
| Ali Valiyev | +998 90 123 45 67 | Toshkent | 5 200 000 | $120 | 2 kun oldin | Faol | ... |

Row ⋮ menu: Profil, To'lov qabul qilish, POS da ochish
Pagination: 1–20 of 3,402
```

## Tablet
- Hide Manzil column; filters wrap 2 rows
- Sidebar collapsed

## Mobile
```
AppBar: Mijozlar [+]
SearchBar sticky (phone pad optimized, tel inputMode)
List: ErpCustomerTile
  - Name titleLarge
  - Phone bodyMedium muted
  - Debt chips: UZS blue, USD green side by side
  - Chevron right
FAB none — create in app bar
```

## Search Behavior
- Phone: strip spaces/dashes; match prefix and contains
- Debounce 300ms; min 3 chars for name; min 5 digits for phone
- Highlight matching digits in phone column

## Filters
| Filter | Options |
|--------|---------|
| Qarz holati | Hammasi, Qarzi bor, Qarzsiz, Kechikkan |
| Filial | Branch list |
| Saralash | Ism A-Z, Qarz ↓ UZS, Oxirgi xarid ↓ |

## Empty State
Illustration + "Hali mijozlar yo'q" + CTA "+ Birinchi mijozni qo'shing"

## Error State
Banner: "Mijozlar yuklanmadi" + Qayta urinish

## User Actions
1. Type phone in search → results filter
2. Click row → SCR-082
3. ⋮ → To'lov → SCR-085
4. + → SCR-081 modal/sheet

## Data Flow
- `GET /customers?search&filters&page`
- WS `customer.updated`, `payment.received` → invalidate list

## Component Tree
```
CustomerListPage [SCR-080]
├── AppShell
├── PageHeader → Button Create
├── FilterBar → SearchInput, Select×3
├── DataTable → RowActionsMenu
└── Pagination
```

## State Management
URL: `?search=&debt=&branch=&page=`; selected rows local for bulk export (Phase 2)

---

# SCR-082 — Customer Profile

## Purpose
Single customer hub: identity, debt summary, purchase/payment history, quick payment.

## Permissions
`customers.view`; payment FAB needs `debt.payment`; edit needs `customers.update`

## Desktop Wireframe

```
Breadcrumb: Mijozlar > Ali Valiyev
Header row:
  [Avatar 48] Ali Valiyev  +998 90 123 45 67  [Faol]
  Actions: [To'lov qabul qilish] [Tahrirlash] [⋮]

Debt Summary Strip (full width, 88px, 2 cards):
  ┌─────────────────────┐ ┌─────────────────────┐
  │ Qarz UZS            │ │ Qarz USD            │
  │ 5 200 000 so'm      │ │ $120.00             │
  │ Kechikkan: 12 kun   │ │                     │
  └─────────────────────┘ └─────────────────────┘

Info row: Manzil | Hamkorlik boshlangan: 12.01.2024 | Oxirgi to'lov: 15.06.2026

Tabs: [Xaridlar] [To'lovlar] [Qarz tarixi]

Tab content: DataTable with date filters
```

## Mobile
- Summary cards stacked first
- Primary CTA sticky bottom: "To'lov qabul qilish" h=56
- Tabs → horizontal chips

## Modals
- Record Payment → SCR-085 (sheet mobile, dialog desktop)

## Real-time
`payment.received` → debt cards animate count-up; prepend payment row

## Component Tree
```
CustomerDetailPage [SCR-082]
├── CustomerHeader
├── DebtSummaryCards (UZS, USD)
├── CustomerMetaRow
├── TabBar
└── TabPanel → DataTable | Timeline
```

---

# SCR-084 — Debt Overview

## Purpose
Cross-customer accounts receivable for manager collection workflow.

## Permissions
`debt.view`

## Desktop
- KPI strip: Total debt UZS, Total debt USD, Overdue count, Collected today
- Table sorted by overdue days default
- Columns: Mijoz, Telefon, Qarz UZS, Qarz USD, Kechikkan kun, Oxirgi to'lov, Amallar
- Export Excel button

## Filters
Overdue only toggle, min amount, branch, currency filter

## Mobile
Card list sorted by urgency; red accent if overdue > 30 days

---

# SCR-085 — Record Payment

## Purpose
Accept partial or full payment against UZS or USD debt.

## Form Fields
| Field | Type | Validation |
|-------|------|------------|
| Valyuta | Segmented UZS/USD | Required |
| Summa | Currency input | > 0, ≤ outstanding for currency |
| To'lov usuli | Select | Naqd, Karta, O'tkazma |
| Izoh | Textarea optional | max 500 |

## Footer
- Show: Qolgan qarz after payment (preview live)
- Buttons: Bekor qilish | To'lovni saqlash

## Success
Toast + navigate back to SCR-082 with updated balances

## Data Flow
`POST /debt-payments` with `exchange_rate_used` snapshot

---

# SCR-122 — Exchange Rates

## Purpose
View/set company UZS per 1 USD rate; view history; educate that historical sales are immutable.

## Permissions
`currency.view` read; `currency.manage` for set rate

## Desktop Layout

```
PageHeader: Valyuta kursi
Current Rate Card (large):
  1 USD = 12 650 so'm
  Amal qilish: 17.06.2026 09:00
  [Yangi kurs belgilash] (permission gated)

Warning callout (info):
  "Tarixiy sotuvlar o'zgarmaydi. Yangi kurs faqat yangi operatsiyalar uchun."

History Table:
| Kurs | Amal qilish sanasi | Kim o'rnatdi | Yaratilgan |
```

## Set Rate Modal
- Input: Yangi kurs (numeric)
- Effective: immediate (readonly timestamp)
- Confirm checkbox: "Eski kurs arxivlanadi"
- Save → WS `currency.rate_updated`

## Mobile
Current rate hero card; history list below; FAB set rate (manager)

---

## Related Documents
- [CUSTOMERS.md](../../08-modules/CUSTOMERS.md)
- [DEBT_MANAGEMENT.md](../../08-modules/DEBT_MANAGEMENT.md)
- [CURRENCY_UZS_USD.md](../../08-modules/CURRENCY_UZS_USD.md)
