\set ON_ERROR_STOP on
-- Disposable PostgreSQL integration fixture. Never run against the owner database.
-- These stand-ins provide only the Supabase role and auth.uid() interfaces used by staging SQL.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA extensions;
CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE SET search_path = ''
AS $$ SELECT nullif(pg_catalog.current_setting('request.jwt.claim.sub',true),'')::uuid $$;
INSERT INTO auth.users(id) VALUES
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');

\ir ../engineering/incomeos/workspace-revision-staging.sql
\ir ../engineering/incomeos/workspace-revision-rpc-staging.sql

INSERT INTO incomeos_private.allowed_owners(user_id) VALUES
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
DO $test$
DECLARE
  payload text := '{"format":"incomeos-workspace","version":1,"kdf":"PBKDF2-SHA256","iterations":600000,"cipher":"AES-256-GCM","salt":"AAAAAAAAAAAAAAAAAAAAAA==","iv":"AAAAAAAAAAAAAAAA","data":"AAAAAAAAAAAAAAAAAAAAAA=="}';
  sha text := '7cca319d5a7ae502c4b7fcbb5313aa2b5912b523750d543c2c54ce10d8b706ec';
BEGIN
  IF public.incomeos_latest_workspace_revision() IS DISTINCT FROM 'null'::jsonb THEN
    RAISE EXCEPTION 'Expected empty owner workspace';
  END IF;
  IF public.incomeos_append_workspace_revision(0,payload,sha) <> 1 THEN
    RAISE EXCEPTION 'Expected first append to create revision 1';
  END IF;
  IF (public.incomeos_latest_workspace_revision()->>'revision')::bigint <> 1
    OR public.incomeos_latest_workspace_revision()->>'ciphertext' IS DISTINCT FROM payload THEN
    RAISE EXCEPTION 'Owner readback mismatch';
  END IF;
  BEGIN
    PERFORM public.incomeos_append_workspace_revision(0,payload,sha);
    RAISE EXCEPTION 'Stale compare-and-swap was accepted';
  EXCEPTION WHEN SQLSTATE '40001' THEN NULL;
  END;
  BEGIN
    PERFORM public.incomeos_append_workspace_revision(1,payload,repeat('0',64));
    RAISE EXCEPTION 'Invalid checksum was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Invalid encrypted payload or checksum%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.incomeos_append_workspace_revision(1,
      '{"format":"incomeos-workspace","version":1,"kdf":"PBKDF2-SHA256","iterations":600000,"cipher":"AES-256-GCM","salt":"AAAAAAAAAAAAAAAAAAAAAA==","data":"AAAAAAAAAAAAAAAAAAAAAA=="}',
      '8cafe7745f9e2c035e8eeb1ffb6e699876e0853adf4cb80a910ac900b71d6dd9');
    RAISE EXCEPTION 'Missing IV was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Unsupported encrypted workspace envelope%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.incomeos_append_workspace_revision(1,
      '{"format":"incomeos-workspace","version":"1","kdf":"PBKDF2-SHA256","iterations":600000,"cipher":"AES-256-GCM","salt":"AAAAAAAAAAAAAAAAAAAAAA==","iv":"AAAAAAAAAAAAAAAA","data":"AAAAAAAAAAAAAAAAAAAAAA=="}',
      'd632181bec77008d53dff6885e2b631b68dcc4048115100b0d049ec1717a3c99');
    RAISE EXCEPTION 'String-typed version was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Unsupported encrypted workspace envelope%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM count(*) FROM incomeos_private.workspace_revisions;
    RAISE EXCEPTION 'Authenticated role accessed the private revision table';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $test$;

SET request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
DO $test$
DECLARE
  payload text := '{"format":"incomeos-workspace","version":1,"kdf":"PBKDF2-SHA256","iterations":600000,"cipher":"AES-256-GCM","salt":"AAAAAAAAAAAAAAAAAAAAAA==","iv":"AAAAAAAAAAAAAAAA","data":"AAAAAAAAAAAAAAAAAAAAAA=="}';
BEGIN
  IF public.incomeos_latest_workspace_revision() IS DISTINCT FROM 'null'::jsonb THEN
    RAISE EXCEPTION 'Second owner observed first owner workspace';
  END IF;
  IF public.incomeos_append_workspace_revision(0,payload,
       '7cca319d5a7ae502c4b7fcbb5313aa2b5912b523750d543c2c54ce10d8b706ec') <> 1 THEN
    RAISE EXCEPTION 'Second owner append failed';
  END IF;
END $test$;

-- Authorized clients must not bypass the append-only RPC through table DML.
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
DO $test$
BEGIN
  BEGIN
    UPDATE incomeos_private.workspace_revisions SET ciphertext='tampered'
      WHERE owner_id='11111111-1111-4111-8111-111111111111';
    RAISE EXCEPTION 'Authenticated actor modified an append-only revision';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    DELETE FROM incomeos_private.workspace_revisions
      WHERE owner_id='11111111-1111-4111-8111-111111111111';
    RAISE EXCEPTION 'Authenticated actor deleted an append-only revision';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $test$;

SET request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
DO $test$
DECLARE
  payload text := '{"format":"incomeos-workspace","version":1,"kdf":"PBKDF2-SHA256","iterations":600000,"cipher":"AES-256-GCM","salt":"AAAAAAAAAAAAAAAAAAAAAA==","iv":"AAAAAAAAAAAAAAAA","data":"AAAAAAAAAAAAAAAAAAAAAA=="}';
BEGIN
  BEGIN
    PERFORM public.incomeos_latest_workspace_revision();
    RAISE EXCEPTION 'Unlisted actor could read a workspace';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.incomeos_append_workspace_revision(0,payload,
      '7cca319d5a7ae502c4b7fcbb5313aa2b5912b523750d543c2c54ce10d8b706ec');
    RAISE EXCEPTION 'Unlisted actor could append an owner revision';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $test$;

RESET ROLE;
SET ROLE anon;
DO $test$
BEGIN
  BEGIN
    PERFORM public.incomeos_latest_workspace_revision();
    RAISE EXCEPTION 'Anonymous caller could invoke the latest RPC';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $test$;
RESET ROLE;

SELECT 'PASS: disposable SQL integration verified CAS, checksums, envelope shape, two-owner isolation and RPC role limits' AS result;
