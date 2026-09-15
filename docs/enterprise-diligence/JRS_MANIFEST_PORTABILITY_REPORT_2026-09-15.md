# JRS Manifest Portability Report — 2026-09-15

**The architectural milestone: a manifest is interpretable without JRS.**

## Method

`tools/validate-manifest.js`, the schema and six manifests were copied into an empty
directory. Nothing else: no repository, no `lib/`, no engine, no `node_modules`.

Execution used `env -i` (no environment variables) and a preamble that **replaced `fetch`,
`XMLHttpRequest`, `WebSocket` and `EventSource` with throwing getters before importing the
validator**. Reaching for the network raises rather than silently succeeding.

## Result

All six fixtures behaved as expected with no network available. The five well-formed manifests
validated and reported `SELF-CONSISTENT (not authenticated: unsigned)`. The forged fixture was
rejected, with `HASH MISMATCH`.

**Two files and a JSON document are sufficient to interrogate a JRS evaluation.** No JRS API,
no Anthropic, no Supabase, no Vercel, no account.

## What this establishes, and what it does not

**Establishes:** structural validity; presence and separation of the version fields; the
declared condition and routing vocabularies; the content classification; hash structure; and
internal consistency of the integrity hash. It also establishes **transferability**: a future
holder of the estate can interpret these artifacts without the current infrastructure.

**Does NOT establish:** accuracy; validation of the engine; legal validity, admissibility or
compliance; or authenticity. **Authenticity requires a signature and verification, and
signature verification is not implemented**, so an unsigned manifest is never reported as
authentic.

**It is also not evidence that JRS is validated.** It is evidence that the evidence layer is
portable, which is a different and narrower claim.
