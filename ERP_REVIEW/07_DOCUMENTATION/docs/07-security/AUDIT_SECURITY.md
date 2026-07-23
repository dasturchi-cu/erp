# Audit Security

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Security-Specific Audit Events

| Action | Logged Data |
|--------|-------------|
| LOGIN | userId, ip, deviceId, success/failure |
| LOGOUT | userId, sessionId |
| LOGIN_FAILED | email, ip, reason |
| USER_BLOCKED | adminId, targetUserId |
| USER_UNBLOCKED | adminId, targetUserId |
| DEVICE_BLOCKED | adminId, deviceId |
| SESSION_REVOKED | adminId, sessionId |
| PERMISSION_CHANGED | adminId, roleId, oldPerms, newPerms |
| MODULE_DISABLED | adminId, moduleId |
| PASSWORD_CHANGED | userId |

---

## Audit Log Protection

- Append-only table (no UPDATE/DELETE permissions for app user)
- Separate DB role for audit writes
- Admin can view but not modify audit logs
- Tamper detection: hash chain (Phase 2)

---

## Related Documents

- [../08-modules/AUDIT_LOGS.md](../08-modules/AUDIT_LOGS.md)
- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
