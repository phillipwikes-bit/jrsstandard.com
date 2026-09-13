# JRS Master Audit and Human-Centered Solution Assessment

**Date:** 13 September 2026
**Repository state:** `origin/main` = `44eb2af`
**Method:** live production bytes fetched and compared against `origin/main`; PDF page-level extraction; guard suite; endpoint probes tagged `src=verify` so no verification polluted live counts
**Status of this document:** read-only audit. Markdown under `docs/`, excluded from deployment by `.vercelignore` and again by the `/*.md` redirect, so it carries no deployment trigger.

---

## 0. Two premises in the brief were out of date, and correcting them changes the answer

**0.1 There are three tracked field guides, not four.** `api/dl.js` maps exactly three editions behind `?e=`: `employment`, `fairhousing`, `international`. `JRS_Investigator_Field_Guide.pdf`, the combined overview, has no `?e=` edition, is served by filename through `?f=`, and is linked from `jrsstandard.html` and `training.html` rather than the guides page. It is a separate untracked distribution and is deliberately excluded from the routing work. It must **not** carry a routing page, and a guard now fails if it ever gains one.

**0.2 The guides are no longer staged. They are published and live.** The brief asks for an inspection of staged assets in `build/`. That state ended earlier today: the three guides were published, deployed and byte-verified. `build/` now holds only the copies that were published, and `--build` refuses to run against them.

That second point is not a formality. **Publishing created a failure mode that did not exist while the assets were staged**, and it is the most important operational finding in this audit. See 1.1.

---

## 1. Audit Verification Matrix

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Field guide integrity and routing | **PASS (published, not staged)** | 1.1 |
| 2 | Privacy wording and `check-view` telemetry | **PASS** | 1.2 |
| 3 | `compliance.html` deployed, zero numeric drift | **PASS** | 1.3 |
| 4 | Board-ready export (`@media print` + clipboard) | **PASS** | 1.4 |
| 5 | Production byte-verification (v3.8) | **PASS** | 1.5 |

Guard suite: **128 checks, 0 failed, 1 skipped.** Production: **105 assets byte-identical to `origin/main`, 0 stale, 0 missing, 0 unreachable.**

---

### 1.1 Field guides: PASS, and the drift risk publishing created

Fetched live through the tracked routes, not read from disk:

| Route | HTTP | Bytes | Pages | Routing page | Heading | `/URI` link |
|---|---|---|---|---|---|---|
| `/api/dl?e=employment` | 200 | 19,723 | 9 | last page | yes | 2 |
| `/api/dl?e=fairhousing` | 200 | 20,032 | 9 | last page | yes | 2 |
| `/api/dl?e=international` | 200 | 20,463 | 9 | last page | yes | 2 |

**Text integrity is exact, not approximate.** Every original page was carried through by `pdfunite` and proved so *before* the overwrite: `--publish` re-runs `--verify` and copies nothing if a single guide fails. All three returned `original_text_identical=True`, comparing the text of pages 1 to 8 of the output against the entire original, with exactly one page added.

**Margin and formatting integrity.** The appended page derives its running header, rule and footer from the guide itself rather than a hardcoded table, so each carries its own document id and the correct page number. That derivation is what caught an error in the earlier approach: Fair Housing is `001-INV-H` and International `001-INV-INT`, not `-F` and `-I` as a hardcoded map had them. The routing line is a live `/URI` annotation, not plain text.

**The drift risk, which is new and is caused by success.** Once published, the shipped file **is** the 9-page routed document. The pipeline no longer has a pristine 8-page original, so a second `--build` would append a **second** routing page and each guide would grow by a page on every run. This surfaced as a genuine `FAIL` in verification immediately after publication and was closed two ways:

- `--build` counts the marker first and skips an already-routed guide (confirmed: all three now report SKIP).
- `check_tracked_guides_carry_exactly_one_routing_page` enforces the invariant in the guard suite, because a script can be edited and a PDF can be replaced by hand. **Demonstrated firing in both directions**: a double append reported 2 routing pages, a guide rebuilt from an old 8-page copy reported 0. It also fails if the untracked combined overview ever gains one.

