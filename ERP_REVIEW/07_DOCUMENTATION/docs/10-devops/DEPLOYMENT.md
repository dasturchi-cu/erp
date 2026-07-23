# Production Deployment Guide

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

This document describes the end-to-end procedure for deploying the ERP platform to a production environment. The target deployment model is **Docker Compose on Ubuntu 22.04 LTS** with Nginx as the reverse proxy, PostgreSQL as the primary database, and Redis for sessions and WebSocket pub/sub.

**Production URL pattern**: `https://erp.{company-domain}.uz`

---

## 2. Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Server OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 4 vCPU | 8 vCPU |
| RAM | 8 GB | 16 GB |
| Storage | 100 GB SSD | 250 GB SSD |
| Network | 100 Mbps | 1 Gbps |
| Domain | Registered with DNS A record | Cloudflare-managed DNS |
| SSL | Let's Encrypt certificate | Auto-renewed via Certbot |

Full server specifications in [INFRASTRUCTURE.md](./INFRASTRUCTURE.md).

---

## 3. Deployment Architecture

```
Internet
    │
    ▼
┌─────────┐
│  Nginx  │ :443 (SSL termination, reverse proxy)
└────┬────┘
     │
     ├── /api/*  → API Server :3000
     ├── /ws     → API Server :3000 (WebSocket upgrade)
     └── /health → API Server :3000
     
┌─────────┐  ┌─────────┐  ┌─────────┐
│   API   │  │ Postgres│  │  Redis  │
│  :3000  │  │  :5432  │  │  :6379  │
└─────────┘  └─────────┘  └─────────┘
```

---

## 4. Pre-Deployment Checklist

### Infrastructure

- [ ] Server provisioned and SSH access configured
- [ ] Firewall rules applied (ports 22, 80, 443 only)
- [ ] Domain DNS A record pointing to server IP
- [ ] Docker and Docker Compose installed
- [ ] Dedicated deployment user created (non-root)

### Secrets and Configuration

- [ ] `.env.production` file prepared (never committed to Git)
- [ ] `JWT_SECRET` generated (256-bit random)
- [ ] `DATABASE_URL` configured with strong password
- [ ] `REDIS_PASSWORD` set
- [ ] SMTP credentials configured (for notifications)
- [ ] Backup destination credentials configured (S3/local NAS)

### Application

- [ ] Database migrations tested on staging
- [ ] Docker images built and tagged with release version
- [ ] Health check endpoints verified
- [ ] SSL certificate obtained (see [SSL_HTTPS.md](./SSL_HTTPS.md))

---

## 5. Deployment Steps

### Step 1: Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker (if not present)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy

# Create application directory
sudo mkdir -p /opt/erp
sudo chown deploy:deploy /opt/erp
```

### Step 2: Transfer Configuration

```bash
# From CI/CD artifact or manual transfer
scp docker-compose.prod.yml deploy@server:/opt/erp/
scp .env.production deploy@server:/opt/erp/.env
scp -r nginx/ deploy@server:/opt/erp/nginx/
```

### Step 3: SSL Certificate

Follow [SSL_HTTPS.md](./SSL_HTTPS.md) to obtain Let's Encrypt certificate before starting Nginx with SSL.

### Step 4: Database Initialization

```bash
cd /opt/erp
docker compose -f docker-compose.prod.yml up -d postgres
# Wait for postgres healthy
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### Step 5: Start All Services

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

### Step 6: Verify Deployment

| Check | Command / URL | Expected |
|-------|---------------|----------|
| API health | `curl https://erp.example.uz/health` | `{"status":"ok"}` |
| Database | `docker compose exec postgres pg_isready` | `accepting connections` |
| Redis | `docker compose exec redis redis-cli ping` | `PONG` |
| WebSocket | Connect via test client | `connection.established` event |
| SSL | `curl -I https://erp.example.uz` | HTTP 200, valid cert |

### Step 7: Seed Initial Data

```bash
docker compose exec api npm run seed:production
```

Creates default admin user, initial company, and module registry entries. Admin credentials delivered via secure channel (not logged).

### Step 8: Configure Monitoring

Deploy Prometheus and Grafana per [MONITORING.md](./MONITORING.md).

### Step 9: Configure Backups

Enable automated backup cron per [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md).

---

