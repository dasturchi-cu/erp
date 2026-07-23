# Multi-Device Strategy

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

The ERP platform operates across **four client platforms**—Windows desktop, macOS desktop (planned), Android mobile, and iOS mobile—all connected to a **single shared database** with **real-time synchronization**. This document defines the cross-platform strategy ensuring consistent business data, appropriate feature distribution per device, and seamless multi-device user experiences.

---

## 2. Platform Matrix

| Platform | Technology | Phase | Primary Users | Primary Use Cases |
|----------|------------|-------|---------------|-------------------|
| Windows Desktop | Electron + React + TS | 1 (Now) | Cashiers, warehouse, managers | Full ERP: POS, inventory, admin, reports |
| Android Mobile | Flutter + MD3 | 1 (Now) | Field sales, managers | Sales, payments, product lookup, stock check |
| iOS Mobile | Flutter + MD3 | 1 (Now) | Field sales, managers | Sales, payments, product lookup, stock check |
| macOS Desktop | Electron + React + TS | 2 (Q3 2026) | Owners, accountants | Dashboard, reports, management |

---

## 3. Architectural Principle: Thin Clients, Fat Server

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Thin)                      │
│                                                              │
│  Responsibility: UI rendering, user input, local cache,     │
│  optimistic UI, WebSocket listener                           │
│                                                              │
│  NOT responsible for: business rules, calculations,          │
│  data validation, conflict resolution, financial logic       │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API + WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                     SERVER LAYER (Fat)                         │
│                                                              │
│  Responsibility: ALL business logic, validation, RBAC,       │
│  FIFO, currency conversion, debt calculation, audit,        │
│  conflict resolution, real-time event publishing              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   DATABASE (Single Source of Truth)            │
│                     PostgreSQL 16+                            │
└─────────────────────────────────────────────────────────────┘
```

This principle ensures that adding a new platform requires only a new UI client — no business logic duplication.

---

## 4. Feature Distribution Strategy

### Full Feature (Desktop)

| Module | Windows | macOS |
|--------|---------|-------|
| Dashboard | Yes | Yes |
| Products (CRUD) | Yes | Yes |
| Inventory (full) | Yes | Yes |
| Sales (POS) | Yes | Limited |
| Customers (CRUD) | Yes | Yes |
| Debt management | Yes | Yes |
| Currency | Yes | Yes |
| Reports (generate) | Yes | Yes |
| Admin panel | Yes | Yes |
| Notifications | Yes | Yes |
| Settings | Yes | Yes |

### Core Feature (Mobile)

| Module | Android | iOS |
|--------|---------|-----|
| Dashboard (summary) | Yes | Yes |
| Products (read + search) | Yes | Yes |
| Inventory (view stock) | Yes | Yes |
| Sales (POS) | Yes | Yes |
| Customers (read + create) | Yes | Yes |
| Debt (payment recording) | Yes | Yes |
| Currency (view rates) | Yes | Yes |
| Reports (view only) | No | No |
| Admin panel | No | No |
| Notifications | Yes | Yes |
| Settings | Yes | Yes |

### Feature Placement Rationale

| Decision | Rationale |
|----------|-----------|
| POS on desktop (primary) | Keyboard, barcode scanner, large screen, receipt printer |
| POS on mobile (secondary) | Field sales, delivery confirmation, pop-up shops |
| Admin on desktop only | Security-sensitive; complex forms; role management |
| Reports on desktop only | Large data sets; PDF/Excel generation; print |
| Product CRUD on desktop | Complex forms with images, categories, pricing |
| Product search on all | Universal need; mobile optimized for barcode scan |

---

## 5. Real-Time Multi-Device Sync

All platforms receive identical WebSocket events when business data changes.

### Example: Multi-Device Sale Flow

```
Timeline:
  T0: Manager (macOS) views dashboard — today's sales: 45,000,000 UZS
  T1: Cashier (Windows) completes sale — 2,500,000 UZS
  T2: Server commits sale; emits sale.completed + inventory.stock_changed
  T3: Manager's dashboard updates — today's sales: 47,500,000 UZS (< 500ms)
  T4: Warehouse keeper (Android) sees stock decrease for sold product
  T5: Field sales rep (iOS) sees updated stock level in product search
