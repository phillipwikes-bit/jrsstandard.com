# Adaptive Failure Mode Register

Local ID: ARC-DOC-12 (NON-CANONICAL). Knowledge references are to `knowledge-base/KNOWLEDGE_BASE.jsonl`.

## Local engineering claim
This register lists the open Engine failures found in Phase 4, the known limits of the change-control system itself, and the defects found and corrected while building it.

## Local evidence
`corpus-expansion/OPEN_FAILURES.json`, `stability-laboratory/STABILITY_RESULTS.json`, suite sections E, F and L.

## Open v0.3 failures (not fixed; v0.3 is frozen)
| ID | Case | Failure | Unsafe direction | Knowledge | Proposal |
|---|---|---|---|---|---|
| AF-01 | AR-040, ST-14 | Reworded employment outcomes are not refused | yes | RKB-046 | R-01 (isolated drift: AR-040 refused, no other change) |
| AF-02 | AR-010 | Assessment dated after the decision is not detected | yes | RKB-041 | R-02 (isolated drift: AR-010 lowered, no other change) |
| AF-03 | AR-011 | Two different expiry dates are not detected | yes | RKB-042 | R-03 |
| AF-04 | AR-035 | "acted lawfully" in a candidate note is not rejected | yes | RKB-045 | R-04 |
| AF-05 | AR-025 | Paraphrased control conflict is not detected | no (sufficiency stays review) | RKB-044 | R-05 (deferred architecture item) |
| AF-06 | AR-038 | A homoglyph defeats the override pattern; caught only by a second phrase | latent | RKB-048 | R-06 |
| AF-07 | ST-09 | Duplicate Cognitive Control object per affected condition | low | RKB-047 | R-09 |

## Limits of the change-control system (after the 0.4.1-local repairs)
| ID | Limit | Status |
|---|---|---|
| AL-01 | Proposal descriptors are self-declared | Repaired for behavioural proposals: risk comes from the observed-change record; declarations only add refusals. Remaining: a non-behavioural proposal (no Engine target, no behavioural type or flag) is still judged on its declared type and wording |
| AL-02 | Scope, claim and release wording checks are lexical | Remains. Synonyms ("vetted", "signed off", "fit for launch"), other languages and confusable characters are not caught. Scope wording over-rejects when refusal wording follows the match (X-06, Y-05, Y-08, Y-10, Y-11, Y-12) |
| AL-03 | Drift and observation see only the 85 fixtures | Remains. A patch whose effect falls outside the corpus shows no drift |
| AL-04 | Component-to-fixture map is hand-authored | Remains; behavioural changes still require the full suite |
| AL-05 | Knowledge base chain shows edits, not authorship | Remains |
| AL-06 | All fixtures share one base record family | Remains (RKB-049) |
| AL-07 | Gate simulator "present" means a file exists | Remains; the console now labels it "local file present (not a gate result)" |
| AL-08 | Observed-change records are hash-bound, not signed | New. A fabricated record with internally consistent hashes would pass verification; the build regenerates every record and the suite verifies each against its request |
| AL-09 | The record covers the isolated patch, not a later implementation | New. An implementation that differs from its proposal's patch would need its own record |
| AL-10 | No mechanism records a human disposition | By design. `blocked_pending_human_disposition` stays blocked in this system |
| AL-11 | Proposal requests and probes contain adversarial `human_disposition` and `expected_drift` inputs | By design (Y-11, Y-12 and probes); every one is refused, and no output record carries a disposition other than `not_recorded` |

## Defects found and corrected during the build (disclosed)
| Defect | Correction |
|---|---|
| ST-09 expectation authored as gap; v0.3 design gives review_required | Expectation corrected with recorded reason (RKB-043) |
| Drift ledger compared full graph hashes, so every fixture appeared changed | Structure compared without run identity |
| Drift ledger treated a refusal-withdrawn finding as a lost limitation (R-01) | Exemption only when not_assessed with a refusal; MA-38 guards the exemption |
| X-02 isolated patch, as first written, would not have disabled the pattern | Patch rewritten to disable the "relieved of duties" pattern in the copy only |
| Console text "authorise this proposal" matched the console guard | Text reworded; guard unchanged |
| Mobile tables wrapped identifiers letter by letter | Tables scroll inside their container |
| MA-02 survived (status probe also caught by the forbidden-word check) | Isolating probe `kb.unknown_status_rejected` added; no guard changed |
| `--record` target directory missing on first run | Directory created; no test logic changed |

### Corrections made during the 0.4.1-local repair run
See `CHANGELOG.md`: Y-09 expected state corrected (authoring error); proposal status-word check made negation-qualified (specification requirement); LB-07 graph expectation added; probe `pc.record_tampered_blocked` fixed; mutation MA-22 made loadable; MB-09 and MB-36 masked, isolating probes added. Earlier undisclosed post-run edit to R-02 now disclosed (RKB-060).

## Interpretation
The open failures are concrete and reproducible, and each has a proposal waiting for a decision.

## Limitation
The register reflects what this engineering process found on synthetic material. Unknown failure modes are not listed.

## External evidence still required
Owner decisions on R-01 to R-10; independent review of failure discovery on authorised records.
