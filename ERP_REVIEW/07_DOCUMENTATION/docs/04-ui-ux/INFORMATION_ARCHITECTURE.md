# Information Architecture

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Top-Level Navigation

```
ERP System
├── Dashboard                    [dashboard.view]
├── Sales                        [sales.*]
│   ├── New Sale (POS)
│   ├── Sales History
│   └── Returns
├── Products                     [products.*]
│   ├── Product List
│   ├── Categories
│   └── Price Management
├── Inventory                    [inventory.*]
│   ├── Stock Overview
│   ├── Receive Stock
│   ├── Batches
│   └── Adjustments
├── Customers                    [customers.*]
│   ├── Customer List
│   └── Debt Overview
├── Reports                      [reports.*]
│   ├── Sales Reports
│   ├── Inventory Reports
│   ├── Debt Reports
│   └── Export Center
├── Settings                     [settings.*]
│   ├── Company Profile
│   ├── Exchange Rates
│   └── Branch Management
└── Administration               [admin.*]  (Admin only)
    ├── Users
    ├── Roles & Permissions
    ├── Devices
    ├── Sessions
    ├── Companies
    ├── Modules
    ├── Audit Logs
    └── System Monitoring
```

---

## 2. Navigation by Role

| Menu Item | Admin | Manager | Cashier | Warehouse |
|-----------|-------|---------|---------|-----------|
| Dashboard | ✓ | ✓ | — | — |
| Sales (POS) | ✓ | ✓ | ✓ | — |
| Sales History | ✓ | ✓ | ✓ (own) | — |
| Products | ✓ | ✓ | View | ✓ |
| Inventory | ✓ | ✓ | View | ✓ |
| Customers | ✓ | ✓ | ✓ | — |
| Reports | ✓ | ✓ | — | — |
| Settings | ✓ | ✓ | — | — |
| Administration | ✓ | — | — | — |

---

## 3. Mobile Navigation (Bottom Tab Bar)

```
[Dashboard] [Sales] [Products] [Customers] [More]
```

"More" contains: Inventory, Reports, Settings, Profile, Logout

Admin mobile adds: Administration section in "More"

---

## 4. Page Hierarchy

### Dashboard
```
/dashboard
  ├── Summary cards (sales, profit, debt, inventory)
  ├── Sales chart (daily/weekly/monthly/yearly toggle)
  ├── Top products table
  └── Recent activity feed
```

### Sales (POS)
```
/sales/new
  ├── Customer selector (search by phone)
  ├── Product search (SKU, barcode, name)
  ├── Cart table (product, qty, price, total)
  ├── Currency selector (UZS / USD)
  ├── Payment section (cash, credit, partial)
  └── Complete sale button
```

### Product Detail
```
/products/:id
  ├── Header (name, SKU, barcode, status)
  ├── Pricing card (4 prices + totals)
  ├── Stock card (quantity, batches)
  ├── Sales history tab
  └── Edit form
```

### Customer Detail
```
/customers/:id
  ├── Header (name, phone, address)
  ├── Debt summary (UZS, USD)
  ├── Partnership info
  ├── Purchases tab
  ├── Payments tab
  └── Record payment action
```

### Admin Panel
```
/admin
  ├── /admin/users
  ├── /admin/roles
  ├── /admin/devices
  ├── /admin/sessions
  ├── /admin/companies
  ├── /admin/modules
  ├── /admin/audit-logs
  └── /admin/monitoring
```

---

## 5. Global Elements

| Element | Location | Description |
|---------|----------|-------------|
| Company Switcher | Top bar (left) | Dropdown for multi-company users |
| Notifications Bell | Top bar (right) | Unread count badge |
| User Menu | Top bar (right) | Profile, theme, logout |
| Connection Status | Top bar | Green dot = connected, red = offline |
| Breadcrumbs | Below top bar (desktop) | Navigation path |
| Search (global) | Top bar | Quick product/customer lookup |

---

## 6. URL Structure

```
/{module}/{action}/{id?}

Examples:
  /dashboard
  /sales/new
  /sales/history
  /products
  /products/abc-123
  /customers/abc-123
  /admin/users
  /admin/devices
```

---

## Related Documents

- [NAVIGATION_PATTERNS.md](./NAVIGATION_PATTERNS.md)
- [USER_FLOWS.md](./USER_FLOWS.md)
- [DESKTOP_UI_SPEC.md](./DESKTOP_UI_SPEC.md)
- [MOBILE_UI_SPEC.md](./MOBILE_UI_SPEC.md)
