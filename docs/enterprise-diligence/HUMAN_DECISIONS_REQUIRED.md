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

## D-10 · Restricted surfaces load Google Fonts — **NEW, OPEN**

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

## D-11 · `review-engine.html` contradicts the new disclosure — **NEW, OPEN, NOT EDITED**

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

## D-8 · Credential rotation — **OWNER ACTING EXTERNALLY**

**QUESTION.** Has the exposed Vercel token been rotated?
**EVIDENCE.** It appeared in conversation twice. The old token was not tested, reproduced or recovered. **No repository evidence can establish rotation**, so this cannot be closed from here.
**APPROVAL REQUIRED.** Confirm rotation. Until then B-001 stays HUMAN ACTION REQUIRED.

## D-9 · Deployment — **CONDITIONALLY AUTHORIZED; CONDITIONS NOT MET**

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
| **D-8** | Rotation | Confirm when done, so B-001 closes and B-006 unblocks |
| **D-9** | Deployment | Becomes actionable only after D-8 |

**Nothing above was resolved by inference.**
