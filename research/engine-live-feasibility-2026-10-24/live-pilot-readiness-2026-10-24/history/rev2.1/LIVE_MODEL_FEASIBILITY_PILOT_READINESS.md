# Live-Model Feasibility Pilot: Readiness Package

**NON-OPERATIVE READINESS PACKAGE. Prepared 2026-10-24 outside the repository.
Authorizes nothing.** No provider call, credential use, live connection or evaluation
has occurred or is authorized. This is not a release, validation, commercial, licensing,
deployment or independent-evaluation authorization.

**Governing status.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect. Gate 1 (durable archive
verification) OPEN. Gate 3 OPEN. Gate 4 BLOCKED. No commit, staging, push, pull request
action, merge, deployment, public-route change or tracker update is authorized.

**Revision 2 (2026-10-24, on owner direction).** Two-part provenance labeling outside the
frozen graph; mandatory graph and execution-record pairing; narrowed pilot question;
counts and observed failure modes only. Revision 1 is preserved unchanged in
`history/rev1/`. Still non-operative; nothing is authorized.

## 1. Purpose

To define the minimum controlled path for observing, once and on ten synthetic
development records, how the Review Engine candidate behaves when its candidate response
comes from an actual model rather than a fixture. The pilot observes; it measures no
accuracy, agreement, performance, reliability, validation or readiness.

## 2. Classification

Under the owner's instruction in this assignment, any remote model-provider call is
treated as **external controlled use**, unless the owner records a different
classification with a reasoned basis in the authorization template. Synthetic material
reduces data risk; it does not remove provider, custody, authorization or
evidence-boundary requirements.

## 3. Preconditions before any provider request

All three must be recorded:
1. **Gate 1 cleared** by an exact match between the owner-held archive SHA-256 and
   `3a1e2f261feafa5280d28fd99475df19b37a33192da3c2e78d5d4b405289b62e`.
2. **Owner authorization template completed and signed** (`OWNER_AUTHORIZATION_TEMPLATE.md`).
3. **Applicable Gate 3 prerequisites recorded as satisfied** (section 6).

## 4. System under test (fixed by this package, verified 2026-10-24)

| Element | Identity |
|---|---|
| Candidate package | `phase7-candidate`, compiler `0.3.1-candidate`, package SHA-256 `815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3`, 147 files |
| Prompt | `jrs-engine-local-0.3.0/prompt-1`, SHA-256 `0ceda8887463a515d241751133c9b0d3bf3364f89b63fa6ac5dda6ac70c8eec2`; marked "SPECIFICATION ONLY. NOT RUN AGAINST ANY MODEL." |
| Contract version expected in responses | `jrs-engine-local-0.3.0-evidence-graph` |
| Adapter | Not yet built. Specified in `LIVE_MODEL_ADAPTER_CONTRACT.md`; its hash becomes part of the system identity |
| Model | Proposed in section 5; owner selects |

Lineage: L3 local candidate only. No result transfers to the historical `0.1.0-validation`
lineage or to the source-era Engine.

## 5. Proposed pinned model configuration (for owner selection)

| Field | Proposed value | Status |
|---|---|---|
| Provider | Anthropic | Already listed as a subprocessor in repository records (B-003) |
| Model identifier | `claude-haiku-4-5-20251001` | The repository's recorded pin (`api/_model.js`). **Its recorded review date, 2026-10-15, has passed. Current availability is NOT ESTABLISHED** and must be confirmed by the owner from the provider's own documentation before authorization. If unavailable, the owner records a different identifier; any other identifier is a different system under test |
| Version or snapshot | The dated identifier above is itself a snapshot identifier | To be confirmed with availability |
| Review date for this pilot | The pilot's authorization expiry date | Owner sets |
| Temperature | 0 | PROPOSAL; reduces, does not remove, variation |
| Maximum output tokens | 4,096 | PROPOSAL; the historical v1 setting; v1 records report truncation at lower caps |
| Maximum input | Record at most 8,000 characters (enforced by the scope gate) plus the prompt (2,902 bytes) | Fixed |
| Request limit | 10 requests in total, one per record, no retries on content failure, at most one retry on a transport error and counted against the limit | PROPOSAL |
| Rate limit | One request at a time, at least 10 seconds apart | PROPOSAL |
| Timeout | 60 seconds per request | PROPOSAL |
| Cost ceiling | Owner sets in currency, computed from the provider's current published prices recorded at authorization | No price verified in this package |
| Destination | The provider's documented messages endpoint, recorded by the owner in the authorization; no other destination | Not written in this package |
| Credential source | A provider credential read from the environment by the adapter at run time only; never written to any file, record or report; never accepted in conversation | Owner provisions |
| Default state | **Disabled.** The adapter refuses unless the signed authorization file is present, its SHA-256 matches the value recorded at sign-off, the current date is before expiry, and a run-time enable flag is set | Fixed |
| Base-URL or provider overrides | Refused; any provider-routing override in the environment stops the run | Fixed |

