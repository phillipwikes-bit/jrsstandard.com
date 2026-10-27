# Provider Compatibility Record (156-record study)

**2026-10-27. Offline record; authorizes nothing.** No provider was contacted while this record was written, and no credential was read. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Sources and their limits

| Source | What it is | Limit |
|---|---|---|
| Bundled Claude API reference (the `claude-api` skill shipped with Claude Code), cached 2026-10-06 | Model identifiers, request rules, error behaviour, prices | Read inside this session; not re-fetched, because the study runs with no network. Every row below is `UNVERIFIED on the day of use` until re-checked at authorization |
| `research/stage-a-revised-study-2026-10-25/STAGE_A_REVISED_STUDY_PROTOCOL.md` (commit `b41e2043`) | The same provider facts as recorded for the Stage A restart | A secondary record of the same reference, not an independent source |

## 2. Facts, sender behaviour and offline tests

Test results: `out/transport/RESULTS.json`, 49 of 49 passed, 0 network attempts, `LIVE_DISPATCH_ENABLED = false`.

| # | Provider fact (as cached) | Sender behaviour (`tools/transport/sender.mjs` 0.3.0-study-offline) | Tests |
|---|---|---|---|
| PC-01 | Model `claude-haiku-5-5`; no server-side fallback, and a `fallbacks` list returns a 400 | One model only; the response `model` field must equal it (adapter step S8) | T01, T02, T37, T48 |
| PC-02 | Since API version `2026-10-21`, `temperature`, `top_p` or `top_k` returns a 400 | These fields are refused before any fetch | T02 |
| PC-03 | Header `anthropic-version: 2026-10-21` | Exactly three headers: `content-type`, `x-api-key`, `anthropic-version` | T04 |
| PC-04 | Haiku 5.5 thinks adaptively by default; `thinking: {"type": "disabled"}` is allowed only at effort `high` or below; the default effort is `medium` | Thinking disabled at `medium`; disabled with `xhigh` or `max` is refused locally | T01, T03 |
| PC-05 | No assistant prefill | The last message is always the user turn | T01 |
| PC-06 | Text is read by content-block type; thinking blocks may appear | Exactly one text block; thinking blocks are kept and ignored; any other block type is rejected | T46, T47 |
| PC-07 | `stop_reason: "refusal"` with `stop_details`; no automatic retry or substitution | Final outcome `model_refusal`; no retry; no other model | T11, T48 |
| PC-08 | `stop_reason: "max_tokens"` means a cut-off answer | Final outcome `response_truncated`; not repaired, not resent | T12, T48 |
| PC-09 | 429, 500 and 529 are retryable; `retry-after` may be sent | At most two retries; `retry-after` honoured inside a bounded window, otherwise the request ends | T08, T09, T18 |
| PC-10 | 400, 401, 403, 404 and 413 are not retryable | Never retried | T10 |
| PC-11 | Usage fields: `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens` | Cost computed from reported usage; unknown billing counted at the worst case | T13, T14, T16, T19, T20, T23 |
| PC-12 | Prices per million tokens: $0.10 input, $0.50 output up to 100,000 prompt tokens; $0.50 and $2.50 above; cache read 0.1x; 5-minute cache write 1.25x | The rate card is a constant with its source; the long-prompt card applies to the whole request | T19, T20 |
| PC-13 | Haiku 5.5 uses about 30% more tokens than Haiku 4.5 for the same text | Token estimate is 1 token per 3 characters, which is above the expected count for English prose | Cost plan, section 4 |
| PC-14 | Maximum output 128,000 tokens | `max_tokens` is checked to lie between 1 and 128,000; the study plan uses 4,096 | `checkBody`; cost plan |
| PC-15 | The official SDK reads `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, profiles and federation variables by itself, and honours `ANTHROPIC_BASE_URL` | Decision DEC-T1 below; those variable names are refused as the study credential name | T40, T45 |

## 3. Decision DEC-T1: hand-built request instead of the SDK

- **Decision.** The sender builds the HTTP request itself, with an injected `fetch`, `redirect: "error"`, a fixed destination and a credential read by variable name only inside the live gate.
- **Reason.** The study allows exactly one credential, named in a signed authorization, and exactly one destination. The SDK's automatic credential and base-URL resolution could pick up a credential or a destination the authorization does not name.
- **Cost of the decision.** The sender must track request-shape changes itself. Retries, backoff and error classification are re-implemented and tested offline (T08 to T18) instead of inherited.
- **Review.** When a live run is authorized, before any request.

## 4. What must be re-verified on the day of use

| Item | Why |
|---|---|
| `claude-haiku-5-5` is available to the authorized account, and whether the identifier resolves to a fixed snapshot | A moving alias would make repeated runs of "the same model" a different system under test |
| The four prices in PC-12 | The cost plan and the budget cap depend on them |
| The API version header and the sampling-parameter rule | A changed version could change request validity |
| The `thinking` and `effort` rules | A changed rule could turn every request into a 400, or return thinking blocks the adapter must ignore |
| Data retention and use terms for the account | Retention conditions are part of the authorization (study rule) |

## 5. Not covered

- No live response has ever been parsed by this adapter. Every test uses a constructed response.
- Streaming, tools, batches, prompt caching and the token-counting endpoint are not used and not tested.
- Provider-side behaviour under load, model drift over time and regional routing are NOT ESTABLISHED.
