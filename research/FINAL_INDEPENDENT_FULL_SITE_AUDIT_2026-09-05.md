# FINAL INDEPENDENT FULL-SITE AUDIT

**Audited system:** `https://www.jrsstandard.com/` — the complete live public architecture
**Audit date:** 2026-09-05
**Type:** read-only verification. No file was edited, no commit created, nothing pushed, merged or deployed.
**Scope:** every publicly reachable page discovered from all available sources, not only the pages named in prior reports.

---

## LIVE ACCESS TEST

1. **Accessed:** YES
2. **HTTP status:** 200
3. **Redirects:** 0 — final URL `https://www.jrsstandard.com/`, 651,309 bytes
4. **Title:** `JRS™ Justification Review Standard | Safeguarding the Defensibility of Consequential Decisions`
5. **H1:** `Can this record still explain the decision it documents?`
6. **Additional live content, retrieved directly:** `Free, ungated, and staying that way.`

**State before the audit:** `git status --porcelain` **0 entries** · HEAD `2484f02b0de970858a66719b74ac23e39e12c76b` · `origin/main` `122434f29905b45bbf321d72b157c13db7565c67`

---

## AUDITED URL INVENTORY

**92 URLs discovered.** Sources: live `sitemap.xml` (45 entries), live homepage navigation and footer link extraction (18), public HTML in the repository at `origin/main` (74), and the mandated minimum set (29). Deduplicated to **75 distinct pages** after collapsing each `reference/X/` against its `index.html`.

**All 75 retrieved. All HTTP 200. All byte-identical to `origin/main` by `cmp`.**

