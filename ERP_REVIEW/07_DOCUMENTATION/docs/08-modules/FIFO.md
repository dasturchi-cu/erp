# FIFO Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

FIFO (First In, First Out) is the mandatory inventory costing method for all outbound stock movements in the ERP platform. When goods are sold, transferred, or adjusted downward, the system automatically allocates quantity from the oldest available batches first. This ensures accurate Cost of Goods Sold (COGS) calculation and compliance with standard accounting practice for perishable and fast-moving goods common in Uzbekistan's wholesale sector.

FIFO is not optional. Every sale, return reversal, and negative adjustment triggers the allocation engine. The results are persisted as `SaleFifoAllocation` records (or equivalent for non-sale movements) and are immutable once the parent transaction is completed.

---

## 2. Core Principles

| ID | Principle |
|----|-----------|
| FIFO-01 | FIFO is mandatory for all outbound inventory movements |
| FIFO-02 | Batches ordered by `received_at ASC` (oldest first) |
| FIFO-03 | Allocation may span multiple batches to fulfill quantity |
| FIFO-04 | Each allocation records batch, quantity, and unit cost |
| FIFO-05 | COGS = Σ (allocated_qty × batch_unit_cost) per currency |
| FIFO-06 | Batch `remaining_qty` never goes below zero |
| FIFO-07 | Returns create new batches; stock is not restored to original batches |

---

## 3. Batch Allocation Algorithm

### 3.1 Pseudocode

```
function allocateFIFO(productId, warehouseId, requestedQty, companyId):
    batches = queryBatches(
        productId, warehouseId, companyId,
        where: remaining_qty > 0,
        orderBy: received_at ASC
    )

    allocations = []
    remaining = requestedQty

    for batch in batches:
        if remaining <= 0:
            break

        take = min(batch.remaining_qty, remaining)

        allocations.push({
            batchId: batch.id,
            quantity: take,
            unitCostUzs: batch.unit_cost_uzs,
            unitCostUsd: batch.unit_cost_usd
        })

        remaining -= take

    if remaining > 0:
        if user.hasPermission('inventory.oversell'):
            // Allow with warning; negative stock tracked
            createOversellAllocation(remaining)
        else:
            throw InsufficientStockError(remaining)

    return allocations
```

### 3.2 Allocation Properties

- **Atomic**: Allocation and batch decrement occur in a single database transaction
- **Deterministic**: Same batches and quantities always produce same allocation given same state
- **Auditable**: Full allocation detail persisted and linked to parent transaction
- **Concurrent-safe**: Row-level locking on batches prevents double-allocation under concurrent sales

### 3.3 Multi-Warehouse Allocation

When a sale does not specify warehouse, allocation uses the branch default warehouse. Cross-warehouse allocation is not supported in a single sale line — the cashier must specify warehouse if stock spans locations.

---

## 4. Worked Examples

### 4.1 Simple Single-Batch Sale

**Setup:**
```
Product: Cement 50kg (SKU: MKT-CEM-50)
Batch A: 200 units @ 45,000 UZS / $3.50 USD (received 2026-01-05)
```

**Sale:** 30 units

**Allocation:**
```
Batch A: 30 units
  unit_cost_uzs: 45,000
  unit_cost_usd: 3.50

COGS (UZS) = 30 × 45,000 = 1,350,000 UZS
COGS (USD) = 30 × 3.50   = $105.00
```

**After:** Batch A remaining = 170 units

---

### 4.2 Multi-Batch Spanning Sale

**Setup:**
```
Product: Silicone Sealant 300ml (SKU: SF-SIL-300ML)
Batch A: 100 units @ 10,000 UZS (received 2026-01-01)
Batch B: 100 units @ 12,000 UZS (received 2026-01-15)
Batch C: 50 units  @ 11,500 UZS (received 2026-02-01)
```

**Sale:** 150 units

**Allocation:**
```
Batch A: 100 units @ 10,000 UZS  →  1,000,000 UZS
Batch B:  50 units @ 12,000 UZS  →    600,000 UZS
                                 ─────────────────
COGS Total:                       1,600,000 UZS
```

**After:**
- Batch A remaining: 0 (fully consumed)
- Batch B remaining: 50
- Batch C remaining: 50 (untouched)

---

### 4.3 Dual-Currency COGS

**Setup:**
```
Product: Power Drill (SKU: XT-DRILL-01)
Batch A: 50 units @ 250,000 UZS / $20.00 USD (received 2026-03-10)
Batch B: 30 units @ 260,000 UZS / $21.00 USD (received 2026-04-02)
```

