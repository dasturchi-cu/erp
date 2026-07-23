# Security Architecture

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Defense in Depth

```
Layer 1: Network     — Firewall, TLS 1.3, rate limiting
Layer 2: Edge        — Nginx, WAF rules, IP filtering
Layer 3: Application — Auth, RBAC, input validation, CSRF
Layer 4: Data        — RLS, encryption at rest, audit logs
Layer 5: Operations  — Backup, monitoring, incident response
```

---

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Unauthorized access | JWT + RBAC + device trust |
| Cross-tenant data leak | company_id scoping + RLS |
| Session hijacking | Short-lived tokens, device binding |
| Brute force | Rate limiting, account lockout |
| SQL injection | Parameterized queries (Prisma ORM) |
| XSS | Content Security Policy, output encoding |
| CSRF | SameSite cookies, token-based auth |
| Man-in-the-middle | TLS 1.3 everywhere |
| Insider threat | Audit logs, permission granularity |
| DDoS | Nginx rate limiting, connection limits |
| Data loss | Daily backup, cloud redundancy |

---

## Security Headers (Nginx)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Secrets Management

- All secrets in environment variables (`.env` never committed)
- Docker secrets for production
- JWT signing key rotated quarterly
- Database credentials unique per environment

---

## Related Documents

- [AUTHENTICATION.md](./AUTHENTICATION.md)
- [AUTHORIZATION.md](./AUTHORIZATION.md)
- [RBAC_DESIGN.md](./RBAC_DESIGN.md)
- [ENCRYPTION_STANDARDS.md](./ENCRYPTION_STANDARDS.md)
