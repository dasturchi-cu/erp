# ERP System Validation Report

**Date:** 2026-06-18  
**Phase:** ERP System Validation  
**Method:** Static code audit + end-to-end path tracing (UI → store → API → service → Prisma)  
**Runtime E2E:** Not executed — Node.js/npm unavailable in validation environment; findings based on source analysis and prior integration work  
**Scope:** Integrated system (desktop + backend Phases 1–3). No new modules or features added.

**Demo credentials:** `admin@erp.uz` / `Admin123!` · Company `MKT-TAS`

---

## Executive summary

| Metric | Value |
|--------|-------|
| Flows tested | 11 |
| **PASS** | 9 |
| **FAIL** | 2 |
| **Flow pass rate** | **82%** |
| Critical backend defects | 3 |
| Critical frontend defects | 0 |
| Blocking production defects | 2 (Debt Payment, Return) |

The integrated system supports the primary cashier workflow (login → catalog → receive stock → cash/credit sale → void → currency) in sequential single-user use. **Debt payment** and **return** flows have confirmed backend logic defects that corrupt balances or block partial operations. **FIFO** works in the happy path but lacks row-level locking under concurrency.

---

## Validation matrix

| # | Flow | Verdict | Severity | Layer |
|---|------|---------|----------|-------|
| 1 | Login | **PASS** | — | FE + BE |
| 2 | Categories | **PASS** | — | FE + BE |
| 3 | Products | **PASS** | Medium (USD edit) | FE + BE |
| 4 | Inventory Receive | **PASS** | Low (note field) | FE + BE |
| 5 | FIFO Allocation | **PASS** | High (concurrency) | BE |
| 6 | Cash Sale | **PASS** | Medium (API validation) | FE + BE |
| 7 | Credit Sale | **PASS** | Low | FE + BE |
| 8 | Debt Payment | **FAIL** | **Critical** | BE |
| 9 | Return | **FAIL** | **Critical** | BE |
| 10 | Void | **PASS** | Medium (cache) | FE + BE |
| 11 | Currency Rate Change | **PASS** | Low | FE + BE |

---

## Flow details

### 1. Login

| Field | Detail |
|-------|--------|
| **Verdict** | **PASS** |
| **Trace** | `LoginPage` → `authStore.login` → `authApi.login` → `POST /auth/login` → `AuthService` → `user` / `session` / JWT |
| **Root cause** | N/A — flow complete |
| **Files affected** | `desktop/src/pages/LoginPage.tsx`, `desktop/src/stores/authStore.ts`, `desktop/src/api/services/authApi.ts`, `backend/src/modules/auth/api/auth.controller.ts`, `backend/src/modules/auth/application/auth.service.ts` |
| **Severity** | — |
| **Fix recommendation** | Optional: wire `authApi.refresh` on 401 before logout (`desktop/src/api/client.ts`). Deterministic default company when user has multiple memberships (`auth.service.ts`). |

**Evidence:** Seed provides `admin@erp.uz`; device info sent via `X-Device-Id`; company switch via `POST /auth/switch-company`.

---

### 2. Categories

| Field | Detail |
|-------|--------|
| **Verdict** | **PASS** |
| **Trace** | `CategoriesPage` → `categoriesApi.list/create` → `GET/POST /categories` → `CategoriesService` → `productCategory` |
| **Root cause** | N/A |
| **Files affected** | `desktop/src/features/products/CategoriesPage.tsx`, `desktop/src/api/services/catalogApi.ts`, `backend/src/modules/categories/application/categories.service.ts` |
| **Severity** | — |
| **Fix recommendation** | Optional: add edit/delete UI for `PATCH`/`DELETE` endpoints; prefetch categories in `DataBootstrap`. |

---

### 3. Products

