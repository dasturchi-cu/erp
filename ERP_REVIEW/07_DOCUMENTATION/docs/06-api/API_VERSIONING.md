# API Versioning

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Strategy

URL path versioning: `/api/v1/`, `/api/v2/`

---

## Rules

1. **v1 is stable** — no breaking changes once released
2. **Additive changes only** in minor versions (new fields, new endpoints)
3. **Breaking changes** require new major version (v2)
4. **Deprecation period**: 6 months notice before removing v1 endpoints
5. **WebSocket events** versioned via `protocolVersion` in handshake

---

## Breaking vs Non-Breaking

| Change | Type |
|--------|------|
| Add optional field to response | Non-breaking |
| Add new endpoint | Non-breaking |
| Remove field from response | Breaking |
| Rename field | Breaking |
| Change field type | Breaking |
| Change URL path | Breaking |
| Change error code | Breaking |

---

## Client Version Header

```
X-Client-Version: desktop/1.0.0
X-Client-Platform: windows | android | ios
```

Server may reject outdated clients with `426 Upgrade Required`.

---

## Related Documents

- [API_DESIGN.md](./API_DESIGN.md)
- [API_STANDARDS.md](./API_STANDARDS.md)
