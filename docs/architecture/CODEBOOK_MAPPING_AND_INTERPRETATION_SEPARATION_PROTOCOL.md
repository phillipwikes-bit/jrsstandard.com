# Codebook mapping and interpretation-separation protocol (internal)

**Package `JRS-EVAL-READINESS-20261007-PR39`. Status `PLANNING_ONLY`.** Machine-readable mapping: `tools/evaluation-readiness/codebook-mapping.json`. Enforcement: `tools/evaluation-readiness/lib/workspace.js`.

## Current implementation, target and absent evidence
- **Current implementation:** the mapping binds Codebook v1.0 (`codebook.html`, sha256 `f70d1cf4…`). The workspace refuses any interpretation that does not name a condition by ID.
- **Target:** reviewers interpret real records under a Codebook revision frozen for the evaluation.
- **Absent:** no owner record freezes a Codebook revision for evaluation. The page classifies all five conditions as Experimental.

## The five conditions
| ID | Canonical name (repository) | Assignment label (2026-10-07 brief) |
|---|---|---|
| RC1 | Reconstructability | Reconstructability |
| RC2 | Basis Identification | Identifiable basis |
| RC3 | Chronology | Chronology integrity |
| RC4 | Decision-Process Traceability | Reasoning traceability |
| RC5 | Evidentiary Sufficiency | Sufficiency |

Every stored interpretation carries the ID, RC1 to RC5. An assignment label resolves to its ID for lookup only and is never stored in its place. Any other label is refused (WS-04), as is any substitute that would hide which condition is meant.

## Candidate output stays separate
The Engine candidate has five prompt keys of its own (listed in `codebook-mapping.json`). They are Engine output vocabulary. There is no correspondence between them and the five conditions: owner decisions D-2 and D-3 record that none is asserted, and no owner-approved correspondence record exists. A candidate key is refused as a condition (WS-04), and candidate output that names a condition is refused (WS-05).

## Four workspaces, never collapsed
| Workspace | Holds | Who creates it |
|---|---|---|
| Extraction | record-supported facts (with a location) and extraction artifacts (with a version) | independent reviewer; an extraction tool for artifacts only |
| Interpretation | one reviewer's determination on one condition, made blind to candidate output | independent reviewer, never code |
| Comparison | candidate Engine output (candidate key only) and reviewer disagreements (two or more reviewers) | the Engine candidate; a comparison tool or adjudicator |
| Adjudication | adjudicated conclusions, only under a frozen adjudication protocol | an adjudicator who is not one of the reviewers |

A gate conclusion belongs to no workspace. Only the responsible role records it, in the release-gate record (WS-01).

## Determinations
| Determination | Meaning | Requires |
|---|---|---|
| AFFIRMATIVE_DEFECT | something in the record defeats the condition | a location |
| INFORMATION_MISSING | something the condition needs is absent; absence is kept apart from defect | the missing element named |
| NO_DEFECT_OBSERVED | none observed at the stated locations; not a finding of overall sufficiency | a location |
| INSUFFICIENT_BASIS_TO_ASSESS | the reviewer cannot assess from the record as supplied | a reason |

Every determination states its uncertainty (`stated_low`, `stated_moderate`, `stated_high` or `not_stated`). Locations are `{ source_ref, locator }` only; record text is never stored (WS-02). Notes are screened for inferences about emotion, intent, motive, payoff, credibility, clinical state and legal or compliance conclusions (WS-07).

## No scoring
No DRR score, agreement statistic or classification is computed. `computeAgreement` refuses with one reviewer (WS-10), and with two or more until the interpretation and calibration protocols are frozen. `computeDrrScore` refuses until all four freezes exist (WS-11). Both still refuse after the freezes, because no protocol for them is frozen or implemented.
