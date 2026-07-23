# SECURITY_REPORT

## 1. Identity & Access Management (IAM)
- Fine-grained RBAC with explicit permissions (e.g. `read:inventory`, `write:sales`, `admin:backups`).
- JWT authentication:
  - Cryptographically signed with HS256.
  - Separate access tokens (short lifespan) and refresh tokens (long lifespan).
  - Sessions can be remotely revoked from the Admin dashboard.

## 2. API & Network Security
- CORS enabled with strict origin whitelist.
- NestJS throttler enforces rate limits (default: 5 requests per 90 seconds for critical endpoints).
- Raw SQL queries are avoided; Prisma ORM prevents SQL Injection through parameterized queries.

## 3. Data Integrity & Logging
- `AuditLog` table registers every modifying action (create, update, delete) with IP, device ID, user, timestamp, and payload diffs.
- `IdempotencyKey` mechanism prevents double-charge or duplicated POS transactions.
