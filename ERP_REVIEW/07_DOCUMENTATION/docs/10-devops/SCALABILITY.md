# Scalability

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

The ERP platform is designed to scale from a **single-company deployment** (5–20 users) to a **multi-tenant SaaS** serving 100+ companies with 2,000+ concurrent users. Scaling follows a phased approach: vertical scaling first, then horizontal API scaling, then database read replicas, and finally service decomposition if needed.

**Current capacity (single node)**: 500 concurrent users, 50 requests/second, 5,000 WebSocket connections.

---

## 2. Scaling Dimensions

| Dimension | Phase 1 (Launch) | Phase 2 (Growth) | Phase 3 (Scale) |
|-----------|-------------------|-------------------|------------------|
| Companies | 1–10 | 10–50 | 50–200+ |
| Concurrent users | 50 | 500 | 2,000+ |
| API requests/sec | 10 | 100 | 500+ |
| WebSocket connections | 100 | 2,000 | 10,000+ |
| Database size | < 5 GB | 5–50 GB | 50–500 GB |
| API nodes | 1 | 2–4 | 4–8+ |
| Database | Single primary | Primary + 1 replica | Primary + 2–3 replicas |

---

## 3. Horizontal Scaling: API Layer

### Architecture

```
                    ┌─────────┐
                    │  Nginx  │
                    │ (LB)    │
                    └────┬────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
      ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
      │ API-1   │  │ API-2   │  │ API-3   │
      │ :3000   │  │ :3000   │  │ :3000   │
      └────┬────┘  └────┬────┘  └────┬────┘
           │             │             │
           └─────────────┼─────────────┘
                         │
                    ┌────▼────┐
                    │  Redis  │
                    │ (pub/sub)│
                    └─────────┘
```

### Scaling Trigger Points

| Metric | Scale Up Trigger | Scale Down Trigger |
|--------|-----------------|-------------------|
| CPU utilization | > 70% sustained 15 min | < 30% sustained 30 min |
| Memory utilization | > 80% | < 40% |
| Request latency P95 | > 500ms | < 100ms |
| WebSocket connections | > 3,000 per node | < 1,000 per node |
| Error rate | > 1% | < 0.1% |

### Load Balancing Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| Algorithm | `ip_hash` (sticky) | WebSocket session affinity |
| Health check | `GET /health/ready` every 10s | Remove unhealthy nodes |
| Failover | Automatic | Nginx upstream passive health check |
| Connection drain | 30s on SIGTERM | Graceful WebSocket disconnect |

### Stateless Design Requirements

For horizontal scaling to work, API nodes must be stateless:

| State | Storage | Shared? |
|-------|---------|---------|
| User sessions | Redis | Yes |
| WebSocket rooms | Redis pub/sub adapter | Yes |
| Business data | PostgreSQL | Yes |
| File uploads | Object storage (S3) | Yes |
| In-memory cache | Per-node (acceptable) | No (cache miss OK) |
| Background jobs | Redis (Bull queue) | Yes |

---

## 4. Database Scaling

### Phase 1: Single Primary (Launch)

| Configuration | Value |
|---------------|-------|
| Instance | 1 PostgreSQL 16 primary |
| Connection pool | PgBouncer (transaction mode) |
| Max connections | 200 (via PgBouncer) |
| Storage | SSD; auto-grow enabled |

Sufficient for up to 20 companies and 10 GB database.

### Phase 2: Read Replicas

```
┌──────────────┐     Streaming      ┌──────────────┐
│   Primary    │ ───Replication───▶ │  Read Replica│
│  (writes)    │                    │  (reads)     │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       ▼                                   ▼
  API (mutations)                    API (queries, reports)
```

| Use Case | Route To |
|----------|----------|
| Sales, payments, stock changes | Primary |
| Product catalog reads | Replica |
| Dashboard queries | Replica |
| Report generation | Replica |
| Search / autocomplete | Replica |
| Admin CRUD | Primary |

### Read Replica Configuration

| Setting | Value |
|---------|-------|
| Replication | PostgreSQL streaming replication |
| Lag tolerance | < 1 second (alert if > 5s) |
| Replica count | 1 (Phase 2); up to 3 (Phase 3) |
| Failover | Manual promotion (Phase 2); automatic (Phase 3) |
| Connection routing | Application-level (Prisma read replicas) |

### Query Routing Rules

| Query Type | Target | Consistency |
|------------|--------|-------------|
| `INSERT`, `UPDATE`, `DELETE` | Primary | Strong |
| `SELECT` (list views, search) | Replica | Eventual (< 1s lag) |
| `SELECT` (post-mutation read) | Primary | Strong |
| Report generation | Replica | Eventual |
| Financial reconciliation | Primary | Strong |

### Phase 3: Connection Pooling at Scale

| Component | Configuration |
|-----------|---------------|
| PgBouncer | Transaction pooling mode |
| Pool size per API node | 20 connections |
| Max client connections | 1,000 |
| Primary max connections | 200 |
| Replica max connections | 100 each |

---

## 5. Redis Scaling

### Phase 1: Single Instance

Sufficient for sessions, pub/sub, and rate limiting up to 500 concurrent users.

| Setting | Value |
|---------|-------|
| Memory | 512 MB – 1 GB |
| Persistence | AOF |
| Eviction | `noeviction` |

### Phase 2: Redis Sentinel (HA)

| Component | Purpose |
|-----------|---------|
| Redis Primary | Active instance |
| Redis Replica | Hot standby |
| Sentinel (x3) | Automatic failover |

Failover time: < 30 seconds. WebSocket clients reconnect automatically.

