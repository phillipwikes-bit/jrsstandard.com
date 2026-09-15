# B-013B — Owner Factual Confirmation

**This form asks one factual question. It does not ask you to choose an option, because the
right option depends entirely on the answer.**

---

## The question

> **What were contributors told about the public accessibility of the raw records they
> submitted to the validation study?**

**[ ] They were told, or it was reasonably implied, that submitted records would be publicly
readable as part of an open research programme.**

**[ ] They were not told. Public readability of the raw records was not contemplated.**

**[ ] I do not recall / it is not recorded anywhere.**

**Supporting detail, if any (protocol wording, consent text, what was said):**

_______________________________________________________________________

## Why this cannot be answered from the repository

The answer lives in the study protocol, the consent wording and what was actually said to
participants. **NOT ESTABLISHED from repository evidence.** No amount of code inspection
produces it, and inferring it would be manufacturing consent scope.

## The facts that are established

| | |
|---|---|
| Table | `bench_outcomes`, anon `SELECT` with `qual = true` |
| Rows | **54**, 2026-06-22 to 2026-08-08, **2 contributors** |
| `record` free text | all 54 rows, **mean 570 characters, max 2,358** |
| Email-pattern hits | **0** |
| SSN-pattern hits | **0** |
| Intentional readers | the public research pages read these tables by design |

**This is NOT labelled a breach** — the study's outputs are published, the tables are read by
design, and no direct identifiers were detected.

**It is NOT labelled safe either.** These are contributor-supplied record texts, not
aggregates, and **a scan finding no emails or SSNs is evidence about two patterns, not evidence
that the text is non-sensitive.** Public-records case material can identify a person without
containing one formatted identifier.

## What follows from each answer

| Your answer | Likely disposition |
|---|---|
| Told / implied | Confirm intended exposure and record it. No change |
| Not told | Narrow the exposure, or move to an aggregate view. **Possible privacy-counsel question** |
| Not recorded | **Counsel review**, because the gap itself is the issue |

**No research record, figure or row was altered, and none will be without a separate
instruction.**

**Signed:** ____________________  **Date:** ____________
