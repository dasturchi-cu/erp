# Authorization

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Model

**RBAC + Fine-Grained Permissions**

```
User → Role(s) per Company → Permissions → API Endpoint Guards
```

---

## Authorization Flow

```
Request → JWT validated → Extract permissions[]
        → Route guard checks required permission
        → Module guard checks module enabled
        → Company guard checks company_id scope
        → Handler executes
```

---

## Guard Implementation

```typescript
@UseGuards(AuthGuard, PermissionGuard, ModuleGuard)
@RequirePermission('sales.create')
@RequireModule('sales')
@Post('/sales')
createSale(@Body() dto: CreateSaleDto) { ... }
```

---

## Client-Side Authorization

- UI elements hidden based on permissions (UX only)
- Server always enforces — client checks are not security

---

## Related Documents

- [RBAC_DESIGN.md](./RBAC_DESIGN.md)
- [PERMISSIONS_MODEL.md](./PERMISSIONS_MODEL.md)
