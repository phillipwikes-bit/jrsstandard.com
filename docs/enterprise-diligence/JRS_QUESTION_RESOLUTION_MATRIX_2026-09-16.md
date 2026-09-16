# JRS Question Resolution Matrix — 2026-09-16

**Live matrix. Resolved questions are retained, not erased.**

## Second-order questions

| ID | Question | Status |
|---|---|---|
| S-1 | Was de-identification review performed on all 54 `bench_outcomes` rows? | **OWNER FACTUAL CONFIRMATION REQUIRED** |
| S-2 | Ship B-013A revocation and replacement together? | ANSWERED — BOARD DECISION |
| S-3 | Does the first retention run delete anything? | ANSWERED — FACT ESTABLISHED (no) |
| S-4 | Does declaring three mappings pressure the fourth? | ANSWERED — BOARD DECISION |
| S-5 | CLAUDE.md retains an endpoint nothing calls | ANSWERED — BOARD DECISION (preserved intent) |
| S-6 | Did anyone receive the superseded figure? | **OWNER FACTUAL CONFIRMATION REQUIRED** |
| S-7 | Does a partial screen create a worse expectation? | ANSWERED — BOARD DECISION |
| S-8 | Inventory RETIRED vs CLAUDE.md canonical | ANSWERED — BOARD DECISION |
| S-9 | Does BD-01's downgrade survive a "no review" answer? | CONDITIONAL on S-1 |
| T-1 | Service-role concentration in the activity route | ANSWERED — BOARD DECISION |
| T-2 | Volume enumeration | ANSWERED — BOARD DECISION (accept; rate limit deferred) |
| T-3 | Is `overall_consistency` record-derived? | ANSWERED — FACT ESTABLISHED (no) |
| **T-4** | **`engine_reviews` retention** | **ANSWERED — BOARD DECISION (BD-10) → IMPLEMENTED → TESTED** |
| T-5 | Do research tables have no retention rule forever? | ANSWERED — BOARD DECISION (by design) |
| T-6 | Could the corrected distribution read as a decline? | **OWNER FACTUAL CONFIRMATION REQUIRED** (narrows S-6) |
| T-7 | Could the mapping document become relied upon? | OPEN, LOW; folds into B-007 if published |
| T-8 | Page depends on an undeployed route | ANSWERED — BOARD DECISION (ship together) |
| T-9 | Does anything still display `compliant_version`? | ANSWERED — FACT ESTABLISHED (nothing) |
| T-10 | Does an unexecuted policy imply retention is in force? | ANSWERED — BOARD DECISION (mitigated in the module) |
| **T-11** | **Data-room export returned the derived fields** | **ANSWERED — BOARD DECISION (BD-11) → IMPLEMENTED → TESTED** |
| U-1, U-2, U-4 to U-10 | Round C | ANSWERED — BOARD DECISION / FACT |
| **U-3** | **Should the 90-day period be disclosed publicly?** | **ANSWERED — BOARD DECISION (BD-12) → IMPLEMENTED → TESTED.** Production verification required |
| V-1, V-2, V-3, V-5, V-6, V-7, V-8, V-10 | Round D | ANSWERED — BOARD DECISION / FACT ESTABLISHED |
| **V-4** | Does a stated period imply deletion on request? | **OPEN — LOW.** Legal-adjacent; joins B-004's channel if raised |
| **V-9** | Is a retention disclosure a commercial representation? | **OPEN — LOW.** Counsel if a licence is drafted |

## Blockers

| ID | Status |
|---|---|
| B-001, B-006 | **OWNER EXTERNAL ACTION REQUIRED** |
| B-004, B-007/D-1 | **COUNSEL REVIEW REQUIRED** |
| B-013A revocation | BOARD DECIDED; **PRODUCTION VERIFICATION REQUIRED** |
| B-013B residual | **OWNER FACTUAL CONFIRMATION REQUIRED** |
| B-013C, BD-10, BD-11 | BOARD DECIDED → IMPLEMENTED → TESTED |
| B-005, B-008, B-009, B-014, B-015, D-11, D-13, D-14, D-15, D-16, D-17 | **PRODUCTION VERIFICATION REQUIRED** |
| D-2 | **INTENTIONALLY UNRESOLVED** |
| D-3, D-10, D-12, D-18 | BOARD DECIDED |
| B-010, B-011, B-012 | CLOSED |

**Production verified: none.**

---

## Round E and Round F additions, 2026-09-16

Prior rows above are retained unchanged. Resolved questions stay in the matrix.

