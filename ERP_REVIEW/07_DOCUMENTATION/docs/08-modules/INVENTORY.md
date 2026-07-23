# Inventory Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Inventory module tracks physical stock across warehouses and branches. It maintains real-time stock levels, batch records (linked to FIFO), movement history, and warehouse organization. Every stock change — receipt, sale, adjustment, return, or transfer — creates an immutable movement record for full traceability.

Inventory operates at the intersection of Products (what) and FIFO (how costs are allocated). Stock quantities are always derived from batch `remaining_qty` sums, never stored as a standalone counter that could drift out of sync.

---

## 2. Core Concepts

### 2.1 Stock Level

Stock level for a product is calculated as:

```
current_stock = SUM(batch.remaining_qty) WHERE product_id = X AND company_id = Y
```

Stock is further scoped by warehouse and branch when multi-location inventory is enabled.

### 2.2 Batch

A batch represents a discrete receipt of goods with a specific unit cost and receipt date. Batches are the foundation of FIFO costing. See [FIFO.md](./FIFO.md) for allocation rules.

### 2.3 Movement

Every quantity change produces a movement record. Movements are append-only and reference the originating business transaction.

### 2.4 Warehouse

Physical storage location within a branch. A branch may have one or more warehouses (e.g., main floor, back storage, cold room).

---

## 3. Entity Definitions

### 3.1 Warehouse

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | Owning company |
| `branch_id` | UUID | Parent branch |
| `name` | String | Warehouse name (e.g., "Main Storage", "Showroom Floor") |
| `code` | String | Short code (e.g., `WH-01`) |
| `address` | String | Physical location within branch |
| `is_default` | Boolean | Default warehouse for branch receiving |
| `status` | Enum | `ACTIVE`, `INACTIVE` |

### 3.2 Inventory Batch

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | Owning company |
| `product_id` | UUID | Product reference |
| `warehouse_id` | UUID | Storage location |
| `batch_number` | String | Human-readable batch identifier |
| `quantity` | Decimal | Original received quantity |
| `remaining_qty` | Decimal | Current available quantity |
| `unit_cost_uzs` | Decimal | Cost per unit in UZS |
| `unit_cost_usd` | Decimal | Cost per unit in USD |
| `received_at` | Timestamp | Receipt date (FIFO ordering key) |
| `supplier_ref` | String | Optional supplier invoice reference |
| `notes` | Text | Receiving notes |
| `created_by` | UUID | User who created the batch |

### 3.3 Inventory Movement

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | Owning company |
| `batch_id` | UUID | Affected batch |
| `product_id` | UUID | Product (denormalized for queries) |
| `warehouse_id` | UUID | Warehouse |
| `type` | Enum | Movement type (see Section 4) |
| `quantity` | Decimal | Positive for inbound, negative for outbound |
| `reference_type` | String | `SALE`, `RECEIPT`, `ADJUSTMENT`, `RETURN`, `TRANSFER` |
| `reference_id` | UUID | ID of originating record |
| `performed_by` | UUID | Acting user |
| `performed_at` | Timestamp | Movement timestamp |
| `notes` | Text | Optional explanation |

---

## 4. Movement Types

| Type | Direction | Trigger | Description |
|------|-----------|---------|-------------|
| `RECEIPT` | Inbound (+) | Manual receiving, purchase receipt | New goods arrive; creates batch |
| `SALE` | Outbound (−) | POS sale completion | FIFO allocation reduces batch qty |
| `ADJUSTMENT` | Either | Manual correction | Stock count discrepancy resolution |
| `RETURN` | Inbound (+) | Customer return, sale void | Creates new return batch |
| `TRANSFER` | Out/In pair | Inter-warehouse transfer | Decrements source, increments destination |

### 4.1 Movement Flow Diagram

```
                    ┌──────────┐
         ┌─────────│ RECEIPT  │─────────┐
         │         └──────────┘         │
         ▼                                ▼
   ┌──────────┐                    ┌──────────┐
   │  Batch   │◄──── RETURN ────│   SALE   │
   │ (stock)  │                    └──────────┘
   └────┬─────┘                          ▲
        │                                │
        ├── ADJUSTMENT (+/−)             │
        │                                │
        └── TRANSFER (out) ──► TRANSFER (in)
```

---

## 5. Stock Levels

### 5.1 Views

| View | Scope | Use Case |
|------|-------|----------|
| **Product Stock** | Per product, all warehouses | Product detail page, POS availability check |
| **Warehouse Stock** | Per warehouse, all products | Warehouse manager daily review |
| **Branch Stock** | Per branch, aggregated | Branch manager overview |
| **Company Stock** | Company-wide totals | Executive summary |

### 5.2 Stock Status Indicators

| Status | Condition | UI Indicator |
|--------|-----------|--------------|
| In Stock | `remaining_qty > min_stock_level` | Green |
| Low Stock | `0 < remaining_qty ≤ min_stock_level` | Amber warning |
| Out of Stock | `remaining_qty = 0` | Red; blocked at POS (unless oversell permitted) |
| Negative | `remaining_qty < 0` | Critical alert; requires immediate adjustment |

### 5.3 Real-Time Updates

Stock levels update in real time via WebSocket events:

| Event | Payload |
|-------|---------|
| `inventory.stock_changed` | `{ productId, warehouseId, newQty, delta }` |
| `inventory.batch_created` | `{ batchId, productId, quantity }` |
| `inventory.low_stock` | `{ productId, currentQty, minLevel }` |

