# JRS Review Engine evaluation package: quickstart

**DRAFT 2026-10-02. For a licensed evaluator. Provider route: direct Anthropic API only, tested live on 2026-10-02.**

## What you need
- Node.js 22 or later. The package has no other dependencies and nothing to install.
- Your organization's own Anthropic API key, with a spending limit set in your Anthropic account.
- Records as plain-text `.txt` files, one record per file, each 40 to 8,000 characters long. Longer files are rejected, not shortened.

## 1. Unpack and check
```
tar -xzf jrs-eval-<version>.tar.gz
cd jrs-eval-<version>
sha256sum -c SHA256SUMS.txt
node tools/test-run-smoke.mjs
```
The tests make no network calls. They must report `0 failed`.

## 2. Set up your entitlement
Copy `entitlement.example.json` to `entitlement.json` and enter the licensee name and expiry date from your order form. Keep `max_attempts` at the number in your order form (default 300). The file `ledger.json` is created on first use. Every provider call is counted, including failures and timeouts.

## 3. Run the synthetic demonstration
```
export ANTHROPIC_API_KEY=...        # your key; never put it in a file in this folder
node tools/run-smoke.mjs --live --out runs/demo-1 --entitlement entitlement.json
```
This makes 10 calls on the five fictional records in `corpus/records/`. The worst-case cost at list price is about USD 0.10.

## 4. Run your own records
```
node tools/run-smoke.mjs --live --out runs/<new-name> --records <your-folder> \
  --calls-per-record 1 --entitlement entitlement.json --usd-ceiling 5
```
- Each run writes `runs/<name>/EXECUTION-RECORD.json`. It contains every attempt, the five condition statuses, the route, the notes and a Manifest for each call. **It also contains model output derived from your records, so store it as you would the records.**
- An existing output folder is never overwritten.
- Exit codes: 0 complete; 2 incomplete (a call failed or a limit was reached); 3 blocked before any call (no key, expired entitlement, quota or cost bound, invalid record); 4 usage error.

## What the package does and does not do
- Only `https://api.anthropic.com/v1/messages` can be reached. Redirects are refused. Each call times out at 60 seconds. Nothing is retried.
- Nothing is sent to JRS. Your record text goes to Anthropic under your own account and terms.
- Expiry and quota are management controls for a cooperative licensee. They are not technical protection against changes to the delivered code. The licence terms govern use.
- See `DEMO-LIMITATIONS.md` for what has and has not been tested.

## Support
Up to 2 hours during the term: info@jrsstandard.com. Never send record text, screenshots that show records, or your API key. Send the package version, the exit code and the `status` and `blocked_reason` lines from the execution record.
