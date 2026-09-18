# Human Decisions Required

**Date:** 2026-09-14 · **Revised:** 2026-09-15.

**DECIDED 2026-09-15 and closed here:** D-2, D-3 (in part), D-4 (in principle), D-5 (approach), D-7, D-8 (owner will act), D-9 (conditional). **Still open below.** Only decisions genuinely requiring Phillip Wikes's authority. **None resolved by inference.**

---

## D-1 · API reconciliation (B-007 / B-002) — **NOW A COUNSEL QUESTION**

**UPDATE 2026-09-15.** The gating factual question is answered. **`openapi.json` is PUBLISHED**: HTTP 200 at `/openapi.json` and `/openapi`, linked from `security.html`, `review-engine.html` and both confidential buyer surfaces. Per your own instruction this is **COUNSEL REVIEW REQUIRED BEFORE CONTRACT MODIFICATION**.

Whether a *named party* relied on it is **NOT ESTABLISHED** and was not guessed.

**This strengthens rather than changes the engineering recommendation:** Option D modifies the published licensed document not at all; Option B now edits a published licensed document.

**QUESTION.** Which reconciliation option for `/api/v1/review-engine`?
**EVIDENCE.** `openapi.json` (1.0.0, **Commercial licence**) requires top-level `routing` and `conditions`; the deployed code emits **zero** occurrences of `routing` and nests conditions under `result`. A **second** spec, `openapi-review-engine.json` (0.1.0-validation, no licence), **does** match the code.
**OPTIONS.** A change code · B change contract · C versioned contracts · D dual emission with deprecation.
**RECOMMENDATION.** D, then C. Engineering recommendation only.
**RISK.** A breaks consumers; B amends a licensed document; C concedes 1.0.0 is unimplemented; D enlarges the payload.
**CONSEQUENCE OF NOT DECIDING.** A licensee integrating from the licensed document fails on the first response.
**APPROVAL REQUIRED.** Name the option. **Also state whether `openapi.json` has been supplied to any external party**, which would move this to counsel.

## D-2 · `cold_reviewer_clarity` — **DECIDED: INSUFFICIENTLY ESTABLISHED**

**QUESTION.** Aggregate condition, distinct dimension, or insufficiently established?
**EVIDENCE.** The Codebook calls Evidentiary Sufficiency "the aggregate condition", and the engine key names a cold reviewer, which is close wording. **But** `deriveDetermination()` treats all five keys as flat peers, and an aggregate computed as a peer of its own constituents is a design contradiction.
**RECOMMENDATION.** None. Deciding would invent substantive JRS content.
**CONSEQUENCE.** Benchmark results in engine keys cannot be restated in Codebook language without an undocumented assumption.

## D-3 · Correspondence — **RULE DECIDED, ASSIGNMENTS STILL OPEN**

**QUESTION.** Which engine key corresponds to Decision-Process Traceability, and confirm Reconstructability and Chronology?
**EVIDENCE.** One pair EXACT, two SEMANTIC, one UNRESOLVED. Asked first in `METHODOLOGY_TO_API_MAPPING.md`.
**APPROVAL REQUIRED.** Declare the correspondence, or state the two sets are deliberately distinct constructs.

## D-4 · Subprocessor disclosure — **CONTENT DRAFTED 2026-09-15; PUBLICATION OPEN**

**UPDATE 2026-09-15.** The disclosure is written into `privacy.html` and is **not deployed**.
Decisions 1 and 3 are satisfied in draft: every active processor is named, and the nightly
cross-vendor providers (OpenAI, Google Generative Language) are named as research-only with
the no-personal-data statement kept bounded to source review. Decision 2 is **partially**
satisfied: Google Fonts is disclosed; self-hosting was not authorised and was not performed.
**Publication itself still requires approval (Section 23).**

## D-10 · Restricted surfaces load Google Fonts — ~~**NEW, OPEN**~~ **DECIDED (BD-05); NOT AN OPEN OWNER QUESTION**

