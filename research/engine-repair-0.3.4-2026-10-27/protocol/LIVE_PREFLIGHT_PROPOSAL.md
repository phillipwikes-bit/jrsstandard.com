# Live Preflight Proposal for 0.3.4-research-candidate (not dispatched)

**2026-10-27. A plan for the owner to accept, amend or refuse.** It authorizes nothing. No request was sent, no credential was read, and no network access was attempted in preparing it. The spent Stage A authorization is not reused, and the unsigned 156-study live draft is not reused. The draft to be signed, if the owner chooses, is `authorization/LIVE_PREFLIGHT_AUTHORIZATION_DRAFT.json`; as written it is refused (section 9).

## 1. What a preflight is for

Provider compatibility only: does the model return the quote-only contract, do its quotations verify against the record, what the compiler does with them, how long a request takes, and what it costs. **It says nothing about Engine quality.** Three requests cannot measure accuracy, injection resistance or reviewer benefit.

## 2. Exact candidate

| Item | Value |
|---|---|
| Candidate | `0.3.4-research-candidate`, research profile `jrs-study-research-profile/1` enabled, research pack `RPK-SRP` 2.0.0 |
| Candidate manifest | `CANDIDATE_0.3.4_MANIFEST_SHA256.txt` (its hash is in the freeze record) |
| Prompt | `candidate/prompt/PROMPT_research-0.3.4-1.txt`, prompt version `jrs-engine-local-0.3.4-research/prompt-1` (hash in the manifest) |
| Contract | `jrs-engine-local-0.3.0-evidence-graph` (unchanged) |

## 3. Model and provider

| Item | Proposal | Verified against |
|---|---|---|
| Provider | Claude API, first party, `https://api.anthropic.com/v1/messages` | Bundled Claude API reference, cached 2026-10-06 |
| API version | `2026-10-21` | Same |
| Model | **Owner's choice.** `claude-haiku-5-5` is the study's recorded choice; `claude-opus-5-5` is the reference default for new work | Same |
| Price per million tokens | Haiku 5.5: $0.10 input, $0.50 output (prompts up to 100K tokens; $0.50 and $2.50 beyond). Opus 5.5: $4.00 input, $20.00 output | Same |
| Sampling parameters | Not sent: `temperature`, `top_p` and `top_k` return 400 on API version `2026-10-21` | Same |
| Thinking | Not sent (both models then run adaptive thinking; thinking tokens are billed as output) | Same |
| Effort | Sent explicitly: `output_config.effort = "medium"` (the default on both models, stated so the request is fixed) | Same |
| Prefill | None (returns 400 on these models) | Same |
| Refusal | `stop_reason: "refusal"` is recorded and stops the run. Haiku 5.5 has no server-side fallback; no fallback is requested for either model, because a fallback would change the model the authorization names | Same |
| Structured outputs | Not used: the preflight tests the prompt contract as written | Same |

**The reference was not re-fetched** (no network in this assignment). Every row must be checked against the live documentation at authorization, and the authorization must name the exact model.

## 4. Eligible data

Three disclosed synthetic study records, written by the developer, containing no personal data, from the exposed development partition:

| Request | Record | Why |
|---|---|---|
| P1 | S-001 (grounded, evidence linked in words) | A record the rules can support |
| P2 | S-003 (ungrounded, no evidence) | A record the rules should flag |
| P3 | S-004 with one instruction text inserted (`tests/injection-suite.mjs` IN-01, placed after its first sentence) | One observation of whether the model follows an instruction in the record. **n = 1: an anecdote, not a result** |

Not eligible: the 32 public cases, the 20 excluded-domain originals, any fresh evaluation record, anything with personal data.

## 5. Handling and retention

- Request bodies and responses are written once to a capture directory in the session scratch, with SHA-256 of each body. They are not committed to the public repository unless the owner decides.
- No credential is written to any file, log or capture. The credential is read only from an approved session secret under a variable the owner names in the authorization; it is never pasted into a conversation.
- Retention on the provider side follows the account's data-retention configuration. **NOT ESTABLISHED in this package**; the owner confirms it before signing.

## 6. Requests, retries and cost

| Item | Value |
|---|---|
| Requests | 3 |
| Retries | At most 2 per request, only for 429, 500 or 529, with backoff; none for any other status |
| Maximum attempts | 9 |
| `max_tokens` | 4,000 per attempt (thinking included), non-streaming |
| Input per attempt (estimate) | about 1,200 tokens (prompt about 900, record up to 300) |
| Worst case, Haiku 5.5 | 9 × (1,200 × $0.10 + 4,000 × $0.50) / 1,000,000 = **$0.019** |
| Worst case, Opus 5.5 | 9 × (1,200 × $4 + 4,000 × $20) / 1,000,000 = **$0.763** |
| Proposed hard cap | $0.05 (Haiku 5.5) or $1.00 (Opus 5.5). The sender refuses an attempt whose worst case would pass the cap |

## 7. Stop conditions (any one stops the run)

1. The named credential variable is absent: stop before any request.
2. A destination other than the one in the authorization: abort; the network guard counts the attempt.
3. Status 400, 401, 403, 404 or 413: stop.
4. `stop_reason: "refusal"`: record and stop; no retry, no other model.
5. `stop_reason: "max_tokens"`: record; no retry.
6. The first response that fails the quote-only contract: record it (it is a finding) and stop.
7. Spend reaching the cap.
8. Any guard violation or graph-validation failure when the capture is compiled offline.

## 8. Capture, recovery and compile

- One journal entry per attempt (request identifier, attempt number, body hash, status, provider request identifier, response hash). A restart resumes from the journal and never repeats a completed request.
- Each capture is verified by hash, then its candidate text is compiled offline by the frozen 0.3.4 with the research profile. The result is labelled "provider compatibility, 3 requests".
- Results add nothing to any evaluation claim, and change no blocker or release status.

## 9. What must happen before it could run (none of it done)

| Item | Status |
|---|---|
| Owner chooses the model and signs the authorization (model, candidate manifest, prompt hash, record set hash, request and attempt caps, spend cap, retention confirmation, credential variable name) | NOT DONE |
| The study's transport is rebound to 0.3.4 (prompt path, authorization fields). It ships disabled (`LIVE_DISPATCH_ENABLED = false`) and stays so in this package | NOT DONE |
| Decision DEC-T1 revisited: the study's sender builds the HTTP request by hand so that it reads exactly one credential source and refuses `ANTHROPIC_BASE_URL`; the Claude API reference recommends the official SDK. The owner, or a security review, decides | NOT DONE |
| Live documentation re-checked for section 3 | NOT DONE |
| Run in a separately authorized session | NOT DONE |

## 10. What this does not authorize

The full study (1,124 requests in the 156-study plan), any use of public cases or excluded-domain originals, any reviewer session, adoption of any candidate, or any change to B-018 or `NO_GO_NOT_VERIFIED`.
