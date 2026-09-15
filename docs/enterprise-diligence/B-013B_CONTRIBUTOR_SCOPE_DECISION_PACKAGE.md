# B-013B — `bench_outcomes` Contributor Scope

**STATUS: OPEN / OWNER ACTION REQUIRED.**

**This is NOT labelled a breach, and it is NOT labelled safe.** Both would be conclusions the
evidence does not support.

---

## The factual question, which code cannot answer

> **What were contributors told about the public accessibility of the raw records they
> submitted?**

**NOT ESTABLISHED from repository evidence.** The answer lives in the study protocol, the
consent wording and what was said to participants. **Phillip knows it; the repository does
not.** Everything below is context for that one question.

## Current state

| | |
|---|---|
| Policy | anon `SELECT`, `qual = true` |
| Rows | **54**, 2026-06-22 to 2026-08-08 |
| Contributors | **2** |
| `record` free text | all 54 rows; **mean 570 chars, max 2,358** |
| Email-pattern hits | **0** |
| SSN-pattern hits | **0** |
| Intentional readers | the public research pages read these tables by design |

## Why neither label applies

**Not a breach.** The study's outputs are published, the tables are read by public research
pages as designed, no direct identifiers were detected, and contributors submitted under a
protocol.

**Not automatically fine.** These are **contributor-supplied record texts**, not aggregates. A
pattern scan finding no emails or SSNs is evidence about two patterns, **not evidence that the
text is non-sensitive**. Public-records case material can identify people without containing a
single formatted identifier.

## Dispositions

| | Disposition | When it applies |
|---|---|---|
| 1 | Owner confirms the exposure was contemplated | If participants were told |
| 2 | Narrow the exposure | If they were not |
| 3 | Aggregate-view architecture | Keeps the research pages working, stops row-level reads |
| 4 | Minimise `record` in future submissions | Forward-looking, does not address existing rows |
| 5 | Counsel or privacy review | If disposition 1 cannot be established from the record |

**No disposition is recommended here**, because the recommendation depends entirely on the
factual question above.

## What was not done

**No research record altered. No figure changed. No row modified or deleted. No historical
research record rewritten.** The 54 rows are study evidence and are not this workstream's to
touch.
