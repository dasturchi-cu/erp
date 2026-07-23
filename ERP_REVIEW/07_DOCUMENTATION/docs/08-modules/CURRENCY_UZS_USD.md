# Currency Module (UZS / USD)

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Currency module provides dual-currency support for the Uzbekistan market, where businesses routinely operate in both Uzbek So'm (UZS) and US Dollars (USD). The module manages exchange rates, enforces frozen rates on historical transactions, and ensures all financial records maintain currency integrity across Sales, Debt, Dashboard, and Reports.

Exchange rates are company-scoped. Market may use a different rate than Xitoy Tovar on the same day. Rate changes apply only to future transactions — historical records are never recalculated.

---

## 2. Currency Model

### 2.1 Supported Currencies

| Code | Name | Symbol | Role |
|------|------|--------|------|
| `UZS` | Uzbek So'm | so'm | Primary operating currency |
| `USD` | US Dollar | $ | Secondary; common for imports and B2B |

No other currencies are supported in Phase 1. Extension to EUR or RUB is registered for future phases.

### 2.2 Exchange Rate Definition

```
rate = number of UZS per 1 USD

Example: rate = 12,750 means 1 USD = 12,750 UZS
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | Owning company |
| `rate` | Decimal | UZS per 1 USD |
| `effective_from` | Timestamp | When this rate becomes active |
| `set_by` | UUID | User who set the rate |
| `notes` | Text | Optional reason for change |
| `created_at` | Timestamp | Record creation (immutable) |

---

## 3. Frozen Exchange Rates

### 3.1 Principle

Every financial transaction stores the exchange rate used at transaction time. This rate is **frozen permanently** and never recalculated when the company rate changes.

| Transaction Field | Description |
|-------------------|-------------|
| `original_currency` | Currency the transaction was conducted in (`UZS` or `USD`) |
| `exchange_rate_used` | UZS-per-USD rate at transaction time |
| `total_uzs` | Total amount in UZS (native or converted) |
| `total_usd` | Total amount in USD (native or converted) |

### 3.2 Why Frozen Rates Matter

```
Timeline:
  Jan 1:  Rate = 12,500. Sale of $100 → stored as $100, rate 12,500
  Feb 1:  Rate changed to 13,000
  Mar 1:  Reporting on January sale still shows $100 at rate 12,500

  If recalculated: $100 × 13,000 = 1,300,000 UZS (WRONG)
  Correct:         $100 × 12,500 = 1,250,000 UZS (frozen)
```

This ensures audit compliance, accurate profit calculation, and trustworthy historical reports for businesses that adjust rates weekly or daily.

### 3.3 Immutable Rate History

Exchange rate records are append-only:

- New rate creates new record with `effective_from`
- Previous rates are never updated or deleted
- Full rate history available for audit and reporting
- Rate history retained minimum 7 years

---

## 4. Rate Management

### 4.1 Setting a New Rate

1. Admin or authorized user navigates to **Settings → Exchange Rate**
2. Enters new rate value (UZS per 1 USD)
3. Optionally sets `effective_from` (defaults to now)
4. Confirms with preview showing impact on display conversions
5. System creates new rate record; previous rate remains in history
6. All new transactions use new rate; existing transactions unaffected

### 4.2 Rate Display

Current rate shown prominently in:
- POS header bar
- Dashboard currency widget
- Sale and payment forms (as reference)
- Product list (for cross-currency price reference)

### 4.3 Rate Rules

| ID | Rule |
|----|------|
| CUR-01 | Rate must be > 0 |
| CUR-02 | Rate is company-scoped |
| CUR-03 | Only users with `currency.manage` can set rates |
| CUR-04 | Rate changes are audit-logged |
| CUR-05 | Maximum one "current" rate per company at any point in time |
| CUR-06 | `effective_from` cannot be in the future by more than 24 hours |

---

## 5. Transaction Currency Handling

### 5.1 Sale Currency Selection

At POS or sales entry, cashier selects transaction currency:

| Selection | Behavior |
|-----------|----------|
| **UZS** | Prices shown in UZS; payment in UZS; `original_currency = UZS` |
| **USD** | Prices shown in USD; payment in USD; `original_currency = USD` |

Both `total_uzs` and `total_usd` are stored on every sale:
- Native currency amount is exact
- Converted amount uses `exchange_rate_used` at sale time

### 5.2 Conversion Formula

```
If original_currency = USD:
  total_uzs = total_usd × exchange_rate_used

If original_currency = UZS:
  total_usd = total_uzs ÷ exchange_rate_used
