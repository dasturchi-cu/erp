# Encryption Standards

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## In Transit

| Connection | Protocol |
|------------|----------|
| Client ↔ Server | TLS 1.3 |
| Server ↔ PostgreSQL | TLS (production) |
| Server ↔ Redis | TLS (production) |

---

## At Rest

| Data | Method |
|------|--------|
| Passwords | bcrypt (12 rounds) or argon2id |
| Refresh tokens | SHA-256 hash stored, plaintext never persisted |
| Database | PostgreSQL transparent encryption or disk-level LUKS |
| Backups | AES-256 encrypted ZIP |
| Mobile tokens | Flutter Secure Storage (Keychain/Keystore) |

---

## JWT Signing

- Algorithm: RS256 (asymmetric) or HS256 with 256-bit secret
- Key rotation: quarterly, support 2 active keys during transition

---

## Related Documents

- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
