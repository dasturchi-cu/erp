# Database Architecture

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Engine | PostgreSQL 16+ |
| Last Updated | 2026-06-17 |

---

## 1. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | PostgreSQL 16 | ACID, RLS, JSONB, mature |
| Multi-tenancy | Shared DB, shared schema | Cost-effective, simpler ops |
| Tenant key | `company_id UUID` on all tenant tables | Standard pattern |
| ORM | Prisma | Type-safe, migration management |
| IDs | UUID v4 | Globally unique, no sequential leaks |
| Money | NUMERIC(18,4) | No floating point errors |
| Timestamps | TIMESTAMPTZ | Timezone-aware |
| Soft delete | `deleted_at TIMESTAMPTZ` | Audit compliance |

---

## 2. Connection Architecture

```
Application (NestJS)
    → PgBouncer (connection pooling, transaction mode)
    → PostgreSQL Primary (read/write)
    → [Phase 2] Read Replica (reports only)
```

### Pool Settings
- Max connections: 100 (PgBouncer)
- App pool size: 20 per instance
- Statement timeout: 30s

---

## 3. Multi-Tenancy Enforcement

### Layer 1: Application
Every repository query includes `WHERE company_id = :companyId` from JWT.

### Layer 2: PostgreSQL RLS
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON products
  USING (company_id = current_setting('app.current_company_id')::uuid);
```

### Layer 3: Integration Tests
Automated tests verify zero cross-tenant data leakage.

---

## 4. Schema Organization

| Schema | Purpose |
|--------|---------|
| `public` | All application tables |
| `audit` | Partitioned audit logs (future) |

---

## 5. Indexing Strategy

- All `company_id` columns indexed
- Composite indexes: `(company_id, sku)`, `(company_id, created_at DESC)`
- Partial indexes: `WHERE deleted_at IS NULL`
- GIN index on `audit_logs.old_value`, `audit_logs.new_value` (JSONB)

---

## 6. Partitioning (Phase 2)

| Table | Strategy | Key |
|-------|----------|-----|
| `audit_logs` | Range by month | `created_at` |
| `sales` | Range by year | `created_at` |

---

## 7. Backup Integration

- `pg_dump --format=custom` daily
- WAL archiving for point-in-time recovery (Phase 2)
- See [BACKUP_RECOVERY.md](../10-devops/BACKUP_RECOVERY.md)

---

## Related Documents

- [ERD_OVERVIEW.md](./ERD_OVERVIEW.md)
- [SCHEMA_DESIGN.md](./SCHEMA_DESIGN.md)
- [MULTI_TENANCY_DESIGN.md](./MULTI_TENANCY_DESIGN.md)
- [INDEXING_STRATEGY.md](./INDEXING_STRATEGY.md)
