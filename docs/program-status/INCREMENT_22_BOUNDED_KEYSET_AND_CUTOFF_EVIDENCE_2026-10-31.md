# JRS / DRR / Decision Spellchecker Comprehensive Integrated Master Program
## Increment 22 | Bounded chronological reconstruction of owner checkout source reads

**Record date:** 31 October 2026. **Controlling edition:** Issue 3.3, G2/PST-05 and the approved distinction between developmental evidence and live release admission. **Repository:** `phillipwikes-bit/jrsstandard.com`. **Draft:** PR #74, stacked upon PR #73. **Owner release:** HOLD.

### 1. Material source risk
The Increment 21 PostgREST helper now refuses incomplete HTTP pagination. Nevertheless, its existing Range pagination uses independent requests and, on many source queries, no unique global `order` and no shared UTC cutoff. If records are inserted or updated during an offset-based multi-page read, a request can return HTTP success for every page while repeating or omitting source rows at page boundaries. A count derived from that sequence would be operationally plausible but would not be reconstructable as a single stable source population.

The countermeasure does not require changing the historical source data, inventing a transaction snapshot, or resetting any frozen file manifest. It requires an explicitly bounded, deterministic, observable read contract. The first bounded implementation covers only the **three owner-only checkout reporting sources**. It does not automatically rewrite all 11 original source-family readers.

### 2. Implemented scope and method
New source file `api/_sb-bounded-keyset.js` provides an opt-in `fetchBoundedKeyset` reader with the following contract:

1. Accept only a source-controlled HTTPS PostgREST query for `pilot_contacts` or `interaction_events`, with one `source=eq.X` filter and an explicit `select` containing `id` and `created_at`. Reject unknown query overrides and unexpected source tables.
2. Require a fixed, externally supplied UTC cutoff in canonical millisecond ISO-8601 format. Require every returned record's timestamp to be valid UTC and no later than the cutoff.
3. Order on `created_at.asc,id.asc`. Page using a strictly advancing composite PostgREST predicate based on the last recorded timestamp and unique row ID. The next page starts after the last observed key, not at a moving source offset.
4. Retain the database's original timestamp text when constructing cursor equality conditions, including microsecond precision. JavaScript's millisecond-limited Date serialization must not silently truncate the cursor.
5. Validate all returned row IDs, unique identity, monotonic ordering and chronological cutoff. Reject duplicates, out-of-order results, malformed source data, incomplete HTTP or JSON pages and a page-limit ceiling.
6. Return private read evidence: cutoff UTC, ordered key definition, rows observed, number of source-page requests and qualification `bounded_ordered_read_not_atomic_snapshot`. Never return a partial source as a valid result.

The read scope is deliberately limited to two known source tables. The actual Supabase column types, row ID stability, index and row-level security have **not** been independently inspected, and production deployment must not be authorized until those are verified.

The existing `api/checkout-stats.js` was updated to use this helper for `checkout-click` events, `checkout-fallback` leads and `enterprise-inquiry` contacts. The three source reads share one captured `cutoffUtc` and each contributes its own private `read_consistency.source_evidence` receipt. The previous count, offer, geography, stated intent and inquiry-category calculations are unchanged. No change was made to `api/checkout.js` writes, source permission scopes, the original 24-file baseline, or the eight previously proposed exceptions.

### 3. Adversarial tests and actual CI
New `tests/bounded-keyset-consistency.test.mjs` implements 16 fully synthetic test groups. Coverage includes:
- True empty source, multi-page ordered reads, unique cursor and UTC receipt.
- A new insertion behind the cursor between page requests, showing the source stream avoids a moving offset but **does not** prove a complete transaction snapshot.
- Exclusion of after-cutoff rows and explicit rejection if the backend returns one despite the filter.
- Duplicate and out-of-order row identity, malformed ID/type, incorrect timestamp timezone, bad URL/query/filter, invalid cutoff and page size.
- First or later HTTP error, malformed JSON, excessive page response, microsecond timestamp equality and ordering, and the refusal to claim atomic snapshot assurance.
- The real owner-checkout handler under a fabricated signed cookie and mocked storage, verifying the three-family receipts share one cutoff and return true zero only on complete empty reads.

