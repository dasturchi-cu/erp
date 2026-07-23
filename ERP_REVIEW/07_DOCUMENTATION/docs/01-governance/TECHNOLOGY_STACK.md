# Technology Stack

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Stack Overview

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Desktop Client** | Electron + React + TypeScript | Electron 28+, React 18+, TS 5+ | Cross-platform, rich ERP UI, shared web skills |
| **Mobile Client** | Flutter + Dart | Flutter 3.19+, Dart 3+ | Single codebase for Android/iOS, Material Design 3 |
| **API Server** | Node.js + NestJS + TypeScript | Node 20 LTS, NestJS 10+ | Modular architecture, WebSocket support, enterprise patterns |
| **Database** | PostgreSQL | 16+ | ACID, RLS, JSONB, mature ecosystem |
| **Cache / Pub-Sub** | Redis | 7+ | Sessions, WebSocket fan-out, rate limiting |
| **Reverse Proxy** | Nginx | 1.25+ | SSL, load balancing, static assets |
| **Containerization** | Docker + Docker Compose | Latest stable | Reproducible deployments |
| **CI/CD** | GitHub Actions | — | Build, test, deploy pipeline |
| **Monitoring** | Prometheus + Grafana | Latest | Metrics and dashboards |
| **Logging** | Loki or ELK (optional) | — | Centralized log aggregation |
| **Object Storage** | MinIO / S3-compatible | — | Backup archives, report files |

---

## 2. Desktop Client Stack

```
Electron
├── React 18 (UI framework)
├── TypeScript (type safety)
├── Vite (build tool)
├── TanStack Query (server state)
├── Zustand (client state)
├── React Router (navigation)
├── Socket.io-client (WebSocket)
├── Tailwind CSS + shadcn/ui (design system)
└── electron-updater (auto-update)
```

**UI Themes**: CSS variables for dark/light mode switching.

---

## 3. Mobile Client Stack

```
Flutter
├── Dart 3
├── Material Design 3 (material package)
├── Riverpod (state management)
├── Dio (HTTP client)
├── web_socket_channel (WebSocket)
├── freezed + json_serializable (models)
├── go_router (navigation)
└── flutter_secure_storage (token storage)
```

---

## 4. Backend Stack

```
NestJS
├── TypeORM or Prisma (ORM — decision: Prisma for type-safe migrations)
├── Passport + JWT (authentication)
├── class-validator (DTO validation)
├── Socket.io (WebSocket gateway)
├── Bull (job queue for reports/backup)
├── Winston (structured logging)
├── Helmet (security headers)
└── @nestjs/throttler (rate limiting)
```

---

## 5. Database Stack

| Component | Technology |
|-----------|------------|
| Primary DB | PostgreSQL 16 |
| Migrations | Prisma Migrate |
| Connection Pool | PgBouncer (production) |
| Row-Level Security | PostgreSQL RLS policies |
| Full-text Search | PostgreSQL tsvector |
| Backup | pg_dump + custom scripts |

---

## 6. Infrastructure Stack

| Component | Technology |
|-----------|------------|
| OS | Ubuntu 22.04 LTS |
| Containers | Docker 24+ |
| Orchestration (Phase 1) | Docker Compose |
| Orchestration (Phase 2+) | Kubernetes (optional) |
| SSL | Let's Encrypt + Certbot |
| DNS | Cloudflare or registrar DNS |
| Backup Storage | Local NAS + S3-compatible cloud |

---

## 7. Development Tools

| Tool | Purpose |
|------|---------|
| Git + GitHub | Version control |
| ESLint + Prettier | Code formatting (TS) |
| dart analyze + format | Code formatting (Dart) |
| Jest | Backend unit tests |
| Flutter test | Mobile unit tests |
| Playwright | Desktop E2E tests |
| Postman / Bruno | API testing |
| DBeaver | Database administration |

---

## 8. Future Technology Hooks

| Future Module | Planned Technology |
|---------------|-------------------|
| Marketplace | Separate microservice, GraphQL API |
| Telegram Bot | Node.js bot framework |
| SMS | Twilio / local Uzbek provider API |
| AI Analytics | Python service, PostgreSQL → data warehouse |
| macOS Desktop | Same Electron build, code signing |
| Accounting | Double-entry ledger module |

---

## 9. Version Policy

- **LTS versions only** for runtime (Node, PostgreSQL)
- **Pin major versions** in Docker images
- **Monthly dependency audit** for security patches
- **API versioning** independent of dependency versions

---

## 10. Related Documents

- [MODULAR_ARCHITECTURE.md](./MODULAR_ARCHITECTURE.md)
- [../11-platforms/DESKTOP_ELECTRON.md](../11-platforms/DESKTOP_ELECTRON.md)
- [../11-platforms/MOBILE_FLUTTER.md](../11-platforms/MOBILE_FLUTTER.md)
- [../10-devops/DOCKER.md](../10-devops/DOCKER.md)
