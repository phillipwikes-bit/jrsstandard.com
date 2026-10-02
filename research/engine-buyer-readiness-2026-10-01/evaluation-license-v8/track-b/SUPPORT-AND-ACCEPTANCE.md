# Support, acceptance and remedy

**DRAFT 2026-10-02. Proposed terms; final terms are in the executed agreement.**

## Support
- Up to **2 hours** in total during the 30-day term, by email to info@jrsstandard.com.
- Covers installation, running the package and reading its output.
- Excludes custom integration, legal advice, interpreting the buyer's own records, and work on other provider routes.
- Response window: **not yet set.** It is set only after the owner confirms availability (v8.0 section 24). No 24/7 or same-day commitment is made.
- The buyer sends the package version, exit code and status lines. Never send record text, screenshots that show records, or API keys. Anything received by mistake is deleted, not kept.

## Acceptance (does not depend on the results)
The delivery is accepted when, on the buyer's machine:
1. `sha256sum -c SHA256SUMS.txt` passes;
2. `node tools/test-run-smoke.mjs` reports 0 failed;
3. the synthetic demonstration run completes with exit code 0, or fails only for a reason on the buyer's side (no key, provider limit, network rule).

The buyer has 5 business days after activation to report an acceptance failure. A finding that JRS does not suit the buyer's workflow is a valid result of the evaluation, not a delivery failure.

## Remedy for a delivery failure
- JRS corrects the package and delivers a new version within 10 business days of a reproducible report, **or**
- if JRS cannot correct it, the fee is refunded in full and the evaluation ends.
- No other remedy, warranty or indemnity is offered under this limited fee. Liability is capped at the fee paid (see the agreement draft).
