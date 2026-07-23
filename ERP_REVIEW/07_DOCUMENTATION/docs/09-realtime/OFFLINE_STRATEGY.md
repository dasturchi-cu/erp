# Offline Strategy

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

The ERP platform launches with an **online-only architecture** (Phase 1). All clients require active network connectivity to the shared PostgreSQL database via the API. Offline capabilities are planned for Phase 2 to support field sales, warehouse areas with poor connectivity, and business continuity during internet outages.

This document defines the Phase 1 constraints, Phase 2 roadmap, and design principles that inform current architecture decisions.

---

## 2. Phase 1: Online-Only (Current)

### Policy

| Aspect | Phase 1 Behavior |
|--------|------------------|
| Network requirement | Mandatory for all operations |
| Local data storage | Tokens and UI preferences only |
| Business data cache | Ephemeral (in-memory / short-lived query cache) |
| Offline sales | Not supported |
| Offline product lookup | Not supported (cached catalog expires in 5 minutes) |
| Degraded mode | Read-only cache if API unreachable for < 30 seconds |

### Rationale

| Factor | Decision Driver |
|--------|-----------------|
| Time to market | Online-only eliminates sync complexity for MVP |
| Data integrity | Financial ERP cannot risk split-brain inventory |
| Infrastructure | Target businesses have reliable office/shop internet |
| Team capacity | Real-time WebSocket layer is Phase 1 priority |
| Architecture clarity | Single source of truth simplifies debugging and support |

### Phase 1 Client Behavior on Network Loss

```
Network lost
  │
  ├─ < 5 seconds: Show "Reconnecting..." banner; queue no writes
  │
  ├─ 5–30 seconds: Show "Connection unstable" warning; disable write actions
  │
  ├─ 30–120 seconds: Show "No connection" overlay; read-only cached data visible
  │
  └─ > 120 seconds: Show "Unable to connect" full-screen; retry button
```

**Write operations** (sales, payments, stock adjustments) are disabled immediately on network loss. **Read operations** may display stale cached data with a prominent "Data may be outdated" indicator.

### What We Build Now to Enable Phase 2

Even in Phase 1, the following foundations are laid:

| Foundation | Phase 1 Implementation | Phase 2 Benefit |
|------------|------------------------|-----------------|
| Idempotency keys | Required on all financial writes | Safe replay of queued offline mutations |
| Sequence IDs | Per-company event ordering | Detect gaps on reconnect |
| Event log | Server retains last 10K events | Replay missed events efficiently |
| Version fields | `updatedAt` on mutable entities | Optimistic locking for offline edits |
| Standard event envelope | Consistent WebSocket payload | Local event store mirrors server format |
| Device registration | Unique device identity | Attribute offline mutations to device |

---

## 3. Phase 2: Offline Capabilities (Planned)

**Target**: Q3–Q4 2027 (after core platform stabilization and mobile client maturity)

### Scope

| Capability | Priority | Platform |
|------------|----------|----------|
| Offline product catalog browse | High | Mobile, Desktop |
| Offline customer lookup | High | Mobile |
| Offline sale queue (sync on reconnect) | High | Mobile (field sales) |
| Offline stock view (last known) | Medium | Mobile |
| Offline payment recording | Medium | Mobile |
| Full offline POS | Low | Desktop (requires local DB) |
| Offline report generation | Low | Desktop |

### Architecture Options Evaluated

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **A: Mutation queue only** | Simple; server remains authoritative | Limited offline reads | **Phase 2a (recommended start)** |
| **B: Local SQLite mirror** | Full offline reads; fast search | Sync complexity; storage size | Phase 2b (desktop) |
| **C: CRDT / operational transform** | Elegant multi-device merge | Overkill for ERP; hard to audit | Rejected |
| **D: Per-device PostgreSQL** | Full offline | Massive complexity; security risk | Rejected |

### Phase 2a: Mutation Queue (Mobile-First)

```
┌─────────────────────────────────────────────┐
│                  Mobile Client               │
│  ┌─────────────┐    ┌─────────────────────┐ │
│  │ Local Queue │    │ Cached Catalog      │ │
│  │ (SQLite)    │    │ (SQLite, TTL 24h)   │ │
│  └──────┬──────┘    └─────────────────────┘ │
│         │                                    │
│         │  On reconnect:                     │
│         │  1. Flush queue (FIFO, idempotent) │
│         │  2. Pull missed events (since ID)  │
│         │  3. Reconcile conflicts            │
└─────────┼────────────────────────────────────┘
          │
          ▼
    ┌───────────┐
    │ API Server│
    └───────────┘
```

**Queued operations**:

- Create sale (with cart snapshot)
- Record payment
- Create customer (basic fields)

**Not queued offline**:

- Stock adjustments (require live validation)
- Admin operations
- Report generation
- Module configuration

### Phase 2b: Local SQLite Mirror (Desktop)

For desktop POS in environments with frequent outages:

| Component | Detail |
|-----------|--------|
| Local DB | SQLite with subset schema (products, customers, inventory snapshot) |
| Sync engine | Pull on connect; push queued mutations |
| Catalog refresh | Full sync every 4 hours or on `product.*` events |
| Storage limit | 500 MB local; prune old sync logs |
| Encryption | SQLCipher for local database at rest |

