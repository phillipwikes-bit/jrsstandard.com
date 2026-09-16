# Final Evidence Reconciliation — 2026-09-16

## A. Current authoritative state

| | |
|---|---|
| Deployment | **NOT AUTHORIZED** · **DEPLOYMENT NOT READY** |
| Gate 1 | **NOT READY FOR RECONSIDERATION.** Not rerun |
| Phase II | **LOCKED** |
| Production | `0d94ce6`, unchanged. **B-014's two exposures are live on it until a deployment occurs** |
| Blockers | 14. B-010/011/012 RESOLVED; the rest open, blocked, prepared or owner/counsel |
| Owner | **8 matters** |
| Counsel | **2 matters** |
| Guards | **offline 131/0/2 · online 135/0/1**, both always reported with mode |

## B. Superseded or corrected findings

| Original finding (mine) | Correction | Evidence | Status |
|---|---|---|---|
| D-12: "the visitor's note reaches nobody" | **FALSE.** `index.html:5600` writes to `interaction_events` before the call | Source | Corrected; **no data loss**. Disposition D-12.1 **WITHDRAWN, NOT DELETED** |
| "Zero literals remain outside `_model.js`" | **FALSE as written.** Two live in `supabase/functions/run-study/index.ts` | grep | **B-005 not remediated as described.** Scope reconciled below |
| "Zero token-shaped strings on disk" | **FALSE as a blanket claim.** The publishable key ships in 17 files by design | Secrets guard docstring | Narrowed to "no credential-shaped additions in the audited diff" |
| "Protected implementation excluded — CONFIRMED" | **FALSE.** Ten `.sql` files and `supabase/` were servable | **Production: 200** | Corrected; **B-014** opened |
| Guard figure "135" stated without mode | Incomplete, and then **over-corrected by me to 131 before verifying** | Both modes run | Both figures always stated with mode |
| Guard PASS "no record text reaches logReview" | **FALSE.** Derived text does reach it | `api/review-engine.js:48,147` | **F-7 guard rewritten, bidirectional** |
| `security.html` "cannot quote verbatim" | **Unsupported.** Zero verbatim checks exist | Full path traced | **F-9 corrected to behaviour** |
| `privacy.html` §2 screen promise | **Broader than execution.** 7 of 17 textarea pages invoke it zero times | Coverage matrix | **F-8 promise narrowed** |

## C. Current open findings

| ID | Finding | Type | Evidence | Authority | Eng | Owner | Counsel | Prod verify | Status |
|---|---|---|---|---|---|---|---|---|---|
| B-001 | Exposed credential | Security | Conversation | **EXT** | no | **yes** | no | no | **OPEN** |
| B-004 | No Level A rights instrument | Rights | Corpus | **COUNSEL** | no | no | **yes** | no | **OPEN** |
| B-006 | Silent skip root cause | Ops | — | Owner/Eng | no | **yes** | no | no | **BLOCKED** |
| B-007/D-1 | Published contract vs implementation | API | Three breaking diffs | **COUNSEL** | no | no | **yes** | no | **OPEN** |
| B-013A | `engine_reviews` anon read | Security | 0 rows; token-gated writers | **OWNER** | no | **yes** | no | **yes** | **OPEN** |
| B-013B | `bench_outcomes` anon read | Privacy | 54 rows; intent NOT ESTABLISHED | **OWNER** | no | **yes** | maybe | **yes** | **OPEN** |
| B-013C | Telemetry anon read | Privacy | 2,280 rows, metadata | **OWNER** | no | **yes** | no | **yes** | **OPEN** |
| **B-014** | `.sql` + `supabase/` publicly served | Security | **Production 200** | Eng+Owner | **done** | deploy | no | **yes** | **REMEDIATED IN CONFIG** |
| D-3 | Codebook↔API mapping | Methodology | 1 of 5 exact | **OWNER** | no | **yes** | no | no | **OPEN** |
| D-12 | `verify-drift` drift | Architecture | No DNS, no impl | **OWNER** | no | **yes** | no | no | **OPEN** |
| D-18 | STUDY-001 figures | Research | 5 stale figures | **OWNER** | no | **yes** | no | no | **OPEN** |
| D-2 | `cold_reviewer_clarity` | Methodology | Aggregate vs peer | **OWNER** | no | optional | no | no | **INTENTIONALLY UNRESOLVED** |

## D. New red-team findings F-7 to F-14

| # | Finding | Disposition |
|---|---|---|
| **F-7** | Guard PASS message stated a false proposition | **REMEDIATED.** Assertion matches predicate; bidirectional; 4 mutations |
| **F-8** | Screen promise broader than coverage (7 of 17 pages at zero) | **REMEDIATED (promise narrowed).** Widening = **OWNER DECISION** |
| **F-9** | Unsupported "cannot quote verbatim" | **REMEDIATED.** Replaced with behaviour; no filter built |
| **F-10** | **Env-var bypass permitting unauthenticated persistence** | **REMEDIATED IN CODE.** 18/18 matrix; pre-fix fails the decisive row |
| **F-11** | `.htm` buyer surface invisible to every HTML guard | **REMEDIATED.** `_html_files()` covers `.htm`; file verified isolated |
| **F-12** | D-10 status contradiction | **RECORDED, NOT RESOLVED.** `CONTRADICTION_002.md` |
| **F-13** | Fixtures self-generated; generator regression undetectable | **REMEDIATED.** Frozen oracle; comparison proven able to fail |
| **F-14** | Pilot screen fails open; 3 of 4 fields unscreened | **MAPPED, NOT CHANGED.** **OWNER DECISION** |

## E. Contradictions

**CONTRADICTION_002 — OPEN.** `BLOCKERS.json` records the restricted-surface Fonts decision as
open; the Board register records D-10 as decided; my own reconstruction filed it under
"engineering completed", **converting an owner action into engineering closure**. All three
records preserved. **Neither was edited to match the other.**

`CONTRADICTION_001` (condition vocabularies) remains open and unchanged.

## F. Required decisions

**OWNER (8):** B-001 · B-013A · B-013B · B-013C · D-3 · D-12 · D-18 · deployment authorization.
**Plus, arising from F-8/F-14:** widen the screen or leave coverage as-is; screen the pilot
`name`/`email`/`organization`; fail closed or keep failing open.

**COUNSEL (2):** B-004 rights · B-007/D-1 published contract.

## G. Next authorized action

**Rotate the Vercel credential externally and confirm in one line.**

It gates ten remediations, unblocks B-006, and **now also gates B-014**, whose two exposures
remain live on the production build until a deployment occurs.
