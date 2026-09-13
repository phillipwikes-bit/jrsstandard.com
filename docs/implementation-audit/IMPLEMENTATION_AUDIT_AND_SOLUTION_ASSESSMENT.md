# JRS Implementation Audit and Human-Centered Solution Assessment

**Date:** 13 September 2026
**Scope:** `jrsstandard.com`, repository at `origin/main` = `0a89795`, verified against live production bytes
**Method:** file-level inspection, PDF text extraction, headless render of the deployed bytes, byte comparison of production against `origin/main`
**Status of this document:** read-only audit. It is markdown under `docs/`, excluded from deployment by `.vercelignore`, so it carries no deployment trigger.

---

## 0. Two corrections to my own prior reporting, stated before the findings

**0.1 I previously wrote that `check.html` transmits nothing. That was wrong.**

`check.html` carries the site-wide JRS link-click telemetry block, present on **71 pages**, defined and **actively called** at `check.html:377` and `check.html:472`. On a link click it posts `timestamp`, `origin_url`, `target_url` and a `meta` object to `/api/telemetry` by `navigator.sendBeacon`, falling back to `fetch` with `keepalive`.

What it does **not** send is any part of the reader's assessment. No checkbox state, no count, no mode name, and no derived score leaves the page. So the substantive reason for halting the diagnostic telemetry still stands, but it must be stated accurately: the page already transmits **navigation** events, and the objection is to transmitting **content derived from the reader's own privileged records**. Those are different categories of data and conflating them was my error, not the page's.

**0.2 This creates a live wording finding, recorded below as F-1.** `check.html:169` reads "**Nothing here is sent anywhere.**" Taken as a flat sentence on a page that beacons link clicks, it is imprecise.

---

## 1. Audit Verification Matrix

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Unverified claim exclusion | **PASS** | See 2.1 |
| 2 | Hero CTA primacy (R-1) | **PASS** | `index.html` byte offsets, 2.2 |
| 3 | Field guide routing (R-2) | **NOT IMPLEMENTED** | 0 of 4 PDFs route to the Check, 2.3 |
| 4 | Diagnostic telemetry (R-3) | **NOT IMPLEMENTED** | 0 occurrences of all three events, 2.4 |
| 5 | Consequence framing (R-4) | **PASS** | `check.html:306-325`, render-verified, 2.5 |
| 6 | Policy language (R-5) | **PASS** | `compliance.html`, 24,157 bytes, 2.6 |
| 7 | Board-ready export (R-6) | **PASS** | `@media print` + clipboard, render-verified, 2.7 |

**Five of seven implemented. Two deliberately halted, both for reasons recorded at the time and both still standing.** Neither halt is a technical blocker. Item 4 is an owner decision about published privacy wording. Item 3 is blocked by an absent upstream generator.

---

### 2.1 Unverified claim exclusion: PASS

`70%` appears in exactly **two** deployable HTML locations, and both state it as a threshold that was **cleared**:

- `check.html:319`, "against a threshold of 70% fixed before any data were seen"
- `research.html:117`, "Clears the pre-registered threshold of 70% fixed before any data were seen"

`check.html:308` carries an explicit standing instruction in the source: `NO DEFICIT RATE IS STATED, because none exists in the evidence base`.

A repository-wide regex for deficit-rate phrasings (`deficit rate|deficit metric|NN% of records fail|majority of records lack`) returns **zero hits in any deployable file**. The only matches are in the audit documents that exist to record why the figure must not be created.

The fabricated **`16,384`** returns **zero occurrences repository-wide**. The real figures are in use and correctly separated: `83.9` on 8 public pages, `384 graded reads` on 6, "Sixteen independent experts" and "eleven countries" on `check.html`.

### 2.2 Hero CTA primacy (R-1): PASS

Measured by byte offset from the `<h1>` in `index.html` (at byte 57,332):

