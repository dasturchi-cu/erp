# Integration Points

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Planning |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

This document defines the **integration architecture** and **API hooks** that enable future modules, external services, and third-party systems to connect with the ERP platform. All integrations follow a consistent pattern: authenticate, scope to company, respect RBAC, emit audit events, and propagate real-time updates.

**Design goal**: Any future module or external system can integrate with the ERP without modifying core platform code.

---

## 2. Integration Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS                           │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Telegram │ │   SMS    │ │Marketplace│ │  AI Service  │   │
│  │   Bot    │ │ Provider │ │  Portal  │ │  (Python)    │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       │            │            │               │            │
└───────┼────────────┼────────────┼───────────────┼────────────┘
        │            │            │               │
        ▼            ▼            ▼               ▼
┌──────────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                            │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Webhook API │  │  Event Bus  │  │ Integration API     │  │
│  │ (inbound)   │  │  (Redis)    │  │ (service accounts)  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────▼────────────────▼─────────────────────▼──────────┐  │
│  │              ERP Core (Modular Monolith)               │  │
│  │  REST API v1  │  WebSocket  │  Module Registry         │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Integration Methods

### 3.1 REST API (Primary)

Standard REST API v1 for request-response integrations.

| Property | Value |
|----------|-------|
| Base URL | `https://erp.example.uz/api/v1` |
| Auth | Bearer JWT or API key |
| Format | JSON |
| Versioning | URL path (`/v1/`, `/v2/`) |
| Rate limit | 100 req/min (API key); 30 req/min (JWT) |
| Documentation | [../06-api/REST_API_REFERENCE.md](../06-api/REST_API_REFERENCE.md) |

### 3.2 Event Bus (Pub/Sub)

Internal event bus for real-time module-to-module and module-to-service communication.

| Property | Value |
|----------|-------|
| Transport | Redis pub/sub |
| Channel pattern | `erp:events:{scope}:{id}` |
| Format | Standard WebSocket event envelope |
| Consumers | WebSocket gateway, Telegram bot, SMS service, AI pipeline |
| Ordering | Per-company `sequenceId` |

### 3.3 Webhooks (Outbound)

ERP pushes events to external systems via HTTP callbacks.

| Property | Value |
|----------|-------|
| Direction | ERP → External system |
| Method | POST |
| Auth | HMAC-SHA256 signature in `X-ERP-Signature` header |
| Retry | 3 attempts with exponential backoff |
| Timeout | 10 seconds per delivery |
| Registration | Admin panel → Integrations → Webhooks |

### 3.4 Webhooks (Inbound)

External systems push data to ERP via dedicated endpoints.

| Property | Value |
|----------|-------|
| Direction | External system → ERP |
| Auth | API key in `X-API-Key` header |
| Validation | Payload schema validation |
| Idempotency | `X-Idempotency-Key` header supported |

### 3.5 Service Account Authentication

For machine-to-machine integrations (bots, services, marketplace).

| Property | Value |
|----------|-------|
| Token type | Long-lived API key (rotatable) |
| Scope | Per-company; per-module permissions |
| Creation | Admin panel → Integrations → API Keys |
| Rate limit | Configurable per key (default: 100 req/min) |
| Audit | All API key usage logged |

---

## 4. Outbound Webhook Specification

### Registration

```json
POST /api/v1/integrations/webhooks
{
  "url": "https://external-service.com/erp-events",
  "events": ["sale.completed", "payment.received", "inventory.stock_changed"],
  "secret": "whsec_auto_generated",
  "isActive": true
}
```

### Delivery Payload

```json
POST {webhook_url}
Headers:
  Content-Type: application/json
  X-ERP-Signature: sha256={hmac_hex}
  X-ERP-Event: sale.completed
  X-ERP-Delivery-Id: uuid

Body:
{
  "event": "sale.completed",
  "timestamp": "2026-06-17T14:30:00+05:00",
  "companyId": "uuid",
  "sequenceId": 12345,
  "data": { ... }
}
```