| ID | Question | Status |
|---|---|---|
| **V-4** | Does a stated 90-day window create an expectation of deletion on request inside it? | **ANSWERED — BOARD DECISION** as to fact and architecture: `engine_reviews` holds no personal information and the disclosure sits in §5, not §6, so §7 is untouched. **No change made.** One sentence escalated: `request_id` is returned to the caller — **COUNSEL REVIEW REQUIRED**, LOW, joins B-004 |
| **V-9** | Is a published retention statement a commercial representation to a future licensee? | **ANSWERED — BOARD DECISION.** No licensee and no licence draft exists; a data-handling statement with no counterparty is not a representation. Filed as a drafting obligation against any future licence. **CLOSED** |
| **V-10** | Production serves the old text with no period | ANSWERED — FACT. Closes on deployment, which waits on B-001 |
| **V-11** | The two 401 branches return different detail strings, disclosing provisioning state | **OPEN — LOW. Deliberately not remediated.** Merging them removes a real operator signal |
| **B-016** | The published API contract denies a write path the code contains | **OPEN — HIGH — BLOCKED ON AUTHORIZATION.** No edit made to `openapi.json` |
| **W-1** | Is the enforced retention period the same number as the disclosed one? | **ANSWERED — FACT ESTABLISHED, and it was NOT.** Three calendar months is 89 to 92 days against a published 90. **BD-13 DECIDED → IMPLEMENTED → TESTED.** PRODUCTION VERIFICATION REQUIRED |
| **W-2** | Do both public read paths over `engine_reviews` enforce the same projection boundary? | **ANSWERED — FACT ESTABLISHED, and they did NOT.** `research-data.html` was checked only for `select=*` and was exempted from the column check by naming BD-11 in its own comment. **CLOSED** — both paths now allow-listed, four mutations fail |
| **W-3** | Does BD-10's expiry erase the record-derived text everywhere? | **ANSWERED — FACT. No.** A Manifest built with `includeNotes` carries the same text in the customer's hands with no JRS expiry. The BD-12 disclosure remains accurate because it describes what **JRS** keeps. **No change** |
| **W-4** | Is the Manifest authenticated? | **ANSWERED — FACT. No.** `integrity` is a hash plus a canonicalization id. No signing key, no authentication mechanism. It does not establish who produced it, does not prove accuracy and does not establish legal sufficiency |
| **W-5** | Are the schema files and Supabase function source still served on production? | **ANSWERED — FACT. YES, live now**: `/supabase-engine-reviews-setup.sql`, `/supabase-setup.sql` and `/supabase/functions/run-study/index.ts` all return 200. This is **B-014**, remediated in `.vercelignore` on the development branch; `origin/main` predates the fix. Closes on deployment |

**Production verified: still none.**

## Round G — autonomous execution cycle, 2026-09-16

| ID | Question | Status |
|---|---|---|
| **V-11** | The two 401 branches disclose provisioning state | **ANSWERED — BOARD DECISION (BD-15).** Merged. IMPLEMENTED → TESTED. PRODUCTION VERIFICATION REQUIRED |
| **W-6** | Do any guards agree with themselves rather than with reality? | **ANSWERED — FACT. THREE DID.** (1) `check_manifest_library_holds_its_refusals` passed a fresh "RFC 8785 compliant" claim because the disclaimer elsewhere in the file satisfied a page-wide test — third proximity miss. (2) `check_record_derived_fields_have_no_export_path` still carried the dead BD-11/BD-02 suppressor beside the new allow-list. (3) **W3, new**: `ENGINE_TRUNCATION_LIMIT = 8000` in `lib/manifest/hash.js` and the bare `8000` in both engine routes were three independent declarations with nothing tying them. **All three closed** |
| **W-7** | If the engine and manifest truncation caps diverge, what breaks? | **ANSWERED — FACT.** The manifest would record `truncated: false` and omit `source_hash` for a record the engine had truncated, **asserting the evaluation covered text the model never received** — the exact failure `hash.js` says its design prevents. New guard reads the cap from the slice expression in both routes. Three mutations fail |
| **W-8** | Why is the cap duplicated rather than imported? | **ANSWERED — FACT, and the duplication is correct.** The engine routes are Edge Functions and `lib/` is excluded by `.vercelignore` because the manifest implementation must not be deployable. Importing would undo that boundary. **Duplication plus a guard is the right trade**; recorded so it is not later "tidied" into an import |
| **B-017** | A privacy promise contradicted by an anon SELECT grant | **BOARD DECIDED (BD-14) → IMPLEMENTED → TESTED in the repository. GRANT NOT REVOKED — PRODUCTION VERIFICATION REQUIRED** |
| **X-1** | `interaction_events.payload` is a jsonb exported with `select=*`; "no free text is collected" is enforced only by the client code that builds the payload | **OPEN — LOW.** Consistent with what respondents were told, so **not** folded into B-017. The gap is that the promise has no schema-level or guard-level enforcement. Queued |
| **X-2** | Is the live row count of `finding_responses` known? | **NOT ESTABLISHED.** A production read was attempted and **correctly denied** by the environment's production-read control. **PRODUCTION VERIFICATION REQUIRED**; deliberately not inferred |

**Production verified: still none.**

| ID | Question | Status |
|---|---|---|
| **D-3** | Codebook / API correspondence | **NO NEW EVIDENCE — PRIOR DISPOSITION STANDS.** The classification at `METHODOLOGY_TO_API_MAPPING.md:87-91` is complete: one EXACT, three SEMANTIC / INFERRED — DECLARED, `cold_reviewer_clarity` UNRESOLVED. **Not reopened.** Verified against `ENGINE_CONDITION_KEYS`: the five keys match exactly |
| **W-9** | Does anything tie the authoritative mapping to the code it maps? | **ANSWERED — FACT. NOTHING DID.** No guard referenced the mapping document, `ENGINE_CONDITION_KEYS` or `cold_reviewer_clarity`. A sixth engine key, a rename or a deletion would have left the document the operating instructions call authoritative silently wrong, with nothing failing. **CLOSED** — new guard asserts set equality against the code, holds `cold_reviewer_clarity` at UNRESOLVED so it cannot be quietly canonicalized, and refuses any EXACT row other than `basis_identification`. Four mutations fail |
| **D-2** | Whether `cold_reviewer_clarity` is the aggregate condition or a distinct fifth dimension | **INTENTIONALLY UNRESOLVED — unchanged, and now enforced.** The guard fails if the classification moves off UNRESOLVED, so the term cannot be canonicalized by reasoning about what it probably means |
