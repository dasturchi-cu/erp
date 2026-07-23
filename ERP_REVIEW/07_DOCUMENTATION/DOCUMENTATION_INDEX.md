# ERP Documentation Index

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Complete — Design Phase (UI/UX v2.0 added) |
| Source of Truth | [ERP_MASTER_PLAN.md](./ERP_MASTER_PLAN.md) |
| Last Updated | 2026-06-17 |
| Total Documents | 108 |

---

## Purpose

This is the **master index** for all ERP project documentation. Every document required for enterprise development is listed below, organized by domain. No application code should be written until this documentation set is reviewed and approved.

**Policy**: Documentation first. Architecture first. Design first. Development later.

---

## 0. Master Plan

| Document | Description |
|----------|-------------|
| [ERP_MASTER_PLAN.md](./ERP_MASTER_PLAN.md) | **Single source of truth** — project vision, requirements, and constraints |
| [PROJECT_DOCUMENTATION_STATUS.md](./PROJECT_DOCUMENTATION_STATUS.md) | Documentation completion metrics and readiness assessment |
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | This file — master index of all documents |

---

## 1. Governance & Architecture (`docs/01-governance/`)

| Document | Description |
|----------|-------------|
| [ARCHITECTURE_OVERVIEW.md](./docs/01-governance/ARCHITECTURE_OVERVIEW.md) | High-level system architecture, layers, principles |
| [GLOSSARY.md](./docs/01-governance/GLOSSARY.md) | Business and technical terminology (Uzbek/English) |
| [PROJECT_SCOPE.md](./docs/01-governance/PROJECT_SCOPE.md) | In-scope, out-of-scope, success criteria |
| [NON_FUNCTIONAL_REQUIREMENTS.md](./docs/01-governance/NON_FUNCTIONAL_REQUIREMENTS.md) | Performance, security, availability targets |
| [TECHNOLOGY_STACK.md](./docs/01-governance/TECHNOLOGY_STACK.md) | Technology choices and rationale |
| [MODULAR_ARCHITECTURE.md](./docs/01-governance/MODULAR_ARCHITECTURE.md) | Module structure, registry, inter-module communication |
| [CODING_STANDARDS.md](./docs/01-governance/CODING_STANDARDS.md) | Code conventions for TypeScript and Dart |
| [DEVELOPMENT_LIFECYCLE.md](./docs/01-governance/DEVELOPMENT_LIFECYCLE.md) | Phases, sprints, quality gates, branching |

---

## 2. Business Analysis (`docs/02-business/`)

| Document | Description |
|----------|-------------|
| [DOMAIN_MODEL.md](./docs/02-business/DOMAIN_MODEL.md) | Entities, value objects, aggregates, domain events |
| [BUSINESS_RULES.md](./docs/02-business/BUSINESS_RULES.md) | All business rules by domain (FIFO, currency, debt, etc.) |
| [USE_CASES.md](./docs/02-business/USE_CASES.md) | Detailed use cases with main and alternate flows |
| [USER_STORIES.md](./docs/02-business/USER_STORIES.md) | User stories by epic with acceptance criteria |
| [WORKFLOWS.md](./docs/02-business/WORKFLOWS.md) | Business process workflows (sale, payment, inventory) |
| [INDUSTRY_CONTEXT.md](./docs/02-business/INDUSTRY_CONTEXT.md) | Uzbekistan market context, verticals, dual currency |
| [STAKEHOLDER_REQUIREMENTS.md](./docs/02-business/STAKEHOLDER_REQUIREMENTS.md) | Requirements by stakeholder role |

---

## 3. Product Design (`docs/03-product/`)

| Document | Description |
|----------|-------------|
| [PRODUCT_VISION.md](./docs/03-product/PRODUCT_VISION.md) | Vision statement, principles, success metrics |
| [PRODUCT_ROADMAP.md](./docs/03-product/PRODUCT_ROADMAP.md) | Phase-by-phase delivery roadmap |
| [MODULE_CATALOG.md](./docs/03-product/MODULE_CATALOG.md) | All modules with dependencies and phase |
| [FEATURE_PRIORITIZATION.md](./docs/03-product/FEATURE_PRIORITIZATION.md) | MoSCoW prioritization matrix |
| [RELEASE_STRATEGY.md](./docs/03-product/RELEASE_STRATEGY.md) | Versioning, release cadence, rollback |

