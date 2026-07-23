# Coding Standards

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. General Principles

- **Readability over cleverness** — code is read 10x more than written
- **Consistency** — follow existing patterns in each codebase area
- **Single Responsibility** — one reason to change per class/function
- **Explicit over implicit** — no magic, clear naming
- **Fail fast** — validate at boundaries, throw domain exceptions

---

## 2. TypeScript (Backend + Desktop)

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `sale-service.ts` |
| Classes | PascalCase | `SaleService` |
| Interfaces | PascalCase, no `I` prefix | `SaleRepository` |
| Functions | camelCase | `calculateFifoCost` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Enums | PascalCase | `SaleStatus.Completed` |

### Structure

- Max function length: 40 lines (extract if longer)
- Max file length: 300 lines (split modules)
- Use `async/await`, never raw Promise chains
- Always type function parameters and return values
- Prefer `const` over `let`; never use `var`

### Error Handling

```typescript
// Domain exceptions
throw new InsufficientStockException(productId, requested, available);

// Never swallow errors
try {
  await processSale(dto);
} catch (error) {
  logger.error('Sale processing failed', { error, saleId });
  throw error;
}
```

---

## 3. Dart (Flutter Mobile)

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Files | snake_case | `sale_service.dart` |
| Classes | PascalCase | `SaleService` |
| Variables | camelCase | `totalAmount` |
| Constants | lowerCamelCase | `defaultPageSize` |

### Structure

- Use `freezed` for immutable data models
- Use `riverpod` for state management
- Widget files: one public widget per file
- Extract widgets when build method exceeds 80 lines

---

## 4. Database

- Table names: `snake_case`, plural (`sales`, `sale_items`)
- Column names: `snake_case`
- Primary keys: `id UUID DEFAULT gen_random_uuid()`
- Foreign keys: `{table_singular}_id`
- Timestamps: `created_at`, `updated_at` (TIMESTAMPTZ)
- Soft delete: `deleted_at TIMESTAMPTZ NULL`
- Every tenant table: `company_id UUID NOT NULL`

---

## 5. API Design

- RESTful resource naming, plural nouns
- HTTP verbs: GET (read), POST (create), PUT (full update), PATCH (partial), DELETE
- Status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500
- Pagination: `?page=1&limit=20`
- Sorting: `?sort=created_at:desc`
- Filtering: `?status=active&category_id=uuid`

---

## 6. Git Conventions

### Branch Naming

```
feature/{module}-{description}
bugfix/{ticket}-{description}
release/{version}
```

### Commit Messages

```
type(scope): description

feat(sales): add partial payment support
fix(fifo): correct batch allocation order
docs(api): update WebSocket event catalog
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

---

## 7. Security Rules

- Never log passwords, tokens, or PII
- Never commit `.env` files
- All user input validated at API boundary
- SQL: parameterized queries only
- XSS: sanitize all rendered user content

---

## 8. Testing Standards

- Test file co-located: `sale.service.spec.ts`
- Arrange-Act-Assert pattern
- Descriptive test names: `should allocate oldest batch first when selling product`
- Mock external dependencies, not domain logic
- Minimum 80% coverage on domain/application layers

---

## 9. Documentation in Code

- Public APIs: JSDoc/dartdoc with @param and @returns
- Complex business logic: inline comment explaining **why**, not **what**
- No commented-out code in commits

---

## 10. Related Documents

- [MODULAR_ARCHITECTURE.md](./MODULAR_ARCHITECTURE.md)
- [DEVELOPMENT_LIFECYCLE.md](./DEVELOPMENT_LIFECYCLE.md)
- [../06-api/API_STANDARDS.md](../06-api/API_STANDARDS.md)
