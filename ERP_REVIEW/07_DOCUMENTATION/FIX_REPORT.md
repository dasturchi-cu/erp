# Fix Report — Live Boot

**Date:** 2026-06-24  
**Context:** Docker installed; full stack boot + LIVE staging

---

## Issues found and fixed

| ID | Issue | Root cause | Fix |
|----|-------|------------|-----|
| BOOT-01 | Docker daemon not running | Docker Desktop not started after install | Started Docker Desktop; ran `wsl --update` |
| BOOT-02 | Prisma seed failed | `ts-node` not on PATH | `start-staging.ps1` uses `node_modules/ts-node/dist/bin.js` |
| BOOT-03 | `start:prod` wrong path | Output is `dist/src/main.js` | `package.json` → `node dist/src/main` |
| BOOT-04 | LIVE login FAIL | `deviceInfo.platform: 'staging'` invalid; missing `name`; non-UUID deviceId | `live-staging.mjs` + `staging-validation.mjs`: `platform: windows`, `name`, UUID `deviceId` |

---

## Build verification after fixes

| Step | Result |
|------|--------|
| `docker compose up -d` | PASS |
| `prisma migrate deploy` | PASS (4 migrations) |
| Seed | PASS |
| `nest build` | PASS |
| API `:3000` | PASS |
| LIVE staging (24 scenarios) | **24 PASS / 0 FAIL** |

---

## No application code changes required

All boot failures were infrastructure or test-harness validation mismatches. Business logic (sales, debt, returns, FIFO, idempotency) passed live HTTP tests without code changes.
