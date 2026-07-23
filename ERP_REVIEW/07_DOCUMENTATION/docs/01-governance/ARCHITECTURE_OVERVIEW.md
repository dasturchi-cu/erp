# Architecture Overview

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved for Design Phase |
| Source of Truth | [ERP_MASTER_PLAN.md](../../ERP_MASTER_PLAN.md) |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

This ERP is a **centralized, multi-tenant, multi-device enterprise platform** designed for Uzbekistan wholesale and retail businesses operating across construction materials, furniture parts, shelving, tools, sealants, and related verticals.

The system follows a **modular monolith with event-driven real-time layer** architecture pattern — optimized for rapid delivery, operational simplicity, and future decomposition into microservices if scale demands.

---

## 2. Architectural Principles

| Principle | Description |
|-----------|-------------|
| **Single Source of Truth** | PostgreSQL is the authoritative data store; all clients read/write through the API |
| **Company Isolation** | Every data row is scoped by `company_id`; cross-tenant access is impossible at DB and API layers |
| **Immutable Financial History** | Sales, payments, exchange rates, and FIFO allocations are append-only with audit trail |
| **Real-Time by Default** | State changes propagate via WebSocket within 500ms p95 |
| **Platform Agnostic Core** | Business logic lives server-side; clients are thin presentation layers |
| **Modular Extensibility** | Features are packaged as modules with enable/disable at runtime |
| **Security in Depth** | Authentication, RBAC, device trust, session control, and audit at every layer |
| **Operations Ready** | Docker, Nginx, CI/CD, monitoring, backup/recovery from day one |

---

## 3. High-Level System Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├──────────────┬──────────────┬──────────────┬────────────────────────────┤
│ Windows      │ Android      │ iPhone/iPad  │ Future macOS               │
│ Electron+    │ Flutter      │ Flutter      │ Electron+React             │
│ React+TS     │ Material 3   │ Material 3   │                            │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────────┬─────────────┘
       │              │              │                      │
       └──────────────┴──────────────┴──────────────────────┘
                              │
                    HTTPS / WSS (TLS 1.3)
                              │
┌─────────────────────────────▼───────────────────────────────────────────┐
│                         EDGE LAYER                                       │
│  Nginx — Reverse Proxy, SSL Termination, Rate Limiting, Static Assets   │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────────┐
│                      APPLICATION LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ API Server (Node.js / NestJS or equivalent)                         │  │
│  │  • REST API v1          • WebSocket Gateway                         │  │
│  │  • Auth Service         • Module Registry                           │  │
│  │  • RBAC Engine          • Notification Dispatcher                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Domain Modules                                                       │  │
│  │ Products │ Inventory/FIFO │ Sales │ Customers │ Debt │ Currency   │  │
│  │ Dashboard │ Reports │ Admin │ Audit │ Notifications                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────────┐
│                       DATA LAYER                                           │
│  PostgreSQL 16+  │  Redis (sessions, pub/sub, cache)  │  Object Storage   │
└───────────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────────┐
│                    OPERATIONS LAYER                                        │
│  Docker │ CI/CD │ Monitoring (Prometheus/Grafana) │ Backup (Local+Cloud) │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Layer Responsibilities

### 4.1 Client Layer

- **Desktop (Electron + React + TypeScript)**: Primary workstation for managers, warehouse staff, cashiers
- **Mobile (Flutter)**: Field sales, quick lookups, payments on the go
- **Future macOS**: Same Electron codebase with platform-specific packaging

Clients MUST NOT contain authoritative business rules for FIFO, currency conversion, or debt calculations.

### 4.2 Edge Layer (Nginx)

- TLS termination
- Request routing to API and WebSocket upstreams
- Gzip/Brotli compression
- IP-based rate limiting
- Health check endpoints

### 4.3 Application Layer

- RESTful API for CRUD and transactional operations
- WebSocket server for real-time events
- Authentication (JWT + refresh tokens)
- Authorization (RBAC + fine-grained permissions)
- Module gating (feature flags per company/system)
- Background jobs (reports, backups, notifications)

### 4.4 Data Layer

- **PostgreSQL**: Relational data, ACID transactions, row-level security
- **Redis**: Session store, WebSocket pub/sub fan-out, rate limit counters
- **Object Storage**: Report exports, backup archives

---

## 5. Multi-Tenancy Model

**Strategy**: Shared database, shared schema, `company_id` discriminator on every tenant-scoped table.

```
Request → Auth Middleware → Extract company_id from JWT
         → Repository Layer → Auto-inject WHERE company_id = :id
         → PostgreSQL RLS policies as defense-in-depth
```

Branch-level isolation (optional sub-scope within company) uses `branch_id` where applicable.

---

## 6. Real-Time Architecture

```
Domain Event (e.g., sale.created)
    → Event Bus (in-process or Redis pub/sub)
    → WebSocket Gateway
    → Filter by company_id + user permissions
    → Push to connected clients on all devices
```

Event categories: `product.*`, `inventory.*`, `sale.*`, `payment.*`, `debt.*`, `currency.*`, `module.*`, `session.*`, `device.*`

---

## 7. Module Architecture

Each module is a self-contained package:

```
modules/
  products/
    domain/       # Entities, value objects
    application/  # Use cases, services
    infrastructure/ # Repositories
    api/          # Controllers, DTOs
    events/       # Domain events
```

Module registry allows admin to enable/disable modules at runtime. Disabled modules:
- Return 403 on API
- Hide from navigation on all clients via WebSocket broadcast

---

## 8. Cross-Cutting Concerns

| Concern | Implementation |
|---------|----------------|
| Logging | Structured JSON logs (Winston/Pino) |
| Tracing | OpenTelemetry (future) |
| Audit | Immutable audit_log table + event sourcing for critical domains |
| i18n | Uzbek (primary), Russian, English |
| Currency | UZS/USD dual ledger with frozen exchange rates per transaction |
| Timezone | Asia/Tashkent default |

---

## 9. Deployment Topology

**Phase 1 (Single Server)**:
- Docker Compose: nginx, api, postgres, redis
- Suitable for 1–5 companies, <100 concurrent users

**Phase 2 (Scaled)**:
- Separate DB server
- Redis cluster
- Horizontal API scaling behind Nginx load balancer
- Read replicas for reporting

**Phase 3 (Enterprise)**:
- Kubernetes orchestration
- Service decomposition for high-traffic modules

---

## 10. Quality Attributes

| Attribute | Target |
|-----------|--------|
| Availability | 99.5% uptime |
| API Response (p95) | < 300ms for reads, < 800ms for writes |
| Real-time latency (p95) | < 500ms |
| RPO (Recovery Point Objective) | 24 hours (daily backup) |
| RTO (Recovery Time Objective) | 4 hours |
| Concurrent sessions per company | 50+ |
| Data retention | 7 years financial, configurable |

---

## 11. Related Documents

- [MODULAR_ARCHITECTURE.md](./MODULAR_ARCHITECTURE.md)
- [TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md)
- [../07-security/SECURITY_ARCHITECTURE.md](../07-security/SECURITY_ARCHITECTURE.md)
- [../05-database/DATABASE_ARCHITECTURE.md](../05-database/DATABASE_ARCHITECTURE.md)
- [../09-realtime/REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md)
