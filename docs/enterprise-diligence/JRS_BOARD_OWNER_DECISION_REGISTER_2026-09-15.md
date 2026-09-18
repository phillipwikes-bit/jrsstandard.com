# JRS Board / Owner Decision Register — 2026-09-15

> **HISTORICAL EXECUTION RECORD — STAMPED 2026-09-18.**
> This is evidence of work performed on its date. **It is not current-state authority.**
> An execution report saying a blocker is open does not make it open; `.jrs/state/BLOCKERS.json`
> is the authoritative registry (CLAUDE.md §15) and controls where the two disagree.
> **Nothing under this heading is retained as a statement of what is true now**, and nothing
> is deleted: an execution record's value is that it shows what was believed when it was
> written.

**Control layer only.** This register does not replace the five authoritative registers and
must not be treated as an authoritative asset, evidence, version, research or commercial
rights record. It references them.

**Deployment state: PRODUCTION DEPLOYMENT IS NOT AUTHORIZED.**

**Status vocabulary:** OPEN · REMEDIATED · VERIFIED · OWNER ACTION REQUIRED · COUNSEL REVIEW
REQUIRED · DEPLOYMENT READY · DEPLOYMENT AUTHORIZED · DEPLOYED · CLOSED · INTENTIONALLY
UNRESOLVED. **REMEDIATED is not VERIFIED, and neither is CLOSED.**

---

## Directive conflict recorded rather than resolved

The governing directive lists `docs/enterprise-diligence/BLOCKERS.json` among the files to
read. **That file does not exist**, and an earlier owner instruction expressly prohibited
creating it; §7 of the current directive also forbids competing authoritative registers.
The authoritative blocker registry is **`.jrs/state/BLOCKERS.json`**. No second registry was
created. **OWNER ACTION: confirm which path is intended.**

---

## D-10 · Google Fonts on restricted surfaces

| | |
|---|---|
| **Authority** | Owner |
| **Issue** | All three restricted surfaces load Google Fonts, so a visitor to a confidential buyer page discloses their IP to Google on load. Analytics was deliberately removed from the owner page; the font request was never considered |
| **Decision** | ACCEPT AND DISCLOSE FOR NOW. Self-hosting not authorised |
| **Evidence** | FACT. Each of the three references `fonts.googleapis.com` and `fonts.gstatic.com`; each has zero `gtag(` |
| **Engineering action** | Disclosed on `privacy.html`. Restricted-surface architecture untouched |
| **Counsel dependency** | Significance of visitor-IP transmission: **COUNSEL DETERMINATION**, not asserted |
| **Status** | **REMEDIATED (disclosure) — NOT DEPLOYED.** Hardening deferred |

## D-11 · Review Engine disclosure

| | |
|---|---|
| **Issue** | "the record never leaves your control" and "no data-residency obligation transfers to us" |
| **Evidence** | FACT. Record text is POSTed to `api.anthropic.com`. FACT. `logReview()` persists model-written notes and a `compliant_version` rewrite |
| **Engineering action** | Corrected on `review-engine.html`; the block appeared on five further pages and was corrected on all |
| **Status** | **REMEDIATED — NOT VERIFIED, NOT DEPLOYED** |

## D-12 · Canonical backend drift

| | |
|---|---|
| **Issue** | `api.jrsstandard.com/v1/verify-drift` is the canonical backend endpoint in CLAUDE.md 36.1 |
| **Evidence** | FACT. **No A record; the request fails.** FACT. Implemented nowhere in this repository. FACT. `pilot.html` and `training.html` write to Supabase **before** calling it, so their data survives. FACT. **`index.html` does not**, so the visitor's free-text observation note reaches no one, while the page shows a confirmation |
| **Classification** | **ATTEMPTED / UNREACHABLE** |
| **Not done** | Endpoint not created. Reference not deleted |
| **Status** | **OWNER ACTION REQUIRED.** Obsolete, missing, or future architecture is **NOT ESTABLISHED** |

## D-13 · "transmits nothing"

| | |
|---|---|
| **Evidence** | FACT. `check.html` loads GA4 and Google Fonts and beacons a view to Supabase |
| **Engineering action** | `terms.html` and `engagement.html` aligned to `check.html`'s own accurate wording, which was already correct |
| **Status** | **REMEDIATED — NOT VERIFIED, NOT DEPLOYED** |

