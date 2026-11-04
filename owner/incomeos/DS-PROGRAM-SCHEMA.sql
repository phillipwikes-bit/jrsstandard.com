-- Decision Spellchecker program record, DRAFT. Not applied to any database.
-- Requires OWNER-PRIVATE-SCHEMA.sql first (schema incomeos_private, allowed_owners,
-- is_allowed_owner). Target: the separately provisioned PRIVATE IncomeOS project,
-- never the JRS project. Until it exists, the program lives only in the owner's
-- workspace file (owner/incomeos/ds-program.js, workspace key "dsProgram").
--
-- Design:
--  * ds_program holds the current validated program document (one row per owner).
--  * ds_program_audit is append-only: the owner may insert and read, never update or delete.
--    Each row stores the program's own change-log entry and a SHA-256 of the document after it.
--  * Access is enforced by the database (row level security), not by the page.
--  * The same project settings and CSP authorization listed in OWNER-PROFILE-SCHEMA.sql apply.
--
-- This migration contains no identities, keys, buyer data or program content.
begin;

create table if not exists incomeos_private.ds_program (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  schema_version text not null check (schema_version = 'incomeos.ds-program.v1'),
  doc jsonb not null check (jsonb_typeof(doc) = 'object' and pg_column_size(doc) <= 4194304),
  updated_at timestamptz not null default now()
);
alter table incomeos_private.ds_program enable row level security;
alter table incomeos_private.ds_program force row level security;
revoke all on table incomeos_private.ds_program from PUBLIC, anon, authenticated;
grant select, insert, update on table incomeos_private.ds_program to authenticated;
create policy "ds_program_owner_select" on incomeos_private.ds_program
  for select to authenticated using (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()));
create policy "ds_program_owner_insert" on incomeos_private.ds_program
  for insert to authenticated with check (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()));
create policy "ds_program_owner_update" on incomeos_private.ds_program
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()))
  with check (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()));
-- No delete policy: the program record is never deleted through the API.

create table if not exists incomeos_private.ds_program_audit (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  seq integer not null check (seq > 0),
  action text not null check (action ~ '^[A-Z_]{3,60}$'),
  detail jsonb not null default '{}'::jsonb check (pg_column_size(detail) <= 8192),
  doc_sha256 text not null check (doc_sha256 ~ '^[0-9a-f]{64}$'),
  recorded_at timestamptz not null default now(),
  unique (owner_id, seq)
);
alter table incomeos_private.ds_program_audit enable row level security;
alter table incomeos_private.ds_program_audit force row level security;
revoke all on table incomeos_private.ds_program_audit from PUBLIC, anon, authenticated;
grant select, insert on table incomeos_private.ds_program_audit to authenticated;
create policy "ds_audit_owner_select" on incomeos_private.ds_program_audit
  for select to authenticated using (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()));
create policy "ds_audit_owner_insert" on incomeos_private.ds_program_audit
  for insert to authenticated with check (owner_id = (select auth.uid()) and (select incomeos_private.is_allowed_owner()));
-- No update or delete grant or policy: the audit trail is append-only.

commit;
