# Future Module Specifications

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Planning |
| Last Updated | 2026-06-17 |

---

## 1. Overview

This document provides detailed specifications for each planned expansion module. These specs inform future development phases and ensure architectural consistency with the core platform. Each module follows the modular monolith pattern defined in [../01-governance/MODULAR_ARCHITECTURE.md](../01-governance/MODULAR_ARCHITECTURE.md).

---

## 2. Module: Multi-Warehouse

### Module ID: `warehouse`

| Property | Value |
|----------|-------|
| Timeline | Q3 2026 |
| Priority | High |
| Dependencies | `inventory`, `products` |
| Platforms | Desktop (full), Mobile (view) |

### Entities

| Entity | Key Fields | Description |
|--------|-----------|-------------|
| `Warehouse` | id, company_id, name, code, address, is_active | Physical storage location |
| `WarehouseStock` | warehouse_id, product_id, quantity | Stock level per warehouse |
| `StockTransfer` | id, from_warehouse, to_warehouse, status, items[] | Inter-warehouse movement |
| `StockTransferItem` | transfer_id, product_id, quantity | Line items in transfer |

### Business Rules

| Rule | Description |
|------|-------------|
| WH-001 | Each company may have 1–20 warehouses |
| WH-002 | Every inventory batch belongs to exactly one warehouse |
| WH-003 | Stock transfers require manager approval |
| WH-004 | Transfer deducts from source warehouse immediately on approval |
| WH-005 | Transfer adds to destination warehouse on receipt confirmation |
| WH-006 | Sales deduct stock from the branch's assigned warehouse |
| WH-007 | Total stock across warehouses = previous single-warehouse stock |
| WH-008 | Warehouse cannot be deleted if it has stock > 0 |

### Permissions

| Permission | Roles |
|------------|-------|
| `warehouse.view` | All roles |
| `warehouse.create` | Admin |
| `warehouse.edit` | Admin, Manager |
| `warehouse.transfer.create` | Manager, Warehouse Keeper |
| `warehouse.transfer.approve` | Manager, Admin |
| `warehouse.transfer.receive` | Warehouse Keeper |

### WebSocket Events

| Event | Trigger |
|-------|---------|
| `warehouse.stock_changed` | Stock level change in any warehouse |
| `warehouse.transfer.created` | New transfer request |
| `warehouse.transfer.approved` | Transfer approved by manager |
| `warehouse.transfer.completed` | Transfer received at destination |

---

## 3. Module: Supplier and Purchase Orders

### Module ID: `purchasing`

| Property | Value |
|----------|-------|
| Timeline | Q4 2026 |
| Priority | High |
| Dependencies | `products`, `inventory`, `currency`, `warehouse` (optional) |

### Entities

| Entity | Key Fields | Description |
|--------|-----------|-------------|
| `Supplier` | id, company_id, name, contact, phone, email, terms | Vendor/supplier record |
| `PurchaseOrder` | id, supplier_id, status, total_uzs, total_usd, warehouse_id | Purchase order header |
| `PurchaseOrderItem` | po_id, product_id, quantity, unit_cost, currency | PO line items |
| `GoodsReceipt` | id, po_id, received_at, received_by | Goods received against PO |
| `SupplierDebt` | supplier_id, amount, currency, due_date | Amount owed to supplier |

### Status Flow

```
PurchaseOrder:  DRAFT → APPROVED → PARTIALLY_RECEIVED → RECEIVED → CLOSED
                                              ↓
                                          CANCELLED
```

### Business Rules

| Rule | Description |
|------|-------------|
| PO-001 | PO must reference an active supplier |
| PO-002 | PO approval required for orders above configurable threshold |
| PO-003 | Goods receipt creates inventory batch (FIFO) in target warehouse |
| PO-004 | Partial receipts allowed; PO status tracks received percentage |
| PO-005 | Unit cost on receipt updates product cost basis |
| PO-006 | Supplier debt created on goods receipt (accounts payable) |
| PO-007 | USD-denominated POs store both USD and UZS amounts at receipt-time rate |
| PO-008 | PO cannot be cancelled after goods receipt |
| PO-009 | Auto-suggest reorder when stock < reorder point (configurable per product) |

### Permissions