### Signature Verification

```
expected = HMAC-SHA256(webhook_secret, request_body)
verify: X-ERP-Signature == "sha256=" + hex(expected)
```

### Supported Webhook Events

| Event | Use Case |
|-------|----------|
| `sale.completed` | External accounting, Telegram notification |
| `sale.voided` | Accounting reversal |
| `payment.received` | Payment confirmation, SMS receipt |
| `product.created` | Marketplace catalog sync |
| `product.updated` | Marketplace price/stock sync |
| `inventory.stock_changed` | Marketplace stock sync, low-stock alert |
| `customer.created` | CRM sync, marketing platform |
| `customer.updated` | CRM sync |
| `purchase_order.received` | Accounting, inventory update |
| `module.enabled` | Integration activation |
| `module.disabled` | Integration deactivation |

---

## 5. Inbound Integration Endpoints

### 5.1 Marketplace Order Intake

```
POST /api/v1/integrations/marketplace/orders
X-API-Key: {service_account_key}

{
  "externalOrderId": "MKT-12345",
  "customerPhone": "+998901234567",
  "customerName": "Alisher Karimov",
  "items": [
    { "productSku": "SKU-001", "quantity": 5, "unitPrice": 150000 }
  ],
  "paymentStatus": "PAID",
  "paymentReference": "click_tx_789",
  "currency": "UZS"
}
```

**Response**: Creates pending sale in ERP; returns `saleId` for tracking.

### 5.2 Payment Gateway Callback

```
POST /api/v1/integrations/payments/callback
X-API-Key: {payment_provider_key}

{
  "provider": "click",
  "externalTransactionId": "click_tx_789",
  "amount": 1500000,
  "currency": "UZS",
  "status": "COMPLETED",
  "customerPhone": "+998901234567",
  "metadata": { "saleId": "uuid" }
}
```

**Response**: Records payment against customer debt or sale.

### 5.3 Telegram Bot User Link

```
POST /api/v1/integrations/telegram/link
X-API-Key: {telegram_service_key}

{
  "linkCode": "ABC123",
  "telegramChatId": "123456789",
  "telegramUsername": "@alisher"
}
```

**Response**: Links Telegram chat ID to ERP user account.

### 5.4 External Product Import

```
POST /api/v1/integrations/products/import
X-API-Key: {service_account_key}

{
  "source": "supplier_catalog",
  "products": [
    {
      "sku": "EXT-001",
      "name": "Imported Product",
      "barcode": "1234567890123",
      "priceUzs": 250000,
      "priceUsd": 20.00,
      "category": "Tools"
    }
  ],
  "updateExisting": true
}
```

**Response**: Import summary with created/updated/skipped counts.

### 5.5 AI Analytics Data Export

```
GET /api/v1/integrations/analytics/export
X-API-Key: {ai_service_key}
Query: ?dataType=sales&from=2026-01-01&to=2026-06-17&format=json

Response: Aggregated, anonymized dataset for ML training
```

**Scope**: Service account with `analytics.export` permission only.

---

## 6. Event Bus Integration

### Subscribing to Events (External Service)

External services connect to Redis pub/sub (internal network) or receive events via outbound webhooks.

| Channel | Events | Consumer Example |
|---------|--------|-----------------|
| `erp:events:company:{id}` | All company events | Telegram bot, SMS service |
| `erp:events:broadcast` | System-wide | Monitoring, deployment |
| `erp:events:integration:{id}` | Filtered per webhook config | Webhook delivery service |

### Event Envelope (Standard)

All events follow the same envelope regardless of delivery method:

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | Dot-notation event name |
| `timestamp` | ISO 8601 | Event creation time |
| `companyId` | UUID | Tenant scope |
| `sequenceId` | integer | Ordering guarantee |
| `data` | object | Event-specific payload |
| `actorUserId` | UUID? | Triggering user (if applicable) |
| `actorDeviceId` | UUID? | Triggering device (if applicable) |
| `moduleId` | string? | Source module |