| Field | Detail |
|-------|--------|
| **Verdict** | **PASS** |
| **Trace** | `ProductFormPage` / `ProductsPage` / `PriceManagementPage` → `inventoryStore` → `productsApi` → `ProductsService` → `product` + `productPrice` |
| **Root cause** | Create, list, edit (UZS), and initial stock → receive path work. **USD price blur** sends raw number: `updateProductPriceUsd` → `productsApi.update({ salePriceUsd })` without `toMoneyString()`, while DTO expects decimal string pattern. |
| **Files affected** | `desktop/src/stores/inventoryStore.ts`, `desktop/src/api/services/catalogApi.ts`, `desktop/src/features/products/PriceManagementPage.tsx`, `backend/src/modules/products/application/products.service.ts` |
| **Severity** | **Medium** (USD price edit may 400) |
| **Fix recommendation** | Add `salePriceUsd` to `catalogApi.update` with `toMoneyString()`. Store `categoryId` on `Product` entity to avoid name-based lookup on edit. |

---

### 4. Inventory Receive

| Field | Detail |
|-------|--------|
| **Verdict** | **PASS** |
| **Trace** | `InventoryReceivePage` → `inventoryStore.receiveStock` → `inventoryApi.receive` → `POST /inventory/receive` → `InventoryService.receive` → `createReceiptBatch` + movement |
| **Root cause** | Core receive works. Form `note` field collected but not passed to API. `unitCostUzs` derived as `priceUzs × 0.72` (UI heuristic). |
| **Files affected** | `desktop/src/features/inventory/InventoryReceivePage.tsx`, `desktop/src/stores/inventoryStore.ts`, `backend/src/modules/inventory/application/inventory.service.ts`, `backend/src/modules/inventory/application/inventory.helpers.ts` |
| **Severity** | **Low** |
| **Fix recommendation** | Pass `data.note` through `receiveStock` → `inventoryApi.receive({ note })`. Add optional cost input field. |

---

### 5. FIFO Allocation

| Field | Detail |
|-------|--------|
| **Verdict** | **PASS** (sequential use) |
| **Trace** | Sale create → `SalesService.executeCreateSale` → `deductFifo()` → `inventoryBatch.remainingQty` decrement + `saleFifoAllocation` rows. UI: `SaleDetailPage` FIFO tab ← `sale.fifoAllocations` from `GET /sales/:id`. |
| **Root cause** | FIFO ordering (`receivedAt ASC`, `createdAt ASC`) and COGS rollup implemented correctly in transactions. **No `SELECT FOR UPDATE`** on batches — concurrent sales for same SKU can oversell under race. |
| **Files affected** | `backend/src/modules/inventory/application/inventory.helpers.ts`, `backend/src/modules/sales/application/sales.service.ts`, `desktop/src/features/sales/SaleDetailPage.tsx`, `desktop/src/features/inventory/InventoryBatchesPage.tsx` |
| **Severity** | **High** (multi-terminal / concurrent POS) |
| **Fix recommendation** | Lock batch rows in `deductFifo` (`FOR UPDATE`) or use `SERIALIZABLE` isolation. After sale/void/return, call `inventoryStore.fetchAll()` on desktop to refresh batch cache. |

**Evidence:** `deductFifo` reads batches with `findMany` then updates without row locks (`inventory.helpers.ts` lines 26–50).

---

### 6. Cash Sale

| Field | Detail |
|-------|--------|
| **Verdict** | **PASS** |
| **Trace** | `SalesPosPage` → `PaymentDialog` (cash) → `salesApi.create` (`paymentType: CASH`, `amountPaidUzs`) → `POST /sales` → FIFO + sale record |
| **Root cause** | UI pre-fills `receivedUzs` with `Math.ceil(totalUzs)` (`PaymentDialog.tsx`), so integrated POS sends full payment. Backend `validateCreateSale()` does **not** enforce `amountPaidUzs >= total` for CASH — direct API call with `0` would still complete. |
| **Files affected** | `desktop/src/features/sales/SalesPosPage.tsx`, `desktop/src/features/sales/components/PaymentDialog.tsx`, `desktop/src/api/services/salesApi.ts`, `backend/src/modules/sales/application/sales.service.ts` (lines 815–827) |
| **Severity** | **Medium** (API integrity) |
| **Fix recommendation** | In `validateCreateSale()`, require `amountPaidUzs >= totalUzs` for CASH or auto-set paid = total. Post-sale: `fetchAll()` not only `fetchProducts()`. |