| Destination | First link | Offset from `<h1>` | Element |
|---|---|---|---|
| **`check.html`** | 58,073 | **+741** | `<a href="check.html" class="btn btn-primary">` |
| `training.html` | 56,542 | −790 | `class="nav-item"` (persistent nav, not a hero CTA) |
| `pilot.html` | 63,266 | +5,934 | small monospace chip |

The Check is the **first call to action after the headline** and the only one carrying the solid primary fill. The `training.html` link at a lower offset is the site navigation bar, which precedes the `<h1>` on every page.

### 2.3 Field guide routing (R-2): NOT IMPLEMENTED

Four guides exist and are served (all byte-verified live):

`JRS_Investigator_Field_Guide.pdf`, `_Employment.pdf`, `_FairHousing.pdf`, `_International.pdf`

Text extraction of all four returns **zero** occurrences of `check.html`, `/check`, or "Defensibility Check". The closing section of each ends on the trademark and disclaimer note, with no routing line.

**Why it is not implemented.** No generator for these PDFs exists in the repository. `reportlab` appears in exactly four scripts, all of which build certificates and prospectuses, none of which build the guides. Appending a routing line would mean editing the compiled PDFs directly, which the upstream-first rule prohibits: the change would be silently lost the next time the guides are regenerated from whatever produced them.

**What would unblock it:** the generator script, or the source document, for the four guides. With either in the repository this is a small change.

### 2.4 Diagnostic telemetry (R-3): NOT IMPLEMENTED

`check-view`, `check-step` and `check-complete` return **zero occurrences** across all HTML and all `api/*.js`.

`api/telemetry.js` exists and is live, and the site-wide click beacon posts to it (see section 0.1). What does not exist is any emitter carrying diagnostic progress.

**Why it is not implemented.** `check.html` makes two published promises:

- line 169: "**Nothing here is sent anywhere.** There is no registration, no account, no upload, and no form."
- line 194: "Nothing is transmitted; this runs entirely in your browser."

A `check-step` event carries a step index **derived from the reader's answers about their own closed matters**. Emitting it makes the line-194 sentence false as written. The endpoint extension was written and parse-tested, then reverted rather than shipped dormant.

**This is an owner decision, not an engineering one.** It is a choice between measurement and a privacy promise, and the promise is currently published. Two routes forward:

- **(a) Keep the promise, get partial measurement.** Emit only `check-view`, a pageview with no answer-derived content. This is the same category as the existing click beacon and requires no wording change. It answers "how many people open the Check" and nothing about completion.
- **(b) Re-word and get full funnel measurement.** Change line 194 to scope the promise precisely, for example: "Your answers stay in your browser. They are never sent, stored, or seen by anyone." That sentence is **true under full step telemetry**, because step counts are not answers, and it is a stronger promise than the current one because it is specific. Then `check-step` and `check-complete` can ship.

I recommend **(b)**, because the current sentence is already imprecise (F-1) and route (b) fixes the imprecision and unblocks the measurement in the same edit. It requires the owner's approval of published privacy wording.

### 2.5 Consequence framing (R-4): PASS

`check.html:306-325` renders a benchmark block after the reader's own result. Verified by driving all seven checkboxes in headless Chromium **against the downloaded production bytes**, confirmed identical to `origin/main` before rendering:

| Element | Result |
|---|---|
| All seven modes listed | 7 of 7 |
| Mean accuracy 83.9% | present |
| 95% CI 72.7 to 95.1, n = 16 | present |
| 384 graded reads | present |
| Sensitivity 87.0, specificity 80.7 | present |
| Range 37.5% to 100% | present |
| Reliability criterion **not met** | present |
| Fabricated "16,384" | absent |
| JS errors | 0 |

The reader's own count is contrasted against the panel in the adjacent sentence, and the block closes on "Group-level detectability does not license individual-level reliance."

**The two negatives are stated in the same block as the headline figure, not in a footnote.** That is the finding of substance here: the framing does not select for the flattering half of the study.

