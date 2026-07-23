# REST API Reference

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Auth

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/auth/login` | Public | Login |
| POST | `/auth/refresh` | Public | Refresh token |
| POST | `/auth/logout` | Auth | Logout |
| GET | `/auth/me` | Auth | Profile + permissions + modules |
| POST | `/auth/switch-company` | Auth | Switch company |

---

## Admin — Users

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/users` | admin.users.view |
| POST | `/admin/users` | admin.users.create |
| GET | `/admin/users/:id` | admin.users.view |
| PATCH | `/admin/users/:id` | admin.users.update |
| POST | `/admin/users/:id/block` | admin.users.block |
| POST | `/admin/users/:id/unblock` | admin.users.unblock |
| POST | `/admin/users/:id/force-logout` | admin.sessions.revoke |

---

## Admin — Devices

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/devices` | admin.devices.view |
| GET | `/admin/devices/:id` | admin.devices.view |
| POST | `/admin/devices/:id/block` | admin.devices.block |
| POST | `/admin/devices/:id/unblock` | admin.devices.unblock |
| POST | `/admin/devices/:id/force-logout` | admin.sessions.revoke |

---

## Admin — Sessions

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/sessions` | admin.sessions.view |
| POST | `/admin/sessions/:id/revoke` | admin.sessions.revoke |

---

## Admin — Companies

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/companies` | admin.companies.view |
| POST | `/admin/companies` | admin.companies.create |
| PATCH | `/admin/companies/:id` | admin.companies.update |

---

## Admin — Modules

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/modules` | admin.modules.view |
| PATCH | `/admin/modules/:id` | admin.modules.manage |
| PATCH | `/admin/companies/:id/modules/:moduleId` | admin.modules.manage |

---

## Admin — Roles & Permissions

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/roles` | admin.roles.view |
| POST | `/admin/roles` | admin.roles.create |
| PATCH | `/admin/roles/:id` | admin.roles.update |
| PUT | `/admin/roles/:id/permissions` | admin.roles.manage |

---

## Products

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/products` | products.view |
| POST | `/products` | products.create |
| GET | `/products/:id` | products.view |
| PATCH | `/products/:id` | products.update |
| DELETE | `/products/:id` | products.delete |
| GET | `/products/search` | products.view |

---

## Inventory

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/inventory/stock` | inventory.view |
| POST | `/inventory/receive` | inventory.receive |
| GET | `/inventory/batches` | inventory.view |
| GET | `/inventory/batches/:id` | inventory.view |
| POST | `/inventory/adjust` | inventory.adjust |

---

## Sales

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/sales` | sales.view |
| POST | `/sales` | sales.create |
| GET | `/sales/:id` | sales.view |
| POST | `/sales/:id/void` | sales.cancel |
| POST | `/sales/:id/return` | sales.return |

---

## Customers

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/customers` | customers.view |
| POST | `/customers` | customers.create |
| GET | `/customers/:id` | customers.view |
| PATCH | `/customers/:id` | customers.update |
| GET | `/customers/search` | customers.view |

---

## Debt

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/customers/:id/debts` | debt.view |
| POST | `/debt-payments` | debt.payment |
| GET | `/debt-payments` | debt.view |

---

## Currency

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/currency/rate` | currency.view |
| POST | `/currency/rate` | currency.manage |
| GET | `/currency/rates/history` | currency.view |

---

## Dashboard

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/dashboard/summary` | dashboard.view |
| GET | `/dashboard/top-products` | dashboard.view |
| GET | `/dashboard/sales-chart` | dashboard.view |

---

## Reports

| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/reports/generate` | reports.generate |
| GET | `/reports/:id/download` | reports.view |
| GET | `/reports` | reports.view |

---

## Audit

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/audit-logs` | admin.audit.view |

---

## System

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/health` | Public |
| GET | `/admin/monitoring` | admin.monitoring.view |

---

## Related Documents

- [API_DESIGN.md](./API_DESIGN.md)
- [WEBSOCKET_EVENTS.md](./WEBSOCKET_EVENTS.md)
