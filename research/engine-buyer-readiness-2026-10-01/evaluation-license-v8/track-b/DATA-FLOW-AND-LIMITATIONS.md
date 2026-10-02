# Data flow and limitations: customer-run evaluation

**DRAFT 2026-10-02.** Every statement below cites what was inspected. The last section lists what JRS has **not** checked.

## Where record text goes

| Step | What moves | Where | Evidence |
|---|---|---|---|
| 1 | Record text, read from the buyer's folder | Stays on the buyer's machine | `tools/run-smoke.mjs` `loadCorpus` |
| 2 | Record text plus the Engine's system prompt | Anthropic Messages API, under the **buyer's** API key and account terms | `engine/api/review-engine.js` `oneRun`; the runner allows only `https://api.anthropic.com/v1/messages` (offline test checks 1 and 7) |
| 3 | Model output: statuses, notes, finding, Manifest | Buyer's `runs/<name>/EXECUTION-RECORD.json` | Runner `finish()` |
| 4 | Anything to JRS | **Nothing.** The JRS database write in the Engine (`logReview`) runs only when `SUPABASE_SERVICE_ROLE_KEY` is set; the runner deletes that variable, and refuses any non-provider host | Offline test checks 1 and 7 |
| 5 | Support contact | Package version, exit code, status lines only; **no record text** | `README-QUICKSTART.md` Support section |

## Limits
- One model: `claude-haiku-4-5-20251001`. Status Active, retirement not before 2026-10-15 per Anthropic's deprecations page (read 2026-10-01); Anthropic gives at least 60 days' notice.
- Records: plain text, 40 to 8,000 characters. PDF, Word and scanned files are not converted.
- The output file holds model text derived from the records, so treat it as being as sensitive as the records.
- The package's expiry and quota are management controls, not technical protection.
- The JRS repository is public, so the Engine source is openly readable. The licence grants permission to use it, the package and support; it does not sell secrecy.

## Buyer-side checklist (the buyer completes and keeps this)
| # | Item | Buyer answer |
|---|---|---|
| 1 | Who holds the Anthropic account and API key used, and who may approve its spend | |
| 2 | Spending limit set in that Anthropic account (amount) | |
| 3 | The buyer's Anthropic data-retention and training terms checked for this account type (no-training is not the same as zero retention) | |
| 4 | Records used are permitted for this evaluation and for sending to Anthropic | |
| 5 | Records are de-identified where required; residual identification risk considered | |
| 6 | Records are not employment, housing, lending, insurance, medical or legal decision records | |
| 7 | Machine and folder where the package runs; who can read `runs/` | |
| 8 | Retention and deletion of `runs/` output at the end of the term | |
| 9 | Network rules allow `api.anthropic.com` only, as the package requires | |
| 10 | Named evaluators (up to three) | |

## What JRS has not checked
- The buyer's Anthropic account terms, retention settings, region or limits.
- Any provider route other than the direct Anthropic API. AWS Bedrock and Google Vertex are not implemented.
- Live behavior beyond the one 10-call test run on five fictional records (2026-10-02).