## D-14 · Sensitive-identifier screen

| | |
|---|---|
| **Evidence** | FACT. The Formspree `message` field reached **both** Supabase and Formspree with no screen, while `privacy.html` §2 promised one |
| **Engineering action** | `jrsSanitizeCheck` now runs **ahead of both destinations**. No new algorithm was invented |
| **Tests** | 12 Playwright cases against the real submission path. Email, phone, SSN, card and two-at-once each prompt with the correct label; **on dismissal zero POSTs leave the page**; clean text reaches both |
| **Status** | **REMEDIATED AND TESTED — NOT DEPLOYED** |

## D-15 · Security representation

| | |
|---|---|
| **Evidence** | FACT. `engine_reviews` exists. FACT. `security.html` never named Anthropic while telling reviewers every statement on it was checkable against the engine source |
| **Engineering action** | Four corrections; Anthropic now named |
| **Counsel dependency** | Data-residency statements removed, not reworded. **COUNSEL DETERMINATION** before any republication |
| **Status** | **REMEDIATED — NOT VERIFIED, NOT DEPLOYED** |

## D-16 · Gumroad

| | |
|---|---|
| **Evidence** | FACT. No Gumroad URL anywhere. FACT. **Every `checkout_url` is empty** and `/api/checkout` refuses to redirect, so no payment path exists at all |
| **Engineering action** | Stale prose corrected on two pages. **No replacement provider named**, because none is evidenced |
| **Status** | **REMEDIATED — NOT DEPLOYED** |

## D-17 · Historical sub-processor language

| | |
|---|---|
| **Decision** | Preserve as history, narrow the scope |
| **Engineering action** | Scoped to the closed engagements, with a pointer to the privacy policy for the website. History not rewritten |
| **Status** | **REMEDIATED — NOT DEPLOYED** |

## D-18 · STUDY-001 figure

| | |
|---|---|
| **Evidence** | FACT, from `findings_history`: 61 runs, 12 June to 21 August 2026, range **66.7% to 93.3%**, mean **85.3%**, **final run 91.1%**, k=3, 15 records. FACT: 86.7% occurred in 6 runs, 84% in 4. **Neither published figure is the final run** |
| **Not done** | No figure changed. The final-run value is the **most flattering** of 61 and raising a headline metric on one run is the thing the evidence rules exist to prevent |
| **Recommendation** | Publish the distribution with n and dates, not a single run |
| **Status** | **OWNER ACTION REQUIRED** |

## D-19 · `engine_reviews` and database read exposure

| | |
|---|---|
| **Evidence** | FACT, from the live catalog. RLS enabled on all 21 public tables. **`pilot_contacts`, 59 rows of names, emails and messages, has INSERT policies only and no SELECT policy, so it is NOT anonymously readable.** Anonymously readable with `qual = true`: `interaction_events` (**2,280 rows**), `bench_outcomes` (**54 rows**, avg 570 chars of record text), `engine_reviews` (**0 rows**) |
| **Corrected alarm** | An initial scan suggested visitor emails were exposed. **It was one crawler contact address inside a `user_agent` string**, 18 occurrences on one day. **No visitor email is stored.** `bench_outcomes` shows 0 email and 0 SSN hits |
| **Not done** | **No grant altered.** Changing a grant is a production operation |
| **Status** | **OWNER ACTION REQUIRED (blocker B-013)** |

---

## Counsel matters, open

| ID | Question |
|---|---|
| **D-1 / B-007** | The published licensed `openapi.json` differs from the deployed implementation. **Not modified.** External reliance is **NOT ESTABLISHED** and is not asserted |
| **D-6 / B-004** | Rights and chain of title. **No Level A executed instrument exists anywhere in the corpus**, and the structured consents are silent on commercial use |
| **D-15 / D-11** | Data-residency statements |

## Owner actions, open

| ID | Action |
|---|---|
| **B-001** | Rotate the exposed credential externally, then confirm. Repository evidence cannot establish it. Blocks B-006 and B-005 deployment |
| **D-12** | Decide the fate of `verify-drift` |
| **D-18** | Decide the STUDY-001 presentation |
| **D-19** | Decide the database read posture |
| **D-10** | Self-hosting, deferred |

---

