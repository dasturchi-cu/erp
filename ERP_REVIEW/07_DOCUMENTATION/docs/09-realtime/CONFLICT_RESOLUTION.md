# Conflict Resolution

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

The ERP adopts a **server-authoritative** conflict resolution model. The PostgreSQL database and API layer are the sole arbiters of business truth. Clients may apply **optimistic UI updates** for responsiveness, but all mutations are validated server-side. When client assumptions conflict with server state, the server wins and clients reconcile automatically.

This approach is appropriate for a financial ERP where inventory quantities, sale totals, debt balances, and FIFO allocations must never diverge across devices.

---

## 2. Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Server authoritative** | Final state always determined by server after validation |
| **Optimistic UI** | Clients update UI immediately; rollback on server rejection |
| **Last-write-wins (server)** | Server timestamp + transaction ordering resolves concurrent edits |
| **Pessimistic for critical paths** | Stock allocation and payment processing use row-level locking |
| **No client-side merging** | Clients never merge conflicting business data locally |
| **Transparent reconciliation** | Users see clear feedback when their action was adjusted or rejected |

---

## 3. Conflict Categories

### Category A: Low-Risk Edits (Optimistic)

Non-financial metadata changes where concurrent edits are rare and impact is low.

| Entity | Example | Resolution |
|--------|---------|------------|
| Product description | Two users edit notes simultaneously | Server accepts last committed write; other client receives `product.updated` event |
| Customer phone number | Concurrent contact update | Last-write-wins; WebSocket notifies both clients |
| Product category | Reclassification | Last-write-wins |

**Client behavior**: Apply optimistic update → on API success, confirm; on `product.updated` event from another user, replace local state.

### Category B: Financial and Inventory (Pessimistic)

Operations affecting money, stock, or audit trail integrity.

| Entity | Example | Resolution |
|--------|---------|------------|
| Stock quantity | Two POS terminals sell last unit | Server uses `SELECT ... FOR UPDATE`; second sale rejected with `INSUFFICIENT_STOCK` |
| Sale completion | Duplicate submit | Idempotency key prevents double sale |
| Payment recording | Concurrent partial payments | Serialized per customer debt record |
| Exchange rate | Rate change during active sale | Sale locks rate at initiation timestamp |
| FIFO allocation | Batch depletion race | Database transaction with row locks |

**Client behavior**: Show loading state during API call; no optimistic stock deduction. On rejection, display server error with current available quantity.

### Category C: Structural Conflicts (Validation)

Edits that violate business rules regardless of timing.

| Scenario | Resolution |
|----------|------------|
| Delete product with active stock | Server rejects with `PRODUCT_HAS_STOCK` |
| Void sale after shift close | Server rejects with `SHIFT_CLOSED` |
| Edit price below cost (if rule enabled) | Server rejects with `PRICE_BELOW_COST` |
| Disable module with dependent data | Server rejects with dependency list |

---

## 4. Optimistic UI Pattern

Used primarily on desktop POS and mobile sales flows for perceived speed.

### Flow

```
1. User taps "Complete Sale"
2. Client immediately:
   a. Shows success animation (tentative)
   b. Adds sale to local history list (pending)
   c. Deducts stock from local cache (tentative)
3. Client sends POST /api/v1/sales with Idempotency-Key header
4. Server validates, commits, emits sale.completed + inventory.stock_changed
5a. SUCCESS: Client confirms optimistic state (mark sale as confirmed)
5b. FAILURE: Client rolls back optimistic state, shows error dialog
```

### Rollback Rules

| Optimistic Action | Rollback Trigger | Rollback Behavior |
|-------------------|------------------|-------------------|
| Stock deduction | `INSUFFICIENT_STOCK` | Restore previous quantity; highlight product |
| Sale completion | Any 4xx/5xx | Remove tentative sale from list |
| Payment recording | `AMOUNT_EXCEEDS_DEBT` | Restore previous debt balance |
| Product edit | 409 Conflict | Reload product from server |

### Visual Indicators

- **Pending**: Subtle pulse or "Syncing..." badge on optimistic items.
- **Confirmed**: Normal display after server acknowledgment.
- **Failed**: Red toast with actionable message; optimistic item removed.

---

## 5. Server-Side Concurrency Controls

### Database Row Locking

Critical inventory operations use PostgreSQL row-level locks within transactions:

| Operation | Lock Strategy |
|-----------|---------------|
| Stock deduction (sale) | `FOR UPDATE` on `inventory_batches` rows (FIFO order) |
| Payment against debt | `FOR UPDATE` on `customer_debts` row |
| Exchange rate application | Read rate at transaction start; immutable for duration |
| Batch creation (receiving) | Advisory lock per `product_id + company_id` |

### Idempotency Keys

All financial write endpoints accept `Idempotency-Key` header (UUID v4).

| Behavior | Detail |
|----------|--------|
| First request | Processed normally; response cached for 24 hours |
| Duplicate request (same key) | Return cached response without re-processing |
| Key scope | Per `company_id` + `user_id` + endpoint |

Prevents duplicate sales from double-tap, network retry, or WebSocket-triggered re-submission.

### Version Fields (Optimistic Locking)

Mutable entities include an `updatedAt` timestamp or `version` integer.

| Scenario | Server Response |
|----------|-----------------|
| Client sends `version: 5`; server has `version: 6` | `409 Conflict` with current entity body |
| Client omits version | Server accepts (backward compatible) |

Clients receiving 409 should display: "This record was modified by another user" with options to **Reload** or **Overwrite** (if permission allows).

---

## 6. Real-Time Reconciliation

When Device A mutates data while Device B holds stale local state:

