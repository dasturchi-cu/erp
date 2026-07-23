# WebSocket Architecture

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The ERP real-time layer uses **Socket.io** over **WSS (WebSocket Secure)** as the transport protocol between API server and all client platforms. Socket.io provides automatic fallback, room-based broadcasting, reconnection handling, and a mature client ecosystem for Electron (JavaScript) and Flutter (via compatible adapters).

**Endpoint**: `wss://api.{domain}/ws`

---

## 2. Technology Selection

| Requirement | Socket.io Capability |
|-------------|---------------------|
| Room-based fan-out | Built-in room join/leave and broadcast |
| Reconnection | Client and server reconnection with session recovery |
| Fallback transport | Long-polling fallback for restrictive networks |
| Horizontal scaling | Redis adapter for multi-node pub/sub |
| Authentication | Custom middleware at connection handshake |
| Binary support | Available for future file-transfer events |
| Client libraries | `socket.io-client` (JS), `socket_io_client` (Dart) |

---

## 3. Server Architecture

```
                    ┌─────────────────────────────────────┐
                    │           Nginx (WSS Proxy)          │
                    │  Upgrade: websocket                  │
                    │  proxy_read_timeout: 3600s           │
                    └──────────────────┬──────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
       ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
       │  API Node 1 │          │  API Node 2 │          │  API Node N │
       │  ┌─────────┐│          │  ┌─────────┐│          │  ┌─────────┐│
       │  │Socket.io││          │  │Socket.io││          │  │Socket.io││
       │  │Gateway  ││          │  │Gateway  ││          │  │Gateway  ││
       │  └────┬────┘│          │  └────┬────┘│          │  └────┬────┘│
       └───────┼─────┘          └───────┼─────┘          └───────┼─────┘
               │                        │                        │
               └────────────────────────┼────────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │  Redis Adapter  │
                              │  (Pub/Sub)      │
                              └─────────────────┘
```

### NestJS Gateway Module

The WebSocket gateway is implemented as a NestJS `@WebSocketGateway` module, sharing the same process as the REST API in Phase 1. This avoids additional network hops and simplifies deployment.

| Component | Responsibility |
|-----------|----------------|
| `WsAuthGuard` | Validates JWT at handshake; rejects unauthenticated connections |
| `WsRoomService` | Manages room join/leave on connect, company switch, disconnect |
| `WsEventPublisher` | Publishes domain events to Redis after DB commit |
| `WsEventSubscriber` | Receives Redis messages and emits to local Socket.io rooms |
| `WsConnectionRegistry` | Tracks active connections per user/device for admin visibility |

---

## 4. Connection Lifecycle

### Handshake

```
Client → Server: connect({ auth: { token, deviceId } })
Server:
  1. Verify JWT signature and expiry
  2. Validate deviceId is registered and not blocked
  3. Load user permissions and company context
  4. Join rooms: company:{id}, user:{id}
  5. Emit: connection.established { sequenceId, serverTime }
```

### Active Session

- Server sends `ping` every 25 seconds; client responds with `pong` (Socket.io built-in).
- Client may send application-level `ping` for latency measurement.
- Server re-validates JWT every 5 minutes; terminates connection on failure.

### Disconnect

| Reason | Server Action |
|--------|---------------|
| Client logout | Remove from all rooms; clear connection registry |
| Token expiry | Emit `session.terminated`; disconnect |
| Admin force logout | Emit `session.terminated`; disconnect |
| Network loss | Retain connection registry entry for 60 seconds (reconnect window) |
| Server shutdown | Graceful drain; clients reconnect to another node |

---

## 5. Room Design

Rooms are the primary mechanism for targeted event delivery.

### Standard Rooms (Auto-Joined)

| Room Pattern | Members | Events |
|--------------|---------|--------|
| `company:{company_id}` | All users logged into that company | All business domain events |
| `user:{user_id}` | All sessions of that user | Personal notifications, session control |

### Optional Rooms (Client-Requested)

| Room Pattern | Subscription Event | Use Case |
|--------------|-------------------|----------|
| `branch:{branch_id}` | `subscribe { channels: ["branch:uuid"] }` | Branch manager dashboards |
| `product:{product_id}` | `subscribe { channels: ["product:uuid"] }` | Real-time stock watch |
| `dashboard` | `subscribe { channels: ["dashboard"] }` | Coalesced KPI refresh events |

### Room Security

- Server validates the requesting user's JWT `company_id` matches the room's company scope.
- Branch rooms require `branch_id` in JWT or explicit branch access permission.
- Clients cannot join arbitrary rooms; server enforces allowlist.

---

## 6. Pub/Sub Architecture (Redis)

Single-node Socket.io suffices for development and small deployments. Production uses the **Socket.io Redis adapter** for horizontal scaling.

### Publish Flow