All outward database requests were mocked. No participant identity, original case record, real financial contact, authorized research sample or service credential was read or modified.

At pre-document code commit `a85d907979dab940afab352bc49ebb37d0da18ea` both required GitHub workflows passed:
- Full-site integration, [run 41234170343](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41234170343): SUCCESS, new keyset tests 16/16, inherited 15-case completeness and historical geography/asset checks passed.
- Public-interest source continuity, [run 41234170499](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41234170499): SUCCESS, new keyset tests 16/16 and inherited immutable source-lineage checks passed.

The final report commit must be independently verified on its exact head. This report records developer-controlled test results, not a direct production query acceptance.

### 4. External syntax basis and significant limits
The `order`, `gt`, `eq`, `lte` and nested `or=(...,and(...))` query design follows the documented PostgREST table filtering grammar. Refer to the PostgREST Tables and Views reference: https://docs.postgrest.org/en/stable/references/api/tables_views.html . This grammar reference is external to the project's own evidence ledger. **A validated grammar is not proof that this project's current Supabase schema and permissions accept the proposed query.**

A common UTC cutoff and advancing keyset constrain the read population but **do not** provide transactional isolation across separate HTTP requests. Rows deleted or amended while pages are read, late-arriving backdated inserts, or records whose `created_at` is updated can still produce omitted or inconsistent source populations. This design detects a defined subset of duplicate and ordering failures but **cannot detect all omissions**. Neither source reconciliation nor a transactionally consistent snapshot was demonstrated.

A deployed application must also validate the storage schema's `id` type, `created_at` timezone and precision, unique/order index, exact source-to-output counts and HTTP query behavior before calling a private metric operationally reconstructable. If those assumptions fail, the new source reader fails closed rather than making up a number.

### 5. Acceptance criteria and continuing program controls
**P0, G0/PST-04:** Record the exact cumulative candidate SHA, complete main-to-head change inventory, no unexpected original 24-file change and all eight still-proposed exceptions. The 24-file source baseline is not rebased or rewritten.

**P0, G1 and G2:** Owner rotates/configures the Preview-only secret in a private Vercel setting, obtains a new exact-SHA Preview when normal deployment capacity permits, and tests anonymous refusal and real authorized cookie access for all 22 private routes. Independently test anonymous Supabase RLS, schema/order/index requirements and fixed-cutoff reconciliation of all original 11 source families. Make no real database edits.

**P0, reader acceptance:** On a read-only test population, demonstrate that the three checkout queries return the expected rows and receipts, including two records sharing a timestamp with distinct IDs, several pages, test/source exclusions and correct unknown-versus-zero handling. Compare an authoritative fixed-cutoff count to each source receipt. If historic source writes can be backdated or modified, classify the resulting limits before using metrics as acquisition evidence.

**P0, G3/G4:** Complete actual mobile Safari, public-resource/download, inquiry delivery, logout-session behavior and rollback. Production release still requires signed owner approval against an exact built SHA, not a test-count claim.

**Separate independent program boundaries:** The original Decision Spellchecker DS-A source remains `NO_GO_NOT_VERIFIED`, SP-01 through SP-18 are not independently accepted, original H2/H3 comparative effectiveness is `NOT_ESTABLISHED`, and commercial conveyance of the R6 inventory remains `NOT_AUTHORIZED` (0/32).

### 6. Controlling disposition
- **Increment 22 keyset source and owner-checkout integration:** Implemented in draft, source and synthetic CI verified at pre-document head.
- **Stable ordered, cutoff-bounded reads:** Developer-tested for an opt-in three-source owner analytics stream only.
- **True transaction snapshot, live schema and authoritative historical count:** NOT_ESTABLISHED.
- **Production website:** HOLD. No merge, production build, authentication secret rotation or live DB read.
- **Original private Decision Spellchecker, independent study, and transfer rights:** Remain separately blocked.

Preserve this record with the master program. It is not a replacement for the historical source material or independent operational validation.
