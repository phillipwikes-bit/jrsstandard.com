# JRS Manifest Implementation Report — 2026-09-15

**STATUS: REMEDIATED (development) — NOT VERIFIED IN PRODUCTION — NOT DEPLOYED**

## What was built

| Artifact | Version | Purpose |
|---|---|---|
| `lib/manifest/canonicalize.js` | `jrs-dev-canon-1` | Deterministic serialization; excludes `integrity` at the call site |
| `lib/manifest/hash.js` | — | `crypto.subtle` SHA-256 with a mandatory algorithm prefix |
| `lib/manifest/build.js` | manifest `1.0` | Represents an evaluation; performs none |
| `tools/validate-manifest.js` | — | Offline subset validator |
| `tests/manifest/run.mjs` + 6 fixtures | — | 39 checks |

**`crypto.subtle.digest('SHA-256', …)` was chosen because `api/_country-backfill.js` and
`api/roster-8c3f1a9e7b2d6045.js` already use it.** A second hashing idiom was not introduced.

## The three refusals

The builder's value is what it declines to do. Each throws rather than guessing:

1. **Codebook relabelling.** `condition_vocabulary` defaults to `review_engine_keys` and
   `jrs_codebook_1.0` is refused without an owner-declared mapping. **This is what stops D-2
   and D-3 being answered in code.**
2. **Routing translation.** Both vocabularies are accepted, neither is converted into the
   other. Asking for `openapi_1.0_routing` when the engine emitted a `determination` throws.
3. **Content-class assertion.** `content_class` is **derived from what is present**, never
   taken from the caller. A caller cannot declare a manifest record-free while notes are in it.

Statuses are copied, never coerced: an invented status throws instead of defaulting.

## The truncation decision, made explicitly

The engine truncates at 8,000 characters, so two hashes are possible. **`input.hash` covers
the text the model actually evaluated**, because that is what the result corresponds to.
When truncation occurred, `input.source_hash` carries the full record so a holder of the
original can still prove correspondence. `input.truncated` is **computed from the comparison,
never asserted**.

## What was deliberately not built

No route change. **`api/v1/review-engine.js` was not modified.** No customer portal, no
certification, no billing, no entity. Signature verification is not implemented, so an
unsigned manifest reports **SELF-CONSISTENT**, never authentic.

## Integration gap

Available from the engine today: engine name, version, model, api_version, runs, five
statuses and notes, determination, variance. **Absent: input hashing, `jrs_version`,
`codebook_version`, `context`, `warnings`, `human_review`, `integrity`.**

The builder supplies the last five from caller-provided metadata. **Wiring it into the route
would require the route to hash its input and carry two version constants.** That is a route
change under deployment control and was not made.
