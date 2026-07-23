# Multi-Company Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Multi-Company module enables a single ERP platform instance to serve multiple independent businesses, each with fully isolated data, configuration, users, and modules. This architecture reflects the real-world structure of the master plan — one software platform powering Market, O'O'MQ, Xitoy Tovar, Somafix, Lantian, and future companies — while guaranteeing that no data leaks between organizations.

Users may belong to multiple companies with different roles. The company switcher allows seamless context switching without re-authentication.

---

## 2. Architecture Model

### 2.1 Shared Database, Shared Schema

All companies share one PostgreSQL database with isolation enforced by `company_id` discriminator column on every business table. This model balances operational simplicity with strong isolation.

```
┌─────────────────────────────────────────────────┐
│                  PostgreSQL                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Market   │  │ Somafix  │  │ Xitoy    │ ...  │
│  │ data     │  │ data     │  │ data     │      │
│  │ (scoped) │  │ (scoped) │  │ (scoped) │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

### 2.2 Isolation Layers

Defense-in-depth ensures data separation at every level:

| Layer | Mechanism | Description |
|-------|-----------|-------------|
| **JWT Context** | `company_id` in token | Every request carries company context |
| **Repository Guard** | `WHERE company_id = ?` | Application-level query filtering |
| **PostgreSQL RLS** | Row-Level Security policies | Database-level enforcement |
| **API Middleware** | Body/query validation | Reject tampered `company_id` |
| **WebSocket** | Channel scoping | Events only to same-company subscribers |

See [../05-database/MULTI_TENANCY_DESIGN.md](../05-database/MULTI_TENANCY_DESIGN.md) for technical implementation details.

---

## 3. Registered Companies

### 3.1 Master Plan Companies

| Company | Code | Vertical | Currency Pattern | Notes |
|---------|------|----------|-----------------|-------|
| **Market** | `MARKET` | General retail/wholesale | UZS primary | Flagship deployment; multi-branch |
| **O'O'MQ** | `OOMQ` | Industry-specific | UZS primary | Specialized product lines |
| **Xitoy Tovar** | `XITOY` | Chinese imports | USD-heavy | Import-focused pricing |
| **Somafix** | `SOMAFIX` | Sealant products | Mixed UZS/USD | Batch tracking critical |
| **Lantian** | `LANTIAN` | Multi-product trading | Mixed | Diverse catalog |

### 3.2 Company Configuration

Each company maintains independent:

| Setting | Example |
|---------|---------|
| Exchange rate | Market: 12,750; Xitoy: 12,800 |
| Enabled modules | Somafix: all; OOMQ: no reports yet |
| Branches | Market: 2; others: 1 |
| Product catalog | Completely separate SKUs and products |
| Customer registry | Separate customers (same phone OK across companies) |
| Roles and permissions | Company Admin, Manager, Cashier per company |
| Branding | Logo, receipt header (future) |

---

## 4. Company Switcher

### 4.1 User Experience

Users assigned to multiple companies see a company switcher in the navigation bar:

```
┌──────────────────────────────────────────────┐
│  [Market ▼]  Dashboard  Sales  Products  ... │
└──────────────────────────────────────────────┘
       │
       ▼
  ┌────────────────┐
  │ ● Market       │  ← current
  │   Somafix      │
  │   Xitoy Tovar  │
  └────────────────┘
```

### 4.2 Switch Flow

```
1. User clicks company switcher
2. Selects target company
3. System:
   a. Validates user has access to target company
   b. Issues new JWT with updated company_id and branch_id
   c. Revokes previous company-scoped session (optional)
   d. Client reloads data for new company context
4. All subsequent API calls scoped to new company
5. Audit log: COMPANY_SWITCHED event
```

### 4.3 Context After Switch

| Aspect | Behavior |
|--------|----------|
| Data | All queries return new company's data only |
| Permissions | User's role in selected company applies |
| Branch | Defaults to user's assigned branch in new company |
| Modules | Only modules enabled for new company |
| Dashboard | KPIs for new company |
| Notifications | New company's notifications shown |

---

## 5. User Multi-Company Access

### 5.1 Assignment Model

```
UserCompany:
  user_id     → User
  company_id  → Company
  role_id     → Role (per company)
  branch_id   → Default branch (per company)
