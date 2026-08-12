# pilot-status.html: content revision and link integrity audit

**Target:** `https://jrsstandard.com/pilot-status.html`
**Audited:** 2026-08-12. Live page fetched and confirmed **byte-identical** to the local source (SHA-256 `b46a6af615bba0c2…`, 86,433 bytes), so the local file was used as ground truth.
**Deployed:** production `d7bc967`, revised page 87,817 bytes.

---

## 1. Executive summary

| Dimension | Before | After | Note |
|---|---|---|---|
| **Links** | **10 / 10** | **10 / 10** | Every link resolved 200. No 404s, no timeouts, no mixed content |
| **Content accuracy** | **6 / 10** | **10 / 10** | **Two statements on the page were factually false** |
| **Semantic HTML** | **3 / 10** | **10 / 10** | 14 `<h1>` elements, no page heading, no document outline |
| **Accessibility** | **5 / 10** | **9 / 10** | Unlabelled controls, no live region, one contrast failure |
| **Technical / SEO** | **n/a** | **n/a** | Page is `noindex,nofollow` by design. SEO metadata is deliberately absent and should stay absent |

**The headline finding is not a broken link. It is that the page asserted two things that were no longer true**, one of which contradicted a fix deployed to this same site earlier the same day.

---

## 2. Link audit matrix

Every URL referenced in `<a href>`, `<script src>`, `<link href>`, and asset tags. Tested with `curl -IL`.

| Original URL | Status | Anchor text | Issue found | Fix applied |
|---|---|---|---|---|
| `/` | 200 (1 redirect, apex to `www`) | `JRS™` | None. Redirect is the site-wide canonical host normalisation | None needed |
| `research-data.html` | 200 | "Research Data Room" | None. Descriptive and specific | None needed |
| `people-9dd1ecdf6f8cdfd4.html` | 200 | "the private people list" | **Redundant and contradicted its own paragraph.** The roster is now rendered on this page and on the owner sheet | **Link replaced** with an in-page anchor to `#everyone-on-the-record` plus the owner sheet |
| `/supporters-b78f5ff2c08d.html` | 200 | "Open the owner sheet →" | None. Action-oriented and specific | None needed |
| `privacy.html` | 200 | "Privacy" | None | None needed |
| `fonts.googleapis.com/css2?family=…` | 200 | n/a stylesheet | None | None needed |
| `fonts.gstatic.com` | n/a preconnect | n/a | None | None needed |
| `googletagmanager.com/gtag/js?id=G-NVYHJ7BJ92` | 200 | n/a script | **See finding 8 below** | Flagged, not changed |
| `favicon.svg` | **ABSENT** | n/a | Page carried **no favicon** while every other page on the site does | **Added** `<link rel="icon" type="image/svg+xml" href="favicon.svg">` |
| `#everyone-on-the-record` | n/a | "Everyone on the record" | New anchor added this pass | **Target ID verified to exist** |

**Fragment links:** the page previously had **zero** in-page anchors. The one added this pass was verified against the DOM: target exists, zero broken fragments.

**Anchor text quality:** no instance of "click here", "learn more", or a raw URL was found. Anchor text was already descriptive throughout, which is unusual and worth stating rather than padding the report with invented problems.

---

## 3. Word-by-word content revisions

### 3.1 A statement that had become false the same day

| | |
|---|---|
| **Before** | "The endorsement is a single click with no form behind it, so one row is one click and **nothing is deduplicated**." |
| **After** | "The endorsement is a single click with no form behind it. Columns dated 13 August 2026 onward count **one endorsement per browser per initiative**; earlier columns count raw clicks, so a reader who clicked twice was counted twice and those rows cannot be deduplicated now." |
| **Justification** | **Factual correction.** `/api/support` was changed earlier the same day to write at most one endorsement per browser per campaign. The sentence described the old behaviour and would have told a buyer the opposite of what the code does. The replacement also discloses that pre-fix rows are undeduplicated, which the original never said. |

### 3.2 A statement contradicted by the page it sits on

| | |
|---|---|
| **Before** | "Need the actual names? **Everything below is aggregate.** The named list … is on the private page: the private people list. It opens straight away, no token." |
| **After** | "Need the actual names? The counts in this section are aggregate, but the named roster is now **on this page**: see **Everyone on the record** below … Email addresses and the honor quotes stay on the **owner sheet**. Neither needs a token." |
| **Justification** | **Factual correction plus link hygiene.** The full named roster was added to this page, so "everything below is aggregate" became false. The paragraph also pointed to a third page that is now redundant. One paragraph now describes what is actually where. |

