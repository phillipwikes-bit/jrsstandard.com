# Stage A Revised Study Protocol: Ten-Record Synthetic Live Feasibility Pilot

**Revision 2, 2026-10-25. Planning document; authorizes nothing.** It replaces the spent authorization `STAGE-A-AUTH-20261025-01`, which stopped under SR-LP-14 and cannot be reused. Execution needs the new signed authorization (`STAGE_A_RESTART_AUTHORIZATION_DRAFT.md`) and must happen in a **new session**. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. What changed since the stopped pilot

| Change | Reason | Evidence |
|---|---|---|
| The provider key must be stored under a **dedicated name**, `JRS_STAGE_A_PROVIDER_KEY`, not `ANTHROPIC_API_KEY` | The frozen adapter 0.2.0 refuses to dispatch whenever a variable named `ANTHROPIC_API_KEY` or `ANTHROPIC_BASE_URL` exists. The Anthropic tools also read `ANTHROPIC_API_KEY` automatically, so that name could be picked up by software other than the pilot | `adapter.mjs` `FORBIDDEN_ENV_NAMES`; `live-boundary.mjs` takes the credential only by variable name |
| `temperature` is not sent | Since API version 2026-10-21, any `temperature`, `top_p` or `top_k` parameter returns a 400 | Claude API reference (bundled, cached 2026-10-06) |
| `anthropic-version: 2026-10-21` | The current API version | Same |
| `thinking: {"type": "disabled"}`, effort left at its default (`medium`) | Claude Haiku 5.5 thinks by default and would return thinking blocks. The mapping accepts exactly one text block and rejects any other block type. Disabling is permitted at effort `high` or below | Same; `anthropic-mapping.mjs` rejections `unsupported_content_block_type`, `multiple_text_blocks` |
| A **live sender** is built in the new session, as adapter build `0.2.1-live` | No sender exists, and the dispatch lock is a source constant (`LIVE_DISPATCH_ENABLED = false`) | `live-boundary.mjs` |
| Each live capture is also **replayed offline through 0.3.2-candidate** | Gives adoption evidence on real model output at no extra request or cost | Correction package (commit `f9ad63c3`); differential (commit `730450e0`) |
| The network guard allows exactly one host, `api.anthropic.com:443`, for the sender only | Every other outbound attempt is still trapped and counted | New requirement |

## 2. Frozen configuration (recorded by hash before any request)

| Element | Value |
|---|---|
| Engine of record | Frozen `0.3.1-candidate`, Phase 7 manifest `815c5d56...25c3` (147 files) |
| Replay engine (secondary, no requests) | `0.3.2-candidate`, manifest `2276bbc2...0f18` (43 files); not adopted |
| Prompt | `PROMPT_v0.3.0.txt`, `0ceda888...eec2` |
| Adapter | 0.2.0 (`aa2b9779...1fb6`) unchanged, plus a new live build `0.2.1-live` whose hash is recorded after its offline tests pass |
| Mapping | `anthropic-mapping.mjs` 0.1.0-offline (`1e289b06...59b8`) |
| Cognitive-controls validator | `6c5a9cf2...4bd4` |
| Provider and model | Anthropic API, `claude-haiku-5-5`, no fallback and no substitution. The response `model` field must equal it exactly, or the mapper rejects the response |
| Request | `POST https://api.anthropic.com/v1/messages`; headers `x-api-key` (from `JRS_STAGE_A_PROVIDER_KEY`), `anthropic-version: 2026-10-21`, `content-type: application/json`; body: `model`, `max_tokens: 4096`, `thinking: {"type": "disabled"}`, `system` (frozen prompt system part), `messages: [{"role": "user", "content": <frozen user part with the record>}]`. No sampling parameters, no tools, no streaming |
| Provider request identifier | The `request-id` response header, stored as `provider_request_id` |
| Material | SDR-01 to SDR-10 at their registered SHA-256 values (unchanged) |
| Runtime | Node v22 in a new cloud session; the pilot process runs without `ANTHROPIC_BASE_URL` |

## 3. Procedure (new session only)

1. Owner signs the restart authorization (single signature page).
2. Claude Code verifies every manifest: the repository at or after `730450e0`, Stage A, V0, the correction and the differential.
3. Claude Code builds `0.2.1-live`:
   - a copy of adapter 0.2.0 plus a sender;
   - the dispatch lock is set to `true` only in that copy;
   - the sender reads the key value by name only at dispatch, never logs it, and passes it only in the `x-api-key` header;
   - every output passes through the boundary's safe writer, which refuses any credential-shaped value.
4. Claude Code tests `0.2.1-live` offline against a **stub sender**: authorization checks, request cap, no retries, model check, one-host network allow-list, safe writer, refusal handling, mapping of a recorded-shape response. It also reruns all earlier offline suites and their mutations. Any failure stops the pilot.
5. Readiness checklist items 1 to 13 (`STAGE_A_REVISED_READINESS_CHECKLIST.md`). Any unchecked item blocks the run.
6. Owner gives the Gate 4 start direction in the new session.
7. Ten requests, SDR-01 to SDR-10 in order, one each, with no retries. Stop rules apply throughout.
8. After the run, offline: replay every capture through 0.3.1 (record) and 0.3.2 (secondary), apply the pair check and the cognitive controls, and record the per-request fields.
9. Owner transfers the materials to the approved retention location. Deletion follows the approved method after 30 days.

## 4. What is recorded per request

The eight Pilot Decision Rule fields: `request_id`, `synthetic_record_id`, `model_identifier`, `binding_digest`, `contract_outcome`, `failure_mode`, `routing_outcome`, `stop_condition`. Added:

- `stop_reason` and `usage` (input and output tokens) from the response;
- the computed cost;
- the 0.3.2 replay outcome for the same capture (status difference or none).

No credential, header value other than `request-id`, or prompt-external text is recorded.

## 5. Stop rules and decision rule

- SR-LP-01 to SR-LP-15 and `PILOT_DECISION_RULE.md` (including the gap-closure clause) apply unchanged.
- The decision thresholds are unchanged: proceed at 8 or more of 10, revise at 5 to 7, stop at 4 or fewer or on any immediate stop.
- **Clarified:** a `stop_reason: "refusal"` response is a contract failure with failure mode `model_refusal`. It is correctly routed when it is rejected before replay.
- **New immediate stops:**
  - the key variable is missing or misnamed;
  - `ANTHROPIC_BASE_URL` is present in the pilot process;
  - the sender contacts any host other than `api.anthropic.com`;
  - any request is sent before readiness item 13 passes.
- **Credential exposure in chat, files, logs, Git or output is an immediate stop (SR-LP-14), as before.**

## 6. Spend

Prices for Claude Haiku 5.5 are $0.10 per million input tokens and $0.50 per million output tokens (prompts up to 100K tokens; cached reference of 2026-10-06, confirmed by the owner before signing).

Upper bound, assuming at most 6,000 input and 4,096 output tokens per request: about $0.0026 per request and **about $0.03 for ten**. The USD $5 cap leaves a large margin and stays in force. A provider-console spend limit on the key is recommended as a second guard.

## 7. What the pilot can and cannot establish

It can show whether `claude-haiku-5-5` meets the quote-only response contract on these ten synthetic records under this exact configuration, and which failure modes occur. It cannot establish reliability, accuracy, model behaviour beyond these ten requests, independent validation, production readiness or release suitability. The 0.3.2 replay can add evidence about 0.3.2 on real model output; it does not adopt 0.3.2.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
