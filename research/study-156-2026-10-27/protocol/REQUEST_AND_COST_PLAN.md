# Request and Cost Plan (future live run)

**2026-10-27. Plan only. No request has been sent, and nothing here authorizes one.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect. Every number below is computed by `tools/build-request-plan.mjs` into `REQUEST_AND_COST_PLAN.json`, which lists each planned request with the SHA-256 of its exact body.

## 1. Request shape

| Item | Value |
|---|---|
| Destination | `POST https://api.anthropic.com/v1/messages` (only) |
| Model | `claude-haiku-5-5`; no fallback, no substitution |
| Headers | `content-type`, `x-api-key` (read by variable name inside the live gate only), `anthropic-version: 2026-10-21` |
| Body | `model`, `max_tokens: 4096`, `system` (frozen prompt system part), one user turn (frozen user part with the record), `thinking: {"type": "disabled"}`, `output_config: {"effort": "medium"}` |
| Not sent | `temperature`, `top_p`, `top_k` (each returns a 400), `fallbacks`, tools, streaming |
| Attempts | At most 3 per request (two retries, only on 429, 500, 529 or a network error) |
| Pacing | Concurrency 1; at least 1 second between requests; `retry-after` honoured inside a bounded window |
| Prompt | `candidate/prompt/PROMPT_research-1.txt` |

## 2. Requests

| Phase | What | Requests |
|---|---|---|
| PRE | Preflight on development records S-001, S-003, S-008; stop and report before continuing | 3 |
| RUN | Three fresh runs of every eligible record (100 synthetic, 4 originals) | 312 |
| VAR | One run of every constructible variant (809 of 832; 23 not constructible, reasons in `variants/VARIANT_INDEX.json`) | 809 |
| **Base total** | | **1,124** |
| Optional SC1 | Three runs of each of the 20 originals outside the research scope, only if the owner decides SC-1 to allow it | 60 |
| Optional A6 | The default prompt on the 104 eligible records, one run each, for the default-profile comparison | 104 |

## 3. Cost

| | Requests | Estimated input tokens | Typical cost | Worst case |
|---|---|---|---|---|
| Base | 1,124 | 1,244,335 | $0.57 | $7.28 |
| Optional SC1 | 60 | 66,816 | $0.03 | $0.39 |
| Optional A6 | 104 | about 103,000 (the default prompt is 2,902 characters) | about $0.05 | about $0.67 |

- **Typical** assumes 800 output tokens per request, the standard card ($0.10 input, $0.50 output per million tokens), and no retries.
- **Worst case** assumes `max_tokens` (4,096) output on all three attempts of every request.
- **Input tokens** are estimated as characters divided by 3, which is above the expected count for English prose with the newer tokenizer.
- No request is near the 100,000-token long-prompt threshold (estimated input per request: 1,000 to 1,232 tokens).
- **Proposed caps for the authorization:** 1,124 requests and USD $8.00 for the base plan. Add the optional lines only if they are authorized separately.
- **Time:** at about 5 seconds per request with concurrency 1, roughly 1.5 to 2 hours for the base plan. This is NOT ESTABLISHED until the preflight measures latency.

## 4. Proposed stop rules

1. Any 401 or 403: stop (credential or permission).
2. A model identifier mismatch in any response: stop.
3. Three consecutive non-retryable errors: stop.
4. Refusals above 5% after the first 50 requests: stop and report.
5. Any capture refused by the safety checks (credential-shaped text): stop.
6. The next request would exceed the request cap or the reserved budget: stop.
7. The authorization has expired: stop.
8. Any network attempt to a destination other than the allowed one: stop.

## 5. Retention (owner decisions)

- **Location of raw captures:** outside the public repository. The records are synthetic or public vignettes, but the captures are still treated as confidential: deployment exclusion does not prevent git disclosure.
- **What enters the repository:** hashes and the journal only.
- **Deletion:** proposed, raw captures deleted 90 days after the study report unless extended in writing; hashes kept.

## 6. What the plan does not settle

- Whether `claude-haiku-5-5` is available, and whether it is a fixed snapshot, on the day of use.
- Current prices (the rate card is from the reference cached 2026-10-06).
- Whether three fresh runs are enough to characterise run-to-run variation. Three runs give a first look, not a reproducibility claim.
- How a real model types its observations. The offline study shows that mis-typed gap observations end as INDETERMINATE, not FLAG (see the final report).
