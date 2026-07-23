# Branch Management Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Branch Management module organizes companies into physical locations (branches). Each company has one or more branches representing stores, warehouses, or offices. Branches provide an additional layer of data scoping within a company — sales, inventory, and user assignments can be filtered by branch. The branch context is carried in the JWT alongside company context.

A company must have at least one branch. The first branch created during company setup is automatically designated as the default branch.

---

## 2. Branch Model

### 2.1 Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | Parent company |
| `name` | String | Branch display name |
| `code` | String | Short code (e.g., `TSH-MAIN`, `SMK-01`) |
| `address` | Text | Physical address |
| `phone` | String | Branch contact phone |
| `is_default` | Boolean | Default branch for company |
| `status` | Enum | `ACTIVE`, `INACTIVE` |
| `created_at` | Timestamp | Creation date |
| `updated_at` | Timestamp | Last modification |

### 2.2 Hierarchy

```
Company: Market
├── Branch: Tashkent Main (TSH-MAIN) [default]
│   ├── Warehouse: Showroom Floor
│   └── Warehouse: Back Storage
└── Branch: Samarkand (SMK-01)
    └── Warehouse: Main Storage

Company: Somafix
└── Branch: Main Office (SF-MAIN) [default]
    └── Warehouse: Main

Company: Xitoy Tovar
└── Branch: Tashkent (XT-MAIN) [default]
    ├── Warehouse: Import Storage
    └── Warehouse: Retail Floor
```

---

## 3. Branch Context

### 3.1 JWT Integration

```json
{
  "sub": "user-uuid",
  "company_id": "company-uuid",
  "branch_id": "branch-uuid",
  "permissions": ["sales.create", "products.view"]
}
```

Every API request carries `branch_id` from JWT. Data queries can be further scoped by branch where applicable.

### 3.2 Branch Scoping Rules

| Data Type | Branch Scoped | Notes |
|-----------|--------------|-------|
| Products | No | Company-wide catalog |
| Customers | No | Company-wide registry |
| Sales | Yes | Sale recorded at branch where it occurred |
| Inventory (batches) | Yes | Via warehouse → branch mapping |
| Debt | No | Company-wide customer debt |
| Payments | Yes | Recorded at receiving branch |
| Users | Yes | Assigned to specific branch |
| Reports | Filterable | Can filter by branch or show all |
| Dashboard | Filterable | Branch selector on dashboard |

### 3.3 Branch Selector

Users assigned to a single branch see their branch as fixed context. Users with multi-branch access (typically managers and admins) can switch branches:

```
┌──────────────────────────────────────────────┐
│  [Market ▼]  [Tashkent Main ▼]  Dashboard ...│
└──────────────────────────────────────────────┘
```

Branch switch updates JWT `branch_id` without full re-authentication.

---

## 4. Branch Examples by Company

### 4.1 Market (Multi-Branch)

| Branch | Code | Address | Staff | Purpose |
|--------|------|---------|-------|---------|
| Tashkent Main | `TSH-MAIN` | Chilonzor, Tashkent | 5 | Primary store and warehouse |
| Samarkand | `SMK-01` | Registon ko'chasi, Samarkand | 3 | Regional branch |

**Operations:**
- Products catalog shared across both branches
- Each branch has independent inventory (via warehouses)
- Sales recorded at branch where transaction occurs
- Manager at Tashkent can view Samarkand sales via branch filter
- Debt is company-wide (customer debt not split by branch)

### 4.2 Somafix (Single Branch)

| Branch | Code | Address | Staff | Purpose |
|--------|------|---------|-------|---------|
| Main Office | `SF-MAIN` | Sergeli, Tashkent | 4 | Office and warehouse |

**Operations:**
- Single branch simplifies operations
- All sales, inventory, and staff at one location
- Branch selector not shown (implicit default)

### 4.3 Xitoy Tovar (Single Branch, Multi-Warehouse)

| Branch | Code | Warehouses | Purpose |
|--------|------|-----------|---------|
| Tashkent | `XT-MAIN` | Import Storage, Retail Floor | Import warehouse + retail |

**Operations:**
- One branch with two warehouses for import vs retail stock
- USD-heavy pricing; most B2B sales in USD
- Large import batches received at Import Storage

### 4.4 Lantian (Single Branch)

| Branch | Code | Staff | Purpose |
|--------|------|-------|---------|
| Main | `LT-MAIN` | 3 | Trading office |

### 4.5 O'O'MQ (Single Branch)

| Branch | Code | Staff | Purpose |
|--------|------|-------|---------|
| Main | `OOMQ-MAIN` | 5 | Industry-specific operations |

---

## 5. User-Branch Assignment

### 5.1 Assignment Model

Users are assigned to a branch within each company:

```
UserCompany:
  user_id: "alisher-uuid"
  company_id: "market-uuid"
  role_id: "manager-uuid"
  branch_id: "tashkent-main-uuid"    ← branch assignment
```

