# Disaster Recovery

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

This document defines disaster recovery (DR) objectives, procedures, and responsibilities for restoring the ERP platform after catastrophic failure. The plan covers server loss, database corruption, data center outage, and security breaches requiring full environment rebuild.

**Recovery Point Objective (RPO)**: 24 hours — maximum acceptable data loss equals one daily backup cycle.

**Recovery Time Objective (RTO)**: 4 hours — maximum acceptable downtime from incident detection to restored service.

---

## 2. Disaster Scenarios

| Scenario | Likelihood | Impact | RTO | Primary Recovery Method |
|----------|-----------|--------|-----|------------------------|
| API container crash | High | Low | 5 min | Auto-restart (Docker) |
| Database corruption | Low | Critical | 2 hours | Restore from backup |
| Server hardware failure | Medium | Critical | 4 hours | New server + backup restore |
| Data center outage | Low | Critical | 4–8 hours | Provision new server in alternate region |
| Ransomware / security breach | Low | Critical | 4–8 hours | Clean rebuild + backup restore |
| Accidental data deletion | Medium | High | 1 hour | Point-in-time or table restore |
| SSL certificate expiry | Low | Medium | 30 min | Certbot renewal |
| Redis failure | Medium | Medium | 15 min | Restart; sessions lost |
| Network/DNS failure | Low | High | 1 hour | DNS failover or provider change |
| Bad deployment | Medium | High | 15 min | Rollback to previous image |

---

## 3. Recovery Objectives

### Tier Classification

| Tier | Systems | RTO | RPO | Priority |
|------|---------|-----|-----|----------|
| **Tier 1 — Critical** | API, PostgreSQL, Nginx | 1 hour | 24 hours | Immediate |
| **Tier 2 — Important** | Redis, WebSocket, Backups | 2 hours | 24 hours | Within 2 hours |
| **Tier 3 — Supporting** | Monitoring, Grafana, Prometheus | 8 hours | N/A | Within 8 hours |
| **Tier 4 — Non-critical** | Staging, development | 24 hours | N/A | Best effort |

### Business Impact

| Downtime Duration | Business Impact |
|-------------------|-----------------|
| < 15 minutes | Minimal; auto-recovery handles most cases |
| 15 min – 1 hour | Cashiers cannot process sales; managers lose dashboard |
| 1 – 4 hours | Full business operations halted; manual processes required |
| 4 – 24 hours | Significant revenue loss; customer trust impact |
| > 24 hours | Critical business continuity failure |

---

## 4. Recovery Team

| Role | Responsibility | Contact Method |
|------|---------------|----------------|
| **Incident Commander** | Declares disaster; coordinates recovery | Phone + Slack |
| **DevOps Lead** | Executes technical recovery procedures | Phone + SSH |
| **Database Administrator** | Database restore and validation | Phone + SSH |
| **Application Lead** | Application verification post-recovery | Phone + Slack |
| **Business Owner** | Approves recovery decisions; communicates to users | Phone |
| **Security Lead** | Breach assessment and containment (if applicable) | Phone |

### Escalation Path

```
Detection → On-Call Engineer (15 min)
         → DevOps Lead (30 min)
         → Incident Commander (1 hour)
         → Business Owner (2 hours)
```

---

## 5. Recovery Procedures

### Procedure A: API Container Failure (RTO: 5 minutes)

**Detection**: Health check fails; monitoring alert `APIDown`.

| Step | Action | Owner | Duration |
|------|--------|-------|----------|
| 1 | Verify container status: `docker compose ps` | On-call | 1 min |
| 2 | Check logs: `docker compose logs api --tail 100` | On-call | 2 min |
| 3 | Restart: `docker compose restart api` | On-call | 1 min |
| 4 | Verify health: `curl /health` | On-call | 1 min |
| 5 | If restart fails: check recent deployment; rollback | DevOps Lead | 10 min |

**Auto-recovery**: Docker `restart: unless-stopped` handles transient crashes.

### Procedure B: Database Corruption (RTO: 2 hours)

**Detection**: API errors on all database queries; PostgreSQL logs show corruption.

