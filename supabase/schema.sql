-- Działka – rodzinny kalendarz rezerwacji
-- Run this in Supabase → SQL Editor

create table if not exists bookings (
  id         uuid primary key default gen_random_uuid(),
  date       date             not null,
  name       text             not null,
  type       text             not null check (type in ('grill', 'visit', 'work')),
  note       text,
  created_at timestamptz      not null default now()
);

-- Index for fast date lookups
create index if not exists bookings_date_idx on bookings (date);

-- Enable Row Level Security
alter table bookings enable row level security;

-- Allow anyone to read bookings (public family calendar)
create policy "Public read"
  on bookings for select
  using (true);

-- Allow anyone to insert bookings
create policy "Public insert"
  on bookings for insert
  with check (true);

-- Allow anyone to delete bookings
create policy "Public delete"
  on bookings for delete
  using (true);

-- Enable realtime
alter publication supabase_realtime add table bookings;
