-- Prepared 2026-11-01 for the JRS owner-access release gate.
-- This is a source audit artifact, NOT evidence of a completed production RLS audit.
-- Collect and independently review the results in an authorized Supabase session.
-- JRS / Decision Spellchecker. READ-ONLY Supabase permission inventory.
-- Date: 2026-10-30. Prepared for controlled release diligence.
-- Run manually in an authorized Supabase SQL editor. Does NOT read records,
-- create policies, alter privileges, write audit rows, or expose service keys.
-- Results must be reviewed alongside actual anonymous HTTP checks. A GRANT
-- alone is not proof of access: row-level security and policy conditions matter.
-- IMPORTANT: this script is not evidence that live security is correct until run.
BEGIN READ ONLY;

-- A. Table presence, grants and row-level-security state.
WITH inventory(table_name, expected_boundary) AS (
  VALUES
    ('pilot_contacts','PRIVATE_CONTACT'),
    ('ai_pilot_reads','PRIVATE_RESEARCH'),
    ('bench_labels','RESEARCH_REVIEW_REQUIRED'),
    ('bench_outcomes','RESEARCH_REVIEW_REQUIRED'),
    ('omc_responses','PRIVATE_SUBMISSIONS'),
    ('extended_reviews','PRIVATE_SUBMISSIONS'),
    ('study_runs','RESEARCH_REVIEW_REQUIRED'),
    ('studies','PUBLIC_METADATA_REVIEW_REQUIRED'),
    ('findings','PUBLIC_FILTER_REVIEW_REQUIRED'),
    ('research_questions','PUBLIC_FILTER_REVIEW_REQUIRED'),
    ('engine_reviews','RECORD_TEXT_RISK_REVIEW_REQUIRED'),
    ('interaction_events','PRIVATE_RAW_TELEMETRY'),
    ('pilot_progress','PRIVATE_RAW_PROGRESS'),
    ('realcase_progress','PRIVATE_RAW_PROGRESS'),
    ('armb_progress','PRIVATE_RAW_PROGRESS'),
    ('finding_responses','PRIVATE_SUBMISSIONS'),
    ('finding_poll_votes','AGGREGATE_VS_ROW_REVIEW_REQUIRED')
),
targets AS (
 SELECT i.table_name,i.expected_boundary,c.oid,c.relrowsecurity,c.relforcerowsecurity,c.relkind
 FROM inventory i
 LEFT JOIN pg_namespace n ON n.nspname='public'
 LEFT JOIN pg_class c ON c.relnamespace=n.oid
                     AND c.relname=i.table_name AND c.relkind IN ('r','p','v','m')
)
SELECT table_name,expected_boundary,
       (oid IS NOT NULL) AS table_exists,
       COALESCE(relrowsecurity,FALSE) AS rls_enabled,
       COALESCE(relforcerowsecurity,FALSE) AS rls_forced,
       CASE WHEN oid IS NULL THEN NULL ELSE has_table_privilege('anon',oid,'SELECT') END AS anon_granted_select,
       CASE WHEN oid IS NULL THEN NULL ELSE has_table_privilege('authenticated',oid,'SELECT') END AS authenticated_granted_select,
       CASE WHEN oid IS NULL THEN NULL ELSE has_table_privilege('anon',oid,'INSERT') END AS anon_granted_insert,
       relkind
FROM targets ORDER BY table_name;

-- B. Policy metadata for each public table, without selecting user data.
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname='public'
ORDER BY tablename,cmd,policyname;

-- C. Security-definer functions and anonymous execution grants.
-- Review any function that can return row values even where table RLS is on.
SELECT n.nspname AS schema_name,
       p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS argument_types,
       p.prosecdef AS security_definer,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
ORDER BY p.prosecdef DESC,p.proname;

-- D. Verify row-level security for all non-system public tables, not only
-- those already known to the JRS application.
SELECT c.relname AS relation_name,
       c.relkind,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       has_table_privilege('anon',c.oid,'SELECT') AS anon_granted_select,
       has_table_privilege('anon',c.oid,'INSERT') AS anon_granted_insert,
       has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_granted_select
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m')
ORDER BY c.relname;

ROLLBACK; -- No database changes are made.
