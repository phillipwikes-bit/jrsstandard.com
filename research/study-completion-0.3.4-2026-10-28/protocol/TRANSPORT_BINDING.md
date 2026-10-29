# Transport binding and decision DEC-T1

**2026-10-28. Study completion, 0.3.4 research candidate.** The frozen live sender (`tools/transport/sender.mjs`, byte-identical in the study package and the 0.3.4 package) is unchanged. This directory holds a bound copy, `tools/live/sender-bound.mjs`, with the changes below, and a verifier bound to this study's plan, `tools/live/authorization-bound.mjs`. The full diff of the sender is in `SENDER_BOUND.diff`. Live dispatch stays disabled in the bound copy (`LIVE_DISPATCH_ENABLED = false`).

## What is bound

| Item | Bound to |
|---|---|
| Candidate | `0.3.4-research-candidate`, frozen manifest `CANDIDATE_0.3.4_MANIFEST_SHA256.txt` (not adopted; 0.3.1 stays the engine of record) |
| Prompt | `candidate/prompt/PROMPT_research-0.3.4-1.txt` (`jrs-engine-local-0.3.4-research/prompt-1`), assembled by the frozen `prompt-assembly.mjs` |
| Request set | `records/LIVE_RECORD_SET.json`: every body rebuilt from the frozen prompt and texts and checked against its frozen hash before it can be sent |
| Plan | `protocol/LIVE_RUN_PLAN.json`; its hash covers every file the run would execute, so a code change voids an authorization signed against the earlier plan |
| Authorization | `tools/live/authorization-bound.mjs`: study name, model, API version, candidate, prompt, plan, record set, phases, request, attempt and spend caps, retention, credential variable name, stop-rule approval, signature and dates |

## Changes from the frozen sender

Each change answers a defect found by reading the frozen code against the verified provider facts (`PROVIDER_VERIFICATION.json`) or by a test written for this assignment. None changes the candidate, its prompt or its rules.

| Change | What | Why | Tests (mutant) |
|---|---|---|---|
| B1 | `SENDER_VERSION` is `0.3.4-study-completion-bound-1` | Captures name the sender that wrote them | TL-36 |
| B2 | The price record cites the official pricing page checked 2026-10-28; values unchanged | The frozen record said the prices were cached and not re-fetched | PV-03, PV-04 |
| B3 | 402 and 409 named as final; 504 final and counted at the worst case | The provider lists 402, 409 and 504; a 504 request may have been processed, so its cost is unknown | TL-15, TL-16 (MV-08, MV-16) |
| B4 | Token estimate: one token per UTF-8 byte (an assumed upper bound), not `length / 3` | The provider documents about 2.5 characters per token, so `length / 3` is below the typical count, not above it | TL-38 (MV-01) |
| B5 | A redirect (a 3xx status, or the fetch error that `redirect: "error"` raises) is final, never retried, never followed | The frozen code classified a refused redirect as a network error and retried it twice | TL-17 (MV-02, MV-03, MV-14) |
| B6 | A global cap on HTTP attempts, in addition to the request cap | The authorization can bound attempts, not only requests | TL-21 (MV-09) |
| B7 | Attempts made before a resume count toward a request's retry limit | After a crash during backoff the frozen loop restarted at attempt 0 | TL-25 (MV-04) |
| B8 | Recovery: a request whose last entry is `sent` becomes `interrupted_unknown`, counted at the worst case and never resent automatically; if its capture was written, the capture is verified against the prepared body hash and recorded | The frozen design refused an ambiguous resend but did not count its possible cost or use a capture written just before a crash | TL-22, TL-23, TL-24 (MV-05, MV-23) |
| B9 | A network error is counted at the worst case | A connection can fail after the request reached the provider; the frozen code counted it as free | TL-18 (MV-07) |
| B10 | The journal writes each entry through to disk before the call returns | The frozen journal returned its lines for the caller to save after the request; a crash in flight could lose the `sent` entry and allow an automatic resend | TL-22 (MV-06) |
| B11 | The gate's checks live in `createGate`; `createLiveSender`, the only export a real run uses, always passes `LIVE_DISPATCH_ENABLED` (false) | Lets the offline tests drive the exact gate sequence with a mock fetch while the build stays disabled | TL-30, TL-31 (MV-12, MV-13) |

## Runner and command