### 2.6 Policy language (R-5): PASS

`compliance.html`, 24,157 bytes, live at both `/compliance.html` and `/compliance` (the short URL was missing on first ship and was added today).

| Component | Present |
|---|---|
| Adoptable policy clause | yes |
| Governance checklist | yes (2 references) |
| Vendor requirement clause | yes (2 references) |
| All five canonical conditions | 5 of 5 |
| "not certification" / "not accreditation" / "not a credential" | all present |
| Republished panel figures | **0** |

The zero on the last row is deliberate and is the design property that matters: the page carries **no numeric claim of its own**, linking to `research.html` instead, so it cannot drift out of step with the study.

### 2.7 Board-ready export (R-6): PASS

- **Print:** one `@media print` block, hiding `header`, `footer`, `nav`, `.primary-nav`, `.no-print`, `.sa-actions` and all `button` elements; forcing black on white; expanding external `href`s after link text; and setting `page-break-inside:avoid` on the result.
- **Clipboard:** `navigator.clipboard.writeText` with a `document.execCommand('copy')` textarea fallback. Render-verified: the button label returns **"Copied"** after click.
- **Stamp:** `.sa-stamp` renders a dated, source-attributed line carrying the standard disclaimer.
- **Onward route:** `<a href="compliance.html" class="sa-adopt">` links the individual result to the institutional policy page.

A download was deliberately not used: sandboxed and embedded browser contexts block script-driven downloads, while copy and print keep working.

---

## 3. Open findings

| ID | Finding | Severity | Owner action |
|---|---|---|---|
| **F-1** | `check.html:169` "Nothing here is sent anywhere" is imprecise: the page beacons link clicks site-wide | **Medium** | Approve re-wording; resolves with R-3 route (b) |
| **F-2** | Four field guides have no generator in the repository | Medium | Supply generator or source document |
| **F-3** | Diagnostic funnel remains unmeasured | Medium | Decide route (a) or (b) under 2.4 |
| **F-4** | Root cause of the 13 Sep missed production build is not determinable from the repository | **High** | Read the Vercel deployment log for `prj_vSlMqS2nMaOUzTS6MpAAo4qYxbIR` |

F-1 is rated Medium rather than Low because it is a privacy representation on the page the funnel is built around, and it is the kind of sentence a regulator or opposing counsel reads literally.

---

## 4. Human-Centered Process Improvement and Solution Assessment

### 4.1 Executive cognitive load and friction

The architecture removes the two costs that usually stop a General Counsel at the door: **the disclosure cost and the commitment cost.**

There is no "Contact Sales" or "Request a Demo" anywhere on the site. The Check asks for no registration, no account and no upload. For the specific population this is aimed at, that is not a convenience feature. A GC evaluating retrospective documentation risk is, by definition, examining files that may later be discoverable. Any tool that requires uploading them is not evaluable at all, whatever its merits, because the evaluation itself would create a record.

The Check inverts this. The reader opens their own closed matters, on their own screen, and answers seven questions **about** them. Nothing leaves the room. That is what makes a five-minute trial possible for someone whose professional instinct is to disclose nothing.

The shift from reading to self-assessment matters for a second reason, which is that it changes who owns the conclusion. A page that asserts "records like yours often fail" invites the reader to dispute the claim. A page that asks seven questions and lets the reader find two modes in their own file produces a conclusion the reader reached themselves, about a document they know better than anyone. That is materially harder to dismiss, and it is the reason the honest framing is also the more persuasive one.

**The friction that remains is real and should be named.** Seven questions requiring the reader to have a closed matter open in front of them is not a low-effort interaction. It is well matched to a senior professional with a specific worry, and poorly matched to a casual visitor. That is a deliberate trade and appears correct, but it means top-of-funnel volume will be low and completion quality high. **F-3 is what prevents anyone knowing whether that trade is working.** At present the completion rate is not merely unknown, it is unknowable.

