# Monitoring and Alerting

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The ERP platform monitoring stack uses **Prometheus** for metrics collection and **Grafana** for visualization and alerting. Health checks at multiple layers ensure early detection of service degradation, resource exhaustion, and security anomalies.

**Design principle**: Monitor what matters to business operations — if a cashier cannot complete a sale, we must know within 60 seconds.

---

## 2. Monitoring Architecture

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│   API    │  │ Postgres │  │  Redis   │
│ /metrics │  │ exporter │  │ exporter │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┼─────────────┘
                   ▼
            ┌─────────────┐
            │ Prometheus  │ :9090
            │ (scrape 15s)│
            └──────┬──────┘
                   │
            ┌──────▼──────┐
            │  Grafana    │ :3001
            │ Dashboards  │
            │ + Alerting  │
            └──────┬──────┘
                   │
            ┌──────▼──────┐
            │ Notification│
            │ Email/Slack │
            └─────────────┘
```

---

## 3. Health Check Endpoints

### API Health (`GET /health`)

Returns overall system health. Used by Nginx, Docker, and external uptime monitors.

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `ok` or `degraded` |
| `version` | string | Application version |
| `uptime` | number | Seconds since start |
| `checks.database` | object | `{ status, latencyMs }` |
| `checks.redis` | object | `{ status, latencyMs }` |
| `checks.migrations` | object | `{ status, pendingCount }` |

**Response codes**:

| Code | Meaning |
|------|---------|
| 200 | All checks pass |
| 503 | One or more checks fail |

### API Readiness (`GET /health/ready`)

Stricter check for deployment orchestration. Returns 200 only when the application can serve traffic (database connected, migrations applied, Redis connected).

### API Liveness (`GET /health/live`)

Minimal check — returns 200 if the Node.js process is responsive. Used by Docker to detect hung processes.

---

## 4. Prometheus Metrics

### Application Metrics (API)

Exposed at `GET /metrics` (internal network only).

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `route`, `status` | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | `method`, `route` | Request latency |
| `ws_connections_active` | Gauge | — | Current WebSocket connections |
| `ws_events_published_total` | Counter | `event_type` | Events published |
| `ws_event_publish_duration_seconds` | Histogram | — | Event publish latency |
| `db_query_duration_seconds` | Histogram | `operation` | Database query latency |
| `db_connections_active` | Gauge | — | Active DB pool connections |
| `sales_completed_total` | Counter | `company_id` | Business: sales completed |
| `auth_login_total` | Counter | `status` | Login attempts (success/failure) |
| `auth_login_failures_total` | Counter | `reason` | Failed login reasons |
| `background_jobs_total` | Counter | `job_type`, `status` | Background job outcomes |
| `api_errors_total` | Counter | `code` | Application errors by code |

### Infrastructure Metrics

| Exporter | Metrics |
|----------|---------|
| `node-exporter` | CPU, memory, disk, network (host level) |
| `postgres-exporter` | Connections, queries/sec, cache hit ratio, replication lag |
| `redis-exporter` | Memory usage, connected clients, commands/sec |
| `nginx-exporter` | Requests/sec, active connections, upstream status |

---

## 5. Grafana Dashboards

### Dashboard: ERP Overview

| Panel | Query | Visualization |
|-------|-------|---------------|
| System Status | Health check uptime | Stat (green/red) |
| Request Rate | `rate(http_requests_total[5m])` | Time series |
| Error Rate | `rate(http_requests_total{status=~"5.."}[5m])` | Time series |
| P95 Latency | `histogram_quantile(0.95, ...)` | Time series |
| Active Users | `ws_connections_active` | Gauge |
| Sales/Hour | `rate(sales_completed_total[1h])` | Stat |

### Dashboard: API Performance

| Panel | Purpose |
|-------|---------|
| Request rate by endpoint | Identify hot paths |
| Latency heatmap | P50/P95/P99 distribution |
| Error rate by endpoint | Pinpoint failing routes |
| Slow queries (> 1s) | Database performance |
| WebSocket event latency | Real-time layer health |

### Dashboard: Infrastructure

| Panel | Purpose |
|-------|---------|
| CPU / Memory / Disk | Host resource utilization |
| PostgreSQL connections | Connection pool health |
| PostgreSQL query performance | Cache hit ratio, slow queries |
| Redis memory | Memory pressure |
| Nginx connections | Edge proxy load |
| Docker container stats | Per-service resource usage |

### Dashboard: Security

| Panel | Purpose |
|-------|---------|
| Failed login attempts | Brute force detection |
| Rate limit hits | Abuse detection |
| Blocked devices | Device management events |
| Session terminations | Admin force-logout activity |
| 403/401 responses | Authorization failures |

### Dashboard: Business Operations

| Panel | Purpose |
|-------|---------|
| Sales per company | Business activity |
| Active devices per company | Device utilization |
| Report generation queue | Background job backlog |
| Backup status | Last successful backup timestamp |
| Sync replay requests | Real-time layer gaps |

---

## 6. Alerting Rules

### Critical Alerts (Immediate Response)

| Alert | Condition | For | Action |
|-------|-----------|-----|--------|
| `APIDown` | Health check fails | 1 min | Page on-call; check container |
| `DatabaseDown` | `pg_up == 0` | 1 min | Page on-call; check PostgreSQL |
| `RedisDown` | `redis_up == 0` | 2 min | Page on-call; WS degraded |
| `DiskSpaceCritical` | Disk > 90% | 5 min | Page on-call; expand or clean |
| `HighErrorRate` | 5xx rate > 5% | 5 min | Page on-call; check logs |
| `BackupFailed` | No successful backup in 26h | — | Page on-call; run manual backup |

### Warning Alerts (Business Hours Response)

| Alert | Condition | For | Action |
|-------|-----------|-----|--------|
| `HighLatency` | P95 > 2s | 10 min | Investigate slow queries |
| `HighMemory` | Memory > 80% | 15 min | Review resource limits |
| `WSEventLatencyHigh` | P95 > 500ms | 10 min | Check Redis pub/sub |
| `DBConnectionsHigh` | Connections > 80% pool | 10 min | Review connection leaks |
| `FailedLoginsSpike` | > 20 failures in 5 min | — | Possible brute force |
| `SSLCertExpiring` | Expires in < 14 days | — | Renew certificate |
| `MigrationPending` | Pending migrations > 0 | — | Run migrations |

### Informational Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| `DeploymentCompleted` | Deploy workflow success | Log; no action |
| `HighSalesVolume` | Sales > 3x daily average | Informational |
| `NewDeviceRegistered` | Device registration event | Audit log |

---

## 7. Notification Channels

| Channel | Use Case | Recipients |
|---------|----------|------------|
| Email | All alerts | DevOps team |
| Slack `#erp-alerts` | Critical + warning | DevOps + tech lead |
| Slack `#erp-deploys` | Deployment events | Full dev team |
| SMS (future) | Critical only, after hours | On-call engineer |

