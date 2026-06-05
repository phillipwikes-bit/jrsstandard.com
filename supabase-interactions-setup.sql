-- ============================================================
-- JRS Finding page interactions: poll voting + private responses
-- Run once: Supabase -> SQL Editor -> paste -> Run. Safe to re-run.
-- ============================================================

-- 1) Poll votes. No PII (just a letter). Tallies are public.
create table if not exists public.finding_poll_votes (
  id         uuid primary key default gen_random_uuid(),
  study_id   text not null default 'STUDY-001',
  choice     text not null,                 -- 'A' | 'B' | 'C' | 'D'
  created_at timestamptz not null default now()
);
alter table public.finding_poll_votes enable row level security;

drop policy if exists "insert poll vote" on public.finding_poll_votes;
create policy "insert poll vote" on public.finding_poll_votes
  for insert to anon with check (choice in ('A','B','C','D'));

drop policy if exists "read poll votes" on public.finding_poll_votes;
create policy "read poll votes" on public.finding_poll_votes
  for select to anon using (true);

-- 2) Private responses. Anon may INSERT only; there is NO anon select
--    policy, so responses are never publicly readable. You read them in
--    the Supabase Table Editor (or with the service role).
create table if not exists public.finding_responses (
  id         uuid primary key default gen_random_uuid(),
  study_id   text default 'STUDY-001',
  prompt     text,                          -- which prompt the response addresses
  response   text,
  created_at timestamptz not null default now()
);
alter table public.finding_responses enable row level security;

drop policy if exists "insert response" on public.finding_responses;
create policy "insert response" on public.finding_responses
  for insert to anon with check (char_length(response) <= 4000);
-- (no select / update / delete policy for anon: responses stay private)
