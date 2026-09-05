# JRS POST-REMEDIATION VERIFICATION AUDIT

**Audit date:** 2026-09-04, 23:09 UTC
**Scope:** verification only. Determine whether the previously authorized narrowly scoped remediation of the founder-delivered service layer was actually completed, and whether research information survived it.
**Method:** direct inspection of the deployed git tree (`origin/main`) plus direct HTTP retrieval of the live production site. No content was corrected during this audit.

---

## 1. EXECUTIVE VERDICT

**REMEDIATION PARTIALLY VERIFIED**

The four-page founder-delivered service catalogue is genuinely retired, on production, and the retirement is verified against live response bodies rather than commit messages. Research information was preserved completely, and this is provable rather than asserted: twenty-four research, methodology and practitioner surfaces carry byte-identical blob hashes before and after the remediation.

Two founder-service pathways survive on live, publicly reachable pages that were outside the remediation's declared target set, and both create the impression the remediation was written to remove:

1. `/security.html` carries a live primary call to action reading **"Start an integration scoping call →"** — the exact phrase removed from `enterprise.html` in the earlier correction pass, surviving on a page linked from both `enterprise.html` and `review-engine.html`.
2. `/terms.html` remains `index,follow`, in the sitemap, and reads in the present tense as the governing terms of an active personally-delivered service in sections 1, 4, 7 and 8. Only section 2 carries the date-scoping sentence added by the remediation.

Neither is a catalogue and neither is a purchase funnel, so this is not a refutation of the remediation. But the primary question — whether the public site still creates a reasonable impression that Phillip must personally deliver a professional service — is not yet answerable with an unqualified no.

---

## 2. AUDIT BASELINE

| Item | Value |
|---|---|
| Audit date | 2026-09-04, 23:09 UTC |
| Current branch | `claude/html-pilot-L8rC3` |
| HEAD SHA | `92fda8962f8b12a347656114bd7569e218e297e5` |
| `origin/main` SHA | `8be6f1e1e4261f25eb3e2d5a7233e865f096d170` |
| `origin/main` subject | Merge PR #11: retire the public founder-delivered service layer |
| Working tree | clean, 0 uncommitted changes (before the report file was written) |
| Commits on branch not on `origin/main` | 1 — `92fda89`, which touches `research/MASTER_TRACKER.md` only and no website file |
| Remediation commit identified | `5351387` "Retire the public founder-delivered service layer" |
| Remediation present on `main` | **YES** — `git merge-base --is-ancestor 5351387 origin/main` returns true |

**Verified by file difference, not by commit message.** The complete footprint of the remediation, `git diff --stat 0bc6703 origin/main`:

```
 audit-request.html                                 |  16 +-
 calibration-request.html                           |  16 +-
 engagement.html                                    |  20 +-
 enterprise.html                                    |   3 -
 governance-request.html                            |  16 +-
 org-pilot.html                                     |   2 +-
 pilot.html                                         |   3 -
 research/MASTER_TRACKER.md                         |   4 +
 review-engine.html                                 |   3 -
 scripts/check_zero_drift.py                        | 117 +++++++++-
 scripts/retire_founder_service_layer_2026-09-04.py | 258 +++++++++++++++++++++
 security.html                                      |   3 -
 sitemap.xml                                        |  20 --
 terms.html                                         |   2 +-
 14 files changed, 433 insertions(+), 50 deletions(-)
```

Fourteen files. No page was deleted. `research/` and `scripts/` are excluded from deployment by `.vercelignore`, so eleven files reached production.

---

## 3. TARGET PAGE STATUS TABLE

