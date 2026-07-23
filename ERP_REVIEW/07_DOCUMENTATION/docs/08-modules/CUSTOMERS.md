# Customers Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Customers module manages the customer registry for each company. In Uzbekistan's B2B wholesale environment, the phone number is the primary customer identifier — business owners and managers search by phone daily to check debt, review purchase history, and process credit sales. The customer card consolidates contact information, partnership details, dual-currency debt balances, and complete transaction history.

Customers are company-scoped. The same phone number may exist as separate customer records in different companies (e.g., a buyer who purchases from both Market and Somafix).

---

## 2. Customer Card

### 2.1 Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `company_id` | UUID | Yes | Owning company |
| `name` | String | Yes | Customer or business name |
| `phone` | String | Yes | Primary phone number (search key) |
| `phone_secondary` | String | No | Additional contact number |
| `address` | Text | No | Physical address or delivery location |
| `partnership_start_date` | Date | No | When business relationship began |
| `notes` | Text | No | Internal notes (payment habits, preferences) |
| `status` | Enum | Yes | `ACTIVE`, `INACTIVE`, `BLOCKED` |
| `created_at` | Timestamp | Yes | Record creation |
| `updated_at` | Timestamp | Yes | Last modification |

### 2.2 Financial Fields (Computed)

| Field | Type | Description |
|-------|------|-------------|
| `total_debt_uzs` | Decimal | Current outstanding debt in UZS |
| `total_debt_usd` | Decimal | Current outstanding debt in USD |
| `total_purchases_uzs` | Decimal | Lifetime purchase total UZS |
| `total_purchases_usd` | Decimal | Lifetime purchase total USD |
| `total_payments_uzs` | Decimal | Lifetime payments received UZS |
| `total_payments_usd` | Decimal | Lifetime payments received USD |
| `last_purchase_date` | Timestamp | Most recent sale date |
| `last_payment_date` | Timestamp | Most recent payment date |
| `last_payment_amount` | Decimal | Amount of most recent payment |
| `last_payment_currency` | Enum | Currency of most recent payment |

### 2.3 Customer Card Layout

```
┌─────────────────────────────────────────────────────────────┐
│  CUSTOMER CARD — Alisher Qurilish MChJ                      │
├─────────────────────────────────────────────────────────────┤
│  Phone: +998 90 123 45 67    Status: ACTIVE               │
│  Address: Chilonzor 9-kvartal, Tashkent                     │
│  Partner since: 2024-03-15                                  │
├─────────────────────────────────────────────────────────────┤
│  DEBT BALANCE                                               │
│  UZS: 5,200,000 so'm          USD: $1,450.00               │
├─────────────────────────────────────────────────────────────┤
│  LIFETIME                                                   │
│  Purchases:  85,400,000 UZS / $6,200 USD                   │
│  Payments:   80,200,000 UZS / $4,750 USD                   │
│  Last purchase: 2026-06-15    Last payment: 2026-06-10     │
├─────────────────────────────────────────────────────────────┤
│  [New Sale] [Record Payment] [View History] [Edit]          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Phone Search

### 3.1 Primary Search Method

Phone search is the dominant customer lookup pattern in daily operations:

```
POS / Customer List → Type phone digits → Instant results
```

### 3.2 Search Behavior

| Input | Behavior |
|-------|----------|
| Full number `+998901234567` | Exact match |
| Partial `9012345` | Prefix/substring match across all formats |
| With spaces `90 123 45 67` | Normalized before search |
| Without country code `901234567` | Matches with or without +998 prefix |

### 3.3 Phone Normalization

All phone numbers stored in E.164 format internally:

```
Input formats accepted:
  +998 90 123 45 67
  998901234567
  90 123 45 67
  901234567

