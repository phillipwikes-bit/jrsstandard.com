# IncomeOS execution evidence, 18 November 2026 (C): negation scope and alternative-interpretation lens

Lane: DS-N1 (Claude Code). Status stays INTEGRATION_IN_PROGRESS. Builds on `claude/ds-n1-partner-record-classes` (draft #216). Owner instruction the same day: "Continue all recommended actions" (the negation fix, the missing lens, the partner walkthrough).

## 1. Negation scope (commit 7284976f, baseline in the following commit)

Defect recorded in `EXECUTION-EVIDENCE-2026-11-18-B.md`: the polarity check read the source clause only up to the end of the quoted words, so "evaluation of X" quoted from "evaluation of X was not completed" passed. `lib/ds-n1/assess.mjs` now reads to the next , ; : or the sentence end. A separate trailing clause (", with no findings"; "; no exceptions were raised") is still ignored.

- `tests/ds-n1/negation-scope.test.mjs`: 4 tests. The trailing-negation test fails on the old rule (3 pass, 1 fail) and passes with the fix.
- Developer eval (`eval.mjs --no-write`), stress dev split and isolation eval: identical statuses and finding codes before and after, compared line by line with timestamps excluded.
- Report hashes change because every report records the full clause used (`checks[].source_clause`, and the NEGATION_CONFLICT explanation that quotes it). `REPRO_BASELINE.json` was regenerated with `reproduce.mjs --write-baseline` from a clean clone of the fix commit, in its own commit. This was an intended output change, not a tolerance change.
- The report's LIMITATIONS line now states that negation is checked in the quoted clause and qualification in the whole sentence (the old text, "compare whole sentences", was inaccurate before this change too).
- Correction to an earlier same-day note: an initial "baseline unchanged" reading was taken before the change was committed. `reproduce.mjs` clones the committed HEAD, so it had not yet seen the change.
- Not run: the sealed HOLDOUT-2 (needs owner authorization). Its stored results predate this change.

## 2. Alternative-interpretation lens

`lib/ds-n1/cognitive-observations.mjs` (0.2.0-dev) adds a read-only observation, `alternative_interpretation`, raised once per claim when an unresolved EVENT_ROLE_CONFUSION, SUBJECT_MISMATCH or RELEVANCE_NOT_ESTABLISHED finding shows the cited source may describe a different event, actor or matter. Question: "What other reading of the cited source fits the evidence, and why was this one chosen?" It proposes no alternative fact and changes no finding or status. Written for DS-N1 independently; no code from the owner's separately offered product.

- Fires on D01, D02, D04, D05 and AUTH-D01; not on P01 to P05, AUTH-P01, or D11 (a dropped qualification is not an alternative reading).
- `tests/ds-n1/alternative-interpretation.test.mjs`: 4 tests; 2 fail without the lens.
- Reviewer view labels the new kind. Bridge output carries it through `cognitiveObservations`.

Coverage of the six lens concepts the owner asked for: observation vs inference, selective evidence, instruction integrity (existing); premature closure, unsupported certainty (#215); alternative interpretation (this change).

## Executed verification (local)

Node v22.23.5, Chromium 1243, Playwright 1.63.0. Bridge, server boundary, evidence export 20/20. Native DS-N1 suites 75/75. Programme, original verification, source boundary, release gate passed. Reviewer browser 26/26. Panel browser at 320, 375, 430 px passed. `reproduce.mjs`: no differing outputs against the regenerated baseline.

Not run: accounting-lane suites, real devices, HOLDOUT-2, any effectiveness evaluation.
