# Modular Architecture

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Design Philosophy

The ERP is built as a **modular monolith** — a single deployable unit with clearly bounded internal modules. This balances:

- **Simplicity**: One deployment, one database, shared transactions
- **Extensibility**: New modules plug in without rewriting core
- **Admin Control**: Modules can be enabled/disabled at runtime
- **Future Decomposition**: Modules can be extracted to microservices if needed

---

## 2. Module Registry

```typescript
interface ModuleDefinition {
  id: string;                    // e.g., 'sales'
  name: string;                  // Display name
  version: string;
  dependencies: string[];        // Required modules
  permissions: Permission[];       // Permissions this module registers
  routes: RouteDefinition[];       // API routes
  menuItems: MenuItem[];          // Navigation entries
  events: EventDefinition[];      // Published domain events
  enabled: boolean;               // Global enable flag
}
```

### Registered Modules (Phase 1)

| Module ID | Name | Dependencies |
|-----------|------|--------------|
| `core` | Core Platform | — |
| `auth` | Authentication | core |
| `admin` | Administration | auth |
| `company` | Multi-Company | auth |
| `products` | Products | company |
| `inventory` | Inventory | products |
| `fifo` | FIFO Engine | inventory |
| `currency` | Currency (UZS/USD) | core |
| `sales` | Sales | products, inventory, fifo, currency, customers |
| `customers` | Customers | company |
| `debt` | Debt Management | customers, sales, currency |
| `dashboard` | Dashboard | sales, debt, inventory |
| `reports` | Reports | sales, debt, inventory |
| `notifications` | Notifications | core |
| `audit` | Audit Logs | core |

---

## 3. Module Internal Structure

Each module follows **Clean Architecture** layers:

```
src/modules/{module-name}/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/          # Interfaces
│   └── events/
├── application/
│   ├── use-cases/
│   ├── services/
│   └── dto/
├── infrastructure/
│   ├── repositories/          # Implementations
│   └── mappers/
├── api/
│   ├── controllers/
│   ├── guards/
│   └── validators/
├── {module-name}.module.ts    # NestJS module definition
└── index.ts                   # Public API exports
```

### Layer Rules

1. **Domain** has zero external dependencies
2. **Application** depends only on domain
3. **Infrastructure** implements domain interfaces
4. **API** is the transport layer — no business logic
5. Modules communicate via **domain events**, not direct imports (except declared dependencies)

---

## 4. Module Enable/Disable Flow

```
Admin disables 'sales' module
    → module_registry.updated event
    → API: all /sales/* routes return 403 MODULE_DISABLED
    → WebSocket: broadcast module.disabled { moduleId: 'sales' }
    → All clients: remove Sales from navigation
    → In-progress sales: complete gracefully (configurable timeout)
```

### Per-Company Module Override

```
Global: sales = enabled
Company "Market": sales = disabled (override)

Resolution: company override > global setting
```

---

## 5. Inter-Module Communication

### 5.1 Domain Events (Preferred)

```typescript
// inventory module publishes
inventory.batch_depleted { batchId, productId, companyId }

// fifo module subscribes
→ recalculate available batches

// sales module subscribes
→ update stock display
```

### 5.2 Shared Kernel

The `core` module provides:
- Base entity (`id`, `companyId`, `createdAt`, `updatedAt`)
- Domain event bus
- Unit of work / transaction manager
- Common value objects (Money, Currency, Quantity)

### 5.3 Anti-Patterns (Forbidden)

- Direct database access across module boundaries
- Circular module dependencies
- Business logic in controllers
- Shared mutable state between modules

---

## 6. Permission Registration

Each module registers permissions at startup:

```typescript
// sales module
permissions: [
  'sales.view',
  'sales.create',
  'sales.cancel',
  'sales.return',
  'sales.discount',      // optional elevated permission
  'sales.view_all',      // see all cashiers' sales
]
```

Permissions are stored in DB and assigned to roles via admin panel.

---

## 7. API Route Namespacing

```
/api/v1/{module}/{resource}

Examples:
  /api/v1/products
  /api/v1/inventory/batches
  /api/v1/sales
  /api/v1/customers/{id}/debts
  /api/v1/admin/users
  /api/v1/admin/modules
```

---

## 8. Client Module Mapping

Desktop and mobile clients mirror server modules:

```
client/modules/
  sales/
    pages/
    components/
    hooks/
    api/
    store/
```

Client modules lazy-load based on enabled module list from `/api/v1/auth/me`.

---

## 9. Database Schema Namespacing

Tables prefixed by module domain:

```
products
product_categories
inventory_batches
inventory_movements
sales
sale_items
sale_fifo_allocations
customers
customer_debts
debt_payments
currency_rates
audit_logs
...
```

All tenant-scoped tables include `company_id UUID NOT NULL`.

---

## 10. Testing Strategy per Module

| Layer | Test Type |
|-------|-----------|
| Domain | Unit tests (pure logic) |
| Application | Integration tests with mocked repos |
| Infrastructure | Integration tests with test DB |
| API | E2E tests per module |
| Cross-module | Event flow integration tests |

---

## 11. Future Module Addition Checklist

1. Create module package with standard structure
2. Register in module registry
3. Define permissions and menu items
4. Create database migrations
5. Add API routes with guards
6. Publish domain events
7. Add WebSocket event mappings
8. Create client module (desktop + mobile)
9. Write module documentation
10. Add to admin module management UI

---

## 12. Related Documents

- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)
- [../08-modules/MODULE_MANAGEMENT.md](../08-modules/MODULE_MANAGEMENT.md)
- [../03-product/MODULE_CATALOG.md](../03-product/MODULE_CATALOG.md)
- [CODING_STANDARDS.md](./CODING_STANDARDS.md)
