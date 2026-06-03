-- ============================================================
-- JRS Pilot data collection — Supabase setup (run once)
--   Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================

-- A) Pilot contact-form submissions (mirrors the Formspree email)
create table if not exists public.pilot_contacts (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text,
  email        text,
  organization text,
  message      text,
  source       text
);
alter table public.pilot_contacts enable row level security;
drop policy if exists "anon can insert contacts" on public.pilot_contacts;
create policy "anon can insert contacts"
  on public.pilot_contacts for insert to anon with check (true);

-- B) Extended Review (3-record challenge) responses
create table if not exists public.extended_reviews (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  participant_id      text,
  role                text,
  email               text,
  consent_aggregate   boolean,
  consent_updates     boolean,
  consent_recognition boolean,
  recognition_name    text,
  record_order        text,
  responses           jsonb,
  summary             jsonb
);
alter table public.extended_reviews enable row level security;
drop policy if exists "anon can insert reviews" on public.extended_reviews;
create policy "anon can insert reviews"
  on public.extended_reviews for insert to anon with check (true);

-- Both tables are insert-only for the public; you read/export them in the
-- Supabase Table Editor. No personal data is exposed publicly.
