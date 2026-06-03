-- ============================================================
-- JRS One-Minute Challenge — Supabase setup
-- Run this once in your Supabase project:
--   Dashboard -> SQL Editor -> New query -> paste -> Run
-- Project: https://pjzxkeviouofdseagvpf.supabase.co
-- ============================================================

-- 1) Submissions table
create table if not exists public.omc_responses (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  participant_id      text,
  answer              text check (answer in ('Yes','Partially','No')),
  why                 text,
  role                text,
  first_name          text,
  last_name           text,
  email               text,
  consent_updates     boolean default false,
  consent_aggregate   boolean default false,
  consent_recognition boolean default false,
  referrer            text,
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  session_source      text,
  device_type         text,
  completion_status   text
);

-- 2) Lock the table down with Row Level Security
alter table public.omc_responses enable row level security;

-- Allow anonymous visitors to INSERT their own submission only.
-- (No SELECT policy for anon => raw rows, including names/emails, are NOT publicly readable.)
drop policy if exists "anon can insert submissions" on public.omc_responses;
create policy "anon can insert submissions"
  on public.omc_responses
  for insert
  to anon
  with check (true);

-- 3) Public aggregate function (no personal data leaves the database).
--    SECURITY DEFINER lets it read the table while anon cannot read rows directly.
create or replace function public.omc_results()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'min_sample_for_comparison', 5,
    'participants',       count(*),
    'reviews_completed',  count(*) filter (where completion_status = 'completed'),
    'distribution', json_build_object(
      'Yes',       count(*) filter (where answer = 'Yes'),
      'Partially', count(*) filter (where answer = 'Partially'),
      'No',        count(*) filter (where answer = 'No')
    ),
    'roles', coalesce((
        select json_object_agg(role, c)
        from (
          select role, count(*) c
          from public.omc_responses
          where role is not null and role <> ''
          group by role
        ) t
    ), '{}'::json),
    'updated', to_char(now(), 'YYYY-MM-DD')
  )
  from public.omc_responses;
$$;

grant execute on function public.omc_results() to anon;

-- Done. The site reads aggregates via:  POST /rest/v1/rpc/omc_results
-- and writes submissions via:           POST /rest/v1/omc_responses
