# WebSocket Events

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Protocol | Socket.io over WSS |
| Last Updated | 2026-06-17 |

---

## Connection

```
WSS: wss://api.erp.example.com/ws
Auth: { token: "access_token", deviceId: "uuid" }
```

On connect, client joins rooms:
- `company:{company_id}`
- `user:{user_id}`

---

## Event Format

```json
{
  "event": "product.updated",
  "timestamp": "2026-06-17T14:30:00+05:00",
  "companyId": "uuid",
  "data": { ... },
  "sequenceId": 12345
}
```

---

## Server → Client Events

| Event | Data | Trigger |
|-------|------|---------|
| `product.created` | Product object | New product |
| `product.updated` | Product object | Product edit |
| `product.deleted` | `{ id }` | Product soft-delete |
| `inventory.batch_created` | Batch object | Stock received |
| `inventory.stock_changed` | `{ productId, quantity }` | Any stock change |
| `sale.completed` | Sale summary | Sale finished |
| `sale.voided` | `{ saleId }` | Sale cancelled |
| `payment.received` | Payment object | Debt payment |
| `customer.updated` | Customer object | Customer/debt change |
| `currency.rate_updated` | `{ rate, effectiveFrom }` | Rate change |
| `dashboard.refresh` | `{ reason }` | Trigger dashboard reload |
| `module.disabled` | `{ moduleId }` | Module turned off |
| `module.enabled` | `{ moduleId }` | Module turned on |
| `session.terminated` | `{ sessionId, reason }` | Force logout |
| `device.blocked` | `{ deviceId }` | Device blocked |
| `user.blocked` | `{ userId }` | User blocked |
| `notification.new` | Notification object | New notification |

---

## Client → Server Events

| Event | Data | Purpose |
|-------|------|---------|
| `ping` | — | Keepalive |
| `subscribe` | `{ channels }` | Subscribe to additional channels |
| `ack` | `{ sequenceId }` | Acknowledge received event |

---

## Reconnection Strategy

1. Client stores `lastSequenceId`
2. On reconnect, send `GET /sync?since={lastSequenceId}`
3. Server returns missed events
4. Client reconciles local state

---

## Related Documents

- [../09-realtime/REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md)
- [../09-realtime/WEBSOCKET_ARCHITECTURE.md](../09-realtime/WEBSOCKET_ARCHITECTURE.md)
