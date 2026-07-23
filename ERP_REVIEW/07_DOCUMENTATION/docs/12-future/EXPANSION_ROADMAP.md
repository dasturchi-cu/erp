# Expansion Roadmap

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Planning |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

This document outlines the long-term expansion plan for the ERP platform beyond the core modules delivered in Phases 1–7. Each expansion area represents a significant business capability that builds on the existing modular architecture, shared database, and real-time infrastructure.

**Guiding principle**: Expand only after core platform stability is proven with pilot companies. Each module follows the same pattern — server-side business logic, module registry enable/disable, RBAC integration, audit logging, and real-time WebSocket events.

---

## 2. Expansion Timeline Overview

```
2026 Q2-Q3          2026 Q4           2027 H1           2027 H2+
─────────────       ─────────         ─────────         ─────────
Core Platform  →    Notifications  →  CRM           →  Marketplace
Desktop + Mobile    Multi-warehouse    Accounting (GL)   AI Analytics
macOS Desktop       Purchase Orders    Supplier Mgmt     Advanced BI
                    Telegram Bot       Offline Mode
                    SMS Gateway
```

---

## 3. Expansion Modules

### 3.1 Multi-Warehouse Management

**Timeline**: Q3 2026 | **Priority**: High

| Capability | Description |
|------------|-------------|
| Multiple warehouses per company | Each with independent stock levels |
| Inter-warehouse transfers | Stock movement between locations |
| Warehouse-scoped reports | Stock and sales per warehouse |
| Branch-warehouse mapping | Link branches to warehouse locations |
| Transfer approval workflow | Manager approves inter-warehouse moves |

**Business value**: Companies like Lantian and Xitoy Tovar operate multiple storage locations. Currently all stock is treated as a single pool.

**Dependencies**: Inventory module (Phase 2), branch management (Phase 1).

---

### 3.2 Supplier and Purchase Order Management

**Timeline**: Q4 2026 | **Priority**: High

| Capability | Description |
|------------|-------------|
| Supplier registry | Contact, terms, payment history |
| Purchase orders | Create, approve, receive |
| Goods receiving | Link received goods to inventory batches |
| Supplier debt (accounts payable) | Track amounts owed to suppliers |
| Purchase price history | Track cost changes over time |
| Auto-reorder suggestions | Based on stock levels and sales velocity |

**Business value**: Complete the buy-sell cycle. Currently only the sell side (sales) is managed. Import-heavy companies (Xitoy Tovar) need purchase tracking with USD pricing.

**Dependencies**: Inventory module, currency module, multi-warehouse (optional).

---

### 3.3 Telegram Bot Notifications

**Timeline**: Q4 2026 | **Priority**: Medium

| Capability | Description |
|------------|-------------|
| Sale notifications | Real-time alert on completed sales |
| Low stock alerts | When product stock falls below threshold |
| Daily summary | End-of-day sales and receivables report |
| Debt reminders | Customer payment due notifications |
| Admin commands | `/stock {product}`, `/sales today`, `/debt {customer}` |
| Multi-company | Bot scoped per company; user links Telegram account |

**Business value**: Uzbekistan has near-universal Telegram adoption. Business owners want instant mobile notifications without opening the ERP app.

**Architecture**: Separate Node.js microservice connecting to Telegram Bot API. Subscribes to ERP event bus (Redis pub/sub). See [INTEGRATION_POINTS.md](./INTEGRATION_POINTS.md).

**Dependencies**: Notification framework (Phase 4), event bus.

---

### 3.4 SMS Gateway

**Timeline**: Q4 2026 | **Priority**: Medium

| Capability | Description |
|------------|-------------|
| Payment reminders | SMS to customers with outstanding debt |
| OTP verification | Two-factor authentication via SMS |
| Sale confirmation | SMS receipt to customer (optional) |
| Low stock alerts | SMS to warehouse manager |
| Bulk SMS campaigns | Marketing messages to customer segments |
| Delivery status | SMS notification on order status change |

**Business value**: Not all customers use Telegram. SMS reaches basic phone users for debt collection — critical in Uzbekistan's wholesale market.

**Provider options**: Playmobile (local Uzbek), Eskiz.uz, or Twilio (international).

