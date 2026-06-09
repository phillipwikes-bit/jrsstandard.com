-- ============================================================
-- JRS — COMPLETE DATA LAYER (one paste). Run once in Supabase SQL Editor.
-- Safe to re-run. Creates every table/view/policy the platform records into,
-- so the Research Data Room (research-data.html) shows everything.
-- ============================================================

-- Base participation tables (created if missing; existing ones are left as-is).
create table if not exists public.omc_responses (
  id uuid primary key default gen_random_uuid(),
  participant_id text, answer text, why text, role text,
  first_name text, last_name text, email text,
  consent_updates boolean, consent_aggregate boolean, consent_recognition boolean,
  referrer text, utm_source text, utm_medium text, utm_campaign text,
  session_source text, device_type text, completion_status text,
  created_at timestamptz not null default now()
);
alter table public.omc_responses enable row level security;
drop policy if exists "insert omc" on public.omc_responses;
create policy "insert omc" on public.omc_responses for insert to anon with check (true);

create table if not exists public.extended_reviews (
  id uuid primary key default gen_random_uuid(),
  participant_id text, role text, email text,
  consent_updates boolean, consent_aggregate boolean, consent_recognition boolean,
  recognition_name text, record_order text, responses jsonb, summary text,
  created_at timestamptz not null default now()
);
alter table public.extended_reviews enable row level security;
drop policy if exists "insert extended" on public.extended_reviews;
create policy "insert extended" on public.extended_reviews for insert to anon with check (true);

create table if not exists public.pilot_contacts (
  id uuid primary key default gen_random_uuid(),
  name text, email text, organization text, message text, source text,
  created_at timestamptz not null default now()
);
alter table public.pilot_contacts enable row level security;
drop policy if exists "insert pilot contact" on public.pilot_contacts;
create policy "insert pilot contact" on public.pilot_contacts for insert to anon with check (true);

-- ===== research tables =====
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

-- ===== engagement (findings columns, questions, rpc) =====
-- ============================================================
-- JRS Research Findings Engagement Engine — schema additions
-- Run once, AFTER supabase-research-setup.sql:
--   Supabase -> SQL Editor -> paste -> Run.  Safe to re-run.
-- Turns each published finding into a discussion object and
-- registers the open research questions visitors can follow.
-- ============================================================

-- 1) Enrich findings with discussion / LinkedIn / classification fields.
--    api/run-study.js populates these on every run.
alter table public.findings add column if not exists observation       text;
alter table public.findings add column if not exists research_question text;
alter table public.findings add column if not exists discussion        text;
alter table public.findings add column if not exists debate            text;
alter table public.findings add column if not exists poll              jsonb;
alter table public.findings add column if not exists challenge         text;
alter table public.findings add column if not exists classification    text default 'Observation';
alter table public.findings add column if not exists linkedin_short    text;
alter table public.findings add column if not exists linkedin_long     text;
alter table public.findings add column if not exists supporting_data   text;
alter table public.findings add column if not exists views             integer not null default 0;

-- 2) Research Questions registry (Questions Under Investigation).
create table if not exists public.research_questions (
  id            uuid primary key default gen_random_uuid(),
  question      text not null,
  status        text not null default 'Collecting Data',  -- Collecting Data | Research Active | Open
  related_study text,                                       -- e.g. 'STUDY-004'
  evidence      text,                                       -- honest current-evidence note
  dataset_size  text default 'Collecting',                  -- text, not a fabricated number
  sort          integer not null default 100,
  created_at    timestamptz not null default now()
);

alter table public.research_questions enable row level security;
drop policy if exists "read research questions" on public.research_questions;
create policy "read research questions" on public.research_questions
  for select to anon using (true);

-- 3) View counter for finding landing pages (finding.html).
--    security definer so anon can increment without a write policy on findings.
create or replace function public.increment_finding_views(fid uuid)
returns void language sql security definer as $$
  update public.findings set views = coalesce(views,0) + 1 where id = fid;
$$;
grant execute on function public.increment_finding_views(uuid) to anon;

-- 4) Seed the open research questions (honest: no fabricated counts).
insert into public.research_questions (question,status,related_study,evidence,dataset_size,sort) values
 ('Can reviewers agree a record has a problem while disagreeing about which problem it is?','Collecting Data','STUDY-004','No multi-reviewer data yet; question is open.','Collecting',10),
 ('Why might chronology deficiencies be identified less often than unsupported conclusions?','Collecting Data','STUDY-003','Awaiting per-condition identification data.','Collecting',20),
 ('Do different professions identify different documentation weaknesses?','Collecting Data','STUDY-008','Role captured at participation; reported as numbers grow.','Collecting',30),
 ('Does repeated exposure improve recognition accuracy?','Collecting Data','STUDY-007','Requires repeat-participant identification across sessions.','Collecting',40),
 ('When a model reviews the same record repeatedly, what does its self-consistency actually measure?','Research Active','STUDY-001','Automated reproducibility runs publishing under Current Findings.','Active',5)
on conflict do nothing;

-- ===== engine reviews =====
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

-- ===== poll votes + private responses =====
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

-- ===== data room (interaction_events + de-identified views) =====
-- ============================================================
-- JRS Research Data Room — capture everything + de-identified read access
-- Run once: Supabase -> SQL Editor -> paste -> Run. Safe to re-run.
-- After this, research-data.html can display and export every dataset.
-- ============================================================

-- 1) interaction_events: captures the widgets that previously posted to a dead
--    endpoint (homepage observation, pilot vulnerability observation, training
--    Likert survey). One row per submission.
create table if not exists public.interaction_events (
  id         uuid primary key default gen_random_uuid(),
  source     text,                 -- 'index' | 'pilot' | 'training'
  type       text,                 -- e.g. 'observational_survey'
  payload    jsonb,                -- the de-identified answers / selection
  created_at timestamptz not null default now()
);
alter table public.interaction_events enable row level security;

drop policy if exists "insert interaction events" on public.interaction_events;
create policy "insert interaction events" on public.interaction_events
  for insert to anon with check (char_length(coalesce(type,'')) <= 100);

drop policy if exists "read interaction events" on public.interaction_events;
create policy "read interaction events" on public.interaction_events
  for select to anon using (true);

-- 2) Private finding responses: make readable for the data room (free text;
--    no identifiers are stored alongside them).
drop policy if exists "read finding responses" on public.finding_responses;
create policy "read finding responses" on public.finding_responses
  for select to anon using (true);

-- 3) De-identified VIEWS over the tables that contain contact PII.
--    The base tables (omc_responses, extended_reviews) keep their PII private;
--    these views expose only the behavioral/research columns to anon.

create or replace view public.omc_responses_deid as
  select participant_id, answer, why, role,
         consent_aggregate, consent_updates, consent_recognition,
         session_source, device_type, completion_status,
         referrer, utm_source, utm_medium, utm_campaign, created_at
  from public.omc_responses;
grant select on public.omc_responses_deid to anon;

create or replace view public.extended_reviews_deid as
  select participant_id, role,
         consent_aggregate, consent_updates, consent_recognition,
         record_order, responses, summary, created_at
  from public.extended_reviews;
grant select on public.extended_reviews_deid to anon;

-- Note: omc_responses / extended_reviews / pilot_contacts keep names and emails
-- private (no anon read). The data room reads only the de-identified views above.

-- ===== nightly reproducibility history =====
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
