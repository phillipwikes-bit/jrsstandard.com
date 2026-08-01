-- JRS accuracy: Arm A detection + Arm B B1/B2, scored against the verified key.
-- Paste into Supabase -> SQL Editor -> Run. Result is aggregate numbers only (safe to share).
-- Schema used: ai_pilot_reads(reviewer_code, record_ref 'R01'..'R24', jrs_read 'Ready|Needs work|Gap',
--   rely 'Yes|No', batch 'armB-B1|armB-B2|<detection batch>', created_at). Key from research/score_armb.py.

WITH key(rec, truth) AS (VALUES
  ('R01','G'),('R02','U'),('R03','U'),('R04','G'),('R05','U'),('R06','G'),
  ('R07','U'),('R08','G'),('R09','U'),('R10','G'),('R11','U'),('R12','G'),
  ('R13','U'),('R14','G'),('R15','U'),('R16','G'),('R17','U'),('R18','G'),
  ('R19','U'),('R20','G'),('R21','U'),('R22','G'),('R23','U'),('R24','G')
),
-- keep only the latest submission per (reviewer, record): a resubmission supersedes an earlier one
latest AS (
  SELECT DISTINCT ON (reviewer_code, record_ref)
         reviewer_code, record_ref, jrs_read, rely, batch, created_at
  FROM ai_pilot_reads
  ORDER BY reviewer_code, record_ref, created_at DESC
),
scored AS (
  SELECT l.reviewer_code, l.record_ref, l.batch, k.truth,
    CASE
      WHEN lower(coalesce(l.jrs_read,'')) = 'ready'               THEN 'G'
      WHEN lower(coalesce(l.jrs_read,'')) IN ('needs work','gap') THEN 'U'
      WHEN lower(coalesce(l.rely,'')) = 'yes'                     THEN 'G'
      WHEN lower(coalesce(l.rely,'')) = 'no'                      THEN 'U'
      ELSE NULL
    END AS pred
  FROM latest l JOIN key k ON k.rec = l.record_ref
)
SELECT
  CASE
    WHEN reviewer_code LIKE 'V-AI-%' THEN 'Arm A detection (expert panel)'
    WHEN batch = 'armB-B1'           THEN 'Arm B B1 (JRS)'
    WHEN batch = 'armB-B2'           THEN 'Arm B B2 (baseline)'
    ELSE 'other'
  END AS arm,
  count(DISTINCT reviewer_code)                                              AS reviewers,
  count(*) FILTER (WHERE pred IS NOT NULL)                                   AS graded_reads,
  round(100.0 * avg((pred = truth)::int)  FILTER (WHERE pred IS NOT NULL), 1) AS accuracy_pct,
  round(100.0 * avg((pred = 'U')::int)    FILTER (WHERE truth='U' AND pred IS NOT NULL), 1) AS sensitivity_pct_unsupported,
  round(100.0 * avg((pred = 'G')::int)    FILTER (WHERE truth='G' AND pred IS NOT NULL), 1) AS specificity_pct_grounded
FROM scored
GROUP BY 1
ORDER BY 1;
