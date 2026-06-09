-- ============================================================
-- JRS — nightly reproducibility history (append-only) + study_runs read
-- Run once in Supabase SQL Editor. Safe to re-run.
-- ============================================================
create table if not exists public.findings_history (
  id                uuid primary key default gen_random_uuid(),
  study_id          text,
  headline          text,
  classification    text,
  overall_agreement numeric,
  per_record        jsonb,
  k                 integer,
  records           integer,
  model             text,
  metrics           jsonb,
  created_at        timestamptz not null default now()
);
alter table public.findings_history enable row level security;
drop policy if exists "read findings history" on public.findings_history;
create policy "read findings history" on public.findings_history
  for select to anon using (true);
-- run-study.js writes with the service role (bypasses RLS); anon may read.

-- Expose per-run study history for the Data Room.
drop policy if exists "read study runs" on public.study_runs;
create policy "read study runs" on public.study_runs
  for select to anon using (true);
