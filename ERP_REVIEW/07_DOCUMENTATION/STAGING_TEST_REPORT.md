# Staging Test Report

**Date:** 2026-06-18  
**Phase:** Staging Validation  
**Runner:** `backend/scripts/staging-validation.mjs` (`npm run staging:validate`)  
**API target:** `http://localhost:3000/api/v1`  
**Credentials:** `admin@erp.uz` / `Admin123!` · Company `MKT-TAS`

---

## Executive summary

| Metric | Result |
|--------|--------|
| Live HTTP scenarios executed | **0 / 11** (infrastructure unavailable) |
| Infrastructure gate | **FAIL** — `ECONNREFUSED` on `:3000` |
| Static code verification | **PASS** for concurrency paths reviewed |
| Backend build after fixes | **PASS** |
| Desktop `tsc --noEmit` | **PASS** |

**Verdict:** Staging validation **could not complete live execution** because Docker, PostgreSQL, Redis, and the NestJS API are not running on this host. Automated runner, test plan, and code fixes are in place. **Re-run required** once infrastructure is up (see [Unblock checklist](#unblock-checklist)).

---

## Environment status

| Component | Expected | Observed |
|-----------|----------|----------|
| Docker | `docker compose up -d` in `backend/` | **Not installed** (`docker` not in PATH) |
| PostgreSQL `:5432` | `erp` / `erp_secret` | **Not listening** |
| Redis `:6379` | Optional for throttling | **Not listening** |
| API `:3000` | `npm run start:prod` | **Not listening** |

```
FAIL  INFRA  API health — API unreachable (ECONNREFUSED)
=== SUMMARY: 0 PASS / 1 FAIL ===
```

---

## Scenario results

Legend: **LIVE** = HTTP runner result · **STATIC** = code-path review when live blocked · **SKIP** = not executed

### S01 — Baseline health & auth

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S01a | Health check | SKIP | — | Blocked by INFRA |
| S01b | Login + company context | SKIP | PASS | Auth service + seed credentials documented |
| S01c | Bootstrap catalog | SKIP | PASS | Runner creates category/product/customer |

### S02 — Concurrent users

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S02a | 5 parallel cash sales | SKIP | PASS | FIFO `updateMany` + `gte` guard prevents oversell |
| S02b | 10 parallel cash sales | SKIP | PASS | Same; runner expects stock errors when depleted |
| S02c | 5 parallel sessions | SKIP | PASS | Per-device session model in `auth.service.ts` |

### S03 — Sales & FIFO

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S03a | Deplete stock sequentially | SKIP | PASS | `INSUFFICIENT_STOCK` on atomic FIFO miss |
| S03b | Σ batch `remainingQty` = product `stock` | SKIP | PASS | Product stock derived from batch aggregate |
| S03c | FIFO allocations on sale detail | SKIP | PASS | Allocations written per line in transaction |

### S04 — Debt payments

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S04a | 3 concurrent partial payments | SKIP | PASS | `FOR UPDATE` + in-tx validation (H-03) |
| S04b | Overpayment attempt | SKIP | PASS | Business rule in `debt-payments.service.ts` |
| S04c | Full payment closes debt | SKIP | PASS | `uzsToUsd` canonical sync (P0 fix) |

### S05 — Returns

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S05a | Partial return status | SKIP | PASS | `PARTIALLY_RETURNED` / `RETURNED` (P0) |
| S05b | Second partial return | SKIP | PASS | Cumulative qty guard |
| S05c | Over-return rejected | SKIP | PASS | `remainingQty` check |
| S05d | 2 concurrent return creates | SKIP | **FIXED** | Sale `FOR UPDATE` added (S-STG-02) |

### S06 — Void

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S06a | Void restores stock | SKIP | PASS | `restoreFifoAllocations` |
| S06b | 2 parallel void same sale | SKIP | PASS | Sale `FOR UPDATE`; second fails on status |
| S06c | Void idempotency replay | SKIP | PASS | Idempotency claim-before-handler (H-01) |

### S07 — Currency

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S07a | Rate change during sales | SKIP | PASS | `exchangeRateUsed` snapshotted at sale create |
| S07b | Debt after rate change | SKIP | PASS | Payment uses active rate at payment time |

### S08 — Auth

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S08a | Refresh token rotation | SKIP | PASS | Hash rotated on refresh |
| S08b | Old refresh after rotation | SKIP | PASS | Mismatched hash revokes session |
| S08c | Expired access + refresh | SKIP | PASS | Desktop `client.ts` retry pattern (H-18) |

### S09 — Inventory receive during sales

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S09a | Receive + 5 parallel sales | SKIP | PASS | Receive creates batch; FIFO deducts atomically |

### S10 — Security & isolation

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S10a | Wrong `X-Company-Id` | SKIP | PASS | `CompanyIsolationGuard` fail-closed (H-09) |
| S10b | Idempotency mismatch | SKIP | PASS | `409 IDEMPOTENCY_KEY_MISMATCH` |
| S10c | Idempotency replay | SKIP | PASS | Cached response, same entity id |

### S11 — Audit

| ID | Scenario | LIVE | STATIC | Notes |
|----|----------|------|--------|-------|
| S11a | Sale create logged | SKIP | PARTIAL | `audit.log` after tx — not atomic with sale |
| S11b | Payment create logged | SKIP | PARTIAL | Same pattern; no public audit list API |

---

## Verification matrix (target invariants)

| Invariant | Live verified | Static / prior fix |
|-----------|---------------|-------------------|
| FIFO consistency | SKIP | PASS (H-02) |
| Inventory consistency | SKIP | PASS (batch sum = stock) |
| Debt UZS/USD sync | SKIP | PASS (P0 + H-04) |
| Audit log consistency | SKIP | PARTIAL (post-commit, no API) |
| Company isolation | SKIP | PASS (H-09) |
| Idempotency behavior | SKIP | PASS (H-01) |

---

## Runner improvements (this phase)

| Change | Purpose |
|--------|---------|
| Dynamic `unitPriceUzs` from bootstrap | CASH sales match product price |
| S07a `Promise.all` fix | Rate change truly parallel with sales |
| S04a pay `2000` UZS × 3 | Avoid overpayment on 10k credit sale |
| `ECONNREFUSED` try/catch | Clean INFRA fail instead of stack trace |

---

## Unblock checklist

```powershell
cd d:\erp\backend
docker compose up -d
npm run prisma:deploy
npm run prisma:seed
npm run build
npm run start:prod
# separate terminal:
npm run staging:validate
```

Expected exit code **0** when all scenarios pass. Update this report with LIVE column results after run.

---

## Sign-off

| Role | Status | Date |
|------|--------|------|
| Automated staging runner | Ready | 2026-06-18 |
| Live multi-user validation | **Blocked — infra** | 2026-06-18 |
| Production go-live (debt-heavy / multi-terminal) | **Pending live PASS** | — |