---

## 7. Integration-Specific Hooks

### 7.1 Telegram Bot Service

| Hook | Direction | Method |
|------|-----------|--------|
| User link | Inbound | `POST /integrations/telegram/link` |
| Send notification | Internal | Subscribe to event bus |
| Command query | Outbound | `GET /api/v1/{resource}` with service account |
| Daily summary | Outbound | `GET /api/v1/reports/daily-summary` |

### 7.2 SMS Provider

| Hook | Direction | Method |
|------|-----------|--------|
| Send SMS | Outbound | Provider API (Playmobile/Eskiz/Twilio) |
| Delivery status | Inbound | `POST /integrations/sms/delivery-status` |
| Trigger notification | Internal | Subscribe to event bus |

### 7.3 Marketplace Portal

| Hook | Direction | Method |
|------|-----------|--------|
| Product catalog sync | Outbound | Webhook on `product.*` events |
| Stock sync | Outbound | Webhook on `inventory.stock_changed` |
| Order intake | Inbound | `POST /integrations/marketplace/orders` |
| Payment callback | Inbound | `POST /integrations/payments/callback` |
| Order status | Outbound | `GET /api/v1/sales/{id}` |

### 7.4 AI Analytics Service

| Hook | Direction | Method |
|------|-----------|--------|
| Data export | Outbound | `GET /integrations/analytics/export` |
| Insight delivery | Inbound | `POST /integrations/ai/insights` |
| Model metadata | Inbound | `POST /integrations/ai/model-status` |
| Scheduled pipeline | Internal | Cron-triggered data extraction |

### 7.5 Accounting Integration

| Hook | Direction | Method |
|------|-----------|--------|
| Auto-journal trigger | Internal | Domain event listener |
| External GL export | Outbound | `GET /api/v1/accounting/export` |
| Tax authority report | Outbound | `GET /api/v1/accounting/tax-report` |

### 7.6 Payment Gateways (Uzbekistan)

| Provider | Integration Type | Callback |
|----------|-----------------|----------|
| Click | REST API + webhook | `POST /integrations/payments/callback` |
| Payme | REST API + webhook | `POST /integrations/payments/callback` |
| Uzcard | ISO 8583 gateway | `POST /integrations/payments/callback` |
| Humo | ISO 8583 gateway | `POST /integrations/payments/callback` |

---

## 8. Service Account Management

### API Key Lifecycle

| Action | Endpoint | Permission |
|--------|----------|------------|
| Create key | `POST /api/v1/integrations/api-keys` | `admin.integrations` |
| List keys | `GET /api/v1/integrations/api-keys` | `admin.integrations` |
| Rotate key | `POST /api/v1/integrations/api-keys/{id}/rotate` | `admin.integrations` |
| Revoke key | `DELETE /api/v1/integrations/api-keys/{id}` | `admin.integrations` |

### API Key Properties

| Field | Description |
|-------|-------------|
| `id` | UUID |
| `name` | Human-readable label ("Telegram Bot", "Marketplace") |
| `key_prefix` | First 8 chars of key (for identification) |
| `permissions` | Array of scoped permissions |
| `company_id` | Scoped to single company |
| `rate_limit` | Requests per minute |
| `expires_at` | Optional expiration |
| `last_used_at` | Last request timestamp |
| `created_by` | Admin user who created the key |

### Permission Scoping

Service accounts receive minimum necessary permissions:

| Integration | Permissions |
|-------------|-------------|
| Telegram bot | `sales.view`, `products.view`, `customers.view`, `inventory.view`, `dashboard.view` |
| SMS service | `customers.view`, `notifications.send` |
| Marketplace | `products.view`, `inventory.view`, `sales.create`, `customers.create` |
| AI analytics | `analytics.export` |
| Payment gateway | `payments.create`, `sales.view`, `customers.view` |