### 4.2 Evidentiary integrity and trust architecture

This is the strongest dimension of the deployment, and the discipline is visible in what the site declines to say.

The brief that initiated this workstream specified a "70% deficit metric" showing that the majority of automated records fail retrospective reconstruction. **No such figure exists in the evidence base, and none can be derived from it**, because the corpus is 24 constructed records balanced 12 supported against 12 unsupported. A 50/50 constructed corpus can demonstrate detectability; it cannot estimate a population rate. The figure was not created. A second fabricated figure, "n = 16,384 graded judgments," was a comma-splice of two real numbers and was caught before it reached a page.

The benchmark block states **83.9% mean accuracy and, in the same paragraph, that reviewer accuracy ranged from 37.5% to 100% and the pre-registered reliability criterion was not met.** Publishing the reliability failure alongside the headline is the single most load-bearing decision on the page. A GC who later discovers a buried limitation stops trusting everything around it. One who finds the limitation stated first has a reason to trust the rest.

The same logic governs `compliance.html`, which carries no numeric claim at all. It cannot become stale, and a checklist that cannot go out of date is one an institution can adopt without scheduling a review of it.

The non-accreditation boundaries ("not certification, not accreditation, not a credential") do double duty. They protect against a misrepresentation claim, and they tell an adopting institution exactly what it is and is not buying, which is the question its own risk committee will ask first.

**The gap in this dimension is F-1.** A page whose entire credibility rests on precise claims about evidence should not carry an imprecise claim about itself. The fix is small and makes the promise stronger.

### 4.3 Institutional adoption and the internal champion

The path from individual diagnosis to institutional adoption is now continuous, where before it ended at the result.

The chain is: reader completes the Check, sees their result against the panel benchmark, copies or prints a dated and source-attributed summary, and follows "Make this a policy" to `compliance.html`, which supplies a policy clause, a governance checklist against all five conditions, and vendor requirement language.

This is built around a specific and accurate model of how governance tools actually enter institutions. **They are not bought at the top. They are carried upward by someone in the middle who has to justify the request.** That person's constraint is not conviction, it is preparation time: they need a page they can put in front of a committee without writing it themselves, and language they can paste into an SOP without drafting it.

The print and clipboard routes serve that directly, and choosing them over a file download was correct for this audience. Corporate and government browsers often block script-driven downloads; copy and print survive nearly everywhere. It also avoids asking a GC to download an unknown file, which is its own trust cost.

**The vendor requirement clause is the highest-leverage component on the page**, because it converts an internal standard into an external procurement condition. Point (e), which asks a vendor what its product does **not** assess, is the question most likely to produce a useful answer, since it is the one vendors are least prepared for.

**The weakness is attribution, and it is the same weakness as F-3.** When a policy clause is adopted somewhere, nothing in the system records that it came from a diagnostic completion. The champion's path is well built and entirely invisible.

### 4.4 Operational risk and deployment resilience

**This dimension produced the most serious finding of the session, and it was found only because the v3.8 byte-verification clause was followed rather than the status code.**

PR #28 merged cleanly. GitHub reported green. **Production never picked it up.** Twenty minutes later `check.html` was still serving the pre-merge 33,801 bytes against 39,437 on `main`, and `compliance.html`, a brand-new route, returned 404.

**Every conventional health signal passed throughout.** The apex returned 200. `check.html` returned 200. The sitemap returned 200. A deployment check built on status codes would have reported success while the entire change was absent from production.

Three secondary traps were ruled out rather than assumed:

- **Edge cache.** `jrsstandard-com.vercel.app`, the production alias itself and not a CDN node, served the same stale bytes. A cache-busting query string returned an identical `age` and `etag`, because Vercel keys static assets on path alone.
- **A skip token.** The merge commit carried none.
- **A false positive that would have ended the investigation.** The branch preview returned **200 for all three test paths at roughly 339 KB each**. That is Vercel's SSO login page: the preview sits behind deployment protection. Three identical 200s read exactly like proof the page deploys. Only reading the body showed they were worthless.