---

## 4. UI/UX Design (`docs/04-ui-ux/`) — v2.0 Enterprise Suite

### Master & Architecture
| Document | Description |
|----------|-------------|
| [UI_UX_MASTER_BLUEPRINT.md](./docs/04-ui-ux/UI_UX_MASTER_BLUEPRINT.md) | **Master UI/UX blueprint** — standards, philosophy, handoff |
| [UI_SCREEN_CATALOG.md](./docs/04-ui-ux/UI_SCREEN_CATALOG.md) | Screen registry and spec document index |
| [UI_UX_DOCUMENTATION_STATUS.md](./docs/04-ui-ux/UI_UX_DOCUMENTATION_STATUS.md) | UI/UX completion metrics |
| [SCREEN_HIERARCHY.md](./docs/04-ui-ux/SCREEN_HIERARCHY.md) | SCR-IDs, screen tree, permissions |
| [COMPONENT_HIERARCHY.md](./docs/04-ui-ux/COMPONENT_HIERARCHY.md) | Atomic design component tree |
| [NAVIGATION_ARCHITECTURE.md](./docs/04-ui-ux/NAVIGATION_ARCHITECTURE.md) | Routes, nav maps, command palette |
| [WIREFRAME_IMPLEMENTATION_GUIDE.md](./docs/04-ui-ux/WIREFRAME_IMPLEMENTATION_GUIDE.md) | Pixel specs, Figma setup, dev mapping |
| [UI_STATE_MANAGEMENT.md](./docs/04-ui-ux/UI_STATE_MANAGEMENT.md) | Client state architecture |

### Design System
| Document | Description |
|----------|-------------|
| [DESIGN_SYSTEM.md](./docs/04-ui-ux/DESIGN_SYSTEM.md) | Complete token system v2.0 |
| [COMPONENT_LIBRARY.md](./docs/04-ui-ux/COMPONENT_LIBRARY.md) | 52 components (CMP-001–052) |
| [RESPONSIVE_GUIDELINES.md](./docs/04-ui-ux/RESPONSIVE_GUIDELINES.md) | Breakpoints, responsive behavior |
| [THEMING_DARK_LIGHT.md](./docs/04-ui-ux/THEMING_DARK_LIGHT.md) | Dark/light mode |
| [ACCESSIBILITY.md](./docs/04-ui-ux/ACCESSIBILITY.md) | WCAG 2.2 targets |

### Experience Specifications
| Document | Description |
|----------|-------------|
| [USER_JOURNEYS.md](./docs/04-ui-ux/USER_JOURNEYS.md) | Persona journey maps |
| [USER_FLOWS.md](./docs/04-ui-ux/USER_FLOWS.md) | Interaction flow diagrams |
| [DESKTOP_UX.md](./docs/04-ui-ux/DESKTOP_UX.md) | Windows Electron UX |
| [MOBILE_UX.md](./docs/04-ui-ux/MOBILE_UX.md) | Flutter MD3 UX |
| [DASHBOARD_UX.md](./docs/04-ui-ux/DASHBOARD_UX.md) | Dashboard deep spec |
| [ADMIN_PANEL_UX.md](./docs/04-ui-ux/ADMIN_PANEL_UX.md) | Admin panel deep spec |

### Screen Specifications (`docs/04-ui-ux/screens/`)
| Document | Screens |
|----------|---------|
| [SCREENS_AUTH_AND_ONBOARDING.md](./docs/04-ui-ux/screens/SCREENS_AUTH_AND_ONBOARDING.md) | Login, Company Selection |
| [SCREENS_COMMERCE_AND_SALES.md](./docs/04-ui-ux/screens/SCREENS_COMMERCE_AND_SALES.md) | POS, Sales, Products |
| [SCREENS_INVENTORY.md](./docs/04-ui-ux/screens/SCREENS_INVENTORY.md) | Stock, Warehouses, Movements |
| [SCREENS_CUSTOMERS_AND_FINANCE.md](./docs/04-ui-ux/screens/SCREENS_CUSTOMERS_AND_FINANCE.md) | Customers, Debt, Currency |
| [SCREENS_ANALYTICS_AND_SYSTEM.md](./docs/04-ui-ux/screens/SCREENS_ANALYTICS_AND_SYSTEM.md) | Dashboard, Reports, Settings |
| [SCREENS_ADMIN.md](./docs/04-ui-ux/screens/SCREENS_ADMIN.md) | Full admin suite |