---

## 9. Integration Security

| Control | Implementation |
|---------|----------------|
| Authentication | API key or JWT required on all endpoints |
| Authorization | RBAC permissions scoped per service account |
| Company isolation | API key bound to single `company_id` |
| Payload validation | JSON Schema validation on all inbound data |
| Rate limiting | Per-key rate limits; configurable |
| Audit logging | All integration API calls logged |
| Secret rotation | API keys rotatable without downtime |
| Webhook signatures | HMAC-SHA256 on all outbound webhooks |
| IP allowlisting | Optional per integration |
| TLS | All communication over HTTPS |

---

## 10. Error Handling for Integrations

| HTTP Status | Code | Integration Action |
|-------------|------|-------------------|
| 200 | — | Success |
| 400 | `INVALID_PAYLOAD` | Fix payload; do not retry |
| 401 | `INVALID_API_KEY` | Check credentials |
| 403 | `INSUFFICIENT_PERMISSIONS` | Request additional scopes |
| 404 | `RESOURCE_NOT_FOUND` | Verify resource ID |
| 409 | `DUPLICATE` | Idempotency hit; treat as success |
| 422 | `BUSINESS_RULE_VIOLATION` | Review business rules |
| 429 | `RATE_LIMITED` | Back off and retry |
| 500 | `INTERNAL_ERROR` | Retry with exponential backoff |
| 503 | `SERVICE_UNAVAILABLE` | Retry after 30 seconds |

### Retry Policy for Integrations

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 5 seconds |
| 3 | 30 seconds |
| 4 | 5 minutes |
| 5 | 30 minutes (final) |

After 5 failures, integration marked as `degraded` in admin panel. Admin notified.

---

## 11. Integration Testing

### Test Environment

| Property | Value |
|----------|-------|
| Base URL | `https://staging.erp.example.uz/api/v1` |
| Test API key | Generated per integration in staging |
| Webhook testing | RequestBin / webhook.site for staging |
| Event bus | Same Redis pub/sub (staging instance) |

### Integration Test Checklist

- [ ] API key authentication works
- [ ] Company scoping enforced (key cannot access other company)
- [ ] Permission scoping enforced (key cannot exceed granted permissions)
- [ ] Inbound webhook payload validation rejects malformed data
- [ ] Outbound webhook delivers with valid signature
- [ ] Idempotency prevents duplicate processing
- [ ] Rate limiting returns 429 when exceeded
- [ ] Error responses follow standard format
- [ ] Audit log records all integration API calls

---

## 12. Future Integration Standards

| Standard | Timeline | Purpose |
|----------|----------|---------|
| OpenAPI 3.1 spec | Phase 2 | Auto-generated client SDKs |
| GraphQL endpoint | Phase 3 | Flexible queries for marketplace, AI |
| gRPC internal | Phase 3 | High-performance service-to-service |
| OAuth 2.0 provider | Phase 3 | Third-party app authorization |
| Webhook event catalog | Phase 2 | Discoverable event types |
| Integration marketplace | Phase 4 | Pre-built connectors for common services |

---

## 13. Related Documents

- [EXPANSION_ROADMAP.md](./EXPANSION_ROADMAP.md)
- [FUTURE_MODULES.md](./FUTURE_MODULES.md)
- [../06-api/API_DESIGN.md](../06-api/API_DESIGN.md)
- [../06-api/REST_API_REFERENCE.md](../06-api/REST_API_REFERENCE.md)
- [../06-api/WEBSOCKET_EVENTS.md](../06-api/WEBSOCKET_EVENTS.md)
- [../01-governance/MODULAR_ARCHITECTURE.md](../01-governance/MODULAR_ARCHITECTURE.md)
- [../07-security/AUTHENTICATION.md](../07-security/AUTHENTICATION.md)
