# ERP chuqur audit — 2026-10-19

**Qanday tekshirildi:**
- Backend lokal ishga tushirildi (Docker Postgres + Redis, migratsiyalar, seed).
- `live-staging.mjs` yuritildi: **23/24 PASS**. L-04 yiqildi, chunki skript eskirgan: endi `supplierId` va `paymentType` majburiy, ilovalar ularni yuboradi.
- Alohida probe skriptlar bilan real API'da xatolar qayta hosil qilindi.
- Backend, desktop va mobil kodi to'liq o'qib chiqildi (3 ta parallel audit).
- Typecheck: backend ✅, desktop ✅, `flutter analyze` ✅ (faqat info darajasidagi ogohlantirishlar).

**Belgilar:**
- ✅ **LIVE** — real API'da qayta hosil qilindi.
- 📖 — kod o'qib tasdiqlandi.

---

## 🔴 Kritik — pul va ma'lumot yo'qolishi

| # | Joy | Muammo | Isbot |
|---|-----|--------|-------|
| B1 | `backend/.../debt/application/debt-payments.service.ts:125-154` | Bitta to'lovni bir vaqtda bir necha marta bekor qilish (reverse) mumkin, qarz shuncha marta oshadi | ✅ LIVE: 10 000 lik to'lov 3 marta parallel bekor qilindi, qarz 10 000 → 40 000 |
| B2 | `debt.service.ts:75, 243` | Sotuvni void qilganda yoki qaytarganda qarz `max(0, …)` bilan 0 ga kesiladi. Mijozning oldindan to'lagan puli va boshqa qarzlari o'chib ketadi | ✅ LIVE: −12 000 bo'lishi kerak edi, 0 bo'ldi |
| B3 | `saas/api/saas.controller.ts:39-64` | `/saas/backup/trigger` va `/saas/backup/restore` da ruxsat tekshiruvi yo'q: har qanday kassir backup'ni tiklay oladi | ✅ LIVE: kassir → 201 |
| B4 | `sales.service.ts:528-538` | Kassir istalgan narxda sota oladi (0.0001 so'm). `minPriceUzs` hech qayerda tekshirilmaydi | ✅ LIVE |
| B5 | `expenses.controller.ts:15-43` | Xarajatlar `sales.*` ruxsati bilan himoyalangan. Kassir xarajat qo'sha va o'chira oladi, bu kassa va foydaga ta'sir qiladi | ✅ LIVE |
| B6 | `sales.service.ts:570-589` | CASH sotuvda `customerId` kompaniyaga tegishliligi tekshirilmaydi, boshqa kompaniya mijozi yangilanadi. Mavjud bo'lmagan id 500 qaytaradi | ✅ LIVE (500) |
| B7 | `suppliers/application/supplier-debt.service.ts:169-194` | Ta'minotchiga parallel to'lovlarda ortiqcha to'lov o'tib ketadi (lock yo'q) | 📖 |
| B8 | `expenses.service.ts:106-139` | Kassa balansi noto'g'ri: qaytim pul hisobga qo'shiladi, UZS va USD ikki marta ayiriladi, qaytarilgan pullar ayirilmaydi | 📖 |
| B9 | `reports/.../report-query.helpers.ts:10`, `analytics-queries.service.ts:61` | Qaytarilgan sotuvlar hisobotlarda daromad va COGS'dan ayirilmaydi, foyda oshib ko'rinadi | 📖 |
| D1 | `desktop/.../PaymentDialog.tsx:102-123` | Desktop POS'da **nasiya sotuv umuman ishlamaydi**: summa `amountPaid` sifatida yuboriladi va server rad etadi | ✅ LIVE: 422 "Credit payment must not include amount paid" |
| D2 | `desktop/src/stores/salesStore.ts:48`, `api/mappers.ts:263` | Sotuvlar ro'yxati to'liq sotuv ma'lumotini ezib yuboradi. Chek, sotuv tafsiloti va qaytarish sahifalari `lineItems` yo'qligi sababli crash bo'ladi | 📖 |
| D3 | `desktop/src/stores/inventoryStore.ts:256` | Sotuv narxini o'zgartirish tannarxni `narx × 0.72` bilan almashtirib yuboradi | 📖 |
| M1 | `mobile/lib/services/api_service.dart:80-124` | Token yangilangandan keyingi qayta so'rov 401 qaytarsa, ilova abadiy osilib qoladi. Boshqa xato bo'lsa, foydalanuvchi tizimdan chiqarib yuboriladi va savat yo'qoladi | 📖 |
| M2 | `mobile/lib/views/pos_view.dart:866` | Checkout tugmasini ikki marta bosish ikkita sotuv yaratadi | 📖 |
| M3 | `mobile/lib/services/sync_service.dart` | Sinxronizatsiya paytida navbatga qo'shilgan offline sotuv o'chib ketadi | 📖 |

## 🟠 Yuqori

- **USD naqd sotuv yaxlitlash sababli rad etiladi.** Desktop va mobilda summa `round(total/rate)` qilib yuboriladi va server uni "kam to'landi" deb qaytaradi. ✅ LIVE: 5 urinishdan 1 tasi rad etildi.
- **Qaytarish:**
  - Desktop'da qisman qaytarish imkonsiz, har doim butun miqdor yuboriladi (`CreateReturnPage.tsx:52`).
  - MIXED sotuv qaytarilsa, naqd to'langan qismi ham qarzdan ayiriladi (B, `sales.service.ts:359`).
- **Ro'yxat limitlari:**
  - Desktop faqat birinchi 20 ta mahsulotni yuklaydi. 21-mahsulotdan boshlab "topilmadi" chiqadi, ularni tahrirlab ham bo'lmaydi.
  - Mobil kirim, chiqim va ko'chirish oynalarida faqat 100 ta mahsulot ko'rinadi.
- **Idempotency:**
  - Desktop'da har urinishda yangi kalit yaratiladi, timeout'dan keyingi retry dublikat sotuv yoki to'lov yaratadi.
  - Backend'da 24 soatdan eski kalit qayta ishlatilsa 500 qaytadi. Eski yozuvlar hech qachon tozalanmaydi.
- **Mobil xavfsizlik:**
  - Barcha telefonlar bir xil qattiq yozilgan `deviceId` bilan kiradi (`api_service.dart:157`), shuning uchun bitta qurilmani bloklash hammasini bloklaydi.
  - Logout serverda sessiyani yopmaydi. Offline navbat va kesh boshqa foydalanuvchiga o'tib ketadi.
- **APK:**
  - Release debug kalit bilan imzolanadi va har CI build'da kalit o'zgaradi, shuning uchun in-app update "App not installed" bilan yiqiladi.
  - Yangilanish faqat SHA-256 bilan tekshiriladi, imzo tekshirilmaydi.
- **Android 12+:** Bluetooth printer ishlamaydi, chunki runtime ruxsat (`BLUETOOTH_CONNECT`/`SCAN`) so'ralmaydi.
- **Cashier ruxsatlari:** kassir boshqa kassirlarning sotuvlarini id orqali ochib ko'ra oladi. ✅ LIVE.
- **Hisobot ruxsati:** faqat `reports.view` ruxsati bor foydalanuvchi moliyaviy hisobotlarni ham ola oladi (`reports.service.ts:288`).
- **Database:** PostgreSQL'da RLS siyosatlari umuman yo'q. Kompaniyalar bir-biridan faqat koddagi `companyId` filtrlari bilan ajratilgan.

## 🟡 O'rta

- **Foydalanuvchi xatolari 500 qaytaradi:**
  - noto'g'ri sana
  - noto'g'ri UUID
  - juda katta miqdor
  - ✅ LIVE: uchala holat ham 500 qaytardi.
- **Hisobotlar:**
  - Profit hisobotida filial yoki kassir bo'yicha sotuvlardan butun kompaniya xarajati ayiriladi.
  - Dashboard qisman qaytarilgan sotuvlarni umuman tashlab yuboradi.
  - Pul ustunlari matn sifatida saralanadi.
- **Ta'minotchi USD qarzi:** kurs o'zgarganda qarzni aniq yopib bo'lmaydi.
- **Kurs:** parallel `setRate` ikkita aktiv kurs qoldiradi. Kurs topilmasa, qattiq yozilgan 12 620 ishlatiladi.
- **Mijoz o'chirish:** qarzi bor mijozni o'chirish mumkin. Shundan keyin void, qaytarish va reverse amallari 500 qaytaradi.
- **Mobil:**
  - Qarz to'lovi butun so'mgacha yaxlitlanadi, server rad etadi.
  - Kirim va chiqim miqdorlari butun songa yaxlitlanadi (2.5 kg → 3).
  - 3 ta hisobot turi mobildan yaratilmaydi (template nomi noto'g'ri olinadi).
  - Kesh xato bo'lganda eski ma'lumotni 200 holati bilan qaytaradi. Hisobot polling'i abadiy aylanadi.
  - Chekda sotuv raqami o'rniga vaqt chiqadi, chunki `saleNumber` emas `number` keladi. ✅ LIVE.
  - Qaytarishlar ro'yxatida summa doim 0 ko'rinadi.
- **Desktop:**
  - Profil tablari ma'lumot kelgandan keyin yangilanmaydi.
  - Kirimdagi xato foydalanuvchiga ko'rsatilmaydi.
  - Void tasdiqlashsiz bajariladi.
  - Offline ishga tushirilganda foydalanuvchi tizimdan chiqarib yuboriladi.
  - Kompaniya almashtirilganda POS savati tozalanmaydi.
  - Server xato matnlari foydalanuvchiga yetib bormaydi.

## Tizim darajasidagi bo'shliqlar

1. **Avtomatik testlar yo'q.** Backend'da 0 ta `.spec.ts`, desktop'da 0 ta test, mobil'da faqat shablon test bor. CI'dagi `npm test` hech narsa tekshirmaydi.
2. **Realtime (WebSocket) yo'q**, garchi master rejada majburiy bo'lsa ham. Desktop har 30 soniyada polling qiladi.
3. **`live-staging.mjs` CI'ga ulanmagan va eskirgan** (L-04).
4. **Desktop offline navbati umuman ishlatilmaydi.** `enqueueAction` hech qayerdan chaqirilmaydi.

## Bu sessiyada tuzatilgan

- **Mobil offline sotuv Idempotency-Key:**
  - Kalit sotuv uchun bir marta yaratiladi, navbatda saqlanadi va qayta yuborishda o'zi ishlatiladi.
  - Eski formatdagi navbat yozuvlari ham kalit oladi.
  - Lokal API'ga qarshi integratsion test bilan tekshirildi: replay dublikat yaratmadi.
  - O'zgargan fayllar: `api_service.dart`, `sync_service.dart`, `pos_view.dart`.

## Tuzatildi (2-bosqich) — lokal API'da qayta sinaldi, barchasi PASS

| # | Tuzatish | Sinov natijasi |
|---|----------|----------------|
| B1 | Reverse `updateMany … reversedAt: null` bilan atomik band qilinadi | 3 ta parallel reverse'dan faqat 1 tasi o'tdi, qarz +10 000 (avval +30 000) |
| B2 | Void va qaytarishda `max(0, …)` olib tashlandi. Qaytarish krediti sotuvning nasiya qismi bilan cheklanadi | Void: −12 000 ✅. MIXED sotuvni to'liq qaytarish faqat 6 000 nasiya qismini ayirdi ✅ |
| B3 | `/saas/backup/*` uchun `CompanyIsolationGuard` + `admin.*` | Kassir 403, admin 201 |
| B4 | Narx floor (`minPrice`, bo'lmasa tannarx) qo'shildi; yangi `sales.price_override` ruxsati (Admin/Manager) | Kassir 0.0001 → 422, admin → 201, oddiy narx → 201 |
| B5 | Yangi `expenses.view/create/delete` ruxsatlari. Kassirda o'chirish ruxsati yo'q. `ParseUUIDPipe` qo'shildi | Kassir o'chirish 403, noto'g'ri id 400 (avval 500) |
| USD | Backend USD to'lovda yarim sent yaxlitlash farqini qabul qiladi | 7/7 sotuv o'tdi, 2 sent kam to'lov hali ham 422 |
| D1 | Desktop nasiya sotuvda to'langan summani 0 yuboradi | API kontrakti sinaldi (201). Desktop UI'da qo'lda sinalmagan |
| M2 | Mobil checkout tugmasi so'rov davomida bloklanadi va spinner ko'rsatadi | `flutter analyze` toza. Qurilmada sinalmagan |

**Regressiya tekshiruvi:** `live-staging` 23/24, faqat eskirgan L-04 yiqildi. Backend va desktop `tsc` toza.

## Tavsiya etilgan tartib

1. **Pulga oid xatolar:** B1, B2, B3, B4, B5, D1, M2, USD yaxlitlash.
2. **Crash va oqim xatolari:** D2, M1, M3, desktop 20 ta mahsulot limiti.
3. **APK imzolash:** doimiy keystore va CI secret.
4. **Testlar:** sotuv, qarz va qaytarish uchun Jest testlari, `staging:live` CI'da.
5. **Qolganlari:** RLS, realtime, hisobotlar aniqligi.

**Production tayyorligi:** asosiy oqimlar ishlaydi, lekin pul yo'qolishiga olib keladigan xatolar va testlar yo'qligi sababli hozircha **~65–70%**.
