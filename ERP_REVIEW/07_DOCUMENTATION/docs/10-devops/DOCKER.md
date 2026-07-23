# Docker Compose Setup

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The ERP platform is containerized using **Docker** and orchestrated with **Docker Compose** for both development and production environments. All application services, databases, and supporting infrastructure run as containers with defined networking, volumes, and health checks.

---

## 2. Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network: erp-net                   │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────────┐   │
│  │  Nginx  │  │   API   │  │ Postgres│  │    Redis      │   │
│  │  :80    │  │  :3000  │  │  :5432  │  │    :6379      │   │
│  │  :443   │  │         │  │         │  │               │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └───────┬───────┘   │
│       │            │            │                │           │
│       └────────────┴────────────┴────────────────┘           │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Prometheus  │  │  Grafana    │  │  Backup Cron        │  │
│  │  :9090      │  │  :3001      │  │  (sidecar)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Services

### 3.1 API Server (`api`)

| Property | Value |
|----------|-------|
| Image | `erp-api:{version}` |
| Base | `node:20-alpine` |
| Port | 3000 (internal) |
| Depends on | `postgres`, `redis` |
| Health check | `GET /health` every 30s |
| Restart policy | `unless-stopped` |

**Responsibilities**: REST API, WebSocket gateway, business logic, background jobs.

**Volumes**:

| Mount | Purpose |
|-------|---------|
| `/app/uploads` | Temporary file uploads (reports, exports) |
| None for code | Code baked into image (immutable deployments) |

### 3.2 PostgreSQL (`postgres`)

| Property | Value |
|----------|-------|
| Image | `postgres:16-alpine` |
| Port | 5432 (internal only) |
| Depends on | — |
| Health check | `pg_isready` every 10s |
| Restart policy | `unless-stopped` |

**Volumes**:

| Mount | Purpose |
|-------|---------|
| `erp-postgres-data` | Persistent database files |
| `./init-scripts/` | Optional initialization SQL |

**Environment**:

| Variable | Value |
|----------|-------|
| `POSTGRES_DB` | `erp_production` |
| `POSTGRES_USER` | `erp_admin` |
| `POSTGRES_PASSWORD` | From `.env` |

### 3.3 Redis (`redis`)

| Property | Value |
|----------|-------|
| Image | `redis:7-alpine` |
| Port | 6379 (internal only) |
| Command | `redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes` |
| Health check | `redis-cli ping` every 10s |
| Restart policy | `unless-stopped` |

**Volumes**:

| Mount | Purpose |
|-------|---------|
| `erp-redis-data` | AOF persistence for pub/sub recovery |

**Usage**:

| Purpose | Redis Feature |
|---------|---------------|
| Session store | Key-value with TTL |
| WebSocket pub/sub | Socket.io Redis adapter |
| Rate limiting | Sliding window counters |
| Job queue metadata | Bull queue backend |

### 3.4 Nginx (`nginx`)

| Property | Value |
|----------|-------|
| Image | `nginx:1.25-alpine` |
| Ports | 80, 443 (public) |
| Depends on | `api` |
| Health check | `curl -f http://localhost/health` |
| Restart policy | `unless-stopped` |

**Volumes**:

| Mount | Purpose |
|-------|---------|
| `./nginx/nginx.conf` | Main configuration |
| `./nginx/conf.d/` | Server blocks |
| `./certbot/conf/` | SSL certificates |
| `./certbot/www/` | ACME challenge |

### 3.5 Prometheus (`prometheus`)

| Property | Value |
|----------|-------|
| Image | `prom/prometheus:latest` |
| Port | 9090 (internal; exposed via Nginx auth) |
| Depends on | `api` |
| Restart policy | `unless-stopped` |

**Volumes**:

| Mount | Purpose |
|-------|---------|
| `./monitoring/prometheus.yml` | Scrape configuration |
| `erp-prometheus-data` | Time-series data (30-day retention) |

### 3.6 Grafana (`grafana`)

| Property | Value |
|----------|-------|
| Image | `grafana/grafana:latest` |
| Port | 3001 (internal; exposed via Nginx auth) |
| Depends on | `prometheus` |
| Restart policy | `unless-stopped` |

**Volumes**:

| Mount | Purpose |
|-------|---------|
| `erp-grafana-data` | Dashboards, users, settings |
| `./monitoring/grafana/provisioning/` | Auto-provisioned dashboards |

### 3.7 Backup Sidecar (`backup`)