| Page | Status | Publicly Accessible | Founder-Service Status | Research Impact | Finding |
|---|---|---|---|---|---|
| `/engagement.html` | **RETIRED** | Yes, HTTP 200, but `noindex,nofollow`, absent from sitemap, zero inbound links | Catalogue archived; 3 "Scope it" actions now read "Closed"; retirement notice at top of `<main>` | None | Fee table retained as historical record, no longer actionable |
| `/audit-request.html` | **RETIRED** | Yes, HTTP 200, `noindex,nofollow`, delisted, zero inbound links | Scoping-call offer removed; retirement notice present | None | Intake neutralised |
| `/governance-request.html` | **RETIRED** | Same | Same | None | Intake neutralised |
| `/calibration-request.html` | **RETIRED** | Same | Same | None | Intake neutralised |
| `/terms.html` | **REVIEW REQUIRED** | Yes, HTTP 200, `index,follow`, **in sitemap** | Section 2 date-scoped; sections 1, 4, 7, 8 still read as an active personally-delivered service | None | See section 8 |
| `/security.html` | **STILL ACTIVE** | Yes, HTTP 200, linked from `enterprise.html` and `review-engine.html` | Live primary CTA: **"Start an integration scoping call →"** | None | See section 4, finding F-1 |
| `/enterprise.html` | **RETIRED** (as a route) | Yes | 3 footer links into the retired layer removed; commercial pathways intact | None | Clean |
| `/pilot.html` | **RETIRED** (as a route) | Yes | 3 footer links removed and nothing else | **None — verified** | See section 5 |
| `/review-engine.html` | **RETIRED** (as a route) | Yes | 3 footer links removed | None | Clean |
| `/org-pilot.html` | **RETIRED** (as a route) | Yes | 1 outward link to `engagement.html` removed | None | Clean |
| `/acquisition-9f3c2a7d4b.html` | **NOT FOUND** as a public page | Reachable by opaque slug only; `noindex,nofollow`, absent from sitemap, linked only from two other opaque private surfaces | Not a public founder-service funnel | None | Noted in section 11 |

---

## 4. FOUNDER-SERVICE ARCHITECTURE FINDINGS

### F-1. `/security.html` offers an integration scoping call — **HIGH**

**URL:** `https://www.jrsstandard.com/security.html` (HTTP 200, 33,623 bytes, byte-identical to `origin/main`)

**Exact evidence, from the live response body:**

```html
<a href="enterprise.html#enterprise-inquiry" class="btn btn-primary">Start an integration scoping call &rarr;</a>
```

**Classification:** active public founder-service pathway.

**Explanation.** This is the same string that was removed from `enterprise.html` twice in the earlier correction pass and replaced there with "Make a technical integration inquiry". It survives on `security.html` because that page was never in any correction target set. `security.html` is not orphaned: it is linked from `enterprise.html` and `review-engine.html`, the two pages an integrator or acquirer is most likely to read. A repository-wide search of the deployed tree confirms `security.html` is now the **only** file on the public site carrying the phrase "integration scoping call".

Mitigating: the link points at the enterprise inquiry anchor, not at a retired page, and the inquiry form itself offers licensing, integration and acquisition. The defect is the wording, which promises a call in which scope is worked out, not the destination.

### F-2. `/terms.html` reads as an active personally-delivered service — **HIGH**

**URL:** `https://www.jrsstandard.com/terms.html` (HTTP 200, 25,174 bytes, byte-identical to `origin/main`, `<meta name="robots" content="index,follow">`, 1 sitemap entry)

**Exact evidence, from the live response body:**

- §1: *"JRS and the Justification Review Standard are the practice of Phillip Wikes, sole principal, trading as JRS™. **Engagements are performed personally and are not subcontracted.**"*
- §2: *"…**The current fee for each engagement is stated on that engagement's own page** and is confirmed in the written scope you receive before anything is charged"*
- §4: *"Records are supplied by you, **de-identified to a standard agreed at scoping**."*
- §7: *"**Invoiced on agreement of scope. Purchase orders accepted.** Terms are net 30…"*
- §8: *"After records are received and reading has begun, **the fixed fee is payable in full**…"*

**Classification:** unresolved contradiction.

**Explanation.** The remediation added exactly one sentence to §2 — *"These engagements were closed to new requests on 4 September 2026. This section governs engagements agreed in writing before that date…"* — and that sentence is confirmed live. Everything else in the document remains in the present tense. §2 also still says the fee "is stated on that engagement's own page", which now points at pages carrying a "Closed to new requests" banner and no fee. A reader who reaches `/terms.html` from the sitemap, from search, or from a link, and who does not read §2 to the end, sees a live terms-of-service for a personally-delivered fixed-fee review practice.

### F-3. Retired-layer intra-references — **NO ISSUE FOUND**

