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

-- Recording-preflight health table. NOT part of the evidence ladder: no records, no judgments,
-- no results; never shown on any results surface or export. The reviewer tool inserts a row at
-- session start to prove the datastore is reachable and writable, then deletes it immediately.
-- The delete is best-effort: an occasional orphan row is acceptable debris (never shown/exported).
create table if not exists public.bench_preflight (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now()
);
alter table public.bench_preflight enable row level security;
drop policy if exists "preflight insert" on public.bench_preflight;
create policy "preflight insert" on public.bench_preflight for insert to anon with check (true);
drop policy if exists "preflight read" on public.bench_preflight;
create policy "preflight read" on public.bench_preflight for select to anon using (true);
drop policy if exists "preflight delete" on public.bench_preflight;
create policy "preflight delete" on public.bench_preflight for delete to anon using (true);

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

-- ===== illustrative demo set (so the results page shows a working example) =====
-- Clearly marked record_type 'illustrative-demo'. The answer key here is a provisional
-- placeholder written by one author, NOT an expert consensus. Real Rung 2 numbers come
-- from records scored by reviewers whose codes start with 'E'.
insert into public.bench_records (id, text, record_type, ai_function, kind, active) values
 ('00000000-0000-0000-0000-0000000000a1','Michael has demonstrated increasingly unprofessional conduct over the last several weeks. His poor attitude has negatively affected team morale and productivity. Despite previous coaching conversations, meaningful improvement has not been observed.','illustrative-demo','narrative','constructed',true),
 ('00000000-0000-0000-0000-0000000000a2','Over the past quarter the employee submitted several reports after the deadline. A meeting was held in March to discuss timeliness. Some improvement was observed, though issues reportedly continued.','illustrative-demo','summarization','constructed',true),
 ('00000000-0000-0000-0000-0000000000a3','On March 4, 11, and 18 the weekly report was submitted after the Friday 5:00 PM deadline (timestamps in the shared drive). On March 20 the manager met with the employee; notes are on file. Training was scheduled for March 27; from March 27 to April 30 all reports were on time (shared-drive log).','illustrative-demo','analysis','constructed',true)
on conflict (id) do nothing;

insert into public.bench_gold (record_id, conditions, determination) values
 ('00000000-0000-0000-0000-0000000000a1','{"basis_identification":"gap","reasoning_traceability":"gap","cold_reviewer_clarity":"gap","accountability_support":"gap","temporal_reconstructability":"gap"}','gap_identified'),
 ('00000000-0000-0000-0000-0000000000a2','{"basis_identification":"review","reasoning_traceability":"review","cold_reviewer_clarity":"review","accountability_support":"review","temporal_reconstructability":"review"}','review_required'),
 ('00000000-0000-0000-0000-0000000000a3','{"basis_identification":"pass","reasoning_traceability":"pass","cold_reviewer_clarity":"pass","accountability_support":"pass","temporal_reconstructability":"pass"}','ready')
on conflict (record_id) do nothing;

-- ===== expert credentials (PRIVATE — documents who set the answer key) =====
-- Captured when a reviewer code starts with 'E'. Anon may register; there is NO
-- anon read, so names/titles never appear in the public Data Room or exports.
-- Read them in the Supabase Table Editor (or with the service role) only.
create table if not exists public.bench_experts (
  id               uuid primary key default gen_random_uuid(),
  code             text,
  name             text,
  title            text,
  credential       text,
  years_experience text,
  affiliation      text,
  email            text,
  created_at       timestamptz not null default now()
);
alter table public.bench_experts enable row level security;
drop policy if exists "register expert" on public.bench_experts;
create policy "register expert" on public.bench_experts
  for insert to anon with check (char_length(coalesce(code,'')) >= 1);
-- (no select policy for anon: expert identities stay private)
