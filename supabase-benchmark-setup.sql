-- ============================================================
-- JRS Benchmark Workspace — schema (rungs 2 & 3 tooling)
-- Run once in Supabase SQL Editor. Safe to re-run.
-- ============================================================

-- Shared record bank (the set everyone reviews).
create table if not exists public.bench_records (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  record_type text,
  ai_function text,
  kind        text default 'constructed',  -- constructed | real
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.bench_records enable row level security;
drop policy if exists "read active records" on public.bench_records;
create policy "read active records" on public.bench_records
  for select to anon using (active = true);
-- the intake form may submit REAL records as pending (inactive) for de-id review:
drop policy if exists "submit real record" on public.bench_records;
create policy "submit real record" on public.bench_records
  for insert to anon with check (kind = 'real' and active = false and char_length(text) between 20 and 8000);

-- Human scores (one row per reviewer per record per mode).
create table if not exists public.bench_labels (
  id           uuid primary key default gen_random_uuid(),
  record_id    uuid,
  labeler_code text,                 -- pseudonymous invite code / reviewer id
  role         text,
  mode         text default 'jrs',   -- jrs | normal
  conditions   jsonb,                -- {basis_identification:'pass|review|gap', ...}
  determination text,                -- ready | review_required | gap_identified
  note         text,
  created_at   timestamptz not null default now()
);
alter table public.bench_labels enable row level security;
drop policy if exists "insert label" on public.bench_labels;
create policy "insert label" on public.bench_labels
  for insert to anon with check (char_length(coalesce(labeler_code,'')) between 1 and 80);
drop policy if exists "read labels" on public.bench_labels;
create policy "read labels" on public.bench_labels for select to anon using (true);

-- Consensus answer key (set by admin via api/bench-admin, service role).
create table if not exists public.bench_gold (
  id           uuid primary key default gen_random_uuid(),
  record_id    uuid unique,
  conditions   jsonb,
  determination text,
  created_at   timestamptz not null default now()
);
alter table public.bench_gold enable row level security;
drop policy if exists "read gold" on public.bench_gold;
create policy "read gold" on public.bench_gold for select to anon using (true);

-- AI engine verdicts per record (written by admin scoring run, service role).
create table if not exists public.bench_ai_verdicts (
  id           uuid primary key default gen_random_uuid(),
  record_id    uuid,
  conditions   jsonb,
  determination text,
  model        text,
  created_at   timestamptz not null default now()
);
alter table public.bench_ai_verdicts enable row level security;
drop policy if exists "read ai verdicts" on public.bench_ai_verdicts;
create policy "read ai verdicts" on public.bench_ai_verdicts for select to anon using (true);

-- Downstream outcomes (criterion validity).
create table if not exists public.bench_outcomes (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid,
  outcome    text,    -- e.g. held_up | challenged | failed_audit | failed_appeal
  note       text,
  created_at timestamptz not null default now()
);
alter table public.bench_outcomes enable row level security;
drop policy if exists "insert outcome" on public.bench_outcomes;
create policy "insert outcome" on public.bench_outcomes for insert to anon with check (true);
drop policy if exists "read outcomes" on public.bench_outcomes;
create policy "read outcomes" on public.bench_outcomes for select to anon using (true);
