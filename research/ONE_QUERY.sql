-- ============================================================================
-- JRS: the last three figures, in one query.
--
-- WHERE TO RUN IT
--   https://supabase.com/dashboard  ->  project pjzxkeviouofdseagvpf
--   ->  SQL Editor  ->  New query  ->  paste  ->  Run
--
-- READ ONLY. Every statement below is a SELECT. There is no INSERT, UPDATE,
-- DELETE, DROP, ALTER, TRUNCATE or GRANT anywhere in this file.
--
-- WHAT COMES BACK
--   Roughly nine rows. The first block is diagnostics, so if my assumptions
--   about the stored values are wrong it shows up in the same result instead of
--   producing a wrong number that looks right. The second block is the scores.
--
--   Copy the whole result back. From n, mean and sd I compute the 95% intervals,
--   the Welch t, the degrees of freedom, Cohen's d and the Floor 3 verdict.
--
-- ANSWER KEY: research/Verified_Key.md, identical to the copy at
-- scripts/export_arm_b_data.py lines 31-39.
-- EXCLUSION: research/OSF_PreRegistration.md, "Data exclusion" - a participant
-- completing fewer than 18 of 24 records is excluded from accuracy analysis.
-- ============================================================================

with

answer_key (record_ref, truth) as (values
  ('R01','GROUNDED'),  ('R02','UNGROUNDED'),('R03','UNGROUNDED'),('R04','GROUNDED'),
  ('R05','UNGROUNDED'),('R06','GROUNDED'),  ('R07','UNGROUNDED'),('R08','GROUNDED'),
  ('R09','UNGROUNDED'),('R10','GROUNDED'),  ('R11','UNGROUNDED'),('R12','GROUNDED'),
  ('R13','UNGROUNDED'),('R14','GROUNDED'),  ('R15','UNGROUNDED'),('R16','GROUNDED'),
  ('R17','UNGROUNDED'),('R18','GROUNDED'),  ('R19','UNGROUNDED'),('R20','GROUNDED'),
  ('R21','UNGROUNDED'),('R22','GROUNDED'),  ('R23','UNGROUNDED'),('R24','GROUNDED')
),

-- One row per reviewer per record: the most recent submission wins.
latest as (
  select distinct on (reviewer_code, upper(record_ref))
         reviewer_code,
         upper(record_ref)                                       as record_ref,
         lower(btrim(coalesce(jrs_read, '')))                    as jrs_read,
         case when lower(coalesce(batch,'')) like 'armb%'
              then 'ARM_B' else 'DETECTION' end                  as study
  from ai_pilot_reads
  order by reviewer_code, upper(record_ref), created_at desc
),

scored as (
  select l.reviewer_code,
         l.study,
         k.truth,
         case
           when l.jrs_read in ('ready','yes','grounded','rely','would_rely',
                               'adequate','supported')
             then 'GROUNDED'
           when l.jrs_read in ('review_required','needs_work','needs work','gap',
                               'gap_identified','no','ungrounded','not_rely',
                               'would_not_rely','inadequate','unsupported')
             then 'UNGROUNDED'
           else null
         end                                                     as prediction
  from latest l
  join answer_key k on l.record_ref = k.record_ref
),

per_reviewer as (
  select s.reviewer_code,
         s.study,
         coalesce(b.arm_code, 'n/a')                              as arm_code,
         count(*)                                                 as n_records,
         100.0 * sum(case when s.prediction = s.truth then 1 else 0 end)
               / count(*)                                         as accuracy,
         100.0 * sum(case when s.truth = 'UNGROUNDED'
                           and s.prediction = s.truth then 1 else 0 end)
               / nullif(sum(case when s.truth = 'UNGROUNDED' then 1 else 0 end), 0)
                                                                  as sensitivity,
         100.0 * sum(case when s.truth = 'GROUNDED'
                           and s.prediction = s.truth then 1 else 0 end)
               / nullif(sum(case when s.truth = 'GROUNDED' then 1 else 0 end), 0)
                                                                  as specificity
  from scored s
  left join armb_progress b on b.code = s.reviewer_code
  where s.prediction is not null
  group by s.reviewer_code, s.study, coalesce(b.arm_code, 'n/a')
  having count(*) >= 18
)

-- ---------------------------------------------------------------- diagnostics
select '0_DIAG rows in ai_pilot_reads'      as metric,
       count(*)::numeric                    as n,
       null::numeric                        as mean_accuracy,
       null::numeric                        as sd_accuracy,
       null::numeric                        as mean_sensitivity,
       null::numeric                        as mean_specificity
from ai_pilot_reads

union all
select '0_DIAG distinct reviewers',
       count(distinct reviewer_code)::numeric, null, null, null, null
from ai_pilot_reads

union all
select '0_DIAG distinct record_ref',
       count(distinct upper(record_ref))::numeric, null, null, null, null
from ai_pilot_reads

union all
select '0_DIAG record_ref values that MATCH the key',
       count(*)::numeric, null, null, null, null
from (select distinct upper(record_ref) rr from ai_pilot_reads) x
join answer_key k on x.rr = k.record_ref

union all
select '0_DIAG judgments with an UNMAPPED jrs_read',
       count(*)::numeric, null, null, null, null
from scored where prediction is null

union all
select '0_DIAG reviewers EXCLUDED under 18 of 24',
       (select count(*) from (
          select reviewer_code from scored where prediction is not null
          group by reviewer_code having count(*) < 18) y)::numeric,
       null, null, null, null

-- ------------------------------------------------------------------- results
union all
select '1_DETECTION PANEL',
       count(*)::numeric,
       round(avg(accuracy), 4),
       round(stddev_samp(accuracy), 4),
       round(avg(sensitivity), 4),
       round(avg(specificity), 4)
from per_reviewer
where study = 'DETECTION'

union all
select '2_DETECTION sd of sensitivity and specificity',
       count(*)::numeric,
       round(stddev_samp(sensitivity), 4),
       round(stddev_samp(specificity), 4),
       round(min(accuracy), 2),
       round(max(accuracy), 2)
from per_reviewer
where study = 'DETECTION'

union all
select '3_DETECTION reviewers scoring 100 percent',
       count(*) filter (where accuracy = 100)::numeric,
       null, null, null, null
from per_reviewer
where study = 'DETECTION'

union all
select '4_ARM_B ' || arm_code,
       count(*)::numeric,
       round(avg(accuracy), 4),
       round(stddev_samp(accuracy), 4),
       round(avg(sensitivity), 4),
       round(avg(specificity), 4)
from per_reviewer
where study = 'ARM_B'
group by arm_code

union all
select '5_ARM_B all arms pooled',
       count(*)::numeric,
       round(avg(accuracy), 4),
       round(stddev_samp(accuracy), 4),
       round(avg(sensitivity), 4),
       round(avg(specificity), 4)
from per_reviewer
where study = 'ARM_B'

order by 1;
