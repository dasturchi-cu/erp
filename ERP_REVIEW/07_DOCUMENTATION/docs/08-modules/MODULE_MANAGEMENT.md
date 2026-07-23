# Module Management

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Module Management system controls which functional modules are available to each company and ensures that module state changes propagate to all connected clients in real time. Modules are the building blocks of the ERP platform — each module encapsulates a business domain (Products, Sales, Inventory, etc.) with its own API routes, permissions, UI navigation, and background jobs.

Platform administrators enable or disable modules per company. Disabled modules are completely inaccessible — their API endpoints return 403, navigation items are hidden, and related background jobs are paused.

---

## 2. Module Registry

### 2.1 Available Modules

| ID | Code | Name | Phase | Dependencies |
|----|------|------|-------|--------------|
| M01 | `core` | Platform Core | 1 | — |
| M02 | `auth` | Authentication | 1 | core |
| M03 | `admin` | Admin Panel | 1 | auth |
| M04 | `company` | Company Management | 1 | auth |
| M05 | `products` | Products | 2 | company |
| M06 | `inventory` | Inventory | 2 | products |
| M07 | `fifo` | FIFO Engine | 2 | inventory |
| M08 | `currency` | Currency (UZS/USD) | 3 | company |
| M09 | `customers` | Customers | 3 | company |
| M10 | `sales` | Sales & POS | 3 | products, inventory, fifo, currency, customers |
| M11 | `debt` | Debt Management | 3 | customers, sales, currency |
| M12 | `dashboard` | Dashboard | 4 | sales, debt, inventory |
| M13 | `reports` | Reports | 4 | sales, debt, inventory |
| M14 | `notifications` | Notifications | 4 | core |
| M15 | `audit` | Audit Logs | 1 | core |

### 2.2 Module Categories

| Category | Modules | Always Enabled |
|----------|---------|---------------|
| **Platform** | core, auth, admin, company, audit | Yes (cannot disable) |
| **Catalog** | products | No |
| **Operations** | inventory, fifo | No |
| **Commercial** | currency, customers, sales, debt | No |
| **Analytics** | dashboard, reports, notifications | No |

Platform modules (core, auth, admin, company, audit) are always enabled and cannot be disabled for any company.

---

## 3. Module State

### 3.1 CompanyModule Entity

| Field | Type | Description |
|-------|------|-------------|
| `company_id` | UUID | Company |
| `module_id` | UUID | Module |
| `enabled` | Boolean | Active status |
| `enabled_at` | Timestamp | When module was enabled |
| `enabled_by` | UUID | Admin who enabled |
| `disabled_at` | Timestamp | When module was disabled (null if active) |
| `disabled_by` | UUID | Admin who disabled |

### 3.2 States

| State | API Behavior | UI Behavior |
|-------|-------------|-------------|
| **Enabled** | All endpoints active | Navigation visible, features accessible |
| **Disabled** | All endpoints return 403 | Navigation hidden, features inaccessible |

---

## 4. Enable/Disable Workflow

### 4.1 Enabling a Module

```
1. Admin navigates to Admin Panel → Modules
2. Selects company (or manages from company detail)
3. Toggles module to "Enabled"
4. System validates:
   a. All dependency modules are enabled
   b. Admin has admin.modules.manage permission
5. CompanyModule record created/updated
6. Audit log: MODULE_ENABLED
7. WebSocket broadcast: module.enabled
8. All connected clients for company:
   a. Receive event
   b. Refresh navigation
   c. Enable module features
```

### 4.2 Disabling a Module

```
1. Admin toggles module to "Disabled"
2. System validates:
   a. No dependent modules are enabled (must disable dependents first)
   b. Admin has admin.modules.manage permission
3. CompanyModule record updated
4. Audit log: MODULE_DISABLED
5. WebSocket broadcast: module.disabled
6. All connected clients for company:
   a. Receive event
   b. Remove navigation items
   c. Redirect if user is on disabled module page
   d. Show notification: "Module X has been disabled"
```

### 4.3 Dependency Enforcement

```
Cannot disable 'products' while 'inventory' is enabled
  → Error: "Disable dependent modules first: inventory, fifo, sales"

Cannot enable 'sales' while 'products' is disabled
  → Error: "Enable required dependencies first: products, inventory, fifo"
```

Dependency chain:
```
products → inventory → fifo
products → sales ← inventory, fifo, currency, customers
customers → sales
sales → debt
sales, debt, inventory → dashboard, reports
```

---

## 5. Client Propagation

### 5.1 Real-Time Propagation

When a module is enabled or disabled, all connected clients for that company receive the change immediately:

```json
{
  "event": "module.enabled",
  "data": {
    "moduleCode": "reports",
    "companyId": "company-uuid",
    "enabled": true,
    "timestamp": "2026-06-17T15:00:00Z"
  }
}
```

### 5.2 Client Behavior on Module Change

| Client State | Action |
|-------------|--------|
| On module page being disabled | Redirect to Dashboard with notification |
| Navigation | Re-render menu based on updated module list |
| Cached data | Invalidate module-specific cache |
| Background polling | Stop polling for disabled module endpoints |
| Open forms/modals | Complete in-progress action; block new actions |