```

### 5.2 Example: Multi-Company User

```
User: Alisher Karimov (alisher@erp.uz)

  Market (Manager)
    Role: Manager
    Branch: Tashkent Main
    Permissions: sales.*, debt.*, inventory.view, reports.*

  Somafix (Admin)
    Role: Company Admin
    Branch: Main
    Permissions: admin.*, all module permissions

  Xitoy Tovar (Cashier)
    Role: Cashier
    Branch: Main
    Permissions: sales.create, sales.view, customers.view
```

### 5.3 Access Rules

| Rule | Description |
|------|-------------|
| MC-01 | User must be explicitly assigned to company |
| MC-02 | Role is per-company (Manager in one, Cashier in another) |
| MC-03 | Removing user from company revokes all access immediately |
| MC-04 | Blocked user cannot access any company |
| MC-05 | Suspended company inaccessible to all its users |

---

## 6. Data Isolation Examples

### 6.1 Product Isolation

```
Market:
  SKU: MKT-CEM-50 → Cement 50kg → 45,000 UZS

Somafix:
  SKU: SF-SIL-300ML → Silicone 300ml → 15,000 UZS

Same user (Alisher) sees different products depending on active company.
```

### 6.2 Customer Isolation

```
Phone: +998901234567

Market:    "Alisher Qurilish MChJ" — debt: 5,200,000 UZS
Somafix:   (not registered)
Xitoy:     "Alisher Trade" — debt: $1,200 USD

Same phone, different customer records, different debt balances.
```

### 6.3 Sales Isolation

```
Market today: 127 sales, 45,200,000 UZS
Somafix today: 34 sales, 8,500,000 UZS

Dashboard, reports, and KPIs are completely independent.
```

---

## 7. Company Lifecycle

### 7.1 Creation

1. Platform admin creates company (name, code)
2. Default branch created automatically
3. Core modules enabled (auth, admin, company, audit)
4. Company Admin user assigned
5. Company admin configures: exchange rate, branches, users, modules

### 7.2 Suspension

- All user access to company blocked
- Data preserved (not deleted)
- Can be reactivated by platform admin

### 7.3 Deactivation (Soft Delete)

- Company status → `INACTIVE`
- 90-day retention before data purge
- All users unlinked
- Audit logs retained per retention policy

---

## 8. Testing Requirements

| Test | Expected Result |
|------|----------------|
| User in Company A queries product from Company B by ID | 404 Not Found |
| API request with tampered `company_id` in body | 403 Forbidden |
| WebSocket event from Company A | Not received by Company B subscribers |
| Report generation | Contains only active company's data |
| Company switch | All data changes to new company immediately |
| User removed from company | Cannot switch to or access that company |

---

## 9. Permissions

| Permission | Description |
|------------|-------------|
| `company.view` | View own company details |
| `company.switch` | Switch between assigned companies |
| `admin.companies.create` | Create new company (platform admin) |
| `admin.companies.suspend` | Suspend company (platform admin) |

---

## 10. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/companies` | List user's assigned companies |
| GET | `/api/v1/companies/current` | Active company details |
| POST | `/api/v1/companies/switch` | Switch company context |
| GET | `/api/v1/admin/companies` | List all companies (admin) |
| POST | `/api/v1/admin/companies` | Create company (admin) |

---

## 11. Related Documents

- [../05-database/MULTI_TENANCY_DESIGN.md](../05-database/MULTI_TENANCY_DESIGN.md)
- [BRANCH_MANAGEMENT.md](./BRANCH_MANAGEMENT.md)
- [MODULE_MANAGEMENT.md](./MODULE_MANAGEMENT.md)
- [ADMIN_PANEL.md](./ADMIN_PANEL.md)
- [../02-business/BUSINESS_RULES.md](../02-business/BUSINESS_RULES.md)
- [../02-business/INDUSTRY_CONTEXT.md](../02-business/INDUSTRY_CONTEXT.md)
