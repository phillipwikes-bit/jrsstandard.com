# Engine 0.4.0 design check (2026-10-03): the rule-based layer fails before any paid test

**Owner instruction:** build the proposed design and test it on fresh texts with rules fixed in advance. The design is:
- flag missing record citations or speakers only when the rule-based count is **zero**;
- ask the AI only about decision-maker, criteria and responses considered.

**Result: not built, and the paid test was not run.** A free, deterministic check showed the design fails in its intended use.

## The check (OBSERVED; no model calls)
- **Records:** the 24 sample records in `ai-records-pilot.html` (`var RECORDS`). They were written by the JRS project in HR, investigation, audit, AML, records-request, legal and administrative settings. They are the only non-EEOC records in the repository.
- **Counter:** the DRR Test Suite extractor v1.2 (`research/drr-suite-v0.9/lib/anchors_v12.py`), which the 0.4.0 rule layer would use.
- **Disclosure:** the counts were looked at before any protocol was fixed. That is acceptable only because the check is deterministic and no hypothesis was tested on it.

| What the rule counts | Records with a count of zero |
|---|---|
| Record citations | **23 of 24** (only R20, which uses "Ex. A", is counted) |
| Attributed speakers | **24 of 24** |
| Dates (full dates or month and year) | **24 of 24** |

**Twelve of the records are well documented by my reading** (*Inference*; the page carries no answer key): R01, R04, R06, R08, R10, R12, R14, R16, R18, R20, R22 and R24. Each states dated events and names its sources, for example:
- "email dated March 25, on file";
- "the maintenance log";
- "two witnesses (April 6)";
- "the manager attributed the difference to a documented coverage gap";
- "pay stubs (January, February, March)".

Under 0.4.0 these well-documented records would be flagged for missing citations in **11 of 12** and for missing speakers in **12 of 12**.

## Why the counter misses them
- **Dates:** it reads only a month, day and year, or a month and year. These records write "March 25" with no year.
- **Citations:** it reads only federal-sector forms (ROI at N, Exhibit, Ex., Tab, Id.). These records cite "email dated", "on file", "log", "ticket", "recording timestamps" and "pay stubs".
- **Speakers:** it reads only role labels (Complainant, S1, RMO2, Supervisor) followed by a speech verb from a fixed list. These records say "the manager attributed", "the account lead documented" and "we interviewed".

The counter was built for one text family, EEOC decisions, and it is accurate there (parity on 473 files). A rule that equates "zero of my patterns" with "missing" is therefore a format detector, not a gap detector.

## Why the paid test would have misled
- On EEOC texts with rule-made deletions, a zero-count rule catches every deletion and never flags an intact text, **by construction**. The test would have passed.
- That pass would have said nothing about real HR, audit or legal records, where the check above shows the rule fails almost everywhere.
- Spending on it would produce a number that looks like evidence and is not.

## The AI half of the design
- It is untested here. Part 2b gives a warning, though: asked to list what a record lacks, the model named `criteria` in 38 of 72 runs on intact texts (`runs/PART2B_SCORES.json`).
- There is no ground truth for criteria in those texts, so this is not a measured false-flag rate. But it is the pattern that sank the citations and attributions list.

## What would have to change (PROPOSED)
1. **A format-general counter.**
   - Patterns for the citation and speaker forms used in workplace, audit and records-request writing, built on a **labelled development set of non-EEOC records** that does not yet exist.
   - Its own fixed protocol: dev and held-out records, with false flags measured on the well-documented ones.
   - The 24 pilot records are too few, and too clean, to be both the dev set and the test.
2. **Or no rule layer at all.** Keep Engine 0.1.0's five conditions, which are specific on dates in two tests, and report citation and attribution gaps through human review rather than automation.
3. **For any AI list:** a labelled set where decision-maker, criteria and responses are known to be present or absent, so false flags can be measured before release.

## State
- No Engine code was written for 0.4.0. Production stays on Engine 0.1.0 (`api/review-engine.js`, SHA-256 prefix `97176e22`).
- No paid calls were made. No fresh EEOC texts were downloaded.
