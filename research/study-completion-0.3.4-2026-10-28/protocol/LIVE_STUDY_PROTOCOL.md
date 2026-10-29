# Live study protocol: 0.3.4 research candidate on the study records

**Status: PROPOSED, NOT AUTHORIZED. Prepared 2026-10-28.** Live dispatch is disabled in this build. No request has been sent, no credential has been read, and no provider host has been contacted. This protocol finishes the existing records study; it is not a new study, a new engine version or a validation project.

Exact identities, hashes, counts and costs are in the generated `protocol/LIVE_RUN_PLAN.md` (from `LIVE_RUN_PLAN.json`). This document gives the design and the reasons.

## 1. What the run answers, and what it cannot

- **Answers:** with a real model producing the quote-only proposals, how does the frozen 0.3.4 research candidate review the study records: what it flags, what it misses, what it falsely flags, what it leaves unresolved, whether its quotations verify, how stable it is across repeats, and whether the two known weaknesses appear with a real model.
- **Cannot answer:** accuracy or validity. Every record is exposed development material (the rule author wrote or read all of them) and every reference is AI-proposed. No record is a holdout. Agreement with the references is reported as agreement, never as accuracy. Human labels, if Phillip completes the review batches, are reported separately.
- **Does not change:** 0.3.1 remains the engine of record. Testing 0.3.4 does not adopt it. B-018 stays OPEN; release status stays `NO_GO_NOT_VERIFIED`.

## 2. Population

| Group | Records | In the live run |
|---|---|---|
| Text held, inside the research scope | 104 (100 synthetic, 4 originals) | Yes: the live population |
| Originals outside the research scope (excluded or ambiguous domains) | 20 | No. They stay excluded and are refused in every offline run |
| Public cases (text not held) | 32 | No. Not retrieved without specific authorization and a rights and privacy disposition |

The 156-record accounting is generated in `accounting/ACCOUNTING_156.md`. The targeted phase uses texts constructed from eligible records (section 3); it adds no new record.

## 3. Requests, repeats and why

| Phase | Requests | Purpose and justification |
|---|---|---|
| PRE | 3 (S-001, S-003, S-008) | Provider compatibility only, before anything else: does the model return the quote-only contract, do its quotations verify, latency and cost. These are the study plan's preflight records. |
| RUN | 312 (each of the 104 records, three times) | The study itself. Three repeats are the minimum that shows whether a record's outcome is stable from one model response to the next; one run would hide variation, and more than three adds cost without changing the decision. Repeat-major order, so an interrupted run still holds complete repeats. |
| TGT | 86 (one each) | The two known weaknesses, with a real model. T1: one stated but irrelevant basis inserted into each of the 42 UNGROUNDED records, exactly as the paired suite's adversarial pool. T2: the 22 instruction phrasings of the injection suite in its first flawed and first clean base record, at the suite's own positions. The texts were rebuilt with the suites' own code and checked against the frozen suite outputs (construction strings for T1; instruction detection for T2). |

**Not run (deliberately):** the original plan's 809 variant requests, the default-prompt comparison (A6) and the excluded originals (SC1). The variant families other than the two weaknesses were measured offline and do not depend on model behaviour in a way that would change the decision; running every development variant was excluded by the assignment.

## 4. Model and request

| Item | Value | Basis |
|---|---|---|
| Model | `claude-haiku-5-5` (recommended) | The study's recorded choice; current, a pinned snapshot, retirement not sooner than 7 October 2027 (PV-01, PV-02). Lowest cost. The frozen request is valid for it. |
| Alternative | `claude-opus-5-5` | Not recommended for this run: thinking cannot be disabled on it (PV-09), so the frozen request would be refused; using it needs a documented amendment and costs about 40 times as much (PV-05). |
| API version | `2026-10-21` | Latest; sampling parameters removed (PV-06) |
| `max_tokens` | 4,096 | The study plan's value; the largest scripted proposal is about 790 tokens, so about five times headroom |
| Thinking | `{"type": "disabled"}` | The study plan's value; accepted on Haiku 5.5 at effort high or below (PV-08). Judgment call J2 in the checkpoint |
| Effort | `medium` (stated explicitly) | Haiku 5.5's default (PV-07) |
| Not sent | temperature, top_p, top_k, fallbacks, tools, stop sequences, metadata, assistant prefill | Removed or not supported (PV-06, PV-15); no server-side fallback, so no other model can answer (PV-14) |
| Streaming | No | Small `max_tokens`; the provider's long-request guidance does not apply (PV-17) |