### Phase 3: Redis Cluster

Only if pub/sub throughput exceeds single-node capacity (> 100K messages/second).

---

## 6. WebSocket Scaling

Detailed in [../09-realtime/WEBSOCKET_ARCHITECTURE.md](../09-realtime/WEBSOCKET_ARCHITECTURE.md).

| Phase | Architecture | Max Connections |
|-------|-------------|-----------------|
| 1 | Single API node, in-process Socket.io | 5,000 |
| 2 | Multi-node + Redis adapter | 20,000 |
| 3 | Dedicated WS gateway tier | 100,000+ |

### Scaling Considerations

| Concern | Solution |
|---------|----------|
| Cross-node broadcast | Redis pub/sub adapter |
| Sticky sessions | Nginx `ip_hash` |
| Connection memory | ~10 KB per connection; plan RAM accordingly |
| Event ordering | Per-company sequence IDs (not per-connection) |
| Reconnection storm | Exponential backoff; server-side connection rate limit |

---

## 7. Storage Scaling

| Data Type | Growth Rate | Scaling Strategy |
|-----------|-------------|-----------------|
| PostgreSQL | ~100 MB/company/month | Vertical disk expansion; partitioning at 100 GB |
| Backups | ~30% of DB size/day (compressed) | Cloud lifecycle policies |
| Uploaded files | Variable | S3 with unlimited storage |
| Logs | ~500 MB/day | Rotation + future log aggregation |
| Redis | Stable (~100 MB) | Fixed allocation |

### Database Partitioning (Future)

When single tables exceed 10M rows:

| Table | Partition Strategy |
|-------|-------------------|
| `sales` | Range by `created_at` (monthly) |
| `audit_logs` | Range by `created_at` (monthly) |
| `event_log` | Range by `created_at` (weekly) |
| `stock_movements` | Range by `created_at` (monthly) |

---

## 8. Performance Optimization

### Application Level

| Technique | Impact | Phase |
|-----------|--------|-------|
| Database query optimization | High | 1 |
| Response caching (Redis) | High | 1 |
| Connection pooling (PgBouncer) | High | 1 |
| Pagination (cursor-based) | Medium | 1 |
| Lazy loading (relations) | Medium | 1 |
| Background jobs (reports) | Medium | 1 |
| CDN for static assets | Low | 2 |
| Database read replicas | High | 2 |
| Query result caching | Medium | 2 |

### Database Level

| Technique | When |
|-----------|------|
| Index optimization | Ongoing (see [../05-database/INDEXING_STRATEGY.md](../05-database/INDEXING_STRATEGY.md)) |
| Materialized views | Dashboard KPIs (Phase 2) |
| Table partitioning | Tables > 10M rows |
| Vacuum tuning | Monthly maintenance |
| Query plan analysis | Monthly review |

---

## 9. Capacity Planning

### Per-Company Resource Estimates

| Resource | Small (5 users) | Medium (20 users) | Large (50 users) |
|----------|-----------------|--------------------|--------------------|
| DB size | 200 MB | 2 GB | 10 GB |
| API req/sec (peak) | 2 | 10 | 30 |
| WS connections | 10 | 40 | 100 |
| Daily sales | 50 | 500 | 2,000 |
| Daily backup size | 70 MB | 700 MB | 3.5 GB |

### Multi-Tenant Capacity (Shared Infrastructure)

| Total Companies | API Nodes | DB Config | Redis | Est. Monthly Cost |
|-----------------|-----------|-----------|-------|-------------------|
| 1–10 | 1 | 4 CPU, 8 GB | 512 MB | $50–100 |
| 10–30 | 2 | 8 CPU, 16 GB + 1 replica | 1 GB | $150–300 |
| 30–100 | 4 | 16 CPU, 32 GB + 2 replicas | 2 GB Sentinel | $400–800 |
| 100+ | 8+ | Dedicated primary + 3 replicas | Cluster | $1,000+ |

---

## 10. Auto-Scaling (Future)

Docker Compose does not support auto-scaling. Migration to Kubernetes enables:

| Resource | HPA Metric | Min | Max |
|----------|-----------|-----|-----|
| API pods | CPU > 70% | 2 | 8 |
| API pods | Custom: WS connections > 3000 | 2 | 8 |

Decision to migrate to Kubernetes deferred until consistently operating 4+ API nodes.

---

## 11. Scaling Testing

### Load Test Scenarios

| Scenario | Tool | Target |
|----------|------|--------|
| API throughput | k6 | 100 req/sec sustained 10 min |
| WebSocket fan-out | Custom script | 1,000 connections, 100 events/sec |
| Database stress | pgbench + app queries | 500 concurrent connections |
| Sale workflow | k6 (full flow) | 50 concurrent sales/min |
| Report generation | k6 | 10 concurrent reports |

### Load Test Schedule

| When | Scope |
|------|-------|
| Before production launch | Full suite |
| After major release | API + WS tests |
| Quarterly | Full suite with updated baselines |
| After scaling change | Targeted test for changed component |

---

## 12. Related Documents

- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
- [DOCKER.md](./DOCKER.md)
- [MONITORING.md](./MONITORING.md)
- [../09-realtime/WEBSOCKET_ARCHITECTURE.md](../09-realtime/WEBSOCKET_ARCHITECTURE.md)
- [../05-database/INDEXING_STRATEGY.md](../05-database/INDEXING_STRATEGY.md)
- [../05-database/DATABASE_ARCHITECTURE.md](../05-database/DATABASE_ARCHITECTURE.md)