| Permission | Roles |
|------------|-------|
| `purchasing.supplier.view` | All roles |
| `purchasing.supplier.manage` | Admin, Manager |
| `purchasing.po.create` | Manager, Warehouse Keeper |
| `purchasing.po.approve` | Manager, Admin |
| `purchasing.po.receive` | Warehouse Keeper |
| `purchasing.debt.view` | Manager, Admin |
| `purchasing.debt.pay` | Admin |

### WebSocket Events

| Event | Trigger |
|-------|---------|
| `purchase_order.created` | New PO created |
| `purchase_order.approved` | PO approved |
| `purchase_order.received` | Goods received |
| `supplier.debt_changed` | Supplier debt balance change |

---

## 4. Module: Telegram Bot

### Module ID: `telegram`

| Property | Value |
|----------|-------|
| Timeline | Q4 2026 |
| Priority | Medium |
| Dependencies | `notifications`, event bus |
| Architecture | Separate microservice |

### Configuration (Per Company)

| Setting | Description |
|---------|-------------|
| `bot_token` | Telegram Bot API token (encrypted) |
| `enabled_notifications` | Which event types to forward |
| `notification_recipients` | User-to-Telegram chat ID mapping |
| `daily_summary_time` | Scheduled daily report time |
| `low_stock_threshold` | Global default; override per product |

### Bot Commands

| Command | Permission | Response |
|---------|------------|----------|
| `/start` | Public | Welcome + link to ERP account |
| `/link {code}` | Authenticated | Link Telegram to ERP user |
| `/sales today` | `sales.view` | Today's sales summary |
| `/sales week` | `sales.view` | This week's sales summary |
| `/stock {product}` | `products.view` | Product stock level |
| `/debt {customer}` | `customers.view` | Customer debt balance |
| `/lowstock` | `inventory.view` | Products below threshold |
| `/help` | Public | Command list |

### Notification Events

| Event | Message Format |
|-------|---------------|
| Sale completed | "Sale #{number}: {amount} UZS — {cashier}" |
| Low stock | "Low stock: {product} — {quantity} remaining" |
| Payment received | "Payment: {amount} UZS from {customer}" |
| Daily summary | Formatted daily report with KPIs |
| Large sale alert | "Large sale: {amount} UZS (threshold: {threshold})" |

### Business Rules

| Rule | Description |
|------|-------------|
| TG-001 | User must link Telegram account via one-time code |
| TG-002 | Bot only responds to linked, authorized users |
| TG-003 | Notifications scoped to user's company and permissions |
| TG-004 | Rate limit: max 30 messages/minute per company |
| TG-005 | Daily summary sent only to users with `dashboard.view` permission |

---

## 5. Module: SMS Gateway

### Module ID: `sms`

| Property | Value |
|----------|-------|
| Timeline | Q4 2026 |
| Priority | Medium |
| Dependencies | `customers`, `debt`, `notifications` |

### Configuration (Per Company)

| Setting | Description |
|---------|-------------|
| `provider` | `playmobile`, `eskiz`, `twilio` |
| `api_credentials` | Provider API key/secret (encrypted) |
| `sender_id` | SMS sender name/number |
| `enabled_types` | Which notification types send SMS |
| `monthly_limit` | Max SMS per month (cost control) |

### SMS Templates

| Template ID | Trigger | Content |
|-------------|---------|---------|
| `DEBT_REMINDER` | Scheduled / manual | "Hurmatli {customer}, {amount} UZS qarzingiz bor. Muddati: {due_date}" |
| `PAYMENT_CONFIRM` | Payment received | "{customer}, {amount} UZS to'lov qabul qilindi. Qarz: {balance}" |
| `OTP_LOGIN` | 2FA request | "ERP tasdiqlash kodi: {code}. 5 daqiqa amal qiladi." |
| `SALE_RECEIPT` | Sale completed (opt-in) | "Xaridingiz: {amount} UZS. Chek #{sale_number}" |

### Business Rules

| Rule | Description |
|------|-------------|
| SMS-001 | Customer phone number required for SMS |
| SMS-002 | Customer can opt out of marketing SMS |
| SMS-003 | OTP SMS cannot be opted out |
| SMS-004 | Monthly limit enforced; admin notified at 80% |
| SMS-005 | All sent SMS logged with delivery status |
| SMS-006 | Debt reminder: max 1 SMS per customer per week |
| SMS-007 | SMS content must be in Uzbek (Latin) by default |

---

## 6. Module: CRM

### Module ID: `crm`

