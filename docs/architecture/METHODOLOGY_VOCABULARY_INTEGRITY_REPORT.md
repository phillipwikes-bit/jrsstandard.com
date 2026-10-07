# Methodology Vocabulary Integrity Report

**Date:** 2026-10-06 · **Branch:** `claude/engine-local-candidate-2026-10-06` · **Status:** internal, not deployed (`*.md` and `tools/` are excluded by `.vercelignore`).

**Governing rule.** A shared word, a similar concept or a plausible interpretation does not establish a formal mapping. A correspondence needs the authoritative source version, the exact source location, the exact candidate term, the mapping type, the evidence basis, the status and an owner-approved interpretation date. Without all seven, the term is recorded as unmapped, proposed, historical, not assessed or retired, and every display reads "No Codebook correspondence asserted."

**Result in one line.** No correspondence between any candidate, workspace, Manifest or research term and a JRS condition is approved in this repository, so the register records no correspondence asserted for every such term, and the workspace shows exactly that.

Machine records: `tools/methodology-integrity/source-register.json`, `tools/methodology-integrity/current-correspondence-register.json`, `tools/methodology-integrity/generated/scan-results.json`. Generated views: `METHODOLOGY_SOURCE_REGISTER.md`, `METHODOLOGY_CORRESPONDENCE_REGISTER.md`. Tool: `tools/methodology-integrity/README.md`.

## 1. Sources located

| ID | Path | Version or date | Status |
|---|---|---|---|
| SRC-CODEBOOK | `codebook.html` | 1.0 (2026-06-03), Experimental | CANONICAL |
| SRC-STANDARD-PDF | `JRS-Standard.pdf` | Version 2.0, 2026 | CANONICAL |
| SRC-STANDARD-HTML | `jrsstandard.html` | Documentation Review Methodology v1.0, May 2026 | NOT_ASSESSED |
| SRC-METHODOLOGY-HTML | `methodology.html` | not stated | NOT_ASSESSED |
| SRC-CONDITIONS-JSON | `standard/jrs-conditions.json` | jrs_version 1.0, 2026-09-14 | DRAFT |
| SRC-MANIFEST-SCHEMA | `schemas/jrs-decision-reconstruction-manifest.schema.json` | Manifest 1.0 schema | NOT_ASSESSED |
| SRC-DRR-PAGE | `decision-reconstruction-risk.html` | not stated | NOT_ASSESSED |
| SRC-RESEARCH-CVP | `research/CONSTRUCT_VALIDITY_PACKAGE.md` | not stated | NOT_ASSESSED |

Each source carries the sha256 it was reviewed at. The builder re-hashes every source and every correspondence decision record (D-2, the D-3 review, the D-3 matrix, BD-04 and the mapping record) and refuses to run if any has changed, so a changed source is reviewed again before any record is re-bound to it.

## 2. What could and could not be classified canonical

**Classified CANONICAL (on repository evidence, not filenames):**
- **The Codebook, `codebook.html` v1.0.** The page calls itself "The authoritative definition of the five components of decision defensibility", and owner decision D-3 records that the Codebook is the methodological authority. A canonical Codebook can therefore be named. Its limits: no separately signed Codebook document is tracked, and all five conditions are marked Experimental on the page.
- **The Standard PDF, `JRS-Standard.pdf` Version 2.0.** CLAUDE.md 36.1 names it the single canonical main PDF. That table governs link targets; no instrument ranks the PDF above the Codebook on methodology.

**Could not be classified canonical:**
- **`jrsstandard.html`** presents v1.0 and its version note reads "Four review conditions established", while other text on the page refers to five. Its relation to PDF Version 2.0 is not recorded. Which governs is NOT ESTABLISHED.
- **`methodology.html`** does not identify itself as the Standard or the Codebook.
- **`standard/jrs-conditions.json`** says it was derived from the historical engine prompt (`api/review.js` SYSTEM_PROMPT), so it cannot be an independent source; every engine-key mapping in it reads NOT ESTABLISHED. DRAFT.
- **The Manifest schema** is a schema; its field names are implementation vocabulary.
- **The DRR page and the construct-validity package** are research and public term sources, not condition sources.

