# FINAL ENGAGEMENT.HTML REMEDIATION AND VERIFICATION REPORT

**Date:** 2026-09-05
**Scope:** one page — `engagement.html`. One correction pass, one live verification, no other website changes.

---

## 1. EXECUTIVE VERDICT

**VERDICT A: CORRECTION AND LIVE VERIFICATION COMPLETE**

`engagement.html` was corrected, committed as `40d14bb`, merged as `7fdc8eb`, deployed, and directly verified against the live production response body at `https://www.jrsstandard.com/engagement.html`. The live body is byte-identical to `origin/main` at 36,913 bytes.

Every active founder-service pathway is gone: zero `class="cta-primary"` elements, zero `mailto:` links carrying a `subject=` parameter, zero forms, zero buttons, zero inputs. The historical record is intact: the three-row fee table, the Data Isolation Guarantee, the data-handling section and all four research figures survive. The page shrank by 150 bytes, which is the two removed links.

No public website file other than `engagement.html` was modified by this task.

---

## 2. BASELINE

| Item | Value |
|---|---|
| Starting branch | `claude/html-pilot-L8rC3` |
| Starting HEAD | `092609e44539b96698f0be5497f89c0801032e78` |
| `origin/main` at start | `6e377fd58d71b25a81e3868335ebd79bcdb4597a` |
| Working tree | clean, 0 entries |
| `engagement.html` on the production branch | present, 37,063 bytes; local copy byte-identical to `origin/main` |

---

## 3. BASELINE FINDINGS

Every active or potentially active founder-service element found before correction.

### Action elements

| Element | Detail |
|---|---|
| `mailto:` links | **3** total, **2** with pre-filled `subject=` and `body=` fields |
| `class="cta-primary"` anchors | **2** |
| `<form>` / `<button>` / `<input>` | 0 / 0 / 0 |

**CTA 1, line 273:** `Book a twenty-minute record read →` → `mailto:info@jrsstandard.com?subject=Twenty-minute%20record%20read&body=Record%20type%3A%0ATimeframe%3A%0ATwo%20or%20three%20times%20that%20suit%20you%3A`

**CTA 2, line 281:** `Request scope and invoice →` → `mailto:info@jrsstandard.com?subject=Engagement%20scoping&body=Record%20type%3A%0AApproximate%20volume%3A%0ATimeframe%3A%0APurchase%20order%20required%3A%0ANDA%20required%20before%20scoping%3A`

### Present-tense language implying current availability

| Location | Wording |
|---|---|
| Lede, line 192 | "How an engagement **works**." |
| Line 194 | "**This page exists to be forwarded.** If you **are considering** a record-defensibility review, your procurement team and your counsel **will want** the fee basis…" |
| Line 220 | "Every engagement **is** fixed fee, agreed in writing **before any work begins**. There **is** no hourly rate…" |
| Line 231 | "**Invoiced on agreement. Purchase orders accepted.** Payment terms **are** net 30 unless your procurement process **requires** otherwise…" |
| Line 264 | "**Engagements are not subcontracted.**" |
| Heading, line 266 | "Before you commit anything" |
| Line 268 | "…it **is not** a discovery call. **Send** one de-identified record… **You see** exactly what a finding looks like… before deciding whether **to pay for four more**." |
| Line 270 | "…the record **is deleted** when the call **ends**." |
| Heading, line 276 | "Starting" |
| Line 278 | "**Email** with your record type… **You receive scope, the fixed fee, turnaround and an invoice in one reply, within one business day.** No discovery call **is** required…" |
| Line 284 | "**Not ready for that?** The seven-point record check **is** public…" |
| Status strip, line 287 | "…these engagements **are being tested** through controlled market experiments. **You would be among the first**…" |

### Term counts at baseline

Book 1 · Request 9 · Scope 16 · Invoice 3 · Purchase 2 · Start 3 · Contact 0 · Schedule 0 · Engagement 14 · Turnaround 2 · Fee 11 · Pricing 1 · Available 1 · "being tested" 1 · currently 0 · "are performed" 0 · "are not subcontracted" 1

---

## 4. EXACT CORRECTIONS MADE

Fourteen edits, all within `engagement.html`.