| Property | Value |
|----------|-------|
| Timeline | 2027 H1 |
| Priority | Medium |
| Dependencies | `customers`, `sales`, mobile client |

### Entities

| Entity | Key Fields | Description |
|--------|-----------|-------------|
| `Lead` | id, name, phone, source, status, assigned_to | Potential customer |
| `Interaction` | id, customer_id/lead_id, type, notes, date, user_id | Call, visit, meeting log |
| `FollowUp` | id, customer_id, due_date, notes, status, assigned_to | Scheduled follow-up task |
| `CustomerTag` | customer_id, tag | Segmentation tag |
| `PipelineStage` | id, name, order, company_id | Customizable pipeline stages |

### Pipeline Stages (Default)

```
New Lead → Contacted → Qualified → Proposal → Negotiation → Won / Lost
```

### Business Rules

| Rule | Description |
|------|-------------|
| CRM-001 | Lead converted to Customer creates customer record; lead archived |
| CRM-002 | Interactions are append-only (immutable log) |
| CRM-003 | Follow-up overdue triggers notification to assigned rep |
| CRM-004 | Customer tags are free-form; max 10 tags per customer |
| CRM-005 | Pipeline stages customizable per company |
| CRM-006 | Won lead must reference first sale within 90 days |
| CRM-007 | Lost lead requires reason (dropdown) |

### Permissions

| Permission | Roles |
|------------|-------|
| `crm.lead.view` | Manager, Sales Rep |
| `crm.lead.manage` | Manager, Sales Rep |
| `crm.interaction.create` | Manager, Sales Rep |
| `crm.followup.manage` | Manager, Sales Rep |
| `crm.pipeline.configure` | Admin, Manager |
| `crm.report` | Manager, Admin |

---

## 7. Module: Accounting (General Ledger)

### Module ID: `accounting`

| Property | Value |
|----------|-------|
| Timeline | 2027 H1 |
| Priority | High |
| Dependencies | `sales`, `payments`, `purchasing`, `currency` |

### Entities

| Entity | Key Fields | Description |
|--------|-----------|-------------|
| `Account` | id, code, name, type, parent_id, company_id | Chart of accounts |
| `JournalEntry` | id, date, description, reference_type, reference_id | Journal header |
| `JournalLine` | entry_id, account_id, debit, credit, currency | Debit/credit lines |
| `FiscalPeriod` | id, start_date, end_date, status | Accounting period |
| `AutoJournalRule` | id, event_type, debit_account, credit_account | Automation mapping |

### Chart of Accounts (Default Template)

| Code | Account | Type |
|------|---------|------|
| 1000 | Cash and Bank | Asset |
| 1100 | Accounts Receivable | Asset |
| 1200 | Inventory | Asset |
| 2000 | Accounts Payable | Liability |
| 2100 | Tax Payable | Liability |
| 3000 | Owner's Equity | Equity |
| 4000 | Sales Revenue | Revenue |
| 5000 | Cost of Goods Sold | Expense |
| 6000 | Operating Expenses | Expense |

### Auto-Journal Rules

| Trigger Event | Debit Account | Credit Account |
|---------------|---------------|----------------|
| Sale completed | Accounts Receivable (1100) | Sales Revenue (4000) |
| COGS recognition | COGS (5000) | Inventory (1200) |
| Payment received | Cash (1000) | Accounts Receivable (1100) |
| Goods received | Inventory (1200) | Accounts Payable (2000) |
| Supplier payment | Accounts Payable (2000) | Cash (1000) |
| Exchange rate gain/loss | Cash/Receivable | FX Gain/Loss |

### Business Rules

| Rule | Description |
|------|-------------|
| ACC-001 | Every journal entry must balance (total debits = total credits) |
| ACC-002 | Journal entries are immutable (append-only) |
| ACC-003 | Corrections via reversing entries only |
| ACC-004 | Auto-journal rules generate entries on domain events |
| ACC-005 | Manual journal entries require Admin permission |
| ACC-006 | Fiscal period must be open for new entries |
| ACC-007 | Period close locks all entries in that period |
| ACC-008 | Multi-currency entries store both UZS and USD amounts |
| ACC-009 | Trial balance must balance at all times |
| ACC-010 | Chart of accounts customizable per company |

### Reports