**A difference between the two canonical sources, recorded and not resolved.** The PDF calls Reconstructability "the whole-record requirement the other four serve"; the Codebook calls Evidentiary Sufficiency "the aggregate condition". The five names match across the two documents, but their definitions have not been compared, so the five JRS_CONDITION records are NOT_ASSESSED.

## 3. Correspondence statuses

69 records in the current register.

| Status | Records |
|---|---|
| APPROVED_CORRESPONDENCE | 0 |
| UNMAPPED | 40 |
| PROPOSED_NOT_APPROVED | 3 |
| HISTORICAL_REFERENCE_ONLY | 6 |
| NOT_ASSESSED | 19 |
| RETIRED | 1 |

- **Candidate review keys.** `cold_reviewer_clarity` is UNMAPPED under D-2: not a JRS condition. `accountability_support` is UNMAPPED: not Evidentiary Sufficiency and not Decision-Process Traceability without an approved record. `basis_identification`, `reasoning_traceability` and `temporal_reconstructability` are PROPOSED_NOT_APPROVED: the proposals are the D-3 name match and the BD-04 declarations for the historical API keys of the same names, which were "DECLARED, not UPGRADED" and never approved for this candidate. Every key record uses NO_CORRESPONDENCE_ASSERTED.
- **Candidate prompts are not Codebook mappings.** The explanation categories, finding types and model-output checks are UNMAPPED. `chronology_gap` shares the word "Chronology" with a condition name, and `insufficient_evidence` resembles "Evidentiary Sufficiency"; neither resemblance is a correspondence.
- **Source-prep checks** (11) are deterministic input controls, not contextual JRS determinations: UNMAPPED.
- **Workspace labels and dispositions** are display vocabulary: UNMAPPED.
- **Manifest fields are not methodology terms.** `jrs_codebook_1.0` is an IMPLEMENTATION_REFERENCE, NOT_ASSESSED; the Manifest builder refuses it without an owner-declared mapping, and none exists.
- **Research terms are not Engine vocabulary.** DRR, the Ready / Needs work / Gap scale, the "ten conditions" and the five conditions as applied by human reviewers are NOT_ASSESSED. The construct-validity crosswalk is HISTORICAL_REFERENCE_ONLY.
- **Historical API engine keys** (5) are HISTORICAL_REFERENCE_ONLY. The retired record is the `accountability_support` assignment to `insufficient_evidence`, removed in explanations 0.2.0.

## 4. Scan results

The scanner read 97 files in seven scope groups (69 when this package was written, 86 after the claim-provenance package, 89 after the frozen demonstration package; see the addenda) (candidate, workspace, methodology-integrity, Manifest, protocol and internal documentation, research summaries, correspondence decision records).

| Disposition | Findings |
|---|---|
| ALLOWED | 49 |
| REQUIRES_APPROVED_RECORD | 12 |
| UNSUPPORTED_MAPPING | 3 |
| HISTORICAL_ONLY | 16 |
| AMBIGUOUS_REVIEW_REQUIRED | 8 |

**Gated scope: 0 failures.** Every unsupported, unapproved or ambiguous finding outside the correspondence decision records was repaired, is clearly historical, or is an acknowledged ambiguity listed in section 6. The 3 UNSUPPORTED_MAPPING, all 12 REQUIRES_APPROVED_RECORD and 7 of the 8 AMBIGUOUS_REVIEW_REQUIRED findings sit in the owner correspondence decision records (`D-2_CODEBOOK_CORRESPONDENCE_MEMO.md`, `CODEBOOK_API_CORRESPONDENCE_REVIEW.md`, `METHODOLOGY_TO_API_MAPPING.md`). Those are reported and not gated: they are owner decision evidence about the closed historical API keys, preserved under CLAUDE.md Rule 10, and their pairings are exactly what has no approved record.

