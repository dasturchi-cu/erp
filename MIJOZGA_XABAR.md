# ERP — yangi versiya (Windows 2.0.1, Android 1.0.2)

Assalomu alaykum! Dasturning yangi versiyasi tayyor. Bu versiyada asosan **pul hisob-kitobidagi xatolar** tuzatildi. Iltimos, ikkala ilovani ham yangilang.

## Nimalar tuzatildi

**Pul va qarzlar**
- Mijozning qarz to'lovini bekor qilish endi faqat bir marta ishlaydi. Oldin bir necha marta bosilsa, qarz bir necha barobar oshib ketardi.
- Sotuv bekor qilinsa yoki tovar qaytarilsa, mijozning boshqa qarzlari va oldindan to'lagan puli endi o'chib ketmaydi.
- Aralash to'lovli sotuvda tovar qaytarilsa, qarzdan faqat nasiya qismi ayiriladi.
- Ta'minotchiga bir vaqtda ikki marta to'lov qilinsa ham ortiqcha to'lov o'tmaydi. Dollardagi qarzni ham aniq yopish mumkin.
- Kassa qoldig'i to'g'ri hisoblanadi: qaytim, qaytarilgan pullar va valyutalar endi to'g'ri hisobga olinadi.

**Sotuv**
- Kompyuterdagi kassada **nasiyaga sotish** yana ishlaydi.
- Dollarda naqd sotuv endi "to'lov yetarli emas" xatosi bilan rad etilmaydi.
- Telefonda "To'lov" tugmasini ikki marta bosish ikkita sotuv yaratmaydi.
- Internet uzilib qolsa, telefondagi sotuv qayta yuborilganda takrorlanmaydi. Server rad etgan offline sotuvlar sababi bilan ko'rsatiladi: ularni qayta yuborish yoki o'chirish mumkin.
- Kassir tovarni tannarxidan arzonga sota olmaydi. Buning uchun Admin yoki Menejer ruxsati kerak.
- Qisman qaytarish endi mumkin, masalan 5 donadan 2 tasini qaytarish.
- Chekda sotuv raqami to'g'ri chiqadi.

**Hisobotlar**
- Qaytarilgan tovarlar daromad va foydadan ayiriladi, foyda endi oshib ko'rinmaydi.
- Dashboard qisman qaytarilgan sotuvlarni ham hisobga oladi.
- Hisobotlarda summalar to'g'ri tartibda saralanadi.
- Telefondan barcha hisobot turlarini yaratish mumkin.

**Ombor va mahsulotlar**
- Dollarda kirim qilingan tovarning tannarxi endi to'g'ri yoziladi.
- Narxni o'zgartirganda tannarx o'z-o'zidan buzilmaydi.
- Kasr miqdorlar (masalan 2.5 kg) endi yaxlitlanmaydi.
- Mahsulot ko'p bo'lsa ham hammasi ro'yxatda chiqadi va qidiruv orqali topiladi.
- Eksport barcha qatorlarni chiqaradi.

**Xavfsizlik va barqarorlik**
- Kassir xarajatlarni o'chira olmaydi va zaxira nusxadan tiklash qila olmaydi.
- Kassir faqat o'z sotuvlarini ko'radi.
- Har bir telefon endi alohida qurilma sifatida ro'yxatdan o'tadi, shuning uchun bitta telefonni bloklash boshqalariga ta'sir qilmaydi.
- Internet yoki server vaqtincha ishlamay qolsa, dastur sizni tizimdan chiqarib yubormaydi.
- Telefonda Bluetooth printer Android 12 va undan yangi versiyalarda ishlaydi.
- Ilova yangilanishlari imzo bilan tekshiriladi.
- Kompyuterdagi bir nechta sahifalar endi to'xtab qolmaydi: chek, sotuv tafsiloti va qaytarish.

## O'rnatish