**Dependencies**: Customer module, debt module, notification framework.

---

### 3.5 CRM Module

**Timeline**: 2027 H1 | **Priority**: Medium

| Capability | Description |
|------------|-------------|
| Lead management | Track potential customers before first sale |
| Customer interaction log | Calls, visits, meetings, notes |
| Sales pipeline | Lead → prospect → customer stages |
| Follow-up reminders | Scheduled tasks for sales reps |
| Customer segmentation | Tags, groups, VIP classification |
| Activity timeline | Full history per customer |
| Sales rep assignment | Assign customers to field sales reps |

**Business value**: Move beyond transactional customer records to relationship management. Field sales teams (mobile) need interaction tracking.

**Dependencies**: Customer module, mobile client, notification framework.

---

### 3.6 Accounting (General Ledger)

**Timeline**: 2027 H1 | **Priority**: High

| Capability | Description |
|------------|-------------|
| Chart of accounts | Configurable account hierarchy |
| Double-entry bookkeeping | Every transaction creates balanced journal entries |
| Auto-journal from sales | Sale → debit receivable, credit revenue |
| Auto-journal from payments | Payment → debit cash, credit receivable |
| Auto-journal from purchases | PO receive → debit inventory, credit payable |
| Trial balance | Real-time account balances |
| Profit & loss statement | Revenue - COGS - expenses |
| Balance sheet | Assets = liabilities + equity |
| Tax reporting | VAT/sales tax summaries (Uzbekistan tax codes) |
| Period closing | Month-end close with lock |
| Multi-currency accounting | UZS and USD ledgers |

**Business value**: Currently the ERP tracks sales and debt but not full financial accounting. Companies need P&L and balance sheet for tax compliance and business decisions.

**Architecture**: Immutable journal entries (append-only). Chart of accounts per company. Auto-journal rules triggered by domain events from sales, payments, and purchases modules.

**Dependencies**: Sales, payments, currency modules. Purchase orders (for COGS).

---

### 3.7 Marketplace

**Timeline**: 2027 H2 | **Priority**: Low

| Capability | Description |
|------------|-------------|
| Public product catalog | Web-facing product listings |
| Online ordering | Customers place orders via web portal |
| Order management | Orders flow into ERP as pending sales |
| Inventory sync | Marketplace stock reflects ERP stock in real-time |
| Customer self-service | View order history, debt balance |
| Payment integration | Click, Payme, Uzcard (Uzbekistan payment systems) |
| Multi-company marketplace | Optional B2B marketplace across companies |

**Business value**: Enable online sales channel for companies wanting e-commerce presence without separate platform.

**Architecture**: Separate microservice with its own web frontend. Reads product catalog and stock from ERP API. Writes orders back via integration API. See [INTEGRATION_POINTS.md](./INTEGRATION_POINTS.md).

**Dependencies**: Products, inventory, sales, customer modules. Payment gateway integrations.

---

### 3.8 AI Analytics

**Timeline**: 2027 H2+ | **Priority**: Low

| Capability | Description |
|------------|-------------|
| Sales forecasting | Predict future sales by product/category |
| Demand planning | Optimal stock levels based on historical patterns |
| Customer churn prediction | Identify customers reducing purchase frequency |
| Price optimization | Suggest optimal pricing based on margin and volume |
| Anomaly detection | Flag unusual transactions (fraud, errors) |
| Natural language queries | "What were top 10 products last month?" |
| Automated insights | Weekly AI-generated business summary |
| Seasonal trend analysis | Identify seasonal patterns in sales data |

**Business value**: Transform accumulated ERP data into actionable intelligence. Business owners currently rely on manual analysis of reports.

**Architecture**: Python microservice with scheduled data pipeline (PostgreSQL → feature store). LLM integration for natural language queries. REST API consumed by dashboard widgets.

**Dependencies**: 12+ months of operational data. Dashboard module. Reporting module.

---

## 4. Cross-Cutting Expansion Capabilities

### 4.1 Offline Mode

**Timeline**: 2027 | **Priority**: Medium

See [../09-realtime/OFFLINE_STRATEGY.md](../09-realtime/OFFLINE_STRATEGY.md) for detailed Phase 2 offline plans.

