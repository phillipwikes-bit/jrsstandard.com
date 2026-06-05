-- ============================================================
-- JRS — remove duplicate findings (keep the newest per study)
-- Run once: Supabase -> SQL Editor -> paste -> Run
-- Safe to re-run. Going forward, api/run-study.js replaces the
-- STUDY-001 finding on each run, so this should stay clean.
-- ============================================================

delete from public.findings a
using public.findings b
where a.study_id = b.study_id
  and a.created_at < b.created_at;
