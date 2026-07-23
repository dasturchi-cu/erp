# Products Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Products module is the catalog foundation of the ERP platform. It manages the complete product master data for each company, including identifiers (SKU, barcode), hierarchical categorization, dual-currency pricing (UZS and USD), and aggregate inventory value displays. Every downstream module — Inventory, FIFO, Sales, Reports, and Dashboard — depends on accurate product records.

Products are strictly company-scoped. A SKU unique in Market is independent of the same SKU string in Somafix. All product operations enforce company isolation via JWT context.

---

## 2. Core Entities

### 2.1 Product

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `company_id` | UUID | Yes | Owning company |
| `sku` | String | Yes | Stock Keeping Unit; unique per company |
| `barcode` | String | No | EAN/UPC or custom barcode; unique per company when set |
| `name` | String | Yes | Display name (supports Uzbek, Russian, English) |
| `description` | Text | No | Extended product description |
| `category_id` | UUID | Yes | Reference to product category |
| `unit_of_measure` | Enum | Yes | `PIECE`, `KG`, `METER`, `LITER`, `BOX`, `PACK` |
| `status` | Enum | Yes | `ACTIVE`, `INACTIVE`, `DISCONTINUED` |
| `min_stock_level` | Decimal | No | Low-stock alert threshold |
| `image_url` | String | No | Product image reference |
| `created_at` | Timestamp | Yes | Record creation |
| `updated_at` | Timestamp | Yes | Last modification |
| `deleted_at` | Timestamp | No | Soft-delete marker |

### 2.2 Product Price

Each product maintains four independent price fields to support Uzbekistan's dual-currency economy:

| Field | Description |
|-------|-------------|
| `purchase_price_uzs` | Reference purchase cost in Uzbek So'm |
| `purchase_price_usd` | Reference purchase cost in US Dollars |
| `sale_price_uzs` | Default retail/wholesale price in UZS |
| `sale_price_usd` | Default retail/wholesale price in USD |

Reference prices are used for new batch costing defaults and POS price suggestions. Actual transaction prices may differ (with appropriate permissions). All four prices must be ≥ 0.

### 2.3 Product Category

Hierarchical category tree per company:

```
Construction Materials
├── Cement
├── Bricks
└── Insulation
Tools
├── Hand Tools
└── Power Tools
```

| Field | Description |
|-------|-------------|
| `name` | Category display name |
| `parent_id` | Parent category (null for root) |
| `sort_order` | Display ordering within parent |
| `product_count` | Denormalized count for list views |

---

## 3. SKU Management

### 3.1 Rules

| ID | Rule |
|----|------|
| PR-SKU-01 | SKU is mandatory on every product |
| PR-SKU-02 | SKU must be unique within the company |
| PR-SKU-03 | SKU is immutable after creation (create new product to change) |
| PR-SKU-04 | SKU format: alphanumeric, 3–50 characters, hyphens and underscores allowed |
| PR-SKU-05 | System suggests next SKU based on category prefix (configurable) |

### 3.2 SKU Conventions by Company

| Company | Pattern | Example |
|---------|---------|---------|
| Market | `MKT-{category}-{seq}` | `MKT-CEM-0042` |
| Somafix | `SF-{product-line}-{size}` | `SF-SIL-300ML` |
| Xitoy Tovar | `XT-{import-code}` | `XT-8847-A` |
| Lantian | `LT-{seq}` | `LT-12089` |

---

## 4. Barcode Management

### 4.1 Supported Formats

- EAN-13 (standard retail)
- EAN-8 (small packaging)
- Code 128 (warehouse labels)
- Custom alphanumeric (internal use)

### 4.2 Barcode Workflow

1. **Scan at POS** — Cashier scans barcode; system resolves product within active company
2. **Scan at receiving** — Warehouse clerk scans to identify product during batch entry
3. **Generate internal** — System can auto-generate Code 128 for products without manufacturer barcode

### 4.3 Rules

| ID | Rule |
|----|------|
| PR-BC-01 | Barcode is optional |
| PR-BC-02 | When set, barcode must be unique within company |
| PR-BC-03 | Duplicate barcode scan at POS shows disambiguation if multiple matches (should not occur) |
| PR-BC-04 | Barcode lookup is case-insensitive |

---

## 5. Dual Pricing (UZS / USD)

### 5.1 Why Dual Pricing

Uzbekistan wholesale and retail businesses commonly maintain prices in both currencies. Imported goods (especially from China — Xitoy Tovar) are often priced and purchased in USD, while daily retail transactions occur in UZS. Maintaining both price sets eliminates conversion errors at the point of sale.

### 5.2 Price Display

