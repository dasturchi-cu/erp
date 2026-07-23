# SSL and HTTPS

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

All ERP platform traffic is encrypted using **TLS 1.2+** via **Let's Encrypt** certificates managed by **Certbot**. HTTPS is mandatory for all client connections including REST API, WebSocket (WSS), and static asset delivery.

**Policy**: HTTP requests are permanently redirected to HTTPS. No unencrypted business data transmission is permitted.

---

## 2. Certificate Strategy

| Property | Value |
|----------|-------|
| Certificate Authority | Let's Encrypt (free, automated) |
| Certificate type | Domain Validated (DV) |
| Key algorithm | RSA 2048 or ECDSA P-256 |
| Validity period | 90 days (Let's Encrypt standard) |
| Renewal | Automatic, 30 days before expiry |
| Coverage | `erp.example.uz`, `staging.erp.example.uz` |
| Wildcard | Not required (separate certs per subdomain) |

---

## 3. Certificate Provisioning

### Initial Certificate (First Deployment)

Prerequisites:
- Domain DNS A record pointing to server IP
- Port 80 accessible (for ACME HTTP-01 challenge)
- Nginx configured with ACME challenge location

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate (interactive)
sudo certbot certonly --nginx -d erp.example.uz

# Or non-interactive (for automation)
sudo certbot certonly --nginx \
  -d erp.example.uz \
  --non-interactive \
  --agree-tos \
  --email admin@example.uz
```

Certificate files installed at:
- `/etc/letsencrypt/live/erp.example.uz/fullchain.pem`
- `/etc/letsencrypt/live/erp.example.uz/privkey.pem`
- `/etc/letsencrypt/live/erp.example.uz/chain.pem`

### Docker Volume Mapping

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `/etc/letsencrypt/` | `/etc/letsencrypt/` | Certificate files (read-only) |
| `/var/www/certbot/` | `/var/www/certbot/` | ACME challenge webroot |

---

## 4. Nginx SSL Configuration

### SSL Directives

| Directive | Value | Rationale |
|-----------|-------|-----------|
| `ssl_certificate` | `fullchain.pem` | Server certificate + intermediate |
| `ssl_certificate_key` | `privkey.pem` | Private key |
| `ssl_protocols` | `TLSv1.2 TLSv1.3` | Disable insecure protocols |
| `ssl_ciphers` | Mozilla Intermediate suite | Balance security and compatibility |
| `ssl_prefer_server_ciphers` | `off` | Let client choose (TLS 1.3 best practice) |
| `ssl_session_cache` | `shared:SSL:10m` | Reduce handshake overhead |
| `ssl_session_timeout` | `1d` | Session reuse period |
| `ssl_stapling` | `on` | OCSP stapling for faster validation |
| `ssl_stapling_verify` | `on` | Verify OCSP response |

### Security Headers (HTTPS Only)

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

### HTTP → HTTPS Redirect

```nginx
server {
    listen 80;
    server_name erp.example.uz;

    # ACME challenge (Certbot)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}
```

---

## 5. Automatic Renewal

### Certbot Renewal Timer

Certbot installs a systemd timer (or cron job) that runs twice daily:

```bash
# Verify timer is active
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

### Renewal Process

1. Certbot checks all certificates for expiry within 30 days.
2. Performs ACME HTTP-01 challenge via Nginx.
3. Obtains new certificate.
4. Deploys hook reloads Nginx: `systemctl reload nginx` or `docker compose exec nginx nginx -s reload`.
5. Zero downtime (Nginx graceful reload).

### Post-Renewal Hook

```bash
#!/bin/bash
# /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
docker compose -f /opt/erp/docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 6. Certificate Monitoring

### Automated Alerts

| Check | Tool | Alert Threshold |
|-------|------|-----------------|
| Certificate expiry | Prometheus `ssl_cert_not_after` | < 14 days |
| Certificate expiry | External uptime monitor | < 7 days |
| TLS version support | SSL Labs scan (quarterly) | Below A rating |
| HSTS header presence | Monitoring probe | Missing |

### Manual Verification

```bash
# Check certificate details
openssl s_client -connect erp.example.uz:443 -servername erp.example.uz </dev/null 2>/dev/null | openssl x509 -noout -dates

# Check certificate chain
curl -vI https://erp.example.uz 2>&1 | grep -A5 "Server certificate"

# SSL Labs test (external)
# https://www.ssllabs.com/ssltest/analyze.html?d=erp.example.uz
```

---

## 7. WebSocket SSL (WSS)

WebSocket connections use the same SSL certificate as HTTPS.

| Property | Value |
|----------|-------|
| Protocol | `wss://` (WebSocket Secure) |
| Endpoint | `wss://erp.example.uz/ws` |
| Certificate | Same as HTTPS (shared) |
| Client validation | Standard TLS certificate verification |

Socket.io clients connect via WSS automatically when the page/API URL uses HTTPS.

### WebSocket SSL Considerations

| Concern | Solution |
|---------|----------|
| Long-lived connections | Nginx `proxy_read_timeout: 3600s` |
| Certificate renewal during active WS | Nginx graceful reload preserves connections |
| Mixed content | All clients must use HTTPS/WSS; no HTTP fallback |

---

## 8. Multi-Environment Certificates

| Environment | Domain | Certificate | Renewal |
|-------------|--------|-------------|---------|
| Production | `erp.example.uz` | Let's Encrypt | Auto |
| Staging | `staging.erp.example.uz` | Let's Encrypt | Auto |
| Development | `localhost` | Self-signed (optional) | Manual |

### Staging Certificate

Obtained separately with the same Certbot process:

```bash
sudo certbot certonly --nginx -d staging.erp.example.uz
```

### Development Self-Signed (Optional)

```bash
openssl req -x509 -newkey rsa:2048 \
  -keyout dev-key.pem -out dev-cert.pem \
  -days 365 -nodes \
  -subj "/CN=localhost"
```

Development clients must disable certificate verification or trust the self-signed CA.

---

## 9. Certificate Backup

| Item | Backed Up? | Location |
|------|-----------|----------|
| Certificate files | Yes (automatic) | Let's Encrypt renewal handles |
| Private key | Yes (on server) | `/etc/letsencrypt/live/` |
| Certbot config | Yes | `/etc/letsencrypt/renewal/` |
| Account key | Yes | `/etc/letsencrypt/accounts/` |

If server is lost, certificates can be re-obtained from Let's Encrypt (no manual backup of certs required, but account key backup speeds recovery).

---

## 10. Troubleshooting

| Issue | Diagnosis | Resolution |
|-------|-----------|------------|
| Certificate expired | `certbot certificates` | `certbot renew --force-renewal` |
| ACME challenge fails | Port 80 blocked or DNS wrong | Verify DNS A record; check UFW |
| Nginx won't start after renewal | Config syntax error | `nginx -t`; check cert paths |
| Mixed content warnings | Client loading HTTP resources | Ensure all URLs use HTTPS |
| WSS connection fails | Certificate mismatch or expired | Check cert covers domain |
| Rate limit (Let's Encrypt) | Too many issuance attempts | Wait 1 hour; use staging CA for testing |
| HSTS preload rejection | Missing includeSubDomains | Update HSTS header |

### Let's Encrypt Rate Limits

| Limit | Value |
|-------|-------|
| Certificates per domain per week | 50 |
| Duplicate certificates per week | 5 |
| Failed validations per hour | 5 |
| Accounts per IP per 3 hours | 10 |

Use Let's Encrypt staging environment for testing to avoid rate limits.

---

## 11. Security Best Practices

| Practice | Status |
|----------|--------|
| TLS 1.0/1.1 disabled | Enforced |
| Strong cipher suites only | Mozilla Intermediate |
| HSTS enabled with preload | Enforced |
| OCSP stapling | Enabled |
| Certificate transparency | Automatic (Let's Encrypt) |
| Private key permissions | `600` (root only) |
| No self-signed in production | Enforced |
| Regular SSL Labs audit | Quarterly |

---

## 12. Related Documents

- [NGINX.md](./NGINX.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
- [MONITORING.md](./MONITORING.md)
- [../07-security/ENCRYPTION_STANDARDS.md](../07-security/ENCRYPTION_STANDARDS.md)
