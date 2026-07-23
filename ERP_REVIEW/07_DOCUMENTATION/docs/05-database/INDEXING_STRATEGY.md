# Indexing Strategy

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Standard Indexes

Every tenant-scoped table:
```sql
CREATE INDEX idx_{table}_company_id ON {table}(company_id);
```

Every soft-deleted table:
```sql
CREATE INDEX idx_{table}_active ON {table}(company_id) WHERE deleted_at IS NULL;
```

---

## Table-Specific Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| products | `(company_id, sku)` UNIQUE | SKU lookup |
| products | `(company_id, barcode)` UNIQUE WHERE barcode IS NOT NULL | Barcode scan |
| products | `GIN(to_tsvector('simple', name))` | Full-text search |
| inventory_batches | `(company_id, product_id, received_at ASC)` | FIFO ordering |
| sales | `(company_id, created_at DESC)` | Sales history, dashboard |
| sales | `(company_id, customer_id, created_at DESC)` | Customer purchases |
| customers | `(company_id, phone)` | Phone search |
| debt_payments | `(company_id, customer_id, created_at DESC)` | Payment history |
| audit_logs | `(company_id, created_at DESC)` | Audit queries |
| audit_logs | `(entity_type, entity_id)` | Entity audit trail |
| sessions | `(user_id) WHERE revoked_at IS NULL` | Active sessions |
| devices | `(user_id, status)` | User devices |
| exchange_rates | `(company_id, effective_from DESC)` | Current rate lookup |

---

## Monitoring

- Run `pg_stat_user_indexes` monthly to identify unused indexes
- EXPLAIN ANALYZE on slow queries > 100ms
- Autovacuum tuning for high-write tables (sales, audit_logs)

---

## Related Documents

- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
- [SCHEMA_DESIGN.md](./SCHEMA_DESIGN.md)