Four `href="engagement.html"` references remain on the deployed tree, all of them **inside** the retired layer: on `engagement.html`, `audit-request.html`, `governance-request.html` and `calibration-request.html`. No page outside the layer references any of the four. This is internal navigation within a set of archived pages that no public page links to, and it is the intended archival behaviour.

### F-4. Keyword sweep, classified

| Keyword | Where it survives on the deployed tree | Classification |
|---|---|---|
| "Record Defensibility Review" | nowhere | resolved |
| "Governance Documentation Review" | `engagement.html`, `governance-request.html` (retired layer); `api/_offer-config.js` (`retired: true`); `research/` and root `.md` files | historical text / not deployed |
| "Benchmark Access and Calibration" | `engagement.html` (retired layer); `api/_offer-config.js`; `research/`, root `.md`, `scripts/` | historical text / not deployed |
| "Fixed scope" | `research/MASTER_TRACKER.md`, `scripts/` only | not deployed |
| "fixed price" | `api/checkout.js`, `CONVERSION_ARCHITECTURE_BRIEFING.md`, `scripts/` | not deployed / server code |
| "fixed fee" | `engagement.html` (retired), **`terms.html` §8 (live)** | see F-2 |
| "invoiced" | `engagement.html` (retired), **`terms.html` §7 (live)**, `enterprise.html` | see F-2; enterprise use is licence terms |
| "purchase order" | `engagement.html` (retired), **`terms.html` §7**, `enterprise.html`, `review-engine.html` | see F-2; the other two are licence payment terms |
| "scoping" | retired layer, **`terms.html` §4**, **`security.html` (the CTA, see F-1)**, `acquisition-9f3c2a7d4b.html` | F-1 and F-2; the acquisition-page use is methodological ("That scoping is deliberate"), a false positive |
| "turnaround" | retired layer only, plus `terms.html` | historical text within the archive |
| "professional services" | `org-pilot.html` — a **sector dropdown option**, "Professional services or consulting"; `api/reviewer-eval.js` | false positive |

**Legitimate commercial uses correctly not flagged.** `enterprise.html`: *"Integration setup — One-time, invoiced on a signed scope"* and *"Purchase orders accepted. Nothing is charged during operational validation without a signed scope"* are platform-licence payment terms, and the same block states *"Condition mapping is carried out by the licensee against the published condition definitions."* `review-engine.html`: *"You will get a token, the tier, and an invoice in one reply. Purchase orders accepted."* is API licensing.

---

## 5. RESEARCH PRESERVATION FINDINGS

**RESEARCH PRESERVATION VERIFIED.**

- **`/research.html` remains intact.** Live HTTP 200, 40,497 bytes, byte-identical to `origin/main`. Its git blob is `2d8f9a2e` at `0bc6703` (production immediately before the remediation) and `2d8f9a2e` at `origin/main` (production now). **The file was not touched by the remediation at all.** Live content counts: Gwet 5, "83.9" 4, "operational validation" 4, "provisional" 2, "interim" 4, "Research" 15.
- **`/pilot.html` remains intact.** It is the only research-bearing page the remediation touched. The complete diff is three deleted lines, all of them footer links:

```diff
-      <a href="audit-request.html" class="footer-link">Record Review</a>
-   <a href="governance-request.html" class="footer-link">Governance Review</a>
-   <a href="calibration-request.html" class="footer-link">Benchmark Calibration</a>
```

  Research strings counted before (`0bc6703`) and after (`origin/main`), identical on every one: detection panel 2/2, Gwet 2/2, "83.9" 2/2, "0.74" 2/2, "83.9% accuracy" 1/1, "pre-registered threshold" 2/2, "independent experts" 1/1, "Research Findings" 1/1, "operational validation" 3/3, "provisional" 1/1, "Pilot Program" 14/14.
- **Research content removed:** none.
- **Research history removed:** none.
- **Methodology information removed:** none.

**Twenty-four surfaces confirmed byte-identical by blob hash, before and after the remediation:**