### Legacy v1.0 (superseded by v2.0 — retained for reference)
| Document | Description |
|----------|-------------|
| [DESIGN_PRINCIPLES.md](./docs/04-ui-ux/DESIGN_PRINCIPLES.md) | Core UX principles |
| [INFORMATION_ARCHITECTURE.md](./docs/04-ui-ux/INFORMATION_ARCHITECTURE.md) | Navigation structure |
| [RESPONSIVE_DESIGN.md](./docs/04-ui-ux/RESPONSIVE_DESIGN.md) | Breakpoints (see RESPONSIVE_GUIDELINES) |
| [DESKTOP_UI_SPEC.md](./docs/04-ui-ux/DESKTOP_UI_SPEC.md) | Desktop spec (see DESKTOP_UX) |
| [MOBILE_UI_SPEC.md](./docs/04-ui-ux/MOBILE_UI_SPEC.md) | Mobile spec (see MOBILE_UX) |
| [NAVIGATION_PATTERNS.md](./docs/04-ui-ux/NAVIGATION_PATTERNS.md) | Nav patterns (see NAVIGATION_ARCHITECTURE) |

---

## 5. Database Design (`docs/05-database/`)

| Document | Description |
|----------|-------------|
| [DATABASE_ARCHITECTURE.md](./docs/05-database/DATABASE_ARCHITECTURE.md) | PostgreSQL architecture, multi-tenancy, pooling |
| [ERD_OVERVIEW.md](./docs/05-database/ERD_OVERVIEW.md) | Entity relationship diagram and cardinality |
| [SCHEMA_DESIGN.md](./docs/05-database/SCHEMA_DESIGN.md) | Complete table definitions with SQL |
| [MIGRATION_STRATEGY.md](./docs/05-database/MIGRATION_STRATEGY.md) | Prisma migrations, zero-downtime rules |
| [INDEXING_STRATEGY.md](./docs/05-database/INDEXING_STRATEGY.md) | Index definitions and monitoring |
| [MULTI_TENANCY_DESIGN.md](./docs/05-database/MULTI_TENANCY_DESIGN.md) | Company isolation layers and testing |
| [DATA_RETENTION_POLICY.md](./docs/05-database/DATA_RETENTION_POLICY.md) | Retention periods, archival, privacy |

---

## 6. API Design (`docs/06-api/`)

| Document | Description |
|----------|-------------|
| [API_DESIGN.md](./docs/06-api/API_DESIGN.md) | REST + WebSocket architecture overview |
| [API_STANDARDS.md](./docs/06-api/API_STANDARDS.md) | REST conventions, status codes, rate limiting |
| [REST_API_REFERENCE.md](./docs/06-api/REST_API_REFERENCE.md) | Complete endpoint catalog with permissions |
| [WEBSOCKET_EVENTS.md](./docs/06-api/WEBSOCKET_EVENTS.md) | WebSocket event catalog (server ↔ client) |
| [ERROR_HANDLING.md](./docs/06-api/ERROR_HANDLING.md) | Error codes and client handling |
| [API_VERSIONING.md](./docs/06-api/API_VERSIONING.md) | Versioning strategy and breaking change policy |

---

## 7. Security (`docs/07-security/`)