**Token and cost estimate (ESTIMATE, four characters per token).** Per request at most
about 2,800 input tokens and 4,096 output tokens; ten requests at most about 69,000
tokens. Cost equals tokens times verified price.

## 6. Applicable Gate 3 prerequisites for this bounded pilot

Mapped to the non-operative evaluation gates in `external-gate-3-2026-10-23/`. These are
the subset that applies to a ten-record, owner-run, synthetic development pilot. The
pilot is not an independent evaluation and does not use Gate 3 Option B or C.

| Gate | Requirement for this pilot | Status |
|---|---|---|
| G1 B-018 dependency | Owner statement that the pilot may run while B-018 is OPEN and that no pilot output may be represented outside the limits in section 8 | NOT RECORDED |
| G2 Version freeze | System-under-test tuple frozen: package, prompt, adapter, model, configuration | NOT RECORDED (adapter not built) |
| G3 Material class | Synthetic development records only (`content_origin: synthetic_engineering_fixture`) | NOT RECORDED |
| G4 Counsel review | Owner decision whether counsel review of the synthetic-only provider data flow is needed; the non-operative package assigns provider-environment approval to owner and counsel | NOT RECORDED |
| G9 Provider and environment | Provider, model, endpoint, credential source, environment record approved | NOT RECORDED |
| Stop rules | `LIVE_PILOT_STOP_RULES.md` approved | NOT RECORDED |
| Custody | Retention location outside the repository; who can access; deletion at expiry | NOT RECORDED |

Not applicable to this pilot: G5 (independent roles), G6 (holdout custody), G7 (labeling
protocol), G8 (measurement plan), G10 (results review for claims), because no
independent labeling, holdout, measure or claim is involved.

## 7. Dependency on an adapter that does not yet exist

The adapter is new code. Building it is not authorized by this package. Building it
requires a separate owner authorization (it is a narrow, single-purpose component, not a
general Engine feature). Until it is built, reviewed and hashed, preconditions G2 and G9
cannot be met. The frozen candidate package is not modified by the adapter design in
`LIVE_MODEL_ADAPTER_CONTRACT.md`.

## 8. What the pilot may and may not state

**Pilot question.** Whether the selected model met the declared response contract on
these ten bounded synthetic records, and what failure modes occurred. Reported as counts
and observed failure modes only.

**May record (internally):** whether the model followed the prompt; whether each response
met the adapter contract; whether the compiler accepted or refused it and why; whether
planted record defects led to a non-`supported` status for the affected condition;
whether the human-review route was present; request count, failure modes, latency,
tokens and cost.

**May not state:** any accuracy, agreement, performance, reliability, validation or
readiness figure; any claim about the source-era Engine or the v1 lineage; any release,
production, licensing or commercial statement; any public statement while B-018 is
OPEN.

## 9. Owner decisions required before any provider request

| ID | Decision |
|---|---|
| LP-OD-01 | Gate 1 cleared by exact SHA-256 match of the owner-held archive |
| LP-OD-02 | Provider and pinned model identifier, with availability confirmed |
| LP-OD-03 | Classification of remote provider access (default: external controlled use) |
| LP-OD-04 | B-018 G1 statement for this pilot |
| LP-OD-05 | Whether counsel review of the synthetic-only provider data flow is required |
| LP-OD-06 | Authorization to build the adapter only (separate from this package); all 21 offline defect tests must pass before any network-enabled run |
| LP-OD-07 | Acceptance of record-then-replay with two-part provenance outside the graph and mandatory graph and record pairing (adapter contract sections 2 and 8A), or an alternative |
| LP-OD-08 | Budget ceiling with verified prices; request limit of at most ten |
| LP-OD-09 | Retention location, access and retention period for outputs |
| LP-OD-10 | Approval of the stop rules and the pilot protocol |
| LP-OD-11 | Signed authorization with start permission and expiry date |

## 10. Package contents

| File | Purpose |
|---|---|
| `LIVE_MODEL_FEASIBILITY_PILOT_READINESS.md` | This document |
| `LIVE_MODEL_ADAPTER_CONTRACT.md` | Minimal adapter contract |
| `DEFECT_INJECTION_MATRIX.md` | Response-level and record-level defects |
| `TEN_RECORD_SYNTHETIC_PILOT_PROTOCOL.md` | Pilot procedure |
| `LIVE_PILOT_STOP_RULES.md` | Stop-rule register |
| `OWNER_AUTHORIZATION_TEMPLATE.md` | Owner authorization |
| `MANIFEST_SHA256.txt` | SHA-256 of the six documents |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