| # | URL | Status | Grade | Primary Finding |
|---|---|---|---|---|
| 1 | `/` + `/index.html` | REVIEWED | **C+** | **"Optional implementation support available upon request" — live founder-service offer, F-1** |
| 2 | `/jrsstandard.html` | REVIEWED | **C** | **Same offer, plus the uncorrected "Discussions are limited to workflow adaptation" twin — F-1 / F-2** |
| 3 | `/enterprise.html` | REVIEWED | A | Hierarchy present ×2; all regression strings 0; pathways intact |
| 4 | `/review-engine.html` | REVIEWED | A | Hierarchy present ×2; API, OpenAPI, sandbox intact |
| 5 | `/training.html` | REVIEWED | A- | Terminology correct; one prevalence assertion |
| 6 | `/pilot.html` | REVIEWED | A | Study closed 4 Sep 2026, provisional ×2, all figures intact |
| 7 | `/research.html` | REVIEWED | A | Closure ×2, provisional ×2, interim ×4 |
| 8 | `/terms.html` | REVIEWED | A | `noindex,follow`, sitemap 0, archival, reachable |
| 9 | `/engagement.html` | REVIEWED | A- | `noindex,nofollow`, sitemap 0, 0 inbound |
| 10 | `/audit-request.html` | REVIEWED | A- | `noindex,follow`, past tense, archival meta |
| 11 | `/governance-request.html` | REVIEWED | A- | Same |
| 12 | `/calibration-request.html` | REVIEWED | A- | Same |
| 13 | `/security.html` | REVIEWED | A | Scoping CTA gone |
| 14 | `/org-pilot.html` | REVIEWED | A | Free, self-serve, stage-disclosed |
| 15 | `/operational-boundaries.html` | REVIEWED | B+ | Two prevalence assertions |
| 16 | `/workflow-fit.html` | REVIEWED | B+ | One prevalence assertion |
| 17 | `/implementation-scenarios.html` | REVIEWED | B+ | One prevalence assertion |
| 18 | `/ai-governance-record.html` | REVIEWED | B+ | One prevalence assertion |
| 19 | `/about.html` | REVIEWED | A- | Founder as creator, not consultant |
| 20 | `/methodology.html` | REVIEWED | B+ | No Engine distinction, but never names the Engine |
| 21 | `/research-summary.html` | REVIEWED | A- | Interim labelled |
| 22 | `/results.html` | REVIEWED | B+ | Interim labelled |
| 23 | `/finding.html` | REVIEWED | B+ | No issue in scope |
| 24 | `/evidence-ledger.html` | REVIEWED | A- | No issue found |
| 25 | `/datasets.html` | REVIEWED | A- | No issue found |
| 26 | `/codebook.html` | REVIEWED | A- | No issue found |
| 27 | `/questions.html` | REVIEWED | A- | No issue found |
| 28 | `/decision-reconstruction-risk.html` | REVIEWED | A- | No issue found |
| 29 | `/why-good-decisions-fail.html` | REVIEWED | A- | No issue found |
| 30 | `/investigator-guides.html` | REVIEWED | A | Free, ungated |
| 31 | `/simulations.html` | REVIEWED | A | Free, ungated |
| 32 | `/check.html` | REVIEWED | A- | Free tool |
| 33 | `/privacy.html` | REVIEWED | A- | No issue found |
| 34 | `/404.html` | REVIEWED | A | Serves correctly, 7,893 B |
| 35 | `/reference/` | REVIEWED | A | Free reference index |
| 36–51 | `/reference/{16 sub-pages}` | REVIEWED | A each | Free reference articles, uniform, no issue found |
| 52 | `/reviewer/` → `/reviewer/index.html` | REVIEWED | B+ | 1 redirect; title uses "Certificate", not "Certification" |
| 53 | `/reviewer/completion.html` | REVIEWED | B+ | `noindex` |
| 54 | `/reviewer/evaluation.html` | REVIEWED | B+ | `noindex` |
| 55 | `/supported.html` | REVIEWED | **C** | **"Become a certified reviewer" — positive credential claim, F-3.** `noindex`, 0 inbound |
| 56 | `/access.html` | REVIEWED | B+ | `noindex`, campaign screen |
| 57 | `/contributor.html` | REVIEWED | B+ | `noindex,nofollow` |
| 58 | `/honor.html` | REVIEWED | B+ | `noindex` |
| 59 | `/coauthor.html` | REVIEWED | B+ | `noindex,nofollow` |
| 60 | `/recheck.html` | REVIEWED | B+ | `noindex, nofollow` — space in the value, cosmetic |
| 61 | `/submit-record.html` | REVIEWED | B+ | `noindex,nofollow` |
| 62 | `/submit-validation.html` | REVIEWED | B+ | `noindex,nofollow` |
| 63 | `/review-status.html` | REVIEWED | B+ | `noindex,nofollow` |
| 64 | `/engine-activity.html` | REVIEWED | B+ | `noindex,nofollow` |
| 65 | `/research-data.html` | REVIEWED | B+ | `noindex,nofollow` |
| 66 | `/bench-review.html` | REVIEWED | B+ | `noindex,nofollow`, study surface |
| 67 | `/bench-results.html` | REVIEWED | B+ | `noindex,nofollow` |
| 68 | `/bench-admin.html` | REVIEWED | B+ | `noindex,nofollow`, token-gated admin |
| 69 | `/ai-records-pilot.html` | REVIEWED | B+ | `noindex,nofollow` |
| 70 | `/ai-records-arm-b.html` | REVIEWED | B+ | `noindex,nofollow` |
| 71 | `/people.html` | REVIEWED | B+ | `noindex,nofollow`, 7,312 B |
| 72 | `/acquisition-9f3c2a7d4b.html` | REVIEWED | B | `noindex,nofollow`, opaque slug, 0 public inbound. Internal sale framing, F-5 |
| 73 | `/vp-7c1f9a4e8d2b6035.html` | REVIEWED | B+ | `noindex,nofollow`, opaque slug |
| 74 | `/programme-status-9872fb93cc94.html` | REVIEWED — existence and access controls only; **contents not disclosed** | — | `noindex,nofollow`, not in sitemap, 0 public inbound |
| 75 | `/sitemap.xml`, `/robots.txt` | REVIEWED | A | 45 entries; `Allow: /`, sitemap declared |

