# Compatibility and Migration Analysis: v1 (0.1.0-validation) to v0.2

**The compatibility bridge is interpretive engineering, not a validation result.** Code: `lib/engine-evidence-contract/bridge.mjs`. Cases: `fixtures/bridge/BR-001` to `BR-016`.

## 1. Condition correspondence (label-based)

The v1 prompt numbers and names its keys. The v0.2 identifiers take the same names:

| v1 key | v1 prompt label | v0.2 condition |
|---|---|---|
| `basis_identification` | Basis Identification | `identifiable_basis` |
| `reasoning_traceability` | Decision-Process Traceability | `reasoning_traceability` |
| `cold_reviewer_clarity` | Reconstructability | `reconstructability` |
| `accountability_support` | Evidentiary Sufficiency | `sufficiency` |
| `temporal_reconstructability` | Chronology | `chronology_integrity` |

This is a correspondence of labels. The v1 and v0.2 instructions differ, so the same record can legitimately receive different findings. The correspondence of either vocabulary to Codebook conditions RC1 to RC5 is **NOT ESTABLISHED** (`standard/jrs-conditions.json`).

## 2. Status mapping

| v1 status | In v0.2 terms | Mapping | Effective v0.2 status | Why |
|---|---|---|---|---|
| review | review_required | **exact** | review_required | Same meaning |
| gap | gap | **lossy** | review_required | v1 gap has no offset-verified evidence |
| pass | supported | **ambiguous** | review_required | v1 pass asserted a condition was met; v0.2 supported asserts only that cited text is present. They are not the same claim, and v1 has no citation |
| invalid or missing | n/a | **not_mappable** | not_assessed | v1 parser would have rejected it |
| any, on a record over 8000 characters | n/a | **not_mappable** | not_assessed | v1 evaluated truncated text only |
| any, on an out-of-scope record | n/a | **not_mappable** | not_assessed | Outside the authorised scope |

**No historical result is migrated into v0.2 evidence.** `effective_v02_status` is never `supported` or `gap` (test: replay invariant and mutation M-14). The original output is preserved verbatim with its SHA-256, and each original status and note is kept unchanged.

Additional reasons recorded per condition: quotations in a v1 note found or not found in the record (found means presence only, not support: BR-008); empty note; a prohibited claim in the note (BR-013); a stored determination that conflicts with its conditions (BR-005); instruction risk in the record (BR-014); v1's lenient extraction of JSON from surrounding prose (BR-012).

## 3. Behaviour differences a user would see

| Behaviour | v1 | v0.2 |
|---|---|---|
| Record over 8000 characters | Truncated and evaluated | Refused; plan only |
| Embedded instructions | Not detected | Quarantined; favourable statuses routed to review |
| Prose around JSON | Accepted (regex extraction) | Rejected |
| Duplicate JSON keys | Last value wins silently | Rejected |
| Overall result | `determination` | None |
| Reworded employment content (e.g. "a staff member's termination") | Not checked (0.1 assurance gate also missed it: FM-03) | Refused (EC-013, EC-014) |

## 4. Migration approach

None automatic. A historical v1 result can be shown beside a v0.2 result (workbench section 9) for audit. A v1 result becomes usable under v0.2 only by re-running v0.2 on the record, with a candidate response that cites exact text. That is a new evaluation, not a migration.

## Claim, local engineering evidence, interpretation, limitation, external evidence

- **Claim.** The bridge preserves v1 outputs unchanged, labels every mapping, and never produces v0.2 evidence.
- **Local engineering evidence.** 16 bridge cases match pre-authored expectations; mutation M-14 (bridge migrates statuses) is killed.
- **Interpretation.** Historical results cannot be relabelled as v0.2 findings through this code.
- **Limitation.** The mapping labels (exact, lossy, ambiguous) are engineering judgments recorded here, not empirical findings about agreement between v1 and v0.2.
- **External evidence still required.** If agreement between v1 and v0.2 ever matters, a comparison on independently labelled material, reported as agreement between two systems and not as accuracy of either.
