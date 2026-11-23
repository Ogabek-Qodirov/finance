# Moliya — Shaxsiy Moliya Boshqaruvi (O'zbekiston)

Heyday Canning Co. vizual uslubidan ilhomlangan zamonaviy, to'liq funksional, retro-modern shaxsiy moliya boshqaruvi veb-ilovasi.

## Asosiy Imkoniyatlar

- **Umumiy ko'rinish (Dashboard):** Jami xarajatlar, jami daromadlar, qolgan sof mablag', oylik budjet va kundalik xarajatlar grafigi.
- **Xarajatlar va Daromadlar CRUD:** Operatsiyalarni qo'shish, o'chirish, tahrirlash (Edit), qidiruv va filtrlash.
- **Statistika va Tahlil:** Oylik taqqoslashlar, eng ko'p xarajat qilingan kun, kategoriyalar doiraviy grafigi (Donut chart).
- **Budjet boshqaruvi:** Oylik xarajat limitini belgilash, 50%, 75%, 90% va 100% holatlarida ogohlantirishlar, 6 oylik budjet tarixi.
- **Kategoriyalar boshqaruvi:** Maxsus kategoriyalar qo'shish, rang tanlash, o'chirishda bog'langan operatsiyalarni xavfsiz boshqa kategoriyaga ko'chirish.
- **Xavfsiz Autentifikatsiya:** Supabase Auth, Row Level Security (RLS) qoidalari bilan har bir foydalanuvchi faqat o'z ma'lumotlarini ko'radi va boshqaradi.
- **O'zbek tili va Milliy standart:** Barcha interfeys lotin alifbosidagi toza o'zbek tilida, valyuta `UZS` (so'm) formatida va vaqt mintaqasi `Asia/Tashkent`.

---

## Texnologiyalar

- **Frontend:** Next.js 14 (App Router), TypeScript, React 18
- **Styling:** Tailwind CSS, Radix UI Primitives, Lucide React
- **Backend & Database:** Supabase (PostgreSQL, Supabase Auth SSR, RLS)
- **Data Visualization:** Recharts
- **Forms & Validation:** React Hook Form + Zod

---

## O'rnatish va Ishga Tushirish

### 1. Talablar
- Node.js 18+ va npm
- [Supabase](https://supabase.com) hisobi (bepul)

### 2. Kutubxonalarni o'rnatish
```bash
npm install
```

### 3. Ma'lumotlar bazasini sozlash (Supabase)
1. [supabase.com](https://supabase.com) ga kiring va yangi loyiha yarating.
2. Chap menyudan **SQL Editor** bo'limiga o'ting.
3. Loyihadagi `supabase/migrations/20240101000000_initial_schema.sql` fayli tarkibini nusxalab, SQL Editorga tashlang va **Run** tugmasini bosing.
   *(Bu barcha jadvallar, RLS qoidalari, triggerlar va standart kategoriyalarni avtomatik yaratadi)*

### 4. Muhit o'zgaruvchilarini sozlash
Loyihadagi `.env.local.example` faylidan nusxa olib, `.env.local` faylini yarating:
```bash
cp .env.local.example .env.local
```
Supabase loyihangizdan (**Project Settings -> API**):
- `Project URL` ni `NEXT_PUBLIC_SUPABASE_URL` ga
- `anon public key` ni `NEXT_PUBLIC_SUPABASE_ANON_KEY` ga qo'ying.

### 5. Dasturni ishga tushirish
```bash
npm run dev
```
Brauzerda `http://localhost:3000` manzilini oching.