**Sale:** 60 units, transaction currency USD, sale price $35.00/unit

**Allocation:**
```
Batch A: 50 units → COGS: 12,500,000 UZS / $1,000.00 USD
Batch B: 10 units → COGS:  2,600,000 UZS /   $210.00 USD
                    ─────────────────────────────────────
Total COGS:          15,100,000 UZS / $1,210.00 USD

Revenue:  60 × $35.00 = $2,100.00 USD
Gross Profit (USD): $2,100.00 − $1,210.00 = $890.00 USD
```

COGS is always calculated from batch costs in both currencies, regardless of transaction currency.

---

### 4.4 Insufficient Stock

**Setup:**
```
Product: Brick Standard (SKU: MKT-BRK-STD)
Batch A: 20 units remaining
```

**Sale request:** 25 units

**Without `inventory.oversell` permission:**
```
Error: InsufficientStock
  requested: 25
  available: 20
  shortfall: 5
```

**With `inventory.oversell` permission:**
```
Batch A: 20 units (fully allocated)
Oversell: 5 units (flagged, negative stock tracked)
Warning displayed to cashier; manager notification sent
```

---

### 4.5 Return Processing

**Original sale:** 50 units from Batch A (now fully consumed)

**Customer returns:** 10 units

**System behavior:**
- Does NOT restore to Batch A (Batch A may be consumed or have different cost)
- Creates **new return batch:**
  ```
  Batch R1: 10 units @ original sale COGS cost
  received_at: return timestamp
  source: RETURN reference to original sale
  ```
- Return batch enters FIFO queue at current timestamp (oldest among new stock)

---

## 5. COGS Calculation

### 5.1 Per Sale Line

```
line_cogs_uzs = Σ (allocation.qty × allocation.unit_cost_uzs)
line_cogs_usd = Σ (allocation.qty × allocation.unit_cost_usd)
```

### 5.2 Per Sale (Aggregate)

```
sale_cogs_uzs = Σ line_cogs_uzs for all items
sale_cogs_usd = Σ line_cogs_usd for all items
```

### 5.3 Gross Profit

```
gross_profit_uzs = sale_total_uzs − sale_cogs_uzs
gross_profit_usd = sale_total_usd − sale_cogs_usd
```

Profit is calculated in each currency independently. No cross-currency conversion is applied to profit figures — this preserves historical accuracy per [CURRENCY_UZS_USD.md](./CURRENCY_UZS_USD.md).

### 5.4 COGS Reporting

| Report | Description |
|--------|-------------|
| COGS by Product | Total cost of goods sold per product for period |
| COGS by Sale | Per-transaction COGS with allocation detail |
| Gross Margin | Revenue minus COGS, by product/category/period |
| Batch Consumption | Which batches were consumed and when |

---

## 6. Data Model

### 6.1 SaleFifoAllocation

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `sale_item_id` | UUID | Parent sale line |
| `batch_id` | UUID | Source batch |
| `quantity` | Decimal | Units allocated from this batch |
| `unit_cost_uzs` | Decimal | Batch cost at allocation time |
| `unit_cost_usd` | Decimal | Batch cost at allocation time |
| `allocated_at` | Timestamp | Allocation timestamp |

### 6.2 Allocation Immutability

Once a sale is completed:
- Allocations cannot be modified
- Cancellations create reverse movements (return batches)
- COGS figures are frozen permanently

---

## 7. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Concurrent sales of same product | Row-level lock on batches; second sale waits or fails |
| Batch with zero remaining | Skipped in allocation queue |
| Sale void within 24h | Reverse allocations; restore batch quantities |
| Price change after batch creation | Allocation uses batch cost, not current product price |
| Adjustment (negative) | FIFO applied same as sale |
| Transfer out | FIFO applied at source warehouse |

---

## 8. Permissions

| Permission | Description |
|------------|-------------|
| `fifo.view` | View allocation details on sales |
| `inventory.oversell` | Allow sale exceeding available stock |

---

## 9. API

FIFO allocation is internal — triggered automatically by Sales and Inventory modules. Read-only endpoints expose allocation data:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sales/:id/allocations` | FIFO allocations for a sale |
| GET | `/api/v1/reports/cogs` | COGS report with allocation detail |

---

## 10. Related Documents

- [INVENTORY.md](./INVENTORY.md)
- [SALES.md](./SALES.md)
- [CURRENCY_UZS_USD.md](./CURRENCY_UZS_USD.md)
- [REPORTS.md](./REPORTS.md)
- [../02-business/BUSINESS_RULES.md](../02-business/BUSINESS_RULES.md)