**Windows:**
1. `ERP Setup 2.0.1.exe` faylini ishga tushiring.
2. Windows "noma'lum dastur" deb ogohlantirsa, **"Подробнее / More info" → "Выполнить / Run anyway"** ni bosing.

**Android:**
1. `ERP-1.0.2.apk` faylini oching.
2. "Noma'lum manbalardan o'rnatish"ga ruxsat bering.
3. Agar **"Ilova o'rnatilmadi"** chiqsa, avval eski ERP ilovasini o'chiring, keyin qayta o'rnating. Bu faqat bir marta kerak bo'ladi.

Ma'lumotlaringiz serverda saqlanadi, shuning uchun qayta o'rnatganda hech narsa yo'qolmaydi. Faqat telefonda yuborilmay qolgan offline sotuv bo'lsa, eski ilovani o'chirishdan oldin internetga ulanib, Dashboard'dagi **"Sinxronlash"** tugmasini bosing.

## Tizimga kirish va ishlash tartibi

### 1. Kirish
- **Email** va **parol** bilan kiring. Login va parolni administratoringiz beradi.
- Parol noto'g'ri bo'lsa, "Email yoki parol noto'g'ri" xabari chiqadi.

### 2. Kompaniya tanlash
- Sizda bitta kompaniya bo'lsa, dastur to'g'ridan-to'g'ri ochiladi.
- Bir nechta kompaniya bo'lsa (masalan Market, Somafix, Lantian), ro'yxatdan kerakligini tanlang.
- Har bir kompaniyaning ma'lumotlari alohida saqlanadi.
- Kompaniyani keyin ham almashtirish mumkin. Almashtirganda kassa savati tozalanadi.

### 3. Rollar — kim nima qila oladi

| Rol | Imkoniyatlar |
|-----|--------------|
| **Admin** | Hamma narsa: foydalanuvchilar, qurilmalar, sozlamalar, zaxira nusxa, barcha hisobotlar |
| **Menejer** | Sotuv, ombor, mijozlar, ta'minotchilar, xarajatlar, hisobotlar, valyuta kursi. Tannarxdan arzon sotishga ruxsat bera oladi |
| **Kassir** | Sotuv, qaytarish, mijoz qarzini qabul qilish, xarajat yozish. Faqat o'z sotuvlarini ko'radi |
| **Omborchi** | Mahsulotlar, kirim, chiqim, ko'chirish, ta'minotchilar |

Kerakli tugma yoki menyu ko'rinmasa, sizning rolingizda unga ruxsat yo'q. Administratorga murojaat qiling.

### 4. Sessiya va qurilmalar
- Bir marta kirsangiz, dastur sizni **30 kun** eslab qoladi va o'zi yangilanib turadi.
- Bitta foydalanuvchi bir vaqtda kompyuter, telefon va planshetdan kirishi mumkin.
- Admin istalgan qurilmani **bloklashi** yoki sessiyasini **tugatishi** mumkin. Bunday holda o'sha qurilmada "Qurilma bloklangan" yoki "Sessiya tugadi" xabari chiqadi.
- **Chiqish** tugmasi sessiyani serverda ham yopadi.

### 5. Internet bo'lmasa (telefon)
- Telefonda internet uzilsa ham sotuv qilish mumkin: sotuv telefonda saqlanadi.
- Internet qaytgach, Dashboard'dagi "Sinxronlash" tugmasini bosing va sotuvlar serverga yuboriladi.
- Offline sotuv faqat uni qilgan foydalanuvchi va kompaniya nomidan yuboriladi.

### 6. Barcha qurilmalar bitta bazada
- Kompyuterda kiritilgan mahsulot, narx, sotuv yoki to'lov telefonda ham ko'rinadi, chunki hammasi bitta serverda.
- Valyuta kursini Admin yoki Menejer o'rnatadi. Barcha dollar hisoblari shu kurs bo'yicha bajariladi.

Savollar bo'lsa, bemalol yozing!
