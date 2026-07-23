# Device Management

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Device Registration

On first login from a new client:
```json
{
  "name": "Alisher's iPhone",
  "platform": "ios",
  "osVersion": "17.4",
  "appVersion": "1.0.0"
}
```

Server creates device record, links to user.

---

## Device Properties

| Field | Description |
|-------|-------------|
| id | UUID (persistent across sessions) |
| user_id | Owner |
| name | User-friendly name (auto-detected or custom) |
| platform | windows, android, ios, macos |
| os_version | OS version string |
| ip_address | Last known IP |
| status | ACTIVE, BLOCKED |
| last_seen_at | Last activity timestamp |

---

## Admin Device Panel

Displays:
- Device name and platform icon
- User name
- Login time (current session)
- IP address
- OS version
- Status badge

Actions:
- **Force Logout** — end session on this device
- **Block** — prevent future logins from this device
- **Unblock** — restore access

---

## Client Device ID

- Generated on first app launch (UUID)
- Stored in secure storage
- Sent with every API request (`X-Device-Id` header)
- Persists across app reinstalls (if secure storage intact)

---

## Related Documents

- [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md)
- [../08-modules/ADMIN_PANEL.md](../08-modules/ADMIN_PANEL.md)
