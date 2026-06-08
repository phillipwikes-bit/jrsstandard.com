-- ============================================================
-- JRS Review Engine — recorded reviews
-- Run once: Supabase -> SQL Editor -> paste -> Run. Safe to re-run.
-- The engine (api/review-engine.js) writes one row per review using the
-- service role. Stored: structured result + a 200-char input preview only.
-- ============================================================
create table if not exists public.engine_reviews (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  request_id          text,
  determination       text,
  conditions          jsonb,
  finding             jsonb,
  runs                integer default 1,
  overall_consistency numeric,
  input_preview       text,
  engine_version      text
);
alter table public.engine_reviews enable row level security;

-- Public may read recorded reviews (the input is a short preview, not the full record).
drop policy if exists "read engine reviews" on public.engine_reviews;
create policy "read engine reviews" on public.engine_reviews
  for select to anon using (true);
-- No anon insert: the edge function writes with the service role, which bypasses RLS.
