# Arm B: tests run and completions needed for a valid result (2026-08-01)

Data: live, key-scored (`accuracy_query.sql`). Criteria: `ArmB_Design.md` + `OSF_PreRegistration.md`.

## Current Arm B state
- B1 (JRS): **4 complete** (RR-104, RR-106, RR-124, RR-126). RR-108 is at 9/24 (excluded until it reaches ≥18).
- B2 (baseline): **7 complete**.
- Accuracy: B1 72.4% (n=105 reads), B2 66.1% (n=168 reads). Difference **+6.3 pp**, direction favors JRS.

## Tests run

**Floor 2 (detectability: point ≥ 0.70 and lower 95% bound > 0.50).**
- Arm A 82.7% (95% CI 0.784–0.862): **MET**. DRR is detectable.
- B1 72.4% (CI 0.632–0.800): clears 0.70. B2 66.1% (CI 0.586–0.728): below 0.70.

**Floor 3 (value of the standard: B1 > B2 AND 95% CI of the difference excludes zero).**
- B1 − B2 = +6.3 pp. 95% CI of the difference = **[−4.8, +17.5] pp → includes zero.**
- Read-level 2-proportion test: z = 1.09, p = 0.28 (indicative; the pre-registered participant-clustered test is wider still).
- **Floor 3: NOT met.** JRS is not yet shown to add value over the baseline.

## How many more completions make Arm B "valid" — two different bars

**Bar 1: meet the pre-registered minimum sample (so the comparison counts as a completed, adequately-sampled test).**
The registration sets 5–8 completed participants **per arm**.
- B1 (JRS): 4 → needs **at least 1 more** completion to reach 5; up to 4 more to reach the top of the range (8). RR-108 finishing its remaining 15 records would satisfy the minimum.
- B2 (baseline): 7 → **already met**.
- **So the minimum bar is: 1 more JRS-arm (B1) completion.**

**Bar 2: actually pass Floor 3 at the current +6.3-point effect (show a real JRS advantage).**
A 6.3-point gap is small. Projected participants **per arm** needed for the difference CI to exclude zero (read-level, optimistic because it ignores within-reviewer clustering):

| Per arm | Reads | +6.3pp difference CI | Excludes zero? |
|---|---|---|---|
| 5 | 120 | [−5.3, +17.9] | No |
| 8 | 192 | [−2.9, +15.5] | No |
| 12 | 288 | [−1.2, +13.8] | No |
| 17 | 408 | [−0.0, +12.6] | No (edge) |
| 25 | 600 | [+1.1, +11.5] | **Yes** |

So at the current effect size you would need roughly **25 completers per arm** to clear Floor 3 (more once clustering is accounted for), far beyond the registered minimum of 5–8.

## Honest bottom line

- **1 more B1 completion** makes Arm B meet its pre-registered minimum and "count" as a finished comparison.
- But at the current 6.3-point gap, meeting that minimum will almost certainly report a **null** (Floor 3 not met), not a JRS win. The 5–8/arm design is powered to detect a large effect (≈15–20 points), not a 6-point one.
- Floor 3 would be met at a small sample only if the true JRS advantage is much larger than 6 points. It could grow as more B1 reviewers complete, or it could stay small. The direction is favorable; the magnitude is not yet decisive.
- For the paper: report Arm B as preliminary and, on current data, a non-significant positive direction. Do not state JRS adds value until Floor 3 is actually cleared.

## To run the exact pre-registered (participant-clustered) test
The read-level test above is indicative. The registered Floor 3 test bootstraps over participants. Run this and paste the result; I will run the participant-level difference-CI (via `research/score_armb.py`):

```sql
WITH key(rec,truth) AS (VALUES
 ('R01','G'),('R02','U'),('R03','U'),('R04','G'),('R05','U'),('R06','G'),('R07','U'),('R08','G'),
 ('R09','U'),('R10','G'),('R11','U'),('R12','G'),('R13','U'),('R14','G'),('R15','U'),('R16','G'),
 ('R17','U'),('R18','G'),('R19','U'),('R20','G'),('R21','U'),('R22','G'),('R23','U'),('R24','G')),
latest AS (SELECT DISTINCT ON (reviewer_code,record_ref) reviewer_code,record_ref,jrs_read,rely,batch,created_at
  FROM ai_pilot_reads ORDER BY reviewer_code,record_ref,created_at DESC),
scored AS (SELECT l.reviewer_code,l.batch,k.truth,
  CASE WHEN lower(coalesce(l.jrs_read,''))='ready' THEN 'G'
       WHEN lower(coalesce(l.jrs_read,'')) IN ('needs work','gap') THEN 'U'
       WHEN lower(coalesce(l.rely,''))='yes' THEN 'G'
       WHEN lower(coalesce(l.rely,''))='no' THEN 'U' ELSE NULL END AS pred
  FROM latest l JOIN key k ON k.rec=l.record_ref)
SELECT reviewer_code, batch,
  count(*) FILTER (WHERE pred IS NOT NULL) AS graded,
  round(100.0*avg((pred=truth)::int) FILTER (WHERE pred IS NOT NULL),1) AS accuracy_pct
FROM scored
WHERE batch IN ('armB-B1','armB-B2')
GROUP BY reviewer_code, batch
HAVING count(*) FILTER (WHERE pred IS NOT NULL) >= 18
ORDER BY batch, reviewer_code;
```