### 5.2 Assignment Rules

| Rule | Description |
|------|-------------|
| BR-BR-01 | User must be assigned to exactly one branch per company |
| BR-BR-02 | Cashier operates at assigned branch only |
| BR-BR-03 | Manager may be assigned to default branch with access to all branches |
| BR-BR-04 | Admin has access to all branches |
| BR-BR-05 | Changing user's branch takes effect on next login or branch switch |

### 5.3 Multi-Branch Access

| Role | Branch Access |
|------|--------------|
| Cashier | Assigned branch only |
| Warehouse | Assigned branch only |
| Manager | All branches (with selector) |
| Company Admin | All branches |
| Super Admin | All branches across all companies |

---

## 6. Branch Management

### 6.1 CRUD Operations

| Action | Description | Permission |
|--------|-------------|------------|
| Create branch | New branch with name, code, address | `admin.branches.create` |
| Edit branch | Update name, address, phone | `admin.branches.update` |
| Deactivate branch | Set status to INACTIVE | `admin.branches.update` |
| Set default | Designate as company default branch | `admin.branches.update` |

### 6.2 Branch Rules

| ID | Rule |
|----|------|
| BR-BRN-01 | Company must have at least one active branch |
| BR-BRN-02 | Exactly one default branch per company |
| BR-BRN-03 | Cannot deactivate branch with active users |
| BR-BRN-04 | Cannot deactivate branch with stock on hand |
| BR-BRN-05 | Branch code unique within company |
| BR-BRN-06 | Cannot delete branch (only deactivate) |

### 6.3 Default Branch Behavior

- New users assigned to default branch if not specified
- POS defaults to user's assigned branch
- Reports default to "All Branches" for managers
- Inventory receiving defaults to default warehouse of user's branch

---

## 7. Branch in Sales

### 7.1 Sale Branch Assignment

Every sale records the branch where it occurred:

```
Sale:
  company_id: "market-uuid"
  branch_id: "tashkent-main-uuid"    ← auto-set from JWT
  cashier_id: "dilshod-uuid"
  ...
```

### 7.2 Cross-Branch Reporting

Managers view sales across branches:

```
Sales Report — Market — June 2026

Branch            Sales    Total UZS      Total USD
Tashkent Main     342      125,400,000    $9,850
Samarkand         128       42,800,000    $3,360
─────────────────────────────────────────────────
Total             470      168,200,000   $13,210
```

---

## 8. Branch in Inventory

### 8.1 Warehouse-Branch Relationship

Warehouses belong to branches. Inventory is tracked at warehouse level, aggregated at branch level:

```
Branch: Tashkent Main
  Warehouse: Showroom Floor
    Cement 50kg: 150 units
    Brick Standard: 5,000 units
  Warehouse: Back Storage
    Cement 50kg: 800 units
    Insulation Roll: 200 units

Branch Total:
  Cement 50kg: 950 units
  Brick Standard: 5,000 units
  Insulation Roll: 200 units
```

### 8.2 Receiving at Branch

Goods received at a specific warehouse within a branch. The receiving user's branch context determines available warehouses.

---

## 9. Branch Management UI

```
┌─────────────────────────────────────────────────────────────────┐
│  BRANCHES — Market                              [+ Add Branch]  │
├──────────────┬──────────┬──────────────────────┬────────┬───────┤
│ Name         │ Code     │ Address              │ Staff  │ Status│
├──────────────┼──────────┼──────────────────────┼────────┼───────┤
│ Tashkent Main│ TSH-MAIN │ Chilonzor, Tashkent  │ 5      │ Active│
│              │          │                      │        │ ★ Default│
│ Samarkand    │ SMK-01   │ Registon, Samarkand  │ 3      │ Active│
└──────────────┴──────────┴──────────────────────┴────────┴───────┘
```

---

## 10. Permissions

| Permission | Description |
|------------|-------------|
| `branches.view` | View branch list |
| `admin.branches.create` | Create new branches |
| `admin.branches.update` | Edit and deactivate branches |
| `branches.switch` | Switch between branches (managers) |

---

## 11. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/branches` | List branches for active company |
| GET | `/api/v1/branches/:id` | Branch detail with warehouses and staff count |
| POST | `/api/v1/branches` | Create branch |
| PATCH | `/api/v1/branches/:id` | Update branch |
| POST | `/api/v1/branches/switch` | Switch branch context |
| GET | `/api/v1/branches/current` | Active branch details |

---

## 12. Related Documents

- [MULTI_COMPANY.md](./MULTI_COMPANY.md)
- [INVENTORY.md](./INVENTORY.md)
- [SALES.md](./SALES.md)
- [ADMIN_PANEL.md](./ADMIN_PANEL.md)
- [DASHBOARD.md](./DASHBOARD.md)
- [../05-database/MULTI_TENANCY_DESIGN.md](../05-database/MULTI_TENANCY_DESIGN.md)