---

## 4. Offline Data Classification

| Data Class | Offline Access (Phase 2) | Sync Direction | Conflict Strategy |
|------------|---------------------------|----------------|-------------------|
| Product catalog | Read (cached) | Server → Client | Server wins |
| Customer list | Read (cached) | Server → Client | Server wins |
| Stock levels | Read (stale, timestamped) | Server → Client | Server wins |
| Sales | Write (queued) | Client → Server | Server validates on flush |
| Payments | Write (queued) | Client → Server | Server validates on flush |
| Product edits | Not offline | — | — |
| Inventory adjustments | Not offline | — | — |
| Admin/RBAC | Not offline | — | — |
| Exchange rates | Read (cached, locked at sale time) | Server → Client | Server wins |

---

## 5. Sync on Reconnect Protocol (Phase 2)

### Step 1: Connectivity Restored

Client detects network via connectivity listener (Flutter: `connectivity_plus`; Electron: `navigator.onLine` + API health ping).

### Step 2: Authentication Check

Validate access token; refresh if expired. If refresh fails, prompt re-login before syncing.

### Step 3: Pull Missed Events

```
GET /api/v1/sync/events?since={lastSequenceId}&limit=500
```

Apply events to local cache in order.

### Step 4: Push Queued Mutations

```
For each queued mutation (FIFO order):
  POST {original endpoint}
  Headers: Idempotency-Key: {queued idempotency key}
  
  On 2xx: Mark queue item as synced; remove from queue
  On 409: Apply server-wins reconciliation (see CONFLICT_RESOLUTION.md)
  On 4xx (non-retryable): Mark as failed; alert user for manual review
  On 5xx/timeout: Retry with exponential backoff (max 5 attempts)
```

### Step 5: Full Reconciliation

- Refresh inventory snapshot from server.
- Invalidate stale cached entities.
- Emit local `sync.completed` event for UI update.

---

## 6. User Experience Guidelines

### Offline Indicators

| State | UI Element |
|-------|------------|
| Online | No indicator (default) |
| Intermittent | Yellow banner: "Connection unstable" |
| Offline | Red banner: "Offline — changes will sync when connected" |
| Syncing | Blue progress bar with item count |
| Sync conflict | Orange dialog with details and actions |
| Sync complete | Green toast: "All changes synced" (auto-dismiss 3s) |

### Queued Operation Visibility

Users must always see:

- Number of pending offline operations
- Timestamp of each queued item
- Status: pending, syncing, synced, failed
- Ability to cancel a pending operation (before sync attempt)

---

## 7. Security Considerations (Phase 2)

| Concern | Mitigation |
|---------|------------|
| Local data exposure | Encrypt SQLite with device-derived key |
| Queued mutation tampering | Sign queue items with device key; server verifies |
| Stale token usage | Force re-auth before flushing queue if token expired |
| Device theft | Remote device block invalidates queued items on next sync attempt |
| Offline duration limit | Queue expires after 72 hours; user must sync or data is flagged |

---

## 8. Infrastructure Implications

Phase 1 infrastructure assumes always-online clients. Phase 2 adds:

| Component | Change |
|-----------|--------|
| API | Batch sync endpoint for efficient queue flush |
| Event log | Increase retention to 50K events per company |
| Database | Idempotency key table with 7-day retention |
| Monitoring | Track `offline_queue_size`, `sync_conflicts`, `sync_duration` metrics |
| Storage | Client-side SQLite (no server change for Phase 2a) |

---

## 9. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-17 | Phase 1 online-only | Faster delivery; data integrity |
| 2026-06-17 | Phase 2a before 2b | Mobile field sales is higher priority than desktop offline |
| 2026-06-17 | Server-wins for all conflicts | Financial audit requirements |
| 2026-06-17 | No offline stock writes | Prevent overselling during outage |
| 2026-06-17 | Idempotency keys in Phase 1 | Forward-compatible with offline queue |

---

## 10. Success Criteria

### Phase 1

- [ ] All write operations fail gracefully with clear message when offline
- [ ] WebSocket reconnection recovers state within 30 seconds
- [ ] No data corruption from network interruptions
- [ ] Idempotency keys prevent duplicate financial transactions

### Phase 2

- [ ] Mobile user can complete sale offline and sync within 60 seconds of reconnect
- [ ] Zero duplicate sales from offline queue replay
- [ ] Offline catalog browse works with < 24-hour-old data
- [ ] Failed sync items are visible and actionable by user
- [ ] Local encrypted storage passes security review

---

## 11. Related Documents

- [REALTIME_SYNC.md](./REALTIME_SYNC.md)
- [CONFLICT_RESOLUTION.md](./CONFLICT_RESOLUTION.md)
- [WEBSOCKET_ARCHITECTURE.md](./WEBSOCKET_ARCHITECTURE.md)
- [../03-product/PRODUCT_ROADMAP.md](../03-product/PRODUCT_ROADMAP.md)
- [../11-platforms/MULTI_DEVICE_STRATEGY.md](../11-platforms/MULTI_DEVICE_STRATEGY.md)