| Context | Display Behavior |
|---------|-----------------|
| Product list | Both UZS and USD sale prices shown in separate columns |
| Product detail | All four prices in dedicated pricing section |
| POS | Price shown in transaction currency; alternate currency shown as reference |
| Category totals | Aggregated per currency (see Section 6) |

### 5.3 Price Updates

- Price changes are audited (old/new values logged)
- Price changes do not retroactively affect existing batches or completed sales
- Bulk price update supported via import (Excel/CSV) with preview and confirmation

---

## 6. Inventory Totals Display

The Products module provides aggregate value displays at list and category levels.

### 6.1 Per-Product Totals

For each product with stock on hand:

```
Total Value (UZS) = current_stock_qty × sale_price_uzs
Total Value (USD) = current_stock_qty × sale_price_usd
```

Stock quantity is sourced from Inventory module (sum of `remaining_qty` across all batches).

### 6.2 Category Totals

Category and subcategory views show:

| Metric | Description |
|--------|-------------|
| Product count | Active products in category tree |
| Total units | Sum of stock quantities |
| Total value UZS | Σ (qty × sale_price_uzs) for in-stock products |
| Total value USD | Σ (qty × sale_price_usd) for in-stock products |
| Low stock count | Products below `min_stock_level` |

### 6.3 Company-Wide Catalog Summary

Dashboard header on Products page:

```
┌─────────────────────────────────────────────────────┐
│  Products: 1,247  │  In Stock: 892  │  Low: 23    │
│  Catalog Value:  2,450,000,000 UZS  │  $187,400   │
└─────────────────────────────────────────────────────┘
```

---

## 7. User Interface

### 7.1 Product List

- Searchable by SKU, barcode, name
- Filterable by category, status, stock level
- Sortable by name, SKU, stock qty, value
- Bulk actions: activate, deactivate, export
- Column customization (show/hide UZS/USD columns)

### 7.2 Product Form

Tabs: **General** | **Pricing** | **Inventory** | **History**

- General: SKU, barcode, name, category, unit, status, image
- Pricing: four price fields with last-updated timestamp
- Inventory: current stock by batch (read-only, links to Inventory module)
- History: audit trail of all changes

### 7.3 Category Management

- Tree view with drag-and-drop reordering
- Inline product count per node
- Cannot delete category with assigned products (reassign first)

---

## 8. Permissions

| Permission | Description |
|------------|-------------|
| `products.view` | View product list and details |
| `products.create` | Create new products |
| `products.update` | Edit product fields and prices |
| `products.delete` | Soft-delete products (blocked if stock exists) |
| `products.import` | Bulk import via file |
| `products.export` | Export product catalog |
| `categories.manage` | Create, edit, delete categories |

---

## 9. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products (paginated, filterable) |
| GET | `/api/v1/products/:id` | Product detail with prices and stock summary |
| POST | `/api/v1/products` | Create product |
| PATCH | `/api/v1/products/:id` | Update product |
| DELETE | `/api/v1/products/:id` | Soft-delete product |
| GET | `/api/v1/products/barcode/:code` | Lookup by barcode |
| GET | `/api/v1/products/totals` | Category and catalog aggregate totals |
| GET | `/api/v1/categories` | Category tree |
| POST | `/api/v1/categories` | Create category |

---

## 10. Integration Points

| Module | Integration |
|--------|-------------|
| **Inventory** | Stock quantities drive totals display; product status affects receiving |
| **FIFO** | Product links to inventory batches |
| **Sales** | POS resolves products by SKU/barcode; uses sale prices as defaults |
| **Reports** | Product catalog export; sales-by-product reports |
| **Audit** | All CRUD operations logged with old/new values |

---

## 11. Business Rules Summary

| ID | Rule |
|----|------|
| BR-PR-01 | SKU mandatory and unique within company |
| BR-PR-02 | Barcode optional; unique within company when set |
| BR-PR-03 | Product must have category assigned |
| BR-PR-04 | All four prices must be ≥ 0 |
| BR-PR-05 | Soft-delete blocked if active stock exists |
| BR-PR-06 | Display totals: sum(qty × price) per currency for in-stock products |

---

## 12. Related Documents

- [../02-business/BUSINESS_RULES.md](../02-business/BUSINESS_RULES.md)
- [../02-business/DOMAIN_MODEL.md](../02-business/DOMAIN_MODEL.md)
- [INVENTORY.md](./INVENTORY.md)
- [FIFO.md](./FIFO.md)
- [CURRENCY_UZS_USD.md](./CURRENCY_UZS_USD.md)
- [SALES.md](./SALES.md)
- [../03-product/MODULE_CATALOG.md](../03-product/MODULE_CATALOG.md)
