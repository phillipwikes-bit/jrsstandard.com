# IncomeOS corrective-action release register

Status: OPEN. Scope: protected owner prototype only. This document is a release checklist, not proof of completed controls.

## P0: Source authenticity and financial evidence
- [ ] Replace caller-provided `sourceVerified`, `posted`, `serverAuthenticated` and `balanceSourceVerified` assertions with server-verified attestations from an authenticated financial provider.
- [ ] Bind account, institution, currency, amount, posted date, source transaction ID, source version, and immutable evidence digest.
- [ ] Reject empty outcomes and statements; enforce signed corrections, reversal links, chargebacks, negative adjustments and immutable duplicate detection across runs.
- [ ] Separate realized net income, gross receipts, avoided costs, refunds, principal, unrealized gains, fees and taxes. Never treat avoided costs as cash deposits.
- [ ] Validate end-to-end reconciliation against real source records and independently reproducible monthly closes.

## P0: Security and deployment
- [ ] Deploy only to dedicated IncomeOS Vercel project, never JRS production.
- [ ] Enforce authenticated server-side owner authorization for every sensitive route, API, file and operation.
- [ ] Verify session expiry, access revocation, CSRF defenses, rate limits, security headers, secret handling, encryption, data retention and deletion.
- [ ] Test direct URL access, unauthenticated requests, cross-user access, downloadable assets and API responses.
- [ ] Obtain exact-commit protected preview and mobile acceptance results before any production release.

## P0: Money movement
- [ ] No investment execution or transfer until institution capability, funds availability, user-specific authorization, destination allowlist, per-transfer limits, replay protection, idempotency, settlement confirmation and emergency disable are independently verified.
- [ ] Preserve manual approval for each consequential transaction; do not infer authorization from dashboard state.

## P1: Operations and economic results
- [ ] Persist tamper-evident execution receipts, source freshness, retries, failures, alert delivery and remediation ownership.
- [ ] Verify scheduler coverage and alert reliability over a sustained observation period.
- [ ] Report actual posted receipts, documented expense reductions, fees, tax considerations and owner time separately.
- [ ] Produce a source-backed monthly performance statement and independent review sample.

## Acceptance
Release HOLD until all P0 items have evidence, a named reviewer, exact commit, test results and a reversible deployment plan. Static-browser checks and caller-supplied flags do not satisfy source authenticity. The release-gate module intentionally returns HOLD until these conditions are independently implemented.
