# JRS / DRR / Decision Spellchecker Comprehensive Integrated Master Program
## Increment 21 | Incomplete-source refusal and metric-denominator integrity
**Record date:** 31 October 2026. **Governing edition:** Issue 3.3, G2/PST-05; Increments 16-20. **Review status:** Draft/unmerged, developer evidence only. **Website production:** HOLD.

### 1. Direct source observations
The shared paginated PostgREST reader `api/_sb-fetch.js` exposes an explicit `fetchAll(...)` result with `{rows,complete}`, but both `fetchAllRows` and `fetchAllUrl` previously returned `rows` without evaluating `complete`. As a result, a 502 response on a later page could still become a plausible truncated count or `[]` from wrappers.

The same source review identified two independent completeness failures:
- `api/checkout-stats.js` returned empty lead/inquiry collections if the fallback or enterprise inquiry source failed, allowing a partial buyer funnel to appear complete with zeros.
- `api/enroll-stats.js` retrieved `training-complete` with a single direct potentially capped `fetch`, then treated unsuccessful and thrown reads as best effort, permitting a plausible undercount or zero. The original enrollment read already used pagination but the completion branch did not.

These are **source-confirmed potential integrity defects**. No unauthorized live Supabase query was used and no actual production source total or undercount was asserted.

### 2. Implemented source changes
**Shared reader** (`api/_sb-fetch.js`, original Git blob `fd90445c14607d3f7973ea447de762c35eb411ac`):
- `fetchAllRows` now throws `source_read_incomplete` when `fetchAll` reports `complete:false`.
- `fetchAllUrl` likewise refuses incomplete pagination. An invalid URL missing `/rest/v1/` throws `source_url_invalid` instead of returning a false empty result.
- `fetchAll` itself remains unchanged, preserving the explicit completeness contract for callers that require special handling. No SQL, credentials, pagination cap, source row filters or historical records were changed.

**Checkout reader** (`api/checkout-stats.js`): Failed or invalid fallback lead and enterprise inquiry source reads now return HTTP 502 `checkout_source_incomplete`, not a plausible zero count. Valid complete empty collections still return genuine zero counts with existing schema.

**Training reader** (`api/enroll-stats.js`): Complete-source `training-complete` pagination replaces the direct fetch. Invalid/partial/failed completion reads return HTTP 502 `training_completions_unavailable`; all preexisting email-deduplication and country-backfill computations remain in place.

The immutable original 24-file source baseline remains untouched. The training reader was already one of the six proposed private-reader security exceptions. Its **candidate blob SHA is updated in the exception record** to cover the further completeness correction while retaining the same original before-blob identity. The total proposed exception count remains eight, all `PROPOSED_NOT_RELEASE_APPROVED`; `owner_approval:NOT_PROVIDED`; `production_status:HOLD`.

### 3. Test evidence
`tests/source-read-completeness.test.mjs` provides 15 fully synthetic adversarial cases: legitimate empty source, 1,001-row pagination, errors on first and second pages, interrupted network and malformed body/URL, row-only wrapper refusal, explicit `fetchAll` contract, failed fallback leads, failed enterprise inquiries, valid empty commercial sources, 1,001 distinct training completers, incomplete later training-completion page, and immutable-baseline/source-exception consistency.

The new suite is executed by both inherited CI workflows. On pre-document head `ab622b4495eec7a9d0678f88ba35f18c51d0561d`:
- [Continuity run 41233268583](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41233268583) **SUCCESS**, 15/15 new cases PASS.
- [Full-site run 41233268603](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41233268603) **SUCCESS**, 15/15 new cases PASS plus the preserved geography, asset-funnel and other inherited source/authorization checks.

This is fabricated test evidence. A synthetic zero does **not** demonstrate a zero count in historical records. A following documentation commit requires its own exact-head CI check before a final PASS claim.

### 4. Residual quality risks and dependencies
The new complete-only wrappers prevent an explicit failed page from masquerading as successful output, but do not establish an immutable database snapshot or prevent page-boundary drift if rows are inserted or updated during the series. The shared reader's page range currently lacks an explicit stable global sort for most requests. Without a single snapshot or a stable unique key, a complete sequence of independently executed pages can contain duplicates or omissions even if every HTTP response succeeds. This is a **separate unresolved source-grain and temporal-consistency risk**. Do not infer exact cross-table or longitudinal totals from the synthetic tests alone.

A few caller pathways use one-shot `fetch` instead of the shared helper or use best-effort failed-read behavior. Those calls require distinct domain-appropriate review, not blanket text replacement. Some public metrics use the anonymous Supabase key, so source authorization boundaries must not be conflated with private owner-only reports.

Actual fixed-UTC eleven-family source reconciliation, direct anonymous Supabase RLS, current preview authenticated positive and negative checks, `/asset-stats` alias behavior, live mobile usage, revoked-cookie replay behavior and rollback remain unaccepted. The Vercel deployment quota previously blocked a fresh exact-SHA Preview; no production deployment or credential changes occurred.

### 5. Governing decision
| Control | Status |
|---|---|
| Incomplete-source refusal in shared wrappers | IMPLEMENTED in draft; developer tests passed |
| Checkout fallback/inquiry missingness | HTTP 502 on incomplete/unavailable, developer tested |
| Paginated training completions | Complete-only source and 502 failure, developer tested |
| Immutable 24-file historical baseline | UNCHANGED, exact candidate exception still awaiting owner approval |
| Live fixed-UTC eleven-family denominator verification | NOT VERIFIED |
| Cross-page stable-order/snapshot integrity | NOT ESTABLISHED |
| Website production | HOLD |
| Original private DS-A / SP-01..18 | NO_GO_NOT_VERIFIED / 0 accepted |
| Independent H2-vs-H3 efficacy | NOT_ESTABLISHED |
| R6 rights and commercial conveyance | NOT_AUTHORIZED / 0 of 32 |

No human case materials, named contact records, secret values, external model calls, live DB changes, commercial action or source rights were accessed or altered. The next incremental control should address **cross-page ordering and read-consistency provenance** without disturbing the evidence ledger or pretending a paginated HTTP sequence constitutes a transactionally consistent snapshot.
