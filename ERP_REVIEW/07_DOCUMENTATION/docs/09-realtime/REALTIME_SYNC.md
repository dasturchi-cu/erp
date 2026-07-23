# Real-Time Sync

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

The ERP platform maintains a **single shared PostgreSQL database** as the authoritative source of truth. All connected devices—Windows desktop, Android mobile, iOS mobile, and future macOS clients—receive **instant state updates** when any user or device modifies business data. Real-time synchronization ensures that a sale completed at the warehouse counter is immediately visible on the manager's dashboard, the cashier's POS screen, and the mobile stock-check app without manual refresh.

**Target latency**: p95 under 500ms from database commit to client UI update across all subscribed devices within the same company.

---

## 2. Design Goals

| Goal | Description |
|------|-------------|
| **Consistency** | All devices converge on the same server state after any mutation |
| **Multi-device parity** | Desktop, mobile, and web clients receive identical event payloads |
| **Tenant isolation** | Events never cross `company_id` boundaries |
| **Resilience** | Missed events are recoverable via sequence-based replay |
| **Scalability** | Fan-out supports hundreds of concurrent connections per company |
| **Auditability** | Every propagated event is traceable to an originating transaction |

---

## 3. Architecture Overview

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Desktop    │  │  Android    │  │   iOS       │
│  Electron   │  │  Flutter    │  │  Flutter    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │ WSS (Socket.io)
                        ▼
              ┌─────────────────┐
              │  API Gateway    │
              │  WebSocket      │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Domain   │  │ Event    │  │ Redis    │
   │ Service  │→ │ Publisher│→ │ Pub/Sub  │
   └────┬─────┘  └──────────┘  └────┬─────┘
        │                           │
        ▼                           ▼
   ┌──────────┐              ┌──────────┐
   │PostgreSQL│              │ WS Nodes │
   │ (SoT)    │              │ Fan-out  │
   └──────────┘              └──────────┘