The remedy was a change needed anyway. `compliance.html` had shipped with a sitemap entry and an inbound link but no extensionless redirect, making `/compliance` the only public route that would 404 while its `.html` sibling served. Adding it triggered a fresh build, and **production went live in about 40 seconds.** That 40 seconds is the evidence: deployments on this project are fast, so the twenty minutes was not latency and #28's production build genuinely never ran.

**The durable lesson, which now governs this repository:** on this project a byte comparison against `origin/main` is the only trustworthy deployment check. A 200 is not one, and neither is a green merge.

**F-4 remains open and is rated High.** Why that build never ran cannot be determined from inside the repository. Until the Vercel deployment log is read, the failure mode is uncharacterised, which means it can recur silently. The automatic rollback provision in the protocol would not have helped here and is worth understanding clearly: **there was nothing to roll back.** Production was healthy and self-consistent on the previous build. The failure was not a bad deployment but an absent one, and a revert would have changed nothing. The correct response to a byte mismatch on this project is therefore to **re-trigger**, not to revert.

---

## 5. Assessment summary

**Five of seven recommendations are implemented, byte-verified in production, and render-verified in a browser.** The two that are not carry documented reasons that survive scrutiny: one is blocked on an absent upstream generator, and one is blocked on a published privacy promise that only the owner can decide to re-word.

The deployment's principal strength is that **it does not overclaim**, and the discipline held under direct pressure to publish a fabricated deficit rate. Its principal operational risk is **not the website but the pipeline**, where a merge can silently fail to deploy while every conventional signal stays green.

The single highest-value next action is **F-4**, reading the Vercel deployment log, because an uncharacterised silent-skip failure undermines confidence in every deployment that follows it, including the ones that worked.

---

## 6. Master Tracker deployment block

```
[Session ID]                     session_01W9UtE7X76spacWeSvBH7tv
[Timestamp]                      2026-09-13T12:20Z
[Completed Phases]               7-point implementation audit; PDF text extraction (4 guides);
                                 headless render of deployed check.html with all 7 boxes driven;
                                 byte-verification of 7 production artifacts against origin/main
[Queried Artifacts]              check.html, compliance.html, index.html, research.html,
                                 sitemap.xml, vercel.json, api/telemetry.js,
                                 JRS_Investigator_Field_Guide{,_Employment,_FairHousing,
                                 _International}.pdf
[Active System State]            origin/main = 0a89795 ; dev branch claude/html-pilot-L8rC3
[Variables Modified]             NONE. Read-only audit. No website source file, asset,
                                 configuration schema or content component was modified.
[Upstream Generator Trace]       check.html, compliance.html, index.html : hand-authored, no
                                   upstream generator, direct edit is correct
                                 sitemap.xml : hand-maintained
                                 4 field guide PDFs : GENERATOR NOT PRESENT IN REPOSITORY.
                                   reportlab appears only in research/build_certificate.py,
                                   build_certificate_armb.py, build_prospectus_panel.py,
                                   build_prospectus_armb.py, none of which build the guides.
                                   R-2 halted under the upstream-first rule.
[Pending Technical Debt]         F-1 privacy wording imprecision (Medium)
                                 F-2 absent field-guide generator (Medium)
                                 F-3 diagnostic funnel unmeasured (Medium)
                                 F-4 uncharacterised silent deployment skip (High)
[Production Deployment Status]   LIVE / BYTE-VERIFIED
                                 7 of 7 audited artifacts byte-identical to origin/main
[Next Trigger / Expected Input]  Owner decision on R-3 route (a) or (b);
                                 Vercel deployment log for prj_vSlMqS2nMaOUzTS6MpAAo4qYxbIR;
                                 field-guide generator or source document
```
