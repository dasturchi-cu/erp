# UI Screen Catalog

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Figma Handoff Ready |
| Last Updated | 2026-06-17 |
| Parent Document | [UI_UX_MASTER_BLUEPRINT.md](./UI_UX_MASTER_BLUEPRINT.md) |

---

## 1. Purpose

This catalog is the **authoritative screen registry** for the ERP UI. Every screen listed here has a corresponding detailed specification in the volume documents below. Together they provide sufficient detail for:

- **Figma designers** to build every frame without clarification
- **React/Electron developers** to implement desktop screens
- **Flutter developers** to implement mobile/tablet screens
- **QA engineers** to write test cases per screen and state
- **Product managers** to validate scope and acceptance criteria

**Rule**: No screen ships without a catalog entry and a volume specification.

---

## 2. Screen Registry

**Canonical ID assignment**: [SCREEN_HIERARCHY.md](./SCREEN_HIERARCHY.md). The table below maps primary screens to specification documents.

| SCR ID | Screen Name | Route | Spec Document | Primary Roles |
|--------|-------------|-------|---------------|---------------|
| SCR-000 | Login | `/login` | [SCREENS_AUTH](./screens/SCREENS_AUTH_AND_ONBOARDING.md) | All |
| SCR-001 | Forgot Password | `/forgot-password` | SCREENS_AUTH | All |
| SCR-002 | Device Blocked | `/device-blocked` | SCREENS_AUTH | All |
| SCR-003 | Session Expired | `/session-expired` | SCREENS_AUTH | All |
| — | Company Selection | `/company-select` | SCREENS_AUTH | Multi-company users |
| SCR-010 | Dashboard | `/dashboard` | [DASHBOARD_UX](./DASHBOARD_UX.md), [SCREENS_ANALYTICS](./screens/SCREENS_ANALYTICS_AND_SYSTEM.md) | Admin, Manager |
| SCR-020 | POS — New Sale | `/sales/new` | [SCREENS_COMMERCE](./screens/SCREENS_COMMERCE_AND_SALES.md) | Cashier, Manager |
| SCR-021 | Sales History | `/sales/history` | SCREENS_COMMERCE | Cashier*, Manager |
| SCR-022 | Sale Detail | `/sales/history/:id` | SCREENS_COMMERCE | Cashier*, Manager |
| SCR-023 | Returns List | `/sales/returns` | SCREENS_COMMERCE | Manager |
| SCR-024 | Return Detail | `/sales/returns/:id` | SCREENS_COMMERCE | Manager |
| SCR-025 | Receipt View | `/sales/receipt/:id` | SCREENS_COMMERCE | All sales roles |
| SCR-040 | Product List | `/products` | SCREENS_COMMERCE | All* |
| SCR-041–043 | Create/Detail/Edit Product | `/products/*` | SCREENS_COMMERCE | Manager, Warehouse |
| SCR-044 | Categories | `/products/categories` | SCREENS_COMMERCE | Manager, Warehouse |
| SCR-045 | Price Management | `/products/prices` | SCREENS_COMMERCE | Manager |
| SCR-060 | Stock Overview | `/inventory` | [SCREENS_INVENTORY](./screens/SCREENS_INVENTORY.md) | Warehouse, Manager |
| SCR-061–064 | Warehouses, Movements, Receive, Adjust | `/inventory/*` | SCREENS_INVENTORY | Warehouse |
| SCR-080 | Customer List | `/customers` | [SCREENS_CUSTOMERS](./screens/SCREENS_CUSTOMERS_AND_FINANCE.md) | Cashier, Manager |
| SCR-082 | Customer Profile | `/customers/:id` | SCREENS_CUSTOMERS | Cashier, Manager |
| SCR-084 | Debt Overview | `/customers/debt` | SCREENS_CUSTOMERS | Manager |
| SCR-085 | Record Payment | `/customers/:id/payment` | SCREENS_CUSTOMERS | Cashier, Manager |
| SCR-100–104 | Reports Hub & reports | `/reports/*` | SCREENS_ANALYTICS | Manager |
| SCR-120–124 | Settings Hub & preferences | `/settings/*` | SCREENS_ANALYTICS | Manager, Admin |
| SCR-122 | Exchange Rates | `/settings/exchange-rates` | SCREENS_CUSTOMERS | Manager |
| SCR-170 | Notifications Center | `/notifications` | SCREENS_ANALYTICS | All |
| SCR-130 | Admin Control Center | `/admin` | [SCREENS_ADMIN](./screens/SCREENS_ADMIN.md), [ADMIN_PANEL_UX](./ADMIN_PANEL_UX.md) | Admin |
| SCR-131–151 | Users, Roles, Devices, Sessions, Companies, Modules, Audit, Monitoring | `/admin/*` | SCREENS_ADMIN | Admin |
| SCR-152 | Backup Center | `/admin/backup` | SCREENS_ADMIN | Admin |