| Step | Action | Owner | Duration |
|------|--------|-------|----------|
| 1 | Declare incident; notify team | Incident Commander | 5 min |
| 2 | Stop API containers (prevent further damage) | DevOps Lead | 2 min |
| 3 | Assess corruption scope (full vs. partial) | DBA | 15 min |
| 4 | Download latest verified backup from cloud | DevOps Lead | 10 min |
| 5 | Verify backup checksum (SHA-256) | DevOps Lead | 2 min |
| 6 | Provision clean database (drop + recreate) | DBA | 5 min |
| 7 | Restore: `pg_restore -d erp_production database.dump` | DBA | 15–60 min |
| 8 | Run pending migrations (if backup behind current) | DBA | 5 min |
| 9 | Validate: record counts, test queries, login | App Lead | 15 min |
| 10 | Start API containers | DevOps Lead | 2 min |
| 11 | Full smoke test (login, sale, WebSocket, report) | App Lead | 15 min |
| 12 | Notify business owner; declare recovery complete | Incident Commander | 5 min |

### Procedure C: Complete Server Loss (RTO: 4 hours)

**Detection**: Server unreachable; hosting provider confirms hardware failure.

| Step | Action | Owner | Duration |
|------|--------|-------|----------|
| 1 | Declare disaster; activate recovery team | Incident Commander | 10 min |
| 2 | Provision new server (see [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)) | DevOps Lead | 30 min |
| 3 | Install Docker, configure firewall, SSH | DevOps Lead | 15 min |
| 4 | Update DNS A record to new server IP | DevOps Lead | 5 min (+ propagation) |
| 5 | Obtain SSL certificate (Certbot) | DevOps Lead | 10 min |
| 6 | Deploy application stack (Docker Compose) | DevOps Lead | 15 min |
| 7 | Restore database from cloud backup | DBA | 30–60 min |
| 8 | Restore `.env` from secure backup | DevOps Lead | 5 min |
| 9 | Start all services | DevOps Lead | 5 min |
| 10 | Configure monitoring and backups | DevOps Lead | 15 min |
| 11 | Full validation suite | App Lead | 30 min |
| 12 | Notify users; declare recovery complete | Business Owner | 10 min |

### Procedure D: Security Breach (RTO: 4–8 hours)

**Detection**: Unauthorized access detected; ransomware; data exfiltration alert.

| Step | Action | Owner | Duration |
|------|--------|-------|----------|
| 1 | **Contain**: Disconnect server from network | Security Lead | 5 min |
| 2 | Assess breach scope (access logs, audit trail) | Security Lead | 30 min |
| 3 | Rotate ALL secrets (JWT, DB passwords, Redis, API keys) | DevOps Lead | 15 min |
| 4 | Invalidate all user sessions (force global logout) | DevOps Lead | 5 min |
| 5 | Block compromised devices | Security Lead | 10 min |
| 6 | Provision clean server (Procedure C steps 2–6) | DevOps Lead | 1 hour |
| 7 | Restore database from **pre-breach** backup | DBA | 1 hour |
| 8 | Audit restored data for integrity | Security Lead | 30 min |
| 9 | Deploy with rotated secrets | DevOps Lead | 30 min |
| 10 | Force password reset for all users | App Lead | 15 min |
| 11 | Full validation + security scan | Security Lead | 1 hour |
| 12 | Document incident; notify affected parties | Incident Commander | Ongoing |

### Procedure E: Bad Deployment Rollback (RTO: 15 minutes)

**Detection**: Health check fails after deployment; error rate spike; smoke test failure.

| Step | Action | Owner | Duration |
|------|--------|-------|----------|
| 1 | CI/CD auto-rollback triggers (if configured) | Automated | 3 min |
| 2 | Manual: pull previous image tag | DevOps Lead | 2 min |
| 3 | Restart API with previous image | DevOps Lead | 2 min |
| 4 | If migration was applied: assess reversibility | DBA | 5 min |
| 5 | Verify health and smoke test | App Lead | 5 min |
| 6 | Post-mortem: identify failure cause | Dev Lead | Next business day |

---

## 6. Communication Plan

### Internal Communication

| Audience | Channel | When | Content |
|----------|---------|------|---------|
| DevOps team | Slack `#erp-incidents` | Immediately | Technical status, actions taken |
| All staff | Slack `#general` | Within 30 min | "ERP is down; ETA for recovery" |
| Management | Phone + email | Within 1 hour | Impact assessment, recovery timeline |

### External Communication (Business Users)

