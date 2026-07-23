# Domain Model

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Bounded Contexts

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Identity   │  │  Company    │  │  Catalog    │
│  & Access   │  │  Management │  │  (Products) │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
┌──────▼────────────────▼────────────────▼──────┐
│              Inventory & FIFO                  │
└──────────────────────┬────────────────────────┘
                       │
┌──────────────────────▼────────────────────────┐
│         Sales & Commercial                    │
│  (Customers, Sales, Debt, Currency)           │
└──────────────────────┬────────────────────────┘
                       │
┌──────────────────────▼────────────────────────┐
│    Analytics (Dashboard, Reports)           │
└───────────────────────────────────────────────┘
```

---

## 2. Core Entities

### 2.1 Identity & Access

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| **User** | id, email, passwordHash, fullName, status, blockedAt | → Roles, Sessions, Devices |
| **Role** | id, name, description, isSystem | → Permissions |
| **Permission** | id, code, module, description | — |
| **Session** | id, userId, deviceId, tokenHash, ipAddress, expiresAt, revokedAt | → User, Device |
| **Device** | id, userId, name, platform, osVersion, ipAddress, status, lastSeenAt | → User, Sessions |

### 2.2 Company Management

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| **Company** | id, name, code, status, settings | → Branches, Users |
| **Branch** | id, companyId, name, address, isDefault | → Company |
| **CompanyModule** | companyId, moduleId, enabled | → Company, Module |
| **UserCompany** | userId, companyId, roleId, branchId | → User, Company, Role |

### 2.3 Catalog

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| **Product** | id, companyId, sku, barcode, name, categoryId, status | → Category, Prices, Batches |
| **ProductCategory** | id, companyId, name, parentId | → Products |
| **ProductPrice** | productId, purchasePriceUzs, purchasePriceUsd, salePriceUzs, salePriceUsd | → Product |

### 2.4 Inventory & FIFO

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| **InventoryBatch** | id, companyId, productId, quantity, remainingQty, unitCostUzs, unitCostUsd, receivedAt | → Product |
| **InventoryMovement** | id, batchId, type, quantity, referenceType, referenceId, performedBy | → Batch |

**Movement Types**: `RECEIPT`, `SALE`, `ADJUSTMENT`, `RETURN`, `TRANSFER`

### 2.5 Currency

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| **ExchangeRate** | id, companyId, rate (UZS per USD), effectiveFrom, setBy | → Company |

### 2.6 Sales & Commercial

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| **Customer** | id, companyId, name, phone, address, partnershipStartDate, totalDebtUzs, totalDebtUsd | → Sales, Payments |
| **Sale** | id, companyId, customerId, cashierId, totalUzs, totalUsd, originalCurrency, exchangeRateUsed, status | → SaleItems, FifoAllocations |
| **SaleItem** | id, saleId, productId, quantity, unitPrice, currency, lineTotal | → Product |
| **SaleFifoAllocation** | id, saleItemId, batchId, quantity, unitCostUzs, unitCostUsd | → Batch, SaleItem |
| **DebtPayment** | id, companyId, customerId, amount, currency, exchangeRateUsed, paymentType, receivedBy | → Customer |

**Payment Types**: `FULL`, `PARTIAL`

### 2.7 System

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| **AuditLog** | id, companyId, userId, action, entityType, entityId, oldValue, newValue, ipAddress | — |
| **Notification** | id, userId, type, title, body, readAt, createdAt | → User |
| **Module** | id, code, name, enabled, version | — |

---

## 3. Value Objects

| Value Object | Fields | Rules |
|--------------|--------|-------|
| **Money** | amount: Decimal, currency: UZS \| USD | Never float; use Decimal type |
| **Quantity** | value: Decimal, unit: string | Must be > 0 for sales |
| **ExchangeRateSnapshot** | rate: Decimal, capturedAt: DateTime | Immutable once attached to transaction |
| **Sku** | value: string | Unique per company |
| **Barcode** | value: string | Optional, unique per company if set |

---

## 4. Aggregate Roots

| Aggregate | Root Entity | Invariants |
|-----------|-------------|------------|
| Product | Product | SKU unique per company; prices >= 0 |
| InventoryBatch | InventoryBatch | remainingQty >= 0; remainingQty <= quantity |
| Sale | Sale | Total = sum(items); FIFO allocations match item quantities |
| Customer | Customer | totalDebt = calculated from transactions, not manually set |
| Company | Company | At least one admin user; isolation enforced |

---

## 5. Domain Events

| Event | Payload | Subscribers |
|-------|---------|-------------|
| ProductCreated | productId, companyId | Inventory, Dashboard |
| StockReceived | batchId, productId, quantity | FIFO, Dashboard |
| SaleCompleted | saleId, items[], total | Inventory, Debt, Dashboard, Audit |
| PaymentReceived | paymentId, customerId, amount | Debt, Dashboard, Audit |
| ExchangeRateUpdated | companyId, newRate | Dashboard, Clients |
| UserBlocked | userId | Session (revoke all) |
| DeviceBlocked | deviceId | Session (revoke device sessions) |
| ModuleDisabled | moduleId | All clients (hide menu) |

---

## 6. Related Documents

- [BUSINESS_RULES.md](./BUSINESS_RULES.md)
- [../05-database/ERD_OVERVIEW.md](../05-database/ERD_OVERVIEW.md)
- [../05-database/SCHEMA_DESIGN.md](../05-database/SCHEMA_DESIGN.md)