\*Cashier sees own sales only where noted. View-only where RBAC restricts write.

---

## 3. Screen Specification Documents

| Document | Path | Screens |
|----------|------|---------|
| Auth & Onboarding | [screens/SCREENS_AUTH_AND_ONBOARDING.md](./screens/SCREENS_AUTH_AND_ONBOARDING.md) | Login, Company Selection, auth errors |
| Commerce & Sales | [screens/SCREENS_COMMERCE_AND_SALES.md](./screens/SCREENS_COMMERCE_AND_SALES.md) | POS, Sales, Products, Categories |
| Inventory | [screens/SCREENS_INVENTORY.md](./screens/SCREENS_INVENTORY.md) | Stock, Warehouses, Movements, Receive |
| Customers & Finance | [screens/SCREENS_CUSTOMERS_AND_FINANCE.md](./screens/SCREENS_CUSTOMERS_AND_FINANCE.md) | Customers, Debt, Payments, Currency |
| Analytics & System | [screens/SCREENS_ANALYTICS_AND_SYSTEM.md](./screens/SCREENS_ANALYTICS_AND_SYSTEM.md) | Dashboard, Reports, Analytics, Notifications, Settings |
| Administration | [screens/SCREENS_ADMIN.md](./screens/SCREENS_ADMIN.md) | Full admin suite |

---

## 4. Universal Screen Anatomy

