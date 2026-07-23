# API Design

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Base URL | `https://api.erp.example.com/api/v1` |
| Protocol | HTTPS (REST) + WSS (WebSocket) |
| Last Updated | 2026-06-17 |

---

## Architecture

- **REST API**: CRUD operations, transactions, queries
- **WebSocket**: Real-time events, notifications, session control
- **Versioning**: URL prefix `/api/v1/`
- **Format**: JSON (UTF-8)

---

## Request Standards

### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
X-Request-Id: {uuid}
X-Device-Id: {device_uuid}
```

### Pagination Response
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Not enough stock for product ABC",
    "details": { "productId": "uuid", "available": 5, "requested": 10 }
  }
}
```

---

## Authentication Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke current session |
| GET | `/auth/me` | Current user profile + permissions |
| POST | `/auth/switch-company` | Switch company context |

---

## Module Endpoints (Summary)

See [REST_API_REFERENCE.md](./REST_API_REFERENCE.md) for complete list.

---

## WebSocket

See [WEBSOCKET_EVENTS.md](./WEBSOCKET_EVENTS.md).

---

## Related Documents

- [API_STANDARDS.md](./API_STANDARDS.md)
- [REST_API_REFERENCE.md](./REST_API_REFERENCE.md)
- [ERROR_HANDLING.md](./ERROR_HANDLING.md)