---

## 6. Receiving Workflow

### 6.1 Standard Receipt

1. Warehouse clerk navigates to **Inventory → Receive Goods**
2. Selects product (by SKU, barcode, or search)
3. Selects target warehouse
4. Enters quantity, unit cost (UZS and/or USD), supplier reference
5. System creates batch with `received_at = now()`
6. Movement record type `RECEIPT` created
7. Stock level updated; notification sent if configured

### 6.2 Bulk Receiving

- Import receiving list via Excel/CSV
- Preview with validation (product exists, warehouse valid, costs ≥ 0)
- Confirm creates all batches in single transaction

### 6.3 Receiving Rules

| ID | Rule |
|----|------|
| INV-RC-01 | Quantity must be > 0 |
| INV-RC-02 | At least one unit cost (UZS or USD) required |
| INV-RC-03 | Batch number auto-generated if not provided |
| INV-RC-04 | Receipt cannot be deleted; reverse via adjustment |

---

## 7. Stock Adjustments

### 7.1 When to Adjust

- Physical count reveals discrepancy
- Damaged/expired goods write-off
- System error correction (with manager approval)

### 7.2 Adjustment Workflow

1. Select product and warehouse
2. Enter actual counted quantity
3. System calculates delta (actual − system)
4. Manager approval required for adjustments > configurable threshold
5. If delta is negative: FIFO allocation applied to reduce oldest batches
6. If delta is positive: new adjustment batch created with manager-specified cost
7. Movement record type `ADJUSTMENT` created with reason code

### 7.3 Reason Codes

| Code | Description |
|------|-------------|
| `PHYSICAL_COUNT` | Periodic stock take correction |
| `DAMAGE` | Damaged goods write-off |
| `THEFT` | Shrinkage/theft |
| `EXPIRY` | Expired product removal |
| `SYSTEM_ERROR` | Data correction |

---

## 8. Warehouse Management

### 8.1 Structure

```
Company: Market
└── Branch: Tashkent Main
    ├── Warehouse: Showroom Floor (WH-01) [default]
    └── Warehouse: Back Storage (WH-02)
└── Branch: Samarkand
    └── Warehouse: Main (WH-01) [default]
```

### 8.2 Warehouse Rules

| ID | Rule |
|----|------|
| INV-WH-01 | Each branch has at least one active warehouse |
| INV-WH-02 | Exactly one default warehouse per branch |
| INV-WH-03 | Cannot deactivate warehouse with stock on hand |
| INV-WH-04 | Transfer between warehouses within same branch only (cross-branch transfer: future) |

### 8.3 Inter-Warehouse Transfer

1. Select source warehouse, destination warehouse, product, quantity
2. System validates sufficient stock at source
3. FIFO allocation from source batches
4. New batch created at destination with transferred cost basis
5. Paired movements: `TRANSFER` out (source) and `TRANSFER` in (destination)

---

## 9. Movement History

### 9.1 Movement Log View

Filterable audit trail showing all stock changes:

| Column | Description |
|--------|-------------|
| Date/Time | `performed_at` |
| Product | Name and SKU |
| Type | Movement type badge |
| Quantity | +/- with color coding |
| Warehouse | Location |
| Reference | Link to sale, receipt, etc. |
| User | Who performed the action |
| Notes | Free-text explanation |

### 9.2 Retention

Movement records are retained indefinitely (aligned with 7-year audit retention policy). They are never deleted or modified.

---

## 10. Permissions

| Permission | Description |
|------------|-------------|
| `inventory.view` | View stock levels and movement history |
| `inventory.receive` | Create receipt batches |
| `inventory.adjust` | Perform stock adjustments |
| `inventory.transfer` | Inter-warehouse transfers |
| `inventory.oversell` | Allow sale when stock insufficient |
| `warehouses.manage` | Create and configure warehouses |

---

## 11. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/inventory/stock` | Stock levels (filterable by product, warehouse, branch) |
| GET | `/api/v1/inventory/batches` | List batches (filterable) |
| POST | `/api/v1/inventory/batches` | Create receipt batch |
| GET | `/api/v1/inventory/movements` | Movement history (paginated) |
| POST | `/api/v1/inventory/adjustments` | Stock adjustment |
| POST | `/api/v1/inventory/transfers` | Inter-warehouse transfer |
| GET | `/api/v1/warehouses` | List warehouses |
| POST | `/api/v1/warehouses` | Create warehouse |

---

## 12. Integration Points

| Module | Integration |
|--------|-------------|
| **Products** | Product identity; min stock levels; catalog totals |
| **FIFO** | Batch allocation on outbound movements |
| **Sales** | Stock deduction on sale; availability check at POS |
| **Dashboard** | Low stock alerts; inventory value KPIs |
| **Reports** | Stock valuation, movement reports, aging |
| **Audit** | All inventory changes logged |

---

## 13. Related Documents

- [PRODUCTS.md](./PRODUCTS.md)
- [FIFO.md](./FIFO.md)
- [SALES.md](./SALES.md)
- [BRANCH_MANAGEMENT.md](./BRANCH_MANAGEMENT.md)
- [../02-business/BUSINESS_RULES.md](../02-business/BUSINESS_RULES.md)
- [../05-database/SCHEMA_DESIGN.md](../05-database/SCHEMA_DESIGN.md)