Every authenticated screen (except Login, Company Selection) uses **SCR-000 App Shell**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOPBAR 56px — CompanySwitcher | GlobalSearch | Notif | Conn | UserMenu  │
├──────────┬──────────────────────────────────────────────────────────────┤
│ SIDEBAR  │ BREADCRUMB BAR 40px                                          │
│ 240px    ├──────────────────────────────────────────────────────────────┤
│ (64px    │ PAGE HEADER 64px — Title | Primary Actions | Secondary       │
│ collapsed)├──────────────────────────────────────────────────────────────┤
│          │ FILTER BAR 48px (optional, list screens)                     │
│          ├──────────────────────────────────────────────────────────────┤
│          │ CONTENT AREA — padding 24px, min-height calc(100vh - 208px)   │
│          │                                                              │
└──────────┴──────────────────────────────────────────────────────────────┘
```

### Tablet (768–1023px)
- Sidebar collapsed to 64px icon rail by default
- Content padding 16px
- Filter bar may wrap to two rows

### Mobile (<768px)
- No sidebar; bottom tab bar 56px + safe area
- Top app bar 56px with back + title + actions
- Content padding 16px
- Full-width cards replace tables

---

## 5. Universal State Matrix

Every screen MUST implement these states in Figma and code:

| State | Visual Treatment | Trigger |
|-------|------------------|---------|
| **Initial Load** | Full-page skeleton matching layout | First mount, hard refresh |
| **Refreshing** | Subtle top progress bar or pull-to-refresh | User refresh, reconnect sync |
| **Populated** | Normal content | Data returned |
| **Empty** | Illustration + headline + CTA | Zero records |
| **Error** | Inline banner or full-page with retry | API 4xx/5xx, network |
| **Permission Denied** | 403 card with contact admin CTA | Missing permission |
| **Module Disabled** | Redirect + toast (not inline 403 page) | Module off |
| **Offline** | Persistent banner, read-only where possible | WebSocket + API down |
| **Real-time Update** | Row highlight 2s fade (sales, stock) | WebSocket event |

---

## 6. Universal Component Patterns

### List Screens
- Page header with primary CTA (e.g., "+ Mahsulot qo'shish")
- Filter bar: search input (320px desktop), 2–4 filter dropdowns, "Clear filters" text button
- Data table (desktop) / card list (mobile)
- Pagination footer: "1–20 of 1,247" + page size selector + prev/next
- Bulk action bar (slides up when rows selected)

### Detail Screens
- Header: entity name + status badge + action menu (Edit, Delete, More)
- Tab bar below header (max 5 tabs)
- Primary content left (8 col) + sidebar summary card right (4 col) on desktop
- Mobile: stacked, summary card first

### Form Screens (Create/Edit)
- Modal (desktop <600px content) or Sheet (mobile full-screen)
- Label above field, 8px gap, 16px between fields
- Footer: Cancel (secondary) + Save (primary), right-aligned
- Unsaved changes guard on navigate away

### Destructive Actions (Admin)
- Block, delete, disable module: Confirmation dialog
- High impact (restore backup, delete company): Type-to-confirm + reason field

---

## 7. Permission Gate Reference

Screens hidden from navigation if permission missing. Direct URL → 403 Permission Denied card.

| Screen | Minimum Permission |
|--------|-------------------|
| Dashboard | `dashboard.view` |
| Sales POS | `sales.create` |
| Sales History | `sales.view` |
| Products | `products.view` |
| Inventory | `inventory.view` |
| Customers | `customers.view` |
| Reports | `reports.view` |
| Admin * | `admin.*` (section-specific) |

Full matrix: [NAVIGATION_ARCHITECTURE.md](./NAVIGATION_ARCHITECTURE.md)

---

## 8. Real-Time UI Events by Screen

| Screen | Subscribed Events | UI Behavior |
|--------|-------------------|-------------|
| Dashboard | `sale.completed`, `payment.received`, `currency.rate_updated` | KPI cards animate update |
| Products | `product.*`, `inventory.stock_changed` | Row update or badge |
| Sales POS | `inventory.stock_changed` | Stock badge on product |
| Sales History | `sale.completed`, `sale.voided` | New row prepend |
| Customers | `payment.received`, `customer.updated` | Debt chip update |
| Admin Sessions | `session.*` | Row remove on revoke |
| Admin Devices | `device.blocked` | Status badge flip |

Full catalog: [WEBSOCKET_EVENTS.md](../06-api/WEBSOCKET_EVENTS.md)

---

## 9. Figma File Organization

```
ERP-UI-v2.0/
├── 00 — Cover & Changelog
├── 01 — Design Tokens (link variables)
├── 02 — Components (CMP library)
├── 03 — Templates (App Shell, List, Detail, POS)
├── 04 — Auth (SCR-001, SCR-010)
├── 05 — Dashboard (SCR-020)
├── 06 — Sales (SCR-030–032)
├── 07 — Products & Inventory (SCR-040–052)
├── 08 — Customers & Finance (SCR-060–070)
├── 09 — Reports & Analytics (SCR-080–081)
├── 10 — Settings & Notifications (SCR-090–091)
├── 11 — Admin (SCR-100–111)
├── 12 — States (empty, error, loading library)
└── 13 — Responsive (desktop, tablet, mobile variants)
```

---

## 10. QA Test Case Index

Each SCR-ID generates minimum test cases:
1. Load populated state
2. Load empty state
3. Permission denied (wrong role)
4. Module disabled redirect
5. Create flow (if applicable)
6. Edit flow (if applicable)
7. Delete/block with confirmation (if applicable)
8. Real-time update from second device
9. Offline banner behavior
10. Responsive breakpoint snapshots (3 viewports)

---

## 11. Related Documents

| Document | Purpose |
|----------|---------|
| [UI_UX_MASTER_BLUEPRINT.md](./UI_UX_MASTER_BLUEPRINT.md) | Master UX architecture |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Tokens and visual language |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | Reusable components |
| [NAVIGATION_ARCHITECTURE.md](./NAVIGATION_ARCHITECTURE.md) | Routes and nav rules |
| [SCREEN_HIERARCHY.md](./SCREEN_HIERARCHY.md) | Screen tree |
| [COMPONENT_HIERARCHY.md](./COMPONENT_HIERARCHY.md) | Component tree |
| [WIREFRAME_IMPLEMENTATION_GUIDE.md](./WIREFRAME_IMPLEMENTATION_GUIDE.md) | Pixel implementation |
| [UI_STATE_MANAGEMENT.md](./UI_STATE_MANAGEMENT.md) | Client state architecture |
| [USER_JOURNEYS.md](./USER_JOURNEYS.md) | Persona journeys |
| [USER_FLOWS.md](./USER_FLOWS.md) | Interaction flows |
| [DASHBOARD_UX.md](./DASHBOARD_UX.md) | Dashboard deep spec |
| [ADMIN_PANEL_UX.md](./ADMIN_PANEL_UX.md) | Admin deep spec |
| [UI_UX_DOCUMENTATION_STATUS.md](./UI_UX_DOCUMENTATION_STATUS.md) | UI/UX completion metrics |

---

*For per-screen wireframes, component trees, and state requirements, open the specification document listed in §3 for that screen's SCR-ID.*