### 4.2 Multi-Language Support

**Timeline**: 2027 | **Priority**: Medium

| Language | Priority | Scope |
|----------|----------|-------|
| Uzbek (Latin) | P0 | Full UI |
| Russian | P1 | Full UI |
| English | P2 | Admin and reports |

### 4.3 Advanced Reporting / BI

**Timeline**: 2027 | **Priority**: Medium

| Capability | Description |
|------------|-------------|
| Custom report builder | Drag-and-drop field selection |
| Scheduled reports | Email/Telegram delivery on schedule |
| Data export API | External BI tools (Metabase, Superset) |
| Comparative analysis | Period-over-period, branch-over-branch |

### 4.4 Web Client (PWA)

**Timeline**: 2027 | **Priority**: Low

Lightweight browser-based access sharing React components with Electron desktop. Progressive Web App with offline read capability.

---

## 5. Expansion Prioritization Matrix

| Module | Business Value | Effort | Dependencies Met | Score |
|--------|---------------|--------|------------------|-------|
| Multi-warehouse | High | Medium | After Phase 2 | **9** |
| Purchase orders | High | High | After Phase 2 | **8** |
| Accounting (GL) | High | Very High | After Phase 3 | **8** |
| Telegram bot | Medium | Low | After Phase 4 | **7** |
| SMS gateway | Medium | Low | After Phase 4 | **7** |
| CRM | Medium | Medium | After Phase 3 | **6** |
| Offline mode | Medium | High | After Phase 6 | **6** |
| Marketplace | Low | Very High | After Phase 3 | **4** |
| AI analytics | Low | Very High | 12+ months data | **3** |
| Web PWA | Low | Medium | After Phase 5 | **3** |

---

## 6. Expansion Architecture Principles

Every expansion module must adhere to:

| Principle | Requirement |
|-----------|-------------|
| Module registry | Register as enable/disable module |
| RBAC integration | Define permissions; integrate with existing RBAC |
| Company isolation | All data scoped by `company_id` |
| Audit logging | All mutations logged in audit trail |
| Real-time events | State changes emit WebSocket events |
| API-first | REST API before UI |
| Migration safety | Backward-compatible database migrations |
| Documentation | Module spec in [FUTURE_MODULES.md](./FUTURE_MODULES.md) |
| Integration hooks | External access via [INTEGRATION_POINTS.md](./INTEGRATION_POINTS.md) |

---

## 7. Revenue and Licensing Implications

| Module | Licensing Model |
|--------|----------------|
| Core (Phases 1–7) | Base subscription |
| Multi-warehouse | Base (included) |
| Purchase orders | Base (included) |
| Telegram / SMS | Base (included; SMS may have per-message cost) |
| CRM | Add-on module |
| Accounting | Add-on module (premium) |
| Marketplace | Add-on module (premium) + transaction fee (optional) |
| AI analytics | Add-on module (premium) |

Module enable/disable managed via admin panel module registry. Billing integration is a future consideration.

---

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | Delays core delivery | Strict phase gates; no expansion until core stable |
| Accounting complexity | Underestimated effort | Hire/consult accounting domain expert |
| AI data insufficient | Poor predictions | Require 12+ months data before AI module |
| Marketplace security | Payment fraud | PCI compliance; payment gateway handles card data |
| SMS cost overrun | Budget impact | Rate limits; admin approval for bulk SMS |
| Integration maintenance | Ongoing burden | Standard integration API; documented hooks |

---

## 9. Related Documents

- [FUTURE_MODULES.md](./FUTURE_MODULES.md)
- [INTEGRATION_POINTS.md](./INTEGRATION_POINTS.md)
- [../03-product/PRODUCT_ROADMAP.md](../03-product/PRODUCT_ROADMAP.md)
- [../03-product/FEATURE_PRIORITIZATION.md](../03-product/FEATURE_PRIORITIZATION.md)
- [../03-product/MODULE_CATALOG.md](../03-product/MODULE_CATALOG.md)
- [../01-governance/MODULAR_ARCHITECTURE.md](../01-governance/MODULAR_ARCHITECTURE.md)