## 6. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `3000` (internal) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string with password |
| `JWT_SECRET` | Yes | Access token signing key |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing key |
| `JWT_ACCESS_EXPIRY` | Yes | `15m` |
| `JWT_REFRESH_EXPIRY` | Yes | `7d` |
| `CORS_ORIGIN` | Yes | Allowed client origins |
| `LOG_LEVEL` | No | `info` (default) |
| `S3_BACKUP_BUCKET` | Yes | Backup storage bucket |
| `S3_ACCESS_KEY` | Yes | Backup storage credentials |
| `S3_SECRET_KEY` | Yes | Backup storage credentials |
| `SMTP_HOST` | No | Email notification server |
| `TZ` | Yes | `Asia/Tashkent` |

---

## 7. Release Deployment (Updates)

### Standard Release

```bash
cd /opt/erp

# Pull new images (from CI/CD registry)
docker compose -f docker-compose.prod.yml pull api

# Run migrations
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Rolling restart (minimal downtime)
docker compose -f docker-compose.prod.yml up -d --no-deps api

# Verify
curl -s https://erp.example.uz/health | jq .
```

### Rollback Procedure

```bash
# Revert to previous image tag
docker compose -f docker-compose.prod.yml pull api:previous-tag
docker compose -f docker-compose.prod.yml up -d --no-deps api

# If migration needs rollback (use with caution)
docker compose exec api npx prisma migrate resolve --rolled-back {migration_name}
```

---

## 8. Zero-Downtime Considerations

| Technique | Phase 1 | Phase 2+ |
|-----------|---------|----------|
| Rolling API restart | Yes (single node: brief WS disconnect) | — |
| Multiple API replicas | No | Yes (2+ behind Nginx) |
| Blue-green deployment | No | Optional |
| Database migration strategy | Backward-compatible migrations only | Expand-contract pattern |
| WebSocket drain | 30-second grace period on SIGTERM | Sticky sessions + Redis adapter |

During single-node deployment, expect **5–15 seconds** of API unavailability. WebSocket clients auto-reconnect.

---

## 9. Post-Deployment Validation

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Login flow | Admin login from desktop client | JWT issued; dashboard loads |
| Multi-device sync | Login on two devices; edit product | Both devices update < 500ms |
| Sale workflow | Complete test sale | Stock decrements; debt created |
| Backup | Trigger manual backup | ZIP created in local + cloud |
| Monitoring | Check Grafana dashboards | All targets UP |
| SSL renewal | `certbot renew --dry-run` | Success |

---

## 10. Deployment Environments

| Environment | Purpose | URL Pattern | Data |
|-------------|---------|-------------|------|
| Development | Local developer machines | `localhost:3000` | Seed data |
| Staging | Pre-production validation | `staging.erp.example.uz` | Anonymized copy |
| Production | Live business operations | `erp.example.uz` | Real data |

Staging mirrors production configuration but uses separate database and credentials. All releases pass through staging before production.

---

## 11. Security Hardening

| Measure | Implementation |
|---------|----------------|
| Non-root containers | All Docker services run as non-root user |
| Secret management | `.env` file permissions `600`; never in Git |
| Firewall | UFW: allow 22, 80, 443; deny all other inbound |
| SSH | Key-only authentication; disable password login |
| Database | Not exposed to public internet; Docker internal network only |
| Redis | Password protected; not exposed externally |
| Rate limiting | Nginx + API throttler |
| Security headers | Helmet middleware + Nginx headers |

---

## 12. Maintenance Windows

| Activity | Frequency | Downtime | Notification |
|----------|-----------|----------|--------------|
| Security patches (OS) | Monthly | 5–15 min (reboot) | 48 hours advance |
| Dependency updates | Monthly | 0–5 min (rolling) | 24 hours advance |
| Database maintenance | Quarterly | 0 min (online) | 1 week advance |
| Major version upgrade | As needed | 15–30 min | 1 week advance |

Maintenance notifications sent via in-app banner and admin email.

---

## 13. Related Documents

- [DOCKER.md](./DOCKER.md)
- [NGINX.md](./NGINX.md)
- [SSL_HTTPS.md](./SSL_HTTPS.md)
- [CI_CD.md](./CI_CD.md)
- [MONITORING.md](./MONITORING.md)
- [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md)
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
