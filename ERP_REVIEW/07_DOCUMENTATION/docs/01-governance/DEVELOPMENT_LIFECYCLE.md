# Development Lifecycle

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Phase Overview

```
Phase 0: Documentation & Architecture  ← CURRENT
Phase 1: Core Platform (auth, admin, multi-company)
Phase 2: Products + Inventory + FIFO
Phase 3: Currency + Sales + Customers + Debt
Phase 4: Dashboard + Reports + Notifications
Phase 5: Desktop Client (Electron)
Phase 6: Mobile Client (Flutter)
Phase 7: DevOps + Production Deployment
Phase 8: UAT + Go-Live
```

---

## 2. Documentation-First Policy

**No application code until documentation is approved.**

Gate criteria for Phase 1 start:
- [ ] All documentation files created (this documentation set)
- [ ] Architecture review completed
- [ ] Database schema reviewed
- [ ] API contracts defined
- [ ] UI/UX wireframes approved
- [ ] Security architecture reviewed

---

## 3. Sprint Structure

- **Sprint length**: 2 weeks
- **Ceremonies**: Planning, Daily standup, Review, Retrospective
- **Definition of Done**:
  - Code reviewed and merged
  - Unit tests passing (80%+ coverage on business logic)
  - API documented in OpenAPI spec
  - Audit logging implemented for CUD operations
  - No critical/high security findings

---

## 4. Branch Strategy

```
main          ← production-ready
develop       ← integration branch
feature/*     ← feature branches
release/*     ← release preparation
hotfix/*      ← production fixes
```

### Merge Rules

- `feature/*` → `develop` via Pull Request
- `develop` → `release/*` when sprint complete
- `release/*` → `main` after QA sign-off
- `hotfix/*` → `main` + cherry-pick to `develop`

---

## 5. Environment Progression

| Environment | Purpose | Deploy Trigger |
|-------------|---------|----------------|
| Local | Developer workstation | Manual |
| Development | Integration testing | Push to `develop` |
| Staging | UAT, pre-production | Push to `release/*` |
| Production | Live system | Merge to `main` + tag |

---

## 6. Quality Gates

### Pull Request Checklist

- [ ] Tests pass in CI
- [ ] Linting passes
- [ ] No security vulnerabilities (npm audit / dart pub outdated)
- [ ] Database migration included if schema changed
- [ ] Audit log events added for new CUD operations
- [ ] WebSocket events defined for new state changes
- [ ] Permission guards applied to new endpoints
- [ ] Company isolation verified

### Release Checklist

- [ ] All sprint stories completed or deferred
- [ ] Regression test suite passed
- [ ] Performance benchmarks met
- [ ] Backup/restore verified on staging
- [ ] Release notes prepared
- [ ] Rollback plan documented

---

## 7. Code Review Standards

- Minimum 1 reviewer approval required
- Security-sensitive changes require security architect review
- Database schema changes require DBA review
- Review within 24 hours of PR creation

---

## 8. Incident Response

| Severity | Response Time | Example |
|----------|---------------|---------|
| P1 — Critical | 15 minutes | System down, data breach |
| P2 — High | 1 hour | Sales module broken |
| P3 — Medium | 4 hours | Report export failing |
| P4 — Low | Next sprint | UI cosmetic issue |

---

## 9. Related Documents

- [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- [../10-devops/CI_CD.md](../10-devops/CI_CD.md)
- [../03-product/RELEASE_STRATEGY.md](../03-product/RELEASE_STRATEGY.md)