Stored as: +998901234567
```

### 3.4 Search Performance

- Phone field indexed for fast lookup
- Results returned within 100ms for partial matches
- POS search shows top 10 matches with name, phone, and debt summary
- Duplicate phone within company blocked on create (with override permission)

### 3.5 Quick Create from POS

When phone not found during credit sale:

1. Cashier enters phone number
2. System shows "Customer not found"
3. Quick-create form: name + phone (minimum fields)
4. Customer created and associated with sale in one flow

---

## 4. Customer History

### 4.1 Transaction Timeline

Unified chronological view of all customer activity:

| Entry Type | Icon | Data Shown |
|------------|------|------------|
| Sale | 🛒 | Sale number, items count, total, currency, cashier |
| Payment | 💰 | Amount, currency, payment type, received by |
| Return | ↩️ | Original sale ref, returned items, amount reversed |
| Adjustment | ✏️ | Manual debt adjustment (with reason) |

### 4.2 History Filters

| Filter | Options |
|--------|---------|
| Date range | Today, this week, this month, custom |
| Type | Sale, Payment, Return, All |
| Currency | UZS, USD, All |
| Branch | Filter by branch (multi-branch companies) |

### 4.3 History Example

```
2026-06-15  SALE #MKT-004521    700,000 UZS (credit)    Dilshod
2026-06-10  PAYMENT             500,000 UZS (partial)   Manager
2026-06-08  SALE #MKT-004498  $350.00 USD (credit)      Aziza
2026-06-01  PAYMENT             $200.00 USD (partial)   Manager
2026-05-28  SALE #MKT-004412  1,200,000 UZS (credit)    Dilshod
2026-05-25  RETURN #MKT-004380  −50,000 UZS            Manager
```

### 4.4 Drill-Down

Each history entry links to full transaction detail (sale receipt, payment record, return document).

---

## 5. Customer Status

| Status | Description | Effect |
|--------|-------------|--------|
| `ACTIVE` | Normal operating status | All operations allowed |
| `INACTIVE` | No longer trading | Cannot create new sales; debt still collectible |
| `BLOCKED` | Credit suspended | Cash sales allowed; credit sales blocked |

Blocked customers display warning at POS when selected. Manager can override with `customers.block.override` permission.

---

## 6. Customer Segments (Future)

Registered for Phase 2 — not implemented in initial release:

| Segment | Criteria |
|---------|----------|
| VIP | Lifetime purchases above threshold |
| Frequent debtor | Debt > 30 days outstanding |
| Inactive | No purchase in 90+ days |

---

## 7. Permissions

| Permission | Description |
|------------|-------------|
| `customers.view` | View customer list and cards |
| `customers.create` | Create new customers |
| `customers.update` | Edit customer information |
| `customers.delete` | Soft-delete (blocked if debt exists) |
| `customers.block` | Block/unblock customers |
| `customers.block.override` | Override block for credit sale |
| `customers.export` | Export customer list |

---

## 8. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customers` | List customers (paginated, searchable) |
| GET | `/api/v1/customers/search` | Phone/name quick search (optimized for POS) |
| GET | `/api/v1/customers/:id` | Customer card with balances |
| POST | `/api/v1/customers` | Create customer |
| PATCH | `/api/v1/customers/:id` | Update customer |
| DELETE | `/api/v1/customers/:id` | Soft-delete customer |
| GET | `/api/v1/customers/:id/history` | Transaction timeline |

---

## 9. Integration Points

| Module | Integration |
|--------|-------------|
| **Sales** | Customer required for credit sales; selected via phone search at POS |
| **Debt** | Debt balances computed from sales and payments |
| **Reports** | Customer debt report, purchase history export |
| **Dashboard** | Top debtors widget |
| **Notifications** | Payment reminders for high-debt customers |

---

## 10. Business Rules Summary

| ID | Rule |
|----|------|
| BR-DB-01 | Customer phone is mandatory |
| BR-DB-05 | Customer card shows purchases, payments, current debt |
| BR-DB-06 | `last_payment_date` updated on every payment |
| BR-CUS-01 | Phone unique within company |
| BR-CUS-02 | Cannot delete customer with outstanding debt |
| BR-CUS-03 | Customer name required, minimum 2 characters |

---

## 11. Related Documents

- [SALES.md](./SALES.md)
- [DEBT_MANAGEMENT.md](./DEBT_MANAGEMENT.md)
- [CURRENCY_UZS_USD.md](./CURRENCY_UZS_USD.md)
- [REPORTS.md](./REPORTS.md)
- [../02-business/INDUSTRY_CONTEXT.md](../02-business/INDUSTRY_CONTEXT.md)