| Document | Description |
|----------|-------------|
| [SECURITY_ARCHITECTURE.md](./docs/07-security/SECURITY_ARCHITECTURE.md) | Defense in depth, threat model, headers |
| [AUTHENTICATION.md](./docs/07-security/AUTHENTICATION.md) | Login flow, JWT tokens, password policy |
| [AUTHORIZATION.md](./docs/07-security/AUTHORIZATION.md) | Authorization flow and guards |
| [RBAC_DESIGN.md](./docs/07-security/RBAC_DESIGN.md) | Roles and permission matrix |
| [PERMISSIONS_MODEL.md](./docs/07-security/PERMISSIONS_MODEL.md) | Complete permission catalog |
| [SESSION_MANAGEMENT.md](./docs/07-security/SESSION_MANAGEMENT.md) | Session lifecycle, admin controls |
| [DEVICE_MANAGEMENT.md](./docs/07-security/DEVICE_MANAGEMENT.md) | Device registration, block/unblock |
| [ENCRYPTION_STANDARDS.md](./docs/07-security/ENCRYPTION_STANDARDS.md) | TLS, at-rest encryption, JWT signing |
| [AUDIT_SECURITY.md](./docs/07-security/AUDIT_SECURITY.md) | Security-specific audit events |

---

## 8. Business Modules (`docs/08-modules/`)

| Document | Module | Description |
|----------|--------|-------------|
| [PRODUCTS.md](./docs/08-modules/PRODUCTS.md) | Products | SKU, barcode, categories, dual pricing |
| [INVENTORY.md](./docs/08-modules/INVENTORY.md) | Inventory | Stock, batches, movements, warehouse |
| [FIFO.md](./docs/08-modules/FIFO.md) | FIFO | Mandatory FIFO allocation, COGS |
| [CURRENCY_UZS_USD.md](./docs/08-modules/CURRENCY_UZS_USD.md) | Currency | UZS/USD dual currency, frozen rates |
| [SALES.md](./docs/08-modules/SALES.md) | Sales | POS, credit/cash, returns |
| [CUSTOMERS.md](./docs/08-modules/CUSTOMERS.md) | Customers | Customer cards, phone search |
| [DEBT_MANAGEMENT.md](./docs/08-modules/DEBT_MANAGEMENT.md) | Debt | Debt, partial/full payment, history |
| [DASHBOARD.md](./docs/08-modules/DASHBOARD.md) | Dashboard | KPIs, charts, top products |
| [REPORTS.md](./docs/08-modules/REPORTS.md) | Reports | PDF, Excel, CSV export |
| [NOTIFICATIONS.md](./docs/08-modules/NOTIFICATIONS.md) | Notifications | Real-time in-app notifications |
| [ADMIN_PANEL.md](./docs/08-modules/ADMIN_PANEL.md) | Admin | Users, devices, sessions, monitoring |
| [AUDIT_LOGS.md](./docs/08-modules/AUDIT_LOGS.md) | Audit | Full audit trail specification |
| [MULTI_COMPANY.md](./docs/08-modules/MULTI_COMPANY.md) | Multi-Company | Tenant isolation, company switcher |
| [MODULE_MANAGEMENT.md](./docs/08-modules/MODULE_MANAGEMENT.md) | Modules | Enable/disable, client propagation |
| [BRANCH_MANAGEMENT.md](./docs/08-modules/BRANCH_MANAGEMENT.md) | Branches | Branch management within companies |

---

## 9. Real-Time Synchronization (`docs/09-realtime/`)

| Document | Description |
|----------|-------------|
| [REALTIME_SYNC.md](./docs/09-realtime/REALTIME_SYNC.md) | Real-time sync architecture across all devices |
| [WEBSOCKET_ARCHITECTURE.md](./docs/09-realtime/WEBSOCKET_ARCHITECTURE.md) | Socket.io, rooms, Redis pub/sub, scaling |
| [CONFLICT_RESOLUTION.md](./docs/09-realtime/CONFLICT_RESOLUTION.md) | Server-authoritative model, optimistic UI |
| [OFFLINE_STRATEGY.md](./docs/09-realtime/OFFLINE_STRATEGY.md) | Phase 1 online-only, Phase 2 offline plans |

---

## 10. DevOps & Operations (`docs/10-devops/`)

