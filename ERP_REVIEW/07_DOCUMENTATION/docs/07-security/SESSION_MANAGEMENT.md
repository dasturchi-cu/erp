# Session Management

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Session Lifecycle

```
Login → Session Created (active)
      → Access token refreshed periodically
      → Logout / Expiry / Force-logout → Session Revoked
```

---

## Session Properties

| Field | Description |
|-------|-------------|
| id | UUID |
| user_id | Owner |
| device_id | Associated device |
| token_hash | Hashed refresh token |
| ip_address | Login IP |
| expires_at | Refresh token expiry |
| revoked_at | Null if active |

---

## Multi-Device Sessions

One user can have multiple active sessions (one per device). Each session is independent.

---

## Admin Controls

| Action | Effect |
|--------|--------|
| Force logout session | Revoke specific session, WebSocket notify |
| Force logout user | Revoke ALL user sessions |
| Block user | Revoke all sessions + prevent new login |
| Block device | Revoke device sessions only |

---

## Session Cleanup

Cron job daily: delete sessions where `revoked_at IS NOT NULL AND created_at < 90 days ago`.

---

## Related Documents

- [AUTHENTICATION.md](./AUTHENTICATION.md)
- [DEVICE_MANAGEMENT.md](./DEVICE_MANAGEMENT.md)
- [../08-modules/ADMIN_PANEL.md](../08-modules/ADMIN_PANEL.md)
