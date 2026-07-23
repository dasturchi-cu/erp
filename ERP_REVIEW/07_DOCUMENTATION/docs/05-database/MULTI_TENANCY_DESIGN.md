# Multi-Tenancy Design

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Model: Shared Database, Shared Schema

All companies share one PostgreSQL database. Isolation enforced by `company_id` discriminator column.

---

## Isolation Layers

### Layer 1: JWT Context
```json
{
  "sub": "user-uuid",
  "company_id": "company-uuid",
  "branch_id": "branch-uuid",
  "permissions": ["sales.create", "products.view"]
}
```

### Layer 2: Repository Guard
```typescript
class ProductRepository {
  async findAll(companyId: string) {
    return this.db.product.findMany({
      where: { companyId, deletedAt: null }
    });
  }
}
```

### Layer 3: PostgreSQL RLS
```sql
SET app.current_company_id = 'uuid-from-jwt';
-- All queries automatically filtered
```

### Layer 4: API Middleware
Reject any request where body/query contains `company_id` differing from JWT.

---

## Company Examples (from Master Plan)

| Company | Code | Notes |
|---------|------|-------|
| Market | MARKET | General retail |
| O'O'MQ | OOMQ | Industry-specific |
| Xitoy Tovar | XITOY | USD-heavy imports |
| Somafix | SOMAFIX | Sealant products |
| Lantian | LANTIAN | Multi-product |

---

## User Multi-Company Access

```
User "Alisher" →
  Market (Manager)
  Somafix (Admin)
  Xitoy Tovar (Cashier)
```

Company switcher issues new JWT with selected `company_id`. All data queries scoped immediately.

---

## Testing Requirements

- [ ] User in Company A cannot access Company B product by ID
- [ ] API with tampered company_id in body returns 403
- [ ] WebSocket events only delivered to same company subscribers
- [ ] Reports only include own company data
- [ ] Audit logs scoped per company

---

## Related Documents

- [../08-modules/MULTI_COMPANY.md](../08-modules/MULTI_COMPANY.md)
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
