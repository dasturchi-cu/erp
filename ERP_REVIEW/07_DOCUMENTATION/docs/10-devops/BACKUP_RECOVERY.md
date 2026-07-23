# Backup and Recovery

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

The ERP platform implements automated **daily PostgreSQL backups** compressed into ZIP archives, stored in **two locations**: local server storage and cloud object storage (S3-compatible). This dual-storage strategy protects against both server hardware failure and local storage corruption.

**Recovery Point Objective (RPO)**: 24 hours (daily backup cycle)
**Recovery Time Objective (RTO)**: 4 hours (see [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md))

---

## 2. Backup Strategy

### What Is Backed Up

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| PostgreSQL database | `pg_dump` (custom format) | Daily 02:00 | 30 days local, 90 days cloud |
| Database schema only | `pg_dump --schema-only` | Weekly (Sunday) | 90 days |
| Redis data | Not backed up | — | Rebuildable from PostgreSQL |
| Application config | `.env` files (encrypted) | On change | Git-tracked templates |
| Nginx config | File copy | On change | Git-tracked |
| Grafana dashboards | JSON export | Weekly | Git-tracked |
| Uploaded files | S3 sync | Daily | 30 days |
| SSL certificates | Certbot auto-managed | Auto-renewed | N/A |

### What Is NOT Backed Up

| Component | Reason | Recovery Method |
|-----------|--------|-----------------|
| Redis cache/sessions | Ephemeral; rebuildable | Users re-login |
| Docker images | Rebuilt from Git | CI/CD pipeline |
| Prometheus metrics | Operational, not business data | Re-establish baselines |
| WebSocket connections | Transient | Clients auto-reconnect |

---

