-- IncomeOS owner application profile, DRAFT. Not applied to any database.
-- Requires OWNER-PRIVATE-SCHEMA.sql first (schema incomeos_private, allowed_owners,
-- is_allowed_owner). Target: a separately provisioned PRIVATE Supabase project,
-- never the JRS project and never the public research feed.
--
-- Ownership comes from a VERIFIED Supabase Auth identity (auth.uid()) that an
-- administrator has enrolled in incomeos_private.allowed_owners. The application
-- email stored below is profile content only; it never establishes ownership.
--
-- Required project settings (dashboard, not SQL), all before any client use:
--  1. Authentication: disable new user sign-ups (no public registration).
--  2. Authentication: enable email one-time codes; create the single owner user
--     administratively, then insert that user id into allowed_owners.
--  3. API: expose schema incomeos_private only after scripts/incomeos/verify-profile-rls.mjs passes.
--  4. Keep the service-role key server-side only; the browser uses the publishable key.
--
-- This migration contains no identities, keys or personal data.
begin;

create table if not exists incomeos_private.application_profile (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  application_email text not null check (char_length(application_email) <= 254 and application_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  qualifications jsonb not null default '[]'::jsonb check (jsonb_typeof(qualifications) = 'array' and pg_column_size(qualifications) <= 16384),
  linkedin_url text check (linkedin_url is null or linkedin_url ~ '^https://([a-z]{2,3}\.)?linkedin\.com/in/[A-Za-z0-9_-]{3,100}/?$'),
  updated_at timestamptz not null default now()
);
alter table incomeos_private.application_profile enable row level security;
alter table incomeos_private.application_profile force row level security;
revoke all on table incomeos_private.application_profile from PUBLIC, anon, authenticated;
grant select, insert, update, delete on table incomeos_private.application_profile to authenticated;

-- One policy per operation; each requires the row to be the caller's own AND the caller to be the enrolled owner.
create policy "incomeos_profile_owner_select" on incomeos_private.application_profile
  for select to authenticated
  using (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()));
create policy "incomeos_profile_owner_insert" on incomeos_private.application_profile
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()));
create policy "incomeos_profile_owner_update" on incomeos_private.application_profile
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()))
  with check (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()));
create policy "incomeos_profile_owner_delete" on incomeos_private.application_profile
  for delete to authenticated
  using (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()));

-- Server-maintained timestamp; the client cannot backdate it.
create or replace function incomeos_private.touch_profile()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
revoke all on function incomeos_private.touch_profile() from PUBLIC, anon, authenticated;
drop trigger if exists incomeos_profile_touch on incomeos_private.application_profile;
create trigger incomeos_profile_touch before insert or update on incomeos_private.application_profile
  for each row execute function incomeos_private.touch_profile();

commit;
