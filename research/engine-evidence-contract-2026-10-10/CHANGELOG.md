# Changelog: Evidence Contract 0.2.0 (local)

2026-10-10, one session, working tree of draft PR #40 (`claude/engine-assurance-2026-10-10`, head `0fa62a1`). Nothing committed, pushed, merged or deployed. File list: `PHASE_2_HANDOFF.md` section 2.

## Defects and corrections found during the build (OLD, NEW EVIDENCE, CORRECTED)

1. **Fixed limitation tripped the claim guard (my wording).** The presence limitation ended "…or that the underlying decision was justified", more than eight words after its negation. Result validator RV-14 rejected every result on the first replay. Rephrased so the negation is local. The guard was not changed.
2. **Evidence-failure reason ordering (code defect).** A fabricated quote with inconsistent offsets was reported as `offset_length_does_not_match_quote`, hiding the root cause. Found by EC-004 and EC-017, whose expected results were written before the run. The verifier now reports absence from the record first. Outcomes were unaffected (`review_required` throughout).
3. **Neutrality guard missed a question-form recommendation (code defect).** "Should the access be revoked?" passed. Widened to modals of obligation and revocation and termination verbs.
4. **Widened guard withheld 0.1 CC-04 learning text.** It contained "should prompt". The 0.1 package was not edited; v0.2 supplies `LEARN_OVERRIDES`.
5. **Mutation M-09 survived (test gap).** Disabling the neutrality guard was not detected. Probes added; M-17 added; both killed.
6. **Long-record expectations (pre-run correction).** LR-003 and LR-005 first expected a chronology review point although all their dates are in one segment. Corrected before any code ran on them, and disclosed in `generate_fixtures.py`.
7. **Workbench heading `Validated evidence` (my wording).** Caught by the content guard in the README. The rendered pages carried the same heading but were not scanned. Heading changed to "Offset-verified evidence", and a content-guard check over rendered page text was added.

8. **The changelog entry for item 7 was itself flagged** (the guard counts a term as quoted only when the quote mark closes directly after it). Changed to code formatting. The guard was not changed.

No expected result was changed after a run to match the code.
