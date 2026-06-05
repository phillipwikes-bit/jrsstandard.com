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
