# How to get sensitivity, specificity and B1 vs B2

Everything else is done. This closes the last gap. **No key, no terminal, no install.** You log into Supabase in your browser, paste a query, press Run, and paste the result back to me.

Total time: about three minutes.

---

## STEP 1 — Open the SQL editor

1. Go to **https://supabase.com/dashboard**
2. Log in.
3. Click the project **`pjzxkeviouofdseagvpf`**.
4. In the left sidebar, click **SQL Editor**.
5. Click **New query**.

You are now logged in as the project owner. The dashboard already has full read access. This is why you do not need a key: you are not using the API, you are using your own account.

---

## STEP 2 — Run the shape check first

Paste this exactly as written, then press **Run** (or Ctrl+Enter).

```sql
select
  count(*)                                   as total_rows,
  count(distinct reviewer_code)              as reviewers,
  count(distinct record_ref)                 as records,
  min(created_at)::date                      as first_read,
  max(created_at)::date                      as last_read
from ai_pilot_reads;
```

Then run this one:

```sql
select distinct batch from ai_pilot_reads order by 1;
```

Then this one:

```sql
select distinct record_ref from ai_pilot_reads order by 1 limit 40;
```

Then this one:

```sql
select distinct jrs_read from ai_pilot_reads order by 1;
```

**Paste all four results back to me.**

Why this first: I have to see the actual values before the scoring query can be trusted. I know the column names from `scripts/export_arm_b_data.py` line 97, but I have never seen a single row of this table, and I am not going to write a scoring query against values I am guessing at.

If `record_ref` comes back as something other than `R01` through `R24`, the query in Step 3 needs one line changed and I will change it.

---

## STEP 3 — Run the scoring query

**Only run this after I confirm Step 2 looks right.** If you want to run it anyway, it will either work or return zero rows; it cannot damage anything, because every statement here only reads.

```sql
with latest as (
  select distinct on (reviewer_code, record_ref)
         reviewer_code,
         upper(record_ref) as record_ref,
         lower(jrs_read)   as jrs_read
  from ai_pilot_reads
  where batch is null or lower(batch) not like 'armb%'
  order by reviewer_code, record_ref, created_at desc
),
answer_key (record_ref, truth) as (values
  ('R01','GROUNDED'),  ('R02','UNGROUNDED'),('R03','UNGROUNDED'),('R04','GROUNDED'),
  ('R05','UNGROUNDED'),('R06','GROUNDED'),  ('R07','UNGROUNDED'),('R08','GROUNDED'),
  ('R09','UNGROUNDED'),('R10','GROUNDED'),  ('R11','UNGROUNDED'),('R12','GROUNDED'),
  ('R13','UNGROUNDED'),('R14','GROUNDED'),  ('R15','UNGROUNDED'),('R16','GROUNDED'),
  ('R17','UNGROUNDED'),('R18','GROUNDED'),  ('R19','UNGROUNDED'),('R20','GROUNDED'),
  ('R21','UNGROUNDED'),('R22','GROUNDED'),  ('R23','UNGROUNDED'),('R24','GROUNDED')
),
scored as (
  select l.reviewer_code,
         k.truth,
         case
           when l.jrs_read in ('ready','yes','grounded','rely','would_rely','adequate','supported')
             then 'GROUNDED'
           when l.jrs_read in ('review_required','needs_work','needs work','gap','gap_identified',
                               'no','ungrounded','not_rely','would_not_rely','inadequate','unsupported')
             then 'UNGROUNDED'
           else null
         end as prediction
  from latest l
  join answer_key k on l.record_ref = k.record_ref
)
select
  reviewer_code,
  count(*) as scored_records,
  round(100.0 * sum(case when prediction = truth then 1 else 0 end) / count(*), 2)
    as accuracy_pct,
  round(100.0 * sum(case when truth = 'UNGROUNDED' and prediction = truth then 1 else 0 end)
        / nullif(sum(case when truth = 'UNGROUNDED' then 1 else 0 end), 0), 2)
    as sensitivity_pct,
  round(100.0 * sum(case when truth = 'GROUNDED' and prediction = truth then 1 else 0 end)
        / nullif(sum(case when truth = 'GROUNDED' then 1 else 0 end), 0), 2)
    as specificity_pct
from scored
where prediction is not null
group by reviewer_code
having count(*) >= 18
order by accuracy_pct desc, reviewer_code;
```

**Paste the whole table back to me.** It should be about 16 rows.