## 5. Unsupported or ambiguous mappings found and repaired

| Where | Found | Repair |
|---|---|---|
| `research/CONSTRUCT_VALIDITY_PACKAGE.md` | A data-key crosswalk called "authoritative", including `cold_reviewer_clarity` beside RC5 Evidentiary Sufficiency, against D-2, with no owner approval for any row | Dated correction notice (OLD FINDING, NEW EVIDENCE, CORRECTED STATUS, EXPLANATION) above the key list. The table is kept unchanged. Corrected status: historical research labelling only, no correspondence asserted |
| Workspace, `app/core.js` and `app/workspace.js` | The notice read "No Codebook mapping asserted" as fixed text, only on findings with an explanation, and the candidate key status lines carried no notice | Codebook wording now comes only from the generated snapshot `app/correspondence.js`, which renders a mapped label solely from an approved record with its source hash and owner-approval date. Every finding card and every key status line now reads "No Codebook correspondence asserted." |
| `lib/engine-candidate/README.md` | A sentence placing `accountability_support` beside Evidentiary Sufficiency without saying that no correspondence is asserted | Now states that no correspondence is asserted (documentation only; no candidate code changed) |

**Found and not repaired, by design:**
- `lib/engine-candidate/explanations.js` line 14: a comment says, attributed to the D-3 review, that "only basis_identification has an exact Codebook correspondence". The review said that about the historical API key; no approved record carries it to this candidate, which exports `CODEBOOK_CORRESPONDENCE = 'not_asserted'`. Not edited, because any change to candidate `.js` moves the release-gate `candidate_source_commit` binding. Acknowledged in `reviewed-dispositions.json` as AMBIGUOUS_REVIEW_REQUIRED.
- `api/_manifest/build.js` line 16: "Relabelling engine keys as Codebook conditions would silently answer D-2" states the consequence of a prohibited act. API routes are outside this package; reviewed as ALLOWED, bound to the line's hash.
- `docs/architecture/PR39_MERGE_RECOMMENDATION_2026-10-06.md` line 39: quotes the prompt 0.3.0 wording identified as a conflict and since removed; reviewed as HISTORICAL_ONLY.
- The correspondence decision records listed in section 4.

## 6. Genuine ambiguities for future owner review

These are recorded. None is resolved here, and no approval is requested by this report.