| ID | Original | Corrected | Reason | Classification |
|---|---|---|---|---|
| C-1 | `<h1 class="lede">How an engagement works.</h1>` | `How an engagement worked.` | Present tense framed the page as a live offer sheet | Tense |
| C-2 | "This page exists to be forwarded. If you are considering a record-defensibility review…" | "This page is retained as a historical record of the former engagement model. While the pathway was open, a procurement team or counsel evaluating a record-defensibility review needed… The engagements themselves are closed to new requests." | The page invited a live procurement evaluation | Archival reframe |
| C-3 | "Every engagement **is** fixed fee, agreed in writing before any work **begins**…" | "Every engagement **was** fixed fee… before any work **began**…" | Fee basis stated as a current offer | Tense |
| C-4 | "**Invoiced on agreement. Purchase orders accepted.** Payment terms **are** net 30…" | "**Invoicing followed agreement of scope, and purchase orders were accepted.** For engagements agreed in writing before 4 September 2026, payment terms are net 30…" | Payment terms read as currently available; now scoped to pre-existing engagements | Tense + scoping |
| C-5 | "Engagements **are not** subcontracted." | "Engagements **were performed personally and were not** subcontracted." | Implied ongoing delivery | Tense |
| C-6 | `<h2>Before you commit anything</h2>` | `<h2>How the introductory record read worked</h2>` | Heading addressed a prospective buyer | Archival reframe |
| C-7 | "…it **is not** a discovery call. **Send** one de-identified record… **You see**… before deciding whether **to pay for four more**." | "…it **was not** a discovery call. **A client sent** one… **so they saw**… before deciding whether to pay for four more." | Second-person instructions to act now | Tense + person |
| C-8 | "…the record **is deleted** when the call **ends**." | "…the record **was deleted** when the call **ended**." | Describes a live process | Tense |
| C-9 | The `Book a twenty-minute record read →` CTA block | "This pathway is closed. Neither the record read nor a scoping request can be initiated from this page." | An actionable booking link on a closed page | **CTA removal** |
| C-10 | `<h2>Starting</h2>` | `<h2>How an engagement started</h2>` | Heading invited initiation | Archival reframe |
| C-11 | "**Email** with your record type… **You receive scope, the fixed fee, turnaround and an invoice in one reply, within one business day.**" | "**A client emailed** their record type… **Scope, the fixed fee, turnaround and an invoice came back** in one reply, within one business day." | A direct promise of scope, fee, turnaround and invoice to a current visitor | Tense + person |
| C-12 | The `Request scope and invoice →` CTA block | *(removed)* | An actionable scoping-and-invoice link with pre-filled procurement fields | **CTA removal** |
| C-13 | "Not ready for that? The seven-point record check **is** public…" | "The seven-point record check **remains** public… It is open now and is the place to start." | The framing presupposed the reader was choosing between a purchase and the free check | Reframe |
| C-14 | "…these engagements **are being tested** through controlled market experiments. **You would be among the first**…" | "While this pathway was open… these engagements **were being tested**… That was stated at the time… **The pathway is now closed.**" | Stated the engagements were currently under commercial test | Tense |

---

## 5. SCOPE CONTROL

**Files modified by this task**, from `git diff --name-only 6e377fd 7fdc8eb`, attributed by the commit that introduced each:

| File | Introduced by | This task? | Deployed? |
|---|---|---|---|
| `engagement.html` | `40d14bb` | **YES — the authorized target** | Yes |
| `scripts/apply_engagement_archival_2026-09-05.py` | `40d14bb` | YES — the deterministic applier | **No** — `scripts/` excluded by `.vercelignore` |
| `research/MASTER_TRACKER.md` | `40d14bb` | YES — log entry only | **No** — `*.md` excluded |
| `FINAL_INDEPENDENT_FULL_SITE_AUDIT_2026-09-05.md` | `092609e` | **NO** — pre-existing branch commit, carried into `main` by this merge | **No** — `*.md` excluded |
| `research/FINAL_SURGICAL_CORRECTION_REPORT_2026-09-05.md` | `bf7407c` | **NO** — pre-existing branch commit, carried into `main` by this merge | **No** — `*.md` excluded |

**Confirmation: no public website file other than `engagement.html` was modified by this task.** The two `.md` reports appear in the merge range because they were committed to the branch in earlier turns, at the repository stop hook's instruction, and this PR carried them to `main`. They are reporting artifacts, excluded from deployment, and are distinguished here from changes made by this remediation as the protocol requires.

**`git diff --name-only` at the working-tree stage returned `engagement.html` and nothing else.**

---

## 6. TEST RESULTS

| Metric | Value |
|---|---|
| Total checks | 123 |
| Passed | 122 |
| Failed | **0** |
| Skipped | 1 (not reachable, not drift) |
| Guards modified | **NONE** |

**Two gates in my own applier were wrong and were narrowed rather than disabled.** Neither is a repository guard; both are refusal conditions inside the one-shot script.

