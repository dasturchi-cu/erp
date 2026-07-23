# CI/CD Pipeline

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The ERP platform uses **GitHub Actions** for continuous integration and continuous deployment. The pipeline automates code quality checks, testing, Docker image builds, and deployment to staging and production environments.

**Repository**: `github.com/{org}/erp`

---

## 2. Pipeline Architecture

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Push /  │───▶│   CI     │───▶│  Build   │───▶│  Deploy  │
│  PR      │    │  Checks  │    │  Images  │    │  Staging │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                      │
                                                      ▼ (manual approval)
                                                ┌──────────┐
                                                │  Deploy  │
                                                │Production│
                                                └──────────┘
```

---

## 3. Workflow Triggers

| Event | Workflow | Actions |
|-------|----------|---------|
| Pull request to `main` | `ci.yml` | Lint, test, build check |
| Push to `main` | `ci.yml` + `deploy-staging.yml` | Full CI + deploy to staging |
| Tag `v*.*.*` | `release.yml` | Build release images + deploy production |
| Manual dispatch | `deploy-production.yml` | Deploy specific version to production |
| Schedule (daily) | `security-audit.yml` | Dependency vulnerability scan |

---

## 4. CI Workflow (`ci.yml`)

Runs on every pull request and push to `main`.

### Jobs

#### Job: `lint-and-typecheck`

| Step | Command | Timeout |
|------|---------|---------|
| Checkout | `actions/checkout@v4` | — |
| Setup Node 20 | `actions/setup-node@v4` | — |
| Install dependencies | `npm ci` | 3 min |
| ESLint | `npm run lint` | 2 min |
| TypeScript check | `npm run typecheck` | 2 min |
| Prettier check | `npm run format:check` | 1 min |

#### Job: `test-backend`

| Step | Command | Timeout |
|------|---------|---------|
| Start test DB | `docker compose -f docker-compose.test.yml up -d` | 2 min |
| Run migrations | `npx prisma migrate deploy` | 1 min |
| Unit tests | `npm run test:unit` | 5 min |
| Integration tests | `npm run test:integration` | 10 min |
| Coverage report | Upload to Codecov | — |

**Services**: Ephemeral PostgreSQL 16 and Redis 7 containers.

#### Job: `test-flutter` (when `mobile/` changes)

| Step | Command | Timeout |
|------|---------|---------|
| Setup Flutter 3.19 | `subosito/flutter-action@v2` | — |
| Analyze | `flutter analyze` | 3 min |
| Unit tests | `flutter test` | 5 min |

#### Job: `build-check`

| Step | Command | Timeout |
|------|---------|---------|
| Build API | `npm run build` | 3 min |
| Build Docker image | `docker build -t erp-api:ci .` | 5 min |
| Prisma validate | `npx prisma validate` | 1 min |

### PR Requirements

All CI jobs must pass before merge is allowed (branch protection rules).

| Rule | Setting |
|------|---------|
| Required checks | `lint-and-typecheck`, `test-backend`, `build-check` |
| Review required | 1 approval |
| Up to date | Must be rebased on `main` |
| No force push | Enforced |

---

## 5. Build Workflow (`build.yml`)

Triggered on push to `main` and release tags.

### Docker Image Build

| Step | Detail |
|------|--------|
| Registry | `ghcr.io/{org}/erp-api` |
| Tags | `{git-sha}`, `{branch}`, `{semver}` (on tag) |
| Multi-platform | `linux/amd64` (Phase 1) |
| Cache | GitHub Actions cache for Docker layers |
| Scan | Trivy vulnerability scan on built image |

### Artifacts

| Artifact | Destination |
|----------|-------------|
| API Docker image | GitHub Container Registry |
| Electron installer | GitHub Releases (on tag) |
| Flutter APK/IPA | GitHub Releases (on tag) |
| Database migration files | Included in API image |

---

## 6. Staging Deployment (`deploy-staging.yml`)

Automatic deployment on push to `main` after CI passes.

### Steps

| Step | Action |
|------|--------|
| 1 | SSH to staging server |
| 2 | Pull latest image: `docker compose pull api` |
| 3 | Run migrations: `prisma migrate deploy` |
| 4 | Restart API: `docker compose up -d --no-deps api` |
| 5 | Health check: `curl staging.erp.example.uz/health` |
| 6 | Notify Slack: deployment status |

### Staging Environment

| Property | Value |
|----------|-------|
| URL | `https://staging.erp.example.uz` |
| Server | Staging VPS (separate from production) |
| Database | `erp_staging` (anonymized production copy, refreshed weekly) |
| Auto-deploy | Yes, on every `main` push |