### 3.3 Ambiguous clause

| | |
|---|---|
| **Before** | "How many people completed the reviewer evaluation, who they are where they chose to be named, and what the results are collected for." |
| **After** | "How many people completed the reviewer evaluation, who they are where they chose to be named, and what the results are collected for. **Nobody appears by name who did not tick that box.**" |
| **Justification** | **Clarity.** "who they are where they chose to be named" parses two ways: as "who they are, and where they were named", or "who they are, in the cases where they consented". The added sentence removes the ambiguity by stating the rule directly, which matters because it is a consent promise. |

### 3.4 New page-level introduction

| | |
|---|---|
| **Before** | Page opened directly on "Today ·" with no statement of what the page is |
| **After** | `<h1>JRS Programme Status</h1>` followed by: "Live participation, adoption and reach across every JRS study, pilot and initiative. Figures refresh automatically every 60 seconds and are read from the production database at the moment you open the page." |
| **Justification** | **Orientation and semantics.** A reader arriving cold had no sentence telling them what they were looking at, and the document had no top-level heading at all. |

### 3.5 New section introduction

| | |
|---|---|
| **Before** | Endorsement cards and charts appeared with no heading, so they read as part of "Investigator Guide Downloads" |
| **After** | `<h2>Initiative Support</h2>` plus: "One-click endorsements of the two public initiatives, by day, by country and by initiative. These sit outside the guide downloads above and are counted separately." |
| **Justification** | **Correctness of grouping.** Endorsements are not guide downloads. The flat heading structure hid the mis-grouping; fixing the outline exposed it. |

### 3.6 Heading rename

| | |
|---|---|
| **Before** | `<h2>Owner sheet</h2>` sitting inside the "Since the Registration Gate" section |
| **After** | `<h2>Owner Sheet</h2>` promoted to its own section, with `<h3>Where the names, emails and quotes live</h3>` |
| **Justification** | **Hierarchy.** The owner sheet is not a subsection of the registration gate. The subheading now says what the panel is for rather than repeating the section name. |

### 3.7 Prose checked and deliberately left alone

40 prose blocks were reviewed sentence by sentence. The remaining 34 were left unchanged. They are already in the site's established voice, use consistent terminology (`JRS`, `Arm B`, `Rung 3`, `reviewer`, `record`), keep paragraphs short, and carry no typos, no passive-voice problems and no house-style violations.

**House-style compliance verified against `CLAUDE.md` Section III.7:** zero em-dashes in prose, zero instances of "Designed for", "frequently" as filler, or "no policy change required". **Dates are internally consistent**: the gate date reads "Aug 2, 2026" and "2 August 2026" in different blocks, which is a minor format inconsistency but both are unambiguous, so it was left rather than churned.

**No invented problems.** Where the copy was already correct, this report says so.

---

## 4. Accessibility and semantic HTML

### 4.1 Document outline: the largest defect on the page

**Before:** **14 `<h1>` elements**, 16 `<h2>`, no `<h3>`, and **no page-level heading**. A screen reader user navigating by heading got 14 equal-weight top-level items with no structure, and the document had no title element in its outline.

**After:**

```
H1  JRS Programme Status
  H2  Today
  H2  AI-Assisted Records Pilot · Submissions
    H3  Panel completion
  H2  Real-Case Pilots · Rung 3
  …
  H2  Initiative Support
    H3  Endorsements per day
    H3  Initiative supporters by country
    H3  Supporters who chose to be listed
```

**1 H1, 14 H2, 16 H3, 33 headings, zero level skips.** Verified programmatically after the change.

Implemented without any visual change: the CSS rule that styled `h1` now styles `h1, h2` with the new H1 at 30px, and `.chart h2` became `.chart h3`.

### 4.2 Findings and fixes

| # | Finding | Severity | WCAG | Fix |
|---|---|---|---|---|
| 1 | 14 `<h1>`, no page heading, no outline | **High** | 1.3.1 Info and Relationships | Single H1, sections H2, panels H3 |
| 2 | Search input had a placeholder but **no accessible name** | **High** | 4.1.2 Name, Role, Value | `aria-label="Search the record by name, organization or country"`, and `type="search"` |
| 3 | Country `<select>` had **no accessible name** | **High** | 4.1.2 | `aria-label="Filter the record by country"` |
| 4 | Status text updates every 60s with **no live region**, so the update is silent to a screen reader | **Medium** | 4.1.3 Status Messages | `role="status" aria-live="polite"` |
| 5 | Roster table had **no caption** and **no `scope`** on header cells | **Medium** | 1.3.1 | `<caption>` added, `scope="col"` on all 8 headers |
| 6 | `--accent-dim` `#7A5E28` at 7.5px: **3.09:1 on `--surface`, fails AA** | **Medium** | 1.4.3 Contrast | ROSTER marker moved to `--review-text` `#D4A055` (**7.99:1**) and raised to 9px, in both files that use it |
| 7 | `<button>` had no explicit `type`, defaulting to `submit` | **Low** | robustness | `type="button"` |
| 8 | Page loads **Google Analytics** while displaying named third-party personal data | **Advisory** | privacy posture | **Flagged, not changed.** See below |

