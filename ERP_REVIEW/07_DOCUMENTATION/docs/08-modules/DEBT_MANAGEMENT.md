# Debt Management Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Debt Management module handles accounts receivable for credit sales. In Uzbekistan's wholesale sector, selling on credit is standard practice — customers routinely purchase goods and pay days or weeks later, often in multiple partial installments. The module tracks dual-currency debt balances (UZS and USD independently), processes partial and full payments, maintains complete payment history, and supports daily debt collection workflows.

Debt is automatically created when a credit sale is completed. Manual debt creation is not permitted — all debt originates from sales transactions to ensure full traceability.

---

## 2. Debt Model

### 2.1 Dual-Currency Balances

Each customer maintains two independent debt balances:

```
Customer: Alisher Qurilish MChJ
  total_debt_uzs: 5,200,000
  total_debt_usd: 1,450.00
```

These balances are never combined or converted. A payment in UZS reduces only the UZS balance; a USD payment reduces only the USD balance.

### 2.2 Debt Creation

Debt is created automatically on credit sale completion:

```
Credit Sale: 1,000,000 UZS (original_currency = UZS)
Payment at sale: 400,000 UZS
Debt created: 600,000 UZS

Customer.total_debt_uzs += 600,000
```

For full credit (no payment at sale):

```
Credit Sale: $500.00 USD (original_currency = USD)
Payment at sale: $0
Debt created: $500.00 USD

Customer.total_debt_usd += 500.00
```

### 2.3 Debt Reduction

Debt is reduced by:
- Partial payments (manual, recorded by manager/cashier)
- Full payments (zeroes currency balance)
- Sale returns (proportional reversal)
- Sale voids (full reversal within void window)

---

## 3. Payment Processing

### 3.1 Partial Payment

The most common payment pattern in Uzbek wholesale:

```
Customer debt: 5,200,000 UZS
Payment received: 2,000,000 UZS

Result:
  total_debt_uzs: 3,200,000 UZS
  Payment record created with FULL history preserved
```

**Workflow:**
1. Manager navigates to customer card or Debt Management
2. Selects customer (phone search)
3. Views current balances (UZS and USD)
4. Selects payment currency
5. Enters payment amount
6. Selects payment method: Cash, Bank Transfer, Card
7. Confirms payment
8. System:
   a. Creates `DebtPayment` record
   b. Reduces customer debt balance
   c. Updates `last_payment_date`, `last_payment_amount`
   d. Audit log entry
   e. WebSocket notification

### 3.2 Full Payment

Payment amount equals or exceeds outstanding balance for selected currency:

```
Customer debt: 3,200,000 UZS
Payment received: 3,200,000 UZS

Result:
  total_debt_uzs: 0
  Payment type: FULL
```

If payment exceeds balance, excess is recorded as overpayment (credit balance — future feature) or rejected based on company settings.

### 3.3 Payment Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | Owning company |
| `customer_id` | UUID | Customer |
| `amount` | Decimal | Payment amount |
| `currency` | Enum | `UZS` or `USD` |
| `exchange_rate_used` | Decimal | Rate at payment time (frozen) |
| `payment_type` | Enum | `PARTIAL`, `FULL` |
| `payment_method` | Enum | `CASH`, `BANK_TRANSFER`, `CARD` |
| `received_by` | UUID | User who recorded payment |
| `received_at` | Timestamp | Payment timestamp |
| `notes` | Text | Optional notes (check number, etc.) |
| `branch_id` | UUID | Branch where payment received |

---

## 4. Payment History

### 4.1 Per-Customer History

Complete payment log on customer card:

```
Date         Amount          Currency  Type     Received By
2026-06-10   500,000         UZS       PARTIAL  Sarvar (Manager)
2026-06-01   $200.00         USD       PARTIAL  Sarvar (Manager)
2026-05-20   1,000,000       UZS       FULL     Dilshod (Cashier)
2026-05-15   $500.00         USD       FULL     Sarvar (Manager)
```

### 4.2 Company-Wide Payment Log

Debt Management module provides centralized payment register:

- Filterable by date, customer, currency, branch, received by
- Exportable to Excel/CSV/PDF
- Daily payment summary for cash reconciliation

