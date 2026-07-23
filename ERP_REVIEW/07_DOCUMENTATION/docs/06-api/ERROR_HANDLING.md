# Error Handling

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {},
    "requestId": "uuid"
  }
}
```

---

## Error Code Catalog

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `MODULE_DISABLED` | 403 | Module is disabled |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_SKU` | 409 | SKU already exists |
| `DUPLICATE_BARCODE` | 409 | Barcode already exists |
| `INSUFFICIENT_STOCK` | 422 | Not enough inventory |
| `INVALID_CURRENCY` | 422 | Unsupported currency |
| `USER_BLOCKED` | 403 | User account blocked |
| `DEVICE_BLOCKED` | 403 | Device blocked |
| `SESSION_REVOKED` | 401 | Session terminated by admin |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Client Handling

| Error | Client Action |
|-------|---------------|
| 401 TOKEN_EXPIRED | Auto-refresh token, retry |
| 401 SESSION_REVOKED | Redirect to login |
| 403 MODULE_DISABLED | Hide module, show toast |
| 403 DEVICE_BLOCKED | Show blocked screen |
| 422 INSUFFICIENT_STOCK | Show available qty in UI |
| 500 | Show generic error + requestId for support |

---

## Related Documents

- [API_STANDARDS.md](./API_STANDARDS.md)
