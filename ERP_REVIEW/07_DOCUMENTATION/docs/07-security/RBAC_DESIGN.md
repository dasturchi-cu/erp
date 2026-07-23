# RBAC Design

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## System Roles

| Role | Code | Description |
|------|------|-------------|
| Admin | `admin` | Full system access, all companies |
| Manager | `manager` | Business operations, reports, pricing |
| Cashier | `cashier` | POS, payments, customer lookup |
| Warehouse Keeper | `warehouse` | Products, inventory, stock |

---

## Role-Permission Matrix (Summary)

| Permission | Admin | Manager | Cashier | Warehouse |
|------------|-------|---------|---------|-----------|
| admin.* | ✓ | — | — | — |
| products.view | ✓ | ✓ | ✓ | ✓ |
| products.create | ✓ | ✓ | — | ✓ |
| products.update | ✓ | ✓ | — | ✓ |
| inventory.receive | ✓ | ✓ | — | ✓ |
| sales.create | ✓ | ✓ | ✓ | — |
| sales.cancel | ✓ | ✓ | Own | — |
| debt.payment | ✓ | ✓ | ✓ | — |
| customers.create | ✓ | ✓ | ✓ | — |
| dashboard.view | ✓ | ✓ | — | — |
| reports.generate | ✓ | ✓ | — | — |
| currency.manage | ✓ | ✓ | — | — |

---

## Custom Roles (Future)

Admin can create custom roles with any permission combination. System roles cannot be deleted.

---

## Multi-Company Roles

User "Alisher":
- Market → Manager
- Somafix → Admin

Role is per-company via `user_companies` table.

---

## Related Documents

- [PERMISSIONS_MODEL.md](./PERMISSIONS_MODEL.md)
- [AUTHORIZATION.md](./AUTHORIZATION.md)
