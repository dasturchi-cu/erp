# Nginx Reverse Proxy

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

**Nginx** serves as the edge reverse proxy for the ERP platform, handling SSL termination, request routing, rate limiting, WebSocket proxying, and static asset delivery. All external traffic enters through Nginx on ports 80 (HTTP redirect) and 443 (HTTPS).

---

## 2. Responsibilities

| Function | Description |
|----------|-------------|
| SSL termination | Decrypt HTTPS; forward plain HTTP to upstream |
| Reverse proxy | Route `/api/*` and `/ws` to API server |
| WebSocket upgrade | Proxy WSS connections with proper headers |
| Rate limiting | Protect against abuse and DDoS |
| Security headers | HSTS, CSP, X-Frame-Options, etc. |
| Gzip compression | Compress JSON responses |
| Health endpoint | Pass-through `/health` for load balancer checks |
| Static assets | Serve client update packages (Electron auto-update) |
| Access logging | Request logs for audit and debugging |

---

## 3. Request Routing

```
Client Request
      │
      ▼
┌─────────────┐
│   Nginx     │
│   :443      │
└──────┬──────┘
       │
       ├── GET  /health          → api:3000/health
       ├── GET  /api/v1/*        → api:3000/api/v1/*
       ├── POST /api/v1/*        → api:3000/api/v1/*
       ├── WS   /ws              → api:3000/ws (upgrade)
       ├── GET  /updates/*        → static files (Electron)
       ├── GET  /grafana/*        → grafana:3001 (auth protected)
       └── *                      → 404
```

---

## 4. Server Block Configuration

### HTTP → HTTPS Redirect

All port 80 traffic permanently redirects to HTTPS.

| Setting | Value |
|---------|-------|
| Listen | 80 |
| Server name | `erp.example.uz` |
| Action | `301` redirect to `https://$host$request_uri` |
| ACME exception | `/.well-known/acme-challenge/` served for Certbot |

### HTTPS Server Block

| Setting | Value |
|---------|-------|
| Listen | 443 ssl http2 |
| Server name | `erp.example.uz` |
| SSL certificate | `/etc/letsencrypt/live/erp.example.uz/fullchain.pem` |
| SSL key | `/etc/letsencrypt/live/erp.example.uz/privkey.pem` |
| SSL protocols | TLSv1.2, TLSv1.3 |
| SSL ciphers | Mozilla Intermediate configuration |

---

## 5. API Proxy Configuration

### Standard REST Proxy

| Directive | Value | Purpose |
|-----------|-------|---------|
| `proxy_pass` | `http://api:3000` | Upstream API server |
| `proxy_set_header Host` | `$host` | Preserve original host |
| `proxy_set_header X-Real-IP` | `$remote_addr` | Client IP for rate limiting |
| `proxy_set_header X-Forwarded-For` | `$proxy_add_x_forwarded_for` | Proxy chain |
| `proxy_set_header X-Forwarded-Proto` | `$scheme` | Original protocol |
| `proxy_connect_timeout` | `10s` | Upstream connection timeout |
| `proxy_read_timeout` | `60s` | Response timeout (REST) |
| `client_max_body_size` | `10m` | Max upload size |

### Location: `/api/`

- Proxy all methods (GET, POST, PUT, PATCH, DELETE).
- Buffer responses for logging.
- Pass through `Authorization` header.

---

## 6. WebSocket Proxy Configuration

WebSocket connections require HTTP/1.1 upgrade headers. This is critical for Socket.io real-time functionality.

### Location: `/ws`

| Directive | Value | Purpose |
|-----------|-------|---------|
| `proxy_http_version` | `1.1` | Required for WebSocket |
| `proxy_set_header Upgrade` | `$http_upgrade` | WebSocket upgrade |
| `proxy_set_header Connection` | `"upgrade"` | WebSocket upgrade |
| `proxy_pass` | `http://api:3000/ws` | Socket.io endpoint |
| `proxy_read_timeout` | `3600s` | Long-lived connections (1 hour) |
| `proxy_send_timeout` | `3600s` | Prevent premature disconnect |
| `proxy_buffering` | `off` | Real-time streaming |

### WebSocket-Specific Considerations

