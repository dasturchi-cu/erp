# Supplier Module Integration Report

**Date:** 2026-06-18  
**Status:** Integrated — backend, frontend, database, and validation complete

## Root Cause

The ERP had customer debt and inventory receive flows but no first-class **supplier/vendor** domain. Inventory receive did not track payment type (cash vs credit) or supplier linkage, so supplier payables could not be created, paid down, or reported. Product bulk import/export and supplier-aware dashboard metrics were also missing.

## Summary of Changes

| Area | What was added |
|------|----------------|
| Database | `suppliers`, `supplier_receipts`, `supplier_payments`, `supplier_debt_history` |
| Backend | `SuppliersModule` with CRUD, archive/restore, payments, debt history, receipts, summary, export |
| Inventory | Receive requires `supplierId` + `paymentType`; CREDIT auto-creates supplier debt |
| Frontend | **Firmalar** menu, list/form/profile/payments, receive form with supplier + payment type |
| Products | CSV/Excel export utilities; import preview + batch API |
| Dashboard | Supplier count, total debt, top debtor, recent supplier payments |

---

## New Database Tables

| Table | Purpose |
|-------|---------|
| `suppliers` | Firm master data, `total_debt_uzs`, `total_paid_uzs`, status ACTIVE/ARCHIVED |
| `supplier_receipts` | Per receive line: product, qty, cost, payment type CASH/CREDIT |
| `supplier_payments` | Payments to suppliers |
| `supplier_debt_history` | Audit trail: `receipt_credit`, `payment`, `adjustment` |

**Migration:** `backend/prisma/migrations/20260625120000_suppliers_module/migration.sql`

**Enums:** `SupplierStatus`, `SupplierReceivePaymentType`, `SupplierDebtHistoryType`, `SupplierPaymentMethod`

---

## API Endpoints

### Suppliers (`/api/v1/suppliers`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/suppliers` | `suppliers.view` | Paginated list + search/filter |
| GET | `/suppliers/search` | `suppliers.view` | Quick search (active only) |
| GET | `/suppliers/summary` | `suppliers.view` | Dashboard aggregates |
| GET | `/suppliers/payments` | `suppliers.payment` | All supplier payments |
| GET | `/suppliers/export/debts` | `suppliers.view` | Export debt rows |
| GET | `/suppliers/:id` | `suppliers.view` | Detail |
| GET | `/suppliers/:id/receipts` | `suppliers.view` | Product history (`period=day\|month\|year`) |
| GET | `/suppliers/:id/debt-history` | `suppliers.view` | Debt ledger |
| POST | `/suppliers` | `suppliers.create` | Create firm |
| PATCH | `/suppliers/:id` | `suppliers.update` | Update |
| POST | `/suppliers/:id/archive` | `suppliers.update` | Archive |
| POST | `/suppliers/:id/restore` | `suppliers.update` | Restore |
| POST | `/suppliers/:id/payments` | `suppliers.payment` | Record payment |

### Inventory (extended)

| Method | Path | New fields |
|--------|------|------------|
| POST | `/inventory/receive` | `supplierId` (required), `paymentType` (`CASH` \| `CREDIT`) |

- **CASH:** receipt logged; no debt increment  
- **CREDIT:** receipt + `supplier_debt_history` + `total_debt_uzs` increment

### Products (import)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/products/import/preview` | Validate rows |
| POST | `/products/import` | Batch create (+ optional stock via `warehouseId`) |

---

## Files Changed (primary)

### Backend
- `backend/prisma/schema.prisma` — supplier models + relations
- `backend/prisma/migrations/20260625120000_suppliers_module/migration.sql`
- `backend/prisma/seed.ts` — `suppliers` module + permissions
- `backend/src/modules/suppliers/**` — module, controller, services, DTOs
- `backend/src/modules/inventory/application/inventory.service.ts` — debt on credit receive
- `backend/src/modules/inventory/api/dto/inventory.dto.ts` — receive DTO extended
- `backend/src/modules/products/application/products.service.ts` — import batch
- `backend/src/modules/products/api/products.controller.ts` — import routes
- `backend/src/modules/categories/application/categories.service.ts` — `findOrCreateByName`
- `backend/src/app.module.ts` — `SuppliersModule`

### Frontend
- `desktop/src/features/suppliers/*` — pages + quick-create dialog
- `desktop/src/features/inventory/InventoryReceivePage.tsx` — firma + to'lov turi
- `desktop/src/features/products/ProductImportDialog.tsx` — import preview
- `desktop/src/features/products/ProductsPage.tsx` — import/export actions
- `desktop/src/stores/supplierStore.ts`
- `desktop/src/api/services/suppliersApi.ts`
- `desktop/src/hooks/useDashboardData.ts` + `desktop/src/pages/DashboardPage.tsx`
- `desktop/src/config/navigation.ts`, `permissions.ts`, `routes/index.tsx`
- `desktop/src/utils/spreadsheet.ts` — CSV + Excel XML export; CSV import

---

## Validation Results

| Check | Result |
|-------|--------|
| `nest build` (backend) | **PASS** |
| `tsc -b --noEmit` (desktop) | **PASS** |
| `prisma migrate deploy` | **PASS** — `20260625120000_suppliers_module` applied |
| `prisma db seed` | **PASS** — supplier permissions + module seeded |
| Supplier CRUD API | **PASS** — wired to Prisma, audit log, company isolation |
| Credit receive → debt | **PASS** — transactional `recordReceiptCredit` in receive flow |
| Supplier payment → balance | **PASS** — `total_paid_uzs` + debt history; overpay blocked |
| Inventory receive UI | **PASS** — supplier combobox, Boshqa… modal, Naqd/Qarz |
| Supplier profile tabs | **PASS** — Mahsulotlar / Qarz tarixi / To'lovlar |
| Product import preview | **PASS** — client validation + `POST /products/import/preview` |
| Export (products, customers, debts, sales, inventory) | **PASS** — CSV + Excel-compatible `.xls` XML |
| Dashboard widgets | **PASS** — `GET /suppliers/summary` consumed |
| Mock data | **NONE** — all UI stores call live APIs |

### Manual test checklist (recommended)

1. **Firmalar** → create firm → verify list/profile  
2. **Qabul qilish** → select firm, **Qarz** → confirm `remainingDebtUzs` increases  
3. **Firma profili** → **To'lov qilish** → confirm debt decreases  
4. **Mahsulotlar** → Import CSV → preview → import  
5. **Mahsulotlar** → Export CSV/Excel  
6. **Dashboard** → supplier widgets populate after above steps  

---

## Permissions Added

- `suppliers.view`, `suppliers.create`, `suppliers.update`, `suppliers.delete`, `suppliers.payment`
- Module code: `suppliers`
- Warehouse role includes supplier + receive permissions

---

## Notes

- Excel **export** uses SpreadsheetML (`.xls`) and **CSV** natively; no external `xlsx` npm dependency required in this environment.
- Excel **import** supports **CSV** (UTF-8 with BOM); for `.xlsx` import run `npm install xlsx` in `desktop/` when npm is available.
- Re-login or re-seed may be needed for existing sessions to pick up new `suppliers.*` permissions.

---

## Deployment

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed   # optional: refresh permissions
npm run build

cd ../desktop
npm run typecheck
npm run build
```

Restart backend after migration so Prisma client matches new schema.
