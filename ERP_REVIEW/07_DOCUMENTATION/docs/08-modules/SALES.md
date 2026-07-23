# Sales Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Sales module provides Point of Sale (POS) functionality and complete sale transaction management. It orchestrates product lookup, dual-currency pricing, FIFO inventory allocation, customer association, payment processing (cash and credit), and return handling. Sales is the primary revenue-generating workflow and the integration hub for Products, Inventory, FIFO, Currency, Customers, and Debt modules.

---

## 2. Sale Lifecycle

```
┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│  DRAFT  │───►│ COMPLETED │    │ CANCELLED │    │ RETURNED  │
│  (POS)  │    │           │───►│  (void)   │    │ (partial/ │
└─────────┘    └───────────┘    └───────────┘    │  full)    │
                     │                            └───────────┘
                     └──────────────────────────────────►
```

| Status | Description |
|--------|-------------|
| `DRAFT` | POS cart in progress; not yet committed |
| `COMPLETED` | Sale finalized; inventory deducted; payment/debt recorded |
| `CANCELLED` | Voided within allowed window; inventory and debt reversed |
| `RETURNED` | One or more items returned via return transaction |

Completed sales are immutable. Changes only via return/credit note.

---

## 3. POS Flow

### 3.1 Standard Cash Sale

```
1. Cashier opens POS
2. Selects transaction currency (UZS / USD)
3. Adds products:
   a. Scan barcode → product resolved
   b. Search by SKU/name → select from list
   c. Manual entry (with permission)
4. Adjusts quantities on cart lines
5. Reviews total (UZS and USD reference shown)
6. Selects payment: CASH
7. Enters amount received (change calculated)
8. Confirms sale
9. System:
   a. Creates sale record with frozen exchange rate
   b. Runs FIFO allocation per line item
   c. Deducts inventory (movements created)
   d. Prints/emails receipt (optional)
10. Cart cleared; ready for next sale
```

### 3.2 Credit Sale

```
Steps 1–4: Same as cash sale
5.  Associates customer (phone search or select)
6.  Selects payment: CREDIT
7.  Optionally enters partial payment amount
8.  Confirms sale
9.  System:
   a. Creates sale record
   b. FIFO allocation + inventory deduction
   c. Creates/updates customer debt balance
   d. Records partial payment if any
10. Customer card updated with new debt
```

### 3.3 POS Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│  POS — Market — Tashkent Main    Rate: 12,750   [UZS|USD]  │
├──────────────────────────────┬──────────────────────────────┤
│  🔍 Search / Scan barcode    │  Customer: [phone search]    │
├──────────────────────────────┼──────────────────────────────┤
│                              │                              │
│  CART                        │  Product Grid / Search       │
│  ─────────────────────────   │  Results                     │
│  Cement 50kg    ×10  450,000 │                              │
│  Brick Std      ×500  250,000│                              │
│  ─────────────────────────   │                              │
│  Subtotal:        700,000    │                              │
│  Discount:              0    │                              │
│  TOTAL:           700,000    │                              │
│                              │                              │
│  [CASH] [CREDIT] [CLEAR]     │                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 4. Sale Entity

### 4.1 Sale Header

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | Owning company |
| `branch_id` | UUID | Branch where sale occurred |
| `sale_number` | String | Human-readable sequential number |
| `customer_id` | UUID | Customer (null for walk-in cash) |
| `cashier_id` | UUID | User who processed sale |
| `original_currency` | Enum | `UZS` or `USD` |
| `exchange_rate_used` | Decimal | Frozen rate at sale time |
| `subtotal_uzs` | Decimal | Pre-discount total UZS |
| `subtotal_usd` | Decimal | Pre-discount total USD |
| `discount_uzs` | Decimal | Discount amount UZS |
| `discount_usd` | Decimal | Discount amount USD |
| `total_uzs` | Decimal | Final total UZS |
| `total_usd` | Decimal | Final total USD |
| `payment_type` | Enum | `CASH`, `CREDIT`, `MIXED` |
| `amount_paid_uzs` | Decimal | Cash/partial payment UZS |
| `amount_paid_usd` | Decimal | Cash/partial payment USD |
| `status` | Enum | `DRAFT`, `COMPLETED`, `CANCELLED`, `RETURNED` |
| `completed_at` | Timestamp | Finalization time |
| `notes` | Text | Sale notes |

### 4.2 Sale Line Item

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `sale_id` | UUID | Parent sale |
| `product_id` | UUID | Product sold |
| `quantity` | Decimal | Units sold |
| `unit_price` | Decimal | Price per unit in transaction currency |
| `currency` | Enum | Line currency (matches sale) |
| `discount_percent` | Decimal | Line-level discount |
| `line_total` | Decimal | quantity × unit_price − discount |
| `cogs_uzs` | Decimal | FIFO COGS UZS (computed) |
| `cogs_usd` | Decimal | FIFO COGS USD (computed) |

---

## 5. Payment Types

### 5.1 Cash

| Aspect | Behavior |
|--------|----------|
| Customer | Optional (walk-in allowed) |
| Payment | Full amount at time of sale |
| Debt | None created |
| Change | Calculated and displayed |

### 5.2 Credit

| Aspect | Behavior |
|--------|----------|
| Customer | **Required** — must select or create customer |
| Payment | Zero (full credit) or partial amount |
| Debt | `total − amount_paid` added to customer debt in transaction currency |
| Approval | Sales above configurable credit limit require manager approval |

