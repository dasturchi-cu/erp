# Audit Logs Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Audit Logs module provides a comprehensive, immutable trail of all significant system activity. Every create, update, and delete operation on business entities, plus key business actions (sales, payments, returns, logins) is recorded with full context including the acting user, timestamp, IP address, and before/after values. Audit logs are append-only, company-scoped, and retained for a minimum of 7 years to meet compliance requirements.

Audit logs cannot be modified or deleted by any user, including administrators. This ensures trustworthiness for dispute resolution, regulatory compliance, and security investigations.

---

## 2. Audited Events

### 2.1 CRUD Operations

| Action | Entity Types | Logged Data |
|--------|-------------|-------------|
| **CREATE** | Product, Customer, User, Company, Branch, Warehouse, Category, Role | Full new entity as `new_value` |
| **UPDATE** | All mutable entities | `old_value` and `new_value` (changed fields only) |
| **DELETE** | All soft-deletable entities | Full entity as `old_value` |

### 2.2 Business Actions

| Action | Description | Logged Data |
|--------|-------------|-------------|
| **SALE** | Sale completed | Sale ID, total, currency, customer, items summary |
| **SALE_CANCEL** | Sale voided | Sale ID, reason, reversed amounts |
| **RETURN** | Sale return processed | Return ID, original sale, items, amounts |
| **PAYMENT** | Debt payment recorded | Customer, amount, currency, payment type |
| **PAYMENT_REVERSE** | Payment reversed | Original payment ID, reason |
| **STOCK_RECEIPT** | Inventory received | Product, quantity, batch, costs |
| **STOCK_ADJUSTMENT** | Stock adjustment | Product, delta, reason code |
| **RATE_CHANGE** | Exchange rate updated | Old rate, new rate, effective from |

### 2.3 Authentication Actions

| Action | Description | Logged Data |
|--------|-------------|-------------|
| **LOGIN** | Successful authentication | User, device, IP, company context |
| **LOGIN_FAILED** | Failed authentication attempt | Email attempted, IP, failure reason |
| **LOGOUT** | User-initiated logout | User, session ID |
| **SESSION_REVOKED** | Admin force-logout | Target user, admin who revoked |
| **PASSWORD_CHANGED** | Password update | User (no password values logged) |
| **PASSWORD_RESET** | Admin-initiated reset | Target user, admin who reset |

### 2.4 Administrative Actions

| Action | Description | Logged Data |
|--------|-------------|-------------|
| **USER_BLOCKED** | User account blocked | Target user, reason, admin |
| **USER_UNBLOCKED** | User account restored | Target user, admin |
| **DEVICE_BLOCKED** | Device blocked | Device, user, admin |
| **MODULE_ENABLED** | Module activated | Module, company |
| **MODULE_DISABLED** | Module deactivated | Module, company |
| **PERMISSION_CHANGED** | Role permissions modified | Role, added/removed permissions |
| **COMPANY_SWITCHED** | User switched company context | From company, to company |

---

## 3. Audit Log Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | Company context (null for platform-level actions) |
| `user_id` | UUID | Acting user (null for system actions) |
| `action` | Enum | Action type (see Section 2) |
| `entity_type` | String | Entity category (e.g., `Product`, `Sale`, `Customer`) |
| `entity_id` | UUID | ID of affected entity |
| `old_value` | JSON | State before change (null for CREATE) |
| `new_value` | JSON | State after change (null for DELETE) |
| `metadata` | JSON | Additional context (IP, user agent, reason) |
| `ip_address` | String | Client IP address |
| `created_at` | Timestamp | Event timestamp (immutable) |

---

## 4. Old/New Value Format

### 4.1 Update Example — Product Price Change

```json
{
  "action": "UPDATE",
  "entity_type": "Product",
  "entity_id": "abc-123",
  "old_value": {
    "sale_price_uzs": 45000,
    "sale_price_usd": 3.50
  },
  "new_value": {
    "sale_price_uzs": 48000,
    "sale_price_usd": 3.75
  },
  "metadata": {
    "changed_fields": ["sale_price_uzs", "sale_price_usd"],
    "product_name": "Cement 50kg",
    "sku": "MKT-CEM-50"
  }
}
```

### 4.2 Business Action Example — Sale

```json
{
  "action": "SALE",
  "entity_type": "Sale",
  "entity_id": "sale-456",
  "old_value": null,
  "new_value": {
    "sale_number": "MKT-2026-004521",
    "total_uzs": 700000,
    "total_usd": 54.90,
    "original_currency": "UZS",
    "payment_type": "CASH",
    "customer_id": null,
    "item_count": 2
  },
  "metadata": {
    "cashier": "Dilshod Karimov",
    "branch": "Tashkent Main"
  }
}
```

### 4.3 Login Example

```json
{
  "action": "LOGIN",
  "entity_type": "Session",
  "entity_id": "session-789",
  "old_value": null,
  "new_value": {
    "user_email": "sarvar@market.uz",
    "device": "MacBook Pro",
    "company": "Market"
  },
  "metadata": {
    "ip_address": "192.168.1.5",
    "user_agent": "ERP Desktop/1.0.0 (macOS 14.5)"
  }
}
```