```
Timeline:
  T0: Device B displays Product X stock = 50
  T1: Device A sells 10 units of Product X (stock → 40)
  T2: Server emits inventory.stock_changed { productId, quantity: 40 }
  T3: Device B receives event, updates cache: stock = 40
  T4: Device B user attempts to sell 45 units
  T5: Server rejects: INSUFFICIENT_STOCK (available: 40)
  T6: Device B shows error, UI already shows 40 from T3
```

Device B's UI is reconciled at T3 via WebSocket before the user acts at T4. If the WebSocket event was missed (gap), the API rejection at T5 serves as the safety net, and the client triggers a stock resync.

### Reconciliation Priority

1. **WebSocket event** (fastest, preferred)
2. **API response** (authoritative for own mutations)
3. **REST resync** (fallback after gap or error)
4. **Full page reload** (last resort for unrecoverable state)

---

## 7. Multi-User Editing Scenarios

### Scenario: Two Cashiers, Same Product

| Step | Device A | Device B | Server Stock |
|------|----------|----------|--------------|
| 1 | Displays stock: 5 | Displays stock: 5 | 5 |
| 2 | Sells 3 | — | 2 |
| 3 | Receives confirmation | Receives WS event | 2 |
| 4 | Shows stock: 2 | Shows stock: 2 | 2 |
| 5 | — | Attempts sell 4 | Rejects: available 2 |

### Scenario: Manager Edits Price During Active Sale

| Step | Action | Resolution |
|------|--------|------------|
| 1 | Cashier opens sale (locks prices via cart snapshot) | Cart stores `priceAtAdd` per line item |
| 2 | Manager changes product price | Server accepts price change |
| 3 | WS event updates product catalog | Cashier's cart unaffected (snapshot) |
| 4 | Cashier completes sale | Server uses cart snapshot prices, not current catalog price |

### Scenario: Admin Disables Module During Use

| Step | Action | Resolution |
|------|--------|------------|
| 1 | User on Sales screen | — |
| 2 | Admin disables Sales module | Server emits `module.disabled` |
| 3 | Client receives event | Navigate to "Module unavailable" screen; block new sales |
| 4 | In-progress sale | Allow completion (started before disable); block new ones |

---

## 8. Conflict Resolution by Module

| Module | Strategy | Notes |
|--------|----------|-------|
| Products | Optimistic UI + last-write-wins | Version field on update |
| Inventory | Pessimistic (row locks) | Never optimistic stock changes |
| Sales | Pessimistic + idempotency | Cart snapshot for pricing |
| Payments | Pessimistic (debt row lock) | No optimistic debt updates |
| Customers | Optimistic + last-write-wins | Debt balance is server-computed |
| Currency | Server-only writes | Rate changes broadcast via WS |
| Admin/Users | Pessimistic | Role changes trigger session revalidation |

---

## 9. Error Response Contract

Conflict-related API errors follow standard format (see [../06-api/ERROR_HANDLING.md](../06-api/ERROR_HANDLING.md)):

| HTTP Status | Code | Client Action |
|-------------|------|---------------|
| 409 | `VERSION_CONFLICT` | Show reload/overwrite dialog |
| 409 | `INSUFFICIENT_STOCK` | Show available quantity; refresh stock |
| 409 | `DUPLICATE_OPERATION` | Silently confirm (idempotency hit) |
| 422 | `BUSINESS_RULE_VIOLATION` | Show rule-specific message |
| 423 | `RESOURCE_LOCKED` | Retry after 2 seconds (max 3 attempts) |

---

## 10. Audit Trail

Every conflict resolution outcome is logged:

| Field | Description |
|-------|-------------|
| `conflict_type` | `version_mismatch`, `insufficient_stock`, `idempotency_duplicate`, etc. |
| `entity_type` | Affected domain entity |
| `entity_id` | UUID of affected record |
| `client_state` | Snapshot of what client attempted (JSON) |
| `server_state` | Authoritative state at resolution time |
| `resolution` | `server_wins`, `rejected`, `idempotency_returned` |
| `actor_user_id` | User who initiated the conflicting action |
| `actor_device_id` | Device that initiated the action |

---

## 11. Phase 2: Offline Conflict Considerations

When offline mode is introduced (see [OFFLINE_STRATEGY.md](./OFFLINE_STRATEGY.md)), additional strategies will be required:

| Approach | Applicability |
|----------|---------------|
| Server-wins on reconnect | Default for all queued offline mutations |
| Operational transform | Not planned (complexity vs. benefit) |
| Conflict queue for admin review | High-value transactions (payments > threshold) |
| Timestamp-based ordering | Secondary sort; server transaction order is primary |

Offline conflict resolution will be specified in a Phase 2 addendum to this document.

---

## 12. Testing Requirements

- [ ] Concurrent sale of last stock unit: exactly one succeeds
- [ ] Duplicate sale submit with same idempotency key: single sale created
- [ ] Optimistic UI rollback on server rejection
- [ ] Version conflict returns 409 with current entity
- [ ] WebSocket reconciliation updates stale client before user action
- [ ] Price change during active sale does not alter cart prices
- [ ] Module disable blocks new operations but allows in-progress completion

---

## 13. Related Documents

- [REALTIME_SYNC.md](./REALTIME_SYNC.md)
- [OFFLINE_STRATEGY.md](./OFFLINE_STRATEGY.md)
- [../06-api/ERROR_HANDLING.md](../06-api/ERROR_HANDLING.md)
- [../02-business/BUSINESS_RULES.md](../02-business/BUSINESS_RULES.md)
- [../05-database/MULTI_TENANCY_DESIGN.md](../05-database/MULTI_TENANCY_DESIGN.md)
