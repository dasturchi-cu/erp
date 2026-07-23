# ERP TIZIMI - MUSTAQIL PROFESSIONAL ENTERPRISE AUDIT & STRESS ASSESSMENT HISOBOITI

**Muallif:** Antigravity (Senior Enterprise Software Architect, Code Auditor, QA Lead & Security Auditor)
**Sana:** 2026-07-20
**Hujjat Maqsadi:** Loyihani production darajasiga chiqarishdan oldin uning barcha me'moriy, xavfsizlik, unumdorlik va ma'lumotlar yaxlitligi muammolarini topish va dalillar bilan isbotlash.

---

## MUNDARIJA
1. [KIRISh VA AUDIT MATRIXI](#1-kirish-va-audit-matrixi)
2. [TIZIM SCORE KARTASI (SYSTEM SCORING)](#2-tizim-score-kartasi-system-scoring)
3. [TEKSHIRILGAN YO'NALISHLAR BO'YICHA TAHLIL](#3-tekshirilgan-yonalishlar-boyicha-tahlil)
    - [Yo'nalish 1: Backend Architecture & NestJS Best Practices](#yonalish-1-backend-architecture-nestjs-best-practices)
    - [Yo'nalish 2: Database & ORM Performance (100GB / 1M Products Scale)](#yonalish-2-database-orm-performance-100gb-1m-products-scale)
    - [Yo'nalish 3: Transaction Integrity & FIFO Inventory Logic](#yonalish-3-transaction-integrity-fifo-inventory-logic)
    - [Yo'nalish 4: Security & Cryptography Vulnerabilities](#yonalish-4-security-cryptography-vulnerabilities)
    - [Yo'nalish 5: System Resiliency (Elektr/Tarmoq O'chishi & POS Offline Sync)](#yonalish-5-system-resiliency-elektrtarmoq-ochishi-pos-offline-sync)
    - [Yo'nalish 6: Frontend & Electron Native Security](#yonalish-6-frontend-electron-native-security)
    - [Yo'nalish 7: SaaS & Tenant Isolation (Multi-tenancy Integrity)](#yonalish-7-saas-tenant-isolation-multi-tenancy-integrity)
    - [Yo'nalish 8: DevOps & Production Packaging Bloat](#yonalish-8-devops-production-packaging-bloat)
4. [ANIQLANGAN VUQOLIKLAR VA XATOLIKLAR (BUG HUNT RESULTS)](#4-aniqlangan-vuqoliklar-va-xatoliklar-bug-hunt-results)
    - [1. [CRITICAL] Path Traversal in Image Serving Endpoints](#1-critical-path-traversal-in-image-serving-endpoints)
    - [2. [HIGH] Deadlock Vulnerability in FIFO Allocation Locking](#2-high-deadlock-vulnerability-in-fifo-allocation-locking)
    - [3. [HIGH] Lost Update during FIFO Sale Voids](#3-high-lost-update-during-fifo-sale-voids)
    - [4. [HIGH] Offline Sync Silent Data Loss on 4xx Conflict Errors](#4-high-offline-sync-silent-data-loss-on-4xx-conflict-errors)
    - [5. [HIGH] Arbitrary File Writing & Spoofed Mimetype Bypass in Uploads](#5-high-arbitrary-file-writing-spoofed-mimetype-bypass-in-uploads)
    - [6. [HIGH] Electron URL Protocol RCE Shell Hijack](#6-high-electron-url-protocol-rce-shell-hijack)
    - [7. [HIGH] Environment Variables (.env) Leakage in Production Installer](#7-high-environment-variables-env-leakage-in-production-installer)
    - [8. [HIGH] In-Memory Filtration of 100K Products OOM Bottleneck](#8-high-in-memory-filtration-of-100k-products-oom-bottleneck)
    - [9. [HIGH] Synchronous Heavy Jimp Resizing Blocking Event Loop (DDoS Vector)](#9-high-synchronous-heavy-jimp-resizing-blocking-event-loop-ddos-vector)
    - [10. [HIGH] Active Session DB Queries on Every Protected HTTP Request](#10-high-active-session-db-queries-on-every-protected-http-request)
    - [11. [HIGH] Inconsistent Soft-Delete Validation Leading to Inactive Stock Adjustments](#11-high-inconsistent-soft-delete-validation-leading-to-inactive-stock-adjustments)
    - [12. [HIGH] Rate Limiter ThrottlerGuard is Configured but Never Applied Globally](#12-high-rate-limiter-throttlerguard-is-configured-but-never-applied-globally)
    - [13. [MEDIUM] POS Duplicate Barcode Silent Return Bug](#13-medium-pos-duplicate-barcode-silent-return-bug)
    - [14. [MEDIUM] Split Payment Credit Calculation Bug on Mixed POS Sales](#14-medium-split-payment-credit-calculation-bug-on-mixed-pos-sales)
5. [TIZIMNING STRESS SCENARIYLARI TAHLILI](#5-tizimning-stress-scenariylari-tahlili)

---

## 1. KIRISh VA AUDIT MATRIXI

Ushbu audit mustaqil ekspert sifatida ERP tizimining arxitekturasi va kod bazasini chuqur tekshirish orqali tayyorlandi. Loyiha ko'p foydalanuvchili, offline rejimni qo'llab-quvvatlaydigan va Electron platformasida ishlaydigan murakkab POS-ERP yechimidir. Biz tizimni odatiy holatda emas, balki uni **eng og'ir sharoitlarda** (stress rejim, ko'p foydalanuvchilar, tarmoq uzilishlari, katta hajmdagi ma'lumotlar bazasi) buzishga va qayerda sinishini aniqlashga harakat qildik.

### Xatoliklar Matrixi (Severity Matrix)
| Severity | Aniqlangan Soni | Tizimga Ta'siri | Qisqacha Ta'rif |
| :--- | :---: | :--- | :--- |
| **CRITICAL** | 1 | Tizimni masofadan to'liq boshqarish, maxfiy ma'lumotlarni o'g'irlash. | Ixtiyoriy faylni o'qish (Path Traversal). |
| **HIGH** | 11 | Ma'lumotlarning yo'qolishi, DB qulashi (Deadlock), server xotira to'lib qolishi (OOM), RCE. | FIFO qulflari, offline sync xatolari, rasm yuklash bypasslari, Electron RCE, .env sizib chiqishi. |
| **MEDIUM** | 2 | Notog'ri hisob-kitoblar, noto'g'ri mahsulot sotilishi. | POS split payment xatolari, dublikat shtrix-kod. |
| **LOW / Code Smell** | 3 | Kodning me'moriy tozaligi buzilishi, kechikishlar. | Database write amplification, soft-delete middleware yo'qligi. |

---

## 2. TIZIM SCORE KARTASI (SYSTEM SCORING)

Loyihaning turli yo'nalishlar bo'yicha me'moriy, xavfsizlik va barqarorlik ko'rsatkichlariga qo'yilgan baholar (10 ballik tizimda):

*   **Security (Xavfsizlik): 3 / 10**
    *   *Izoh:* Unauthenticated Path Traversal, rasm yuklash orqali RCE / Stored XSS ehtimoli, Electron orqali OS buyruqlarini ishga tushirish (RCE Protocol Hijack) va `.env` parollarini ochiq holda desktop paketga qo'shib yuborish kabi o'ta jiddiy kamchiliklar mavjud.
*   **Performance & Scalability (Tezkorlik & Kengayuvchanlik): 4 / 10**
    *   *Izoh:* 100K mahsulot bo'lganda OOM chaqiradigan JS-level filtrlar mavjud. Har bir API so'rovda DB orqali sessiyani tekshirish, shuningdek, idempotensiya kalitlarini DB ga har safar INSERT/UPDATE qilish tizimni sekinlashtiradi.
*   **Concurrency & Data Integrity (Paralellik & Ma'lumotlar Yaxlitligi): 5 / 10**
    *   *Izoh:* Kassirlar bir vaqtda parallel savdo qilganda deadlocks (PG 40P01) vujudga keladi. Sotuvni bekor qilish (Void) jarayonida `restoreFifoAllocations` da parallel tranzaksiyalarda Lost Update yuzaga keladi.
*   **Offline Support Resiliency (Oflayn Ishlash Barqarorligi): 4 / 10**
    *   *Izoh:* Oflayn rejimda qilingan savdo yoki to'lovlar serverga qayta yuborilganda 4xx xatolar (masalan, narxlar o'zgarishi, cheklovlar) yuzaga kelsa, xatolar kassirga ko'rsatilmasdan o'chirib tashlanadi (Silent Data Loss).
*   **SaaS Multi-tenancy Isolation (Ko'p ijarachilik izolyatsiyasi): 7 / 10**
    *   *Izoh:* Row-Level Security (RLS) PostgreSQL darajasida `app.company_id` orqali qisman qilingan bo'lsa-da, Prisma integratsiyasida global soft-delete middleware yo'qligi sababli noto'g'ri o'chirilgan ma'lumotlar bilan ishlash xavfi bor.

---

## 3. TEKSHIRILGAN YO'NALISHLAR BO'YICHA TAHLIL

### Yo'nalish 1: Backend Architecture & NestJS Best Practices
*   **SOLID & Clean Architecture:** Loyiha klassik modular monolith arxitekturasida yozilgan. Controller -> Service -> DB (Prisma Client). SOLID mezonlari asosan bajarilgan, lekin Service qatlamida o'ta og'ir hisob-kitoblar (Jimp image processing, in-memory array filtering) joylashtirilgani NestJS monouth me'morchiligiga to'g'ri kelmaydi. CPU bloklovchi operatsiyalar alohida Microservice yoki Worker Thread'larga chiqarilishi shart.
*   **Circular Dependency:** `AuthModule` va `NotificationsModule` o'rtasida circular dependency mavjud bo'lib, u `forwardRef` orqali bartaraf etilgan. Me'moriy jihatdan bu bog'liqlik Event emitter yoki alohida Mediator pattern yordamida ajratilishi lozim.

### Yo'nalish 2: Database & ORM Performance (100GB / 1M Products Scale)
*   **High-Load Scaling:** 1M mahsulot va 10M audit logs bo'lgan holatda PostgreSQL unumdorligi keskin tushadi. Prisma ORM dagi `findMany()` orqali butun jadvalni JS xotirasiga yuklash me'moriy xatolikdir.
*   **Query Optimization & Indexes:** `products`, `sales` va boshqa jadvallarda GIN (pg_trgm) indekslari yaratilgan:
    ```typescript
    await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (name gin_trgm_ops)`);
    ```
    Bu LIKE / ILIKE qidiruvlari uchun samarali. Ammo, `audit_logs` jadvali 10 milliondan oshganda DB partition bo'lmagani sababli, har bir log yozish tranzaksiyalarni uzoqroq ushlab turadi.
*   **Inconsistent Soft-Delete:** Global Prisma middleware yo'q. Dasturchi har bir so'rovda `deletedAt: null` deb yozishga majbur. `inventory.service.ts` faylining 444-qatorida:
    ```typescript
    const product = await tx.product.findFirstOrThrow({
      where: { id: dto.productId, companyId },
      include: { prices: true },
    });
    ```
    Bu yerda `deletedAt: null` tekshiruvi unutilgan! Soft-delete qilingan mahsulotga hali am stock adjustment qilish mumkin. Bu ma'lumotlar izchilligini buzadi.

### Yo'nalish 3: Transaction Integrity & FIFO Inventory Logic
*   **Deadlock Vulnerability:** POS savdo jarayonida `deductFifo` ichidagi batchlarni qulflash (`FOR UPDATE`) tartibsiz amalga oshiriladi. Kassir A `[M1, M2]` ni sotsa va Kassir B `[M2, M1]` ni sotsa, DB parallel tranzaksiyada deadlock (PG error 40P01) yuzaga keltirib, tranzaksiyani bekor qiladi.
*   **Lost Update in Voids:** Savdoni bekor qilishda batch zaxiralarini qayta tiklash (`restoreFifoAllocations`) jarayonida batch row concurrency lock qilinmaydi. JS xotirasida olingan qiymatga qo'shib, keyin yoziladi (`update`). Parallel bekor qilish so'rovlarida ma'lumotlar bir-birini o'chirib yuboradi (Lost Update).

### Yo'nalish 4: Security & Cryptography Vulnerabilities
*   **JWT Management:** JWT tokenning session ID bilan bog'lanishi yaxshi. Biroq token refresh tranzaksiyasida token reuse detection mehanizmi o'ta tajovuzkor yozilgan. Parallel Axios so'rovlarida token refresh bir vaqtda chaqirilsa, ikkinchi so'rov sessionni to'liq bloklaydi (Revoke), natijada foydalanuvchi tizimdan asossiz chiqarib yuboriladi.
*   **No Rate Limiter:** `ThrottlerGuard` hech qayerda global darajada ulanmagan. API ni cheksiz so'rovlar bilan bombardimon qilish (Brute-force / DDoS) mumkin.

### Yo'nalish 5: System Resiliency (Elektr/Tarmoq O'chishi & POS Offline Sync)
*   **Offline Data Loss:** Zustand `useOfflineStore` oflayn tranzaksiyalarni saqlaydi va tarmoq tiklanganda yuboradi. Ammo server `4xx` (Validation / Business rule conflict) qaytarsa, tranzaksiyani shunchaki o'chirib tashlaydi. Kassir bu haqda ogohlantirilmaydi, ma'lumotlar serverga bormay yo'qoladi.
*   **Idempotency Storage Overhead:** Idempotency kalitlari har safar PostgreSQL DB ga yoziladi va o'chiriladi. Bu tranzaksiya yukini 2 barobar oshiradi. Bunday dinamik qiymatlar uchun Redis ishlatilmagan.

### Yo'nalish 6: Frontend & Electron Native Security
*   **Electron shell RCE:** `BrowserWindow` dagi `setWindowOpenHandler` ichida har qanday URL to'g'ridan-to'g'ri `shell.openExternal(url)` ga uzatiladi. Protokol `http:` yoki `https:` bilan cheklanmagan bo'lib, tajovuzkor `file:///` kabi Native buyruqlarni ishga tushirishi mumkin.
*   **Missing List Virtualization:** Tizimda `react-window` kabi virtualizatsiya kutubxonalari yo'q. Agar kassirda 10,000+ mahsulot bo'lsa, UI render vaqti keskin oshib, ilova qotib qoladi.

### Yo'nalish 7: SaaS & Tenant Isolation (Multi-tenancy Integrity)
*   Tizimda ko'p ijarachilik (Multi-tenancy) `companyId` orqali ajratilgan. Biroq, `PrismaService` dagi `setCompanyContext` faqat raw SQL uchun amal qiladi, Prisma standart API so'rovlarida ijarachi xavfsizligini ta'minlamaydi. Agar dasturchi `where: { companyId }` ni yozishdan to'xtasa, ma'lumotlar tenantlararo sizib chiqadi (Data leakage).

### Yo'nalish 8: DevOps & Production Packaging Bloat
*   **DevEnv Leakage:** `desktop/package.json` faylida `.env` faylini production paketiga qo'shib yuborish filtri o'rnatilgan:
    ```json
    "filter": [
      "dist/**/*",
      "node_modules/**/*",
      ".env"
    ]
    ```
    Bu DevOps nuqtai nazaridan o'ta xavfli: ishlab chiquvchining barcha maxfiy kalitlari, DB parollari foydalanuvchining kompyuteridagi fayllar orasiga ochiq holda joylashadi.

---

## 4. ANIQLANGAN VUQOLIKLAR VA XATOLIKLAR (BUG HUNT RESULTS)

Quyida tizimdagi eng muhim muammolar dalillar (kod parchalari, fayl manzillari va satrlari) bilan keltirilgan.

### 1. [CRITICAL] Path Traversal in Image Serving Endpoints
*   **Fayl manzili:** [products.service.ts](file:///d:/erp1/backend/src/modules/products/application/products.service.ts#L1039-L1053)
*   **Kod qismi:**
    ```typescript
    async serveImage(size: string, filename: string, res: Response) {
      const allowedSizes = ['original', 'medium', 'thumb'];
      if (!allowedSizes.includes(size)) {
        res.status(400).send('Invalid size');
        return;
      }
      const baseDir = join(process.cwd(), 'storage/products');
      const filePath = join(baseDir, size, filename);
      if (!existsSync(filePath)) {
        res.status(404).send('Not Found');
        return;
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.sendFile(filePath);
    }
    ```
*   **Muammo tahlili:** `filename` parametri hech qanday sanitizatsiya qilinmasdan to'g'ridan-to'g'ri `join` yordamida yo'lga biriktirilmoqda. Bu endpoint `@Public()` dekoratoriga ega bo'lgani sababli, unauthenticated tajovuzkor `/served/original/../../../../.env` yoki `/served/original/..\..\..\..\Windows\win.ini` so'rovlari orqali serverdagi ixtiyoriy maxfiy fayllarni o'qishi mumkin.
*   **Tizimga ta'siri:** Maxfiy konfiguratsiyalar, database parollari va tizim fayllarining to'liq oshkor bo'lishi.
*   **Tavsiya etilgan tuzatish:** `filename` ni `path.basename()` orqali tozalash shart:
    ```typescript
    const safeFilename = path.basename(filename);
    const filePath = join(baseDir, size, safeFilename);
    ```

### 2. [HIGH] Deadlock Vulnerability in FIFO Allocation Locking
*   **Fayl manzili:** [sales.service.ts](file:///d:/erp1/backend/src/modules/sales/application/sales.service.ts) & [inventory.helpers.ts](file:///d:/erp1/backend/src/modules/inventory/application/inventory.helpers.ts#L17-L97)
*   **Muammo tahlili:** POS savdo jarayonida `deductFifo` ichidagi batchlarni qulflash (`FOR UPDATE`) tartibsiz amalga oshiriladi. Kassir A bir vaqtda `[Mahsulot 1, Mahsulot 2]` ni, Kassir B esa `[Mahsulot 2, Mahsulot 1]` ni sotsa, DB row locking tartibsiz so'ralgani sababli ikki tranzaksiya bir-birini kutib qoladi (Deadlock) va PostgreSQL `40P01` xatosi bilan birini abort qiladi.
*   **Tizimga ta'siri:** Ko'p kassirlar parallel savdo qilganda POS cheklari yaratilmasdan xatolik qaytaradi, tranzaksiyalar qulaydi.
*   **Tavsiya etilgan tuzatish:** Savatdagi mahsulotlarni locking so'rashdan oldin ID bo'yicha global tartibda saralash (Sorting):
    ```typescript
    const sortedLineItems = [...dto.lineItems].sort((a, b) => a.productId.localeCompare(b.productId));
    ```

### 3. [HIGH] Lost Update during FIFO Sale Voids
*   **Fayl manzili:** [inventory.helpers.ts](file:///d:/erp1/backend/src/modules/inventory/application/inventory.helpers.ts#L203-L265) inside `restoreFifoAllocations`
*   **Muammo tahlili:** Savdoni bekor qilish jarayonida:
    ```typescript
    const batch = await tx.inventoryBatch.findFirst({
      where: { id: alloc.batchId, companyId },
    });
    // ...
    await tx.inventoryBatch.update({
      where: { id: alloc.batchId },
      data: { remainingQty: batch.remainingQty.add(alloc.quantity) },
    });
    ```
    Bu kodda `findFirst` chaqirilganda batch row `FOR UPDATE` orqali bloklanmaydi. Agar ikkita void yoki qaytarish tranzaksiyasi parallel ravishda ayni bir batchni yangilasa, ular bir vaqtda eski `remainingQty` ni o'qib, so'ngra yangilaydi (Lost Update).
*   **Tizimga ta'siri:** Inventar sonining DB dagi qiymati jismoniy holatga mos kelmay qoladi (Stock discrepancy).
*   **Tavsiya etilgan tuzatish:** Batch zaxirasini yangilashda DB-level atomic increment ishlatish yoki batchni locking orqali o'qish:
    ```typescript
    await tx.inventoryBatch.update({
      where: { id: alloc.batchId },
      data: { remainingQty: { increment: alloc.quantity } },
    });
    ```

### 4. [HIGH] Offline Sync Silent Data Loss on 4xx Conflict Errors
*   **Fayl manzili:** [offlineStore.ts](file:///d:/erp1/desktop/src/stores/offlineStore.ts#L60-L70)
*   **Muammo tahlili:** Offline holatda saqlangan cheklar serverga yuborilganda:
    ```typescript
    } catch (err: any) {
      if (!err.status || err.status >= 500) {
        remainingQueue.push(action);
        // ...
        break;
      } else {
        console.warn('Sync conflict/validation error skipped:', err);
      }
    }
    ```
    Agar server `4xx` xato qaytarsa (masalan, `409 Conflict` - zaxira yetishmasligi, yoki `400` - narx o'zgarishi), bu savdo tranzaksiyasi navbatdan **shunchaki o'chirib yuboriladi** va hech qayerga yozilmaydi.
*   **Tizimga ta'siri:** Kassir savdo amalga oshdi deb o'ylaydi, ammo u server ma'lumotlar bazasiga bormaydi (Silent Data Loss).
*   **Tavsiya etilgan tuzatish:** `4xx` xatolarini alohida xatoliklar navbatiga (Conflict Queue) o'tkazish va foydalanuvchiga qo'lda hal qilish imkonini beruvchi UI oynasini ko'rsatish.

### 5. [HIGH] Arbitrary File Writing & Spoofed Mimetype Bypass in Uploads
*   **Fayl manzili:** [products.service.ts](file:///d:/erp1/backend/src/modules/products/application/products.service.ts#L995-L1030)
*   **Muammo tahlili:** Fayl yuklashda tekshiruv faqat mijoz yuborgan `file.mimetype` ga asoslangan:
    ```typescript
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw AppException.validation('Only JPG, PNG and WEBP images are allowed', []);
    }
    ```
    Attacker o'zining `.php` yoki `.html` faylini `Content-Type: image/jpeg` qilib yuborsa, bu tekshiruvdan o'tadi. Jimp rasm o'qishda xato bergan taqdirda ham, catch blokida raw fayl server diskiga baribir yoziladi:
    ```typescript
    } catch (err) {
      writeFileSync(join(baseDir, 'medium', filename), file.buffer);
      writeFileSync(join(baseDir, 'thumb', filename), file.buffer);
    }
    ```
*   **Tizimga ta'siri:** Stored XSS yoki Remote Code Execution (RCE) xavfi.
*   **Tavsiya etilgan tuzatish:** Magic bytes orqali haqiqiy fayl turini tekshirish (`file-type` kutubxonasi) va catch blokida raw faylni yozishni to'xtatish.

### 6. [HIGH] Electron URL Protocol RCE Shell Hijack
*   **Fayl manzili:** [main.ts](file:///d:/erp1/desktop/electron/main.ts#L78-L81)
*   **Muammo tahlili:** Electron oynasida linklarni ochish:
    ```typescript
    win.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
    ```
    Protokol tekshiruvi yo'q. Agar dastur ichiga tajovuzkor `file:///` yoki boshqa tizim protokollari bilan havola joylashtira olsa (masalan, stored XSS orqali), u foydalanuvchi bosganda mahalliy dasturlarni (`cmd.exe`) ishga tushira oladi.
*   **Tizimga ta'siri:** Desktop foydalanuvchi kompyuterini to'liq nazorat qilish (RCE).
*   **Tavsiya etilgan tuzatish:** Faqat `http:` va `https:` protokollariga ruxsat berish:
    ```typescript
    const parsed = new URL(url);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      shell.openExternal(url);
    }
    ```

### 7. [HIGH] Environment Variables (.env) Leakage in Production Installer
*   **Fayl manzili:** [package.json](file:///d:/erp1/desktop/package.json#L57-L71)
*   **Muammo tahlili:** `extraResources` orqali backend `.env` fayli o'rnatuvchi paket (Installer) ichiga qo'shilgan:
    ```json
    "filter": [
      "dist/**/*",
      "node_modules/**/*",
      ".env"
    ]
    ```
*   **Tizimga ta'siri:** Desktop ilovani yuklab olgan har qanday foydalanuvchi resurslar papkasidan ishlab chiquvchining DB parollari va JWT kalitlarini o'qiy oladi.
*   **Tavsiya etilgan tuzatish:** `.env` faylini filtrdan olib tashlash va environment o'zgaruvchilarini dinamik tarzda tizim registeridan yoki xavfsiz kanaldan yuklash.

### 8. [HIGH] In-Memory Filtration of 100K Products OOM Bottleneck
*   **Fayl manzili:** [products.service.ts](file:///d:/erp1/backend/src/modules/products/application/products.service.ts#L84-L107)
*   **Muammo tahlili:** Mahsulotlarni stock darajasi bo'yicha filtrlaganda, avval barcha mahsulotlar va ularning zaxira summalari bazadan o'qilib JS xotirasiga olinadi, so'ngra massivda `filter` va `map` qilinadi.
*   **Tizimga ta'siri:** Katta ma'lumotlar bazasida Node.js xotirasi (RAM) to'lib qoladi va backend jarayoni OOM (Out of Memory) tufayli qulaydi.
*   **Tavsiya etilgan tuzatish:** Filtr va paginatsiyani to'liq SQL darajasida subquery/join yordamida bajarish.

### 9. [HIGH] Synchronous Heavy Jimp Resizing Blocking Event Loop (DDoS Vector)
*   **Fayl manzili:** [products.service.ts](file:///d:/erp1/backend/src/modules/products/application/products.service.ts#L1017-L1029) & [products.controller.ts](file:///d:/erp1/backend/src/modules/products/api/products.controller.ts#L121)
*   **Muammo tahlili:** Rasm yuklashda va ZIP importda Jimp rasmni o'zgartirish (Resize) ishlari asosiy Node.js threadida ishlaydi. Jimp to'liq JS da yozilganligi sababli u CPU ni 100% ga yuklab, event loopni bloklab qo'yadi.
*   **Tizimga ta'siri:** Bitta foydalanuvchi og'ir ZIP rasmlar to'plamini yuklaganda, butun tizim boshqa foydalanuvchilar (masalan, kassirlar) uchun bir necha soniyaga to'liq javob bermay qoladi (DoS).
*   **Tavsiya etilgan tuzatish:** C++ asosidagi tezkor `sharp` kutubxonasiga o'tish yoki rasm ishlashni alohida worker threadga o'tkazish.

### 10. [HIGH] Active Session DB Queries on Every Protected HTTP Request
*   **Fayl manzili:** [jwt.strategy.ts](file:///d:/erp1/backend/src/modules/auth/infrastructure/jwt.strategy.ts#L32-L47)
*   **Muammo tahlili:** Har bir himoyalangan (protected) API so'rovda `JwtStrategy.validate()` ishga tushib, PostgreSQL bazasidan sessiya va user ma'lumotlarini qidiradi:
    ```typescript
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });
    ```
    Bu JWT ning stateless ishlash tamoyilini yo'qqa chiqaradi va har so'rovda DB read yukini oshiradi.
*   **Tizimga ta'siri:** 100+ parallel foydalanuvchi ishlayotganda DB CPU yuki keskin oshib ketadi.
*   **Tavsiya etilgan tuzatish:** Sessiya holatini tezkor in-memory kesh (masalan, Redis) ichida saqlash va tekshirish.

### 11. [HIGH] Inconsistent Soft-Delete Validation Leading to Inactive Stock Adjustments
*   **Fayl manzili:** [inventory.service.ts](file:///d:/erp1/backend/src/modules/inventory/application/inventory.service.ts#L444-L447)
*   **Muammo tahlili:** Mahsulot zaxirasini to'g'rilash (Adjustment) jarayonida mahsulotni o'qishda soft-delete flagi tekshirilmaydi:
    ```typescript
    const product = await tx.product.findFirstOrThrow({
      where: { id: dto.productId, companyId },
      include: { prices: true },
    });
    ```
*   **Tizimga ta'siri:** Foydalanuvchilar tizimdan o'chirilgan (soft-deleted) mahsulotlarga nisbatan stock adjustment tranzaksiyalarini muvaffaqiyatli bajarishi mumkin, bu inventar hisobotlarining buzilishiga olib keladi.
*   **Tavsiya etilgan tuzatish:** Barcha mahsulot o'qish qismlarida `deletedAt: null` shartini qo'shish yoki Prisma global soft-delete middlewareini faollashtirish.

### 12. [HIGH] Rate Limiter ThrottlerGuard is Configured but Never Applied Globally
*   **Fayl manzili:** [app.module.ts](file:///d:/erp1/backend/src/app.module.ts#L25-L30) & [core.module.ts](file:///d:/erp1/backend/src/core/core.module.ts)
*   **Muammo tahlili:** `ThrottlerModule` imports ro'yxatiga qo'shilgan, lekin `ThrottlerGuard` global provayderlarga yoki kontrollerlarga bog'lanmagan.
*   **Tizimga ta'siri:** API so'rovlari cheklanmagan (No Rate Limiting), brute-force yoki DDoS hujumlariga qarshi mutlaqo himoya yo'q.
*   **Tavsiya etilgan tuzatish:** `core.module.ts` yoki `app.module.ts` provayderlariga global `APP_GUARD` sifatida throttler guardni qo'shish:
    ```typescript
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
    ```

### 13. [MEDIUM] POS Duplicate Barcode Silent Return Bug
*   **Fayl manzili:** [products.service.ts](file:///d:/erp1/backend/src/modules/products/application/products.service.ts#L214-L230) inside `getByBarcode`
*   **Muammo tahlili:** Shtrix-kod bo'yicha qidiruv `findFirst` orqali amalga oshiriladi. DB da `[companyId, barcode]` bo'yicha unique index yo'qligi sababli, agar tizimga ayni bir shtrix-kod bilan ikki xil mahsulot kiritilib qolsa, qidiruv har doim birinchi mahsulotni qaytaradi.
*   **Tizimga ta'siri:** Kassir ikkinchi mahsulotni skanerlaganda, chekka birinchi mahsulot silent (hech qanday ogohlantirishsiz) qo'shilib ketadi. Kassadagi hisob va kassa balansi farq qiladi.
*   **Tavsiya etilgan tuzatish:** `findMany` orqali dublikatlarni tekshirish va agar birdan ortiq bo'lsa, xatolik qaytarish:
    ```typescript
    const products = await this.prisma.product.findMany({ ... });
    if (products.length > 1) throw AppException.conflict('DUPLICATE_BARCODE_AMBIGUITY', '...');
    ```

### 14. [MEDIUM] Split Payment Credit Calculation Bug on Mixed POS Sales
*   **Fayl manzili:** [salesStore.ts](file:///d:/erp1/desktop/src/stores/salesStore.ts#L145-L150)
*   **Muammo tahlili:** `getSaleCreditUzs` mixed payment uchun credit miqdorini hisoblashda faqat birinchi to'lovni hisobga oladi:
    ```typescript
    const receivedUzs = sale.payments[0]?.receivedUzs ?? 0;
    return Math.max(0, sale.totalUzs - receivedUzs);
    ```
*   **Tizimga ta'siri:** Agar mixed paymentda cash + card + credit bo'lsa, desktop UI da credit miqdori noto'g'ri (juda katta) ko'rsatiladi.
*   **Tavsiya etilgan tuzatish:** To'lovlar ro'yxatini yig'indisini olish (reduce):
    ```typescript
    const totalPaid = sale.payments.reduce((sum, p) => sum + p.receivedUzs, 0);
    return Math.max(0, sale.totalUzs - totalPaid);
    ```

---

## 5. TIZIMNING STRESS SCENARIYLARI TAHLILI

Katta korporativ ERP sifatida ishlash jarayonida quyidagi eng yomon stsenariylar simulyatsiyasi:

1.  **Internet yoki Tarmoq butunlay uzilib qolsa:**
    *   *Natija:* Kassir oflayn savdoni davom ettira oladi. Lekin tarmoq tiklanib, navbat sinxronizatsiya bo'lishni boshlaganda, agar sotilgan mahsulot narxi o'zgargan bo'lsa yoki u o'chirilgan bo'lsa, `4xx Conflict` tufayli **savdo ma'lumotlari serverga yuborilmasdan shunchaki o'chib ketadi (Silent Data Loss)**.
2.  **Bir vaqtning o'zida 100 ta kassir savdo qilsa (High Concurrency):**
    *   *Natija:* `deductFifo` da tartibsiz qulflar sababli **Deadlocks ko'payib ketadi**. PostgreSQL tranzaksiyalari qulaydi, kassa aparatlari qotadi va mijozlarni kutish vaqti ortadi.
3.  **10 million audit loglari yozilsa (High DB Volume):**
    *   *Natija:* Audit jurnali har bir savdoda sinxron DB yozilishiga bog'langanligi sababli, bazadagi yozish tezligi (Write I/O) sekinlashadi. Tizim partition qilinmagani tufayli har so'rovda kechikishlar yuz beradi.
4.  **Mahsulotlar soni 1 millionga yetsa (Large Catalog):**
    *   *Natija:* Zaxira filtri bilan mahsulot qidirilganda, JS darajasidagi filtr butun massivni RAMga yuklab, **Node.js serverining OOM crash** bo'lishiga sabab bo'ladi.