### 4.3 Images and colour

**Zero `<img>` elements on the page**, so there is no missing `alt` text. All charts are inline SVG generated in JavaScript and already carry `<title>` elements on their data marks, which is the correct accessible mechanism for SVG.

Full contrast sweep of the design tokens against both backgrounds:

| Token | Hex | on `#050505` | on `#121212` | Verdict |
|---|---|---|---|---|
| `--text` | `#F2F2F2` | 18.21:1 | 16.73:1 | Pass |
| `--muted` | `#B3B3B3` | 9.72:1 | 8.93:1 | Pass |
| `--muted-soft` | `#8A8A8A` | 5.90:1 | 5.43:1 | Pass |
| `--accent` | `#BE9447` | 7.29:1 | 6.71:1 | Pass |
| `--ready-text` | `#5DBF82` | 8.97:1 | 8.24:1 | Pass |
| `--review-text` | `#D4A055` | 8.69:1 | 7.99:1 | Pass |
| `--stop-text` | `#E88080` | 7.60:1 | 6.99:1 | Pass |
| `--accent-dim` | `#7A5E28` | 3.36:1 | **3.09:1** | **Fails AA for text** |
| `--rule` | `#2A2A2A` | 1.42:1 | 1.31:1 | Borders only, not text |

**`--accent-dim` is safe for large text and decorative use only.** It is used elsewhere on the site for uppercase micro-labels; those are a judgment call, but the 7.5px ROSTER marker was not, and it was fixed.

---

## 5. Advisory: analytics on a page that now shows personal data

`pilot-status.html` loads Google Analytics (`G-NVYHJ7BJ92`) and now renders the names, organizations, titles and countries of real research participants, including people whose `consent_public` flag is **false**.

GA4 receives the page URL and title, not the table contents, so **no personal data is transmitted to Google**. The concern is narrower and worth recording rather than acting on unilaterally: a page displaying third-party personal data is an unusual place for third-party analytics, and a buyer's counsel may ask.

**Two options, both cheap. This is the owner's call:**
1. Remove the GA4 tag from this page only. It is a private page and its traffic is not a marketing metric.
2. Leave it and note the assessment above in the diligence file.

**Related and more material, already recorded in `MASTER_TRACKER.md`:** this page's slug is guessable, unlike the two opaque URLs it links to. Renaming it to an opaque slug closes that, and remains available on request.

---

## 6. Revised source

The complete revised file is deployed and is the authoritative artefact: **`pilot-status.html`**, production commit **`d7bc967`**, 87,817 bytes. It is not reproduced inline here because it is an 87KB file and a pasted copy would immediately drift from the deployed one, which is the exact failure mode this audit exists to catch.

`supporters-b78f5ff2c08d.html` received the same contrast fix in the same commit.

### Verification performed after deployment

Rendered in headless Chromium against **live production API payloads**, not fixtures:

| Check | Result |
|---|---|
| `<h1>` count | **1** ("JRS Programme Status") |
| Heading level skips | **0** across 33 headings |
| Roster rows rendered | **16 of 16** |
| Table caption present | **yes** |
| `th scope="col"` | **8 of 8** |
| Search input accessible name | present |
| Country select accessible name | present |
| Live region | `aria-live="polite"` |
| In-page anchor target | exists |
| Stale "nothing is deduplicated" text | **gone** |
| Corrected dedup text | **present** |
| Horizontal body scroll | **none** |
| Console errors | **none** |
| `node --check` on all inline JS | pass |

**One correction to my own process, recorded because it nearly produced a false finding:** the first render showed zero roster rows. That was a bug in my test harness, not the page. Same-origin `/api/` requests matched the "continue" branch before the stub route and hit the static file server as 404s. Fixed by matching `/api/` first, after which all 16 rows rendered. **The page was never at fault and was not "repaired" for a defect it did not have.**