```
1. API Node 1 commits sale transaction
2. WsEventPublisher:
   a. INCR company:{id}:sequence → sequenceId
   b. Serialize event payload
   c. PUBLISH channel "erp:events:company:{id}" with payload
   d. INSERT into event_log table (for replay)
3. All API nodes subscribed to Redis receive the message
4. Each node's WsEventSubscriber emits to local Socket.io room
```

### Redis Channels

| Channel Pattern | Purpose |
|-----------------|---------|
| `erp:events:company:{id}` | Company-scoped business events |
| `erp:events:user:{id}` | User-scoped personal events |
| `erp:events:broadcast` | System-wide announcements (maintenance, version) |

### Redis Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| `maxmemory-policy` | `noeviction` | Event delivery must not lose messages |
| Persistence | AOF enabled | Survive Redis restarts |
| Separate instance | Recommended | Isolate from session cache eviction |

---

## 7. Event Payload Contract

All server-emitted events follow the envelope defined in [../06-api/WEBSOCKET_EVENTS.md](../06-api/WEBSOCKET_EVENTS.md):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | Yes | Dot-notation event name |
| `timestamp` | ISO 8601 | Yes | Server emission time |
| `companyId` | UUID | Yes | Tenant scope |
| `sequenceId` | integer | Yes | Monotonic per-company ordering |
| `data` | object | Yes | Event-specific payload |
| `actorUserId` | UUID | No | User who triggered the change |
| `actorDeviceId` | UUID | No | Device that originated the mutation |

---

## 8. Horizontal Scaling

### Phase 1: Single Node

- One API container handles REST + WebSocket.
- Suitable for up to ~500 concurrent connections.
- No Redis adapter required (in-process emit).

### Phase 2: Multi-Node with Sticky Sessions

| Component | Configuration |
|-----------|---------------|
| Nginx | `ip_hash` or `hash $cookie_io` for sticky sessions |
| API replicas | 2–4 nodes behind load balancer |
| Redis adapter | Required for cross-node broadcast |
| Connection limit | 5,000 per node |

### Phase 3: Dedicated WebSocket Tier (Future)

If WebSocket traffic exceeds 50% of server resources:

- Extract Socket.io gateway to dedicated `ws-gateway` service.
- Internal message bus (Redis Streams or NATS) between API and WS tier.
- API nodes publish events; WS nodes only handle connections.

---

## 9. Nginx WebSocket Proxy

WebSocket connections require specific Nginx configuration. Full details in [../10-devops/NGINX.md](../10-devops/NGINX.md).

| Directive | Value |
|-----------|-------|
| `proxy_http_version` | `1.1` |
| `proxy_set_header Upgrade` | `$http_upgrade` |
| `proxy_set_header Connection` | `"upgrade"` |
| `proxy_read_timeout` | `3600s` |
| `proxy_send_timeout` | `3600s` |

---

## 10. Error Handling

| Error Code | Client Action |
|------------|---------------|
| `AUTH_FAILED` | Refresh token; reconnect |
| `DEVICE_BLOCKED` | Show blocked message; do not reconnect |
| `COMPANY_SUSPENDED` | Show suspension notice; logout |
| `RATE_LIMITED` | Back off 60 seconds; reconnect |
| `SERVER_MAINTENANCE` | Show maintenance banner; retry every 30 seconds |

Server logs all connection failures with `deviceId`, `userId`, and error reason for security audit.

---

## 11. Capacity Planning

| Deployment Size | API Nodes | Expected Connections | Redis |
|-----------------|-----------|---------------------|-------|
| Small (1 company, < 20 users) | 1 | < 50 | Optional |
| Medium (5 companies, 100 users) | 2 | < 300 | Required |
| Large (20+ companies, 500 users) | 4 | < 2,000 | Required + dedicated |
| Enterprise (100+ companies) | 8+ | < 10,000 | Cluster + WS tier |

---

## 12. Development and Testing

### Local Development

- WebSocket available at `ws://localhost:3000/ws` (no SSL).
- Single Node.js process; no Redis adapter needed.
- Use Socket.io admin UI (`@socket.io/admin-ui`) for debugging rooms and events.

### Integration Tests

- Connect test client with valid JWT; assert room membership.
- Publish domain event; assert delivery to subscribed client.
- Simulate multi-node with two server instances + Redis; assert cross-node delivery.
- Test reconnection after server kill; assert event replay.

---

## 13. Related Documents

- [REALTIME_SYNC.md](./REALTIME_SYNC.md)
- [CONFLICT_RESOLUTION.md](./CONFLICT_RESOLUTION.md)
- [../06-api/WEBSOCKET_EVENTS.md](../06-api/WEBSOCKET_EVENTS.md)
- [../10-devops/NGINX.md](../10-devops/NGINX.md)
- [../10-devops/SCALABILITY.md](../10-devops/SCALABILITY.md)
- [../07-security/SESSION_MANAGEMENT.md](../07-security/SESSION_MANAGEMENT.md)