1. **BD-04 and the current candidate position.** BD-04 (2026-09-16, under the owner's delegation) declared three historical API key pairs SEMANTIC / INFERRED "as the intended mapping". The 2026-10-06 candidate asserts no correspondence for any key and lists `accountability_support` as explicitly unmapped. Whether BD-04 should carry to the candidate, be withdrawn, or stay historical is open.
2. **The aggregate condition.** PDF Version 2.0 gives the whole-record role to Reconstructability; Codebook v1.0 gives it to Evidentiary Sufficiency.
3. **The Standard page.** `jrsstandard.html` v1.0 against PDF Version 2.0; its "Four review conditions established" note against five conditions elsewhere; and its separate "ten conditions" vocabulary.
4. **The candidate comment** described in section 5, which can be reworded only with a release-gate rebinding.
5. **The correspondence decision records** themselves present key-to-condition pairings for the historical API keys (EXACT, SEMANTIC, UNRESOLVED). They are authoritative records of what was decided then; whether any of them is meant to apply to the candidate is not recorded.

## 7. Limitations

- The register records what the repository shows. Source status rests on statements inside the repository; nothing outside it was consulted.
- The scanner is a line-level heuristic. It recognises the listed phrases, negation in the clause before a match, identified quotations, historical markers and approved record IDs. It cannot read meaning, so it can miss a mapping phrased in other words and can flag a sentence a person would read as harmless. What it cannot place is AMBIGUOUS_REVIEW_REQUIRED.
- Reviewed dispositions are tooling judgements bound to the exact line text. They are not owner decisions and not approvals.
- Public pages were not changed and were scanned only as sources, not in the gated scope.

## 8. Why this register does not validate the Engine

The register records which words have an approved relationship to the methodology. It does not validate the Engine. It says nothing about whether any candidate finding is correct, whether the candidate detects what a JRS reviewer would detect, or whether its output is reliable or reproducible. An approved correspondence, when one exists, will establish only that a term is owner-approved to refer to a methodology term; whether the Engine measures that term would still need its own evaluation evidence.

## 9. Why the absence of a mapping is not a defect in the Standard

The absence of a mapping is not a defect in the Standard. The Standard and the Codebook define the five conditions for human review, and they are complete on their own terms. The candidate's review keys are implementation prompts written later and separately. That no approved correspondence connects the two describes the state of the implementation, not a gap in the methodology. Owner decision D-3 records that the methodology will not be changed to fit an implementation, and this register follows it: where no correspondence is approved, it records no correspondence asserted rather than inventing one.

## 10. Verification

| Command | Result |
|---|---|
| `node tools/methodology-integrity/build.mjs --check` | committed registers, Markdown and workspace snapshot equal a fresh build |
| `node tools/methodology-integrity/scan.mjs --check` | 0 gated failures |
| `node tests/methodology-integrity/run-all.mjs` | all suites and the mutation run |

## Addendum, 2026-10-06: scope growth from the claim-provenance package

The 17 internal documents added by the claim-provenance package (`CLAIM_EVIDENCE_REGISTER.md`, `PUBLIC_CLAIM_LIMITATION_MATRIX.md`, `CLAIM_PROVENANCE_INTEGRITY_REPORT.md`, `PUBLIC_CLAIM_REPAIR_PROPOSALS_2026-10-06.md` and 13 claim cards under `docs/architecture/claim-cards/`) fall inside this scanner's `docs/architecture` scope. The scan grew from 69 to 86 files. Every disposition count in section 4 is unchanged, and the gated scope still has 0 failures. `generated/scan-results.json` was regenerated to match.

## Addendum, 2026-10-07: scope growth from the frozen demonstration package

The three internal documents `FROZEN_DEMONSTRATION_CAPABILITY_MATRIX.md`, `FROZEN_DEMONSTRATION_EVIDENCE_RECORD.md` and `FROZEN_DEMONSTRATION_REPLAY_PROTOCOL.md` fall inside the `docs/architecture` scope. The scan grew from 86 to 89 files. The new files add no finding, every disposition count in section 4 is unchanged, and the gated scope still has 0 failures. One existing finding moved from line 29 to line 30 of `lib/engine-candidate/README.md` because a line was added above it. `generated/scan-results.json` was regenerated to match.

## Addendum, 2026-10-07: scope growth from the evaluation-readiness package

The eight internal documents of the controlled independent-evaluation readiness package (`CONTROLLED_INDEPENDENT_EVALUATION_READINESS_PROTOCOL.md`, `EVALUATION_SCOPE_AND_REFUSAL_MATRIX.md`, `CODEBOOK_MAPPING_AND_INTERPRETATION_SEPARATION_PROTOCOL.md`, `INPUT_CONTAMINATION_AND_DEVELOPMENT_MATERIAL_EXCLUSION_PROTOCOL.md`, `FUTURE_RUN_EVIDENCE_LEDGER_SPECIFICATION.md`, `AUTHORITY_AND_RELEASE_GATE_RESPONSIBILITY_MATRIX.md`, `LEGACY_GUARD_FAILURE_TRIAGE_RECORD.md` and `EVALUATION_READINESS_BASELINE_2026-10-07.md`) fall inside the `docs/architecture` scope. The scan grew from 89 to 97 files. The new files add no finding: the codebook-mapping protocol names the five conditions without placing any Engine candidate key beside them. Every disposition count in section 4 is unchanged, and the gated scope still has 0 failures. `generated/scan-results.json` was regenerated to match.