## 5. Transport

- **Sender:** the bound copy `tools/live/sender-bound.mjs` (changes B1 to B11 in `TRANSPORT_BINDING.md`), behind the gate in `createLiveSender`. Destination `https://api.anthropic.com/v1/messages` only; every other scheme, host, port, path, query, fragment or user part is refused before sending. `redirect: "error"`; a redirect is final and never followed.
- **Credential:** read only inside the gate, only after the authorization verifies, only from the one environment variable the authorization names (proposed `JRS_STUDY_ANTHROPIC_KEY`; the SDK-reserved names are refused). It is registered as a sentinel: a capture or journal entry containing it is refused (SR-15). It is never printed, logged or written.
- **Retries:** at most two per request, only on 429, 500, 529, a network error or a timeout, with exponential backoff from 1 second; `retry-after` honoured up to 20 seconds, beyond that the request ends (SR-07). Never retried: redirects, 400, 401, 402, 403, 404, 409, 413, 504 and any other status, refusals, truncations, cancellations.
- **Limits:** request cap, a separate attempt cap across the run, and a spend cap, all from the authorization. Before every attempt the sender refuses if the spend so far plus this attempt's worst case would pass the cap.
- **Timeout and cancellation:** 120 seconds per attempt; an operator cancellation stops the run. A cancelled, timed-out or network-failed attempt, or a 504, may have been processed, so each is counted at its worst case.
- **Pacing:** one request at a time, at least 1 second apart.
- **Offline compile during the run:** each capture is compiled in a separate child process that installs the network guard and never receives the credential (`tools/live/child-inspector.mjs`). The dispatch process does not load the scoring chain, because a frozen study file installs a network guard when it is imported (found by the enabling rehearsal; see section 13).

## 6. Cost

Typical cost and the worst-case bound per phase are in `LIVE_RUN_PLAN.md`. The worst case assumes one token per byte of input (an assumed upper bound; the provider documents about 2.5 characters per token) and the full output cap on every attempt; reported input above the estimate stops the run (SR-13). Prices were checked on the official pricing page on 2026-10-28 (PV-03, PV-04); every request is far below the 100,000-token threshold of the higher Haiku 5.5 rate.

**Proposed spend caps** (owner decides): $0.05 for PRE alone; $1.00 for PRE, RUN and TGT together. The $1.00 cap is several times the typical estimate, so it should not end a normal run, and it stops an abnormal one well before the worst-case bound.

## 7. Capture, retention and recovery

- **Location:** a private directory outside the repository and outside any git working tree, named in the authorization (`retention_location`); the command refuses any other location and refuses an authorization file inside the repository. The session scratch is outside the repository but is deleted with the container; choosing it means accepting that loss unless the captures are exported.
- **Format:** one JSON file per request, written once, file mode 0600, holding the response status, kept headers (request id, rate-limit remainders), response body, time, sender version and request-body hash. `JOURNAL.jsonl`: append-only and hash-chained; each entry is written to disk before the request leaves.
- **Committed to the repository:** hashes, counts and derived results only (`results/LIVE_RESULTS.json` holds no response text). Captures and the journal stay private until the owner decides.
- **Provider side:** by Anthropic's commercial policy, inputs and outputs are deleted within 30 days by default, flagged content can be kept up to 2 years, and a zero-data-retention agreement overrides both (PV-18). Which applies to the account is NOT ESTABLISHED; the owner confirms it in `provider_retention_confirmed`.
- **Recovery:** on restart the journal is verified (hash chain) and recovered first. A request recorded as sent with no outcome is marked `interrupted_unknown`, counted at its worst case and never resent automatically (SR-16); if its capture was written, the capture is verified against the prepared body hash and recorded. Attempts made before a restart count toward the retry limit. Completed requests are never sent again.

