-- Działka – rodzinny kalendarz rezerwacji
-- Run this in Supabase → SQL Editor (fresh project)

-- ── Bookings ──────────────────────────────────────────────────────
create table if not exists bookings (
  id         uuid primary key default gen_random_uuid(),
  date       date             not null,
  name       text             not null,
  type       text             not null check (type in ('grill', 'visit', 'work', 'private')),
  note       text,
  created_at timestamptz      not null default now()
);

create index if not exists bookings_date_idx on bookings (date);

alter table bookings enable row level security;

create policy "Public read"   on bookings for select using (true);
create policy "Public insert" on bookings for insert with check (true);
create policy "Public delete" on bookings for delete using (true);

alter publication supabase_realtime add table bookings;

-- ── Groceries ─────────────────────────────────────────────────────
create table if not exists groceries (
  id          uuid        primary key default gen_random_uuid(),
  item        text        not null,
  added_by    text,
  created_at  timestamptz not null default now(),
  is_bought   boolean     not null default false,
  bought_by   text,
  bought_note text,
  bought_at   timestamptz
);

create index if not exists groceries_bought_idx on groceries (is_bought);

alter table groceries enable row level security;

create policy "Public read"   on groceries for select using (true);
create policy "Public insert" on groceries for insert with check (true);
create policy "Public update" on groceries for update using (true);
create policy "Public delete" on groceries for delete using (true);

alter publication supabase_realtime add table groceries;

-- ── Fundraising ───────────────────────────────────────────────────
create table if not exists fundraising (
  id            uuid          primary key default gen_random_uuid(),
  title         text          not null,
  description   text,
  goal_amount   numeric(10,2) not null,
  raised_amount numeric(10,2) not null default 0,
  is_complete   boolean       not null default false,
  creator_name  text          not null,
  created_at    timestamptz   not null default now()
);

create index if not exists fundraising_complete_idx on fundraising (is_complete);

alter table fundraising enable row level security;

create policy "Public read"   on fundraising for select using (true);
create policy "Public insert" on fundraising for insert with check (true);
create policy "Public update" on fundraising for update using (true);

alter publication supabase_realtime add table fundraising;
