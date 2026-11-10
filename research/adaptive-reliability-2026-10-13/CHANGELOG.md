# Phase 4 Change Log

Local ID: ARC-DOC-15 (NON-CANONICAL). Entries are appended; earlier entries are not rewritten.

## 0.4.0-local (2026-10-13): first build
Adaptive Reliability and Change-Control System built locally on the frozen v0.3 Engine. Uncommitted.

### Post-run edit to a request input, not disclosed at the time (disclosed here, 2026-10-13)
After the first 0.4.0 build had run, request R-02 in `proposals/requests.mjs` was edited: an `expected_drift` entry (AR-010 chronology supported to review_required) was added, and the isolated patch was named explicitly. The build had previously reached the same patch through a fallback in `build-artifacts.mjs`. The edit did not change any outcome: the AR-010 row had already been classified as an expected lowering. It was not disclosed in the 0.4.0 documents or handoff. The read-only audit found it (RKB-060). In 0.4.1 the `expected_drift` field no longer exists and the patch is inline in the request.

## 0.4.1-local (2026-10-13): targeted control repairs after the read-only audit
Uncommitted. Engine (v0.1 to v0.3) unchanged.

### Repairs
| Audit finding | Repair | Where |
|---|---|---|
| RT-8: `lib/../api/review.js` passed the protected-path check | Targets are normalised (separators, dot segments, repeated separators, Windows separators) before comparison; absolute, percent-encoded and escaping paths are refused; targets must sit inside the change-control workspace | `proposal-compiler.mjs` `normalizeTarget`; `vocab.mjs` `PERMITTED_TARGET_ROOTS` |
| RT-1, RT-2, RT-3, RT-7, RT-9: compiler trusted declared descriptors | Behavioural proposals (by type, flag or a target inside the Engine) need a verified observed-change record from their inline isolated patch; risk is classified from that record; declared descriptors can only add refusals; new states `blocked_missing_observed_change` and `blocked_pending_human_disposition` | `observed-change.mjs`, `proposal-compiler.mjs`, `impact-analyzer.mjs` |
| RT-10: drift ledger accepted proposer-listed favourable drift; gap to supported unflagged | `expected_drift` removed. Rows carry `observed_change` and `human_disposition` (always `not_recorded`). Review_required to supported or gap, gap to supported, not_assessed to supported or gap are unsafe until a person records a disposition | `drift-ledger.mjs` |
| RT-4, RT-5: claims in rollback text and behind loose negation | Every free-text field is scanned; controlled terms pass only with an immediately preceding negation | `vocab.mjs` `findUnqualifiedClaim`, `findUnqualifiedStatusWord` |
| RT-6: release-gate advancement compiled to review | Refused with `release_gate_advancement_not_authorized` (targets, component, or wording) | `vocab.mjs` `RELEASE_TARGETS`, `RELEASE_ADVANCEMENT` |
| Stability bases already at maximum favourability | Eight lower-baseline invariant transforms LB-01 to LB-08; favourable transitions reported per transform | `stability-laboratory/transforms.mjs`, `stability.mjs` |
| Weak fixture expectations | Refusal codes, quote statuses, control defects, limitation kinds and graph properties are executable for all 50 AR fixtures; one expectation is labelled `descriptive_expectation_not_executed` | `generate_corpus.py`, `corpus-replay.mjs` |
| No package or patch hashes in records | Observed-change, drift (isolated runs and the cross-version comparison), corpus, mutation and performance records carry complete run identity; incomplete records cannot feed a proposal | `identity.mjs` |
| Overstated documents; green "present" state in the console | Documents corrected; `present_local_artifact` shown as "local file present (not a gate result)" in a neutral treatment | documents, `operator-console/build-console.mjs` |

### Corrections made during the repair run (disclosed)
| Item | Before | After | Reason |
|---|---|---|---|
| Y-09 expected state | blocked_missing_observed_change | awaiting_human_review | Authoring error. The patch was expected to break validation; it compiles, and v0.3 still routes sufficiency to review because its rule requirement is never met, so no favourable transition is observed. 315 rows of non-material drift remain visible to the reviewer |
| Proposal free-text status words | Strict list, no negation | Negation-qualified, so "not production-ready" is allowed in proposals | The repair specification requires that limitation wording be allowed; the knowledge-base check stays strict |
| LB-07 transform | No graph or limitation expectation | Graph expectation added | Completeness check in the suite caught the gap in a new spec |
| Probe `pc.record_tampered_blocked` | Set values the record already had | Changes a value | Test defect: the four-fixture probe set gave R-02 zero rows already |
| Mutation MA-22 | Deleted a line, orphaning an `else` (load failure) | Replaces the condition with `false` | A load failure is not a kill |
| Console screenshots | `screenshot.mjs` kept its own page list, so after the example set changed it captured the old pages; four stale rendered pages remained; the suite only counted files | The page list now comes from the console builder; stale generated pages and screenshots removed and recaptured; a new check requires screenshots and pages to match the current examples exactly (shown failing on the stale state before the fix) | Found when attaching a screenshot for the handoff |
| Mutations MB-09 and MB-36 survived | Masked by the patch-hash and run-id checks | Isolating probes `pc.record_bound_to_request_text` and `id.synthetic_marker_isolated` added | No guard changed |

New corpus executable expectations (refusal codes, control defects, quote statuses, limitations, graph properties) were authored from the v0.3 rules before the run; every one held on the first run for the 45 passing fixtures. No corpus expectation was corrected.