# CYCLE 2 — 2026-09-15 · NEXT AUTHORIZED ACTION added to every entry

**Control layer only.** Engineering recommendations below are **not** Board decisions.

## D-1 / B-007 · Published API contract

**FACT.** `openapi.json` (v1.0.0, **Commercial licence**) declares `routing` and `conditions`
as **required at the top level**. `api/v1/review-engine.js` contains **zero** occurrences of
`routing`, nests conditions at `result.conditions`, and emits `determination` with a different
vocabulary and different case. Three breaking differences; the condition-level payload agrees
exactly. Published at `/openapi.json`, linked from a **confidential buyer surface**.
**ENGINEERING RECOMMENDATION:** D (dual emission) then C (versioning). **Not a decision.**
**COUNSEL DETERMINATION:** any edit to `openapi.json`.
**OWNER ACTION:** choose the option; and for A or D, declare the routing mapping, because
`Needs work` appears nowhere in the Codebook and emitting it would put a **fourth** vocabulary
into production.
**UNRESOLVED:** whether any external party relied on the published contract. **NOT ESTABLISHED
and not asserted.**
**NEXT AUTHORIZED ACTION:** send `API_CONTRACT_RECONCILIATION_2026-09-15.md` to counsel. **No
code or contract change.**

## D-2 · `cold_reviewer_clarity`
**STATUS: INTENTIONALLY UNRESOLVED.** Unchanged.
**NEXT AUTHORIZED ACTION:** none. Owner input only.

## D-3 · Codebook / API correspondence
**ENGINEERING ACTION, done:** `CODEBOOK_API_CORRESPONDENCE_CONTROL.md` records four
vocabularies, preserves EXACT / SEMANTIC / UNRESOLVED unchanged, and forbids representing the
engine keys as a restatement of the Codebook.
**NEXT AUTHORIZED ACTION:** owner declares the four non-exact pairs.

## Manifest specification and schema
**ENGINEERING ACTION, done:** spec v1.0 and a JSON Schema validated with a conforming
specimen and **10 negative cases, all rejected**, including a smuggled raw record and a
`legally_sufficient` field. Guarded; **6 mutations fail correctly.**
**FACT:** the current engine **cannot** produce a conforming manifest. It has no input hash,
no JRS or Codebook version, no integrity block. The additions are mechanical, not
methodological.
**Deliberately not implemented.** Generation should not be built before the §5.5 vocabulary is
owner-declared, or the generator must guess on every call.
**NEXT AUTHORIZED ACTION:** owner reviews the spec. **No engine change.**

## D-14 · Sensitive-identifier screen
**ENGINEERING ACTION, done and tested.** Screen runs ahead of **both** destinations. 12/12
browser cases; **dismissal produces 0 POSTs**.
**STATUS: REMEDIATED AND TESTED — NOT VERIFIED IN PRODUCTION.**
**NEXT AUTHORIZED ACTION:** deployment, which is blocked by B-001.

## D-19 / B-013 · Decomposed as directed
**B-013A — `engine_reviews`.** Anon SELECT `qual = true`; **0 rows**. Latent, not realised.
Cheapest fix: revoke the SELECT policy and serve `engine-activity.html` from a server route.
**B-013B — `bench_outcomes`.** 54 rows, avg 570 chars of contributor record text, anon-readable.
**0 email and 0 SSN hits. Not labelled a breach.** Whether the research protocol contemplated
world-readable raw records is **NOT ESTABLISHED**.
**B-013C — `interaction_events`.** 2,280 rows, anon-readable: paths, country, truncated
user-agent. **Behavioural metadata, not record content and not identities.**
**A false alarm of mine is recorded:** an email pattern in download rows was a **crawler
contact address inside a user_agent string**, one address, 18 occurrences, one day.
**No grant was altered.**
**NEXT AUTHORIZED ACTION:** owner decides. B-013 does **not** close on one component.

## D-18 · STUDY-001
**FACT:** 61 runs, range 66.7–93.3, mean 85.3, final run 91.1. **Neither published figure is
the final run.**
**Not implemented**, because 91.1 is the most flattering of 61 and raising a headline metric
is what the evidence rules exist to prevent.
**NEXT AUTHORIZED ACTION:** owner chooses the presentation. Correcting the present-tense
"Active" wording needs no figure and may proceed on instruction.

