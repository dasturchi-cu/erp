# Feature Prioritization

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## MoSCoW Classification

### Must Have (P0) — MVP Blockers

- Authentication and session management
- Multi-company data isolation
- RBAC with 4 core roles
- Device registration, block/unblock
- Session force logout
- Module enable/disable
- Product management (SKU, barcode, dual pricing)
- Inventory batches and FIFO
- UZS/USD currency with frozen transaction rates
- Sales (POS) with FIFO allocation
- Customer management
- Debt creation and payment (partial/full)
- Real-time WebSocket sync
- Dashboard (core KPIs)
- Audit logging
- Admin panel
- Daily backup
- Docker deployment

### Should Have (P1) — Important, not blocking launch

- Report export (PDF, Excel, CSV)
- Branch management
- System health monitoring
- Notification system
- Product search optimization
- Sale void (24h window)
- Discount approval workflow
- Dark/light theme (desktop)

### Could Have (P2) — Desirable

- Large sale notifications
- Debt aging reports
- Keyboard shortcuts for POS
- Auto-update for desktop
- Advanced permission matrix UI

### Won't Have (Phase 1)

- Offline mode
- Marketplace
- Telegram/SMS
- Full accounting
- AI analytics
- macOS native build
- Multi-warehouse

---

## Priority Matrix

| Feature | Business Value | Technical Effort | Priority |
|---------|---------------|------------------|----------|
| Real-time sync | Critical | High | P0 |
| FIFO engine | Critical | High | P0 |
| UZS/USD dual currency | Critical | Medium | P0 |
| Multi-company | Critical | Medium | P0 |
| Admin device control | High | Medium | P0 |
| POS sale flow | Critical | Medium | P0 |
| Debt management | Critical | Medium | P0 |
| Dashboard | High | Medium | P0 |
| Report export | High | Medium | P1 |
| Branch management | Medium | Low | P1 |
| Notifications | Medium | Low | P1 |
| macOS | Low | Low | P2 |

---

## Related Documents

- [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md)
- [USER_STORIES.md](../02-business/USER_STORIES.md)