> **BOARD DECIDED 2026-09-16 (BD-05): accept and disclose. Do not self-host. Do not alter the
> access architecture.** Verified 2026-09-18: `fonts.googleapis` is still loaded by
> `acquisition-9f3c2a7d4b.html` and `programme-status-9872fb93cc94.html`, and **that is the
> decided outcome, not an outstanding item.** `vp-7c1f9a4e8d2b6035.htm` loads none.
> Self-hosting remains **deferred hardening** and must not be done without separate
> authorization (CLAUDE.md §36.3).

**QUESTION.** All three restricted surfaces (`programme-status-9872fb93cc94.html`,
`acquisition-9f3c2a7d4b.html`, `vp-7c1f9a4e8d2b6035.html`) load Google Fonts, so a visitor
to a confidential buyer surface discloses their IP address to Google on page load. Analytics
was deliberately removed from the owner page; the font request was never considered. What, if
anything, should be done?
**EVIDENCE.** Each of the three references `fonts.googleapis.com` and `fonts.gstatic.com`;
each has zero `gtag(` and zero `googletagmanager` references.
**OPTIONS.** Accept and record · self-host the fonts for those three pages only · self-host
site-wide · remove the webfont from those pages.
**WHAT IS NOT DETERMINED HERE.** What this means under any privacy regime. That is a legal
question (Rule 8) and is not answered in the repository.
**APPROVAL REQUIRED.** Self-hosting is an engineering change and is not authorised. The
access architecture of these surfaces was not touched (Section 36.3).

## D-11 · `review-engine.html` contradicts the new disclosure — ~~**NEW, OPEN, NOT EDITED**~~ **REMEDIATED, VERIFIED 2026-09-18**

> **The sentence is gone.** `"never leaves your control"` returns **0 occurrences** in
> `review-engine.html`. The question below is retained because it records why the sentence
> could not stand; it is **no longer a decision awaiting the owner**.

**QUESTION.** `review-engine.html` line 334 states: *"The call is stateless. Nothing in
`text` is retained, stored, or used for training, so the record never leaves your control
and no data-residency obligation transfers to us."* Should this sentence stand?

**EVIDENCE.**
- The **retention** half is supported. `api/review.js` contains no database write, so the
  new privacy disclosure and this sentence agree that the text is not stored.
- The clause **"the record never leaves your control"** is not supported. The text is
  transmitted to Vercel and to Anthropic. The new `privacy.html` section says so plainly.
- **"no data-residency obligation transfers to us"** is a legal conclusion about
  contractual and regulatory allocation.
- The page **already contradicts itself four paragraphs later**: *"Use a record you are
  comfortable sending to a third-party model."*

**WHY THIS WAS NOT FIXED HERE.** Two reasons, both binding. It is a commercial and legal
representation, so Rule 8 puts it outside what may be decided in the repository. And STEP 6
instructed that unrelated public language not be modified; the correct scope of a rewrite
here is the owner's call, not a side effect of a privacy edit.

**OPTIONS.** Narrow the sentence to the retention claim it can support · remove the
data-residency clause and refer to counsel · leave it and accept the contradiction on record.

**APPROVAL REQUIRED.** Yes. No change was made to `review-engine.html` under B-009.

## D-12 to D-17 · Found by the red team on 2026-09-15 — ~~**ALL OPEN, NONE FIXED**~~ **THREE FIXED, THREE OPEN**

