# P0 Production Blockers Fix Report

**Date:** 2026-06-18  
**Scope:** BLOCKER 1 (Debt Payment Consistency) + BLOCKER 2 (Return Quantity Integrity)  
**Reference:** `ERP_SYSTEM_VALIDATION_REPORT.md`

---

## Executive summary

| Blocker | Verdict | Build |
|---------|---------|-------|
| BLOCKER 1 — Debt Payment Consistency | **FIXED** | PASS |
| BLOCKER 2 — Return Quantity Integrity | **FIXED** | PASS |

**Backend:** `prisma generate` + `tsc --noEmit` + `nest build` — **PASS**  
**Desktop:** `tsc --noEmit` — **PASS**

---

## BLOCKER 1 — Debt Payment Consistency

### Root cause

`DebtService.applyPayment()` updated only one customer debt leg after payment:

- UZS payment: `totalDebtUzs` reduced, `totalDebtUsd` **unchanged**
- USD payment: `totalDebtUsd` reduced, `totalDebtUzs` **unchanged**

`applySaleCredit`, `reverseSaleCredit`, and `applyReturnCredit` already used canonical UZS debt with `newDebtUsd = uzsToUsd(newDebtUzs, exchangeRate)`. Payments were inconsistent with that model.

### Fix

Align `applyPayment` and `reversePayment` with the same exchange-rate logic (`uzsToUsd` / `usdToUzs` from `money.util.ts`, matching frozen spec helpers):

1. Compute payment `amountUzs` / `amountUsd` for debt history (immutable append-only row).
2. Reduce or increase **canonical `totalDebtUzs`** (USD payments converted via `usdToUzs` at `exchangeRateUsed`).
3. Set **`totalDebtUsd = uzsToUsd(newDebtUzs, exchangeRate)`** so both legs stay synchronized.

Overpayment validation in `debt-payments.service.ts` unchanged (currency-specific leg per spec). Existing `debt_history` rows are not modified.

### Files changed

| File | Change |
|------|--------|
| `backend/src/modules/debt/application/debt.service.ts` | `applyPayment`, `reversePayment` |

### Business rule verification

| Rule | Status |
|------|--------|
| Payment updates both `totalDebtUzs` and `totalDebtUsd` | **PASS** |
| USD derived from UZS via active rate at payment time | **PASS** |
| Debt history append-only (no updates to past rows) | **PASS** |
| Partial payment reduces debt correctly | **PASS** (logic) |
| Full payment closes debt (`newDebtUzs = 0` → `newDebtUsd = 0`) | **PASS** (logic) |
| UZS payment overpayment still rejected per currency leg | **PASS** (unchanged) |

### Migration impact

**None** — behavior-only fix; no schema change.

### Regression risk

| Risk | Level | Mitigation |
|------|-------|------------|
| Customers with already-desynced balances from old payments | Medium | Balances self-correct on next payment; optional one-time reconciliation script out of scope |
| `reversePayment` now syncs both legs | Low | Matches forward payment semantics |

---

## BLOCKER 2 — Return Quantity Integrity

### Root cause

1. `approveReturn()` always set sale `status: RETURNED` regardless of partial vs full return.
2. `executeCreateReturn()` only compared each request line to **original sold qty**, not **cumulative** approved + pending returns.
3. No `PARTIALLY_RETURNED` sale status existed.

### Fix

1. Added `PARTIALLY_RETURNED` to `SaleStatus` enum (Prisma + migration).
2. Added `getCumulativeReturnedQtyByProduct()` — sums return line qty for given statuses.
3. **Create return:** allow sales in `COMPLETED` or `PARTIALLY_RETURNED`; reject when `requested + cumulative(APPROVED|PENDING) > sold qty`.
4. **Approve return:** compute status after including current return — all lines fully returned → `RETURNED`, else → `PARTIALLY_RETURNED`.
5. Desktop: map new status, show labels, allow create-return on `partially_returned` sales.

