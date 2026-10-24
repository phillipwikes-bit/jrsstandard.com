# Stage A Owner Authorization (Draft)

**UNSIGNED DRAFT. Prepared 2026-10-24 outside the repository. Not effective. It
authorizes no provider access, no credential use, no live transport, no release of the
dispatch lock and no pilot execution.** Even when signed, it does not start the pilot: a
separate written Gate 4 start direction is required after every precondition in section
3 is verified. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

Authorization identifier: STAGE-A-AUTH-__________

## 1. Proposed terms (recommended defaults; each subject to owner signature)

| Field | Proposed value | Owner entry or modification |
|---|---|---|
| Pilot | Stage A live-model feasibility pilot | __________ |
| Purpose | Determine whether one exact model meets the declared response contract on ten bounded synthetic records, and identify observed failure modes | __________ |
| Provider | Anthropic API, subject to day-of-use availability confirmation | __________ |
| Model | `claude-haiku-5-5`, with no fallback or substitution | __________ |
| Request cap | 10 total provider requests | __________ |
| Spend cap | USD $5 total | __________ |
| Material | Ten approved synthetic development records only | __________ |
| Engine | Frozen candidate (`phase7-candidate`, package SHA-256 `815c5d56...25c3`) and the external adapter and replay boundary only | __________ |
| Cognitive controls | Required for every paired execution record and graph | __________ |
| Retention | Outside the repository, in the owner-designated custody location, for 30 days unless separately preserved | __________ |
| Claims prohibition | No reliability, validation, production, deployment, commercial, licensing, ownership or performance conclusion | __________ |
| Expiry | Fourteen calendar days after signature | __________ |
| Start condition | Separate written Gate 4 start direction after every prerequisite is verified | __________ |

Notes on the defaults (recorded, not decided):
- `claude-haiku-5-5` is a different system under test from the repository's historical
  pin `claude-haiku-4-5-20251001`. Results apply only to the identifier actually used.
  Whether `claude-haiku-5-5` resolves to a fixed snapshot is to be confirmed on the day of
  use; the identifier sent and the identifier reported must match (adapter pair check).
- The USD $5 cap has not been checked against current prices; no price was verified in
  this package. The owner confirms the cap against the provider's published prices before
  signing. The adapter enforces the request cap; spend must be computed from reported
  token usage.

## 2. Counsel review

Not required for this narrow synthetic-only pilot, per the owner determination of
2026-10-24 (`STAGE_A_COUNSEL_DETERMINATION.md`), subject to its basis and boundaries. This
is an owner decision, not a counsel disposition.

## 3. Preconditions (all INCOMPLETE until independently verified)

| # | Precondition | Status |
|---|---|---|
| 1 | Gate 1: exact SHA-256 match of an owner-held archive with `3a1e2f26...b62e` | INCOMPLETE |
| 2 | Exact provider and model availability confirmed on the day of use | INCOMPLETE |
| 3 | Remote provider access classified as external controlled use | INCOMPLETE |
| 4 | Owner statement permitting the synthetic-only pilot while B-018 remains OPEN | INCOMPLETE |
| 5 | Ten approved synthetic development records, each with a distinct `synthetic_record_id` | INCOMPLETE |
| 6 | Approved retention location, access list and deletion method | INCOMPLETE |
| 7 | Approved pilot protocol and stop rules (SR-LP-01 to SR-LP-15) | INCOMPLETE |
| 8 | Provider-specific transport mapping built, and all offline tests rerun successfully | INCOMPLETE |
| 9 | Dispatch lock released only under this signed authorization | INCOMPLETE |
| 10 | Separate Gate 4 start direction | INCOMPLETE |

## 4. Provenance requirements (unchanged by signature)

- The frozen graph keeps `execution_mode: local_mocked`.
- The execution record, not the graph, carries:
  - `response_origin: live_provider_captured`
  - `adapter_transport_mode: live_provider`
  - `engine_execution_mode: recorded_response_replay`
- A graph is usable only with its paired execution record, bound and verified on these
  nine fields in this order:
  1. `graph_sha256`
  2. `captured_response_sha256`
  3. `request_id`
  4. `model_identifier`
  5. `adapter_version`
  6. `adapter_sha256`
  7. `captured_at_utc`
  8. `replayed_at_utc`
  9. `synthetic_record_id`
- A missing, mismatched, altered or unpaired graph is unusable evidence and triggers an
  immediate stop.

## 5. Cognitive-control requirements

- Cognitive controls stay outside the frozen Engine and may not alter Engine output.
- A review note is accepted only after the validator's own pair check passes.
- Review outcomes may only be `review_blocked`, `escalated`, `uncertain` or `observed`.

## 6. Reporting

The pilot may report counts and observed failure modes only. A statement such as "N of 10
met the declared response contract in this bounded pilot" is permitted only with the
limitation that it establishes nothing about other records, prompts, models or
conditions.

## 7. Required statement (do not alter)

This authorization covers at most ten requests, one per approved synthetic development
record, to the one model named above, under the stop rules. It does not close B-018,
does not dispose of B018-CQ-05, does not change NO_GO_NOT_VERIFIED, does not open Gate 4,
and does not authorize any public, commercial, licensing, ownership, release, production,
deployment, validation or reliability statement.

## 8. Signature

| Field | Entry |
|---|---|
| Owner signature | __________________________ |
| Date signed | __________ |
| Expiry date (fourteen calendar days after signature) | __________ |
| Modifications to any term above (list each) | __________ |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
