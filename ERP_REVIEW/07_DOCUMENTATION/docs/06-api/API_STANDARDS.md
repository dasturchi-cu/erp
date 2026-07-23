# API Standards

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## REST Conventions

| Rule | Standard |
|------|----------|
| Resource names | Plural nouns: `/products`, `/sales` |
| IDs in path | UUID: `/products/{id}` |
| Filtering | Query params: `?status=active&category_id=uuid` |
| Sorting | `?sort=created_at:desc` |
| Pagination | `?page=1&limit=20` (default limit: 20, max: 100) |
| Field selection | `?fields=id,name,sku` (optional) |
| Search | `?q=search_term` |

---

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (no permission / module disabled) |
| 404 | Not Found |
| 409 | Conflict (duplicate SKU) |
| 422 | Unprocessable Entity (business rule violation) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Idempotency

Critical write endpoints accept `Idempotency-Key` header:
- `POST /sales`
- `POST /debt-payments`

Duplicate key within 24h returns original response.

---

## Rate Limiting

| Scope | Limit |
|-------|-------|
| Login | 5 attempts / 15 min per IP |
| API (authenticated) | 1000 req / min per user |
| API (unauthenticated) | 60 req / min per IP |
| Report generation | 10 / hour per user |

---

## Date/Time Format

ISO 8601: `2026-06-17T14:30:00+05:00`

---

## Money Format

```json
{
  "amount": "1250000.0000",
  "currency": "UZS"
}
```

Always string in JSON to preserve precision.

---

## Related Documents

- [API_DESIGN.md](./API_DESIGN.md)
- [API_VERSIONING.md](./API_VERSIONING.md)
