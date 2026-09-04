# /api/review Repair Report

2026-08-15.

---

## 1. Original Failure

`POST /api/review` returned HTTP 500 with the body:

```
{"error":"Server error","detail":"Expected ',' or ']' after array element in JSON
 at position 2222 / 2237 / 2306 / 2318 / 2457"}
```

Users of the record review widget on `index.html` and the practice assessment on
`training.html` saw a raw parser exception where an analysis should have been.

Measured baseline before any change, 9 calls across three record sizes:
**2 passed, 7 failed.**

| Record | Result |
|---|---|
| short, 141 chars | 2 pass, 1 fail |
| medium, 443 chars | 0 pass, 3 fail |
| long, 1,621 chars | 0 pass, 3 fail |

---

## 2. Root Cause

**Two causes, both confirmed. Neither was inferred from the parser error.**

**Cause 1: the model response was truncated at the configured output limit.**
`max_tokens` was 1024. The provider reported `stop_reason: "max_tokens"` with
`output_tokens: 1024` on every failing call, meaning generation stopped because
the limit was reached while the JSON was still open. `JSON.parse` then threw on a
half-written object, and the raw exception message reached the browser.

**Cause 2: the JSON extractor was greedy and took the wrong span of text.**
The extractor was `content.match(/\{[\s\S]*\}/)`: everything from the first `{`
to the **last** `}` in the whole response. When the model wraps its answer in a
markdown code fence, or writes a sentence after the JSON that happens to contain
a brace, that pattern captures the trailing text as well and the parse fails on
output that was actually complete.

Cause 2 was only visible after cause 1 was fixed and the diagnostics were in
place. It produced a failure with `stop_reason: "end_turn"`, which is the
provider saying the model finished normally.

---

## 3. Evidence

**For cause 1.** The endpoint did not read `stop_reason`, so the provider's own
account of what happened was being discarded. I added structural diagnostics
first and deployed them before changing any behaviour. The very next failure
returned:

```json
{"reason":"model_output_truncated",
 "diagnostic":{"stop_reason":"max_tokens","output_tokens":1024,"content_chars":4464}}
```

`output_tokens` exactly equal to the configured limit, on 7 of 9 calls. That is
the provider reporting the limit was hit, not an inference from a parser error.

**For cause 2.** One call at the 8,000-character input cap failed with
`stop_reason: "end_turn"` and `output_tokens: 1343`, well under the limit: the
model had finished and the JSON still would not parse. A later failing call
carried the structural fields:

```json
{"stop_reason":"max_tokens","content_chars":8645,"first_brace":8,
 "last_brace":3327,"chars_after_last_brace":5317,
 "open_braces":6,"close_braces":5,"fenced":true}
```

`fenced: true` and 5,317 characters sitting after the last brace confirm the
model both fences its output and writes text after the JSON. I then reproduced
the failure deterministically offline: a fixture of valid JSON followed by
`"Note: the schema above uses {status} values..."` fails to parse under the old
greedy extractor and parses correctly under the replacement.

**A correction to my own earlier reasoning.** I first raised the limit to 2048
and wrote in the code that output does not scale with record length. That was
wrong. Complete responses measured ~3.1k characters for a 141-character record
and ~8.2k for a 1,621-character one, and at the 8,000-character input cap 1 call
in 12 still truncated at 2048. The limit is now sized against the largest input
the endpoint accepts rather than a typical one.

---

## 4. Files Changed

Two.

| File | Why it changed |
|---|---|
| `api/review.js` | The endpoint under repair. |
| `scripts/test_review_incomplete.mjs` | New. Offline test suite for the incomplete-response paths, run against the real handler with the provider stubbed. No network and no API key required. |

Verified unchanged: `api/bench-score.js`, `api/_offer-config.js`, `engagement.html`,
`terms.html`, `audit-request.html`, `governance-request.html`,
`calibration-request.html`, `sitemap.xml`.

Verified unchanged **inside** `api/review.js`: `SYSTEM_PROMPT` in full, the five
Review Condition definitions, the response schema, the model id, the input caps,
the rate limiter, and the CORS and origin rules.

---

## 5. Exact Repair

**a. `max_tokens: 1024` → `4096`.** One value.

**b. Replaced the greedy extractor with a balanced-brace scan.** A string-aware
walk from the first `{` that returns at the matching `}`, so it takes exactly the
JSON object and ignores a code fence or any prose around it. String-aware so a
brace inside a quoted note, which is ordinary in a record review, cannot
unbalance the count.

**c. Defensive handling for an incomplete response**, which the endpoint had
none of:

- Guards an empty or malformed `content` array instead of throwing on `content[0]`.
- Treats `stop_reason === 'max_tokens'` as a failure **before** parsing, so a
  truncated analysis can never be returned as a finished one.
