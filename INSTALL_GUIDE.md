# ERP O'rnatish va Serverga Joylash Yo'riqnomasi

Ushbu hujjat ERP dasturini lokal kompyuterlarga (offline ishlatish uchun) hamda bulutli serverga (online/telefon orqali ishlatish uchun) sozlash qoidalarini belgilaydi.

---

## 1. Lokal (Offline) Mijozlarga O'rnatish Qoidalari

Lokal mijozlarga o'rnatishda ularning kompyuterlarida **Docker o'rnatish shart emas**. Barcha zarur narsalar portable (ko'chma) formatda yuklab olinadi.

### O'rnatish Qadamlari:
1. Loyiha fayllarini to'liqligicha mijoz kompyuteridagi kerakli papkaga (masalan, `C:\ERP` yoki `D:\ERP`) nusxalang.
2. Terminalni **Administrator** (Run as Administrator) huquqi bilan oching.
3. Loyiha papkasiga kirib, o'rnatish skriptini ishga tushiring:
   ```powershell
   cd D:\erp1
   .\scripts\setup-local.ps1
   ```
4. Skript avtomatik ravishda `.tools` papkasini ochib, uning ichiga Node.js va PostgreSQL portable versiyalarini yuklab oladi, ma'lumotlar bazasini initsializatsiya qiladi, `.env` fayllarni to'g'rilaydi va loyiha papkasida `Run-ERP.bat` faylini yaratadi.

### Kundalik Ishga Tushirish:
* O'rnatish tugagach, dasturni yoqish uchun loyiha papkasidagi **`Run-ERP.bat`** faylini ikki marta bosing.
* U PostgreSQL, backend va frontendni avtomatik yoqib, brauzerda `http://127.0.0.1:5173` sahifasini ochib beradi.
* **Kirish ma'lumotlari:**
  * **Login:** `admin@erp.uz`
  * **Parol:** `Admin123!`

### Electron Package (.exe tayyorlash):
Dasturni bitta yagona `.exe` o'rnatgich sifatida yig'ish uchun `desktop` papkasida quyidagi buyruqni bering:
```powershell
cd desktop
npm run electron:build
```
Yig'ilgan o'rnatuvchi fayl `desktop/release` papkasida yaratiladi. Uning ichiga Node.js va backend kodi avtomatik jamlanadi va dastur ochilganda backendni fonda o'zi yoqadi.

---

## 2. Serverga (Cloud/SaaS) Deploy Qilish Qoidalari

Mijoz dasturni internet orqali telefonda ham, kompyuterda ham ishlatmoqchi bo'lsa, uni Linux (Ubuntu) serverga joylash kerak.

### O'rnatish Qadamlari:
1. Yangi toza **Ubuntu** server sotib oling (kamida 2GB tezkor xotira - RAM bo'lishi tavsiya etiladi).
2. Loyiha fayllarini serverga joylang.
3. Server terminalida loyiha papkasiga kirib, quyidagi buyruqlarni bering:
   ```bash
   sudo chmod +x scripts/deploy.sh
   sudo ./scripts/deploy.sh
   ```
4. Skript sizdan **domenni** so'raydi (masalan: `app.sizning-erpingiz.uz`). Domenni kiritsangiz:
   * Docker va Docker Compose o'rnatiladi.
   * Xavfsiz random JWT kalitlari bilan `.env` fayli shakllanadi.
   * Konteynerlar ko'tariladi (`docker-compose.prod.yml`).
   * Database migratsiyalari va boshlang'ich ma'lumotlar (`seed`) yuritiladi.
   * Nginx reverse proxy sozlanadi.
   * Let's Encrypt orqali bepul **SSL (HTTPS)** yoqiladi (yashil qulfcha belgisi).

### Ishga Tushirish:
* Server o'rnatilgach, istalgan qurilmadan (kompyuter, telefon) `https://sizning-domeningiz.uz` manziliga kirib foydalanilaveradi.
* **Kirish ma'lumotlari:** `admin@erp.uz` / `Admin123!`