---

## 7. Production Deployment (`deploy-production.yml`)

Manual trigger with approval gate.

### Trigger

```yaml
workflow_dispatch:
  inputs:
    version:
      description: 'Release version tag (e.g., v1.2.0)'
      required: true
```

### Approval Gate

| Setting | Value |
|---------|-------|
| Required reviewers | 2 (tech lead + DevOps) |
| Environment | `production` (GitHub environment protection) |
| Wait timer | 5 minutes (cancellation window) |

### Steps

| Step | Action |
|------|--------|
| 1 | Verify version tag exists and CI passed |
| 2 | Create pre-deployment database backup |
| 3 | SSH to production server |
| 4 | Pull versioned image: `docker compose pull api:{version}` |
| 5 | Run migrations: `prisma migrate deploy` |
| 6 | Rolling restart: `docker compose up -d --no-deps api` |
| 7 | Health check with retry (3 attempts, 10s interval) |
| 8 | Smoke test: login + create test sale + verify WebSocket |
| 9 | Notify team: deployment success/failure |
| 10 | On failure: automatic rollback to previous image |

### Rollback

Automatic rollback triggers if:

- Health check fails after 3 attempts
- Smoke test fails
- Manual abort within 5-minute window

Rollback procedure: pull previous image tag, restart API, verify health.

---

## 8. Release Workflow (`release.yml`)

Triggered on git tag push matching `v*.*.*`.

### Steps

| Step | Action |
|------|--------|
| 1 | Generate changelog from commits since last tag |
| 2 | Build and push Docker image with semver tag |
| 3 | Build Electron installer (Windows) |
| 4 | Build Flutter APK (Android) |
| 5 | Create GitHub Release with artifacts |
| 6 | Trigger production deployment workflow |

### Versioning

Follows [Semantic Versioning](https://semver.org/):

| Bump | When |
|------|------|
| MAJOR | Breaking API changes, schema migrations requiring downtime |
| MINOR | New features, new modules |
| PATCH | Bug fixes, security patches |

---

## 9. Security Audit (`security-audit.yml`)

Daily scheduled scan.

| Check | Tool | Action on Failure |
|-------|------|-------------------|
| npm vulnerabilities | `npm audit` | Create GitHub issue if high/critical |
| Docker image scan | Trivy | Block deploy if critical CVE |
| Secret detection | `trufflehog` | Fail pipeline if secrets found |
| Dependency review | GitHub Dependabot | Auto-PR for security updates |

---

## 10. Secrets Management

| Secret | Storage | Used By |
|--------|---------|---------|
| `STAGING_SSH_KEY` | GitHub Secrets | Staging deploy |
| `PRODUCTION_SSH_KEY` | GitHub Secrets | Production deploy |
| `GHCR_TOKEN` | GitHub Secrets | Image push |
| `CODECOV_TOKEN` | GitHub Secrets | Coverage upload |
| `SLACK_WEBHOOK` | GitHub Secrets | Deployment notifications |
| `PRODUCTION_DB_URL` | GitHub Secrets (environment) | Pre-deploy backup |

Application secrets (JWT, database passwords) are **not** in GitHub Secrets. They live on the server in `.env` files.

---

## 11. Branch Strategy

```
main ────────────────────────────── production releases
  │
  ├── feature/product-search ── PR ──▶ main
  ├── feature/mobile-pos ────── PR ──▶ main
  └── fix/stock-calculation ─── PR ──▶ main
```

| Branch | Purpose | Deploy Target |
|--------|---------|---------------|
| `main` | Stable integration | Staging (auto) |
| `feature/*` | Feature development | None (CI only) |
| `fix/*` | Bug fixes | None (CI only) |
| `v*.*.*` (tag) | Release | Production (manual) |

No long-lived `develop` branch. Trunk-based development with short-lived feature branches.

---

## 12. Pipeline Metrics

| Metric | Target |
|--------|--------|
| CI duration (PR) | < 15 minutes |
| Staging deploy | < 5 minutes after merge |
| Production deploy | < 10 minutes (including approval) |
| Rollback time | < 3 minutes |
| CI success rate | > 95% |
| Deploy success rate | > 99% |

---

## 13. Related Documents

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [DOCKER.md](./DOCKER.md)
- [MONITORING.md](./MONITORING.md)
- [../03-product/RELEASE_STRATEGY.md](../03-product/RELEASE_STRATEGY.md)
- [../01-governance/DEVELOPMENT_LIFECYCLE.md](../01-governance/DEVELOPMENT_LIFECYCLE.md)