`research.html` `2d8f9a2e` · `research-summary.html` `f5a2a077` · `results.html` `b570f9d5` · `finding.html` `720aab94` · `evidence-ledger.html` `cc31b524` · `datasets.html` `01471440` · `codebook.html` `402d02d8` · `questions.html` `9eac4ea6` · `methodology.html` `f1f41043` · `index.html` `b049a11c` · `training.html` `58dcc9e5` · `jrsstandard.html` `5efefa09` · `about.html` `b4e153b4` · `decision-reconstruction-risk.html` `1d8b0ecb` · `why-good-decisions-fail.html` `e36bd46b` · `implementation-scenarios.html` `4eb96bb0` · `workflow-fit.html` `50c9eaa2` · `operational-boundaries.html` `7250d136` · `simulations.html` `c8d084f9` · `investigator-guides.html` `6d73da4c` · `check.html` `62efa803` · `contributor.html` `3d9e82c6` · `bench-review.html` `87b0a7da` · `ai-records-pilot.html` `d657a9a9`.

The four retired pages themselves were checked for research content before the audit reached this conclusion: they carry no study findings, no reliability figures, no participant data and no methodology documentation. Their "research" occurrences are boilerplate ("never logged to public research sets") and the shared dual-track block.

---

## 6. COMMERCIAL PATHWAY VERIFICATION

All figures below are counts taken from the **live production response bodies**.

| Pathway | Status | Evidence |
|---|---|---|
| **Licensing** | **INTACT** | `enterprise.html`: "Platform licence" 1, "Annual, per organisation" 1, "Enterprise and licensing inquiry" 1, `id="pricing"` section retained. `review-engine.html`: "licensing" 3. Homepage: "Commercial Inquiries" 1 and "licensing, technology integration, or acquisition" 1, plus the `engine-licence` and `framework-licence` options in the inquiry form. |
| **Technical Integration** | **INTACT** | `enterprise.html`: "Make a technical integration inquiry" 2, "Integration setup" row retained in the cost table. Homepage inquiry form: `oem-embed` option, "Integration: embed in our product". |
| **API / Software implementation** | **INTACT** | `enterprise.html`: "Review Engine API" 1. `review-engine.html` live at 52,815 bytes with 33 occurrences of "API", the OpenAPI 3.1 specification, the integration schema and the token-less sandbox. |
| **Acquisition** | **INTACT** | `enterprise.html`: "Acquisition" 2. `review-engine.html`: 2. Homepage inquiry form: `acquisition` option. |

No pathway was damaged. The retirement removed twelve footer links and one outward link, all of them into the retired layer, and touched no commercial markup.

---

## 7. NAVIGATION AND FOOTER VERIFICATION

Inbound `href` references into the retired layer, counted on the **live response bodies** of every public page fetched in this audit:

| Page | Links into the retired layer |
|---|---|
| `/` | 0 |
| `/enterprise.html` | 0 |
| `/pilot.html` | 0 |
| `/review-engine.html` | 0 |
| `/security.html` | 0 |
| `/org-pilot.html` | 0 |
| `/research.html` | 0 |
| `/terms.html` | 0 |

A repository-wide search of the deployed tree returns the same result: the only `href` references to the four retired pages come from inside the retired layer itself (four `href="engagement.html"` occurrences, on the four archived pages).

Sitemap, from the live `sitemap.xml` (6,786 bytes, byte-identical to `origin/main`): `engagement.html` 0, `audit-request.html` 0, `governance-request.html` 0, `calibration-request.html` 0. `terms.html` 1, retained.

**NO ACTIVE SHARED NAVIGATION OR FOOTER PATHWAY TO A FOUNDER-DELIVERED SERVICE LAYER WAS FOUND.**

That statement is made on the basis of the live retrievals above and is limited to *pathways into the four retired pages*. It does not extend to finding F-1, which is a scoping-call CTA on `security.html` pointing at the enterprise inquiry anchor rather than at a retired page.

---

## 8. TERMS ALIGNMENT

**`/terms.html`: PARTIALLY ALIGNED.**

The remediation's single sentence in §2 is live and correct:

> "These engagements were closed to new requests on 4 September 2026. This section governs engagements agreed in writing before that date and is retained so those terms remain readable; the commercial pathways that remain open are licensing of the JRS Review Engine, technical integration, and acquisition."