| Property | Value |
|----------|-------|
| Image | `erp-backup:{version}` |
| Schedule | Cron: daily at 02:00 Asia/Tashkent |
| Depends on | `postgres` |
| Restart policy | `unless-stopped` |

**Responsibilities**: pg_dump, ZIP compression, local + cloud upload. See [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md).

---

## 4. Docker Compose Files

| File | Environment | Purpose |
|------|-------------|---------|
| `docker-compose.yml` | Development | Local dev with hot reload |
| `docker-compose.prod.yml` | Production | Full stack with monitoring |
| `docker-compose.staging.yml` | Staging | Production-like testing |
| `docker-compose.test.yml` | CI | Ephemeral test database |

---

## 5. Development Setup

```bash
# Clone repository
git clone https://github.com/org/erp.git
cd erp

# Copy environment template
cp .env.example .env

# Start all services
docker compose up -d

# Run migrations
docker compose exec api npx prisma migrate dev

# Seed development data
docker compose exec api npm run seed:dev

# View logs
docker compose logs -f api
```

**Development differences from production**:

| Aspect | Development | Production |
|--------|-------------|------------|
| API code | Volume-mounted (hot reload) | Baked in image |
| Database port | Exposed 5432 | Internal only |
| SSL | Not required | Required |
| Monitoring | Optional | Required |
| Log level | `debug` | `info` |

---

## 6. Production Compose Configuration

### Network

```yaml
networks:
  erp-net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

All services communicate via `erp-net`. Only Nginx exposes ports to the host.

### Volume Strategy

| Volume | Type | Backup |
|--------|------|--------|
| `erp-postgres-data` | Named (local driver) | Daily pg_dump |
| `erp-redis-data` | Named (local driver) | Not backed up (rebuildable) |
| `erp-prometheus-data` | Named (local driver) | Not backed up |
| `erp-grafana-data` | Named (local driver) | Export dashboards to Git |
| `erp-backup-local` | Named (local driver) | Synced to cloud |

### Resource Limits (Production)

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| API | 2.0 | 2 GB |
| PostgreSQL | 2.0 | 4 GB |
| Redis | 0.5 | 512 MB |
| Nginx | 0.5 | 256 MB |
| Prometheus | 0.5 | 1 GB |
| Grafana | 0.5 | 512 MB |

---

## 7. Health Checks

All services define Docker health checks for orchestration reliability.

| Service | Check | Interval | Retries |
|---------|-------|----------|---------|
| API | `curl -f http://localhost:3000/health` | 30s | 3 |
| PostgreSQL | `pg_isready -U erp_admin` | 10s | 5 |
| Redis | `redis-cli -a $REDIS_PASSWORD ping` | 10s | 3 |
| Nginx | `curl -f http://localhost/health` | 30s | 3 |

`docker compose ps` shows health status. Unhealthy services are restarted per `restart: unless-stopped`.

---

## 8. Image Build Strategy

### API Image (Multi-Stage)

| Stage | Base | Purpose |
|-------|------|---------|
| `builder` | `node:20-alpine` | Install deps, compile TypeScript, generate Prisma client |
| `production` | `node:20-alpine` | Copy dist + node_modules (production only) |

**Image tagging**:

| Tag | When |
|-----|------|
| `erp-api:{git-sha}` | Every CI build |
| `erp-api:{semver}` | Release tag |
| `erp-api:latest` | Latest production deploy |

### Image Registry

Images pushed to GitHub Container Registry (`ghcr.io/org/erp-api`). Production servers pull from registry; no local builds in production.

---

## 9. Logging

| Service | Driver | Options |
|---------|--------|---------|
| All | `json-file` | `max-size: 50m`, `max-file: 5` |

Logs accessible via `docker compose logs`. Future: forward to Loki or ELK stack.

---

## 10. Troubleshooting

| Issue | Diagnosis | Resolution |
|-------|-----------|------------|
| API won't start | `docker compose logs api` | Check DATABASE_URL, migration status |
| Database connection refused | `docker compose ps postgres` | Wait for healthy status; check credentials |
| WebSocket fails | Check Nginx upgrade headers | See [NGINX.md](./NGINX.md) |
| Out of disk | `docker system df` | Prune unused images; expand volume |
| High memory | `docker stats` | Adjust resource limits; check for leaks |
| Redis OOM | Check `maxmemory-policy` | Increase memory limit; review key TTLs |

---

## 11. Related Documents

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [NGINX.md](./NGINX.md)
- [MONITORING.md](./MONITORING.md)
- [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md)
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
- [../01-governance/TECHNOLOGY_STACK.md](../01-governance/TECHNOLOGY_STACK.md)
