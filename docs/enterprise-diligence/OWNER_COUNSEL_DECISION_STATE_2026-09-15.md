# Owner / Counsel Decision State — 2026-09-15

**One table. Everything outstanding, who owns it, and whether engineering can touch it.**

**Control classes:** ENG (engineering-completable) · OWNER · COUNSEL · PROD-VERIFY ·
EXT-VERIFY (evidence lives outside the repository) · INTENTIONALLY UNRESOLVED.

---

| ID | Matter | Current fact | Decision required | Authority | Eng can resolve? | Evidence | Status | Next action |
|---|---|---|---|---|---|---|---|---|
| **B-001** | Exposed Vercel token | **FACT:** pasted into conversation twice 2026-09-14. Never run, tested or stored. **0 token-shaped strings on disk** | Rotate externally, then confirm | **EXT-VERIFY** | **NO.** No repository evidence can observe Vercel | Checklist prepared | **OPEN / OWNER ACTION** | Rotate, then one-line confirmation |
| **B-006** | 13 Sep silent deployment skip | **NOT ESTABLISHED.** Failure mode prevented (`ignoreCommand: exit 1`) and detected (byte-compare workflow) | Run the diagnostic, then interpret | OWNER then ENG | **NO.** Needs the rotated credential | Procedure + 4 outcomes written; **not executed** | **BLOCKED** | Execute after B-001 |
| **B-004** | Rights / chain of title | **FACT: no Level A executed instrument exists anywhere in the corpus.** Structured consents are silent on commercial use | Whether rights support commercial exploitation | **COUNSEL** | **NO** | Consent records, contributor matrix | **OPEN / COUNSEL** | Send the rights package |
| **B-007 / D-1** | Published OpenAPI vs implementation | **FACT:** three breaking differences at record level; condition payload agrees exactly. Published, Commercial licence, linked from a buyer surface | Which of four options | **COUNSEL** then OWNER | **NO.** Editing a published licensed doc | Reconciliation package | **COUNSEL REVIEW REQUIRED** | Send to counsel |
| **B-013A** | `engine_reviews` anon SELECT | **FACT: 0 rows.** Both writing routes token-gated (401). Free public route writes nothing | A, B, C or D | **OWNER** | **NO.** Production grant | Decision analysis + form | **OPEN / OWNER ACTION** | Choose an option |
| **B-013B** | `bench_outcomes` anon SELECT | **FACT:** 54 rows, contributor record text, 0 email/SSN hits. **NOT ESTABLISHED: what contributors were told** | Confirm the factual basis first | **OWNER** | **NO.** Not a code question | Aggregates only | **OPEN / OWNER ACTION** | Answer the factual question |
| **B-013C** | `interaction_events` anon SELECT | **FACT:** 2,280 rows of paths, country, truncated UA. **No visitor email stored** (the hit was a crawler contact string) | Accept, restrict, shorten, aggregate | **OWNER** | **NO** | Decision form | **OPEN / OWNER ACTION** | Choose an option |
| **D-2** | `cold_reviewer_clarity` | **INSUFFICIENTLY ESTABLISHED.** Codebook calls Evidentiary Sufficiency the aggregate; engine treats this key as one of five peers | Aggregate or distinct dimension | **OWNER** | **NO.** Methodology | Memo; enforced in code | **INTENTIONALLY UNRESOLVED** | Declare, or leave open |
| **D-3** | Codebook ↔ API correspondence | **FACT:** 5 Codebook conditions, 5 engine keys, **exactly one name in both**. 3 of 5 UNRESOLVED | Declare the intended mapping | **OWNER** | **NO** | `METHODOLOGY_TO_API_MAPPING.md` | **OPEN / OWNER ACTION** | Declare the four non-exact pairs |
| **D-10** | Google Fonts on restricted surfaces | **FACT:** all three restricted surfaces load Fonts; IP disclosed on load regardless of analytics choice | Accept, or self-host | **OWNER** | Self-hosting is ENG **but not authorized** | Disclosed on `privacy.html` | **DISPOSITIONED: accept and disclose** | None. Hardening deferred |
| **D-11** | Engine disclosure | **FACT:** record text goes to Anthropic; model-written notes and a 600-char rewrite are stored | none — corrected | ENG done | **YES, done** | Corrected in candidate | **REMEDIATED — PROD NOT TESTED** | Deploy, then verify |
| **D-12** | `verify-drift` | **FACT:** no A record, no implementation. `index.html` sends the visitor's note **only** there and shows a confirmation anyway | Which of four dispositions | **OWNER** | **NO.** Changes a live data destination | Full dependency trace | **OPEN / OWNER ACTION** | Choose a disposition |
| **D-13** | "transmits nothing" | **FACT:** `check.html` loads GA4 and Fonts and beacons a view to Supabase | none — corrected | ENG done | **YES, done** | Aligned to `check.html`'s own wording | **REMEDIATED — PROD NOT TESTED** | Deploy, then verify |
| **D-14** | Sensitive-identifier screen | **FACT:** screen now runs ahead of **both** destinations. 12/12 browser cases; dismissal yields 0 POSTs | none — corrected | ENG done | **YES, done** | Test report | **REMEDIATED, DEV VERIFIED — PROD NOT TESTED** | Deploy, then verify |
| **D-15** | Security representation | **FACT:** `security.html` never named Anthropic while telling reviewers every statement was checkable | none — corrected | ENG done | **YES, done** | Four corrections | **REMEDIATED — PROD NOT TESTED** | Deploy, then verify |
| **D-16** | Gumroad | **FACT:** no Gumroad URL anywhere; **every `checkout_url` empty**; `/api/checkout` refuses to redirect | none — corrected | ENG done | **YES, done** | Stale prose corrected, no provider named | **REMEDIATED — PROD NOT TESTED** | Deploy, then verify |
| **D-17** | "No sub-processors were engaged" | **FACT:** historically accurate for the closed engagements | none — scoped | ENG done | **YES, done** | Temporal scope added; history intact | **REMEDIATED — PROD NOT TESTED** | Deploy, then verify |
| **D-18** | STUDY-001 figures | **FACT:** 61 runs, 66.7–93.3, mean 85.3, final 91.1. **All five published figures stale; none is the final run** | Which presentation | **OWNER** | **NO.** Research representation | Surface-by-surface audit | **OPEN / OWNER ACTION** | Choose a presentation |
| **PROD-VERIFY** | Every remediation | **FACT:** production serves `0d94ce6`, which predates all of it | none | **PROD-VERIFY** | **NO** | Verification matrix | **NOT TESTED** | Follows authorized deployment |
| **DEPLOY-AUTH** | Production authorization | **FACT:** none exists | Authorize, or not | **OWNER** | **NO** | — | **NOT AUTHORIZED** | Owner decision, after the above |

## Counts

| Class | Count |
|---|---|
| **OWNER ACTION** | **8** — B-001, B-013A/B/C, D-3, D-12, D-18, deployment authorization |
| **COUNSEL** | **2** — B-004, B-007/D-1 |
| **ENGINEERING-COMPLETABLE, and completed** | **7** — D-11, D-13, D-14, D-15, D-16, D-17, D-10 disclosure |
| **ENGINEERING-COMPLETABLE, remaining** | **0** |
| **PRODUCTION VERIFICATION** | All of the above seven |
| **INTENTIONALLY UNRESOLVED** | **1** — D-2 |

**The engineering column is empty.** Nothing outstanding can be resolved by writing code. That
is the finding of this cycle: **the repository is no longer waiting on engineering.**