**An earlier reconstruction approach was discarded and should not be revived.** Rebuilding the guides from extracted text peaked at 90.5% wording fidelity, lost 5 to 12 per cent of characters, collapsed 8 pages to 5, and destroyed the cover page, serif display type, gold rules and document-control block. Extraction recovers wording and never typography.

### 1.2 Privacy wording and telemetry: PASS

Verified in the **live** `check.html`, which is byte-identical to `origin/main`:

| Check | Result |
|---|---|
| "Your assessment answers stay entirely in your browser" | present |
| "They are never sent, stored, or seen by anyone" | present |
| Discloses that the page counts visits and link clicks | present |
| Links to `privacy.html` | present |
| Old absolute claim "Nothing here is sent anywhere." | **absent, correct** |
| `check-view` emitter | present |
| `jrs-check-view` sessionStorage key | present |
| Answer-derived tokens inside the emitter | **none** |

**Why the wording is what it is, rather than what was originally specified.** `check.html` carries GA4 (`G-NVYHJ7BJ92`), which sets cookies and sends data to a third party on every load, and `privacy.html` discloses that accurately in two places. The previous sentence therefore did not merely read loosely: it **contradicted a published policy on the same site**. A proposed replacement, "we only measure anonymous page navigation to improve this tool", would have been false twice, since "only" excludes GA4 and a GA4 client id in a cookie is a persistent pseudonymous identifier rather than an anonymous one. The shipped wording is scoped to the thing readers actually care about and is true.

**Behaviour was verified by interception, not by reading the code.** Over a real HTTP origin the page emits exactly one beacon on load, carrying the path, the literal string `check-view` and the `?src=` tag, and **zero** beacons after ticking all seven boxes and pressing copy. Three reloads produced no second beacon; a new tab produced one. A first attempt over a `file://` origin returned zero beacons and was **not** reported as proof, because a relative URL there resolves to `file:///api/telemetry` and fails before a request event fires.

`api/telemetry.js` gates view events behind a `VIEW_EVENTS` allow-list so `meta.event` cannot become a free-text field, and writes them under `source='page-view'`, which no existing aggregate reads. Every consumer of `interaction_events` was checked before that value was introduced.

### 1.3 `compliance.html`: PASS, zero numeric drift confirmed

Live and byte-identical to `origin/main`, served at both `/compliance.html` and `/compliance`.

| Component | Present |
|---|---|
| Adoptable policy clause | yes |
| Governance checklist | yes |
| Vendor requirement clause | yes |
| All five canonical conditions | 5 of 5 |
| "not certification" / "not accreditation" / "not a credential" | all three |
| **Panel figures republished** | **NONE** |

The zero on the last row is the design property that matters: the page carries no numeric claim of its own and links to `research.html` instead, so it cannot fall out of step with the study.

**Two false positives in my own probes were checked rather than reported.** An initial pass flagged `16` as a republished figure; it is inside `&#169;`, the `©` entity, which my tag-stripper had not decoded. The same pass reported "not accreditation" missing; stripping tags had left a double space inside the phrase. Both were tooling faults. Nothing on the page changed.

### 1.4 Board-ready export: PASS

| Element | Result |
|---|---|
| `@media print` block | present |
| `navigator.clipboard.writeText` | present |
| `execCommand('copy')` fallback | present |
| `#sa-copy` / `#sa-print` buttons | present |
| Dated, source-attributed stamp | present |
| Link onward to `compliance.html` | present |

Render-verified earlier today against downloaded production bytes: the copy button returns "Copied", the print media rule is live, and the result block shows 83.9%, 95% CI 72.7 to 95.1, n = 16, 384 graded reads, sensitivity 87.0, specificity 80.7, both negatives, no fabricated figure, and zero JS errors.