| Report | Description |
|--------|-------------|
| Trial Balance | All account balances for a period |
| Profit & Loss | Revenue - COGS - Expenses for a period |
| Balance Sheet | Assets, Liabilities, Equity as of date |
| Cash Flow Statement | Cash inflows and outflows |
| Tax Summary | VAT collected and payable |
| Account Ledger | All entries for a specific account |
| Journal Report | All entries for a period |

### Permissions

| Permission | Roles |
|------------|-------|
| `accounting.view` | Manager, Admin |
| `accounting.journal.create` | Admin |
| `accounting.journal.reverse` | Admin |
| `accounting.period.close` | Admin |
| `accounting.chart.manage` | Admin |
| `accounting.report` | Manager, Admin |

---

## 8. Module: Marketplace

### Module ID: `marketplace`

| Property | Value |
|----------|-------|
| Timeline | 2027 H2 |
| Priority | Low |
| Dependencies | `products`, `inventory`, `sales`, `customers` |
| Architecture | Separate microservice + web frontend |

### Entities

| Entity | Key Fields | Description |
|--------|-----------|-------------|
| `MarketplaceListing` | product_id, is_published, web_price, description | Public listing |
| `OnlineOrder` | id, customer_id, status, items[], total | Customer web order |
| `OnlineOrderItem` | order_id, product_id, quantity, price | Order line items |
| `PaymentTransaction` | order_id, provider, amount, status, external_id | Payment gateway record |

### Order Status Flow

```
OnlineOrder:  PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                    ↓
                CANCELLED / REFUNDED
```

### Business Rules

| Rule | Description |
|------|-------------|
| MKT-001 | Only products with `is_published = true` appear on marketplace |
| MKT-002 | Web price may differ from in-store price |
| MKT-003 | Stock reservation on order confirmation (15-minute hold) |
| MKT-004 | Confirmed orders create ERP sale record |
| MKT-005 | Payment processed by external gateway (Click/Payme) |
| MKT-006 | Marketplace never stores payment card data (PCI) |
| MKT-007 | Customer account links marketplace profile to ERP customer |
| MKT-008 | Cancelled orders release stock reservation |

---

## 9. Module: AI Analytics

### Module ID: `ai_analytics`

| Property | Value |
|----------|-------|
| Timeline | 2027 H2+ |
| Priority | Low |
| Dependencies | 12+ months operational data, `dashboard`, `reports` |
| Architecture | Python microservice |

### Capabilities

| Feature | Input Data | Output |
|---------|-----------|--------|
| Sales forecast | 12+ months daily sales | 30/60/90-day forecast per product/category |
| Demand planning | Sales velocity + stock levels | Recommended reorder quantity and timing |
| Churn detection | Customer purchase frequency | Risk score per customer |
| Price optimization | Sales volume at different price points | Suggested price range |
| Anomaly detection | Transaction patterns | Flagged unusual transactions |
| NL query | Natural language question | SQL query → formatted answer |
| Weekly insights | All KPIs | AI-generated narrative summary |

### Business Rules

| Rule | Description |
|------|-------------|
| AI-001 | Minimum 6 months data required for any prediction |
| AI-002 | Predictions are advisory only; never auto-execute |
| AI-003 | AI module disabled by default; opt-in per company |
| AI-004 | Data used for AI never leaves company scope |
| AI-005 | AI insights marked with confidence level |
| AI-006 | Historical predictions stored for accuracy tracking |

---

## 10. Module Registration Pattern

Every future module registers with the module registry:

| Field | Example |
|-------|---------|
| `module_id` | `accounting` |
| `name` | `Accounting (General Ledger)` |
| `version` | `1.0.0` |
| `is_core` | `false` |
| `is_enabled` | `false` (default) |
| `dependencies` | `["sales", "payments", "currency"]` |
| `permissions` | `["accounting.view", "accounting.journal.create", ...]` |
| `settings_schema` | JSON Schema for module-specific settings |

---

## 11. Related Documents

- [EXPANSION_ROADMAP.md](./EXPANSION_ROADMAP.md)
- [INTEGRATION_POINTS.md](./INTEGRATION_POINTS.md)
- [../03-product/MODULE_CATALOG.md](../03-product/MODULE_CATALOG.md)
- [../01-governance/MODULAR_ARCHITECTURE.md](../01-governance/MODULAR_ARCHITECTURE.md)
- [../02-business/BUSINESS_RULES.md](../02-business/BUSINESS_RULES.md)