| Document | Description |
|----------|-------------|
| [DEPLOYMENT.md](./docs/10-devops/DEPLOYMENT.md) | Production deployment guide |
| [DOCKER.md](./docs/10-devops/DOCKER.md) | Docker Compose services and configuration |
| [NGINX.md](./docs/10-devops/NGINX.md) | Reverse proxy, SSL, WebSocket proxy |
| [CI_CD.md](./docs/10-devops/CI_CD.md) | GitHub Actions CI/CD pipeline |
| [MONITORING.md](./docs/10-devops/MONITORING.md) | Prometheus, Grafana, alerting |
| [BACKUP_RECOVERY.md](./docs/10-devops/BACKUP_RECOVERY.md) | Daily backup, local + cloud storage |
| [SCALABILITY.md](./docs/10-devops/SCALABILITY.md) | Horizontal scaling, read replicas |
| [INFRASTRUCTURE.md](./docs/10-devops/INFRASTRUCTURE.md) | Server requirements, network topology |
| [SSL_HTTPS.md](./docs/10-devops/SSL_HTTPS.md) | Let's Encrypt, certificate management |
| [DISASTER_RECOVERY.md](./docs/10-devops/DISASTER_RECOVERY.md) | RPO/RTO, recovery procedures |

---

## 11. Platform Specifications (`docs/11-platforms/`)

| Document | Description |
|----------|-------------|
| [DESKTOP_ELECTRON.md](./docs/11-platforms/DESKTOP_ELECTRON.md) | Electron + React + TypeScript (Windows, future macOS) |
| [MOBILE_FLUTTER.md](./docs/11-platforms/MOBILE_FLUTTER.md) | Flutter + Material Design 3 (Android, iOS) |
| [FUTURE_MACOS.md](./docs/11-platforms/FUTURE_MACOS.md) | macOS deployment and code signing plan |
| [MULTI_DEVICE_STRATEGY.md](./docs/11-platforms/MULTI_DEVICE_STRATEGY.md) | Cross-platform strategy and feature matrix |

---

## 12. Future Expansion (`docs/12-future/`)

| Document | Description |
|----------|-------------|
| [EXPANSION_ROADMAP.md](./docs/12-future/EXPANSION_ROADMAP.md) | Marketplace, Telegram, SMS, CRM, Accounting, AI |
| [FUTURE_MODULES.md](./docs/12-future/FUTURE_MODULES.md) | Detailed future module specifications |
| [INTEGRATION_POINTS.md](./docs/12-future/INTEGRATION_POINTS.md) | API hooks for external integrations |

---

## Document Count by Category

| Category | Count |
|----------|-------|
| Master Plan & Index | 3 |
| Governance & Architecture | 8 |
| Business Analysis | 7 |
| Product Design | 5 |
| UI/UX Design | 11 |
| Database Design | 7 |
| API Design | 6 |
| Security | 9 |
| Business Modules | 15 |
| Real-Time | 4 |
| DevOps & Operations | 10 |
| Platform Specifications | 4 |
| Future Expansion | 3 |
| **Total** | **92** |

---

## Reading Order for New Team Members

1. [ERP_MASTER_PLAN.md](./ERP_MASTER_PLAN.md) — understand the vision
2. [ARCHITECTURE_OVERVIEW.md](./docs/01-governance/ARCHITECTURE_OVERVIEW.md) — understand the system
3. [GLOSSARY.md](./docs/01-governance/GLOSSARY.md) — learn the terminology
4. [DOMAIN_MODEL.md](./docs/02-business/DOMAIN_MODEL.md) — understand the data
5. [BUSINESS_RULES.md](./docs/02-business/BUSINESS_RULES.md) — learn the rules
6. [MODULAR_ARCHITECTURE.md](./docs/01-governance/MODULAR_ARCHITECTURE.md) — understand code structure
7. Role-specific modules in `docs/08-modules/`
8. Platform docs in `docs/11-platforms/` for client developers

---

## Approval Gate

Before Phase 1 development begins, the following must be signed off:

- [ ] Architecture review (Governance + Database + API + Security)
- [ ] Business rules validation with stakeholders
- [ ] UI/UX specification review
- [ ] DevOps infrastructure plan approval
- [ ] Security architecture review

---

*This index is maintained alongside the documentation set. Update when new documents are added.*