A download was deliberately not used: sandboxed and embedded browser contexts block script-driven downloads, while copy and print keep working.

### 1.5 Production byte-verification: PASS

`105 byte-identical, 0 stale, 0 missing, 0 unreachable` against `origin/main` at `44eb2af`.

**The verification tool itself required a fix during this cycle, and that is worth recording.** Its first full run reported **45 stale and 16 missing**, which reads as a catastrophic deployment failure. Every one was false. They were all `api/*.js`: Vercel **executes** Edge Functions and never serves their source, so the check was comparing a function's JSON response against its own source code. `api/access.js` returned 29 bytes of JSON; `api/dl.js` returned 27,524 bytes of the PDF it served; the underscore helpers 404 because they are not routes. Two more followed the same pattern: `supabase-ALL.sql`, excluded by name in `.vercelignore`, and `vercel.json`, which the platform reads rather than serves.

These were **excluded in the tool, not explained away in a report**. An alarm that cries wolf 63 times teaches its reader to ignore it, and a real staleness would then sit unread in the noise, defeating the entire purpose of a tool built to catch a silent deployment skip.

---

## 2. Field Guide Status and Fidelity Assessment: final determination

**Determination: PUBLISHED AND BYTE-VERIFIED. No staged assets remain awaiting a decision.**

| Guide | State | Fidelity |
|---|---|---|
| Employment / EEO | live, 9 pages | original text identical, one page added |
| Fair Housing | live, 9 pages | original text identical, one page added |
| International | live, 9 pages | original text identical, one page added |
| Combined overview | live, 9 pages, unchanged | out of scope by design, must stay unrouted |

Filenames are unchanged, so download tracking through `api/dl.js` is unaffected; each `?e=` key was resolved back to a file on disk after the copy and fetched live.

**Upstream trace.** No generator for these PDFs has ever existed in the repository or its history. The `.docx` in history (`bc72a20`, deleted `e3c5567`) is a superseded predecessor, not the source: 23,783 characters against 14,042, 24 numbered headings against 7, only 3 shared. The PDF is therefore the only artifact that has ever existed and is itself the upstream, which is why appending to it is upstream-first rather than downstream patching. `scripts/generate_field_guides.py` is now that upstream pipeline and records this reasoning in its own docstring so it is not re-derived.

---

## 3. Human-Centered Process Improvement and Solution Assessment

### 3.1 Executive cognitive load and friction

The architecture removes the two costs that stop a General Counsel at the door: **the disclosure cost and the commitment cost.**

There is no "Contact Sales" and no "Request a Demo" anywhere on the site. The Check asks for no registration, no account and no upload. For this population that is not a convenience feature. A GC evaluating retrospective documentation risk is by definition examining files that may later be discoverable, so a tool requiring upload is not evaluable at all, whatever its merits, because the evaluation would itself create a record.

The Check inverts that. The reader opens their own closed matters, on their own screen, and answers seven questions **about** them. Nothing leaves the room, and the page now says so in words that survive inspection.

The shift from reading to self-assessment matters for a second reason: it changes who owns the conclusion. A page asserting "records like yours often fail" invites dispute. A page that asks seven questions and lets a reader find two modes in their own file produces a conclusion they reached themselves, about a document they know better than anyone. That is harder to dismiss, and it is why the honest framing is also the more persuasive one.

**The friction that remains is real and deliberate.** Seven questions requiring a closed matter open in front of the reader is not a low-effort interaction. It is well matched to a senior professional with a specific worry and poorly matched to a casual visitor. That trade looks correct, but it means low top-of-funnel volume and high completion quality, and **until today nothing measured whether the trade was working.** `check-view` now answers opens and their referring channel. It deliberately does not answer completion, because completion is derived from answers and the page promises those never leave the browser. That boundary is a choice, and it is the right one: the promise is worth more than the metric.

### 3.2 Evidentiary integrity and trust architecture