The `having count(*) >= 18` is the pre-registered exclusion rule from `research/OSF_PreRegistration.md`, Data exclusion: a participant completing fewer than 18 of 24 records is excluded from accuracy analysis.

---

## STEP 4 — Run the Arm B query

Same editor, new query.

```sql
with latest as (
  select distinct on (reviewer_code, record_ref)
         reviewer_code,
         upper(record_ref) as record_ref,
         lower(jrs_read)   as jrs_read
  from ai_pilot_reads
  where lower(batch) like 'armb%'
  order by reviewer_code, record_ref, created_at desc
),
answer_key (record_ref, truth) as (values
  ('R01','GROUNDED'),  ('R02','UNGROUNDED'),('R03','UNGROUNDED'),('R04','GROUNDED'),
  ('R05','UNGROUNDED'),('R06','GROUNDED'),  ('R07','UNGROUNDED'),('R08','GROUNDED'),
  ('R09','UNGROUNDED'),('R10','GROUNDED'),  ('R11','UNGROUNDED'),('R12','GROUNDED'),
  ('R13','UNGROUNDED'),('R14','GROUNDED'),  ('R15','UNGROUNDED'),('R16','GROUNDED'),
  ('R17','UNGROUNDED'),('R18','GROUNDED'),  ('R19','UNGROUNDED'),('R20','GROUNDED'),
  ('R21','UNGROUNDED'),('R22','GROUNDED'),  ('R23','UNGROUNDED'),('R24','GROUNDED')
),
scored as (
  select l.reviewer_code,
         k.truth,
         case
           when l.jrs_read in ('ready','yes','grounded','rely','would_rely','adequate','supported')
             then 'GROUNDED'
           when l.jrs_read in ('review_required','needs_work','needs work','gap','gap_identified',
                               'no','ungrounded','not_rely','would_not_rely','inadequate','unsupported')
             then 'UNGROUNDED'
           else null
         end as prediction
  from latest l
  join answer_key k on l.record_ref = k.record_ref
)
select
  s.reviewer_code,
  b.arm_code,
  count(*) as scored_records,
  round(100.0 * sum(case when s.prediction = s.truth then 1 else 0 end) / count(*), 2)
    as accuracy_pct,
  round(100.0 * sum(case when s.truth = 'UNGROUNDED' and s.prediction = s.truth then 1 else 0 end)
        / nullif(sum(case when s.truth = 'UNGROUNDED' then 1 else 0 end), 0), 2)
    as sensitivity_pct,
  round(100.0 * sum(case when s.truth = 'GROUNDED' and s.prediction = s.truth then 1 else 0 end)
        / nullif(sum(case when s.truth = 'GROUNDED' then 1 else 0 end), 0), 2)
    as specificity_pct
from scored s
left join armb_progress b on b.code = s.reviewer_code
where s.prediction is not null
group by s.reviewer_code, b.arm_code
having count(*) >= 18
order by b.arm_code, accuracy_pct desc;
```

**Paste that table back too.** It should be about 20 rows, and RR-108 should be absent because it has 9 of 24.

---

## STEP 5 — I do the rest

From those tables I compute and hand back:

- panel mean sensitivity and specificity with 95% confidence intervals
- whether they match the manuscript's 87.0% and 80.7%
- B1 versus B2: mean difference, confidence interval, Welch t, Cohen's d
- whether the pre-registered Floor 3 is met, which is B1 above B2 with the interval of the difference excluding zero
- an updated figure block for the paper

---

## Notes

**Nothing here writes.** Every statement is a `select`. There is no `insert`, `update`, `delete` or `drop` anywhere in this file.

**You are not creating a token or a key.** You are using your own Supabase login. The `SUPABASE_SERVICE_ROLE_KEY` I mentioned earlier is not a new credential either: it already exists in your Vercel environment and is already used by `api/people-9dd1ecdf6f8cdfd4.js`, `api/roster-8c3f1a9e7b2d6045.js` and `api/geo-4e8b2d7f9a1c3065.js`. I raised it only because it is what my environment lacks. This route avoids it entirely.

**If a query errors**, paste the error text back. The likely cause is `record_ref` holding a different format than `R01` to `R24`, which Step 2 will reveal before you get there.

**Alternative if you would rather use a terminal:** `scripts/verify_detection_accuracy.py` does the same job and prints the final figures directly. It needs the repository checked out locally and the key set as an environment variable. The SQL route above needs neither.