1. Banning the bare string `cta-primary` also matched four CSS rule declarations and the shared mobile tap-target rule, so the script refused on a false positive. Narrowed to `class="cta-primary"`, the element usage.
2. Comparing every numeric token on the page failed, because removing two `mailto:` links deletes their percent-encoded sequences (`%20`, `%3A`, `%0A`) and the new wording adds a date. Narrowed to the figures that actually matter: `83.9%`, `72.7 to 95.1`, `384 graded reads`, `95% confidence interval`, `completers_detection`, `net 30`.

---

## 7. GIT RESULTS

| Item | Value |
|---|---|
| Commit SHA | `40d14bbf2c5a6af77a6600dbc833c25a48a3b4a3` |
| Push | **YES** — `092609e..40d14bb` |
| Pull request | **#17**, `mergeable_state: clean` |
| Merge | **YES** |
| Merge commit | `7fdc8eb5dede1239b53440f8e1d537f9989cd9ab` |
| Production commit | `7fdc8eb`, and `origin/main` contains `40d14bb` |

Live on the second poll; poll 1 returned the pre-correction 37,063 bytes.

---

## 8. LIVE VERIFICATION RESULTS

**Production URL reviewed:** `https://www.jrsstandard.com/engagement.html`

| Category | Result | Evidence |
|---|---|---|
| **A. Access** | **PASS** | `HTTP/2 200`, `content-type: text/html; charset=utf-8`, 0 redirects, 36,913 bytes |
| **B. Archival status** | **PASS** | "Closed to new requests" 1 · "These reviews are no longer offered" 1 · "retained as a historical record of the former engagement model" 1 · "This pathway is closed" 1 · "The pathway is now closed" 1 |
| **C. Active service pathway** | **PASS** | Book 0 · "Book a" 0 · "Request scope" 0 · "Request an" 0 · "Get scope" 0 · "Get an invoice" 0 · "you will receive" 0 · "you will get" 0 · "available now" 0 · "You receive scope" 0 · "Engagements are not subcontracted" 0. Three residual matches classified in section 9 |
| **D. CTA test** | **PASS** | `class="cta-primary"` 0 · `mailto:` with `subject=` **0** · `<form>` 0 · `<button>` 0 · `<input>` 0. The single remaining `mailto:` token is inside a telemetry regex (`mailto:\|tel:\|javascript:`), not a link. All 13 remaining anchors point to `review-engine.html`, `enterprise.html#enterprise-inquiry`, `investigator-guides.html`, `training.html`, `check.html`, `terms.html`, `org-pilot.html` or the page itself — none is a founder-service intake mechanism |
| **E. Discoverability** | **PASS** | Live `<meta name="robots" content="noindex,nofollow">` · live `sitemap.xml` contains `engagement.html` **0** times · **zero** inbound links from any non-retired page in the repository at `origin/main` |
| **F. Archival content** | **PASS** | All three fee-table engagements present; Data Isolation Guarantee 1; "ephemeral working memory" 1; `83.9%` 1; `72.7 to 95.1` 1; `384 graded reads` 1; `pre-registered analysis plan` 1; "Five working days" 1; "Ten working days" 1. 36,913 bytes — a 150-byte reduction, not an emptying |
| **G. Production match** | **PASS** | **Byte-level comparison performed.** `cmp` between the fetched body and `git show origin/main:engagement.html`: **byte-identical**, 36,913 bytes |

---

## 9. REMAINING ACTIVE-SERVICE LANGUAGE

Every live phrase that could arguably imply a current founder-delivered service. Nothing ambiguous is hidden.

| Phrase | Count | Context | Classification | Reasoning |
|---|---|---|---|---|
| `turnaround` | 1 | Fee-table column header: "Engagement / Fee / Turnaround" | **Archival** | A column heading over three rows whose action cell reads "Closed". The table is the historical record the protocol directs be preserved |
| `turnaround` | 2 | "…**Scope, the fixed fee, turnaround and an invoice came back** in one reply, within one business day." | **Archival** | Past tense, under the heading "How an engagement started", immediately below "This pathway is closed. Neither the record read nor a scoping request can be initiated from this page." |
| `being tested` | 1 | "**While this pathway was open**, commercial demand had not been established and these engagements **were being tested** through controlled market experiments. That was stated at the time… **The pathway is now closed.**" | **Archival** | Explicitly bounded to the period when the pathway was open, and closed by the following sentence |
| `Engagement terms` | 1 | Related-links nav, a self-link to `engagement.html` | **Neutral** | A label on the archival page's own entry in a link row |
| `enterprise inquiry` | 3 | Links to `enterprise.html#enterprise-inquiry` | **Irrelevant** | The live licensing, technical-integration and acquisition pathway, which is the intended destination |
| `Fee` / `Fees` | 11 → present | Fee-table header and the historical fee paragraph | **Archival** | Now reads "Every engagement **was** fixed fee… before any work **began**" |

