# Non-Functional Requirements

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Performance

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-P01 | API read response time | p95 < 300ms | APM monitoring |
| NFR-P02 | API write response time | p95 < 800ms | APM monitoring |
| NFR-P03 | Real-time event delivery | p95 < 500ms | WebSocket latency |
| NFR-P04 | Dashboard load time | < 3 seconds | Client metrics |
| NFR-P05 | Report generation (10K rows) | < 30 seconds | Job queue metrics |
| NFR-P06 | Concurrent users per company | 50+ | Load testing |
| NFR-P07 | Database query timeout | 30 seconds max | PostgreSQL config |
| NFR-P08 | Product search | < 200ms for 100K SKUs | Index benchmark |

---

## 2. Availability & Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-A01 | System uptime | 99.5% monthly |
| NFR-A02 | Planned maintenance window | Max 4 hours/month, off-peak |
| NFR-A03 | Graceful degradation | Read-only mode if write DB unavailable |
| NFR-A04 | WebSocket reconnection | Auto-reconnect with exponential backoff |
| NFR-A05 | Transaction atomicity | ACID for all financial operations |
| NFR-A06 | Idempotent API operations | Critical writes support idempotency keys |

---

## 3. Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-S01 | Companies supported | 100+ tenants on single server |
| NFR-S02 | Products per company | 500,000 |
| NFR-S03 | Transactions per day | 10,000 per company |
| NFR-S04 | Audit log retention | 7 years, partitionable |
| NFR-S05 | Horizontal API scaling | Stateless API behind load balancer |
| NFR-S06 | Database growth | Partitioning strategy for audit/sales tables |

---

## 4. Security

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SEC01 | Transport encryption | TLS 1.3 only |
| NFR-SEC02 | Password storage | bcrypt/argon2, min 12 rounds |
| NFR-SEC03 | Token expiry | Access: 15 min, Refresh: 7 days |
| NFR-SEC04 | Brute force protection | Account lockout after 5 failures |
| NFR-SEC05 | Company isolation | Zero cross-tenant data leakage |
| NFR-SEC06 | Audit completeness | 100% of CUD and business actions logged |
| NFR-SEC07 | Session revocation | Immediate on admin force-logout |
| NFR-SEC08 | Device blocking | Immediate access denial |
| NFR-SEC09 | SQL injection prevention | Parameterized queries only |
| NFR-SEC10 | OWASP Top 10 | Mitigated per security architecture |

---

## 5. Usability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-U01 | Primary language | Uzbek |
| NFR-U02 | Theme support | Dark mode + Light mode (desktop) |
| NFR-U03 | Mobile responsiveness | All screens functional on phone |
| NFR-U04 | Cashier sale flow | Complete sale in < 30 seconds |
| NFR-U05 | Error messages | User-friendly, actionable |
| NFR-U06 | Keyboard shortcuts | Desktop POS hotkeys |
| NFR-U07 | Accessibility | WCAG 2.1 AA target (Phase 1.5) |

---

## 6. Maintainability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-M01 | Modular architecture | Independent module packages |
| NFR-M02 | API versioning | Semantic versioning, backward compatible |
| NFR-M03 | Database migrations | Versioned, reversible where possible |
| NFR-M04 | Code coverage | 80% for domain/business logic |
| NFR-M05 | Documentation | All modules documented before implementation |
| NFR-M06 | Configuration | Environment-based, no secrets in code |

---

## 7. Operability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-O01 | Health check endpoint | `/health` returns DB, Redis, disk status |
| NFR-O02 | Structured logging | JSON format, correlation IDs |
| NFR-O03 | Metrics export | Prometheus-compatible |
| NFR-O04 | Alerting | CPU, memory, disk, error rate thresholds |
| NFR-O05 | Backup frequency | Daily automated |
| NFR-O06 | Backup verification | Weekly restore test |
| NFR-O07 | Deployment | Zero-downtime rolling update via Docker |

---

## 8. Compatibility

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-C01 | Windows Desktop | Windows 10/11 |
| NFR-C02 | Android | Android 8.0+ (API 26) |
| NFR-C03 | iOS | iOS 14+ |
| NFR-C04 | Browsers (admin web fallback) | Chrome 100+, Edge 100+, Firefox 100+ |
| NFR-C05 | PostgreSQL | 16+ |
| NFR-C06 | Export formats | PDF, XLSX, CSV (UTF-8 with BOM) |

---

## 9. Data Integrity

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-D01 | FIFO accuracy | 100% match with manual calculation |
| NFR-D02 | Currency immutability | Historical transactions never recalculated |
| NFR-D03 | Stock consistency | No negative inventory without explicit override permission |
| NFR-D04 | Debt balance accuracy | Real-time balance = sum(debits) - sum(credits) |
| NFR-D05 | Referential integrity | Foreign keys enforced at DB level |

---

## 10. Compliance & Audit

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-COMP01 | Audit trail | Who, what, when, old value, new value |
| NFR-COMP02 | Data export | Company data export on request |
| NFR-COMP03 | User data deletion | Anonymization with audit retention |
| NFR-COMP04 | Financial record retention | 7 years minimum |

---

## 11. Related Documents

- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)
- [../07-security/SECURITY_ARCHITECTURE.md](../07-security/SECURITY_ARCHITECTURE.md)
- [../10-devops/MONITORING.md](../10-devops/MONITORING.md)
- [../10-devops/BACKUP_RECOVERY.md](../10-devops/BACKUP_RECOVERY.md)
