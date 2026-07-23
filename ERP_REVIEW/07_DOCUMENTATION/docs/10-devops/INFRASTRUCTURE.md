# Infrastructure Requirements

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

This document defines server hardware, network, and environmental requirements for deploying the ERP platform across development, staging, and production environments.

---

## 2. Server Requirements

### Production Server (Single-Node, Phase 1)

| Resource | Minimum | Recommended | Notes |
|----------|---------|-------------|-------|
| CPU | 4 vCPU | 8 vCPU | x86_64; ARM not tested |
| RAM | 8 GB | 16 GB | PostgreSQL is memory-hungry |
| Storage | 100 GB SSD | 250 GB NVMe SSD | IOPS > 3,000 |
| Network | 100 Mbps | 1 Gbps | Low latency to clients |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS | Long-term support |

### Production Server (Scaled, Phase 2+)

| Component | Spec | Count |
|-----------|------|-------|
| API server | 4 vCPU, 8 GB RAM, 50 GB SSD | 2–4 |
| Database server | 8 vCPU, 16 GB RAM, 250 GB NVMe | 1 primary |
| Read replica | 4 vCPU, 8 GB RAM, 250 GB NVMe | 1–2 |
| Redis server | 2 vCPU, 2 GB RAM, 20 GB SSD | 1 (+ 1 replica for HA) |
| Load balancer / Nginx | 2 vCPU, 2 GB RAM | 1 |
| Backup storage | 500 GB | Local NAS or cloud |
| Monitoring | 2 vCPU, 4 GB RAM, 50 GB SSD | 1 (can co-locate) |

### Staging Server

| Resource | Spec |
|----------|------|
| CPU | 2 vCPU |
| RAM | 4 GB |
| Storage | 50 GB SSD |
| Purpose | Pre-production validation; mirrors production config |

### Development (Local)

| Resource | Spec |
|----------|------|
| CPU | 2+ cores |
| RAM | 8 GB (Docker containers) |
| Storage | 20 GB free |
| OS | Windows 10+, macOS 12+, or Linux |

---

## 3. Network Architecture

### Production Network Topology

```
Internet
    │
    ▼
┌─────────────────────────────────────────┐
│              Firewall (UFW)              │
│  IN: 22 (SSH), 80 (HTTP), 443 (HTTPS)  │
│  OUT: All (for updates, backups, SMTP)  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│            Server (Host)                 │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │     Docker Network: erp-net        │  │
│  │     172.28.0.0/16                  │  │
│  │                                    │  │
│  │  Nginx ──▶ API ──▶ PostgreSQL     │  │
│  │                  ──▶ Redis         │  │
│  │  Prometheus ──▶ Grafana           │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Port Allocation

| Port | Service | Exposure | Protocol |
|------|---------|----------|----------|
| 22 | SSH | Public (key-only) | TCP |
| 80 | Nginx (HTTP redirect) | Public | TCP |
| 443 | Nginx (HTTPS) | Public | TCP |
| 3000 | API (internal) | Docker network only | TCP |
| 5432 | PostgreSQL (internal) | Docker network only | TCP |
| 6379 | Redis (internal) | Docker network only | TCP |
| 9090 | Prometheus (internal) | Docker network / VPN | TCP |
| 3001 | Grafana (internal) | Docker network / VPN | TCP |

**No database or Redis port is exposed to the public internet.**

### DNS Requirements

| Record | Type | Value | TTL |
|--------|------|-------|-----|
| `erp.example.uz` | A | Server IP | 300 |
| `staging.erp.example.uz` | A | Staging server IP | 300 |
| `api.erp.example.uz` | CNAME | `erp.example.uz` | 300 |

### Firewall Rules (UFW)

| Rule | Direction | Port | Source | Action |
|------|-----------|------|--------|--------|
| SSH | Inbound | 22 | Admin IPs | Allow |
| HTTP | Inbound | 80 | Any | Allow |
| HTTPS | Inbound | 443 | Any | Allow |
| All | Outbound | Any | Any | Allow |
| All other | Inbound | Any | Any | Deny |

---

## 4. Storage Architecture

### Disk Layout (Production)

| Mount | Size | Purpose | Filesystem |
|-------|------|---------|------------|
| `/` | 50 GB | OS, Docker images | ext4 |
| `/opt/erp` | 100 GB | Application data, configs | ext4 |
| `/opt/erp/backups` | 100 GB | Local backup storage | ext4 |
| Docker volumes | 50 GB+ | PostgreSQL data, Redis, Prometheus | overlay2 |

### Storage Growth Projections

| Timeline | Database | Backups (30-day) | Logs | Total |
|----------|----------|-------------------|------|-------|
| Month 1 | 1 GB | 10 GB | 5 GB | 16 GB |
| Month 6 | 5 GB | 30 GB | 15 GB | 50 GB |
| Year 1 | 15 GB | 50 GB | 30 GB | 95 GB |
| Year 2 | 40 GB | 80 GB | 50 GB | 170 GB |

Plan for 2x projected storage at provisioning time.

---

## 5. Hosting Options

### Recommended: VPS (Virtual Private Server)

| Provider | Region | Rationale |
|----------|--------|-----------|
| Local Uzbek provider | Tashkent | Low latency for Uzbek users |
| Hetzner | EU (Falkenstein) | Cost-effective; good performance |
| DigitalOcean | EU (Frankfurt) | Simple management |
| AWS/GCP | EU (Frankfurt) | Enterprise; higher cost |

**Latency target**: < 50ms from Tashkent to server for acceptable UX.

### Not Recommended for Phase 1

| Option | Reason |
|--------|--------|
| Shared hosting | No Docker support |
| Serverless | WebSocket and persistent connections incompatible |
| Kubernetes | Over-engineered for initial scale |

---

## 6. Environment Specifications

### Production Environment

| Property | Value |
|----------|-------|
| URL | `https://erp.example.uz` |
| Timezone | `Asia/Tashkent` (UTC+5) |
| Locale | `uz-UZ` (primary), `ru-RU`, `en-US` |
| Currency | UZS (primary), USD |
| SSL | Let's Encrypt (auto-renewed) |
| Backup | Daily 02:00 local + cloud |
| Monitoring | 24/7 automated |
| Uptime target | 99.5% (43.8 hours downtime/year max) |