---

### 7. Credit Sale

| Field | Detail |
|-------|--------|
| **Verdict** | **PASS** |
| **Trace** | `SalesPosPage` + `CustomerPicker` → `salesApi.create` (`paymentType: CREDIT`, `customerId`) → `DebtService.applySaleCredit` → `customer.totalDebtUzs/Usd` + `debtHistory` |
| **Root cause** | N/A for standard credit path. UI correctly requires customer. `applySaleCredit` keeps UZS and USD debt in sync via `uzsToUsd(newDebtUzs, rate)`. |
| **Files affected** | `desktop/src/features/sales/SalesPosPage.tsx`, `backend/src/modules/sales/application/sales.service.ts`, `backend/src/modules/debt/application/debt.service.ts` |
| **Severity** | **Low** (no credit limit enforcement) |
| **Fix recommendation** | Optional: enforce `creditLimitUzs` if defined on customer model. Refetch customers after sale. |

---

### 8. Debt Payment

| Field | Detail |
|-------|--------|
| **Verdict** | **FAIL** |
| **Trace** | `RecordPaymentPage` → `customerStore.recordPayment` → `debtApi.recordPayment` → `POST /debt-payments` → `DebtPaymentsService` → `DebtService.applyPayment` |
| **Root cause** | **`applyPayment` updates only one debt leg.** UZS payment subtracts `totalDebtUzs` but leaves `totalDebtUsd` unchanged. USD payment subtracts `totalDebtUsd` but leaves `totalDebtUzs` unchanged. This diverges from `applySaleCredit` / `applyReturnCredit`, which recalculate both legs from canonical UZS. Customer profile shows inconsistent UZS vs USD debt after payment. |
| **Files affected** | `backend/src/modules/debt/application/debt.service.ts` (lines 100–156), `desktop/src/stores/customerStore.ts`, `desktop/src/features/customers/RecordPaymentPage.tsx` |
| **Severity** | **Critical** |
| **Fix recommendation** | After any payment, set `newDebtUzs` and `newDebtUsd = uzsToUsd(newDebtUzs, exchangeRate)` (single canonical UZS balance). Add integration test: credit sale → partial payment → assert both legs match. |

**Evidence:**

```123:131:backend/src/modules/debt/application/debt.service.ts
    if (params.currency === OriginalCurrency.UZS) {
      amountUzs = params.amount;
      amountUsd = uzsToUsd(params.amount, params.exchangeRate);
      newDebtUzs = Decimal.max(0, customer.totalDebtUzs.sub(params.amount));
    } else {
      amountUsd = params.amount;
      amountUzs = usdToUzs(params.amount, params.exchangeRate);
      newDebtUsd = Decimal.max(0, customer.totalDebtUsd.sub(params.amount));
    }
```

---

### 9. Return

| Field | Detail |
|-------|--------|
| **Verdict** | **FAIL** |
| **Trace** | Create: `CreateReturnPage` → `salesApi.createReturn` → `POST /sales/:id/returns`. Approve: `ReturnDetailPage` → `salesStore.approveReturn` → `POST /sales/returns/:id/approve` |
| **Root cause** | (1) **`approveReturn` always sets sale `status: RETURNED`** even for partial line returns — blocks further returns and mislabels sale. (2) **`executeCreateReturn` does not sum prior approved/pending return quantities** — multiple returns can exceed sold qty per product. (3) Frontend returns full line qty only (no per-line qty input). |
| **Files affected** | `backend/src/modules/sales/application/sales.service.ts` (lines 352–354, 721–767), `desktop/src/features/sales/CreateReturnPage.tsx`, `desktop/src/features/sales/ReturnDetailPage.tsx` |
| **Severity** | **Critical** |
| **Fix recommendation** | Introduce `PARTIALLY_RETURNED` or track returned qty per sale line. Before create, sum existing return items for same `productId` + `saleId`. Set sale `RETURNED` only when all qty returned. Add partial-qty UI on create return page. Refetch inventory/customers after approve. |

**Evidence:**