- Wraps `JSON.parse` so a parse failure is a controlled 502, not a raw exception.
- Returns a short user-facing `error`, a machine-readable `reason`, and a
  `diagnostic` object.
- Invents no field to fill a gap and repairs no model content.

---

## 6. API Contract

**Unchanged on success.** The 200 response is the same JSON object with the same
field names: `routing`, `routingRationale`, `conditions`, `flags`, `revisions`,
`summary`. The request format is unchanged. Both frontends read exactly these six
fields and were verified against a real captured production response.

**Error responses gain two optional fields**, `reason` and `diagnostic`, alongside
the existing `error` field that both frontends read. No existing field was
renamed, removed or repurposed. The generic 500 for a parse failure is now a 502
with a specific reason; both frontends branch on `!res.ok` or `data.error` and
render the `error` string, so neither is affected by the status code.

The `diagnostic` object is structural only: stop reason, token count, character
length, brace positions and counts, and whether a code fence was present. No
model text and no submitted record text appears in it.

---

## 7. Testing

| Test | Result |
|---|---|
| A. Short record, 141 chars, 3 runs | **PASS** 3/3 |
| B. Medium record, 443 chars, 3 runs | **PASS** 3/3 |
| C. Long record, 1,621 chars, 3 runs | **PASS** 3/3 |
| C2. At the input cap, 7,900 of 8,000 chars, 12 runs | **PASS** 12/12 |
| D. Repeated execution | **21/21** across all four sizes |
| E. Incomplete-response handling, 8 offline cases | **PASS** 8/8 |
| F. Frontend integration, both consumers, success and error | **PASS** |
| Production endpoint | **PASS**, all of the above ran against live production |

Every passing response carried all six required fields and exactly five
conditions. Largest response at the input cap: 7,753 characters, roughly 1,800
tokens against the 4,096 limit.

**Test E cases:** truncation cut mid-array; unparseable JSON with a normal stop
reason; valid JSON followed by prose containing a brace; JSON inside a markdown
code fence; no JSON object at all; empty content array; content key missing; and
a well-formed response that must still succeed. Every failure case asserts three
things: a controlled status, no partial analysis returned, and no record text
echoed.

**Test F:** drove each page's own submit function with its own input id.
`index.html` shows all five conditions, the routing and the flags on success, and
`"Error: The review could not be completed. Please try again."` on a 502.
`training.html` renders the same on success and surfaces its error box on a 502.
Zero page errors on both. No raw exception and no diagnostic field reached the
user in any run.

**Two of my own tests were wrong before they were right, and both are worth
recording.** The first frontend check read `document.body`, which matched the
pages' static copy describing the five conditions and the Low/Moderate/High/
Critical scale, so an error render looked identical to a success render. The
first offline fixture for unparseable JSON had no closing brace, so it never
reached the parser and was classified as `no_json_object`. Both were bad tests
producing misleading greens, and both were corrected before any result was
reported.

---

## 8. Regression Check

Tested and unaffected: `/api/panel-stats` 200, `/api/contributor-stats` 200,
`/api/asset-stats` 200, `/api/telemetry` 405 on GET as designed.
`scripts/check_zero_drift.py`: 11 checks, 0 failed.

`index.html` and `training.html` are the only two consumers of this endpoint,
confirmed by search across all 70 HTML files. `check.html` does **not** use it:
it is a static seven-point checklist, which is why the free tool kept working
throughout.

---

## 9. Benchmark Status

`bench-score` was not modified or provisioned. It was inspected once, from the
outside, to confirm it is unrelated: it still returns
`{"error":"licensing_not_provisioned"}`. `BENCH_SCORE_TOKENS` and
`BENCH_KEY_JSON` were not created, and no benchmark answer was written, inferred
or guessed.

---

## 10. Commercial Status

Commercial pages remain paused. `engagement.html`, `terms.html` and the three
request pages are still unlinked, still `noindex,nofollow`, and still absent from
`sitemap.xml`. No pricing, tier, checkout or sales content was touched.

---

## 11. Research Status

Research studies and research methodology were not modified. The five Review
Conditions, the routing scale, the response schema, the system prompt and every
research dataset, claim and answer key are byte-identical to before this repair.

---

## 12. Remaining Issues

Two things are worth knowing, neither of which is an open `/api/review` defect:

1. **Latency is 8 to 18 seconds per call**, rising with record length. That is
   the model's generation time, not a fault introduced or removed here. It was
   the same before the repair. Mentioning it because a first-time user on a long
   record waits a while with only a "Reviewing…" status line.

2. **The prompt does not forbid prose around the JSON.** The balanced-brace
   extractor makes that harmless, and it is the safer place to handle it than the
   prompt. If output length ever needs reducing, adding "return only the JSON
   object, with no code fence and no commentary" to the system prompt is the
   lever, but it is a prompt change and I have not made it.

Beyond those: **no known /api/review issues remain within the tested scope.**