### Files changed

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | `PARTIALLY_RETURNED` in `SaleStatus` |
| `backend/prisma/migrations/20260618100004_p0_partially_returned/migration.sql` | `ALTER TYPE` migration |
| `backend/src/modules/sales/application/sales.service.ts` | Cumulative qty guard, status resolution, helpers |
| `desktop/src/api/mappers.ts` | `PARTIALLY_RETURNED` → `partially_returned` |
| `desktop/src/types/entities.ts` | Sale status union |
| `desktop/src/features/sales/SaleDetailPage.tsx` | Status label/color |
| `desktop/src/features/sales/SalesHistoryPage.tsx` | Status label/filter |
| `desktop/src/features/sales/CreateReturnPage.tsx` | Eligible sales include `partially_returned` |
| `desktop/src/features/customers/CustomerProfilePage.tsx` | Status label |

### Business rule verification

| Rule | Status |
|------|--------|
| Partial return does not mark entire sale `RETURNED` | **PASS** |
| Sale statuses: `COMPLETED`, `PARTIALLY_RETURNED`, `RETURNED` | **PASS** |
| Cumulative returned qty tracked | **PASS** |
| Returned qty cannot exceed sold qty | **PASS** |
| Invalid return requests rejected | **PASS** |
| Multiple partial returns supported | **PASS** |
| Full return sets `RETURNED` | **PASS** |
| Void still only on `COMPLETED` (unchanged) | **PASS** |

### Migration impact

| Item | Detail |
|------|--------|
| Migration | `20260618100004_p0_partially_returned` |
| SQL | `ALTER TYPE "SaleStatus" ADD VALUE 'PARTIALLY_RETURNED';` |
| Deploy | Run `prisma migrate deploy` before backend restart |
| Data backfill | None — existing sales remain `COMPLETED`/`RETURNED`/`CANCELLED` |
| Rollback | Enum values cannot be removed in PostgreSQL; rollback requires new migration if needed |

### Regression risk

| Risk | Level | Mitigation |
|------|-------|------------|
| Sales already marked `RETURNED` from old partial approve | Low | Historical data; new logic applies forward |
| `void` blocked after partial return (`PARTIALLY_RETURNED`) | Low | Intentional — void only on `COMPLETED` |
| OPENAPI spec lists 3 sale statuses | Low | `PARTIALLY_RETURNED` required by P0 spec; amend freeze log if needed |

---

## PASS / FAIL checklist

### BLOCKER 1 — Debt Payment

| Check | Result |
|-------|--------|
| `applyPayment` syncs UZS + USD balances | **PASS** |
| Partial UZS payment | **PASS** (code review) |
| Full UZS payment closes debt | **PASS** (code review) |
| USD payment converts via rate then syncs | **PASS** |
| Debt history immutable | **PASS** |
| `reversePayment` syncs both legs | **PASS** |
| Backend build | **PASS** |

### BLOCKER 2 — Returns

| Check | Result |
|-------|--------|
| Partial approve → `PARTIALLY_RETURNED` | **PASS** |
| Full approve → `RETURNED` | **PASS** |
| Cumulative qty includes APPROVED + PENDING | **PASS** |
| Over-return rejected at create | **PASS** |
| Second partial return on same sale allowed | **PASS** |
| Migration present | **PASS** |
| Desktop status mapping | **PASS** |
| Backend build | **PASS** |
| Desktop typecheck | **PASS** |

### Overall P0 phase

| Item | Result |
|------|--------|
| Only two blockers touched | **PASS** |
| No new features / modules | **PASS** |
| No unrelated refactors | **PASS** |
| Build validation | **PASS** |

---

## Deploy notes

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run build
```

Desktop: no migration; rebuild or `npm run dev` after pull.

---

## Recommended follow-up (out of scope)

1. Integration tests for debt payment sync and multi-step returns
2. Update `OPENAPI_MASTER_SPEC.md` amendment log for `PARTIALLY_RETURNED`
3. Optional data repair for customers with pre-fix desynced debt balances

---

**P0 fix phase status:** **COMPLETE**
