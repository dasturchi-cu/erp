# Authentication

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Flow

```
Client → POST /auth/login { email, password, deviceInfo }
Server → Validate credentials
       → Check user status (not blocked)
       → Check device status (not blocked)
       → Register/update device record
       → Create session
       → Return { accessToken, refreshToken, expiresIn, user, permissions, modules }
Client → Store tokens securely
       → Connect WebSocket with accessToken
```

---

## Token Strategy

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access Token (JWT) | 15 minutes | Memory (desktop), secure storage (mobile) |
| Refresh Token | 7 days | HttpOnly cookie (web) / secure storage (native) |

### JWT Payload
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "company_id": "company-uuid",
  "branch_id": "branch-uuid",
  "session_id": "session-uuid",
  "device_id": "device-uuid",
  "permissions": ["sales.create", "products.view"],
  "iat": 1710000000,
  "exp": 1710000900
}
```

---

## Password Policy

- Minimum 8 characters
- Hashed with bcrypt (12 rounds) or argon2id
- Password change forces logout of all other sessions

---

## Login Security

- 5 failed attempts → 15-minute lockout
- Login events audit-logged with IP and device
- Suspicious login (new device) → notification to admin

---

## Related Documents

- [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md)
- [DEVICE_MANAGEMENT.md](./DEVICE_MANAGEMENT.md)
