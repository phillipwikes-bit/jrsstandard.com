# Phase 7 Handoff: Controlled Engine Remediation and Change Qualification

**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**

Release status: `NO_GO_NOT_VERIFIED`, unchanged. Date: 2026-10-19. All Phase 7 work is uncommitted in the local working tree.

## 1. Versions

| Item | Value |
|---|---|
| Candidate | `lib/engine-evidence-graph-v0.3.1-candidate/`, compiler `0.3.1-candidate` |
| Base | frozen v0.3 `lib/engine-evidence-graph/`, compiler `0.3.0-local`, unchanged |
| Repository head | `428c307` (PR #40, frozen); `main` at `97087e9` |

## 2. Defects

| Status | Defects |
|---|---|
| Addressed (Set A) | P6-RT-07 (RP-STR-01), P6K-003 (RP-CHR-01), P6K-004 (RP-CHR-02), P6K-005 (RP-CHR-03), P6K-006 (RP-CHR-04), P6K-002 (RP-NEG-01) |
| Addressed by abstention (Set B) | P6K-001 (RP-EVL-01), P6K-007 (RP-CON-01), P6K-008 (RP-SCO-01) |
| Deferred | AR-040 person-directed contract language (`DEFERRED_PENDING_OWNER_DECISION`), invalid calendar dates, AR-035 legal-conclusion note |
| Rejected | General self-validation catch; semantic support matcher |
| Open | Semantic support beyond section linkage; other inference labels; wider negation, duration, control and employment forms |

"Addressed" means the sealed synthetic cases route as intended. It is not a claim that the defect class is closed.

## 3. Differential counts

- **Existing inputs (194):** 171 `no_behavioral_difference`, 19 `intended_safe_degradation`, 3 `intended_refusal` (ST-14, P6-XD-03, P6-ST-17), 1 `intended_safe_routing` (P6-RT-07).
- **Phase 7 scenarios (50):** 18 `no_behavioral_difference`, 24 `intended_safe_degradation`, 4 `intended_refusal`, 4 `intended_safe_routing`.
- **Unsafe classes:** none assigned. The 23 changed existing inputs are exactly the 23 the pre-scan predicted before logic existed.

## 4. Preservation

- Frozen v0.3, v1, v0.1, v0.2, Phase 4 and all 139 Phase 6 files are byte-identical to the start of Phase 7.
- No tracked file is modified.
- Prior suites, run unchanged:
  - v0.1: 148/148
  - v0.2: 123/123
  - v0.3: 140/140
  - Phase 4: 268/269, the declared `tools/` conflict carried from Phase 6
  - Phase 6: 315/316, a new declared conflict: its "every new file is a Phase 6 file" check sees the Phase 7 files

## 5. Scenarios, mutations and stability

| Measure | Result | Required |
|---|---|---|
| Sealed scenarios | 50, all as expected (R07 6, chronology 16, negation 8, evidence link 8, conflict 6, scope 6) | at least 48 |
| Mutations | 79 introduced, 79 killed by a direct probe, 0 survived, 0 load failures | at least 60, all caught |
| Transforms | 32, all as expected; 17 from non-favourable bases (10 of them invariant) | at least 30, at least 12 non-favourable |
| Phase 6 library on candidate | 52 as expected, 10 known open failures not reproduced | informational |

## 6. Over-refusal

Every rule routes all of its target cases as sealed. None refuses or degrades any of its benign cases (one or two per rule). The samples are small synthetic cases, not a rate. Phase 4 ST-06 is the one existing degradation an owner may judge as over-review (P7-OD-02).

## 7. Determinism

Five full candidate runs gave one hash: `sha256:6be752fa7387460246d3880f0dff9f9850029397692fa34d2bd0ddddbe060bcd`. This is local repeatability on a fixed clock, not reproducibility across environments.

## 8. Limitations and owner decisions

- Limitations: `KNOWN_LIMITATIONS.md`.
- Decisions taken and still required (P7-OD-01 to 08): `OWNER_DECISION_REGISTER.md`.
- Post-seal harness corrections, the post-stop test repairs, the MX-14 relabel and the blocked first attempt: `EXECUTION_RECORD.md`.

## 9. Confirmation

No commit, push, merge, pull-request action, deployment, provider call, network request, B-018 action, tracker update or public change occurred in Phase 7.

## Records

| Record | Description |
|---|---|
| `REMEDIATION_CONTRACT.md` | Sealed contract |
| `RULE_PACK_SPECIFICATION.md`, `RULE_PACK_REGISTER.json` | Rule packs |
| `DIFFERENTIAL_QUALIFICATION_RECORD.md` | Differential qualification |
| `REGRESSION_SCENARIO_REGISTER.md` | Scenarios |
| `MUTATION_EVIDENCE.md` | Mutations |
| `STABILITY_AND_OVER_REFUSAL_RECORD.md` | Stability and over-refusal |
| `REMEDIATION_BACKLOG.md` | Backlog |
| `KNOWN_LIMITATIONS.md` | Limitations |
| `OWNER_DECISION_REGISTER.md` | Owner decisions |
| `EXECUTION_RECORD.md` | Execution |
| `workbench/` | Nine static pages, with screenshots |
| `tests/engine-remediation-phase7/run.mjs` | Suite; results in `execution-record/TEST_RESULTS.json` |