### Alert Routing

| Severity | Business Hours | After Hours |
|----------|---------------|-------------|
| Critical | Slack + Email | Slack + Email + SMS |
| Warning | Slack | Email only |
| Info | Slack `#erp-deploys` | Suppressed |

### On-Call Rotation

| Role | Responsibility | Rotation |
|------|---------------|----------|
| Primary on-call | Respond to critical alerts within 15 min | Weekly |
| Secondary on-call | Escalation if primary unresponsive in 30 min | Weekly |

---

## 8. Log Aggregation

### Current (Phase 1)

Docker `json-file` driver with log rotation. Access via `docker compose logs`.

### Structured Logging Format

```json
{
  "timestamp": "2026-06-17T14:30:00+05:00",
  "level": "info",
  "service": "api",
  "message": "Sale completed",
  "companyId": "uuid",
  "userId": "uuid",
  "saleId": "uuid",
  "durationMs": 145
}
```

### Future (Phase 2)

| Option | Pros | Cons |
|--------|------|------|
| Grafana Loki | Native Grafana integration | Less powerful search |
| ELK Stack | Full-text search, analytics | Higher resource cost |

Decision deferred until log volume exceeds 10 GB/day.

---

## 9. Uptime Monitoring

External uptime check from independent service (e.g., UptimeRobot, Better Uptime).

| Check | Interval | Timeout | Alert |
|-------|----------|---------|-------|
| `GET /health` | 60s | 10s | Down for 2 consecutive checks |
| `WSS /ws` | 300s | 15s | Connection failure |
| SSL certificate | Daily | — | Expires in < 14 days |

---

## 10. Performance Baselines

Establish baselines during staging load testing. Alert thresholds set at 2x baseline.

| Metric | Baseline (Staging) | Alert Threshold |
|--------|-------------------|-----------------|
| API P95 latency | 200ms | 500ms |
| WS event P95 latency | 100ms | 500ms |
| DB query P95 | 50ms | 200ms |
| Requests/sec | 50 | 200 (capacity) |
| WS connections | 100 | 500 (per node) |
| Error rate | < 0.1% | > 1% |

---

## 11. Monitoring Maintenance

| Task | Frequency | Owner |
|------|-----------|-------|
| Review alert thresholds | Monthly | DevOps |
| Dashboard updates | Per release | DevOps |
| Prometheus data retention check | Monthly | DevOps |
| Grafana user access audit | Quarterly | Admin |
| Load test baseline refresh | Quarterly | DevOps + QA |
| On-call runbook review | Quarterly | DevOps |

---

## 12. Related Documents

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [DOCKER.md](./DOCKER.md)
- [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md)
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
- [SCALABILITY.md](./SCALABILITY.md)
- [../09-realtime/REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md)
