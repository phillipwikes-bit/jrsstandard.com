-- IncomeOS private-owner schema, DRAFT. Not applied to any database.
-- Target: a separately provisioned PRIVATE Supabase/Postgres project, never the
-- published IncomeOS public research feed or JRS production deployment.
--
-- Preflight:
--  1. Securely provision new private project outside the public study database.
--  2. Keep project service keys server-only, never in HTML, GitHub or browser logs.
--  3. Run migrations/admin tasks with approved administrator role.
--  4. Enroll EXACTLY ONE owner identity administratively after verified consent.
--  5. Test anon, owner and non-owner roles with actual authenticated sessions.
--  6. Do not expose this schema via PostgREST until all authorization tests pass.
--  7. Ensure private document bytes reside in access-controlled storage, not here.
--
-- This migration contains no identities, keys, money, transactions or test data.
begin;

create schema if not exists incomeos_private;
revoke all on schema incomeos_private from PUBLIC;
revoke all on schema incomeos_private from anon;
revoke all on schema incomeos_private from authenticated;
grant usage on schema incomeos_private to authenticated;

-- Administrative allowlist: only one approved owner. Never client-writable.
create table if not exists incomeos_private.allowed_owners (
  owner_id uuid primary key references auth.users(id) on delete restrict,
  single_slot smallint not null default 1 unique check (single_slot = 1),
  approved_at timestamptz not null default now()
);
alter table incomeos_private.allowed_owners enable row level security;
alter table incomeos_private.allowed_owners force row level security;
revoke all on table incomeos_private.allowed_owners from PUBLIC, anon, authenticated;
-- Do not grant insert/select/update/delete policies for any client role.

-- Function owned by the migration administrator. Restrict execution; pin search_path.
-- is_allowed_owner returns only a boolean about the active JWT's auth.uid().
-- Never take an arbitrary owner ID parameter or return private allowlist rows.
create or replace function incomeos_private.is_allowed_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from incomeos_private.allowed_owners a
      where a.owner_id = (select auth.uid())
    );
$$;
revoke all on function incomeos_private.is_allowed_owner() from PUBLIC, anon, authenticated;
grant execute on function incomeos_private.is_allowed_owner() to authenticated;

-- Versioned append-only financial evidence and owner-reviewed classifications.
-- Event payload is capped. Never store account credentials or unmasked account IDs.
create table if not exists incomeos_private.financial_events (
  owner_id uuid not null references auth.users(id) on delete restrict,
  event_id text not null check (event_id ~ '^[a-zA-Z0-9][a-zA-Z0-9._:-]{3,119}$'),
  seq bigint not null check (seq >= 1),
  event_time timestamptz not null,
  prev_hash text not null check (prev_hash ~ '^[a-f0-9]{64}$'),
  event_hash text not null check (event_hash ~ '^[a-f0-9]{64}$'),
  event_data jsonb not null check (jsonb_typeof(event_data) = 'object' and octet_length(event_data::text) <= 16000),
  recorded_at timestamptz not null default now(),
  primary key (owner_id,event_id),
  unique (owner_id,seq),
  unique (owner_id,event_hash)
);
create index if not exists incomeos_financial_events_owner_time
  on incomeos_private.financial_events (owner_id, event_time);

alter table incomeos_private.financial_events enable row level security;
alter table incomeos_private.financial_events force row level security;
revoke all on table incomeos_private.financial_events from PUBLIC, anon, authenticated;
-- Owner may read only. All appends require a separately reviewed server-owned
-- transaction that validates actor, head hash, sequence, provenance and payload.
-- Never grant INSERT/UPDATE/DELETE to browser-facing roles.
grant select on table incomeos_private.financial_events to authenticated;

create policy "incomeos_owner_read_events"
on incomeos_private.financial_events
for select to authenticated
using (
  owner_id = (select auth.uid())
  and (select incomeos_private.is_allowed_owner())
);

-- Evidence index stores immutable opaque metadata only. Document contents
-- need separate private storage, signed short-lived access and encryption.
create table if not exists incomeos_private.evidence_index (
  owner_id uuid not null references auth.users(id) on delete restrict,
  evidence_id text not null check (evidence_id ~ '^[a-zA-Z0-9][a-zA-Z0-9._:-]{3,119}$'),
  source_kind text not null check (source_kind in ('bank','receipt','provider','recruiter','invoice','owner-review','statement','other')),
  doc_hash text check (doc_hash is null or doc_hash ~ '^[a-f0-9]{64}$'),
  source_checked_on date not null,
  source_scope text not null default 'unverified'
    check (source_scope in ('unverified','source-only','owner-reviewed','bank-linked')),
  created_at timestamptz not null default now(),
  primary key (owner_id,evidence_id)
);
alter table incomeos_private.evidence_index enable row level security;
alter table incomeos_private.evidence_index force row level security;
revoke all on table incomeos_private.evidence_index from PUBLIC, anon, authenticated;
-- Document evidence cannot be labeled owner-reviewed by a direct browser insert.
-- Verified source matching and appends belong in a protected server transaction.
grant select on table incomeos_private.evidence_index to authenticated;

create policy "incomeos_owner_read_evidence"
on incomeos_private.evidence_index
for select to authenticated
using (
  owner_id = (select auth.uid())
  and (select incomeos_private.is_allowed_owner())
);
-- No UPDATE/DELETE grants or policies. Trigger blocks even privileged edits
-- unless an administrator explicitly replaces the controlled function.
create or replace function incomeos_private.reject_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'IncomeOS audit records are append only; use reversal events';
end;
$$;
revoke all on function incomeos_private.reject_mutation() from PUBLIC, anon, authenticated;

create trigger incomeos_no_edit_financial_events
before update or delete on incomeos_private.financial_events
for each row execute function incomeos_private.reject_mutation();

create trigger incomeos_no_edit_evidence_index
before update or delete on incomeos_private.evidence_index
for each row execute function incomeos_private.reject_mutation();

commit;

-- POST-MIGRATION ACCEPTANCE (must be executed against separate, throwaway test DB):
--  anon: no schema/table permissions, no function execute privilege.
--  authenticated non-owner: no rows and no append rights.
--  authenticated allowlisted owner: own SELECT only; direct INSERT denied.
--  owner cannot write with a different owner_id.
--  owner cannot UPDATE or DELETE any event or evidence.
--  repeated seq/event_id/hash rejected; size and shape constraints enforced.
--  all event and evidence appends must be performed by a separately reviewed
--  serialized server API; unique seq alone is insufficient.
--  schema policies remain effective after exposure changes and migrations.
--  server must independently verify SHA-256 hash chain, session, owner allowlist.
--  do NOT report this file as an applied migration or completed security test.