### 5.3 Initial Load

On login and company switch, client fetches enabled modules:

```
GET /api/v1/companies/current/modules
→ ["core", "auth", "admin", "company", "audit", "products", "inventory", "fifo", "sales", ...]
```

Client uses this list to:
- Render navigation menu
- Guard routes (redirect if module disabled)
- Show/hide dashboard widgets
- Enable/disable feature flags

### 5.4 Offline Reconciliation

If client was offline during module change:
1. On reconnect, fetch current module list
2. Compare with cached module list
3. Apply differences (same as real-time propagation)

---

## 6. Per-Company Module Configuration

### 6.1 Example: Market (Full Deployment)

| Module | Status |
|--------|--------|
| core, auth, admin, company, audit | Enabled (always) |
| products | Enabled |
| inventory | Enabled |
| fifo | Enabled |
| currency | Enabled |
| customers | Enabled |
| sales | Enabled |
| debt | Enabled |
| dashboard | Enabled |
| reports | Enabled |
| notifications | Enabled |

### 6.2 Example: O'O'MQ (Phased Rollout)

| Module | Status |
|--------|--------|
| core, auth, admin, company, audit | Enabled (always) |
| products | Enabled |
| inventory | Enabled |
| fifo | Enabled |
| currency | Enabled |
| customers | Enabled |
| sales | Enabled |
| debt | Enabled |
| dashboard | Disabled (Phase 4) |
| reports | Disabled (Phase 4) |
| notifications | Enabled |

### 6.3 Example: New Company (Initial Setup)

| Module | Status |
|--------|--------|
| core, auth, admin, company, audit | Enabled (always) |
| All others | Disabled (enabled as needed) |

---

## 7. Module Management UI

```
┌─────────────────────────────────────────────────────────────────┐
│  MODULE MANAGEMENT — Market                                       │
├──────────────────────┬──────────┬────────────┬───────────────────┤
│ Module               │ Status   │ Enabled At │ Dependencies      │
├──────────────────────┼──────────┼────────────┼───────────────────┤
│ Platform Core        │ ● Active │ (always)   │ —                 │
│ Authentication       │ ● Active │ (always)   │ core              │
│ Admin Panel          │ ● Active │ (always)   │ auth              │
│ Company Management   │ ● Active │ (always)   │ auth              │
│ Audit Logs           │ ● Active │ (always)   │ core              │
│ Products             │ ● Active │ 2026-01-15 │ company           │
│ Inventory            │ ● Active │ 2026-01-15 │ products          │
│ FIFO Engine          │ ● Active │ 2026-01-15 │ inventory         │
│ Currency (UZS/USD)   │ ● Active │ 2026-02-01 │ company           │
│ Customers            │ ● Active │ 2026-02-01 │ company           │
│ Sales & POS          │ ● Active │ 2026-02-15 │ products, inv..  │
│ Debt Management      │ ● Active │ 2026-02-15 │ customers, sales  │
│ Dashboard            │ ● Active │ 2026-03-01 │ sales, debt, inv  │
│ Reports              │ ○ Off    │ —          │ sales, debt, inv  │
│ Notifications        │ ● Active │ 2026-01-15 │ core              │
└──────────────────────┴──────────┴────────────┴───────────────────┘
```

---

## 8. API Protection

### 8.1 Middleware

Every API request to a module endpoint passes through module guard middleware:

```
Request → Auth → Company Context → Module Guard → Permission Check → Handler

Module Guard:
  if module not enabled for company:
    return 403 { error: "MODULE_DISABLED", module: "reports" }
```

### 8.2 Route Registration

Each module registers its routes with module code:

```
@Module('sales')
@Controller('/api/v1/sales')
class SalesController { ... }
```

---

## 9. Permissions

| Permission | Description |
|------------|-------------|
| `admin.modules.view` | View module status per company |
| `admin.modules.manage` | Enable/disable modules |

---

## 10. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/companies/current/modules` | Enabled modules for active company |
| GET | `/api/v1/admin/modules` | All modules with status per company |
| POST | `/api/v1/admin/companies/:id/modules/:code/enable` | Enable module |
| POST | `/api/v1/admin/companies/:id/modules/:code/disable` | Disable module |

---

## 11. Business Rules

| ID | Rule |
|----|------|
| BR-MOD-01 | Platform modules cannot be disabled |
| BR-MOD-02 | Cannot enable module without its dependencies |
| BR-MOD-03 | Cannot disable module with enabled dependents |
| BR-MOD-04 | Module changes propagate to all clients via WebSocket |
| BR-MOD-05 | Disabled module endpoints return 403 |
| BR-MOD-06 | Module changes are audit-logged |

---

## 12. Related Documents

- [../03-product/MODULE_CATALOG.md](../03-product/MODULE_CATALOG.md)
- [ADMIN_PANEL.md](./ADMIN_PANEL.md)
- [MULTI_COMPANY.md](./MULTI_COMPANY.md)
- [../01-governance/MODULAR_ARCHITECTURE.md](../01-governance/MODULAR_ARCHITECTURE.md)
- [NOTIFICATIONS.md](./NOTIFICATIONS.md)