| Concern | Solution |
|---------|----------|
| Connection drops | 3600s timeout; client auto-reconnect |
| Sticky sessions | `ip_hash` upstream when multiple API nodes |
| Large messages | `proxy_buffer_size 128k` |
| CORS for WS | Handled by API server, not Nginx |
| Health check interference | `/health` uses separate location block |

### Multi-Node Upstream (Scaled)

When running multiple API replicas:

| Setting | Value |
|---------|-------|
| Upstream method | `ip_hash` (sticky sessions) |
| Upstream servers | `api-1:3000`, `api-2:3000`, `api-3:3000` |
| Health check | Passive (mark down after 3 failures) |
| Failover | Automatic to healthy nodes |

---

## 7. Rate Limiting

### Zone Definitions

| Zone | Rate | Key | Applies To |
|------|------|-----|------------|
| `api_general` | 30 req/s | `$binary_remote_addr` | `/api/v1/*` |
| `api_auth` | 5 req/m | `$binary_remote_addr` | `/api/v1/auth/login` |
| `ws_connect` | 10 req/m | `$binary_remote_addr` | `/ws` |
| `conn_limit` | 50 connections | `$binary_remote_addr` | All locations |

### Burst Configuration

| Zone | Burst | Behavior |
|------|-------|----------|
| `api_general` | 50 | `nodelay` (process immediately up to burst) |
| `api_auth` | 3 | Delay excess (prevent brute force) |

Exceeded limits return `429 Too Many Requests` with `Retry-After` header.

---

## 8. Security Headers

Applied to all HTTPS responses:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | `default-src 'self'; connect-src 'self' wss:` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

## 9. Gzip Compression

| Setting | Value |
|---------|-------|
| `gzip` | `on` |
| `gzip_types` | `application/json`, `application/javascript`, `text/css`, `text/plain` |
| `gzip_min_length` | `1000` |
| `gzip_comp_level` | `4` |

WebSocket frames are not compressed by Nginx (handled by Socket.io protocol).

---

## 10. Monitoring and Grafana Proxy

### Location: `/grafana/`

| Setting | Value |
|---------|-------|
| Auth | Basic auth or IP allowlist |
| Proxy | `grafana:3001` |
| Access | Admin/DevOps only; not public |

### Location: `/prometheus/`

| Setting | Value |
|---------|-------|
| Auth | Basic auth or IP allowlist |
| Proxy | `prometheus:9090` |
| Access | Admin/DevOps only |

---

## 11. Static File Serving

### Electron Auto-Update

| Location | Path | Purpose |
|----------|------|---------|
| `/updates/` | `/var/www/erp-updates/` | Electron update packages |
| Cache | `max-age=3600` | Update manifest freshness |

### Access Log Format

```
$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent
"$http_referer" "$http_user_agent" rt=$request_time uct=$upstream_connect_time
```

---

## 12. SSL Configuration

Detailed certificate management in [SSL_HTTPS.md](./SSL_HTTPS.md).

| Setting | Value |
|---------|-------|
| Certificate provider | Let's Encrypt |
| Renewal | Certbot auto-renewal (cron daily) |
| OCSP stapling | Enabled |
| Session cache | `shared:SSL:10m` |
| Session timeout | `1d` |

---

## 13. Logging

| Log | Path | Rotation |
|-----|------|----------|
| Access log | `/var/log/nginx/erp-access.log` | Daily, 30-day retention |
| Error log | `/var/log/nginx/erp-error.log` | Daily, 30-day retention |

Sensitive paths (`/api/v1/auth/login`) log request metadata but never request bodies.

---

## 14. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 502 Bad Gateway | API container down | `docker compose restart api` |
| WebSocket disconnects every 60s | `proxy_read_timeout` too low | Increase to 3600s |
| 429 on normal usage | Rate limit too aggressive | Adjust zone rates |
| SSL certificate error | Expired cert | `certbot renew` |
| CORS errors | API CORS config, not Nginx | Check API `CORS_ORIGIN` |
| Slow API responses | Nginx buffering | Set `proxy_buffering off` for streaming |

---

## 15. Related Documents

- [SSL_HTTPS.md](./SSL_HTTPS.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [DOCKER.md](./DOCKER.md)
- [../09-realtime/WEBSOCKET_ARCHITECTURE.md](../09-realtime/WEBSOCKET_ARCHITECTURE.md)
- [SCALABILITY.md](./SCALABILITY.md)
