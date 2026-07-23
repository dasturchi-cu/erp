# Release Strategy

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## Versioning

Semantic Versioning: `MAJOR.MINOR.PATCH`

| Bump | When |
|------|------|
| MAJOR | Breaking API changes, major architecture shift |
| MINOR | New module or significant feature |
| PATCH | Bug fixes, minor improvements |

---

## Release Cadence

| Type | Frequency | Content |
|------|-----------|---------|
| Major (x.0.0) | Quarterly | New modules, platform support |
| Minor (x.y.0) | Bi-weekly (sprint) | Feature completions |
| Patch (x.y.z) | As needed | Hotfixes |

---

## Release v1.0.0 — MVP (Target: Week 28)

**Includes**:
- All P0 features
- Windows desktop client
- Android + iOS mobile apps
- Production deployment (Docker + Nginx + SSL)
- Daily backup automation

**Pilot**: 1 company (Market) with full operations

---

## Release v1.1.0 — Enhancement (Target: Week 32)

**Includes**:
- Report exports (PDF, Excel, CSV)
- Branch management
- System monitoring dashboard
- Notification system

---

## Release v1.2.0 — Scale (Target: Week 36)

**Includes**:
- Multi-warehouse support
- Performance optimizations
- Advanced permission matrix
- 5+ companies onboarded

---

## Deployment Process

1. Feature freeze on `release/x.y.z` branch
2. QA testing on staging (3 days)
3. UAT with pilot user (2 days)
4. Production deployment (off-peak hours)
5. Smoke test checklist
6. Monitor for 24 hours
7. Tag release in Git

---

## Rollback Plan

1. Keep previous Docker image tagged
2. Database migrations must be backward-compatible or have down migration
3. Rollback command: `docker compose up -d --no-deps api:previous-tag`
4. Maximum rollback time: 15 minutes

---

## Related Documents

- [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md)
- [../10-devops/CI_CD.md](../10-devops/CI_CD.md)
- [../10-devops/DEPLOYMENT.md](../10-devops/DEPLOYMENT.md)
