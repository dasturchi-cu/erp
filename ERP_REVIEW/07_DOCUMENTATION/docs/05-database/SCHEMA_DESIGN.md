# Schema Design

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Core Tables

### companies
```sql
CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  code          VARCHAR(50) NOT NULL UNIQUE,
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);
```

### users
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  blocked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### devices
```sql
CREATE TABLE devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  name          VARCHAR(255) NOT NULL,
  platform      VARCHAR(50) NOT NULL,
  os_version    VARCHAR(50),
  ip_address    INET,
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### sessions
```sql
CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  device_id     UUID NOT NULL REFERENCES devices(id),
  token_hash    VARCHAR(255) NOT NULL,
  ip_address    INET,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### products
```sql
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id),
  sku           VARCHAR(100) NOT NULL,
  barcode       VARCHAR(100),
  name          VARCHAR(500) NOT NULL,
  category_id   UUID REFERENCES product_categories(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ,
  UNIQUE(company_id, sku),
  UNIQUE(company_id, barcode)
);
```

### product_prices
```sql
CREATE TABLE product_prices (
  product_id         UUID PRIMARY KEY REFERENCES products(id),
  purchase_price_uzs NUMERIC(18,4) NOT NULL DEFAULT 0,
  purchase_price_usd NUMERIC(18,4) NOT NULL DEFAULT 0,
  sale_price_uzs     NUMERIC(18,4) NOT NULL DEFAULT 0,
  sale_price_usd     NUMERIC(18,4) NOT NULL DEFAULT 0,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### inventory_batches
```sql
CREATE TABLE inventory_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  product_id      UUID NOT NULL REFERENCES products(id),
  quantity        NUMERIC(18,4) NOT NULL,
  remaining_qty   NUMERIC(18,4) NOT NULL,
  unit_cost_uzs   NUMERIC(18,4) NOT NULL,
  unit_cost_usd   NUMERIC(18,4) NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### sales
```sql
CREATE TABLE sales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id),
  customer_id         UUID REFERENCES customers(id),
  cashier_id          UUID NOT NULL REFERENCES users(id),
  total_uzs           NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_usd           NUMERIC(18,4) NOT NULL DEFAULT 0,
  original_currency   VARCHAR(3) NOT NULL,
  exchange_rate_used  NUMERIC(18,4) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### sale_items
```sql
CREATE TABLE sale_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       UUID NOT NULL REFERENCES sales(id),
  product_id    UUID NOT NULL REFERENCES products(id),
  quantity      NUMERIC(18,4) NOT NULL,
  unit_price    NUMERIC(18,4) NOT NULL,
  currency      VARCHAR(3) NOT NULL,
  line_total    NUMERIC(18,4) NOT NULL
);
```

### sale_fifo_allocations
```sql
CREATE TABLE sale_fifo_allocations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_item_id    UUID NOT NULL REFERENCES sale_items(id),
  batch_id        UUID NOT NULL REFERENCES inventory_batches(id),
  quantity        NUMERIC(18,4) NOT NULL,
  unit_cost_uzs   NUMERIC(18,4) NOT NULL,
  unit_cost_usd   NUMERIC(18,4) NOT NULL
);
```

### customers
```sql
CREATE TABLE customers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL REFERENCES companies(id),
  name                    VARCHAR(255) NOT NULL,
  phone                   VARCHAR(20) NOT NULL,
  address                 TEXT,
  partnership_start_date  DATE,
  last_payment_date       TIMESTAMPTZ,
  total_debt_uzs          NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_debt_usd          NUMERIC(18,4) NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);
```

### debt_payments
```sql
CREATE TABLE debt_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  amount              NUMERIC(18,4) NOT NULL,
  currency            VARCHAR(3) NOT NULL,
  exchange_rate_used  NUMERIC(18,4) NOT NULL,
  payment_type        VARCHAR(20) NOT NULL,
  received_by         UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### exchange_rates
```sql
CREATE TABLE exchange_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  rate            NUMERIC(18,4) NOT NULL,
  effective_from  TIMESTAMPTZ NOT NULL DEFAULT now(),
  set_by          UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID REFERENCES companies(id),
  user_id       UUID REFERENCES users(id),
  action        VARCHAR(50) NOT NULL,
  entity_type   VARCHAR(100) NOT NULL,
  entity_id     UUID,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Related Documents

- [ERD_OVERVIEW.md](./ERD_OVERVIEW.md)
- [MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md)
- [INDEXING_STRATEGY.md](./INDEXING_STRATEGY.md)
