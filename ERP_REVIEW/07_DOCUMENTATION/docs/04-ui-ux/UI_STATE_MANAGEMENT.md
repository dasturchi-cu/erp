# UI State Management Architecture

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |
| Audience | React/Electron Devs, Flutter Devs, Architects, QA |
| Parent | [UI_UX_MASTER_BLUEPRINT.md](./UI_UX_MASTER_BLUEPRINT.md) |

---

## 1. Purpose

Defines **what state exists in the client**, where it lives, how it synchronizes with the server and WebSocket, and how screens consume it. Ensures desktop and mobile behave identically for business data.

**Principle**: Server is authoritative. Client state is a cache + UI overlay. Financial data is never computed only on client.

---

## 2. State Categories

| Category | Scope | Persistence | Examples |
|----------|-------|-------------|----------|
| **Session** | Global | Secure storage | tokens, user, company_id, permissions |
| **Connection** | Global | Memory | WebSocket status, lastSequenceId |
| **Navigation** | Global | Memory + URL | route, breadcrumbs, sidebar collapsed |
| **UI Preferences** | Global | Local + server sync | theme, language, density |
| **Server Cache** | Per entity | Memory (TanStack Query / Riverpod) | products list, customer detail |
| **Ephemeral UI** | Per screen | Memory | modal open, selected rows, form draft |
| **POS Session** | Sales screen | Memory until complete | cart lines, selected customer |
| **Optimistic** | Transient | Memory | pending row highlight until ACK |

---

## 3. Global State Schema

### 3.1 Auth Session Store

```typescript
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  companyId: string | null;
  branchId: string | null;
  permissions: string[];
  enabledModules: string[];
  role: string;
}
```

| Event | State change |
|-------|--------------|
| Login success | Populate all fields |
| Switch company | Update companyId, branchId, permissions, modules; invalidate caches |
| Logout | Clear all |
| Token refresh | Update accessToken only |
| `user.blocked` WS | Clear session → navigate SCR-002/003 |
| `module.disabled` WS | Update enabledModules |

**Desktop**: Zustand `authStore` + electron secure storage for refresh token.  
**Mobile**: Riverpod `authProvider` + `flutter_secure_storage`.

### 3.2 Connection Store

```typescript
interface ConnectionState {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  lastSequenceId: number;
  lastConnectedAt: string | null;
  pendingEventCount: number;
}
```

On reconnect: `GET /api/v1/sync?since={lastSequenceId}` → apply missed events → bump sequence.

### 3.3 UI Preferences Store

```typescript
interface UiPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  tableDensity: 'dense' | 'comfortable';
  dashboardPeriod: 'day' | 'week' | 'month' | 'year';
  dashboardCurrency: 'UZS' | 'USD' | 'BOTH';
  locale: 'uz' | 'ru' | 'en';
}
```

Sync to server on change (`PATCH /settings/preferences`). Hydrate on login.

---

## 4. Server Cache Strategy

### 4.1 Query Keys (TanStack Query / Riverpod family)

```
['products', companyId, filters]
['product', productId]
['customers', companyId, search]
['customer', customerId]
['sales', companyId, filters]
['sale', saleId]
['inventory', 'stock', companyId, warehouseId]
['dashboard', 'summary', companyId, period, currency]
['admin', 'users', filters]
['admin', 'sessions']
```

### 4.2 Invalidation Matrix

| WebSocket Event | Invalidate |
|-----------------|------------|
| `product.created` | `['products']` |
| `product.updated` | `['products'], ['product', id]` |
| `inventory.stock_changed` | `['products'], ['inventory']`, `['dashboard']` |
| `sale.completed` | `['sales'], ['dashboard'], ['customer', id]` |
| `payment.received` | `['customer', id], ['dashboard']` |
| `currency.rate_updated` | `['currency'], ['dashboard']` (display only) |
| `session.terminated` | auth if self |
| `module.disabled` | auth.modules |

### 4.3 Stale Times

| Data type | staleTime | refetchOnWindowFocus |
|-----------|-----------|----------------------|
| Product list | 30s | yes |
| Customer detail | 15s | yes |
| Dashboard KPIs | 0 (WS primary) | yes |
| Admin sessions | 5s | yes |
| Audit logs | 60s | no |

---

## 5. Per-Screen State Requirements

### SCR-000 Login

| State | Location | Notes |
|-------|----------|-------|
| email, password | Local form | Clear on unmount |
| isSubmitting | Local | Disable form |
| errorCode | Local | Map to messages |
| rememberDevice | Local → persist | Checkbox |

