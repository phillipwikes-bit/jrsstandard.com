-- ============================================================
-- JRS Evidence Development Program — research backend schema
-- Run once: Supabase -> SQL Editor -> paste -> Run
-- ============================================================

-- 1) Study registry
create table if not exists public.studies (
  id          text primary key,           -- e.g. 'STUDY-001'
  title       text not null,
  status      text not null default 'planned',  -- planned | design | collecting | active
  description text,
  created_at  timestamptz not null default now()
);

-- 2) Individual automated runs (one row per execution)
create table if not exists public.study_runs (
  id          uuid primary key default gen_random_uuid(),
  study_id    text references public.studies(id),
  model       text,
  created_at  timestamptz not null default now(),
  metrics     jsonb,        -- e.g. {"agreement":0.82,"runs":5}
  raw         jsonb         -- optional raw outputs for audit
);

-- 3) Published findings (the only thing shown publicly)
create table if not exists public.findings (
  id          uuid primary key default gen_random_uuid(),
  study_id    text references public.studies(id),
  created_at  timestamptz not null default now(),
  headline    text,
  body        text,
  metrics     jsonb,
  published   boolean not null default false,   -- gate: only true rows are public
  evidence_class text default 'observational'   -- observational | reproducibility | accuracy
);

-- 4) Security
alter table public.studies     enable row level security;
alter table public.study_runs  enable row level security;
alter table public.findings    enable row level security;

-- Public may READ the study registry and PUBLISHED findings only.
drop policy if exists "read studies" on public.studies;
create policy "read studies" on public.studies for select to anon using (true);

drop policy if exists "read published findings" on public.findings;
create policy "read published findings" on public.findings
  for select to anon using (published = true);

-- No anon policies on study_runs or for writing findings/studies:
-- the Edge Function writes with the service_role key, which bypasses RLS.
-- (Set publication policy in the function: auto-publish, or insert with published=false
--  for human approval — your choice.)

-- 5) Seed the registry
insert into public.studies (id,title,status,description) values
 ('STUDY-001','AI Reproducibility','planned','Repeated model review of the same records; measures consistency.'),
 ('STUDY-002','Ground-Truth Benchmark','planned','Compare outputs to expert benchmark mappings (accuracy).'),
 ('STUDY-003','Condition Performance','design','Per-condition agreement and dispute patterns.'),
 ('STUDY-004','Framework Ambiguity','design','Reviewer variance and record ambiguity.'),
 ('STUDY-005','Continuous Replication','planned','Scheduled re-runs; drift and stability.'),
 ('STUDY-006','Participant Recognition','collecting','Recognition patterns from challenges.'),
 ('STUDY-007','Learning Effect','planned','First vs. subsequent attempts.'),
 ('STUDY-008','Professional Reviewer','collecting','Patterns by reviewer profession.'),
 ('STUDY-009','Org-Psychology Readiness','collecting','Reliability/behavioral datasets for review.')
on conflict (id) do nothing;