```

Rounding: UZS amounts rounded to whole so'm; USD to 2 decimal places.

### 5.3 Payment Currency

Debt payments are currency-specific:

- UZS payment reduces UZS debt balance only
- USD payment reduces USD debt balance only
- Cross-currency payment is NOT supported (customer must pay in debt currency)
- Each payment stores its own `exchange_rate_used`

---

## 6. Dual Balance Tracking

### 6.1 Customer Debt

Customers maintain separate balances:

| Balance | Description |
|---------|-------------|
| `total_debt_uzs` | Outstanding debt in Uzbek So'm |
| `total_debt_usd` | Outstanding debt in US Dollars |

A customer may owe 5,000,000 UZS and $2,000 USD simultaneously from different transactions.

### 6.2 Company Financial Summary

Dashboard and reports show parallel columns:

```
┌──────────────────────────────────────────────┐
│  Today's Sales                               │
│  UZS: 45,200,000 so'm   USD: $3,420.00      │
│                                              │
│  Outstanding Debt                            │
│  UZS: 128,500,000 so'm  USD: $18,750.00     │
│                                              │
│  Current Rate: 1 USD = 12,750 UZS            │
└──────────────────────────────────────────────┘
```

No combined "total in UZS" figure is shown at transaction level — only at optional summary widgets using current rate with clear labeling.

---

## 7. Pricing Integration

### 7.1 Product Dual Prices

Products store four reference prices (see [PRODUCTS.md](./PRODUCTS.md)):

- `purchase_price_uzs`, `purchase_price_usd`
- `sale_price_uzs`, `sale_price_usd`

These are independent — not auto-calculated from each other. Businesses set both explicitly to reflect actual purchase and sale conditions in each currency.

### 7.2 Batch Dual Costs

Inventory batches store `unit_cost_uzs` and `unit_cost_usd` independently. FIFO COGS is calculated in both currencies from batch costs.

---

## 8. Reporting Implications

| Report Type | Currency Handling |
|-------------|-------------------|
| Sales Report | Separate UZS and USD columns; totals per currency |
| Debt Report | Separate balances; no conversion |
| Profit Report | Gross profit per currency using frozen rates and FIFO COGS |
| Inventory Valuation | Value in both UZS and USD from batch costs |
| Exchange Rate History | Chronological rate changes with effective dates |

---

## 9. Company Examples

| Company | Typical Pattern |
|---------|----------------|
| **Market** | Primarily UZS sales; USD for imported tool lines |
| **Xitoy Tovar** | USD-heavy; most B2B in USD; retail in UZS |
| **Somafix** | UZS retail; USD for bulk wholesale orders |
| **Lantian** | Mixed; rate updated weekly |
| **O'O'MQ** | UZS primary; USD for specific supplier categories |

Each company sets its own rate independently. A platform-wide "suggested rate" may be displayed but is not enforced.

---

## 10. Permissions

| Permission | Description |
|------------|-------------|
| `currency.view` | View current rate and history |
| `currency.manage` | Set new exchange rates |

---

## 11. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/currency/rate` | Current exchange rate for company |
| GET | `/api/v1/currency/rates` | Rate history (paginated) |
| POST | `/api/v1/currency/rates` | Set new exchange rate |
| POST | `/api/v1/currency/convert` | Preview conversion (non-persistent) |

---

## 12. Business Rules Summary

| ID | Rule |
|----|------|
| BR-CUR-01 | Each transaction stores `original_currency` and `exchange_rate_used` |
| BR-CUR-02 | Historical transactions NEVER recalculated when rate changes |
| BR-CUR-03 | Exchange rate is company-scoped |
| BR-CUR-04 | Sale conducted in UZS or USD (selected at transaction time) |
| BR-CUR-05 | Debt tracked separately in UZS and USD balances |
| BR-CUR-06 | Payment applied to currency-specific debt balance |
| BR-CUR-07 | Dashboard and reports show UZS and USD columns separately |
| BR-CUR-08 | Profit calculation uses transaction-time rates and FIFO costs |

---

## 13. Related Documents

- [PRODUCTS.md](./PRODUCTS.md)
- [SALES.md](./SALES.md)
- [DEBT_MANAGEMENT.md](./DEBT_MANAGEMENT.md)
- [DASHBOARD.md](./DASHBOARD.md)
- [REPORTS.md](./REPORTS.md)
- [../02-business/INDUSTRY_CONTEXT.md](../02-business/INDUSTRY_CONTEXT.md)
