# API_REPORT

## 1. Architectural Style
- **Type**: RESTful API.
- **Protocols**: JSON over HTTPS.
- **API Base**: `/api/v1`
- **Documentation**: Swagger/OpenAPI v3 available at `/api/docs`.

## 2. Key Modules & Controllers
- **AuthController**: JWT-based token generation, refresh tokens, active session management, and device tracking.
- **ProductsController & InventoryController**: Product CRUD, category mappings, stock movements, and batch adjustments.
- **SalesController**: POS operations, cart processing, receipt template printing, and FIFO calculation trigger.
- **DebtController & FinanceController**: Customer debt history, payment logs, and daily expense recording.
- **AdminController**: Audit logs viewer, real-time health checks, queue monitoring, and SaaS backup triggers.

## 3. Middleware, Guards, and Filters
- **ValidationPipe**: Global pipe resolving Zod or Class-validator rules on input DTOs.
- **JwtAuthGuard**: Protects endpoints by verifying JWT authorization headers.
- **PermissionsGuard**: Implements fine-grained Role-Based Access Control (RBAC).
- **ThrottlerGuard**: Prevents rate-limit exhaustion and brute-force attacks.
