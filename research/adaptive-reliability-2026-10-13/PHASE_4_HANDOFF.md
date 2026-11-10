# Phase 4 Handoff: Adaptive Reliability and Change-Control System (0.4.1-local)

Local ID: ARC-DOC-13 (NON-CANONICAL). Date: 2026-10-13. Working tree of `claude/engine-assurance-2026-10-10` at `5d5374b` (draft PR #40, unmerged). **Phase 4 work is uncommitted, unpushed and undeployed.** History: `CHANGELOG.md` (0.4.0-local first build; 0.4.1-local targeted control repairs after the read-only audit).

## Local engineering claim
A local, offline change-control system sits around the frozen v0.3 Engine. Automated controls identify specified local risks: for behavioural proposals they classify risk from what an isolated patch was observed to do on 85 synthetic fixtures, refuse proposals whose observed or stated effect removes a refusal or limitation, unrefuses an excluded domain, targets a protected path, claims an external result or advances a release gate, and block any observed favourable transition until a person records a disposition outside this system. Human review remains required for every proposal. Unrecognised or reworded bypass attempts may remain possible, and local controls do not establish external governance or release authority. The system does not modify the Engine.

## Local evidence

### Test commands (all with `env -u ANTHROPIC_BASE_URL`)
```
node research/adaptive-reliability-2026-10-13/build-artifacts.mjs
node research/adaptive-reliability-2026-10-13/performance/run-performance.mjs
node research/adaptive-reliability-2026-10-13/operator-console/build-console.mjs
NODE_PATH=$(npm root -g) node research/adaptive-reliability-2026-10-13/operator-console/screenshot.mjs
node tests/engine-adaptive-reliability/run.mjs [--record research/adaptive-reliability-2026-10-13/execution-record/MUTATION_EVIDENCE.json] [--only <group>]
```

### Counts
| Item | Count |
|---|---|
| Knowledge entries | 60 (RKB-051 to RKB-060 record the audit findings), chain intact |
| Requests compiled | 32: awaiting_human_review 7, blocked_missing_observed_change 4, blocked_pending_human_disposition 1, rejected_by_compiler 20; all in their expected state |
| Observed-change records | 13, each with complete run identity |
| New synthetic fixtures | 50 (unchanged set), 45 as expected, 5 open failures |
| Executable fixture expectation fields | 501; descriptive (labelled `descriptive_expectation_not_executed`) 1 |
| Stability transforms | 24 (8 lower-baseline), 23 as expected, 1 open failure (ST-14); no invariant transform shows a favourable transition |
| Direct probes | 143, all passing on the unmutated code |
| Mutations | 91 (50 updated MA, 41 new MB), 91 killed, 0 survived, 0 load failures |
| Phase 4 suite | 269 checks: 269 passed, 0 failed, 0 skipped; 0 network attempts |
| Operator console | 8 examples plus index; 16 screenshots; 0 non-file requests; 0 overflow |

### Repairs and their direct tests
| Repair | Tests | Mutations |
|---|---|---|
| 1 Path normalisation | `pc.path_*` (8), `pc.traversal_target_rejected_in_proposal`, Y-08 | MB-01 to MB-06, MA-16 |
| 2 Observed change instead of declared risk | `pc.behavioural_without_record_blocked`, `pc.record_*` (6), `pc.engine_target_makes_behavioural`, `pc.observed_*` (4), `ia.observed_*`, `ia.behavioural_without_observation_not_assessed`; Y-02, Y-03, Y-04, Y-07, Y-09 | MB-07 to MB-17, MB-40, MB-41 |
| 3 Favourable-drift detection | `dl.*_unsafe` (5), `dl.proposer_documentation_ignored`, `dl.disposition_never_recorded`, `pc.expected_drift_rejected`, `pc.human_disposition_rejected`; Y-11, Y-12 | MB-18, MB-19, MB-26 to MB-31, MA-33 |
| 4 Free text and release gate | `pc.claim_in_*` (4), `pc.loose_negation_rejected`, `pc.qualified_negation_allowed`, `pc.every_claim_term_caught`, `pc.release_*` (3); Y-05, Y-06, Y-10 | MB-20 to MB-25, MA-15, MA-23 |
| 5 Lower-baseline stability | `sm.lower_base_improvement_detected`, `sm.favourable_reported`; LB-01 to LB-08 | MB-32 |
| 6 Executable fixture expectations | `cr.limitation_kind_checked`, `cr.conflict_node_count_checked`, `cr.textual_support_count_checked`, `cr.limitation_kinds_classified`; suite section F | MB-33 to MB-35 |
| 7 Run identity | `id.*` (8), `pc.record_incomplete_identity_blocked`; identity checks on drift, mutation and performance records | MB-36 to MB-39 |
| 8 Documents and console | content guards; console neutral-label checks | n/a |

### New mutations (0.4.1-local)
| ID | Mutation | File | Result | Killed by |
|---|---|---|---|---|
| MB-01 | path: percent-encoded paths accepted | `proposal-compiler.mjs` | killed | pc.path_encoded_rejected |
| MB-02 | path: absolute paths accepted | `proposal-compiler.mjs` | killed | pc.path_absolute_rejected |
| MB-03 | path: escaping paths accepted | `proposal-compiler.mjs` | killed | pc.path_dotdot_root_rejected |
| MB-04 | path: dot segments not resolved | `proposal-compiler.mjs` | killed | pc.path_inner_traversal_protected, pc.path_windows_separators_protected, pc.path_valid_allowed (+1) |
| MB-05 | path: Windows separators not converted | `proposal-compiler.mjs` | killed | pc.path_windows_separators_protected |
| MB-06 | path: workspace boundary not enforced | `proposal-compiler.mjs` | killed | pc.path_outside_workspace |
| MB-07 | observed: missing record not blocking | `proposal-compiler.mjs` | killed | pc.behavioural_without_record_blocked, pc.engine_target_makes_behavioural, pc.flag_without_test_plan_rejected |
| MB-08 | observed: record hash not checked | `observed-change.mjs` | killed | pc.record_tampered_blocked |
| MB-09 | observed: request binding not checked | `observed-change.mjs` | killed | pc.record_bound_to_request_text |
| MB-10 | observed: run identity not validated | `observed-change.mjs` | killed | pc.record_incomplete_identity_blocked |
| MB-11 | observed: compile failures not blocking | `observed-change.mjs` | killed | pc.record_compile_failure_blocked |
| MB-12 | observed: human disposition in a record accepted | `observed-change.mjs` | killed | pc.record_disposition_set_blocked |
| MB-13 | compiler: engine targets do not make a proposal behavioural | `proposal-compiler.mjs` | killed | pc.engine_target_makes_behavioural |
| MB-14 | compiler: observed favourable transitions do not block | `proposal-compiler.mjs` | killed | pc.observed_favourable_blocks_pending |
| MB-15 | compiler: observed refusal removal ignored | `proposal-compiler.mjs` | killed | pc.observed_refusal_removed_rejects |
| MB-16 | compiler: observed limitation removal ignored | `proposal-compiler.mjs` | killed | pc.observed_limitation_removed_rejects |
| MB-17 | compiler: observed excluded-domain loss ignored | `proposal-compiler.mjs` | killed | pc.observed_excluded_unrefused_rejects |
| MB-18 | compiler: self-declared drift accepted | `proposal-compiler.mjs` | killed | pc.expected_drift_rejected |
| MB-19 | compiler: human disposition in a request accepted | `proposal-compiler.mjs` | killed | pc.human_disposition_rejected |
| MB-20 | claims: rollback text not scanned | `proposal-compiler.mjs` | killed | pc.claim_in_rollback_rejected |
| MB-21 | claims: compatibility text not scanned | `proposal-compiler.mjs` | killed | pc.claim_in_compat_rejected |
| MB-22 | claims: loose negation window | `vocab.mjs` | killed | pc.loose_negation_rejected |
| MB-23 | claims: `certified` dropped from the controlled terms | `vocab.mjs` | killed | pc.claim_in_notes_rejected, pc.every_claim_term_caught |
| MB-24 | release: release-gate targets not refused | `proposal-compiler.mjs` | killed | pc.release_target_rejected |
| MB-25 | release: advancement wording not refused | `proposal-compiler.mjs` | killed | pc.release_text_rejected |
| MB-26 | drift: gap to supported not unsafe | `drift-ledger.mjs` | killed | dl.gap_to_supported_unsafe |
| MB-27 | drift: review to gap not unsafe | `drift-ledger.mjs` | killed | dl.review_to_gap_unsafe |
| MB-28 | drift: not_assessed to supported not unsafe | `drift-ledger.mjs` | killed | dl.not_assessed_to_supported_unsafe |
| MB-29 | drift: not_assessed to gap not unsafe | `drift-ledger.mjs` | killed | dl.not_assessed_to_gap_unsafe |
| MB-30 | drift: rows carry a recorded disposition | `drift-ledger.mjs` | killed | dl.disposition_never_recorded |
| MB-31 | drift: favourable violation not raised | `drift-ledger.mjs` | killed | pc.observed_favourable_blocks_pending, dl.review_to_supported_unsafe, dl.review_to_gap_unsafe (+4) |
| MB-32 | stability: favourable transitions not reported | `stability.mjs` | killed | sm.favourable_reported |
| MB-33 | fixtures: limitation expectations not executed | `corpus-replay.mjs` | killed | cr.limitation_kind_checked |
| MB-34 | fixtures: conflict-node expectation not executed | `corpus-replay.mjs` | killed | cr.conflict_node_count_checked |
| MB-35 | fixtures: textual-support expectation not executed | `corpus-replay.mjs` | killed | cr.textual_support_count_checked |
| MB-36 | identity: synthetic marker not required | `identity.mjs` | killed | id.synthetic_marker_isolated |
| MB-37 | identity: run id not bound | `identity.mjs` | killed | id.run_id_bound |
| MB-38 | identity: fixture set not bound | `identity.mjs` | killed | id.fixture_set_bound |
| MB-39 | identity: missing fields allowed | `identity.mjs` | killed | id.missing_field_incomplete |
| MB-40 | impact: observed favourable change does not escalate | `impact-analyzer.mjs` | killed | ia.observed_favourable_escalates |
| MB-41 | impact: behavioural without observation is assessed anyway | `impact-analyzer.mjs` | killed | ia.behavioural_without_observation_not_assessed |

MA-01 to MA-50 were retargeted where the code changed (MA-09, MA-14, MA-15, MA-16, MA-22, MA-23, MA-25, MA-26, MA-33, MA-34); all 50 are killed. Full list: `execution-record/MUTATION_EVIDENCE.json`.

### Determinism and local budgets
One output hash over 5 passes of 109 cases; serialisation and ordering stable; B-01 to B-09 held; record carries run identity. Bounded local measurements only.

### Prior versions (unchanged)
v0.1 replay 31/31, suite 148/148. v0.2 replay 52/52, suite 123/123. v0.3 replay 35/35, suite 140/140. Historical v1 copy hashes to `baebb512`.

### Inherited failures (unchanged)
`scripts/check_zero_drift.py`: 36 failed of 164, 1 skipped; failure set identical to the pre-Phase 4 set (0 new). `tests/engine/activity-projection.mjs`: 6 of 17 fail. `tests/platform-evaluation/engine-to-manifest.mjs`: fails.

### Disclosures
- The post-run edit to request R-02 in 0.4.0 (an `expected_drift` entry and an explicit patch name added after the first build, not disclosed then) is disclosed in `CHANGELOG.md` and RKB-060.
- Corrections made during the repair run are listed in `CHANGELOG.md`: Y-09 expected state, negation-qualified status words in proposals, LB-07 graph expectation, one probe defect, MA-22 loadability, MB-09 and MB-36 masking, and stale console screenshots. No guard was weakened to pass.

### Remaining known bypass limits
AL-01 (non-behavioural proposals are judged on declared type and wording), AL-02 (lexical text checks; synonyms, other languages and confusable characters; scope-wording false positives), AL-03 (observation limited to 85 fixtures), AL-08 (records hash-bound, not signed), AL-09 (record covers the patch, not a later implementation), AL-10 (no disposition mechanism by design). Details: `ADAPTIVE_FAILURE_MODE_REGISTER.md`.

### Files
Created (untracked): `lib/engine-change-control/` (12 modules), `tests/engine-adaptive-reliability/` (2), `research/adaptive-reliability-2026-10-13/` (263 files, including 14 documents and this handoff). Changed: `research/MASTER_TRACKER.md` (appended lines only). No other tracked file changed.

### Confirmation
Network attempts: 0 in every harness and the screenshot browser. Provider calls: 0. External, public, customer or employee records: 0. Holdouts and labels: 0. Deployments, commits, pushes, merges, pull requests and public changes: 0. Isolated patches ran only in temporary copies outside the repository.

## Interpretation
Proposal risk is now derived from observed behaviour on the synthetic fixtures for every behavioural change, and the specific bypasses found in the audit are each refused or blocked by a direct, mutation-tested control.

## Limitation
All fixtures, expectations, mocks, patches and proposals are synthetic and engineering-authored by the same process, and this repair was checked by the same process that built it. The remaining limits above apply. Nothing here measures live model behaviour or finding correctness.

## External evidence still required
1. Owner decision on R-01, R-02, R-05 to R-08 and Y-09 (awaiting review), on R-03, R-04, R-09 and R-10 (need isolated patches), and a disposition on Y-03 if wanted.
2. Resolution of B-018.
3. Counsel review before any real record or provider is involved.
4. Independent labels, adjudication and a near-duplicate-screened sealed set before any accuracy statement.
5. Production QA and owner release authorization before any release decision.
6. An independent review of these repairs, since this check was performed by the process that wrote them.

This package is a controlled local adaptive-reliability system. It accumulates engineering knowledge through versioned, reviewable synthetic evidence and regression controls. It does not self-modify, establish independent accuracy, establish semantic validity, authorize release, or establish production, licensing, or sale readiness.
