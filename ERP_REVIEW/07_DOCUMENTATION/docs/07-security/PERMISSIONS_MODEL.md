# Permissions Model

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Permission Format

```
{module}.{action}

Examples:
  products.view
  products.create
  products.update
  products.delete
  sales.create
  sales.cancel
  admin.users.block
  admin.devices.block
  admin.sessions.revoke
  admin.modules.manage
```

---

## Complete Permission List

### Admin
- `admin.users.view`, `admin.users.create`, `admin.users.update`, `admin.users.block`
- `admin.devices.view`, `admin.devices.block`
- `admin.sessions.view`, `admin.sessions.revoke`
- `admin.companies.view`, `admin.companies.create`, `admin.companies.update`
- `admin.roles.view`, `admin.roles.create`, `admin.roles.update`, `admin.roles.manage`
- `admin.modules.view`, `admin.modules.manage`
- `admin.audit.view`
- `admin.monitoring.view`

### Products
- `products.view`, `products.create`, `products.update`, `products.delete`

### Inventory
- `inventory.view`, `inventory.receive`, `inventory.adjust`, `inventory.oversell`

### Sales
- `sales.view`, `sales.create`, `sales.cancel`, `sales.return`, `sales.discount`, `sales.view_all`

### Customers
- `customers.view`, `customers.create`, `customers.update`, `customers.delete`

### Debt
- `debt.view`, `debt.payment`

### Currency
- `currency.view`, `currency.manage`

### Dashboard & Reports
- `dashboard.view`
- `reports.view`, `reports.generate`

---

## Permission Registration

Modules register permissions at startup. Stored in `permissions` table. Assigned to roles via `role_permissions` junction table.

---

## Related Documents

- [RBAC_DESIGN.md](./RBAC_DESIGN.md)
- [../08-modules/MODULE_MANAGEMENT.md](../08-modules/MODULE_MANAGEMENT.md)