**No phrase on the live page classifies as active.**

### One observation, out of scope

**OUT OF SCOPE. NOT MODIFIED.** The four `.cta-primary` CSS rules in this page's inline `<style>` blocks are now unused by any element on the page, since both anchors that used the class are gone. Removing them would be an unrelated edit under this pass's scope control. This conflicts with the CLAUDE.md rule requiring orphaned CSS to be removed when encountered; the scope control is the more specific and more recent instruction, so the rules stand and are reported rather than silently deleted.

---

## 10. ARCHIVAL INTEGRITY

The page now functions coherently as a historical record. Read top to bottom on the live body:

1. **"Closed to new requests"** — "These reviews are no longer offered. JRS is maintained as an independently usable methodology and an intellectual-property asset, not as a review service, and nothing on this page is open for a new request."
2. **"How an engagement worked."** — "This page is retained as a historical record of the former engagement model. While the pathway was open, a procurement team or counsel… needed the fee basis, the data handling, and who owned the output. All three are recorded below. The engagements themselves are closed to new requests."
3. **Fees, the three-row table, data handling, ownership** — preserved, in the past tense, with every historical figure intact.
4. **"How the introductory record read worked"** — "Twenty minutes, no charge, and it was not a discovery call. A client sent one de-identified record in advance…"
5. **"This pathway is closed. Neither the record read nor a scoping request can be initiated from this page."**
6. **"How an engagement started"** — "A client emailed their record type… Scope, the fixed fee, turnaround and an invoice came back in one reply…"
7. **"Operational validation."** — "While this pathway was open… The pathway is now closed."
8. **A live onward path** — the seven-point record check "remains public and ungated… It is open now and is the place to start", and the related-links row points to the Review Engine API, the enterprise inquiry and the Mini-Pilot.

The page is neither broken nor emptied. It explains what the offering was, what it cost, how records were handled and who owned the output, and states four times over that it is closed.

---

## 11. OUT-OF-SCOPE FILE INTEGRITY

Comparing `origin/main` before this task (`6e377fd`) with `origin/main` now (`7fdc8eb`):

| File | Status |
|---|---|
| `index.html` | **UNCHANGED** |
| `enterprise.html` | **UNCHANGED** |
| `review-engine.html` | **UNCHANGED** |
| `research.html` | **UNCHANGED** |
| `pilot.html` | **UNCHANGED** |
| `training.html` | **UNCHANGED** |
| `terms.html` | **UNCHANGED** |
| `audit-request.html` | **UNCHANGED** |
| `governance-request.html` | **UNCHANGED** |
| `calibration-request.html` | **UNCHANGED** |
| `sitemap.xml` | **UNCHANGED** |

Also unchanged by this task: `research-summary.html`, `results.html`, `finding.html`, `evidence-ledger.html`, `datasets.html`, `codebook.html`, `questions.html`.

The two `.md` reports that appear in the merge range were introduced by **pre-existing branch commits** `bf7407c` and `092609e`, not by this task, as attributed in section 5.

---

## 12. FINAL DECLARATION

1. **`engagement.html` corrected:** YES — 14 edits, 37,063 → 36,913 bytes.
2. **Correction committed:** YES — `40d14bbf2c5a6af77a6600dbc833c25a48a3b4a3`.
3. **Merged:** YES — `7fdc8eb5dede1239b53440f8e1d537f9989cd9ab`, PR #17.
4. **Deployed:** YES — production commit `7fdc8eb`; live on the second poll.
5. **Live production page directly inspected:** YES — `https://www.jrsstandard.com/engagement.html` retrieved by `curl`, body written to disk, all findings read from the saved file, and byte-compared against `origin/main` with `cmp`.
6. **Any active founder-service pathway remaining:** **NO.** Zero `class="cta-primary"` elements, zero `mailto:` links with a `subject=` parameter, zero forms, zero buttons, zero inputs. All three residual keyword matches classify as archival and are set out in section 9.
7. **Any other website changes made:** **NO.** The only public website file modified by this task is `engagement.html`. The other files in the merge range are non-deployed reporting artifacts and a one-shot script, two of which predate this task.
