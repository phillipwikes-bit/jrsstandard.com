# Change Proposal Compiler Specification (0.4.1-local)

Local ID: ARC-DOC-03 (NON-CANONICAL). Code: `lib/engine-change-control/proposal-compiler.mjs`, `observed-change.mjs`, `vocab.mjs`. Requests: `proposals/requests.mjs`.

## Local engineering claim
The compiler identifies specified local risks in a requested change and refuses or blocks it; otherwise the proposal waits for human review. It cannot produce an approved, authorised or applied change. It does not rely on requester-declared risk for behavioural changes. Unrecognised or reworded bypass attempts may remain possible.

## Local evidence
32 requests: R-01 to R-10 (well-formed), X-01 to X-10 (unacceptable), Y-01 to Y-12 (reproductions of the audit bypasses RT-1 to RT-10 and of attempts to self-declare drift or a disposition). All 32 reach their expected state (suite section C). Probes `pc.*` (55); mutations MA-08 to MA-23 and MB-01 to MB-25.

| State | Count | Requests |
|---|---|---|
| awaiting_human_review | 7 | R-01, R-02, R-05 to R-08, Y-09 |
| blocked_missing_observed_change | 4 | R-03, R-04, R-09, R-10 (no isolated patch supplied) |
| blocked_pending_human_disposition | 1 | Y-03 (observed AR-047 chronology review_required to supported) |
| rejected_by_compiler | 20 | X-01 to X-10, Y-01, Y-02, Y-04 to Y-08, Y-10 to Y-12 |

## Behavioural proposals and observed change
A proposal is behavioural if its type is behavioural, a behaviour flag is set, or any normalised target sits under `lib/engine-evidence-graph/` or the prompt contract. Behavioural proposals need an observed-change record that: was produced from the request's inline patch in an isolated copy; is bound to the exact request (hash) and patch (hash); was produced by the current change-control and baseline packages (hashes); has complete run identity and `synthetic_local_only: true`; has no compile failures; and carries `human_disposition: not_recorded`. Otherwise the proposal is `blocked_missing_observed_change`.

From a verified record: refusal removed, limitation removed or weakened, proof edge, excluded-domain fixture unrefused, conflict no longer routed to review, or a fixture relabelled independent, each rejects the proposal; any favourable transition blocks it as `blocked_pending_human_disposition`.

## Other refusals
| Code | Trigger |
|---|---|
| production_or_public_target, target_path_invalid, target_outside_change_control_workspace | Targets are normalised first (separators, `.` and `..`, repeated separators, Windows separators); absolute, percent-encoded and escaping paths are invalid; normalised paths are matched against the protected list and the permitted workspace |
| external_result_claimed_from_local_material | A controlled term (`validated`, `independent`, `verified`, `certified`, `authorized`, `production-ready`, `release-ready`, `license-ready`, `sale-ready`, `compliant`, `guaranteed`, and related forms) in any free-text field without an immediately preceding negation. "not validated", "not independently verified", "not authorized for release" and "not production-ready" are allowed |
| release_gate_advancement_not_authorized | A target under the evaluation factory, registry or gate simulator; the evaluation_factory component; or wording that moves a gate, registry status or release status |
| self_declared_drift_not_accepted, human_disposition_not_settable | A request that supplies drift expectations or a disposition |
| scope_expansion_into_regulated_domain, refusal_boundary_removed, evidence_requirement_lowered, limitation_removed_or_weakened | Declared descriptors and scope wording (declarations can only add refusals) |
| behavioural_change_without_test_plan, rollback_missing, compatibility_analysis_missing, synthetic_fixture_treated_as_independent, self_authorization_attempt, forbidden_status_wording, unknown_* | Structural and wording checks |

## Interpretation
A mislabelled behavioural change is now classified by what its patch did on the fixtures.

## Limitation
- Observation covers the 85 synthetic fixtures only; behaviour outside them is invisible.
- The record is hash-bound but not signed: a fabricated record with internally consistent hashes would pass verification. The build regenerates every record, and the suite verifies each against its request.
- A behavioural proposal is judged on its isolated patch, not on any later implementation.
- Text checks are lexical: synonyms, other languages and confusable characters are not caught. The scope-wording check over-rejects when refusal wording follows the matched phrase (X-06, Y-05, Y-08, Y-10, Y-11, Y-12).
- Human review remains required; local controls do not establish external governance or release authority.

## External evidence still required
Owner decision on each awaiting or blocked proposal; a disposition on Y-03 if the owner wants it advanced.