### 4.3 History Immutability

Payment records are immutable once created. Corrections require:
- Reversal payment (negative entry with reason) — requires `debt.reverse` permission
- Full audit trail of correction

---

## 5. Debt Aging

### 5.1 Aging Calculation

Debt age calculated from the oldest unpaid sale transaction per currency:

| Bucket | Definition |
|--------|------------|
| Current | 0–7 days |
| 8–30 days | 8 to 30 days overdue |
| 31–60 days | 31 to 60 days overdue |
| 61–90 days | 61 to 90 days overdue |
| 90+ days | More than 90 days overdue |

### 5.2 Aging Report

```
Customer               Current    8-30d      31-60d    61-90d    90+d      Total UZS
─────────────────────────────────────────────────────────────────────────────────
Alisher Qurilish       700,000  2,500,000  2,000,000    0         0      5,200,000
Bobur Mebel              0        350,000    0          0         0        350,000
Temur Stroy            1,200,000    0        0       800,000  1,500,000  3,500,000
```

---

## 6. Debt Dashboard

### 6.1 Summary Widgets

| Widget | Description |
|--------|-------------|
| Total Debt UZS | Company-wide outstanding UZS |
| Total Debt USD | Company-wide outstanding USD |
| Today's Payments | Payments received today (both currencies) |
| Top Debtors | Customers with highest balances |
| Overdue Count | Customers with debt > 30 days |

### 6.2 Daily Collection Workflow

Typical manager morning routine:

1. Open Debt Management dashboard
2. Review overdue customers (sorted by age and amount)
3. Call customers from top of list
4. Record payments as received
5. Review end-of-day payment summary

---

## 7. Debt from Sales Integration

### 7.1 Credit Sale → Debt

```
Sale completed (CREDIT) → debt += (total − amount_paid) in original_currency
```

### 7.2 Partial Payment at Sale

```
Sale total: 2,000,000 UZS
Paid at sale: 500,000 UZS
Debt created: 1,500,000 UZS
Payment record: 500,000 UZS (PARTIAL, at sale time)
```

### 7.3 Return → Debt Reduction

```
Original credit sale: 1,000,000 UZS
Return: 200,000 UZS worth of goods
Debt reduced: 200,000 UZS
```

### 7.4 Void → Debt Elimination

```
Voided credit sale: 1,000,000 UZS
Debt reduced: 1,000,000 UZS (full reversal)
```

---

## 8. Permissions

| Permission | Description |
|------------|-------------|
| `debt.view` | View debt balances and history |
| `debt.payment` | Record partial and full payments |
| `debt.reverse` | Reverse erroneous payments |
| `debt.export` | Export debt reports |
| `debt.aging` | View debt aging analysis |

---

## 9. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/debt/summary` | Company debt summary |
| GET | `/api/v1/debt/customers` | Customers with debt (sorted, filterable) |
| GET | `/api/v1/debt/aging` | Debt aging report |
| POST | `/api/v1/debt/payments` | Record payment |
| GET | `/api/v1/debt/payments` | Payment history (filterable) |
| POST | `/api/v1/debt/payments/:id/reverse` | Reverse payment |

---

## 10. Business Rules Summary

| ID | Rule |
|----|------|
| BR-DB-02 | Debt created automatically on credit sale |
| BR-DB-03 | Partial payment reduces balance; history preserved |
| BR-DB-04 | Full payment zeroes debt for that currency |
| BR-DB-07 | Debt aging calculated from oldest unpaid transaction |
| BR-CUR-05 | Debt tracked separately in UZS and USD |
| BR-CUR-06 | Payment applied to currency-specific balance |
| BR-DEBT-01 | Payment amount must be > 0 |
| BR-DEBT-02 | Payment cannot exceed balance + configurable overpayment limit |

---

## 11. Related Documents

- [CUSTOMERS.md](./CUSTOMERS.md)
- [SALES.md](./SALES.md)
- [CURRENCY_UZS_USD.md](./CURRENCY_UZS_USD.md)
- [REPORTS.md](./REPORTS.md)
- [DASHBOARD.md](./DASHBOARD.md)