## Registers
**Version & Release Register and Commercial Rights Register were NOT reconciled this cycle.**
Recorded rather than glossed.
**NEXT AUTHORIZED ACTION:** reconcile both.

---

# CYCLE 3 — 2026-09-15 · MANIFEST EVIDENCE LAYER

## Manifest generator, validator and portability

**AUTHORITY:** engineering, within STATE 1 development remediation.
**ISSUE:** the Manifest existed as a specification with no artifact, so its claims could not be
interrogated.
**ENGINEERING ACTION:** `lib/manifest/` (canonicalize, hash, build), `tools/validate-manifest.js`,
`tests/manifest/` with 6 fixtures. **39 checks, 0 failed.**
**EVIDENCE:** portability demonstrated by copying the validator, the schema and six manifests
into an empty directory and running with `env -i` and `fetch`, `XMLHttpRequest`, `WebSocket`
and `EventSource` replaced by throwing getters. All six behaved as expected.
**FACT:** the three refusals are enforced in code, not documented as intentions. Relabelling
engine keys as Codebook conditions throws; routing vocabularies are never translated;
`content_class` is derived from what is present and cannot be asserted by a caller.
**UNRESOLVED UNCERTAINTY:** whether `lib/`, `tools/` and `tests/` are excluded from the
deployable set is **not verified**. Recorded as an open item for deployment time.
**OWNER DEPENDENCY:** none for the artifact. Deployment and route integration are owner-gated.
**COUNSEL DEPENDENCY:** none.
**AFFECTED REGISTER:** Version & Release (new artifacts), Commercial Rights (see below).
**STATUS: REMEDIATED (development) — NOT VERIFIED IN PRODUCTION — NOT DEPLOYED.**
**NEXT AUTHORIZED ACTION:** owner reviews the specification and the portability report. **No
route change, no deployment.**

## Commercial Rights Register entry

**The Manifest is recorded as COMMERCIAL CANDIDATE, not COMMERCIALIZED.** No licence exists.
No market evidence exists. A technical artifact does not create a commercial right.
**STATUS: OPEN.**

## Two defects in my own work this cycle

**FACT:** the offline validator rejected every valid manifest on first run, because the schema
used `minLength` and the validator failed closed. **Fixed in the validator, not the schema.**
**FACT:** the schema omitted `source_hash` and did not require `codebook_version`. Both fixed.
**Neither is hidden**, and the first is recorded in the tool's own header.

## What did NOT happen, recorded because absence is the claim

`openapi.json` unmodified · `api/v1/review-engine.js` unmodified · no production grant changed
· no credential rotated · no dependency added · no blocker CLOSED · no owner or counsel item
resolved · Gate 1 not rerun · Phase II locked.
**NEXT AUTHORIZED ACTION overall:** owner action on B-001, then B-013; counsel on B-007 and B-004.

---

# CYCLE 4 — 2026-09-15 · DEPLOYMENT SURFACE AND MANIFEST HARDENING

## PMRT-1 · Implementation directories were publicly servable

**AUTHORITY:** engineering, STATE 1.
**ISSUE:** `lib/`, `tools/`, `tests/` and `schemas/` appeared nowhere in `.vercelignore` and
would have been served as static files on the next deployment.
**EVIDENCE (FACT):** `/openapi.json` and `/openapi-review-engine.json` return **200** on
production; `/scripts/check_zero_drift.py` returns 307 and `/.jrs/state/BLOCKERS.json` returns
404. A non-excluded static file **is** served. **Nothing was deployed to establish this.**
**ENGINEERING ACTION:** four exclusion rules added; guard with five mutations.
**STATUS: REMEDIATED (configuration) — REQUIRES DEPLOYMENT VERIFICATION.** The 404 that would
prove effect cannot exist before a deployment, and is not claimed.
**NEXT AUTHORIZED ACTION:** verify at deployment time. No deployment to test it.

## PMRT-2 · The review package re-opened PMRT-1

**FACT:** assembling `docs/manifest-independent-review/` **copied** the validator and the
schema into `docs/`, outside every rule then in force, minutes after the rules were added.
**ENGINEERING ACTION:** package excluded; **guard extended to detect protected filenames
appearing anywhere outside the exclusion set**, so the exclusion cannot be defeated by a copy.
**STATUS: REMEDIATED.**
**UNRESOLVED UNCERTAINTY:** none for this path. The general lesson is recorded: a path-based
exclusion protects a path, not a file.