**No page was marked NOT REVIEWED.** Every URL listed was retrieved and its saved response body searched from the file.

---

## FINDINGS

### F-1 — HIGH — a live founder-service offer on the homepage and the standard page

**URLs:** `https://www.jrsstandard.com/` and `https://www.jrsstandard.com/jrsstandard.html`. Both carry **no robots meta** — fully indexable — and **both are in the sitemap**.

**Exact live wording, identical on both pages:**

> "Downloadable PDF · Gumroad delivery · **Optional implementation support available upon request**"

Adjacent on the same block: `Request Pilot Participation →`.

**Classification:** active public founder-service pathway.

This is an offer of founder-delivered implementation support, sitting on the two most discoverable documents on the site. Every remediation pass missed it because none of the tested strings matched it: the searches targeted `scoping call`, `Scope it`, `fixed-price`, `collaborative implementation`, `managed deployment`, `live-record onboarding` and `founder-led`. **This is the fourth occasion on which a claim scoped to a string list has been reported in language that reads as a claim about the site.**

### F-2 — HIGH — the uncorrected twin sentence on `/jrsstandard.html`

**Exact live wording:**

> "Organizations evaluating phased implementation approaches may request additional operational information. **Discussions are limited to workflow adaptation, reviewer onboarding, and implementation questions** related to existing documentation-review environments."

This is the exact sentence corrected on `index.html` on 2026-09-04 and asserted absent there. It survives here, indexed and sitemapped.

`jrsstandard.html` also still carries `appear routinely`, `not unusual` ×2, and `most records eventually enter` ×2 — all previously corrected on `index.html` and left standing on this 507 KB twin document.

### F-3 — MODERATE — a positive credential claim on `/supported.html`

**Exact live wording:**

> "**Become a certified reviewer.** Six short modules, a companion reference, and a certificate of completion."

Directly contradicts the terminology rule, which permits "certificate of completion" but bans presenting participation as certification. Mitigating: the page is `noindex`, absent from the sitemap, and has **zero inbound links from any indexable page**.

### F-4 — LOW — prevalence assertions across seven indexable pages

`index.html` ×7, `jrsstandard.html` ×12, `operational-boundaries.html` ×2, `implementation-scenarios.html`, `workflow-fit.html`, `training.html`, `ai-governance-record.html`. Representative: *"Most organizations begin with one reviewer or one record type"*, *"Most records are self-reviewed by the drafter"*, *"These problems are typically identified only after a record has entered an official system"*. None cites a source.

### F-5 — LOW — internal sale framing on the acquisition surface

`/acquisition-9f3c2a7d4b.html`: *"a recurring-revenue layer that does not require the standard to be **fully validated** first."* `noindex,nofollow`, opaque slug, 0 public inbound links. This is an internal sale document, not a public claim, and is recorded for completeness rather than as a public-facing defect.

### NO ISSUE FOUND

**Retired-service funnel (Scan B).** Zero inbound links from any active page to `engagement.html`, `audit-request.html`, `governance-request.html` or `calibration-request.html`. The only such links are the four archive-internal references between the retired pages themselves. All five retired pages: sitemap 0, forms 0, `scoping call` 0, `Scope it` 0, checkout 0.

**Effectiveness claims (Scan F).** Zero matches for `reduces risk`, `prevents errors`, `improves compliance`, `improves outcomes`, `increases accuracy`, `guarantees defensibility`, `proven to` on any indexable page.