This remains the strongest dimension, and the discipline is visible in what the site declines to say.

The workstream began with a brief specifying a "70% deficit metric" showing that most automated records fail retrospective reconstruction. **No such figure exists in the evidence base and none can be derived from it**, because the corpus is 24 constructed records balanced 12 supported against 12 unsupported; a 50/50 constructed corpus demonstrates detectability and cannot estimate a population rate. It was not created. A second fabricated figure, "n = 16,384 graded judgments", was a comma-splice of two real numbers and was caught before it reached a page. Neither appears anywhere: `70%` occurs in exactly two deployable locations and both state it as a threshold that was **cleared**.

The benchmark block states 83.9% mean accuracy and, in the same paragraph, that reviewer accuracy ranged from **37.5% to 100%** and that the **pre-registered reliability criterion was not met**. Publishing the reliability failure beside the headline is the single most load-bearing decision on the page. A GC who later discovers a buried limitation stops trusting everything around it; one who finds it stated first has reason to trust the rest.

`compliance.html` extends the same logic by carrying no numeric claim at all. A checklist that cannot go stale is one an institution can adopt without scheduling a review of it.

**The gap closed this cycle was the site's claim about itself.** A page whose credibility rests on precise claims about evidence was carrying an imprecise claim about its own data handling, one that contradicted its own privacy policy. That is now fixed, and the fix is enforced by a guard that fails if the promise sentence is deleted, if the emitter ever references checkbox state, or if the endpoint stops allow-listing view events.

### 3.3 Institutional adoption and the internal champion

The path from individual diagnosis to institutional adoption is now continuous, and as of today it extends upstream into the field guides.

The chain is: reader downloads a guide, is routed from its closing page to the Check, completes the Check, sees their result against the panel benchmark, copies or prints a dated and source-attributed summary, and follows "Make this a policy" to `compliance.html` for a policy clause, a governance checklist against all five conditions, and vendor requirement language.

This is built around an accurate model of how governance tools enter institutions. **They are not bought at the top. They are carried upward by someone in the middle who has to justify the request.** That person's constraint is not conviction but preparation time: they need a page to put in front of a committee without writing it, and language to paste into an SOP without drafting it.

Print and clipboard serve that directly, and choosing them over a file download was correct for this audience, since corporate and government browsers often block script-driven downloads while copy and print survive nearly everywhere. It also avoids asking a GC to download an unknown file.

**The vendor requirement clause is the highest-leverage component**, because it converts an internal standard into an external procurement condition. Point (e), asking a vendor what its product does **not** assess, is the question most likely to produce a useful answer, being the one vendors are least prepared for.

**The attribution gap narrowed but did not close.** The guide-to-Check step is now measurable through `?src=guide-dl` read by the `check-view` beacon. The Check-to-policy step is not: when a clause is adopted somewhere, nothing records that it came from a diagnostic completion, and by design nothing can, since that would require answer-derived state.

### 3.4 Operational risk and deployment resilience

This produced the most serious finding of the wider engagement, and it was found only because the v3.8 byte clause was followed instead of the status code.

**PR #28 merged clean, GitHub reported green, and production never picked it up.** Twenty minutes later `check.html` was still serving the pre-merge 33,801 bytes against 39,437 on `main`, and `compliance.html`, a brand-new route, returned 404. **Every conventional signal passed throughout**: apex 200, `check.html` 200, sitemap 200.

Three secondary traps were ruled out rather than assumed: the edge returned an identical `age` and `etag` under a cache-busting query, because Vercel keys static assets on path alone; the merge commit carried no skip token; and the branch preview returned 200 on three paths at roughly 339 KB each, which was **Vercel's SSO login page** and would have read as proof the deployment worked.

Two durable conclusions follow, and both now live in tooling rather than in a document:

1. **On this project a byte comparison against `origin/main` is the only trustworthy deployment check.** A 200 is not one, and neither is a green merge. `scripts/preflight_deploy_check.py` enforces this and compares bodies, never headers.
2. **The correct response to a byte mismatch here is to re-trigger, not to revert.** The v3.8 rollback clause does not fit this failure mode. Production was healthy and self-consistent on the previous build; the failure was an **absent** deployment, not a bad one, and a revert would have changed nothing. The tool says so in its own output.

**F-4 remains open and is the highest-value outstanding item.** Why that build never ran cannot be determined from inside the repository. `api.vercel.com` returns **403**, `VERCEL_TOKEN` is unset, there is no CLI and no `~/.vercel`. Per the fallback clause the log read halts rather than being bypassed:

```bash
# Fail-closed setup required to diagnose F-4:
export VERCEL_TOKEN="[REQUIRED_DEPLOY_SECRET]"
export VERCEL_ORG_ID="team_Q2KvghlnRA3ePBm4zAiYzbIf"
export VERCEL_PROJECT_ID="prj_vSlMqS2nMaOUzTS6MpAAo4qYxbIR"
npm i -g vercel && vercel inspect --logs
```

An uncharacterised silent-skip failure undermines confidence in every deployment after it, including the ones that worked.

---

## 4. Open items

| ID | Item | Severity | Owner action |
|---|---|---|---|
| **F-4** | Root cause of the 13 Sep missed production build is undetermined | **High** | Read the Vercel deployment log for `prj_vSlMqS2nMaOUzTS6MpAAo4qYxbIR` |
| F-5 | Check-to-policy adoption is unattributable | Low | Accept: closing it would require answer-derived state and would break a published promise |
| F-6 | Combined overview carries no route to the Check | Low | Decide whether the untracked distribution should route; guard currently requires it must not |

F-1, F-2 and F-3 from the previous audit are closed.

---

## 5. Master Tracker deployment block

```
[Session ID]                     session_01W9UtE7X76spacWeSvBH7tv
[Timestamp]                      2026-09-13T14:10Z
[Completed Phases]               staged-asset inspection (superseded: assets are published);
                                 live-byte verification of check.html and compliance.html;
                                 PDF page-level extraction of 3 tracked guides via their
                                 tracked routes; telemetry interception over HTTP;
                                 guard suite; full-site byte comparison
[Queried Artifacts]              check.html, compliance.html, privacy.html, api/telemetry.js,
                                 api/dl.js, vercel.json, .vercelignore,
                                 JRS_Investigator_Field_Guide{,_Employment,_FairHousing,
                                 _International}.pdf, scripts/generate_field_guides.py,
                                 scripts/preflight_deploy_check.py, scripts/check_zero_drift.py
[Active System State]            origin/main = 44eb2af ; dev branch claude/html-pilot-L8rC3
[Variables Modified]             NONE. Read-only audit. No website source file, static asset,
                                 configuration schema or content component was modified.
[Upstream Generator Trace]       check.html, compliance.html : hand-authored, no upstream
                                   generator, direct edit is correct
                                 3 tracked field guide PDFs : NO GENERATOR HAS EVER EXISTED.
                                   The .docx in history (bc72a20) is a superseded predecessor,
                                   not the source (23,783 chars vs 14,042; 24 headings vs 7).
                                   The PDF is itself the upstream; scripts/generate_field_guides.py
                                   appends to it and is idempotent.
                                 combined overview PDF : out of scope, must remain unrouted
[Pending Technical Debt]         F-4 uncharacterised silent deployment skip (High)
                                 F-5 check-to-policy adoption unattributable (Low, accepted)
                                 F-6 combined overview unrouted (Low, by design)
[Production Deployment Status]   LIVE / BYTE-VERIFIED
                                 105 assets byte-identical to origin/main; 0 stale, 0 missing
                                 Guards: 128 checks, 0 failed, 1 skipped
[Next Trigger / Expected Input]  Vercel deployment log for prj_vSlMqS2nMaOUzTS6MpAAo4qYxbIR;
                                 owner decision on F-6
```
