# G3A Owner Authorization Brief

**NON-OPERATIVE. Prepared 2026-10-24 for owner decision. Not a repository record.
Authorizes nothing and recommends no option.** Independent evaluation is not authorized
and has not occurred. B-018 remains OPEN. Release status remains NO_GO_NOT_VERIFIED.

Companion documents: `G3A_EVALUATION_SCOPE_OPTIONS.md`, `G3A_READINESS_GAP_REGISTER.md`,
`G3A_DECISION_RECORD_TEMPLATE.md`, `G3A_PACKAGE_MANIFEST_SHA256.txt`.

## 1. The decision only the owner may make

Whether the JRS Review Engine candidate should enter a bounded independent evaluation, and
if so, under which of three scope options (A, B or C). Every later step depends on that
decision and on further approvals named in the gap register. No session, evaluator or
counsel may make this decision on the owner's behalf.

## 2. Purpose of an independent evaluation

An independent evaluation would test the candidate with people who did not build it, on
material the builders did not write or see, under a protocol fixed before any result is
known. Its purpose is to produce evidence that someone other than the engineering process
can review. It would measure only what its frozen protocol defines, within its approved
scope. It would not decide release, deployment, licensing or commercial matters.

## 3. What the local engineering evidence does and does not establish

**Does establish (verified locally on 2026-10-24):**
- The candidate package is identifiable and intact: its manifest hashes to the recorded
  package value and all 147 listed files match (see section 4).
- The Phase 8 governance package (83 files) and the Phase 9 human-review package (99 files)
  match their manifests.
- The whole-worktree composition check reports declared conditions only (exit 0), with
  repository fingerprints unchanged by the run.
- In the Gate 4C drill, the local suites reproduced their recorded results from the
  archive (Phase 8: 523 of 523; Phase 9: 318 of 318; Phase 7 seal check exit 0).

**Does not establish:**
- Accuracy, semantic validity, operational reliability or real-world performance of any
  kind.
- Legal, regulatory or contractual sufficiency of anything.
- Release, deployment, production, licensing or commercial readiness.

Every local scenario, expectation and seal was written by the same engineering process
that built the candidate. Passing those checks shows internal consistency, not independent
evidence. The Phase 6 replay routes to `human_review_required` because of a known open
defect (P6-RT-07), and the handoff freeze lists fourteen active limitation items
(P7B-001 to P7B-014), including presence of text without semantic support.

## 4. Candidate version and local-only boundary

| Field | Value |
|---|---|
| Candidate | `phase7-candidate`, compiler version `0.3.1-candidate`, base `v0.3-evidence-graph (0.3.0-local)` |
| Package SHA-256 | `815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3` (147 files, verified 2026-10-24) |
| Phase 7 seal SHA-256 | `5f6210854a05d3c9bb1edc33b115f754bf5d56c14dd874bf75958d177ceadf20` |
| Rule packs | Six (CHR, CON, EVL, NEG, SCO, STR); all six hashes match the handoff freeze |
| Protocol | JRS-IEP-0.1-draft, seal `26efd3a0...`; execution disabled; not authorized; not conducted |
| Handoff freeze | `freeze_sha256` `e208afa6...`; execution disabled |
| Status | Candidate only. Untracked, uncommitted, local to this workspace, preserved in the Gate 4B archive |

The candidate is not released, deployed or committed. Any change to it before execution
would void a freeze.

## 5. Relationship between B-018 and a bounded evaluation

B-018 is OPEN. It concerns the reconciliation of local records with three source documents
held outside the repository. While it is open:
- no local result, and no evaluation result, may be used for release status or a public
  claim;
- item B018-OD-02 (which human-review protocol governs Engine review) is undecided, and an
  evaluation would need a designated protocol;
- item B018-OD-03 (source-era versus local-candidate versions) bears on which candidate
  may be described as what;
- item B018-CQ-05 (rights questions) has no counsel disposition.

Evaluation gate G1 requires the owner's written decision on whether any open B-018 item
must be resolved before evaluation, and which representations stay prohibited while
B-018 is open. That decision does not close B-018, and an evaluation would not resolve
it. No existing record settles whether B-018 must close first; that is part of the G1
decision.

## 6. Durable archive verification (Gate 1)

The Gate 4B archive (SHA-256 `3a1e2f26...b62e`, 502 files) was delivered and a local
recovery drill passed. The owner's durable copy has not been returned or hashed, so
Gate 1 is OPEN with INPUT NOT AVAILABLE. Gate 1 is required before release or external
use. Whether giving evaluators access to candidate output or material counts as external
use is a decision for the owner (gap register, item PRV-03).

## 7. Minimum conditions before any evaluation could begin

For Option B or C, at minimum:
1. A recorded owner decision selecting the option, its scope and an expiry or review date.
2. A recorded G1 statement on B-018.
3. A frozen candidate (G2), identified by the hashes in section 4, with an environment
   record and the owner's acceptance of its recorded limitations.
4. A designated human-review protocol, labeling form and adjudication rule (B018-OD-02,
   P9-OD-01, G7).
5. Named people in independent roles, including a coordinator and a data custodian, with
   recorded independence checks (G5).
6. Approved stop, incident and escalation rules.
7. Approved material classes (synthetic only for B), a decision on calibration material
   (P9-OD-04), and a custody plan outside the repository.
8. A decision on disclosure of JRS material to evaluators (P9-OD-05), and on whether
   evaluator access is external use for Gate 1, with Gate 1 verified if it is.
9. A separate start direction for execution under Gate 4.

Option C additionally needs counsel engagement; counsel approval of material classes;
retention and deletion rules; counsel review of the actual data flows and rights (G4,
B018-CQ-05); holdout custody (G6); an approved measurement plan with thresholds or an
explicit "none set" (G8); version-lineage wording (B018-OD-03); and a results-review and
claims-control plan (G10). The gap register holds the complete list with identifiers.

## 8. Consequences of each choice

| Choice | Consequence | What it does not do |
|---|---|---|
| Authorize (B or C) | Starts the gate sequence for the chosen scope; each later gate still needs its own approval and fails closed | Does not run anything by itself; does not release, deploy, license or make any claim |
| Defer | No evaluation activity; readiness materials stay available; the decision can be taken later | Does not change B-018, the candidate or any gate |
| Decline (Option A) | Current controls stay as they are; no new external evidence is produced | Does not close B-018 or alter NO_GO_NOT_VERIFIED |

Under every choice, release status stays NO_GO_NOT_VERIFIED.
