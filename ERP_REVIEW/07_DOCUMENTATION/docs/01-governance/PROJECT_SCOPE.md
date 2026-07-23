# Project Scope

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Source | [ERP_MASTER_PLAN.md](../../ERP_MASTER_PLAN.md) |
| Last Updated | 2026-06-17 |

---

## 1. Project Vision

Build a production-ready ERP for real Uzbekistan enterprises managing wholesale and retail operations across multiple product verticals, with dual-currency (UZS/USD) support, FIFO inventory, real-time multi-device synchronization, and strict multi-company data isolation.

---

## 2. In Scope — Phase 1 (MVP / Core ERP)

### 2.1 Platforms

| Platform | Technology | Status |
|----------|------------|--------|
| Windows Desktop | Electron + React + TypeScript | In Scope |
| Android | Flutter (Material Design 3) | In Scope |
| iPhone / iPad | Flutter (Material Design 3) | In Scope |
| macOS | Electron (future packaging) | Planned — architecture ready |

### 2.2 Core Modules

- [x] **Authentication & Session Management** — Login, logout, multi-device sessions
- [x] **Authorization (RBAC)** — Admin, Manager, Cashier, Warehouse Keeper + extensible roles
- [x] **Multi-Company** — Isolated tenants (Market, O'O'MQ, Xitoy Tovar, Somafix, Lantian, etc.)
- [x] **Branch Management** — Sub-units within companies
- [x] **Products** — SKU, barcode, category, dual-currency pricing
- [x] **Inventory** — Stock levels, warehouse management
- [x] **FIFO** — Batch tracking, automatic cost allocation on sale
- [x] **Currency (UZS/USD)** — Dual pricing, frozen exchange rates per transaction
- [x] **Sales** — Wholesale and retail transactions
- [x] **Customers** — Customer cards, purchase/payment history
- [x] **Debt Management** — Debt creation, partial/full payment, history
- [x] **Dashboard** — Daily/weekly/monthly/yearly KPIs in UZS and USD
- [x] **Reports** — PDF, Excel, CSV export
- [x] **Notifications** — Real-time in-app notifications
- [x] **Admin Panel** — Users, devices, sessions, companies, roles, permissions, modules
- [x] **Audit Logs** — Full CRUD and business action trail
- [x] **Real-Time Sync** — WebSocket push to all connected devices
- [x] **Device Management** — Register, block, unblock, force logout
- [x] **Module Management** — Enable/disable modules system-wide or per company
- [x] **System Monitoring** — Health checks, active sessions/devices dashboard
- [x] **Backup & Recovery** — Daily PostgreSQL backup, ZIP archive, local + cloud storage
- [x] **Deployment** — Docker, Nginx, HTTPS/SSL, CI/CD pipeline

### 2.3 Industry Verticals Supported

- Construction materials (Qurilish mollari)
- Furniture parts (Mebel zapchastlari)
- Shelving (Narvonlar)
- Tools (Instrumentlar)
- Sealants (Germetik mahsulotlar)
- Wholesale trade (Ulgurji savdo)
- Retail trade (Chakana savdo)

---

## 3. Out of Scope — Phase 1

| Item | Phase | Notes |
|------|-------|-------|
| Marketplace | Phase 2+ | Architecture hooks prepared |
| Telegram Bot | Phase 2+ | Notification channel extension |
| SMS Gateway | Phase 2+ | Integration point defined |
| Full CRM | Phase 2+ | Customer module is foundation |
| Full Accounting (GL) | Phase 2+ | Sales/debt data feeds future module |
| AI Analytics | Phase 3+ | Data warehouse layer planned |
| macOS Native | Phase 2 | Electron codebase shared |
| Offline-first mode | Phase 2 | Online-required for Phase 1 |
| Multi-language UI | Phase 1.5 | Uzbek primary; i18n framework in place |
| Supplier/Purchase Orders | Phase 2 | Inventory receipts manual in Phase 1 |
| Payroll / HR | Out of scope | Not in master plan |

---

## 4. Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| Business Owner | ROI, multi-company control, debt visibility |
| Admin | User/device/session/module management |
| Manager | Reports, dashboard, pricing, inventory value |
| Cashier | Fast POS, customer debt lookup |
| Warehouse Keeper | Stock in/out, batch visibility |
| IT Operations | Deployment, backup, monitoring |
| Developer Team | Modular, documented, testable codebase |

---

## 5. Success Criteria

1. Product added on Windows appears on mobile within 1 second
2. Company A cannot query Company B data under any circumstance
3. FIFO cost allocation matches manual calculation 100%
4. Historical sale amounts unchanged after exchange rate updates
5. Admin can block device and user is logged out within 5 seconds
6. Daily backup verified restorable
7. System supports 50 concurrent users per company without degradation
8. All admin actions and business transactions are audit-logged

---

## 6. Constraints

- Central server deployment (not peer-to-peer)
- PostgreSQL as sole relational database
- Internet required for all operations in Phase 1
- Uzbekistan business practices (UZS/USD dual economy)
- Asia/Tashkent timezone

---

## 7. Assumptions

- Single production server sufficient for initial rollout
- Exchange rates entered manually or via admin update (no auto FX feed in Phase 1)
- One primary warehouse per company in MVP (multi-warehouse in Phase 2)
- Barcode scanning via device camera on mobile, USB scanner on desktop

---

## 8. Dependencies

- SSL certificate (Let's Encrypt or commercial)
- Cloud storage for backup (S3-compatible or local NAS)
- Domain name and static IP or DDNS
- Docker-capable Linux server (Ubuntu 22.04+ recommended)

---

## 9. Related Documents

- [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md)
- [../03-product/PRODUCT_ROADMAP.md](../03-product/PRODUCT_ROADMAP.md)
- [../03-product/MODULE_CATALOG.md](../03-product/MODULE_CATALOG.md)