> **VERIFIED AGAINST THE CODE 2026-09-18, NOT AGAINST THIS PAGE'S OWN HEADING.**
> "ALL OPEN, NONE FIXED" was true when written and has not been true for two days. Three of
> these six were remediated in later cycles and this page kept asking for them anyway.
>
> | # | Verified state | Evidence in the working tree |
> |---|---|---|
> | **D-12** | **REMEDIATED** | BD-06, 2026-09-16 removed the `verify-drift` call. **Zero pages POST to it**; `index.html` line 5605 records the removal |
> | **D-13** | **REMEDIATED** | `"transmits nothing"` returns **0 occurrences** in `terms.html` and `engagement.html` |
> | **D-14** | **REMEDIATED** | `pilot.html` line 816 calls `jrsSanitizeCheck(msgVal)` before the Formspree submit. **This was the one with a safety edge** |
> | **D-15** | **OPEN** | `security.html` still carries *"not written to any table"* — 1 occurrence |
> | **D-16** | **OPEN** | **Gumroad** still named 15 times each in `jrsstandard.html` and `index.html`, with no Gumroad URL in the estate |
> | **D-17** | **OPEN** | `terms.html` still carries *"No sub-processors were engaged"* |
>
> **An owner queue that asks for work already done is how a queue stops being read.** The three
> open rows are unchanged and are not softened by the three that closed.

Each of these is a live statement or a live data flow that the B-009 pass surfaced and
deliberately did not change. Full evidence is in `SUBPROCESSOR_DISCLOSURE_REVIEW.md`,
addendum 2.

| # | Finding | Why it was not fixed here |
|---|---|---|
| **D-12** | `api.jrsstandard.com/v1/verify-drift` is the canonical backend endpoint in CLAUDE.md 36.1, is implemented nowhere in this repository, and **does not resolve**. Three pages POST visitor free text to it; the request fails and the `.catch()` returns the data to the visitor as a download. | Whether the endpoint is meant to exist is an owner question, not a repository fact |
| **D-13** | `terms.html` and `engagement.html` say the free record check **"transmits nothing"**. It beacons to `/api/telemetry`, which writes a Supabase row with country and user-agent, and the page loads GA4 and Google Fonts. | Correcting a published representation on two pages outside the authorised scope |
| **D-14** | `privacy.html` section 2 promises free-text fields pass a sensitive-identifier screen. The Formspree `message` field on `pilot.html` is submitted **without** `jrsSanitizeCheck`. Also a CLAUDE.md 36.6 breach. | Two possible fixes, and which one is right is the owner's call: run the screen on that form, or narrow the promise |
| **D-15** | `security.html` says record text "is not written to any table" and "there is no record store to breach". The versioned engine route stores model-written per-condition notes and a rewritten passage of up to 600 characters. | A security representation with commercial weight |
| **D-16** | **Gumroad** is named to readers as handling payment on `jrsstandard.html` and `index.html`. No Gumroad URL exists in the estate. | Either stale prose or an intended path; not established |
| **D-17** | `terms.html` says "No sub-processors were engaged", scoped to pre-September engagements, opposite a privacy page naming eight. | Past-tense and scoped, so not a strict contradiction, but a diligence reader will collide with it |

~~**D-14 is the one with a safety edge**, because it is a promise about sensitive
identifiers that does not run where a visitor types free text.~~ **CLOSED 2026-09-18:** the
screen now runs on that form. **The safety edge is gone because the fix was made, not because
the finding was wrong.**

## D-18 · STUDY-001 figure — **RESOLVED FROM EVIDENCE 2026-09-15; PRESENTATION OPEN**

**UPDATE.** Read from `findings_history`: **61 runs**, 12 June to 21 August 2026, agreement
**66.7% to 93.3%**, mean **85.3%**, **final run 91.1%**, k=3 models, 15 records. **Neither
published figure is the final run**: 86.7% occurred in 6 runs, 84% in 4. Both are real
history, neither is current. `study_runs` independently confirms the last run as 2026-08-21.

**No figure was changed.** The final-run value is the most flattering of the 61, and raising a
published research metric by seven points on the authority of one run is precisely what the
evidence rules exist to prevent. Full analysis and the recommended distribution-based wording:
`STUDY_001_FIGURE_RESOLUTION.md`. **OWNER ACTION REQUIRED.**

## D-18 (original entry, preserved) · Stale research presentation — **OPEN, DELIBERATELY NOT EDITED**

**QUESTION.** The nightly cross-vendor run closed on 21 August 2026. Six surfaces still
describe it in the present tense, and the headline figure is published as two different
numbers.

