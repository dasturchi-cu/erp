# Glossary

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## Business Terms (Uzbek / English)

| Term (UZ) | English | Definition |
|-----------|---------|------------|
| Mahsulot | Product | Sellable or stockable item with SKU, barcode, pricing |
| Ombor | Warehouse / Inventory | Physical stock location and quantity on hand |
| Sotuv | Sale | Transaction where goods leave inventory for payment |
| Qarz / Qarzdorlik | Debt / Accounts Receivable | Outstanding balance owed by a customer |
| To'lov | Payment | Partial or full settlement of customer debt |
| Kurs | Exchange Rate | UZS per 1 USD at time of transaction |
| Partiya | Batch / Lot | FIFO inventory batch with quantity and cost |
| Mijoz | Customer | Business or individual buyer with purchase history |
| Kassir | Cashier | Role responsible for POS and payment collection |
| Omborchi | Warehouse Keeper | Role responsible for stock receipts and adjustments |
| Menejer | Manager | Role with reporting and operational oversight |
| Ulgurji savdo | Wholesale | Bulk B2B sales |
| Chakana savdo | Retail | B2C or small-quantity sales |
| Olish narxi | Purchase Price | Cost price (UZS and USD) |
| Sotish narxi | Selling Price | Retail/wholesale price (UZS and USD) |

---

## Technical Terms

| Term | Definition |
|------|------------|
| **Company Isolation** | Data segregation ensuring one company cannot access another's records |
| **Tenant** | Synonym for Company in multi-tenant architecture |
| **FIFO** | First-In-First-Out inventory costing; oldest batch consumed first |
| **RLS** | Row-Level Security — PostgreSQL policy enforcing tenant isolation |
| **RBAC** | Role-Based Access Control |
| **Permission** | Atomic action grant (e.g., `sales.create`, `inventory.adjust`) |
| **Module** | Functional package (Sales, Inventory, etc.) that can be enabled/disabled |
| **Session** | Authenticated user connection with token, device, and expiry |
| **Device** | Registered client instance (desktop, phone, tablet) with trust status |
| **Domain Event** | Immutable record of a business state change |
| **WebSocket (WSS)** | Persistent bidirectional channel for real-time updates |
| **JWT** | JSON Web Token for stateless authentication |
| **Refresh Token** | Long-lived token used to obtain new access tokens |
| **Immutable Ledger** | Financial records that are never updated, only appended |
| **Exchange Rate Snapshot** | Frozen rate stored with each transaction for audit |
| **Branch** | Sub-organization unit within a company (store, warehouse) |
| **SKU** | Stock Keeping Unit — unique product identifier |
| **POS** | Point of Sale — cashier interface for retail transactions |

---

## Role Definitions

| Role | Primary Responsibilities |
|------|-------------------------|
| **Admin** | System-wide and company administration, user/device/session control, module management |
| **Manager (Menejer)** | Reports, pricing oversight, debt management, inventory approval |
| **Cashier (Kassir)** | Sales, payments, customer lookup |
| **Warehouse Keeper (Omborchi)** | Stock receipts, adjustments, batch management |

---

## Currency Codes

| Code | Name |
|------|------|
| UZS | Uzbekistani Som |
| USD | United States Dollar |

---

## Event Naming Convention

```
{module}.{entity}.{action}

Examples:
  product.created
  sale.completed
  payment.received
  currency.rate_updated
  module.disabled
  session.terminated
```

---

## Abbreviations

| Abbr | Meaning |
|------|---------|
| ERP | Enterprise Resource Planning |
| API | Application Programming Interface |
| ERD | Entity Relationship Diagram |
| CI/CD | Continuous Integration / Continuous Deployment |
| RPO | Recovery Point Objective |
| RTO | Recovery Time Objective |
| TLS | Transport Layer Security |
| MD3 | Material Design 3 |
| PDF | Portable Document Format |
| CSV | Comma-Separated Values |