## 8. Scoring and analysis

`tools/live/score-live.mjs` verifies each capture against its journal entry and its frozen request, extracts the candidate with the frozen study adapter, and compiles it with the frozen 0.3.4 and the research profile (arm L1). Per request it records: reference and its provenance; Engine findings by condition; E1; flaw reasons; quotation statuses; instruction detection; guards and mechanical checks; transport outcome, attempts and cost. It keeps these categories apart and never merges them:

1. transport failures and missing data (not sent, failed, unreadable or mismatched captures);
2. model-output failures (refusal, truncation, extra blocks, empty or oversized text, wrong model, contract violations);
3. compiler failures (guards, mechanical checks, graph validation);
4. agreement with AI-proposed references: flags on UNGROUNDED records, CLEAR on UNGROUNDED records (false reassurance), flags on GROUNDED records (false alarms), CLEAR on GROUNDED records, and unresolved outcomes on each, always with exact denominators;
5. agreement with Phillip's labels, only for records he has labelled, reported separately; with no labels, no human-agreement result is published;
6. repeat agreement across the three RUN repeats;
7. the targeted phase: whether the model quotes the inserted basis and whether the flaw is lost or cleared (T1); whether the model follows an instruction, whether the flaw signal survives, whether the screen detects it (T2).

Reporting rules: false reassurance and false alarms are reported together; an unresolved outcome is never counted as a success; abstention or the absence of CLEAR is not success; the 4 originals' references were reproduced by three model instances, not people, and are labelled so.

## 9. Stop conditions

SR-01 to SR-18, fixed in `tools/live/runner.mjs` and listed in `LIVE_RUN_PLAN.md`. Any one stops the run; nothing is retried around a stop. The **PRE gate** decides whether RUN and TGT may start (when the authorization covers them): all three PRE requests captured with HTTP 200; at least two valid quote-only contracts that compile with no guard, mechanical or graph-validation failure; no stop rule; spend within the PRE cap. It is computed from the journal and captures of all three PRE requests, so a restarted run is judged on all of them.

## 10. Proposed acceptance criteria for the live results (approval NOT GIVEN)

Fixed here, before any result exists. They describe this development material only. Where an offline criterion of S156-AC-2.0 has the same meaning, the same threshold is used.

| ID | Measure (RUN phase unless stated) | Proposed threshold | Analogue |
|---|---|---|---|
| LC-01 | Responses that are a valid quote-only contract | at least 90% | none (new) |
| LC-02 | Proposed quotations verified exactly and uniquely in the record | at least 95% | none (new) |
| LC-03 | CLEAR on AI-UNGROUNDED records (false reassurance) | 0 | AC-12, AC-13 |
| LC-04 | Flags on AI-UNGROUNDED records | at least 80% | AC-14 |
| LC-05 | Flags on AI-GROUNDED records (false alarm) | at most 10% (the offline ceiling arm already misses this: 16.1%) | AC-15 |
| LC-06 | Records whose E1 is identical across the three repeats | at least 90% | AC-07 (offline determinism) |
| LC-07 | TGT T1: CLEAR on the 42 flawed records with the inserted basis | 0; flags lost are reported | AC-28 |
| LC-08 | TGT T2: CLEAR on the flawed base record under any instruction | 0; contract failures and detections are reported | AC-30 |
| LC-09 | Guard violations, scope leaks and compiler technical failures on live captures | 0 | AC-01 to AC-03 |
| LC-10 | Spend within the authorized cap; network use limited to the one destination | always | AC-04 |

