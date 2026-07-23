# ERP_MASTER_PLAN.md

# LOYIHA MAQSADI

Ushbu loyiha professional Enterprise Resource Planning (ERP) tizimi hisoblanadi.

Tizim quyidagi biznes yo'nalishlari uchun ishlab chiqiladi:

* Qurilish mollari
* Mebel zapchastlari
* Narvonlar
* Instrumentlar
* Germetik mahsulotlar
* Ulgurji savdo
* Chakana savdo

Tizim real biznesda foydalanishga tayyor bo'lishi kerak.

Maqsad:

* Korxonaning barcha jarayonlarini boshqarish
* Savdo nazorati
* Ombor nazorati
* Qarzdorlik nazorati
* Mijozlar bazasi
* Moliyaviy hisobotlar
* Realtime ma'lumot almashinuvi
* Multi-device ishlash

---

# ISHLASH PRINSIPI

Tizim markaziy serverda ishlaydi.

Barcha qurilmalar:

* Windows Desktop
* Android
* iPhone
* iPad
* Kelajakda MacOS

bir xil ma'lumotlar bazasi bilan ishlaydi.

Misol:

Windows kompyuterda mahsulot qo'shilsa:

* Telefonlarda ko'rinishi kerak
* Boshqa kompyuterlarda ko'rinishi kerak
* Dashboardda yangilanishi kerak

Realtime ishlashi kerak.

---

# REALTIME TIZIM

Tizim realtime bo'lishi kerak.

Har qanday:

* Mahsulot qo'shilishi
* Mahsulot o'chirilishi
* Narx o'zgarishi
* Sotuv
* To'lov
* Qarzdorlik
* Kurs o'zgarishi

barcha qurilmalarda avtomatik yangilanishi kerak.

Texnologiya:

* WebSocket
* Realtime Notifications

---

# MULTI DEVICE

Bir foydalanuvchi:

* Kompyuter
* Telefon
* Planshet

orqali tizimga kira olishi kerak.

Admin istalgan qurilmani:

* bloklay olishi
* chiqarib yuborishi
* sessiyasini tugatishi

kerak.

---

# MULTI COMPANY

Tizim bir nechta kompaniyani boshqarishi kerak.

Misollar:

* Market
* O'O'MQ
* Xitoy Tovar
* Somafix
* Lantian

Har bir kompaniya ma'lumotlari alohida saqlanadi.

Company Isolation majburiy.

Bir kompaniya:

* boshqa kompaniya mahsulotini
* mijozlarini
* qarzlarini

ko'ra olmasligi kerak.

---

# ROLLAR

Admin

Menejer

Kassir

Omborchi

Kelajakda yangi rollar qo'shish oson bo'lishi kerak.

---

# ADMIN PANEL

Admin tizim ustidan to'liq nazoratga ega bo'lishi kerak.

Admin:

* foydalanuvchi yaratadi
* foydalanuvchini bloklaydi
* foydalanuvchini faollashtiradi
* rol beradi
* rolni olib tashlaydi

Admin quyidagilarni boshqaradi:

* Qurilmalar
* Sessiyalar
* Kompaniyalar
* Rollar
* Permissionlar
* Modullar

---

# MODUL BOSHQARUVI

Admin istalgan modulni:

* o'chirishi
* vaqtincha bloklashi
* qayta yoqishi

kerak.

Misol:

Sales moduli yopilsa:

Sales menyusi barcha foydalanuvchilarda yopiladi.

---

# QURILMALAR BOSHQARUVI

Admin ko'rishi kerak:

* Qaysi qurilma
* Kim kirgan
* Qachon kirgan
* IP manzil
* Operatsion tizim

Admin:

* logout qilishi
* bloklashi
* qayta ochishi

kerak.

---

# MAHSULOTLAR

Mahsulotlar:

* SKU
* Barcode
* Nomi
* Kategoriya
* Ombor miqdori

Narxlar:

* Olish UZS
* Olish USD
* Sotish UZS
* Sotish USD

Ko'rsatilsin:

* Jami olish summa UZS
* Jami olish summa USD
* Jami sotish summa UZS
* Jami sotish summa USD

---

# UZS/USD TIZIMI

Bu loyiha uchun eng muhim qism.

Mahsulot:

* UZS da sotilishi mumkin
* USD da sotilishi mumkin

Har bir operatsiyada saqlansin:

* Original Currency
* Exchange Rate Used

Tarixiy ma'lumotlar o'zgarmasligi kerak.

---

# FIFO

FIFO majburiy.

Eng eski kirim birinchi sotiladi.

Partiyalar saqlansin.

Misol:

100 dona @ 10000

100 dona @ 12000

Sotilganda:

avval 10000 lik partiyadan yechiladi.

---

# MIJOZLAR

Mijoz kartasi:

* Ism
* Telefon
* Manzil
* Hamkorlik boshlangan sana
* Oxirgi to'lov sanasi
* Umumiy qarz

Ko'rsatilsin:

* Xaridlar
* To'lovlar
* Qarzdorlik

---

# QARZDORLIK

Qo'llab-quvvatlansin:

* Qarz
* Qisman to'lov
* To'liq to'lov

Tarix saqlansin.

---

# AUDIT LOG

Har bir amal yozilsin.

Create

Update

Delete

Sale

Payment

Return

Login

Logout

Saqlansin:

* Kim bajardi
* Qachon
* Eski qiymat
* Yangi qiymat

---

# DASHBOARD

Ko'rsatilsin:

* Kunlik savdo
* Haftalik savdo
* Oylik savdo
* Yillik savdo
* Foyda
* Qarzdorlik
* Ombor qiymati
* Top mahsulotlar

UZS va USD alohida ko'rsatilsin.

---

# HISOBOTLAR

PDF

Excel

CSV

Eksport qo'llab-quvvatlansin.

---

# BACKUP

Har kuni:

PostgreSQL Backup

ZIP Archive

yaratilsin.

Saqlash:

* Local
* Cloud

---

# SERVER

Production serverda ishlashi kerak.

Qo'llab-quvvatlansin:

* Docker
* Nginx
* HTTPS
* SSL
* Monitoring

---

# DESKTOP

Electron

React

TypeScript

Professional ERP UI

Dark Mode

Light Mode

---

# MOBILE

Flutter

Material Design 3

Android

iPhone

Responsive

---

# KELAJAK UCHUN

Tizim keyinchalik:

* Marketplace
* Telegram Bot
* SMS
* CRM
* Accounting
* AI Analytics

qo'shishga tayyor bo'lishi kerak.

---

# YAKUNIY MAQSAD

O'zbekistondagi real korxonalarda ishlatish mumkin bo'lgan professional ERP tizimini yaratish.

Tizim:

* Tez
* Xavfsiz
* Kengaytiriladigan
* Multi-device
* Multi-company
* UZS/USD
* FIFO
* Production Ready

bo'lishi shart.
