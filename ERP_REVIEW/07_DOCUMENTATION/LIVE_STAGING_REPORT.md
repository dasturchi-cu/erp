# Live Staging Report

**Generated:** 2026-06-24T06:53:15.556Z
**Started:** 2026-06-24T06:53:12.169Z
**API:** http://localhost:3000/api/v1
**Mode:** LIVE HTTP execution

## Summary

| Metric | Value |
|--------|-------|
| PASS | 24 |
| FAIL | 0 |
| Infrastructure | OK |
| Overall | **PASS** |

## Scenario results

| ID | Scenario | Result | Detail |
|----|----------|--------|--------|
| L-00 | Health check | PASS |  |
| L-01 | Login | PASS | JWT + company context |
| L-02a | Category ready | PASS | 2a0c8f81-e357-4ac4-bdb7-107680174ffe |
| L-02 | Customer create | PASS | id=c833c2b0-38e4-4063-a2fc-ca0773c777af |
| L-03 | Product create | PASS | id=8f2d46a3-f202-42fc-8795-7075516c8f60 |
| L-03b | Product CRUD (get + update) | PASS | Live Staging Product Updated |
| L-02b | Customer CRUD (get + update) | PASS | Live Customer Updated |
| L-04 | Inventory receive | PASS | qty=50 |
| L-05 | Cash sale | PASS | id=4a90b7cd-0f95-4baf-9a82-dfd45c9eb769 |
| L-06 | Credit sale | PASS | debt line qty=2 |
| L-07 | Debt payment | PASS | debtUzs=15000 |
| L-08 | Return create + approve | PASS | saleStatus=PARTIALLY_RETURNED |
| L-09 | Void sale | PASS | status=CANCELLED stock 247→248 |
| L-10 | Currency change | PASS | rateBefore=12620 saleUsed=12850 |
| L-11a | 5 concurrent sales | PASS | ok=5/5 stock=242 |
| L-11b | 10 concurrent sales | PASS | ok=10 stock_err=0 |
| L-FIFO | FIFO batch sum = stock | PASS | delta=0 |
| L-INV | Inventory consistency | PASS | stock=232 |
| L-13 | 3 concurrent debt payments | PASS | debtUzs=2000 |
| L-DEBT | Debt UZS/USD sync | PASS | deltaUsd=0.000042023346303515785 |
| L-12 | 2 concurrent returns (qty=1 sale) | PASS | success=1/2 (exactly one allowed) |
| L-IDEM | Idempotency replay | PASS | id=4a25fbba-59dc-49f1-9bc3-6c2b589f2f24 |
| L-ISO | Company isolation | PASS | status=403 |
| L-REF | Refresh token rotation | PASS | status=200 |

## Verification invariants

- **FIFO consistency:** PASS
- **Inventory consistency:** PASS
- **Debt UZS/USD sync:** PASS
- **Company isolation:** PASS
- **Idempotency:** PASS