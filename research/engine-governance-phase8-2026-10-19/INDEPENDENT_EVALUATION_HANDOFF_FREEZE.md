# Independent Evaluation Handoff Freeze

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Source of record: `evaluation/INDEPENDENT_EVALUATION_HANDOFF_FREEZE.json`, freeze hash `sha256:e208afa66dc004fb4c129ac1ada52815e18c34b410e82b7c92a86ac226bebaa7`. Execution enabled: no. Evaluation authorized: no. Evaluation conducted: no. It reads no sealed evaluation material or real record, labels nothing and scores nothing.

## Candidate identity

| Item | Value |
|---|---|
| Candidate | phase7-candidate (0.3.1-candidate) |
| Package hash | `sha256:815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3` |
| Files | 147 |
| Phase 7 seal | `sha256:5f6210854a05d3c9bb1edc33b115f754bf5d56c14dd874bf75958d177ceadf20` |
| Base | v0.3-evidence-graph (0.3.0-local) |
| Qualification record | `sha256:814baa3b3b2dee38e2d6a062e659d29025a2d3629290ad7167220ca0d9f5e5ca` |
| Protocol seal | `sha256:26efd3a042965808fbdaf13994b6283aff60fd5f0077dad408fe2e78782dc1b3` |

| Rule pack | SHA-256 |
|---|---|
| RPK-CHR.json | `sha256:98b63365754483a00f5136b37a80c863b68d2353f5008517096108583c34fc93` |
| RPK-CON.json | `sha256:633e9377097061f8ac988fe556081f1b32ea45c5694831458441bb77856d1f19` |
| RPK-EVL.json | `sha256:26581afaae4cb733f111b528d344bf63b4f967765bfd06a1e962b9df00257edb` |
| RPK-NEG.json | `sha256:1c0cff7a9dff5ac1c5290b50ef5c05582232297851a26132221022ac321c4214` |
| RPK-SCO.json | `sha256:923a608c0c8e588d7d7aeaa21c359419c47c14f035e837f5671fd999f08ff55f` |
| RPK-STR.json | `sha256:afc897306565c60b62439b8580bd1981aa285eba694625ade6800fc6fc76e3bf` |

## Frozen lineage

| Package | Status | Files | Package hash |
|---|---|---|---|
| v1-historical | frozen | 1 | `sha256:70c76d942960732bbadfa16cb7e9d622ca7380397050aceaba8d9bbe93d6661d` |
| v0.1-assurance | frozen | 183 | `sha256:bf47e7b846862232f95864e6f095bd4151b8f5707d0e052fbda4afcc6130e2f4` |
| v0.2-evidence-contract | frozen | 235 | `sha256:91464918068fd336b546ca0e929f3d9da19471e555ed463b057b6fdd7dabd251` |
| v0.3-evidence-graph | frozen | 218 | `sha256:ecf0c04766a4e521af7ec1ca93d194a94c6db2fd2e2c130884296863b8756b12` |
| phase4-change-control | frozen | 277 | `sha256:8b12a2384e81d727cc8eb57b12f02632a6a44d419e25e71d44ba6c2fb3a6f853` |
| phase6-reliability | local_only | 139 | `sha256:cdd51355e92e8a62dbdb3f2147115f17f559d92efc12a951f4c45e96c1a38576` |
| phase7-candidate | candidate_only | 147 | `sha256:815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3` |

Later local packages: phase6-reliability 1.0.0 (preserved_local_only); phase7-candidate 0.3.1 (preserved_local_only); phase8-governance 1.1.0 (present_local_only).

## Synthetic local testing is not independent evaluation

All results in this freeze are local engineering checks on synthetic material, run by the team that built the candidate. An independent evaluation would use authorized material, independent labelers blind to candidate output, an adjudicator, a frozen candidate and a sealed protocol. None has been authorized or conducted, and no result here stands in for one.

## Roles

| Role | Duties | May view sealed labels |
|---|---|---|
| owner | Authorizes each gate; does not label, adjudicate or operate. | no |
| data_custodian | Holds and releases authorized material; keeps sealed labels outside the repository. | yes |
| independent_labeler | Labels material blind to candidate output; independent of the developers and of each other. | yes |
| adjudicator | Resolves disputed labels under the written rule; does not label the same item. | yes |
| technical_operator | Runs the frozen candidate in the recorded environment; never sees labels before Gate E. | no |
| counsel_or_privacy_reviewer | Reviews material authorization, privacy and disclosure before Gate A and at Gate F. | no |

## Material separation and contamination controls

| Class | Use | In repository |
|---|---|---|
| synthetic_engineering_fixtures | Development and regression only. Never used to report evaluation results. | yes |
| calibration_material | Labeler training and rule calibration; results not reported as performance. | no |
| sealed_evaluation_material | Blind execution only, after protocol freeze. | no |
| real_records | Prohibited unless separately authorized in writing under Gate A with counsel review. | no |

- Developers have no access to sealed evaluation labels.
- Sealed evaluation material is never copied into the repository.
- No prompt, rule pack, model or code change after the protocol freeze (Gate B); any such change voids the freeze and requires a new freeze.
- Ambiguous or disputed labels go to the adjudicator under a written rule recorded before labeling; adjudication outcomes are recorded with reasons.
- The candidate package hash, environment and clock are recorded at freeze and at execution; any difference stops the evaluation.

## Provider or model change

| Item | Requirement |
|---|---|
| Class | model/provider change |
| Evidence | Identifier, version, review date and reason recorded; offline fixtures re-run; a new sealed evaluation is required before any statement about behaviour. |
| Regression | Everything above plus a new protocol freeze. |
| Invalidates a sealed evaluation | yes |
| Rollback | Restore the previous identifier; never silently fall back. |
| Counsel review | Always (data handling and provider terms). |

## Conditions that require re-evaluation

- any change to the candidate package hash
- any rule-pack, prompt or response-contract change
- any model or provider change
- any change to intake scope or excluded domains
- any change to the evaluation protocol or measures
- any change to the environment recorded at freeze
- evidence of contamination of sealed evaluation material
- any owner decision that widens a rule

## Gates

- A: material authorization
- B: protocol freeze
- C: independent labeling
- D: blind execution
- E: adjudication
- F: owner and counsel review

## Known limitations and open issues

Limitations: `research/engine-remediation-phase7-2026-10-19/KNOWN_LIMITATIONS.md` and `research/engine-governance-phase8-2026-10-19/KNOWN_LIMITATIONS_AND_OPEN_ISSUES.md`. Open issues (22, all active): P7B-001, P7B-002, P7B-003, P7B-004, P7B-005, P7B-006, P7B-007, P7B-008, P7B-009, P7B-010, P7B-011, P7B-012, P7B-013, P7B-014, P7-OD-01, P7-OD-02, P7-OD-03, P7-OD-04, P7-OD-05, P7-OD-06, P7-OD-07, P7-OD-08.

## Unresolved owner decisions

P8-OD-01, P8-OD-02, P8-OD-03, P8-OD-04, P8-OD-05, P8-OD-06, P8-OD-07, P8-OD-08, P8-OD-09, P7-OD-01, P7-OD-02, P7-OD-03, P7-OD-04, P7-OD-05, P7-OD-06, P7-OD-07, P7-OD-08.

## B-018

B-018 remains OPEN. This freeze does not address or reconcile it.
