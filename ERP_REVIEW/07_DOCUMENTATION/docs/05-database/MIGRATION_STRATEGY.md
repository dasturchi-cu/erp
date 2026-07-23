# Migration Strategy

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Tool | Prisma Migrate |
| Last Updated | 2026-06-17 |

---

## Principles

1. All schema changes via versioned migrations — never manual DDL in production
2. Migrations are forward-only in production; rollbacks use down migrations on staging only
3. Destructive changes require data migration scripts
4. Each migration tested on staging before production

---

## Naming Convention

```
YYYYMMDDHHMMSS_description.sql

Examples:
20260617000001_init_core_tables
20260617000002_add_products_module
20260617000003_add_fifo_tables
```

---

## Migration Workflow

```
Developer changes schema.prisma
    → npx prisma migrate dev --name description
    → Review generated SQL
    → Test locally
    → PR with migration files
    → CI runs migrate on test DB
    → Merge → Staging deploy runs migrate deploy
    → Production deploy runs migrate deploy
```

---

## Zero-Downtime Rules

- Add columns as nullable first, backfill, then add NOT NULL constraint
- Never drop columns in same release as code change
- Use `CREATE INDEX CONCURRENTLY` for large tables
- Rename via: add new column → copy data → update code → drop old column

---

## Seed Data

`prisma/seed.ts` creates:
- Default modules registry
- System roles (Admin, Manager, Cashier, Warehouse Keeper)
- Default permissions per module
- Demo company (development only)

---

## Related Documents

- [SCHEMA_DESIGN.md](./SCHEMA_DESIGN.md)
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