```

### Sync Guarantees

| Guarantee | Implementation |
|-----------|----------------|
| Same data on all devices | Single PostgreSQL source of truth |
| Near-instant updates | WebSocket events < 500ms p95 |
| Tenant isolation | Events scoped to `company_id` rooms |
| Ordering | Per-company `sequenceId` monotonic ordering |
| Gap recovery | Event replay API on reconnect |
| Conflict safety | Server-authoritative resolution |

See [../09-realtime/REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md).

---

## 6. User Multi-Device Experience

### Single User, Multiple Devices

A user may be logged in on multiple devices simultaneously (e.g., desktop at office + mobile in field).

| Aspect | Behavior |
|--------|----------|
| Concurrent sessions | Allowed (up to 5 devices per user) |
| Session management | Admin can view and terminate individual sessions |
| Forced logout | `session.terminated` event on all devices |
| Company switch | Must re-authenticate or switch company per device |
| Cart/form state | Per-device (not synced); server state is synced |
| Preferences (theme) | Per-device local; server-side user preferences synced |

### Device Registration

Every client device is registered on first login:

| Field | Source |
|-------|--------|
| `device_id` | Generated UUID (persisted locally) |
| `platform` | `windows`, `macos`, `android`, `ios` |
| `app_version` | Client application version |
| `os_version` | Operating system version |
| `device_name` | User-assigned or auto-detected |
| `last_seen` | Updated on each API request |

Admin can block devices via admin panel. Blocked devices receive `device.blocked` WebSocket event and are force-logged out.

---

## 7. Design System Consistency

### Shared Design Language

| Element | Desktop (shadcn/ui) | Mobile (MD3) | Consistent |
|---------|---------------------|--------------|------------|
| Color palette | CSS variables | MaterialTheme | Yes (same hex values) |
| Typography scale | Tailwind text classes | MD3 text theme | Proportional |
| Spacing | 4px grid | 4dp grid | Yes |
| Icons | Lucide icons | Material Symbols | Different sets; same metaphors |
| Dark/light mode | CSS class toggle | ThemeMode | Yes (both support) |
| Currency display | UZS/USD formatting | UZS/USD formatting | Yes (same locale rules) |
| Error messages | Toast (sonner) | SnackBar | Same text content |
| Loading states | Skeleton + spinner | Shimmer + CircularProgress | Platform-native |

See [../04-ui-ux/DESIGN_SYSTEM.md](../04-ui-ux/DESIGN_SYSTEM.md).

### Platform-Native Patterns

| Pattern | Desktop | Mobile |
|---------|---------|--------|
| Navigation | Sidebar + top bar | Bottom nav bar / rail |
| Search | Top search bar (always visible) | Search screen with bar |
| Data tables | Full HTML tables with sort/filter | Scrollable lists with cards |
| Forms | Multi-column layouts | Single-column, full-width |
| Actions | Toolbar buttons | FAB + bottom sheets |
| Modals | Dialog (centered) | Bottom sheet (full-screen on phone) |

---

## 8. API Contract Sharing

All platforms consume the **same REST API v1** and **WebSocket event protocol**.

| Contract | Desktop | Mobile | Server |
|----------|---------|--------|--------|
| REST API v1 | Dio / fetch | Dio | NestJS |
| WebSocket events | socket.io-client | socket_io_client | Socket.io |
| Auth (JWT) | Bearer token | Bearer token | Passport JWT |
| Error format | Standard envelope | Standard envelope | class-validator |
| Pagination | Cursor-based | Cursor-based | Prisma |
| Idempotency | Header on writes | Header on writes | Server-enforced |

No platform-specific API endpoints. If a feature is unavailable on mobile, the API still supports it — the mobile UI simply does not expose it.

---

## 9. Release Coordination

### Versioning

| Component | Versioning | Release Cycle |
|-----------|------------|---------------|
| API Server | Semver (`v1.4.0`) | Bi-weekly |
| Windows Desktop | Semver (`1.4.0`) | With API release |
| macOS Desktop | Semver (`1.4.0`) | With API release |
| Android App | Semver (`1.4.0`) | With API release |
| iOS App | Semver (`1.4.0`) | With API release |

### Compatibility Matrix

| API Version | Min Desktop | Min Mobile | Breaking Changes |
|-------------|-------------|------------|------------------|
| v1.0 | 1.0.0 | 1.0.0 | Initial release |
| v1.x | 1.0.0+ | 1.0.0+ | Backward compatible |
| v2.0 | 2.0.0 | 2.0.0 | Major version bump |

### Forced Update Policy

| Scenario | Action |
|----------|--------|
| API breaking change | All clients must update |
| Security patch | Admin can set minimum client version |
| Feature addition | Old clients continue working (graceful degradation) |
| Bug fix | Recommended update; not forced |

Server API returns `X-Min-Client-Version` header. Clients below minimum show update prompt.

---

## 10. Testing Strategy

### Cross-Platform Test Matrix

| Test Scenario | Windows | macOS | Android | iOS |
|---------------|---------|-------|---------|-----|
| Login + company select | Required | Required | Required | Required |
| Product search | Required | Required | Required | Required |
| Complete sale | Required | Optional | Required | Required |
| Real-time stock sync | Required | Required | Required | Required |
| Payment recording | Required | Required | Required | Required |
| Multi-device sync | Required | Required | Required | Required |
| Forced logout | Required | Required | Required | Required |
| Dark/light theme | Required | Required | Required | Required |
| Offline behavior | Required | Required | Required | Required |

### Multi-Device Integration Tests

| Test | Devices | Pass Criteria |
|------|---------|---------------|
| Sale sync | Windows + Android | Stock updates on both < 500ms |
| Price change | Windows + iOS | Catalog updates on mobile |
| Force logout | Windows + Android + iOS | All devices logged out |
| Company switch | Desktop + Mobile | Each shows correct company data |
| Concurrent sale | 2× Windows | Server rejects oversell |

---

## 11. Future Platform Considerations

| Platform | Timeline | Technology | Use Case |
|----------|----------|------------|----------|
| Web (PWA) | 2027 | React (shared with Electron) | Quick access without install |
| Tablet (iPad) | 2027 | Flutter (responsive) | Warehouse floor, showroom |
| Telegram Mini App | 2027 | Telegram Web App API | Quick stock check, notifications |
| Kiosk (touch POS) | 2028 | Electron (fullscreen) | Self-service checkout |

See [../12-future/EXPANSION_ROADMAP.md](../12-future/EXPANSION_ROADMAP.md).

---

## 12. Related Documents

- [DESKTOP_ELECTRON.md](./DESKTOP_ELECTRON.md)
- [MOBILE_FLUTTER.md](./MOBILE_FLUTTER.md)
- [FUTURE_MACOS.md](./FUTURE_MACOS.md)
- [../09-realtime/REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md)
- [../09-realtime/CONFLICT_RESOLUTION.md](../09-realtime/CONFLICT_RESOLUTION.md)
- [../04-ui-ux/DESIGN_SYSTEM.md](../04-ui-ux/DESIGN_SYSTEM.md)
- [../07-security/DEVICE_MANAGEMENT.md](../07-security/DEVICE_MANAGEMENT.md)