| Change | What | Why | Tests (mutant) |
|---|---|---|---|
| R1 | Each capture is compiled in a separate child process that installs the network guard and never receives the credential (`child-inspector.mjs`, `inspect-capture.mjs`) | The enabling rehearsal found that the frozen study's `compile-row.mjs` imports `research-probes.mjs`, which installs a network guard when imported. Loaded in the dispatch process, it would have blocked every real request | ER-01 |
| R2 | The command takes its fetch implementation before any other module loads | Defence in depth against any import replacing it | ER-01 |
| R3 | The plan hashes the sender with its dispatch flag line normalized | Enabling is one recorded line; any other change voids the signed plan | ER-01, ER-04 |
| R4 | The authorization's validity is checked before the first request (SR-02); a missing credential stops at the gate before the request (SR-01) | A run must not start on a plan it was not signed for | TL-41 (MV-24, MV-25) |
| R5 | The PRE gate is computed from the journal and captures of all PRE requests | A restarted run was failing the gate because it judged only requests sent by the current process | TL-42, ER-03 (MV-22, MV-26) |
| R6 | The command refuses to start while `ANTHROPIC_BASE_URL` is set, refuses an authorization file or run directory inside the repository, and checks every planned file, the plan, the request set, the targeted texts and the prompt against their hashes | Each is a way a run could differ from what was signed | ER-04 to ER-07 |

The bound verifier adds: the study name of this run; required `plan_sha256`, `phases_authorized`, `api_version`, `max_attempts` and `provider_retention_confirmed`; a request must belong to an authorized phase and to the frozen plan; RUN or TGT cannot be authorized without PRE; a placeholder signature, any identifier containing "DRAFT", the two earlier drafts and the spent Stage A authorization are refused (TL-28, TL-29; MV-17 to MV-19).

## Test evidence

Counts are generated in `reports/VERIFICATION_SUMMARY.md` from the outputs named here.

- `tools/live/test-live.mjs` (`out/LIVE_MACHINERY_TESTS.json`): offline tests of request construction and headers; response mapping; exact quotation verification through the frozen 0.3.4; strict output parsing; truncated and invalid responses; refusals; timeouts and cancellation; retry accounting; every final status; budget, request and attempt caps; destination allow-list and redirect refusal; interrupted-run recovery; duplicate prevention; missing, draft, spent, expired and mismatched authorizations; credential handling; the disabled gate and command; the whole PRE sequence with mock responses, the PRE gate and the scorer.
- `tools/live/mutate-live.mjs` (`out/LIVE_MUTATION_TESTS.json`): each mutant is one deliberate defect in the sender, verifier or runner, run from a mirror; each must be killed by at least one test. The first run found one surviving mutant (removing the "DRAFT" identifier refusal); a test was added. Mutants were added for each later fix.
- `tools/live/rehearse-enable.mjs` (`out/ENABLE_REHEARSAL.json`): the enabling step rehearsed in a mirror where only the flag line differs, with the real command, a preloaded network guard and a mock fetch; plus negative rehearsals. It found R1 and R5. ER-09 repeats the stray-output incident behind correction C-10 and checks that the repository's `results/` is unchanged.
- One test expectation was wrong and was corrected, not the code: the frozen strict-JSON parser accepts exactly one fenced block (```` ```json ```` … ```` ``` ````) and records the removal (`strict-json.mjs`, lines 7 and 8). The scorer now counts fenced responses (`fence_removed`). A fence with any other text is rejected (TL-07).

## Decision DEC-T1: recommendation

**Recommendation: keep the hand-built request for this study.** The question in the study record was whether to replace it with the official SDK when a live run is authorized. The evidence from the sender's actual behaviour:

1. **This session's environment sets `ANTHROPIC_BASE_URL`** (seen by name; every command here unsets it). The SDK honours that variable unless a base URL is passed explicitly, and it reads `ANTHROPIC_API_KEY` and other credential sources by itself. The study allows exactly one destination and one credential named in a signed authorization.
2. The hand-built sender sends only to `https://api.anthropic.com/v1/messages` and refuses every other scheme, host, port, path, query, fragment or user part before any request (TL-19), refuses redirects without following them (TL-17), and reads only the one variable the authorization names, only after the authorization verifies (TL-31; MV-12 shows a test fails if the order is reversed).
3. Its retry, billing and recovery behaviour is fixed and tested offline: unknown-cost attempts counted at the worst case (TL-11, TL-16, TL-18), crash-safe journal (TL-22 to TL-25), budget and caps (TL-20, TL-21). With the SDK, these would depend on the SDK's own retry loop (two retries by default) unless disabled, and on a custom fetch to keep `redirect: "error"` and the allow-list.
4. The request shape it builds was checked against the official documentation on 2026-10-28 (`PROVIDER_VERIFICATION.json`, PV-01 to PV-19).

**Cost of keeping it.** The request shape must be maintained by hand and re-verified when an authorization is signed. A provider change to the Messages API would not be absorbed automatically.

**Outside this study.** For product code the official SDK, configured explicitly (`apiKey`, `baseURL`, `maxRetries`), remains the default. That is a separate decision and is not made here.