| Audience | Channel | When | Content |
|----------|---------|------|---------|
| All ERP users | In-app banner (if accessible) | During outage | "System maintenance in progress" |
| All ERP users | Telegram/SMS (future) | During outage | Status update |
| Company admins | Phone | Within 1 hour | Detailed status + workaround instructions |
| All users | In-app notification | After recovery | "System restored; please verify your data" |

### Status Update Frequency

| Duration | Update Frequency |
|----------|-----------------|
| First hour | Every 15 minutes |
| 1–4 hours | Every 30 minutes |
| 4+ hours | Every hour |

---

## 7. DR Testing

### Test Schedule

| Test Type | Frequency | Scope | Duration |
|-----------|-----------|-------|----------|
| Backup restore verification | Monthly (automated) | Restore to test DB; validate counts | 1 hour |
| API container restart | Weekly (automated) | Health check recovery | 5 min |
| Full DR drill | Quarterly | Complete server rebuild from backup | 4 hours |
| Failover test (Phase 2) | Semi-annual | Database replica promotion | 2 hours |
| Communication drill | Annual | Notify team; simulate without actual recovery | 1 hour |

### DR Drill Procedure (Quarterly)

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 1 | Schedule drill (announce to team) | Team notified 1 week prior |
| 2 | Provision temporary server | Server accessible via SSH |
| 3 | Restore from latest cloud backup | Database passes validation |
| 4 | Deploy application stack | Health check returns 200 |
| 5 | Execute smoke test suite | Login, sale, WebSocket, report pass |
| 6 | Measure total recovery time | < RTO (4 hours) |
| 7 | Document results and gaps | Report filed within 48 hours |
| 8 | Tear down temporary server | Resources released |

### Drill Success Criteria

- [ ] Recovery completed within RTO (4 hours)
- [ ] Data integrity verified (record counts match metadata)
- [ ] All smoke tests pass
- [ ] Communication plan executed
- [ ] Gaps documented with remediation timeline

---

## 8. DR Infrastructure

### Backup Redundancy

| Copy | Location | Access Time | Purpose |
|------|----------|-------------|---------|
| Primary backup | Cloud (S3) | 5–15 min download | Primary recovery source |
| Secondary backup | Local NAS / server volume | Immediate | Fast local recovery |
| Tertiary backup | Off-site cloud (different region) | 15–30 min | Region failure protection |

### Standby Resources

| Resource | Phase 1 | Phase 2 |
|----------|---------|---------|
| Standby server | Provision on demand (< 30 min) | Pre-provisioned warm standby |
| DNS failover | Manual A record update | Automated health-check failover |
| Database replica | None | Hot standby (streaming replication) |
| Backup server | Same as production | Dedicated backup infrastructure |

---

## 9. Post-Recovery Checklist

After any disaster recovery event:

- [ ] All services healthy (health checks passing)
- [ ] Smoke tests pass (login, sale, WebSocket, report)
- [ ] Data integrity verified (record counts, latest transactions)
- [ ] Monitoring and alerting restored
- [ ] Backup schedule resumed and verified
- [ ] SSL certificate valid
- [ ] All secrets rotated (if security incident)
- [ ] User sessions cleared (if security incident)
- [ ] Users notified of recovery
- [ ] Incident report documented
- [ ] Post-mortem scheduled (within 5 business days)
- [ ] Remediation items tracked to completion

---

## 10. Incident Report Template

| Section | Content |
|---------|---------|
| Incident ID | `DR-YYYY-MM-DD-NNN` |
| Date/Time | Detection and resolution timestamps |
| Duration | Total downtime |
| Severity | Critical / High / Medium / Low |
| Scenario | Which DR scenario (A–E) |
| Root Cause | Technical root cause |
| Impact | Users affected, data lost, business impact |
| Timeline | Chronological actions taken |
| Recovery Method | Which procedure was followed |
| Data Loss | Actual RPO achieved |
| Recovery Time | Actual RTO achieved |
| Lessons Learned | What went well, what didn't |
| Action Items | Preventive measures with owners and deadlines |

---

## 11. Related Documents

- [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
- [MONITORING.md](./MONITORING.md)
- [CI_CD.md](./CI_CD.md)
- [../07-security/SECURITY_ARCHITECTURE.md](../07-security/SECURITY_ARCHITECTURE.md)