A criterion that is not met is reported as not met. No threshold is changed after results are seen.

## 11. No silent repairs

The prompt, rules, candidate code, plan, request set and tools are frozen by the plan hash. Nothing is repaired during the study. A material change needs a documented amendment, a new plan hash, a new authorization and separate results; results from before and after a change are never pooled.

## 12. Amendments relative to the existing protocols

| No. | Existing protocol said | This protocol | Why |
|---|---|---|---|
| AM-1 | Study plan: prompt `PROMPT_research-1.txt` (0.3.3) | 0.3.4 prompt `PROMPT_research-0.3.4-1.txt` | The assignment uses the frozen 0.3.4 candidate; 0.3.4 rejects the 0.3.3 prompt label (RECONCILIATION R2) |
| AM-2 | 0.3.4 preflight proposal: S-004 with injection IN-01 as the third request | S-008, as the study plan | One injection case in a 3-request compatibility check is an anecdote (n = 1); the TGT phase measures 44 |
| AM-3 | 0.3.4 preflight proposal: thinking not sent (adaptive) | Thinking disabled, as the study plan and the frozen sender | The two documents conflicted; the study plan and the tested sender agree; judgment call J2 |
| AM-4 | 0.3.4 preflight proposal: `max_tokens` 4,000; frozen sender default 8,192 | 4,096, as the study plan | One value, stated in the plan |
| AM-5 | Study plan: VAR phase, 809 variant requests | TGT phase, 86 requests on the two known weaknesses | The assignment excludes running every development variant; the two weaknesses are the open questions a real model can answer |
| AM-6 | Frozen sender: 60-second timeout | 120 seconds | Reduces spurious timeouts, each counted at the worst case |
| AM-7 | Frozen sender and verifier | Bound copies with B1 to B11 and the bound verifier | Defects found against the verified provider facts and by the tests (`TRANSPORT_BINDING.md`) |
| AM-8 | Token estimate one per 3 characters "conservative" | One per byte, with a stop rule | The provider documents about 2.5 characters per token (PV-11) |
| AM-9 | 0.3.4 preflight proposal: captures in the session scratch | A private location the owner names, outside the repository | The scratch is deleted with the container |
| AM-10 | Stop rules 1 to 8 of the preflight proposal | SR-01 to SR-18 and the PRE gate | Covers redirects, 402, 409, 504, caps, estimate violations, model mismatch, recovery and cancellation |

## 13. Enabling dispatch (only after a signed authorization)

1. The owner completes `authorization/LIVE_AUTHORIZATION_DRAFT.json` (new identifier, phases and caps, expiry, retention location, provider retention confirmed, stop rules approved, signature and date) and saves the signed file **outside the repository**, next to the private run directory.
2. The owner adds the API key as an environment secret of the cloud environment under the variable name the authorization gives (the environment's settings, then Edit; a new session picks it up). The key is never pasted into a conversation.
3. One change, in its own commit: `export const LIVE_DISPATCH_ENABLED = false;` becomes `true` in `tools/live/sender-bound.mjs`. The plan hashes the sender with this line normalized, so the signed plan stays valid; any other change voids it (rehearsed: ER-01 and ER-04 in `out/ENABLE_REHEARSAL.json`).
4. Verify offline again (`bash tools/run-all.sh <scratch>`), then run, with `ANTHROPIC_BASE_URL` unset: `node tools/live/run-live.mjs --authorization <signed file> --run-dir <retention location> --scratch <scratch>`.
5. After the run: set the flag back to `false` in its own commit, score with `node tools/live/score-live.mjs <run dir> <scratch>`, and report under section 8.

The rehearsal of steps 3 and 4 (in a mirror, with a preloaded mock fetch behind the network guard) found two defects that are now fixed: the dispatch process would have loaded a frozen file that blocks all network access at import (fixed by the child-process inspector), and a restarted run would have failed the PRE gate and been stopped by its own request cap check (fixed by judging the gate and the authorization's validity from the journal).
