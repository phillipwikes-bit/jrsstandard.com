-- IncomeOS server-authoritative encrypted workspace revision store.
-- STAGING ONLY. Review owner provisioning and apply through an authorized migration.
-- Never place an owner UUID or service-role secret in client code.
create schema if not exists incomeos_private;
-- pgcrypto must be installed in the extensions schema by the database administrator.
-- This migration is deliberately not executable until that prerequisite is verified.

create table if not exists incomeos_private.allowed_owners (
  user_id uuid primary key references auth.users(id) on delete cascade
);
revoke all on incomeos_private.allowed_owners from anon, authenticated;

create table if not exists incomeos_private.workspace_revisions (
  owner_id uuid not null references auth.users(id),
  revision bigint not null check (revision > 0),
  parent_revision bigint not null check (parent_revision >= 0),
  ciphertext text not null check (octet_length(ciphertext) between 1 and 5000000),
  ciphertext_sha256 text not null check (ciphertext_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key(owner_id, revision),
  check (revision = parent_revision + 1)
);
create index if not exists workspace_revisions_latest
  on incomeos_private.workspace_revisions(owner_id, revision desc);
alter table incomeos_private.workspace_revisions enable row level security;
revoke all on incomeos_private.workspace_revisions from public, anon, authenticated;

-- All writes must be made through this single transaction boundary.
create or replace function incomeos_private.append_workspace_revision(
  expected_revision bigint, encrypted_payload text, payload_sha256 text
) returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_revision bigint;
begin
  if actor is null or not exists (
    select 1 from incomeos_private.allowed_owners where user_id = actor
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if expected_revision is null or expected_revision < 0 then
    raise exception 'Invalid expected revision';
  end if;
  if encrypted_payload is null or octet_length(encrypted_payload) not between 1 and 5000000
     or payload_sha256 is null or payload_sha256 !~ '^[0-9a-f]{64}$'
     or encode(extensions.digest(convert_to(encrypted_payload,'UTF8'),'sha256'),'hex') <> payload_sha256 then
    raise exception 'Invalid encrypted payload or checksum';
  end if;
  if not (pg_catalog.jsonb_typeof(encrypted_payload::jsonb) = 'object'
    and (encrypted_payload::jsonb)->>'format' = 'incomeos-workspace'
    and (encrypted_payload::jsonb)->'version' = '1'::jsonb
    and (encrypted_payload::jsonb)->>'kdf' = 'PBKDF2-SHA256'
    and (encrypted_payload::jsonb)->'iterations' = '600000'::jsonb
    and (encrypted_payload::jsonb)->>'cipher' = 'AES-256-GCM'
    -- Match the client envelope's base64 field types and byte-length constraints.
    and pg_catalog.jsonb_typeof((encrypted_payload::jsonb)->'data') = 'string'
    and (encrypted_payload::jsonb)->>'data' ~ '^[A-Za-z0-9+/=]+$'
    and pg_catalog.jsonb_typeof((encrypted_payload::jsonb)->'salt') = 'string'
    and (encrypted_payload::jsonb)->>'salt' ~ '^[A-Za-z0-9+/]{22}==$'
    and pg_catalog.jsonb_typeof((encrypted_payload::jsonb)->'iv') = 'string'
    and (encrypted_payload::jsonb)->>'iv' ~ '^[A-Za-z0-9+/]{16}$'
    and (select count(*) from pg_catalog.jsonb_object_keys(encrypted_payload::jsonb)) = 8) then
    raise exception 'Unsupported encrypted workspace envelope';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text, 0));
  select coalesce(max(revision),0) into current_revision
    from incomeos_private.workspace_revisions where owner_id = actor;
  if current_revision <> expected_revision then
    raise exception 'Stale workspace revision' using errcode = '40001';
  end if;
  insert into incomeos_private.workspace_revisions
    (owner_id, revision, parent_revision, ciphertext, ciphertext_sha256)
  values (actor, current_revision + 1, current_revision, encrypted_payload, payload_sha256);
  return current_revision + 1;
end;
$$;
-- Grant execution only after reviewing extension location, API schema exposure,
-- and the separate owner provisioning process. Do not deploy as-is.
revoke all on function incomeos_private.append_workspace_revision(bigint,text,text) from public, anon, authenticated;
