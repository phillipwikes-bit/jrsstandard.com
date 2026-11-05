# DS-N1 cognitive-review increment: SP-07, SP-13 and SP-14 candidates
Date: 2026-11-05
Status: PRIVATE DEVELOPMENT, not merged, not deployed, not independently validated.

## Primary-source reference and custody

Owner-supplied `JRS_DRR_Decision_Spellchecker_Comprehensive_Master_Issue_3_6(10).pdf`, 410 pages, SHA-256:
`04a085192b45a3c48e557ab5b3c38238dacba393865c03b5b9d520ae748081b6`.

The controlling historical annex's original Decision Spellchecker component inventory appears at physical PDF page 269 and following pages (internally printed 30 October 2026 planning programme pages 26 to 28). Source-level requirement descriptions:

- SP-07: Observation/inference/alternatives/evidence/state review in progressive disclosure. Adverse check: no concealed interaction burden or psychological diagnosis.
- SP-13: Optional, case-specific, evidence-faithful calibration note. Adverse check: no automatic learning of legal norms, unsupported correction, or training on client records.
- SP-14: Restrain/Reframe/Recalibrate/Release only as a secondary behavioral design vocabulary. Adverse check: no override of Detect/Reflect/Correct/Connect or implied automatic release.

These descriptions are source-document evidence, not acceptance of the original DS-A software. The original DS-A source remains `AUTHENTIC_SOURCE_NOT_RECOVERED`; this increment changes DS-N1 only.

## Implementation

- `lib/ds-n1/cognitive-controls.mjs` maps **existing** DS-N1 findings to six focused review lenses. It synthesizes no findings, does not change status, does not infer a reviewer's state, and does not identify AI authorship. Explicit rule-code mapping is deterministic.
- `lib/ds-n1/ui/app.mjs` presents a separate cognitive-review area, with source-linked existing findings, bounded excerpts, progressive-disclosure learning/reflection guidance, and a functional link back to the existing human action controls. Text uses DOM text nodes, not markup interpolation.
- `lib/ds-n1/ui/reviewer.html` adds the section without altering the primary review flow.
- Candidate SP-13 explanations are tied to the existing condition and finding but currently use a generic, condition-specific note. **Case-specific explanatory fidelity remains PARTIAL** and requires further development and negative-case tests.
- Candidate SP-14 provides four optional guidance stages. It does not perform a release action or change review disposition.

## Evidence and local verification

A separate, isolated Node v22.16.0 test run of the cognitive projection:
`node --test tests/ds-n1/cognitive-controls.test.mjs`
Result: **6 passed, 0 failed, 0 skipped**, using constructed in-memory states. Module syntax checked separately. The GitHub branch source was subsequently checked for syntactic parse of the module and reviewer script without executing the reviewer interface.

These checks are developer tests only. Full repository unit/integration suites, the original 24-record harness, Chromium browser tests, physical iPhone Safari, screen-reader checks, full workflow integration, and independent evaluation **were not executed in this increment**. No new holdout was opened.

## Release / source continuity

The working branch starts from existing DS-N1 draft PR #119 head `f8c7a2ad5fa81e7922401b7937530161ec97e61f`. This is a separate change branch and must be reviewed against the latest PR #119 head before integration. No `main`, JRS public website, Vercel configuration, database, stored research evidence, historical test-result file, engine rule version, or production application has been changed.

A cognitive prompt is not a new evidence finding. SP-07, SP-13 and SP-14 remain **NOT ACCEPTED FOR ORIGINAL DS-A** and their DS-N1 candidate implementation remains **SOURCE TESTED / BROWSER NOT VERIFIED**, not original-product acceptance or production approval.

## Next engineering increment

1. Run complete existing DS-N1 unit, fixture, replay and browser tests on an accessible full checkout. Investigate any regression; preserve previously failed results.
2. Verify the progressive-disclosure step count, source passage accuracy, keyboard focus and iPhone viewport behavior. Test absence of inferred motive/bias diagnosis.
3. Strengthen SP-13 with genuinely case-specific evidence-faithful explanations rather than generic condition notes, retaining no model calls or covert training.
4. Reconcile all SP-01 through SP-18 from the exact original physical source document and identify incomplete functions.
5. Coordinate single-writer ownership before integration with the IncomeOS Decision Spellchecker programme ledger.
6. Preserve the sealed holdout and all production, rights, commercial and external-contact release holds.
