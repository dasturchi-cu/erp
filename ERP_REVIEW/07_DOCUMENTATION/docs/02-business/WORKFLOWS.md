# Business Workflows

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Sale Workflow (Credit)

```
[Start] → Select Customer → Add Products → Select Currency (UZS/USD)
    → System: Capture Exchange Rate
    → System: Check Stock → [Insufficient?] → Error → [End]
    → System: FIFO Allocation
    → Payment Received?
        → [Full] → Create Sale (paid) → Update Stock → [End]
        → [Partial] → Create Sale + Debt (partial) → Update Stock → [End]
        → [None] → Create Sale + Debt (full) → Update Stock → [End]
```

---

## 2. Sale Workflow (Cash / Walk-in)

```
[Start] → Skip Customer (or quick-add) → Add Products → Select Currency
    → FIFO Allocation → Receive Full Payment → Create Sale (paid)
    → Update Stock → Broadcast Real-time → [End]
```

---

## 3. Payment Collection Workflow

```
[Start] → Search Customer by Phone → View Debt Balance (UZS / USD)
    → Select Currency → Enter Amount
    → [Amount >= Debt] → Full Payment → Balance = 0
    → [Amount < Debt] → Partial Payment → Balance reduced
    → Record Payment → Update last_payment_date
    → Broadcast → Audit Log → [End]
```

---

## 4. Inventory Receipt Workflow

```
[Start] → Select Product → Enter Quantity
    → Enter Unit Cost (UZS + USD) → Enter Receipt Date
    → Create Batch (remaining_qty = quantity)
    → Record Movement (RECEIPT)
    → Update Product Stock Total
    → Broadcast → Dashboard Refresh → [End]
```

---

## 5. Product Return Workflow

```
[Start] → Find Original Sale → Select Items to Return
    → System: Create Return Batch (new batch, not original)
    → System: Reverse FIFO allocations (audit only, stock restored)
    → System: Adjust Customer Debt (if credit sale)
    → Record Return → Audit Log → Broadcast → [End]
```

---

## 6. User Onboarding Workflow

```
[Admin] → Create User → Assign Role → Assign Company(ies)
    → [Optional] Assign Branch
    → User receives credentials
    → User logs in from device → Device registered
    → Admin can monitor in Devices panel
```

---

## 7. Exchange Rate Update Workflow

```
[Manager/Admin] → Enter New Rate → Confirm
    → New rate effective immediately for NEW transactions
    → Historical data unchanged
    → Broadcast currency.rate_updated
    → Dashboard recalculates display-only conversions
```

---

## 8. Module Disable Workflow

```
[Admin] → Select Module → Disable
    → API: 403 for module endpoints
    → WebSocket: module.disabled event
    → All clients: hide menu items
    → [In-progress operations]: grace period (30s) or immediate based on config
```

---

## 9. Daily Operations Workflow

```
02:00 → Automated Backup (PostgreSQL + ZIP)
06:00 → Manager reviews Dashboard (overnight sales)
08:00 → Warehouse receives goods → Batch entry
09:00-18:00 → Sales operations (cashier)
18:00 → Manager reviews daily report
       → Export to Excel if needed
       → Follow up on overdue debts
```

---

## 10. Disaster Recovery Workflow

```
[Incident Detected] → Assess severity
    → [Data corruption] → Stop writes → Restore from latest backup
    → [Service down] → Restart containers → Verify health
    → [Security breach] → Block affected users/devices
    → Force logout all sessions → Rotate secrets → Audit review
    → Post-incident report
```

---

## Related Documents

- [USE_CASES.md](./USE_CASES.md)
- [../08-modules/SALES.md](../08-modules/SALES.md)
- [../08-modules/FIFO.md](../08-modules/FIFO.md)
