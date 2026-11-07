-- STAGING ONLY. Apply only after the private revision schema and pgcrypto prerequisites.
-- Supabase PostgREST exposes public RPC names, not the private tables.
-- The deployment role must own both wrappers and the private append function.
create or replace function public.incomeos_latest_workspace_revision()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  latest_row record;
begin
  if actor is null or not exists
    (select 1 from incomeos_private.allowed_owners where user_id=actor) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  select revision,ciphertext,ciphertext_sha256 into latest_row
    from incomeos_private.workspace_revisions
    where owner_id=actor order by revision desc limit 1;
  if not found then return 'null'::jsonb; end if;
  return pg_catalog.jsonb_build_object(
    'revision',latest_row.revision,
    'ciphertext',latest_row.ciphertext,
    'ciphertext_sha256',latest_row.ciphertext_sha256);
end;
$$;

create or replace function public.incomeos_append_workspace_revision(
  expected_revision bigint, encrypted_payload text, payload_sha256 text
) returns bigint
language sql security definer set search_path = ''
as $$
  select incomeos_private.append_workspace_revision(
    expected_revision,encrypted_payload,payload_sha256);
$$;

revoke all on function public.incomeos_latest_workspace_revision() from public,anon;
revoke all on function public.incomeos_append_workspace_revision(bigint,text,text) from public,anon;
grant execute on function public.incomeos_latest_workspace_revision() to authenticated;
grant execute on function public.incomeos_append_workspace_revision(bigint,text,text) to authenticated;
-- Never grant direct table access. Authenticated callers are still checked
-- against the owner allowlist inside both security-definer functions.
