-- IncomeOS private vault, Supabase project "incomeos-private" (ref pmvqxdgvnwhckzxojioa, us-east-1, free plan).
-- APPLIED 2026-11-05 by Claude Code with the owner's approval. This file records the resulting state; it is
-- not re-run automatically. The vault holds only workspaces encrypted on the owner's device (AES-256-GCM;
-- the passphrase never leaves the device). Append-only: no update or delete through the API.
-- The owner allow-list (incomeos_owner) is filled by hand once the owner account exists; it is never committed.

create table public.incomeos_owner (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.incomeos_owner enable row level security;      -- no policies: unreadable over the API
revoke all on public.incomeos_owner from anon, authenticated;

create table public.incomeos_vault (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  format text not null check (format = 'incomeos-workspace-encrypted-v1'),
  ciphertext text not null check (length(ciphertext) between 64 and 5000000),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  saved_at timestamptz not null default now()
);
create index incomeos_vault_owner_saved on public.incomeos_vault (owner_id, saved_at desc);
alter table public.incomeos_vault enable row level security;
revoke all on public.incomeos_vault from anon, authenticated;
grant select, insert on public.incomeos_vault to authenticated;
grant usage on sequence public.incomeos_vault_id_seq to authenticated;

-- Owner check lives outside the API-exposed schema so it cannot be called over REST.
create schema incomeos_private;
revoke all on schema incomeos_private from public, anon;
grant usage on schema incomeos_private to authenticated;
create function incomeos_private.is_owner() returns boolean
  language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.incomeos_owner o where o.user_id = (select auth.uid())) $$;
revoke all on function incomeos_private.is_owner() from public, anon;
grant execute on function incomeos_private.is_owner() to authenticated;

create policy incomeos_vault_owner_read on public.incomeos_vault
  for select to authenticated using (owner_id = (select auth.uid()) and (select incomeos_private.is_owner()));
create policy incomeos_vault_owner_insert on public.incomeos_vault
  for insert to authenticated with check (owner_id = (select auth.uid()) and (select incomeos_private.is_owner()));

-- Residue: public.incomeos_is_owner() from the first migration still exists with EXECUTE revoked from
-- anon, authenticated and public (the drop needed a confirmation that could not be answered). It is unused.
-- Verified 2026-11-05 in the database: anon refused; a signed-in non-owner sees 0 rows, cannot insert,
-- cannot read the owner list or call the old function. Supabase security advisor: no warnings.