That was the minimum change and it was applied faithfully. What it does not do is change how the rest of the document reads. Five present-tense provisions still describe an active personally-delivered service, each confirmed present once on the live body: §1 "Engagements are performed personally and are not subcontracted"; §2 "The current fee for each engagement is stated on that engagement's own page"; §4 "de-identified to a standard agreed at scoping"; §7 "Invoiced on agreement of scope. Purchase orders accepted."; §8 "the fixed fee is payable in full".

The page is also `index,follow` and carries a sitemap entry, so unlike the four retired pages it remains discoverable by search. The §2 cross-reference to "that engagement's own page" now resolves to a page headed "Closed to new requests" that publishes no fee, which is an internal inconsistency rather than a live funnel.

Sections 3, 5, 6, 9 and 10 (what an engagement is not, ownership, confidentiality, liability, changes) are unrelated legal provisions and are correctly untouched. No rewrite of them is recommended.

---

## 9. LIVE PRODUCTION VERIFICATION

Live access was available and was used. Method: `curl -sL` with `-w '%{http_code} %{size_download} %{num_redirects} %{url_effective}'`, each response body written to disk and compared byte-for-byte against `git show origin/main:<file>` using `cmp`.

| URL | HTTP | Redirects | Bytes | vs `origin/main` |
|---|---|---|---|---|
| `https://www.jrsstandard.com/` | 200 | 0 | 651,309 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/engagement.html` | 200 | 0 | 37,063 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/audit-request.html` | 200 | 0 | 27,899 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/governance-request.html` | 200 | 0 | 27,992 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/calibration-request.html` | 200 | 0 | 27,959 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/terms.html` | 200 | 0 | 25,174 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/research.html` | 200 | 0 | 40,497 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/pilot.html` | 200 | 0 | 84,549 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/enterprise.html` | 200 | 0 | 93,214 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/review-engine.html` | 200 | 0 | 52,815 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/security.html` | 200 | 0 | 33,623 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/org-pilot.html` | 200 | 0 | 32,345 | **BYTE-IDENTICAL** |
| `https://www.jrsstandard.com/sitemap.xml` | 200 | 0 | 6,786 | **BYTE-IDENTICAL** |

Production is serving exactly the `8be6f1e` tree. Every finding in sections 4 through 8 that is marked "live" was read out of these fetched bodies, not out of the repository.

**Repository findings versus live findings.** The blob-hash comparisons in section 5 and the keyword sweep in section 4 are repository findings, drawn from `git archive origin/main`. Everything in sections 6, 7, 8, and findings F-1 and F-2, was confirmed on the live bodies as well. Where a claim rests on repository evidence alone it is labelled as such in the text.

---

## 10. GRADES

| Grade | Value | Evidence |
|---|---|---|
| **Founder-Service Remediation** | **B+** | The four-page catalogue is genuinely retired on production: noindex, delisted, zero inbound links, zero "scoping call", zero "Scope it", retirement notice on all four. Held back from A by F-1 and F-2, two live founder-service impressions on pages outside the target set. |
| **Research Preservation** | **A** | Twenty-four surfaces byte-identical before and after. `research.html` untouched entirely. `pilot.html` differs by three footer lines and eleven research strings are unchanged. Preservation was enforced in the applier, not merely intended. |
| **Commercial Pathway Preservation** | **A** | Licensing, technical integration, API/software and acquisition all INTACT, verified by count on live bodies. No pathway markup was touched. |
| **Navigation Integrity** | **A** | Twelve footer links and one outward link removed; zero inbound references to the retired layer from any public page, live and in the repository; four sitemap entries removed while `terms.html` correctly retained; no broken links introduced. |
| **Terms Alignment** | **C** | One correct sentence added to §2. Five present-tense service provisions remain across §§1, 4, 7, 8, the page is still `index,follow` and sitemapped, and the §2 fee cross-reference now points at pages that publish no fee. |
| **Overall Remediation** | **B+** | The declared objective was met on the declared targets, with research preservation proven rather than claimed. Two live contradictions outside the target set keep it short of full verification. |

---

## 11. UNRESOLVED ISSUES

