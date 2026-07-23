# Pilot Bug Report

**Purpose:** Collect real-world issues during desktop pilot before mobile development.  
**Pilot period:** _fill in dates_

---

## How errors are captured

| Layer | Log location | What is logged |
|-------|--------------|----------------|
| Frontend crashes | Browser `localStorage` key `erp-pilot-error-log` | React boundary, unhandled errors, unhandled rejections |
| Frontend API failures | Same + console `[PilotError]` | HTTP 5xx and network errors |
| Electron desktop | `%APPDATA%/ERP/pilot-errors.jsonl` (userData) | Same entries as frontend (JSON lines) |
| Backend exceptions | `backend/logs/pilot-errors.jsonl` | 5xx and unexpected server errors |

Each entry includes: **timestamp**, **user**, **screen**, **action**, **error**, **stack trace** (+ requestId when available).

### Export frontend logs (DevTools console)

```javascript
copy(localStorage.getItem('erp-pilot-error-log'))
```

Or:

```javascript
// if pilotErrorLogger is imported in dev build
import { exportPilotErrorLog } from './src/lib/pilotErrorLogger';
copy(exportPilotErrorLog());
```

### Backend log path

```
d:\erp\backend\logs\pilot-errors.jsonl
```

---

## Bug log (manual triage)

Copy rows from automated logs into this table during pilot review.

| # | Timestamp (UTC) | User | Screen | Action | Error | Stack trace (summary) | Severity | Status | Notes |
|---|-----------------|------|--------|--------|-------|----------------------|----------|--------|-------|
| 1 | | | | | | | P0/P1/P2 | Open/Fixed/Won't fix | |
| 2 | | | | | | | | | |
| 3 | | | | | | | | | |

**Severity**

- **P0** — Data loss, wrong money/stock/debt, cannot sell or login
- **P1** — Feature blocked, workaround exists
- **P2** — UI/UX, cosmetic, rare edge case

**Status:** Open → In progress → Fixed → Verified in pilot

---

## Weekly pilot review checklist

- [ ] Review `backend/logs/pilot-errors.jsonl`
- [ ] Export and review desktop `erp-pilot-error-log`
- [ ] Update table above with new issues
- [ ] Link fixes to commit / PR
- [ ] Re-test on pilot terminals after deploy

---

## Example log entry (frontend)

```json
{
  "timestamp": "2026-06-24T12:00:00.000Z",
  "source": "api",
  "user": "admin@erp.uz",
  "screen": "/sales/pos",
  "action": "POST /sales",
  "error": "Unexpected server error",
  "stackTrace": "AxiosError: Request failed...",
  "requestId": "abc-123",
  "statusCode": 500
}
```

## Example log entry (backend)

```json
{
  "timestamp": "2026-06-24T12:00:01.000Z",
  "source": "backend",
  "user": "admin@erp.uz",
  "screen": "/sales/pos",
  "action": "POST /api/v1/sales",
  "error": "Unexpected server error",
  "stackTrace": "Error: ...",
  "requestId": "abc-123",
  "statusCode": 500,
  "method": "POST",
  "path": "/api/v1/sales"
}
```

---

## Contacts

| Role | Name | Contact |
|------|------|---------|
| Pilot lead | | |
| Engineering | | |
