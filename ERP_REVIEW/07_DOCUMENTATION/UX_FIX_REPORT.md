# UX Fix Report — Production Polish

**Date:** 2026-06-18  
**Scope:** UX va biznes jarayonlar (yangi modul yo'q)  
**Build:** `backend nest build` ✅ | `desktop tsc -b --noEmit` ✅ | `desktop vite build` ✅

---

## 1. Mahsulot qo'shish — valyuta, narxlar, konvertatsiya

### Root cause
`ProductFormPage.tsx` faqat bitta `priceUzs` (sotuv) maydoniga ega edi. Olish narxi `salePrice * 0.72` formulasi bilan avtomatik hisoblanardi — bu noto'g'ri biznes jarayon va valyuta tanlovi yo'q edi.

### Fix
- UZS/USD valyuta tanlovi qo'shildi
- Alohida **olish narxi** va **sotish narxi** maydonlari
- Faol kurs bo'yicha avtomatik UZS↔USD konvertatsiya (preview blok)
- API ga to'g'ri `purchasePriceUzs` / `salePriceUzs` yuboriladi
- `Product` tipi va `mapProduct` ga `purchasePriceUzs` / `purchasePriceUsd` qo'shildi

### Changed files
- `desktop/src/features/products/ProductFormPage.tsx`
- `desktop/src/types/entities.ts`
- `desktop/src/api/mappers.ts`
- `desktop/src/features/products/ProductFormDialog.tsx` (tip mosligi)

### Verification
- Typecheck PASS
- Form: valyuta almashtirganda konvertatsiya ko'rinadi
- Saqlashda backend `purchasePriceUzs` + `salePriceUzs` qabul qiladi

---

## 2. Mijoz qo'shish — F.I.O, telefon, izoh

### Root cause
`CustomerFormPage.tsx` da keraksiz **email** va **manzil** maydonlari bor edi; **izoh** maydoni yo'q edi. Telefon E.164 formatida yuborilmasligi API xatolikka olib kelishi mumkin edi.

### Fix
- Email va manzil olib tashlandi
- Faqat: F.I.O, telefon, izoh
- `normalizePhoneUz()` — `+998XXXXXXXXX` formatiga keltiradi
- `Customer` tipi, mapper va API yangilandi (`notes` qo'llab-quvvatlanadi)

### Changed files
- `desktop/src/features/customers/CustomerFormPage.tsx`
- `desktop/src/utils/phone.ts` (yangi)
- `desktop/src/stores/customerStore.ts`
- `desktop/src/api/services/domainApi.ts`
- `desktop/src/types/entities.ts`
- `desktop/src/api/mappers.ts`

### Verification
- Typecheck PASS
- Form 3 ta maydon: F.I.O, telefon, izoh
- Telefon `901234567` → `+998901234567` konvertatsiyasi

---

## 3. POS — Naqd / Nasiya / Aralash

### Root cause
- **Nasiya:** `amountPaidUzs` noto'g'ri yuborilishi mumkin edi (backend `0` kutadi)
- **Aralash:** naqd + nasiya summasi tekshirilmagan; tasdiqlash noto'g'ri holatda ham ishlaydi
- **Naqd:** yetarli to'lov validatsiyasi yo'q edi

### Fix
- `PaymentDialog`: har uchala tur uchun validatsiya (naqd ≥ jami, aralash: 0 < naqd < jami, naqd+nasiya=jami)
- Nasiya qismi avtomatik hisoblanadi (`jami - naqd`)
- Tasdiqlash tugmasi xato holatda o'chiriladi
- `SalesPosPage`: CREDIT → `amountPaidUzs: 0`; MIXED → faqat naqd qismi; mijoz majburiyati

### Changed files
- `desktop/src/features/sales/components/PaymentDialog.tsx`
- `desktop/src/features/sales/SalesPosPage.tsx`

### Verification
- Typecheck PASS
- Backend `validateSalePaymentAmounts()` bilan mos: CASH ≥ total, MIXED paid < total, CREDIT customerId talab qilinadi

---

## 4. Mahsulotlar — ERP jadval ko'rinishi

### Root cause
Ro'yxat client-side store dan yuklanardi (limit 100), server pagination/filter/sort to'liq ishlatilmas edi. Olish narxi ustuni yo'q edi.

### Fix
- Server-side **DataTable**: qidiruv, holat filter, zaxira filter (`in_stock`/`low`/`out`)
- Server pagination (`page`, `limit`, `meta.total`)
- Server sort (`name`, `sku`, `salePriceUzs`)
- Ustunlar: SKU, nom, kategoriya, olish narxi, sotish narxi (UZS/USD), qoldiq, holat
- `productsApi.listPaginated()` qo'shildi

### Changed files
- `desktop/src/features/products/ProductsPage.tsx`
- `desktop/src/api/services/catalogApi.ts`

### Verification
- Typecheck PASS
- Jadval ko'rinishi (card emas)
- API `GET /products?page&limit&q&sort&status&stockLevel` chaqiriladi

---

## 5. Dashboard — real API ma'lumotlari

### Root cause
`DashboardPage.tsx` to'liq `mockDashboardData` dan foydalanardi — hech qanday API chaqiruv yo'q edi.

### Fix
- `useDashboardData` hook yaratildi — real API dan agregatsiya:
  - `GET /sales` (davr bo'yicha)
  - `GET /debt/summary`
  - `GET /debt-payments`
  - `GET /debt/aging` (muddati o'tgan qarz)
  - `GET /products` (inventar qiymati)
  - Faol valyuta kursi (`currencyStore`)
- `mockDashboardData` import olib tashlandi
- Refresh tugmasi haqiqiy qayta yuklashni chaqiradi

### Changed files
- `desktop/src/hooks/useDashboardData.ts` (yangi)
- `desktop/src/pages/DashboardPage.tsx`

### Verification
- Typecheck PASS
- Vite build PASS
- Dashboard mock emas — API dan yuklanadi (loading holati ko'rsatiladi)

---

## Build natijasi

| Komponent | Buyruq | Natija |
|-----------|--------|--------|
| Backend | `nest build` | ✅ PASS |
| Desktop | `tsc -b --noEmit` | ✅ PASS |
| Desktop | `vite build` | ✅ PASS |
