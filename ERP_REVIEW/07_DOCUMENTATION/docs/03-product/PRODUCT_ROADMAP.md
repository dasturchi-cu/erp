# Product Roadmap

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## Phase 0: Foundation (Current)

**Timeline**: Weeks 1-2

- [x] Master plan defined
- [x] Complete documentation suite
- [ ] Architecture review sign-off
- [ ] UI/UX wireframe approval

---

## Phase 1: Core Platform

**Timeline**: Weeks 3-6

- Authentication (login, logout, refresh tokens)
- Multi-company with isolation
- RBAC (Admin, Manager, Cashier, Warehouse Keeper)
- Session management
- Device registration and management
- Admin panel (users, roles, sessions, devices)
- Module registry (enable/disable)
- Audit logging framework
- WebSocket infrastructure
- Database schema + migrations

**Deliverable**: Admin can manage users, companies, devices; users can log in from multiple devices.

---

## Phase 2: Catalog & Inventory

**Timeline**: Weeks 7-10

- Product CRUD (SKU, barcode, category, dual pricing)
- Inventory batch management
- FIFO engine
- Stock movements
- Real-time stock sync

**Deliverable**: Products and inventory fully managed with FIFO.

---

## Phase 3: Commercial Operations

**Timeline**: Weeks 11-14

- Currency module (UZS/USD, exchange rates)
- Customer management
- Sales (POS flow)
- Debt management (create, partial, full payment)
- Sale returns

**Deliverable**: End-to-end sale-to-debt workflow operational.

---

## Phase 4: Analytics & Reporting

**Timeline**: Weeks 15-17

- Dashboard (all KPIs, UZS/USD)
- Report generation (PDF, Excel, CSV)
- Notifications

**Deliverable**: Managers have full business visibility.

---

## Phase 5: Desktop Client

**Timeline**: Weeks 18-22

- Electron + React application
- All modules with dark/light theme
- POS optimized layout
- Auto-update mechanism

**Deliverable**: Production Windows desktop client.

---

## Phase 6: Mobile Client

**Timeline**: Weeks 23-26

- Flutter app (Android + iOS)
- Material Design 3
- Core flows: sales, payments, product lookup, stock view

**Deliverable**: Production mobile apps.

---

## Phase 7: DevOps & Go-Live

**Timeline**: Weeks 27-28

- Docker production deployment
- Nginx + SSL
- CI/CD pipeline
- Monitoring + alerting
- Backup automation
- UAT with pilot company
- Go-live

---

## Phase 8+: Future Expansion

| Feature | Timeline | Priority |
|---------|----------|----------|
| macOS desktop | Q3 2026 | Medium |
| Multi-warehouse | Q3 2026 | High |
| Supplier/Purchase orders | Q4 2026 | High |
| Telegram bot notifications | Q4 2026 | Medium |
| SMS notifications | Q4 2026 | Medium |
| CRM module | 2027 | Medium |
| Accounting (GL) | 2027 | High |
| Marketplace | 2027 | Low |
| AI Analytics | 2027+ | Low |
| Offline mode | 2027 | Medium |

---

## Related Documents

- [FEATURE_PRIORITIZATION.md](./FEATURE_PRIORITIZATION.md)
- [RELEASE_STRATEGY.md](./RELEASE_STRATEGY.md)
- [../12-future/EXPANSION_ROADMAP.md](../12-future/EXPANSION_ROADMAP.md)