## PMRT-3 · A relabelled canonicalization passed validation

**FACT:** setting `integrity.canonicalization` to `JCS/RFC8785` caused the integrity check to
be skipped while the manifest still validated. **A compliance claim passed because it could
not be verified.**
**ENGINEERING ACTION:** fail closed. Unverifiable is not valid.
**STATUS: REMEDIATED.**

## Independent Review Package

**ENGINEERING ACTION:** `docs/manifest-independent-review/package/` with schema, validator,
example manifest, synthetic source, README and expected results.
**EVIDENCE:** cold-reviewer test run with `env -i` and no network. All thirteen §13 questions
answerable; **source correspondence independently ESTABLISHED** by recomputing the hash.
**Deliberately NOT called** a certification, validation, compliance or legal-defensibility
package.
**STATUS: REMEDIATED (development) — NOT PUBLISHED.**
**OWNER ACTION:** decide whether to publish the schema and the package. **Removing the
`schemas/` exclusion IS the act of publishing** and should be a recorded decision.

## Registers

Master Asset and Version & Release: **update required**, recorded in the workstream record.
Commercial Rights: Manifest recorded **COMMERCIAL CANDIDATE**.
**NO AUTHORITATIVE REGISTER UPDATE REQUIRED** for Evidence & Chain-of-Title (no title evidence
changed) or Research Evidence (no research figure, record or snapshot touched).

## Not converted

**"Implemented" was not converted to "verified."** **"Drafted" was not converted to
"approved."** **"Development pass" was not converted to "production verified."**
No blocker moved to CLOSED. No owner or counsel matter was resolved.

---

# CYCLE 5 — 2026-09-15 · PRE-DEPLOYMENT EVIDENCE AND DECISION CONTROL

**Manifest functional scope FROZEN.** No Manifest capability was added this cycle. The work was
boundaries and decision packages.

## Duplication guard hardened

**FACT:** the guard as written caught **1 of 9** evasion routes. A rename, a changed extension,
a nested copy under a new directory and a copied fixture all passed.
**ENGINEERING ACTION:** content-signature matching across five implementation files plus
generated manifests. **10 of 10 routes now caught.**
**FACT, recorded because it is the second occurrence:** my own scratch-copy test harness
reverted the guard under test with `git checkout -- .`, producing eight false passes. **The
harness was wrong, not the guard.**
**STATUS: REMEDIATED.**

## Outbound destination inventory

**ENGINEERING ACTION:** `.jrs/registries/OUTBOUND_DESTINATIONS.json`, 21 destinations
classified by traced execution path; fail-closed guard; 5 mutations.
**FACT preserved:** OpenAI and Google Generative Language are **CLOSED_RESEARCH**, not ACTIVE.
A live cron and a present credential are not evidence of an active processor.
**STATUS: REMEDIATED.**

## Owner decision packages — PREPARED, NOT DECIDED

**B-001:** external credential checklist. **Preparing a checklist is not rotation.** Status
unchanged: OPEN / OWNER ACTION REQUIRED.
**B-013:** decomposed package for A, B and C with aggregates and options.
**B-013A is the one that is free to fix now**, because `engine_reviews` holds 0 rows; that is
an ENGINEERING RECOMMENDATION and requires a production grant change, which is not authorized.
**B-013B turns on what contributors were told, which the owner knows and the repository does
not.** Status unchanged: OWNER ACTION REQUIRED.

## Deliberately not built

**No automated prohibited-term guard.** A substring check cannot distinguish an assertion from
a negation; mine flagged `0.1.0-validation` and *"not established as validated"*. **This is the
second such false positive**, after `legally defensible` inside a disclaimer.
**BOARD POSITION: false-positive governance is worse than none.** It stays a human-review scan.

## Deployment

**DEPLOYMENT NOT READY.** Four prerequisites unmet; B-001 alone is dispositive.
**No production change occurred.** The diff is labelled a **DEVELOPMENT CANDIDATE DIFF**.

## Not converted

No blocker CLOSED · no owner action completed · no counsel question answered · no development
test elevated to production verification · no recommendation recorded as a decision.