```352:355:backend/src/modules/sales/application/sales.service.ts
      await tx.sale.update({
        where: { id: existing.saleId },
        data: { status: SaleStatus.RETURNED },
      });
```

---

### 10. Void

| Field | Detail |
|-------|--------|
| **Verdict** | **PASS** |
| **Trace** | `SaleDetailPage` → `salesStore.voidSale` → `salesApi.void` → `POST /sales/:id/void` → `restoreFifoAllocations` + `reverseSaleCredit` |
| **Root cause** | Core void restores FIFO batches and reverses credit debt within `voidWindowHours`. Desktop does not refetch inventory/customers after void — stale UI until manual navigation or reload. |
| **Files affected** | `desktop/src/features/sales/SaleDetailPage.tsx`, `desktop/src/stores/salesStore.ts`, `backend/src/modules/sales/application/sales.service.ts`, `backend/src/modules/inventory/application/inventory.helpers.ts` |
| **Severity** | **Medium** (stale cache) |
| **Fix recommendation** | After void: `fetchAll()` + `fetchCustomers()`. Optional: confirm dialog. Block void when pending returns exist. |

---

### 11. Currency Rate Change

| Field | Detail |
|-------|--------|
| **Verdict** | **PASS** |
| **Trace** | `CurrencyPage` → `currencyStore.setRate` → `currencyApi.setRate` → `POST /currency/rates` → `CurrencyService.setRate` (archive old ACTIVE, create new) |
| **Root cause** | N/A. Rate history and active rate refresh work. `currencySync.ts` correctly no-op. Minor: rate notes use `user?.name` but `User` has `firstName`/`lastName` → notes show `"Set by User"`. |
| **Files affected** | `desktop/src/features/finance/CurrencyPage.tsx`, `desktop/src/stores/currencyStore.ts`, `backend/src/modules/currency/application/currency.service.ts` |
| **Severity** | **Low** |
| **Fix recommendation** | Use `` `${user.firstName} ${user.lastName}` `` in `CurrencyPage`. Replace hardcoded `12_620` fallback with error state when rates fail to load. |

---

## Cross-cutting findings

| Issue | Severity | Files |
|-------|----------|-------|
| Zero project-owned automated tests | High | — |
| `mockHandlers.ts` stale/broken (`completeSale`, old paths) | Medium | `desktop/src/api/mockHandlers.ts` |
| Idempotency race (check-then-act) | Medium | `backend/src/core/idempotency/` |
| No token refresh on 401 | Medium | `desktop/src/api/client.ts` |
| `salesStore.fetchSales` N+1 (`list` + `getById` per sale) | Low | `desktop/src/stores/salesStore.ts` |
| App-layer company isolation only (no Postgres RLS) | Medium | `prisma.service.ts`, migrations |
| Redis registered but unused for sessions | Low | `backend/src` |
| Dashboard/Reports/Admin still mock | Low | Out of integration scope |

---

## Recommended fix priority (pre-production)

| Priority | Item | Flow |
|----------|------|------|
| P0 | Fix `DebtService.applyPayment` dual-currency sync | Debt Payment |
| P0 | Fix return state machine + cumulative qty | Return |
| P1 | FIFO row locking in `deductFifo` | FIFO Allocation |
| P1 | CASH payment validation in `validateCreateSale` | Cash Sale |
| P2 | Post-mutation cache refetch (void/return/sale) | Void, Return, FIFO display |
| P2 | `salePriceUsd` money formatting | Products |
| P3 | Integration test suite for all 11 flows | All |

---

## Validation environment notes

- **Static analysis only** — no live HTTP requests executed in this validation run.
- **Backend build** — `backend/dist/` present from prior builds; not re-verified here.
- **Recommended manual E2E** — run backend with `prisma:seed`, desktop with `VITE_USE_MOCK=false`, execute checklist in `FRONTEND_BACKEND_INTEGRATION_REPORT.md`.

---

**Validation phase status:** **COMPLETE** — 9/11 flows pass integrated audit; 2 flows fail due to confirmed backend defects requiring fix before production financial operations.
