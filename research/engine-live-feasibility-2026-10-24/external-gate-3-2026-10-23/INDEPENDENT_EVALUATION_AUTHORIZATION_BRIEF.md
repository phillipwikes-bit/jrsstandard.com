# Independent Evaluation Authorization Brief

**NON-OPERATIVE READINESS PACKAGE. Prepared 2026-10-23. Authorizes nothing.**

## 1. Status

- **Independent evaluation is not authorized and has not occurred.** The sealed protocol
  JRS-IEP-0.1-draft records `execution_enabled: false`, `authorization: not_authorized`
  and `conducted: false`
  (`research/engine-governance-phase8-2026-10-19/evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json`).
- **Local synthetic checks do not establish** accuracy, semantic validity, operational
  reliability, legal compliance or release readiness. Every local scenario, expectation
  and seal was produced by the engineering process that built the candidate.
- **B-018 remains OPEN** and limits what can be represented: no local result may be used
  as evidence for release status or public claims while it is open.
- **Release status remains NO_GO_NOT_VERIFIED.**
- **This package defines prerequisites for a possible future authorization only.** Every
  future evaluation action described in it is contingent on formal written authorization
  through the gates in `EVALUATION_GATES_AND_DECISION_MATRIX.md`.
- **No section authorizes** real-record intake, provider access, external disclosure,
  deployment or commercial use.

## 2. Candidate and existing evaluation records

- Candidate named by the existing protocol: the v0.3.1 local candidate (`phase7-candidate`),
  identified by its Phase 8 package hash. Any change before execution invalidates a freeze.
- Existing handoff freeze:
  `research/engine-governance-phase8-2026-10-19/evaluation/INDEPENDENT_EVALUATION_HANDOFF_FREEZE.json`
  (execution disabled; records B-018 as OPEN).
- Existing human-review material: the Phase 9 dossier contract, dual-review protocol and
  Cognitive Controls, all execution-disabled and synthetic-only.

## 3. Current blocking condition (local fact)

The Phase 0 baseline of 2026-10-23 found that the uncommitted B-018 governance change
(`.jrs/state/BLOCKERS.json` and the new reconciliation record) trips the preservation
checks of five earlier package suites, and the whole-worktree composition currently
reports `fail_closed`. Until the owner resolves that condition, the candidate version
freeze gate and the B-018 dependency gate cannot be met.

## 4. Decisions needed before any evaluation could begin

| # | Decision | Authority |
|---|---|---|
| 1 | Authorization of a bounded evaluation: purpose, scope, candidate, duration, and the material classes in scope | Owner |
| 2 | Review of the actual proposed data flows, rights, privacy, consent and retention | Counsel |
| 3 | Appointment of two independent labelers and an adjudicator who meet the separation rules | Owner, with the evaluation coordinator recording independence checks |
| 4 | Approval of material classes, custody and retention rules | Owner and counsel |
| 5 | Approval of a version freeze and evaluation boundary (package hash, rule packs, environment, measures, adjudication rule) | Owner |
| 6 | Approval of stop, incident and escalation rules | Owner |

None of these decisions is inferred, assumed or recorded by this package.

## 5. Package contents

- `EVALUATION_GATES_AND_DECISION_MATRIX.md`: ten fail-closed gates.
- `ROLE_SEPARATION_AND_CONTAMINATION_PLAN.md`: eight roles and material separation.
- `MEASUREMENT_AND_ADJUDICATION_SPECIFICATION.md`: measure definitions only.
- `EVALUATION_STOP_AND_RESTART_RULES.md`: ten stop conditions.
- `EXTERNAL_GATE_3_MANIFEST_SHA256.txt`.