**EVIDENCE.** Present tense after closure: `research.html` (latest run dated 9 August yet
"recomputed every night"; Study 001 badged **Active**), `research-data.html`, `pilot.html`,
`reviewer/index.html`, `programme-status-9872fb93cc94.html`. Conflicting figure, both
labelled latest: **86.7%** on `research.html` and `reviewer/index.html`; **84%** on
`pilot.html`, `results.html` and the buyer surface `acquisition-9f3c2a7d4b.html`, which
carries it undated. `bench-review.html` and `submit-validation.html` do carry proper
closure banners, so the site knows how to do this.

**WHY NOT EDITED.** These are research figures. The directive forbids altering research
evidence, and picking between 86.7% and 84% requires querying the study data, not
choosing. Writing either number without that query would be fabricating a result.

**WHAT WOULD RESOLVE IT.** One query against the study tables for the final run: one
figure, one date, propagated, plus a dated closure banner on Study 001.

**AUTHORITY.** Owner. **May work proceed without it?** Yes for everything else; no for any
buyer-facing representation of reproducibility.

## D-19 · `engine_reviews` is readable with the public key — **OPEN (blocker B-013)**

**QUESTION.** Anon `SELECT` is granted on `engine_reviews`. Should it be?

**EVIDENCE.** Probed 2026-09-15, count only, no row content: **HTTP 200**, not 401, so the
grant exists. **`content-range: */0`: the table holds zero rows**, so nothing is exposed
today. `engine-activity.html` reads `conditions` and `finding` from the browser with the
publishable key, and that key ships in 22 pages, so the unlinked `noindex` page is not the
protection. On the first paid engine call the table would hold a per-condition note the
prompt requires to be grounded in the record text, and a model rewrite of the passage up
to 600 characters.

**STATED IN BOTH DIRECTIONS.** It is **not** true that customer records are exposed today.
It is **not** true that there is no store. The exposure is latent and one call away.

**WHY NOT FIXED.** Changing a database grant is a production operation and is not
authorised. No grant was changed and no row content was fetched.

**OPTIONS.** Revoke anon `SELECT` and serve `engine-activity.html` from a server route ·
stop writing record-derived free text · narrow the public claims to match.

**AUTHORITY.** Owner.

## D-4 (original entry, preserved) · Subprocessor disclosure — **APPROVED IN PRINCIPLE; CONTENT SIGN-OFF OPEN**

**QUESTION.** Approve publishing a subprocessor disclosure, and its content?
**EVIDENCE.** **Seven active processors**, not the four recorded. `privacy.html` names only Google Analytics. **Google Fonts discloses visitor IP on load regardless of analytics consent, across 53 pages, and is undisclosed.**
**OPTIONS.** Publish a full list · publish partially · self-host fonts to remove that disclosure · accept the gap.
**RISK OF NOT DECIDING.** An undisclosed processor receiving visitor IP is the kind of gap a diligence reviewer finds first.
**APPROVAL REQUIRED.** Publishing changes a privacy representation (Section 23). Self-hosting is a separate engineering authorisation.

## D-5 · Validation statement — **APPROACH DECIDED; INSERTION OPEN**

**QUESTION.** Should it carry the unvalidated declaration the other two engines carry?
**EVIDENCE.** Zero occurrences of "unvalidated" in any case; its prompt says *"Do not add legal disclaimers inside the JSON, keep it operational."* It backs `index.html`, `training.html` and `review-engine.html`.
**RECOMMENDATION.** None: this changes an external representation.
**CONSEQUENCE.** The engine on the highest-traffic pages makes no self-limiting statement.

## D-6 · Rights and chain of title (B-004)

**QUESTION.** Counsel's determination of the rights position.
**EVIDENCE.** **No Level A evidence exists anywhere.** Strongest is Level B structured consent, 33 people, scoped to study publications with successor transfer, **silent** on commercial use.
**APPROVAL REQUIRED.** Legal review. Rule 8 forbids me determining title.

