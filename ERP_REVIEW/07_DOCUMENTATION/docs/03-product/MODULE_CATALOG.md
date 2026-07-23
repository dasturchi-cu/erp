# Module Catalog

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## Module Registry

| ID | Module | Description | Phase | Dependencies |
|----|--------|-------------|-------|--------------|
| M01 | **core** | Platform foundation, config, health | 1 | — |
| M02 | **auth** | Authentication, sessions, tokens | 1 | core |
| M03 | **admin** | User, role, device, session, module management | 1 | auth |
| M04 | **company** | Multi-company, branches, isolation | 1 | auth |
| M05 | **products** | Product catalog, categories, pricing | 2 | company |
| M06 | **inventory** | Stock levels, warehouse, movements | 2 | products |
| M07 | **fifo** | Batch tracking, FIFO allocation engine | 2 | inventory |
| M08 | **currency** | UZS/USD rates, dual currency support | 3 | company |
| M09 | **customers** | Customer cards, contact info | 3 | company |
| M10 | **sales** | POS, sale transactions, returns | 3 | products, inventory, fifo, currency, customers |
| M11 | **debt** | Accounts receivable, payments | 3 | customers, sales, currency |
| M12 | **dashboard** | KPI dashboard, real-time metrics | 4 | sales, debt, inventory |
| M13 | **reports** | Report generation, export | 4 | sales, debt, inventory |
| M14 | **notifications** | In-app real-time notifications | 4 | core |
| M15 | **audit** | Audit trail, compliance logging | 1 | core |

---

## Future Modules (Registered, Not Implemented)

| ID | Module | Description | Target |
|----|--------|-------------|--------|
| F01 | **purchasing** | Supplier orders, purchase receipts | Phase 2 |
| F02 | **accounting** | General ledger, journal entries | 2027 |
| F03 | **crm** | Lead tracking, customer engagement | 2027 |
| F04 | **marketplace** | Online product catalog, orders | 2027 |
| F05 | **telegram** | Telegram bot integration | Q4 2026 |
| F06 | **sms** | SMS notifications | Q4 2026 |
| F07 | **analytics** | AI-powered business insights | 2027+ |

---

## Module Documentation Index

| Module | Document |
|--------|----------|
| Products | [PRODUCTS.md](../08-modules/PRODUCTS.md) |
| Inventory | [INVENTORY.md](../08-modules/INVENTORY.md) |
| FIFO | [FIFO.md](../08-modules/FIFO.md) |
| Currency | [CURRENCY_UZS_USD.md](../08-modules/CURRENCY_UZS_USD.md) |
| Sales | [SALES.md](../08-modules/SALES.md) |
| Customers | [CUSTOMERS.md](../08-modules/CUSTOMERS.md) |
| Debt | [DEBT_MANAGEMENT.md](../08-modules/DEBT_MANAGEMENT.md) |
| Dashboard | [DASHBOARD.md](../08-modules/DASHBOARD.md) |
| Reports | [REPORTS.md](../08-modules/REPORTS.md) |
| Notifications | [NOTIFICATIONS.md](../08-modules/NOTIFICATIONS.md) |
| Admin Panel | [ADMIN_PANEL.md](../08-modules/ADMIN_PANEL.md) |
| Audit Logs | [AUDIT_LOGS.md](../08-modules/AUDIT_LOGS.md) |
| Multi-Company | [MULTI_COMPANY.md](../08-modules/MULTI_COMPANY.md) |
| Module Management | [MODULE_MANAGEMENT.md](../08-modules/MODULE_MANAGEMENT.md) |
| Branch Management | [BRANCH_MANAGEMENT.md](../08-modules/BRANCH_MANAGEMENT.md) |

---

## Related Documents

- [../01-governance/MODULAR_ARCHITECTURE.md](../01-governance/MODULAR_ARCHITECTURE.md)
- [../08-modules/MODULE_MANAGEMENT.md](../08-modules/MODULE_MANAGEMENT.md)