### 5.3 Mixed (Partial Payment)

| Aspect | Behavior |
|--------|----------|
| Customer | Required |
| Payment | Partial amount in transaction currency |
| Debt | Remainder added to customer debt |
| Example | Total 1,000,000 UZS; paid 400,000 UZS; debt +600,000 UZS |

---

## 6. FIFO Integration

Every completed sale triggers automatic FIFO allocation per line item. See [FIFO.md](./FIFO.md) for algorithm details.

### 6.1 Sale Completion Sequence

```
BEGIN TRANSACTION
  1. Validate stock availability (per line)
  2. Create sale + sale_items records
  3. For each sale_item:
     a. Run allocateFIFO(productId, warehouseId, quantity)
     b. Create SaleFifoAllocation records
     c. Decrement batch.remaining_qty
     d. Create InventoryMovement (type: SALE)
     e. Compute line COGS
  4. Update sale COGS totals
  5. Process payment / create debt
  6. Create audit log entry
  7. Emit WebSocket event: sale.completed
COMMIT
```

### 6.2 Insufficient Stock

- Default: sale blocked with error message showing available quantity
- With `inventory.oversell` permission: sale proceeds with warning; oversell tracked

---

## 7. Returns

### 7.1 Return Workflow

1. Manager/cashier locates original sale (by sale number, date, or customer)
2. Selects items and quantities to return
3. Specifies return reason
4. System:
   a. Creates return record linked to original sale
   b. Creates new inventory batch (return batch) with original COGS cost
   c. Reverses proportional debt (if credit sale) or processes cash refund
   d. Updates sale status to `RETURNED` (or tracks partial return)
   e. Audit log entry

### 7.2 Return Rules

| ID | Rule |
|----|------|
| SL-RT-01 | Return quantity cannot exceed originally sold quantity minus prior returns |
| SL-RT-02 | Return restores stock via new batch (not original batch) |
| SL-RT-03 | Return reverses debt in same currency as original sale |
| SL-RT-04 | Cash refund amount uses original sale price, not current price |
| SL-RT-05 | Return requires `sales.return` permission |
| SL-RT-06 | Return window configurable (default: 30 days) |

### 7.3 Sale Cancellation (Void)

Distinct from return — voids entire sale within allowed window (default 24 hours):

- Reverses all FIFO allocations (restores batch quantities)
- Reverses debt if credit sale
- Sale status → `CANCELLED`
- Only original cashier or manager can void

---

## 8. Discounts

| Level | Description | Approval |
|-------|-------------|----------|
| Line discount | Per-item percentage or amount | Auto if ≤ 10%; manager if > 10% |
| Sale discount | Whole-sale percentage or amount | Manager approval if > 10% |
| Customer discount | Future: per-customer default discount | Configured in customer card |

Discounts reduce sale total before debt calculation. COGS is unaffected (based on batch costs, not sale price).

---

## 9. Receipt

### 9.1 Receipt Contents

```
═══════════════════════════════════
         MARKET — Tashkent Main
         Sale #MKT-2026-004521
         2026-06-17 14:32:05
         Cashier: Dilshod
         Rate: 1 USD = 12,750 UZS
───────────────────────────────────
Cement 50kg        10 × 45,000
                                 450,000
Brick Standard    500 ×    500
                                 250,000
───────────────────────────────────
Subtotal:                        700,000 UZS
Discount:                              0
TOTAL:                           700,000 UZS
                                 $54.90 USD
───────────────────────────────────
Payment: CASH                   700,000
Change:                              0
═══════════════════════════════════
```

---

## 10. Permissions

| Permission | Description |
|------------|-------------|
| `sales.view` | View sales list and details |
| `sales.create` | Process sales at POS |
| `sales.cancel` | Void sales within window |
| `sales.return` | Process returns |
| `sales.discount` | Apply discounts up to threshold |
| `sales.discount.override` | Apply discounts above threshold |
| `sales.credit` | Create credit sales |

---

## 11. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sales` | List sales (paginated, filterable) |
| GET | `/api/v1/sales/:id` | Sale detail with items and allocations |
| POST | `/api/v1/sales` | Create and complete sale |
| POST | `/api/v1/sales/:id/cancel` | Void sale |
| POST | `/api/v1/sales/:id/returns` | Process return |
| GET | `/api/v1/pos/products` | POS product search (optimized) |

---

## 12. Real-Time Events

| Event | Trigger | Subscribers |
|-------|---------|-------------|
| `sale.completed` | Sale finalized | Dashboard, Notifications |
| `sale.cancelled` | Sale voided | Dashboard, Inventory |
| `sale.returned` | Return processed | Dashboard, Inventory, Debt |

---

## 13. Related Documents

- [PRODUCTS.md](./PRODUCTS.md)
- [INVENTORY.md](./INVENTORY.md)
- [FIFO.md](./FIFO.md)
- [CURRENCY_UZS_USD.md](./CURRENCY_UZS_USD.md)
- [CUSTOMERS.md](./CUSTOMERS.md)
- [DEBT_MANAGEMENT.md](./DEBT_MANAGEMENT.md)
- [../04-ui-ux/USER_FLOWS.md](../04-ui-ux/USER_FLOWS.md)