```

### Data Flow

1. Client submits mutation via REST API (e.g., complete sale, update product).
2. Server validates JWT, RBAC, and company scope.
3. Transaction commits to PostgreSQL.
4. Domain service emits an internal domain event.
5. Event publisher assigns a monotonic `sequenceId` and broadcasts to Redis channel `company:{company_id}`.
6. All WebSocket gateway instances subscribed to that channel push the event to connected clients in room `company:{company_id}`.
7. Clients apply the event to local cache (TanStack Query / Riverpod) and update UI.

---

## 4. Shared Database Model

All devices read and write through the **same PostgreSQL instance**. There is no per-device database, no peer-to-peer sync, and no client-side authoritative storage in Phase 1.

| Aspect | Policy |
|--------|--------|
| Source of truth | PostgreSQL only |
| Client cache | Ephemeral; invalidated or patched on events |
| Cross-device writes | Any authorized device may mutate; server resolves ordering |
| Read consistency | Read-after-write via API response; eventual consistency via WebSocket for other devices |
| Stock quantities | Server-computed; never trusted from client payload alone |

This model eliminates split-brain scenarios at the cost of requiring network connectivity. Offline capabilities are deferred to Phase 2 (see [OFFLINE_STRATEGY.md](./OFFLINE_STRATEGY.md)).

---

## 5. Event Catalog and Sync Scope

Real-time sync covers all business-critical entities. Full event specifications are defined in [../06-api/WEBSOCKET_EVENTS.md](../06-api/WEBSOCKET_EVENTS.md).

| Domain | Events | Sync Impact |
|--------|--------|-------------|
| Products | `product.created`, `product.updated`, `product.deleted` | Catalog screens, POS search, barcode lookup |
| Inventory | `inventory.batch_created`, `inventory.stock_changed` | Stock views, low-stock alerts, FIFO availability |
| Sales | `sale.completed`, `sale.voided` | POS history, dashboard revenue, shift reports |
| Payments | `payment.received` | Customer debt balances, receivables |
| Customers | `customer.updated` | CRM views, debt aging |
| Currency | `currency.rate_updated` | Dual-currency pricing, conversion displays |
| Admin | `module.enabled`, `module.disabled`, `session.terminated`, `device.blocked` | Feature gating, forced logout |
| Notifications | `notification.new` | In-app notification center |
| Dashboard | `dashboard.refresh` | KPI widget reload trigger |

---

## 6. Sequence-Based Event Ordering

Every emitted event carries a monotonically increasing `sequenceId` scoped per company (stored in `company_event_sequence` table or Redis INCR).

### Client Responsibilities

- Persist `lastSequenceId` in memory and local secure storage.
- On each received event, update `lastSequenceId` if `event.sequenceId > lastSequenceId`.
- Send periodic `ack` events for observability (optional but recommended).

### Gap Detection

If a client receives event `sequenceId = 105` but `lastSequenceId = 102`, it detects a gap (103, 104 missing). The client:

1. Calls `GET /api/v1/sync/events?since=102&limit=100`.
2. Receives buffered missed events from server-side event log.
3. Applies events in `sequenceId` order before processing event 105.

The server retains the last **10,000 events per company** (configurable) for replay. Older gaps require a full entity resync via REST.

---

## 7. Room Subscription Model

On WebSocket connect, clients automatically join:

| Room | Purpose |
|------|---------|
| `company:{company_id}` | All business data events for the active company |
| `user:{user_id}` | Personal notifications, session events |

Optional granular subscriptions (Phase 2):

| Room | Purpose |
|------|---------|
| `branch:{branch_id}` | Branch-scoped inventory and sales |
| `product:{product_id}` | Single-product stock watch (mobile shelf check) |

Users with multi-company access must reconnect or emit a `company.switch` event when changing active company to receive the correct room events.

---

## 8. Client Integration Patterns

### Desktop (Electron + React)

- **TanStack Query** maintains server state with `staleTime` tuned per entity (products: 5 min; inventory: 30 sec).
- WebSocket handler patches query cache on matching events.
- Optimistic updates for POS flows with server reconciliation (see [CONFLICT_RESOLUTION.md](./CONFLICT_RESOLUTION.md)).

### Mobile (Flutter)

- **Riverpod** providers listen to a `WebSocketService` stream.
- `AsyncNotifier` invalidates or patches state on domain events.
- Background connections use platform-appropriate keepalive (Android foreground service for active POS sessions).

### Common Rules

- Never apply WebSocket events for a different `companyId` than the active session.
- Ignore events with `sequenceId <= lastSequenceId` (duplicate delivery).
- Debounce rapid `dashboard.refresh` events (max one reload per 2 seconds).

---

## 9. Reconnection and Recovery

| Scenario | Behavior |
|----------|----------|
| Brief disconnect (< 30 sec) | Auto-reconnect with exponential backoff; replay from `lastSequenceId` |
| Extended disconnect (> 5 min) | Full cache invalidation + REST bootstrap for critical entities |
| Server restart | Clients reconnect; Redis pub/sub resumes; event log serves replay |
| Token expiry during connection | Server emits `session.terminated`; client refreshes token and reconnects |
| Company switch | Disconnect, obtain new JWT, reconnect to new company rooms |

### Reconnection Backoff

| Attempt | Delay |
|---------|-------|
| 1 | 1 second |
| 2 | 2 seconds |
| 3 | 4 seconds |
| 4 | 8 seconds |
| 5+ | 30 seconds (cap) |

---

## 10. Performance and SLAs

| Metric | Target |
|--------|--------|
| Event propagation (p50) | < 100ms |
| Event propagation (p95) | < 500ms |
| Event propagation (p99) | < 1000ms |
| Max concurrent WS connections (single node) | 5,000 |
| Max events per second per company | 100 |
| Event payload size (p95) | < 4 KB |

Under load, non-critical events (e.g., `dashboard.refresh`) may be coalesced server-side within a 500ms window.

---

## 11. Security Considerations

- WebSocket connections require valid JWT access token at handshake.
- Tokens are validated on connect and re-validated every 5 minutes.
- Events contain only fields the recipient's RBAC permissions allow (field-level filtering for sensitive data).
- Rate limiting: max 10 connection attempts per minute per device.
- Device must be registered and not blocked (see [../07-security/DEVICE_MANAGEMENT.md](../07-security/DEVICE_MANAGEMENT.md)).

---

## 12. Monitoring and Observability

| Metric | Alert Threshold |
|--------|-----------------|
| `ws_connections_active` | Informational |
| `ws_event_publish_latency_ms` | p95 > 500ms |
| `ws_event_delivery_failures` | > 10/min |
| `sync_replay_requests` | Spike > 3x baseline |
| `ws_reconnect_rate` | > 20% of connections in 5 min |

Dashboards defined in [../10-devops/MONITORING.md](../10-devops/MONITORING.md).

---

## 13. Testing Requirements

- [ ] Sale on Device A updates stock on Device B within 500ms
- [ ] Product edit propagates to all connected company clients
- [ ] User in Company A never receives Company B events
- [ ] Gap replay returns correct ordered events after simulated disconnect
- [ ] Forced logout event terminates all user sessions across devices
- [ ] 100 concurrent connections per company without message loss
- [ ] Reconnection after 60-second outage recovers full state

---

## 14. Related Documents

- [WEBSOCKET_ARCHITECTURE.md](./WEBSOCKET_ARCHITECTURE.md)
- [CONFLICT_RESOLUTION.md](./CONFLICT_RESOLUTION.md)
- [OFFLINE_STRATEGY.md](./OFFLINE_STRATEGY.md)
- [../06-api/WEBSOCKET_EVENTS.md](../06-api/WEBSOCKET_EVENTS.md)
- [../05-database/MULTI_TENANCY_DESIGN.md](../05-database/MULTI_TENANCY_DESIGN.md)
- [../11-platforms/MULTI_DEVICE_STRATEGY.md](../11-platforms/MULTI_DEVICE_STRATEGY.md)