### Staging Environment

| Property | Value |
|----------|-------|
| URL | `https://staging.erp.example.uz` |
| Data | Anonymized production copy (weekly refresh) |
| Deploy | Automatic on `main` push |
| SSL | Let's Encrypt |
| Backup | Weekly (not critical) |

### Development Environment

| Property | Value |
|----------|-------|
| URL | `http://localhost:3000` |
| Data | Seed data (resettable) |
| SSL | Not required |
| Hot reload | Enabled |

---

## 7. Security Infrastructure

| Layer | Implementation |
|-------|----------------|
| Network | UFW firewall; only 22/80/443 exposed |
| Transport | TLS 1.2+ on all external connections |
| SSH | Key-only; fail2ban for brute force |
| Docker | Non-root containers; no privileged mode |
| Secrets | `.env` files with `600` permissions |
| Updates | Unattended security updates (OS) |
| Intrusion detection | fail2ban (SSH, Nginx auth failures) |
| DDoS | Cloudflare proxy (optional); Nginx rate limiting |

---

## 8. High Availability (Phase 2+)

| Component | HA Strategy | Failover Time |
|-----------|-------------|---------------|
| API | Multiple replicas behind Nginx | < 30 seconds |
| PostgreSQL | Streaming replication + manual promotion | < 30 minutes |
| Redis | Sentinel automatic failover | < 30 seconds |
| Nginx | Keepalived VIP (optional) | < 10 seconds |
| DNS | Low TTL (300s) + health-check failover | < 5 minutes |
| Backups | Dual storage (local + cloud) | N/A |

---

## 9. Compliance and Data Residency

| Requirement | Implementation |
|-------------|----------------|
| Data location | Server physically located per business decision |
| Data encryption at rest | PostgreSQL + encrypted disk |
| Data encryption in transit | TLS 1.2+ everywhere |
| Access logging | All API requests logged with user/device/IP |
| Data retention | Per [../05-database/DATA_RETENTION_POLICY.md](../05-database/DATA_RETENTION_POLICY.md) |
| Right to deletion | Soft-delete with hard-delete after retention period |

---

## 10. Infrastructure Checklist

### Initial Provisioning

- [ ] Server provisioned with recommended specs
- [ ] Ubuntu 22.04 LTS installed and updated
- [ ] SSH key-only access configured
- [ ] UFW firewall rules applied
- [ ] Docker and Docker Compose installed
- [ ] DNS records configured
- [ ] SSL certificate obtained
- [ ] Deployment user created
- [ ] Application directory structure created
- [ ] Backup storage configured (local + cloud)
- [ ] Monitoring stack deployed
- [ ] fail2ban installed and configured

### Ongoing Maintenance

- [ ] Monthly OS security updates
- [ ] Quarterly disk usage review
- [ ] Quarterly access audit (SSH keys, admin users)
- [ ] Annual server spec review (right-sizing)
- [ ] Annual disaster recovery drill

---

## 11. Related Documents

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [DOCKER.md](./DOCKER.md)
- [SCALABILITY.md](./SCALABILITY.md)
- [SSL_HTTPS.md](./SSL_HTTPS.md)
- [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md)
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
- [MONITORING.md](./MONITORING.md)
