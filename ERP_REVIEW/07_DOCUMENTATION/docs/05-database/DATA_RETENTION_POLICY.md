# Data Retention Policy

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Retention Periods

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| Financial transactions (sales, payments) | 7 years | Archive then purge |
| Audit logs | 7 years | Partition drop |
| Products (soft-deleted) | 2 years | Hard delete |
| Customers (soft-deleted) | 2 years | Anonymize PII, keep transactions |
| Sessions (revoked/expired) | 90 days | Hard delete |
| Notifications (read) | 30 days | Hard delete |
| Report exports (files) | 7 days | Object storage lifecycle |
| Backups (local) | 7 days | Automated cleanup |
| Backups (cloud) | 30 days | Cloud lifecycle policy |

---

## GDPR / Privacy

- Customer phone numbers are PII — masked in logs
- User deletion: anonymize email to `deleted-{uuid}@anonymized.local`
- Data export available per company on admin request

---

## Archival Strategy (Phase 2)

Tables > 10M rows partitioned by month. Partitions older than retention period moved to cold storage (compressed).

---

## Related Documents

- [../10-devops/BACKUP_RECOVERY.md](../10-devops/BACKUP_RECOVERY.md)
- [../08-modules/AUDIT_LOGS.md](../08-modules/AUDIT_LOGS.md)
