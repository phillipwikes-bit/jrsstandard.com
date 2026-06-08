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