## D-7 · Buyer surfaces — **DECIDED: BOTH CONFIDENTIAL BUYER**

**QUESTION.** Classify each: PUBLIC / PRIVATE OWNER / CONFIDENTIAL BUYER / OTHER.
**SURFACE A.** `acquisition-9f3c2a7d4b.html` — acquisition and licensing prospectus, ~20 KB, titled Confidential, deployed, `noindex,nofollow`, absent from `sitemap.xml`, slug-only access.
**SURFACE B.** `vp-7c1f9a4e8d2b6035.html` — second buyer-facing page, same posture.
**EVIDENCE.** Both are enumerated by `programme-status-9872fb93cc94.html` itself. CLAUDE.md 36.3 calls programme-status "the only private owner page" and draws no owner/buyer distinction.
**APPROVAL REQUIRED.** **CLAUDE.md 36.3 was deliberately not modified** pending your classification.

## D-8 · Credential rotation — ~~**OWNER ACTING EXTERNALLY**~~ **OWNER-CONFIRMED 2026-09-18**

> **RESOLVED. The owner confirmed the external rotation on 2026-09-18 (E-030).** The record
> below is preserved as the state before that confirmation. **Do not ask for this again.**
> No repository-side proof exists or can exist, and none is required: an attestation is the
> evidence class an external control-plane action admits. **This is not deployment
> authorization.**

**QUESTION.** Has the exposed Vercel token been rotated?
**EVIDENCE.** It appeared in conversation twice. The old token was not tested, reproduced or recovered. **No repository evidence can establish rotation**, so this cannot be closed from here.
~~**APPROVAL REQUIRED.** Confirm rotation. Until then B-001 stays HUMAN ACTION REQUIRED.~~
**CONFIRMED 2026-09-18 (E-030). B-001 is OWNER-CONFIRMED / EXTERNAL ACTION COMPLETED.**

## D-9 · Deployment — **CONDITIONALLY AUTHORIZED; CONDITIONS NOT MET**

> **VOCABULARY SUPERSEDED 2026-09-17. This heading is preserved as history and is
> NOT current state.** The production state machine has exactly four rungs —
> DEVELOPMENT REMEDIATION → DEPLOYMENT READY → DEPLOYMENT AUTHORIZED → DEPLOYED —
> and **there is no "conditional" rung between them.** A deployment is authorized
> or it is not.
>
> The record below already carries its own negation ("CONDITIONS NOT MET") and the
> condition named is B-001, which was open when that heading was written and is
> **OWNER-CONFIRMED as of 2026-09-18**. It is left exactly as written
> because a heading edited to look cleaner destroys the evidence that the project
> once used a state that does not exist. **Current state: DEVELOPMENT REMEDIATION,
> DEPLOYMENT NOT AUTHORIZED.**

**QUESTION.** Authorise deploying the B-005 model configuration to production?
**EVIDENCE.** Behaviour-preserving by construction: with no override the value is byte-identical to the prior literal. Verified locally; **not deployed**.
**RISK.** Low. Reversible in one commit.
**APPROVAL REQUIRED.** No production deployment was performed.


---

# Still requiring your action

| # | Item | What is needed |
|---|---|---|
| **D-1** | API reconciliation | **Counsel review** before any contract modification, then name the option |
| **D-3** | The three non-exact correspondences | Which engine key corresponds to Decision-Process Traceability |
| **D-4** | Disclosure content | Sign off the published wording. Publication is a Section 23 act |
| **D-5** | Validation statement | Approve inserting the prepared wording into `training.html` and deploying it |
| **D-6** | Rights | Submit the evidence package to IP counsel |
| **D-8** | Rotation | ~~Confirm when done~~ **DONE 2026-09-18 (E-030). B-001 closed; B-006 is now DIAGNOSTIC READY and needs one command in the owner's own shell** |
| **D-9** | Deployment | Becomes actionable only after D-8 |

**Nothing above was resolved by inference.**
