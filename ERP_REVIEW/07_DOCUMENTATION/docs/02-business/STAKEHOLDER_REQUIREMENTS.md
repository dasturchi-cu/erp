# Stakeholder Requirements

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Business Owner

| Requirement | Priority |
|-------------|----------|
| Manage multiple companies from one system | P0 |
| Real-time visibility into sales and debt across all devices | P0 |
| Accurate profit calculation with FIFO and dual currency | P0 |
| Data security and company isolation | P0 |
| Daily automated backups | P0 |
| Remote administration capability | P0 |
| System works on phone when away from office | P1 |
| Export reports for accountant | P1 |

---

## 2. Admin

| Requirement | Priority |
|-------------|----------|
| Create, block, unblock users | P0 |
| Assign and revoke roles | P0 |
| View and manage all active devices | P0 |
| View and terminate active sessions | P0 |
| Force logout any user or device | P0 |
| Enable/disable modules globally or per company | P0 |
| Manage companies and branches | P0 |
| Configure permissions per role | P1 |
| Monitor system health | P1 |
| View comprehensive audit logs | P0 |

---

## 3. Manager (Menejer)

| Requirement | Priority |
|-------------|----------|
| Dashboard with sales, profit, debt, inventory value | P0 |
| UZS and USD metrics separately | P0 |
| Manage products and pricing | P0 |
| View and manage customer debts | P0 |
| Generate and export reports (PDF, Excel, CSV) | P1 |
| Update exchange rates | P0 |
| View top products and trends | P1 |
| Approve discounts and overrides | P2 |

---

## 4. Cashier (Kassir)

| Requirement | Priority |
|-------------|----------|
| Fast POS sale flow | P0 |
| Search products by name, SKU, barcode | P0 |
| Search customers by phone | P0 |
| Process cash and credit sales | P0 |
| Record partial and full payments | P0 |
| Select sale currency (UZS/USD) | P0 |
| See real-time stock availability | P0 |
| Void own recent sales | P1 |

---

## 5. Warehouse Keeper (Omborchi)

| Requirement | Priority |
|-------------|----------|
| Add and edit products | P0 |
| Receive inventory in batches | P0 |
| View stock levels and batch details | P0 |
| See FIFO batch order | P1 |
| Stock adjustment with reason | P1 |
| Barcode scanning on mobile | P1 |

---

## 6. IT Operations

| Requirement | Priority |
|-------------|----------|
| Docker-based deployment | P0 |
| Nginx reverse proxy with SSL | P0 |
| CI/CD pipeline | P0 |
| Health monitoring and alerting | P1 |
| Daily backup with cloud copy | P0 |
| Disaster recovery procedure | P0 |
| Log aggregation | P1 |
| Zero-downtime deployments | P2 |

---

## 7. Developer Team

| Requirement | Priority |
|-------------|----------|
| Modular architecture for easy feature addition | P0 |
| Complete documentation before coding | P0 |
| Type-safe API contracts | P0 |
| Standardized project structure | P0 |
| Automated testing infrastructure | P1 |
| Clear module boundaries | P0 |

---

## Related Documents

- [USER_STORIES.md](./USER_STORIES.md)
- [PROJECT_SCOPE.md](../01-governance/PROJECT_SCOPE.md)