---

## 5. Audit Log Viewer

### 5.1 List View

```
┌──────────────────────────────────────────────────────────────────────────┐
│  AUDIT LOGS                                                              │
│  Period: [Today ▼]  Action: [All ▼]  Entity: [All ▼]  User: [All ▼]     │
├──────────┬──────────┬──────────┬──────────────┬──────────────────────────┤
│ Time     │ User     │ Action   │ Entity       │ Summary                  │
├──────────┼──────────┼──────────┼──────────────┼──────────────────────────┤
│ 14:32:05 │ Dilshod  │ SALE     │ Sale         │ #MKT-004521 — 700,000 UZS│
│ 14:28:10 │ Sarvar   │ PAYMENT  │ Customer     │ Alisher — 500,000 UZS    │
│ 14:15:00 │ Sarvar   │ UPDATE   │ Product      │ Cement 50kg — price change│
│ 13:45:22 │ Aziza    │ LOGIN    │ Session      │ Web Browser — 10.0.0.45  │
│ 12:30:00 │ System   │ RATE_CHG │ ExchangeRate │ 12,750 → 12,800 UZS/USD  │
└──────────┴──────────┴──────────┴──────────────┴──────────────────────────┘
```

### 5.2 Detail View

Clicking an audit entry opens full detail with:
- Complete old/new value JSON (formatted, syntax-highlighted)
- User information and role at time of action
- IP address and device info
- Related entity link (navigate to product, sale, customer, etc.)
- Subsequent related events (e.g., sale → FIFO allocations → inventory movements)

### 5.3 Filters

| Filter | Options |
|--------|---------|
| Date range | Presets + custom |
| Action type | CREATE, UPDATE, DELETE, SALE, PAYMENT, LOGIN, etc. |
| Entity type | Product, Customer, Sale, User, etc. |
| User | Specific user or all |
| Entity ID | Direct lookup by entity ID |
| IP address | Filter by source IP |

---

## 6. Immutability and Integrity

### 6.1 Append-Only

| Rule | Description |
|------|-------------|
| AUD-01 | Audit records are never updated |
| AUD-02 | Audit records are never deleted (within retention period) |
| AUD-03 | No API endpoint exists for audit modification |
| AUD-04 | Database triggers prevent UPDATE/DELETE on audit table |
| AUD-05 | Audit writes occur within the same transaction as the business operation |

### 6.2 Tamper Detection (Future)

Phase 2 enhancement:
- Hash chain linking consecutive audit entries
- Periodic integrity verification job
- Export with cryptographic signature

---

## 7. Retention Policy

| Policy | Value |
|--------|-------|
| Minimum retention | 7 years |
| Storage | PostgreSQL (primary), archived to cold storage after 2 years |
| Archival format | Compressed JSON lines per month |
| Purge | Only after 7 years, via automated job with admin notification |
| Legal hold | Admin can flag date ranges for extended retention |

---

## 8. Scoping

| Scope | Rule |
|-------|------|
| Company users | See only audit logs for their active company |
| Platform admins | See all companies (with company filter) |
| Cross-company | No user sees audit logs from companies they don't belong to |

---

## 9. Export

Audit logs exportable via Reports module:

| Format | Use Case |
|--------|----------|
| CSV | Analysis, compliance submission |
| Excel | Review with filters and formatting |
| PDF | Formal audit report with signatures |

Export itself creates an audit log entry (meta-audit).

---

## 10. Permissions

| Permission | Description |
|------------|-------------|
| `audit.view` | View audit logs for own company |
| `audit.export` | Export audit logs |
| `audit.view.all` | View audit logs across all companies (platform admin) |

---

## 11. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/audit-logs` | List audit logs (paginated, filterable) |
| GET | `/api/v1/audit-logs/:id` | Audit log detail |
| GET | `/api/v1/audit-logs/entity/:type/:id` | All audit entries for specific entity |

---

## 12. Business Rules Summary

| ID | Rule |
|----|------|
| BR-AUD-01 | All Create, Update, Delete operations logged |
| BR-AUD-02 | Business actions logged: Sale, Payment, Return, Login, Logout |
| BR-AUD-03 | Audit records are append-only |
| BR-AUD-04 | Audit log stores old and new values as JSON |
| BR-AUD-05 | Audit retention: 7 years minimum |

---

## 13. Related Documents

- [ADMIN_PANEL.md](./ADMIN_PANEL.md)
- [SALES.md](./SALES.md)
- [DEBT_MANAGEMENT.md](./DEBT_MANAGEMENT.md)
- [REPORTS.md](./REPORTS.md)
- [../07-security/AUDIT_SECURITY.md](../07-security/AUDIT_SECURITY.md)
- [../05-database/DATA_RETENTION_POLICY.md](../05-database/DATA_RETENTION_POLICY.md)