No server cache until success.

### SCR-010 Dashboard

| State | Location | Notes |
|-------|----------|-------|
| period, currency | UiPreferences | Already global |
| summary, chart, topProducts | Server cache | WS patches KPI values in-place |
| isRefreshing | Local | Pull-to-refresh |

### SCR-020 POS

| State | Location | Notes |
|-------|----------|-------|
| cartLines | `posCartStore` (session) | Clear on complete/cancel |
| selectedCustomer | posCartStore | Optional |
| saleCurrency | posCartStore | UZS \| USD |
| exchangeRateSnapshot | posCartStore | Set on currency select |
| productSearchQuery | Local | Debounce 300ms |
| paymentDialogOpen | Local | |
| isCompletingSale | Local | Idempotency key generated once |

**Critical**: On `sale.completed` success → clear cart → show receipt → optional print.

### SCR-040 Product List

| State | Location | Notes |
|-------|----------|-------|
| filters, sort, page | URL search params | Shareable |
| selectedRowIds | Local | Bulk actions |
| createModalOpen | Local | |

### SCR-082 Customer Detail

| State | Location | Notes |
|-------|----------|-------|
| activeTab | URL hash or local | purchases \| payments \| debt |
| customer | Server cache | |
| debtBalances | Derived from customer | Never edit directly |

### SCR-131 Users List (Admin)

| State | Location | Notes |
|-------|----------|-------|
| filters | URL params | |
| blockConfirmUserId | Local | Modal |
| liveSessions | Server cache + WS | Row updates |

---

## 6. Optimistic UI Rules

| Action | Optimistic behavior | Rollback |
|--------|---------------------|----------|
| Block user | Status → BLOCKED immediately | Revert on API error |
| Complete sale | **No** optimistic stock deduct | Wait for server |
| Record payment | Show pending toast | Revert debt display on error |
| Toggle module | **No** — wait for WS broadcast | Admin only |

---

## 7. Form Draft State

| Screen | Persist draft? | Storage |
|--------|----------------|---------|
| SCR-041 Create Product | Yes, 24h | localStorage key `draft:product:new` |
| SCR-063 Receive Stock | Yes, session | sessionStorage |
| SCR-020 POS cart | Yes, until complete | memory + optional sessionStorage recovery |
| Admin destructive | Never | — |

Unsaved guard: `beforeunload` + router blocker when `formState.isDirty`.

---

## 8. Real-Time Merge Strategy

When WS event arrives:

1. Parse `event`, `sequenceId`, `companyId` — ignore if wrong company.
2. If `sequenceId > lastSequenceId`, update `lastSequenceId`.
3. Lookup invalidation rules → patch cache or invalidate.
4. For list rows: `queryClient.setQueryData` merge by id.
5. Flash row UI flag `recentlyUpdated: true` for 2s (local overlay state).

---

## 9. Error State Management

| Error type | Global handler | Screen handler |
|------------|----------------|----------------|
| 401 TOKEN_EXPIRED | Refresh → retry queue | — |
| 401 SESSION_REVOKED | Logout → SCR-003 | — |
| 403 MODULE_DISABLED | Toast + redirect | — |
| 403 FORBIDDEN | — | SCR-190 permission card |
| 422 BUSINESS | — | Inline field/banner |
| Network offline | Global banner | Disable writes |

---

## 10. Platform-Specific Notes

### React / Electron

- **Zustand**: auth, connection, uiPreferences, posCart
- **TanStack Query**: all server data
- **React Router**: URL state for filters
- **Socket.io client**: single instance in provider

### Flutter

- **Riverpod**: parallel providers
- **go_router**: URL state
- **web_socket_channel**: connection provider
- **hive** (optional): offline draft Phase 2

---

## 11. QA State Testing Matrix

| Test | Verify |
|------|--------|
| Login → dashboard | Auth populated, queries enabled |
| Switch company | Old company queries cleared |
| WS disconnect | Banner shown, no stale writes |
| WS reconnect | Sync endpoint fills gap |
| POS cart survives accidental refresh | sessionStorage recovery |
| Block user on device B | Device A shows logout < 5s |
| Module disable | Menu item removed < 1s |

---

## 12. Related Documents

- [USER_FLOWS.md](./USER_FLOWS.md)
- [WEBSOCKET_EVENTS.md](../06-api/WEBSOCKET_EVENTS.md)
- [REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md)
- [WIREFRAME_IMPLEMENTATION_GUIDE.md](./WIREFRAME_IMPLEMENTATION_GUIDE.md)