1. **`/security.html` — "Start an integration scoping call →"** (HIGH). Live primary CTA, on a page linked from `enterprise.html` and `review-engine.html`. The only remaining occurrence of that phrase on the public site.
2. **`/terms.html` present-tense service provisions** (HIGH). §§1, 4, 7, 8 read as an active personally-delivered fixed-fee practice; the page is `index,follow` and sitemapped; §2's fee cross-reference resolves to pages that publish no fee.
3. **Stale study status** (MODERATE, pre-existing, outside the remediation). `/pilot.html` and `/research.html` both state figures are *"provisional until the study closes, expected 14 August 2026"* — three weeks past. No authoritative current status exists in the repository. The remediation correctly did not guess at it.
4. **Additional opaque private surfaces** (LOW, governance observation). `acquisition-9f3c2a7d4b.html` and `vp-7c1f9a4e8d2b6035.html` exist on the deployed tree, both reachable only by opaque slug, both `noindex`, neither in the sitemap, and linked only from each other and from `programme-status-9872fb93cc94.html`. `CLAUDE.md` states there is one private owner page. This is a documentation-versus-reality gap, not a public exposure: no public page references any of them, and no access control was probed in this audit.

---

## 12. FINAL VERDICT

**Was the remediation actually completed? PARTIALLY.**

On its declared targets the remediation was completed, deployed, and is verifiable from the live site rather than from claims about it. All four service pages are `noindex,nofollow`, carry the "Closed to new requests" notice, offer no scoping call and no "Scope it" action, appear in no sitemap, and are linked from nothing outside their own archive. Twelve footer links and one outward link were removed across five pages. Production serves the `8be6f1e` tree byte-for-byte on every one of thirteen URLs fetched.

Research preservation is the strongest result in this audit and the one most worth stating plainly, because it was the requirement most at risk from a removal-shaped task. Nothing was lost. `research.html` was not opened by the remediation; its blob hash is the same before and after. `pilot.html`, the only research-bearing page touched, differs by three deleted footer links and nothing else, with every research string counted and unchanged. Twenty-four research, methodology and practitioner surfaces are byte-identical across the change.

The verdict falls short of full verification for two reasons, and both sit outside what the remediation was scoped to touch, which is an observation about scope rather than about execution. `security.html` still opens with "Start an integration scoping call", the precise wording the earlier correction removed from `enterprise.html`, on a page an integrator reaches from both `enterprise.html` and `review-engine.html`. And `terms.html`, still indexed and sitemapped, reads in five places as the governing terms of a service performed personally and invoiced on scope, with one date-scoping sentence in §2 as the only signal to the contrary. A reader who lands on either page, and many will, would reasonably conclude that founder-delivered professional services are on offer. Until those two are addressed, the strategic question the remediation exists to settle is not fully settled.

---

## 13. AUDIT INTEGRITY DECLARATION

1. **Website files modified during this audit:** none. No HTML, CSS, JavaScript, form, redirect, navigation, research page or production configuration was changed.
2. **Committed, pushed, merged or deployed during this audit:** nothing. No `git commit`, `git push`, `git merge` or deployment command was executed.
3. **Live production directly inspected:** yes. Thirteen URLs retrieved by `curl` and byte-compared against `origin/main`; every "live" finding was read from a fetched response body.
4. **Conclusions inferred without direct evidence:** none. Every finding cites a blob hash, a diff, a live byte count, or a quoted string from a retrieved body. Where evidence is repository-only it is labelled as such. The classification of `.md` and `research/` keyword hits as "not deployed" rests on `.vercelignore` and on prior live probes returning the 404 page for those paths; those probes were not repeated in this audit and the claim is stated at that strength.
5. **This report is the only intended repository modification.** `research/POST_REMEDIATION_AUDIT_2026-09-04.md` was created. `research/MASTER_TRACKER.md` was **not** updated: this is a verification-only audit, the tracker is excluded from deployment, and a tracker commit would trigger a CI and preview cycle for no operational purpose. The report file was not committed, because the audit protocol prohibits pushing.

**Deployment status for this audit: NOT APPLICABLE — no production-facing asset was mutated.** `research/` is excluded from deployment by `.vercelignore`, so no deployment sequence is warranted or was executed.
