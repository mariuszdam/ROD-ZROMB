# 🌿 Działka – Kalendarz Rodzinny

Rodzinny kalendarz rezerwacji dla działki. Real-time, bez logowania, darmowy hosting.

---

## 🚀 Uruchomienie krok po kroku

### 1. Utwórz bazę danych w Supabase (darmowe)

1. Wejdź na [supabase.com](https://supabase.com) → **Start for free** → utwórz konto
2. Kliknij **New project** → nadaj nazwę (np. `dzialka-kalendarz`) → ustaw hasło → wybierz region **Central EU (Frankfurt)**
3. Poczekaj ~2 min na uruchomienie projektu
4. Przejdź do **SQL Editor** (ikonka w lewym menu) i uruchom:

```sql
create table bookings (
  id         uuid default gen_random_uuid() primary key,
  date       date not null,
  name       text not null,
  type       text not null check (type in ('grill','visit','work')),
  note       text,
  created_at timestamptz default now()
);

-- Zezwól na publiczny odczyt i zapis (bez logowania)
alter table bookings enable row level security;

create policy "Publiczny odczyt"
  on bookings for select using (true);

create policy "Publiczny zapis"
  on bookings for insert with check (true);

create policy "Publiczne usuwanie"
  on bookings for delete using (true);
```

5. Skopiuj klucze z **Settings → API**:
   - `Project URL` → to jest `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → to jest `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### 2. Wrzuć projekt na GitHub

1. Utwórz repozytorium na [github.com](https://github.com) (prywatne lub publiczne)
2. W folderze projektu:

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/TWOJ_LOGIN/dzialka-kalendarz.git
git push -u origin main
```

---

### 3. Opublikuj na Vercel (darmowe)

1. Wejdź na [vercel.com](https://vercel.com) → zaloguj się GitHubem
2. Kliknij **Add New → Project** → wybierz repozytorium `dzialka-kalendarz`
3. W sekcji **Environment Variables** dodaj:
   - `NEXT_PUBLIC_SUPABASE_URL` = adres z Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = klucz anon z Supabase
4. Kliknij **Deploy** → za minutę dostaniesz link np. `dzialka-kalendarz.vercel.app`

---

### 4. Udostępnij rodzinie

Wyślij link na Messengerze – każdy klika, otwiera w przeglądarce, **bez rejestracji, bez logowania**.

Dane aktualizują się **na żywo** – gdy ktoś doda rezerwację, wszyscy widzą ją natychmiast.

---

## 💰 Koszty

| Usługa   | Plan      | Koszt        |
|----------|-----------|--------------|
| Vercel   | Hobby     | **Darmowy**  |
| Supabase | Free tier | **Darmowy**  |

Darmowy tier Supabase: 500 MB bazy, 50k requestów/dzień – w zupełności wystarczy dla rodziny.

---

## 🛠️ Lokalne uruchomienie

```bash
# Skopiuj plik z kluczami
cp .env.local.example .env.local
# Uzupełnij klucze Supabase w .env.local

npm install
npm run dev
# → http://localhost:3000
```

---

## 📱 Rodzaje wydarzeń

| Emoji | Nazwa             |
|-------|-------------------|
| 🔥    | Grill rodzinny    |
| 🌱    | Zwykła wizyta     |
| 🛠️    | Prace na działce  |