**Research and date integrity (Scan G).** `14 August 2026` **0**, `until the study closes` **0**, `closed on 4 September 2026` ×2 on both research pages; provisional ×2 and interim ×4 on `research.html`, provisional ×2 and interim ×2 on `pilot.html`. Over-claiming strings `final results`, `results are conclusive`, `analysis is complete`, `final analysis`, `research has ended`, `development has ended`, `study is complete` all return **0** across every page. The two "when it closes" references on `research.html` belong to **Study 012/013**, whose text states "Data collection is still open and no result is reported" — correctly scoped to an open study, not a contradiction of the closed Study 011.

**Production match.** 75 of 75 live bodies byte-identical to `origin/main` by `cmp`.

---

## ARCHITECTURAL TESTS

### Question 1 — The website primarily presents the founder as:

**C. Both.**

Overwhelmingly A: `enterprise.html` and `review-engine.html` carry the methodology/implementation hierarchy, the retired service layer is archival and unlinked, `about.html` presents a creator, and the free practitioner tier is genuine. But the homepage offers "Optional implementation support available upon request", and `jrsstandard.html` describes what implementation "discussions are limited to". A reader landing on either page sees an implementation-support offer.

### Question 2 — Does the website clearly distinguish JRS methodology from JRS Review Engine technology?

**Mostly.**

The distinction is present twice each on `index.html`, `enterprise.html` and `review-engine.html` — the three pages that name the Engine most (3, 9 and 6 occurrences respectively). `training.html`, `research.html`, `research-summary.html` and `org-pilot.html` mention the Engine once or twice without the distinction, but none conflates the two.

### Question 3 — Can an enterprise pursue licensing, technical integration, API/software implementation and acquisition without assuming the founder personally provides implementation consulting?

**Mostly.**

On `enterprise.html` and `review-engine.html`, yes: the licence is annual and per-organisation, "Condition mapping is carried out by the licensee against the published condition definitions", and both the sandbox and the Organization Mini-Pilot run with no contact. The qualifier is F-1 — a buyer who starts on the homepage reads that implementation support is available on request.

### Question 4 — Can a practitioner access useful JRS materials without payment, consulting, implementation agreement or mandatory participation?

**Yes.**

Verified by retrieval: field guides, simulations, all six training modules, the seven-point check, 17 reference pages and the standard PDF all resolve with no form, no account and no payment. Live text: *"Free, ungated, and staying that way. No account, no card, no expiry, no registration wall."*

### Question 5 — Does any discoverable public page materially reopen the retired founder-delivered service model?

**YES.** Two pages:

1. `https://www.jrsstandard.com/` — "Optional implementation support available upon request"
2. `https://www.jrsstandard.com/jrsstandard.html` — the same offer, plus "Discussions are limited to workflow adaptation, reviewer onboarding, and implementation questions"

Both are indexable and sitemapped.

---

## OVERALL GRADES

| Grade | Value | Basis |
|---|---|---|
| **Overall Website** | **B+** | 75 of 75 pages serve and match `origin/main`; free tier genuine; research disciplined. Held back by F-1 on the two most-read pages. |
| **Strategic Positioning** | **B-** | The retired layer is properly archived and unreachable through navigation, but the homepage still offers implementation support. |
| **IP Asset / Licensing Readiness** | **B+** | Licensing, integration, API and acquisition all clear and instrumented. An acquirer reading the homepage sees a service offer alongside them. |
| **JRS / Review Engine Architecture** | **A-** | Hierarchy present on all three pages that matter; no page conflates methodology with software. |
| **Practitioner Usability** | **A** | Verified by retrieval, not by claim: everything free resolves without a form. |
| **Research Credibility** | **A** | Closure date correct, provisional framing restored, every figure intact, zero over-claiming, open studies correctly scoped as open. |
| **Commercial Clarity** | **B** | Three pathways named consistently; a fourth, unacknowledged one is offered on the homepage. |

---

## DISCREPANCY ANALYSIS

**Prior claim tested:** "Complete architectural separation verified live."

**Result: B. PARTIALLY VERIFIED.**