## 3. Backup Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Backup Sidecar Container            │
│                                                      │
│  Cron: 0 2 * * * (daily 02:00 Asia/Tashkent)        │
│                                                      │
│  1. pg_dump → /tmp/erp_backup_{date}.dump           │
│  2. ZIP compress → erp_backup_{date}.zip            │
│  3. SHA-256 checksum → erp_backup_{date}.sha256      │
│  4. Copy to local volume → /backups/local/          │
│  5. Upload to cloud → s3://erp-backups/daily/       │
│  6. Verify upload (HEAD request)                     │
│  7. Prune old backups (retention policy)             │
│  8. Emit metric: backup_last_success_timestamp       │
└─────────────────────────────────────────────────────┘
```

---

## 4. Backup File Format

### ZIP Archive Contents

| File | Description |
|------|-------------|
| `database.dump` | PostgreSQL custom-format dump (pg_dump -Fc) |
| `metadata.json` | Backup metadata (see below) |
| `schema.sql` | Plain SQL schema snapshot |
| `checksums.sha256` | Integrity checksums for all files |

### Metadata File

```json
{
  "version": "1.0.0",
  "createdAt": "2026-06-17T02:00:15+05:00",
  "databaseName": "erp_production",
  "databaseSize": "1.2GB",
  "pgVersion": "16.3",
  "appVersion": "1.4.0",
  "tableCount": 42,
  "recordCounts": {
    "products": 15230,
    "sales": 89421,
    "customers": 3201
  },
  "durationSeconds": 45,
  "compressionRatio": 0.35
}
```

### Naming Convention

```
erp_backup_{YYYY-MM-DD}_{HH-MM}.zip
erp_backup_{YYYY-MM-DD}_{HH-MM}.sha256
```

Example: `erp_backup_2026-06-17_02-00.zip`

---

## 5. Storage Locations

### Local Storage

| Property | Value |
|----------|-------|
| Path | `/opt/erp/backups/local/` |
| Volume | `erp-backup-local` (Docker named volume) |
| Retention | 30 days (rolling) |
| Max size | 50 GB (alert at 80%) |
| Access | Server root and backup sidecar only |

### Cloud Storage (S3-Compatible)

| Property | Value |
|----------|-------|
| Provider | MinIO (self-hosted) or AWS S3 / Cloudflare R2 |
| Bucket | `erp-backups` |
| Path prefix | `daily/{YYYY}/{MM}/` |
| Retention | 90 days (lifecycle policy) |
| Encryption | Server-side AES-256 |
| Access | IAM credentials in `.env`; read-only for recovery |

### Storage Sizing Estimates

| Companies | Est. DB Size | Daily Backup (compressed) | Monthly Storage |
|-----------|-------------|--------------------------|-----------------|
| 1–5 | 500 MB – 2 GB | 200 MB – 700 MB | 6 – 21 GB |
| 5–20 | 2 – 10 GB | 700 MB – 3.5 GB | 21 – 105 GB |
| 20–50 | 10 – 50 GB | 3.5 – 17 GB | 105 – 510 GB |

---

## 6. Backup Schedule

| Schedule | Time (Asia/Tashkent) | Type | Duration (est.) |
|----------|---------------------|------|-----------------|
| Daily full | 02:00 | pg_dump + ZIP + upload | 2–15 min |
| Weekly schema | Sunday 03:00 | Schema-only dump | < 1 min |
| Monthly verify | 1st of month 04:00 | Restore to test DB + validate | 30–60 min |
| On-demand | Manual trigger | Full backup before major deploy | 2–15 min |

**Why 02:00?** Lowest business activity window. Uzbekistan businesses typically closed.

### Pre-Deployment Backup

Production deployments automatically trigger an on-demand backup before migration execution (see [CI_CD.md](./CI_CD.md)).

---

## 7. Recovery Procedures

### Scenario A: Restore Single Table

**When**: Accidental data deletion in one table; database otherwise healthy.

| Step | Action | Duration |
|------|--------|----------|
| 1 | Identify affected table and deletion timeframe | 5 min |
| 2 | Download latest backup ZIP from cloud | 5 min |
| 3 | Extract `database.dump` from ZIP | 1 min |
| 4 | Restore single table: `pg_restore -t {table} -d erp_production` | 5–30 min |
| 5 | Verify record counts and data integrity | 15 min |
| 6 | Resume normal operations | — |

**Downtime**: None (table-level restore is online).

### Scenario B: Full Database Restore

**When**: Database corruption, catastrophic data loss, or server migration.

| Step | Action | Duration |
|------|--------|----------|
| 1 | Stop API containers (prevent writes) | 1 min |
| 2 | Download backup ZIP (latest or specific date) | 5–15 min |
| 3 | Verify SHA-256 checksum | 1 min |
| 4 | Drop and recreate database | 2 min |
| 5 | `pg_restore -d erp_production database.dump` | 15–60 min |
| 6 | Run any pending migrations (if backup is behind) | 5 min |
| 7 | Verify: record counts, test login, test sale | 15 min |
| 8 | Start API containers | 1 min |
| 9 | Verify health check and WebSocket | 5 min |

**Downtime**: 30 minutes – 2 hours (depending on database size).

### Scenario C: Point-in-Time Recovery (Future)

**When**: Need to recover to a specific moment (e.g., before a bad migration).

Requires WAL archiving (Phase 2 enhancement):

| Component | Configuration |
|-----------|---------------|
| WAL archiving | `archive_mode = on` |
| Archive destination | S3 `erp-backups/wal/` |
| Recovery | `pg_restore` + WAL replay to target timestamp |
| RPO improvement | Minutes instead of 24 hours |

---

## 8. Backup Verification

### Automated Monthly Verification

| Step | Check |
|------|-------|
| 1 | Download latest cloud backup |
| 2 | Restore to isolated `erp_backup_test` database |
| 3 | Compare table counts with metadata.json |
| 4 | Run sample queries (latest sale, product count) |
| 5 | Record verification result in monitoring |
| 6 | Drop test database |

### Verification Metrics

| Metric | Alert If |
|--------|----------|
| `backup_last_success_timestamp` | > 26 hours ago |
| `backup_size_bytes` | Deviation > 50% from 7-day average |
| `backup_duration_seconds` | > 30 minutes |
| `backup_verification_last_success` | > 35 days ago |
| `backup_cloud_upload_success` | Failed |

---

## 9. Security

| Concern | Mitigation |
|---------|------------|
| Backup contains all business data | Encrypted at rest (cloud); access restricted |
| Backup transfer | TLS for S3 upload |
| Backup access credentials | Separate IAM policy; read-only for recovery |
| Local backup theft | Server access restricted; encrypted disk |
| Backup tampering | SHA-256 checksums verified before restore |
| Compliance | Backups included in data retention policy (see [../05-database/DATA_RETENTION_POLICY.md](../05-database/DATA_RETENTION_POLICY.md)) |

---

## 10. Backup Monitoring Dashboard

Grafana panel specifications:

| Panel | Query | Alert |
|-------|-------|-------|
| Last Successful Backup | `backup_last_success_timestamp` | > 26h |
| Backup Size Trend | `backup_size_bytes` over 30 days | Anomaly detection |
| Backup Duration | `backup_duration_seconds` | > 1800s |
| Cloud Upload Status | `backup_cloud_upload_success` | == 0 |
| Local Storage Usage | Disk usage of backup volume | > 80% |
| Verification Status | `backup_verification_last_success` | > 35 days |

---

## 11. Manual Backup Command

For on-demand backups outside the scheduled cron:

```bash
# Trigger manual backup
docker compose exec backup /scripts/backup.sh --manual

# List available backups
docker compose exec backup /scripts/backup.sh --list

# Verify specific backup
docker compose exec backup /scripts/backup.sh --verify erp_backup_2026-06-17_02-00.zip
```

---

## 12. Related Documents

- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [MONITORING.md](./MONITORING.md)
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
- [../05-database/DATA_RETENTION_POLICY.md](../05-database/DATA_RETENTION_POLICY.md)
