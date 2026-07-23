# Use Cases

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## UC-001: User Login (Multi-Device)

| Field | Value |
|-------|-------|
| Actor | Any authenticated role |
| Precondition | User account is active, device not blocked |
| Trigger | User submits credentials on any platform |

**Main Flow**:
1. User enters email and password
2. System validates credentials
3. System registers/updates device record (platform, OS, IP)
4. System creates session with access + refresh tokens
5. System returns user profile, company list, enabled modules, permissions
6. System establishes WebSocket connection
7. System logs audit event: `LOGIN`

**Alternate Flows**:
- 2a. Invalid credentials → increment failure count; lock after 5 attempts
- 2b. User blocked → "Account suspended" message
- 2c. Device blocked → "Device not authorized" message

---

## UC-002: Admin Block User

| Field | Value |
|-------|-------|
| Actor | Admin |
| Precondition | Admin has `admin.users.block` permission |

**Main Flow**:
1. Admin navigates to Users management
2. Admin selects user and clicks "Block"
3. System sets user status to `BLOCKED`
4. System revokes all active sessions for user
5. System broadcasts `user.blocked` via WebSocket
6. All user devices show "Session terminated" and redirect to login
7. System logs audit event

---

## UC-003: Admin Block Device

| Field | Value |
|-------|-------|
| Actor | Admin |

**Main Flow**:
1. Admin views Active Devices list
2. Admin selects device and clicks "Block"
3. System sets device status to `BLOCKED`
4. System revokes sessions for that device only
5. Device receives force-logout via WebSocket
6. Other devices for same user remain active

---

## UC-004: Admin Force Logout Session

| Field | Value |
|-------|-------|
| Actor | Admin |

**Main Flow**:
1. Admin views Active Sessions
2. Admin selects session and clicks "Force Logout"
3. System revokes session token
4. WebSocket sends `session.terminated` to that client
5. Audit log recorded

---

## UC-005: Admin Enable/Disable Module

| Field | Value |
|-------|-------|
| Actor | Admin |

**Main Flow**:
1. Admin opens Module Management
2. Admin toggles module (e.g., Sales) to disabled
3. System updates module registry
4. API returns 403 for all Sales endpoints
5. WebSocket broadcasts `module.disabled` to all company users
6. All clients remove Sales from navigation immediately

---

## UC-006: Create Product

| Field | Value |
|-------|-------|
| Actor | Manager, Warehouse Keeper |
| Precondition | Products module enabled |

**Main Flow**:
1. User enters SKU, barcode, name, category
2. User sets purchase/sale prices in UZS and USD
3. System validates uniqueness of SKU/barcode
4. System creates product record
5. WebSocket broadcasts `product.created`
6. Product appears on all connected devices
7. Audit log recorded

---

## UC-007: Receive Inventory (Create Batch)

| Field | Value |
|-------|-------|
| Actor | Warehouse Keeper |

**Main Flow**:
1. User selects product
2. User enters quantity, unit cost (UZS/USD), receipt date
3. System creates inventory batch with `remaining_qty = quantity`
4. System records inventory movement type `RECEIPT`
5. Product stock quantity updated
6. WebSocket broadcasts `inventory.batch_created`
7. Dashboard inventory value recalculated

---

## UC-008: Process Sale (FIFO)

| Field | Value |
|-------|-------|
| Actor | Cashier |
| Precondition | Sales module enabled, stock available |

**Main Flow**:
1. Cashier selects/adds customer (optional for walk-in)
2. Cashier scans/searches products, adds to cart
3. Cashier selects sale currency (UZS or USD)
4. System captures current exchange rate
5. System validates stock availability
6. System allocates FIFO batches (oldest first)
7. System creates sale, sale items, FIFO allocations
8. System decrements batch `remaining_qty`
9. If credit sale: system creates/updates customer debt
10. WebSocket broadcasts `sale.completed`
11. All devices update stock, dashboard, customer debt
12. Audit log recorded

**Alternate Flows**:
- 5a. Insufficient stock → error with available quantity
- 9a. Full payment received → no debt created

---

## UC-009: Record Debt Payment

| Field | Value |
|-------|-------|
| Actor | Cashier, Manager |

**Main Flow**:
1. User opens customer card
2. User views current debt (UZS and USD separately)
3. User enters payment amount and currency
4. System captures exchange rate
5. System records payment (FULL or PARTIAL)
6. System updates customer debt balance
7. System updates `last_payment_date`
8. WebSocket broadcasts `payment.received`
9. Audit log recorded

---

## UC-010: Update Exchange Rate

| Field | Value |
|-------|-------|
| Actor | Manager, Admin |

**Main Flow**:
1. User enters new UZS/USD rate
2. System creates new rate record with `effective_from = now`
3. Previous rate remains in history (unchanged)
4. WebSocket broadcasts `currency.rate_updated`
5. Dashboard refreshes with new rate for display calculations only
6. Historical transactions unaffected

---

## UC-011: View Dashboard

| Field | Value |
|-------|-------|
| Actor | Manager, Admin |

**Main Flow**:
1. User opens Dashboard
2. System aggregates: daily/weekly/monthly/yearly sales
3. System calculates profit (sale price - FIFO cost)
4. System shows total debt, inventory value
5. System shows top products
6. All metrics shown in UZS and USD columns
7. Dashboard auto-refreshes on WebSocket events

---

## UC-012: Generate Report Export

| Field | Value |
|-------|-------|
| Actor | Manager, Admin |

**Main Flow**:
1. User selects report type and date range
2. User selects format (PDF, Excel, CSV)
3. System queues report generation job
4. System generates file
5. User downloads from notifications or reports page

---

## UC-013: Admin Monitor System Health

| Field | Value |
|-------|-------|
| Actor | Admin |

**Main Flow**:
1. Admin opens System Monitoring
2. System displays: API health, DB status, Redis status, disk usage
3. System shows active sessions count, active devices count
4. System shows error rate, response times
5. Auto-refreshes every 30 seconds

---

## UC-014: Switch Company Context

| Field | Value |
|-------|-------|
| Actor | User with multi-company access |

**Main Flow**:
1. User selects different company from company switcher
2. System issues new JWT with updated `company_id`
3. WebSocket reconnects with new company channel
4. All data views refresh for new company context

---

## Related Documents

- [USER_STORIES.md](./USER_STORIES.md)
- [WORKFLOWS.md](./WORKFLOWS.md)
- [../04-ui-ux/USER_FLOWS.md](../04-ui-ux/USER_FLOWS.md)