The claim is accurate for everything it measured. The four retired pages, `terms.html`, the two commercial entry pages, the two named sentences on `jrsstandard.html`, and every regression string were all confirmed live in this audit. What the claim is not accurate about is the site. "Complete" was asserted on the strength of string lists that never contained `implementation support`, and the audit that produced it did not scan the homepage for founder-service offers because the homepage was treated as already corrected.

---

## PRIORITY CORRECTIONS

### PRIORITY 1: IMMEDIATE

1. **`https://www.jrsstandard.com/` — HIGH.** Problem: "Optional implementation support available upon request". Evidence: present once, indexed, sitemapped, on the most-read page. Correction: remove the clause, or replace with "Optional Review Engine licensing available on inquiry".
2. **`/jrsstandard.html` — HIGH.** Same clause, same evidence. Same correction.
3. **`/jrsstandard.html` — HIGH.** Problem: "Discussions are limited to workflow adaptation, reviewer onboarding, and implementation questions". Evidence: the exact sentence corrected on `index.html` on 2026-09-04, surviving here. Correction: apply the replacement already written for that sentence.
4. **`/supported.html` — MODERATE.** Problem: "Become a certified reviewer". Evidence: positive credential claim; the page already says "certificate of completion", which is permitted. Correction: "Train as a JRS reviewer" or equivalent.
5. **`/jrsstandard.html` — MODERATE.** Problem: `appear routinely`, `not unusual` ×2, `most records eventually enter` ×2 — all previously corrected on `index.html`. Correction: apply the same substitutions to this twin document.

### PRIORITY 2: LATER REFINEMENTS

6. Condition the roughly twenty "Most organizations…" assertions across the seven indexable pages, or cite a source for them.
7. `/recheck.html` robots value is `noindex, nofollow` with a space. Harmless, cosmetic.

---

## FINAL VERDICT

**VERDICT B: ARCHITECTURAL SEPARATION SUBSTANTIALLY VERIFIED WITH RESIDUAL ISSUES**

The retired founder-delivered service architecture is genuinely separated from the live commercial architecture: noindex, delisted from the sitemap, unlinked from every active page, written in the past tense, with no forms, no checkout and no funnel. The commercial architecture is intact, and the methodology/implementation hierarchy now reaches the pages an integrator or acquirer actually lands on. Research integrity is the strongest area in this audit and survives adversarial testing on every axis examined.

What blocks Verdict A is that the homepage and the standard page — the two most discoverable documents on the site — still offer founder-delivered implementation support and describe what implementation discussions cover.

---

## FINAL AUDIT INTEGRITY DECLARATION

1. **Direct live website access successful:** YES.
2. **Public URLs discovered:** 92 raw; **75 distinct** after deduplication.
3. **Pages actually reviewed:** **75 of 75**, each retrieved by `curl -sL`, written to disk, and analysed from the saved file.
4. **Pages not reviewed:** none. `/programme-status-9872fb93cc94.html` was checked for existence and access controls only; its contents are not disclosed in this report.
5. **Conclusions relying on search snippets:** none. No snippet, cache, screenshot, memory, commit message, deployment claim or prior report was used as evidence. Prior reports were used only to generate the list of claims to test.
6. **Repository modified:** NO — `git status --porcelain` returned 0 entries before and after the audit, and this report is the only artifact produced.
7. **Commit created during the audit:** none.
8. **Pushed, merged or deployed:** nothing. No production-facing asset was mutated, so no deployment sequence applies.
9. **Prior claim of complete architectural separation:** **PARTIALLY VERIFIED.** Everything the claim measured is true and confirmed live; two indexed, sitemapped pages carry a founder-service offer that the claim never measured.

**State after the audit:** `git status --porcelain` **0 entries** (before this report file was written) · HEAD `2484f02b0de970858a66719b74ac23e39e12c76b` · `origin/main` `122434f29905b45bbf321d72b157c13db7565c67` — both unchanged.
