# Business Rules

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Multi-Company Rules

| ID | Rule |
|----|------|
| BR-MC-01 | Every business entity MUST belong to exactly one company |
| BR-MC-02 | Users may belong to multiple companies with different roles |
| BR-MC-03 | API requests MUST include company context from JWT; no client-supplied company_id override |
| BR-MC-04 | Cross-company data queries are forbidden at all layers |
| BR-MC-05 | Company deletion is soft-delete with 90-day retention before purge |
| BR-MC-06 | Each company has independent exchange rate settings |

---

## 2. Product Rules

| ID | Rule |
|----|------|
| BR-PR-01 | SKU is mandatory and unique within company |
| BR-PR-02 | Barcode is optional; if set, unique within company |
| BR-PR-03 | Product must have category assigned |
| BR-PR-04 | All four prices must be >= 0: purchase UZS, purchase USD, sale UZS, sale USD |
| BR-PR-05 | Product deletion is soft-delete; blocked if active stock exists |
| BR-PR-06 | Display totals: sum(qty × price) for all in-stock products per currency |

---

## 3. FIFO Rules

| ID | Rule |
|----|------|
| BR-FIFO-01 | FIFO is mandatory for all outbound inventory movements |
| BR-FIFO-02 | Batches ordered by `received_at ASC` (oldest first) |
| BR-FIFO-03 | Sale consumes batches until quantity fulfilled; may span multiple batches |
| BR-FIFO-04 | Each sale item MUST have FIFO allocations recorded |
| BR-FIFO-05 | Cost of goods sold (COGS) calculated from batch unit costs |
| BR-FIFO-06 | Returns restore stock to a new batch (not original batch) with return cost |
| BR-FIFO-07 | Insufficient stock blocks sale unless user has `inventory.oversell` permission |
| BR-FIFO-08 | Batch `remaining_qty` never goes below 0 |

**Example**:
```
Batch A: 100 units @ 10,000 UZS (received Jan 1)
Batch B: 100 units @ 12,000 UZS (received Jan 15)
Sale: 150 units
→ Allocate 100 from Batch A + 50 from Batch B
→ COGS = (100 × 10,000) + (50 × 12,000) = 1,600,000 UZS
```

---

## 4. Currency Rules (UZS/USD)

| ID | Rule |
|----|------|
| BR-CUR-01 | Each transaction stores `original_currency` and `exchange_rate_used` |
| BR-CUR-02 | Historical transactions NEVER recalculated when rate changes |
| BR-CUR-03 | Exchange rate is company-scoped |
| BR-CUR-04 | Sale can be conducted in UZS or USD (selected at transaction time) |
| BR-CUR-05 | Debt tracked separately in UZS and USD balances |
| BR-CUR-06 | Payment applied to currency-specific debt balance |
| BR-CUR-07 | Dashboard and reports show UZS and USD columns separately |
| BR-CUR-08 | Profit calculation uses transaction-time rates and FIFO costs |

---

## 5. Sales Rules

| ID | Rule |
|----|------|
| BR-SL-01 | Sale must have at least one line item |
| BR-SL-02 | Sale triggers FIFO allocation automatically |
| BR-SL-03 | Sale creates debt if payment not received in full |
| BR-SL-04 | Sale cancellation reverses inventory (new return batch) and debt |
| BR-SL-05 | Completed sales are immutable; changes via return/credit note only |
| BR-SL-06 | Cashier can only void own sales within 24 hours (configurable) |
| BR-SL-07 | Manager approval required for discount > 10% (configurable) |

---

## 6. Customer & Debt Rules

| ID | Rule |
|----|------|
| BR-DB-01 | Customer phone is mandatory |
| BR-DB-02 | Debt created automatically on credit sale |
| BR-DB-03 | Partial payment reduces debt balance; history preserved |
| BR-DB-04 | Full payment zeroes debt for that currency |
| BR-DB-05 | Customer card shows: purchases, payments, current debt |
| BR-DB-06 | `last_payment_date` updated on every payment |
| BR-DB-07 | Debt aging calculated from oldest unpaid transaction |

---

## 7. Authorization Rules

| ID | Rule |
|----|------|
| BR-AUTH-01 | Blocked user cannot authenticate |
| BR-AUTH-02 | Blocked device cannot authenticate even with valid credentials |
| BR-AUTH-03 | Admin force-logout revokes session immediately |
| BR-AUTH-04 | Disabled module returns 403 for all its endpoints |
| BR-AUTH-05 | Role permissions are additive; deny never overrides allow at same level |
| BR-AUTH-06 | System roles (Admin) cannot be deleted |

---

## 8. Audit Rules

| ID | Rule |
|----|------|
| BR-AUD-01 | All Create, Update, Delete operations logged |
| BR-AUD-02 | Business actions logged: Sale, Payment, Return, Login, Logout |
| BR-AUD-03 | Audit records are append-only (no update/delete) |
| BR-AUD-04 | Audit log stores old and new values as JSON |
| BR-AUD-05 | Audit retention: 7 years minimum |

---

## 9. Real-Time Rules

| ID | Rule |
|----|------|
| BR-RT-01 | All state-changing operations emit domain event within same transaction |
| BR-RT-02 | WebSocket broadcast scoped to company_id |
| BR-RT-03 | Clients must reconcile on reconnect (fetch delta since last event ID) |
| BR-RT-04 | Optimistic UI updates allowed; server is authoritative |

---

## 10. Backup Rules

| ID | Rule |
|----|------|
| BR-BK-01 | Daily automated PostgreSQL dump at 02:00 Asia/Tashkent |
| BR-BK-02 | Backup compressed as ZIP |
| BR-BK-03 | Stored locally (7 days) and cloud (30 days) |
| BR-BK-04 | Weekly restore verification on staging |

---

## 11. Related Documents

- [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)
- [../08-modules/FIFO.md](../08-modules/FIFO.md)
- [../08-modules/CURRENCY_UZS_USD.md](../08-modules/CURRENCY_UZS_USD.md)
- [../08-modules/DEBT_MANAGEMENT.md](../08-modules/DEBT_MANAGEMENT.md)
