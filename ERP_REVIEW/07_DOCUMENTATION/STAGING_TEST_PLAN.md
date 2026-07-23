# Staging Test Plan

**Date:** 2026-06-18  
**Environment:** Local staging (`docker-compose` Postgres 16 + Redis 7, NestJS API `:3000`)  
**Credentials:** `admin@erp.uz` / `Admin123!` · Company `MKT-TAS`  
**Runner:** `backend/scripts/staging-validation.mjs` (`npm run staging:validate`)

---

## Objectives

Validate ERP behavior under realistic multi-terminal load without architecture changes:

- FIFO and stock integrity under concurrent sales
- Debt UZS/USD sync under concurrent payments
- Return quantity integrity under concurrent creates
- Void idempotency and single-success semantics
- Idempotency key deduplication
- Company isolation enforcement
- Auth refresh and session continuity
- Exchange-rate changes during active sales
- Inventory receive overlapping with sales

---

## Preconditions

| Step | Command |
|------|---------|
| Infrastructure | `cd backend && docker compose up -d` |
| Migrations | `npm run prisma:deploy` |
| Seed | `npm run prisma:seed` |
| API | `npm run build && npm run start:prod` |
| Validate | `npm run staging:validate` |

---

## Scenarios

### S01 — Baseline health & auth

| ID | Scenario | Users | Pass criteria |
|----|----------|-------|---------------|
| S01a | `GET /health` | 1 | `200`, status ok |
| S01b | Login + company context | 1 | JWT + permissions returned |
| S01c | Bootstrap test catalog | 1 | Category, product (stock ≥ 50), customer created |

### S02 — Concurrent users (operations)

| ID | Scenario | Concurrency | Pass criteria |
|----|----------|-------------|---------------|
| S02a | 5 parallel cash sales (qty 1, same SKU) | 5 | All succeed OR expected stock errors; stock never negative |
| S02b | 10 parallel cash sales (qty 1, same SKU) | 10 | Success count ≤ available stock; no oversell |
| S02c | 5 parallel sessions (unique device IDs, same user) | 5 | All logins succeed; independent tokens |

### S03 — Sales & FIFO

| ID | Scenario | Pass criteria |
|----|----------|---------------|
| S03a | Sequential sales until stock depletes | Last sale fails `INSUFFICIENT_STOCK` |
| S03b | Σ batch `remainingQty` = product `stock` | Exact match after sales |
| S03c | Sale detail includes FIFO allocations | Allocations sum = line qty |

### S04 — Debt payments

| ID | Scenario | Concurrency | Pass criteria |
|----|----------|-------------|---------------|
| S04a | Credit sale then 3 partial UZS payments | 3 parallel | Debt decreases; UZS/USD legs stay synced |
| S04b | Overpayment attempt | 1 | `422` business rule |
| S04c | Full payment closes debt | 1 | `totalDebtUzs` = 0, `totalDebtUsd` = 0 |

### S05 — Returns

| ID | Scenario | Pass criteria |
|----|----------|---------------|
| S05a | Partial return on multi-line sale | Sale `PARTIALLY_RETURNED` |
| S05b | Second partial return | Allowed; cumulative qty ≤ sold |
| S05c | Over-return rejected | `422` when qty exceeds remaining |
| S05d | 2 concurrent return creates same line | At most one succeeds if qty allows one |

### S06 — Void

| ID | Scenario | Concurrency | Pass criteria |
|----|----------|---------------|
| S06a | Void restores stock | Stock + batches restored |
| S06b | 2 parallel void same sale | Exactly one succeeds |
| S06c | Void idempotency key replay | Same response, single void |

### S07 — Currency

| ID | Scenario | Pass criteria |
|----|----------|---------------|
| S07a | Set new rate during 5 parallel sales | Sales keep `exchangeRateUsed` from creation time |
| S07b | Debt after rate change | Payments use active rate at payment time |

### S08 — Auth

| ID | Scenario | Pass criteria |
|----|----------|---------------|
| S08a | Refresh token rotation | New access token works |
| S08b | Old refresh after rotation | `401` / session revoked |
| S08c | Expired access + refresh | Retry succeeds (client pattern) |

### S09 — Inventory receive during sales

| ID | Scenario | Concurrency | Pass criteria |
|----|----------|-------------|---------------|
| S09a | Receive + 5 parallel sales same SKU | No negative stock; FIFO batches consistent |

### S10 — Security & isolation

| ID | Scenario | Pass criteria |
|----|----------|---------------|
| S10a | Wrong `X-Company-Id` header | `403` |
| S10b | Idempotency key mismatch body | `409 IDEMPOTENCY_KEY_MISMATCH` |
| S10c | Idempotency key replay same body | Cached response, no duplicate entity |

### S11 — Audit

| ID | Scenario | Pass criteria |
|----|----------|---------------|
| S11a | Sale create logged | Audit row `entityType=sale` |
| S11b | Payment create logged | Audit row `entityType=debt_payment` |

---

## Verification queries (automated in runner)

1. **FIFO:** `GET /inventory/batches` + `GET /products` — Σ remaining per product = stock
2. **Debt:** `GET /customers/:id` — `uzsToUsd(debtUzs, rate) ≈ debtUsd`
3. **Returns:** `GET /sales/:id` — status matches returned qty
4. **Audit:** Admin audit endpoint or DB count delta (if exposed)

---

## Exit criteria

| Gate | Requirement |
|------|-------------|
| Automated runner | All scenarios PASS or documented SKIP (infra unavailable) |
| Builds | Backend + desktop `tsc` PASS after any fixes |
| Reports | `STAGING_TEST_REPORT.md`, `FIX_REPORT.md`, `FINAL_PRODUCTION_READINESS.md` |

---

## Out of scope

- New product features
- Architecture refactors
- Load testing beyond 10 concurrent operations
- Dashboard / admin mock modules
