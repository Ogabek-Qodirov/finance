# Moliya Ilovasini Ishga Tushirish Bo'yicha Qisqa Yo'riqnoma

Ushbu yo'riqnoma orqali bir necha daqiqada loyihani to'liq ishga tushirishingiz mumkin.

### 1-qadam: Kutubxonalarni o'rnatish
Terminalda loyiha papkasiga kiring va quyidagi buyruqni bering:
```bash
npm install
```

### 2-qadam: Supabase ma'lumotlar bazasini ulash
1. [supabase.com](https://supabase.com) saytiga kiring va **New Project** tugmasi orqali yangi loyiha oching.
2. Loyihangiz tayyor bo'lgach, chap paneldagi **SQL Editor** bo'limiga o'ting.
3. `supabase/migrations/20240101000000_initial_schema.sql` faylidagi barcha kodni SQL Editorga tashlab, **Run** tugmasini bosing.

### 3-qadam: API kalitlarini joylashtirish
Loyiha papkasida `.env.local` faylini yarating va quyidagi kalitlarni kiriting:
```env
NEXT_PUBLIC_SUPABASE_URL=https://sizning-loyihangiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sizning-anonim-kalitingiz
```
*(Ushbu kalitlarni Supabase boshqaruv panelining **Project Settings -> API** bo'limidan olishingiz mumkin)*

### 4-qadam: Serverni ishga tushirish
```bash
npm run dev
```

Brauzerda `http://localhost:3000` ga kiring, ro'yxatdan o'ting va moliyangizni boshqarishni boshlang!
