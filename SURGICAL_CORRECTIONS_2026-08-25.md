# Surgical Corrections: Site Grade and Homepage Layout

**Date:** 2026-08-25
**Basis:** `scripts/grade_pages.py` over 72 pages, `scripts/check_live_links.py`, and a
structural measurement of `index.html`. Every item below names the file and the measured
condition. Nothing here is an impression.

**Nothing in this document has been applied.** It is a list to approve, reject or reorder.

---

## PART A. SITE-WIDE CORRECTIONS

Ordered by how much each one costs you, not by how many pages it touches.

### A1. Two private for-sale pages are sending their URLs to Google Analytics

**Files:** `acquisition-9f3c2a7d4b.html`, `vp-7c1f9a4e8d2b6035.html`
**Measured:** 2 analytics references each. Both also lack `<meta name="referrer">`.

These pages are secured by an opaque slug and nothing else. **GA receives the full path of
every view**, which puts the slug into a third-party system, into your GA property's page
report, and into any export or integration downstream. `programme-status` had its tag
removed on 2026-08-12 for exactly this reason and carries a comment saying so; these two
were missed.

The referrer gap compounds it: a click from either page to an external site sends the slug
in the `Referer` header.

**Correction:** remove the GA snippet from both. Add `<meta name="referrer" content="no-referrer">`
to both. Match what `programme-status-9872fb93cc94.html` already does.

**Priority: do this first.** It is the only item on the list that leaks something.

### A2. The three offer pages do not connect to the enterprise track

**Files:** `audit-request.html`, `governance-request.html`, `calibration-request.html`
**Measured:** each fails four dimensions: no dual-track band, no route to the engine
documentation, no route to an enterprise inquiry, no terms or boundaries link.
**Grade:** B, 74% each.

A buyer who lands on the $500 governance page has no path to the API, no path to a
licensing conversation, and no path to your terms. These are the three pages that took
**13 recorded purchase attempts**. They are the highest-intent surfaces you own and they
are dead ends in three directions.

**Correction:** add the canonical `JRS DUAL TRACK v1` band, plus footer links to
`review-engine.html`, `enterprise.html#enterprise-inquiry` and `terms.html`.

### A3. `org-pilot.html` is the weakest commercial page and it is your enterprise entry point

**File:** `org-pilot.html`
**Measured:** fails seven dimensions. Two `<h1>` elements. No skip link. No dual-track band.
No route to the engine documentation. No evidence-stage statement. No capture path on the
page. No terms link.
**Grade:** C+, 63.8%. Lowest of the nine commercial pages.

`enterprise.html` now sends prospects here as the **first** call to action, above the paid
tiers, on the argument that field evidence from a buyer's own records is what an enterprise
conversation needs. The page does not carry that argument, does not say the engine is
unvalidated, and gives a prospect no way to say who they are.

**Correction:** rebuild the page head and foot. One `<h1>`. Add the dual-track band, the
evidence-stage paragraph already used on `enterprise.html` and `review-engine.html`, links
to `review-engine.html` and `terms.html`, and an inquiry path.

### A4. `engagement.html` is unreachable

**File:** `engagement.html`
**Measured:** **0 inbound links** from any page. In the sitemap, and now indexable, but
nothing on the site points at it.
**Grade:** C+, 66.1%.

It is your engagement-terms page. A buyer reading an offer page cannot reach it, and a
search engine has one weak signal for it.

**Correction:** link it from the three offer pages and from `enterprise.html`. This is the
same defect the three request pages had before 2026-08-25, and the fix is the same.

### A5. Neither `index.html` nor `review-engine.html` can capture a visitor

**Files:** `index.html`, `review-engine.html`
**Measured:** no `<form>`, no `/api/checkout` link, no `/api/enterprise-inquiry` link.

`index.html` carries 24,772 words and gives the reader nowhere to leave a name.
`review-engine.html` is your API documentation, the page a technical evaluator reads
hardest, and it ends in a `mailto:` link.

**Correction:** put the enterprise inquiry form on `review-engine.html` directly, not a link
to it. On `index.html`, add one capture block inside the dual-track band area.

### A6. 42 pages have no skip-to-content link

**Measured:** 42 of 72 pages. Present on the others.

Keyboard and screen-reader users tab through the full 12-item navigation on every page
before reaching content. On `index.html` that is 12 stops before the first of 84 sections.

**Correction:** add the same `#main-content` skip link those 30 pages already carry. One
line per file, mechanical.

### A7. 20 pages have no canonical tag, 17 have no meta description

**Measured:** canonical missing on 20; description missing or under 40 characters on 17.
Overlapping sets, including `404.html` and every keyed participant surface.

For the public pages this is direct search cost. For the keyed surfaces it matters less,
but a canonical tag on a keyed page also protects against a `?k=` URL being indexed as a
separate variant.

**Correction:** add both to every public page. For keyed surfaces, canonical only.

### A8. 33 public pages never mention the enterprise track, 33 never say the material is free

**Measured:** 33 pages fail "connects to the enterprise track"; 33 fail "free access stated
or implied". Largely the same pages: `about.html`, `codebook.html`, `datasets.html`,
`evidence-ledger.html`, `finding.html`, `decision-reconstruction-risk.html` and the
reference hub.

Both tracks are invisible on half your public surface. A practitioner does not learn the
material is free; an enterprise reader finds no path to licensing.

**Correction:** the footer already carries both. Extend the canonical footer to these
pages rather than editing 33 bodies.

### A9. Nine pages carry more than one `<h1>`

**Files:** `bench-review.html`, `coauthor.html`, `contributor.html`, `honor.html`,
`jrsstandard.html`, `org-pilot.html`, `recheck.html`, `reviewer/completion.html`, and one more.

**Correction:** demote the second to `<h2>`. Purely mechanical.

### A10. `bench-admin.html` and `coauthor.html` have no footer

**Correction:** add the canonical footer, or confirm these are intentionally chromeless
owner tools and exempt them explicitly.

### A11. `404.html` is not in the sitemap and has no inbound links

**Measured:** flagged by the grader as a public page.

This is a **grader defect, not a site defect**. A 404 page should be in neither. Recording
it so the report is not read as requiring a fix. I will exclude `404.html` from the public
role on the next grader pass.

---

## PART B. HOMEPAGE VISUAL LAYOUT

### The measurement that drives every item below

| Property | Value |
|---|---|
| Visible words | **24,772** |
| Sections | **84** |
| File size | **613 KB** |
| Real headings | 1 `<h1>`, 17 `<h2>`, 1 `<h3>` |
| Section headings that are **`<div>`, not headings** | **77** |
| Images | **1** |
| Forms | **0** |
| In-page anchors | 4 |
| Inline `style=` attributes | 2,482 |

**This is a documentation library rendered as a single page.** At an average adult reading
speed it is roughly a **100-minute** read. No GRC executive, no investigator and no
researcher consumes that, so in practice every visitor sees the first screen and leaves
with whatever impression it gave.

### B1. 77 of 84 section headings are not headings

**Measured:** `<div class="section-head">` × 77 against `<h2>` × 17.

A screen reader's heading list shows 19 entries for an 84-section page, so a non-visual
user cannot navigate it at all. Search engines see one `<h1>` and almost no structure
across 24,772 words, which is a large part of why the page ranks on nothing specific.

**Correction:** change `<div class="section-head">` to `<h2 class="section-head">`. The CSS
selector `.section-head` is unchanged, so **there is no visual change whatsoever**. This is
the single highest-value correction on the page and it is a find-and-replace.

### B2. The second thing a visitor sees is 1,413 words

**Measured:** section 1, "Twenty-Record Evaluation Study", 1,413 words, beginning at 2.1%
of the page.

The dual-track band now sits at 1.1%, which is correct. Immediately beneath it the reader
hits the longest single block in the first quarter of the page.

**Correction:** cut the visible portion to roughly 150 words with the finding and one link
to the full study, and move the remainder behind that link or into a `<details>` element.

### B3. Five sections exceed 1,000 words each

| Section | Words | Position |
|---|---|---|
| Cumulative Operational Effect | **1,928** | 38% |
| The Ten Conditions | **1,580** | 29% |
| Twenty-Record Evaluation Study | **1,413** | 2% |
| Free Review Resources | **1,190** | 50% |
| Common Documentation Review Failures | **1,129** | 10% |
| Documentation Review Examples | 1,014 | 59% |
| Reviewer Walkthroughs | 1,006 | 63% |

Together: **9,260 words, 37% of the page, in seven blocks.**

**Correction:** each of these is a page. Move them to their own URLs, leave a 100-word
summary and a link. This is also the SEO fix: seven focused pages can rank; one 24,772-word
page cannot.

### B4. Three sections say "what this is not", in three different places

**Measured:** "What JRS Does Not Do" at 22%, "What This Is Not" at 26%, "What JRS Is Not"
at 98.5%.

A reader who reaches the third has been told three times, in three voices. A reader who
sees only the first does not know the other two exist.

**Correction:** merge into one "Scope and limits" section placed immediately after the
dual-track band, where the disclaimers do the most credibility work rather than the least.

### B5. "Implementation Maturity Stages" and "Implementation Maturity Levels"

**Measured:** section 51 (209 words) and section 56 (363 words), five sections apart.

Two headings, near-identical names, same subject. A reader cannot tell whether these are
the same thing described twice or two different models.

**Correction:** merge, or rename so the distinction is visible in the heading itself.

### B6. One section has an empty heading

**Measured:** section 66, 19 words of content, no heading text.

**Correction:** give it a heading or fold it into its neighbour.

### B7. Two sections are 16-word stubs

**Measured:** "Access" (16 words, 27%) and "About JRS" (16 words, 96%).

A heading followed by one line reads as unfinished.

**Correction:** fold both into adjacent sections.

### B8. One image on a 613 KB page

**Measured:** 1 `<img>`, 3 tables, 24,772 words.

The page is an unbroken wall of prose. The one thing that would help a scanning reader
most, a diagram of the five review conditions, is not on the page. `review-engine.html`
has a table doing that work; the homepage does not.

**Correction:** promote the five-conditions table into the first screen area, immediately
below the dual-track band. Structure, not decoration, and it is content you already own.

### B9. No in-page navigation for 84 sections

**Measured:** 4 in-page anchors, 12 nav items, sticky navigation present.

The navigation is sticky, which is good, but it addresses a 12-item site map, not the 84
sections beneath it.

**Correction:** add a sticky section index on the left at desktop width, generated from the
headings created in B1. This depends on B1 being done first, which is another reason to do
B1 first.

### B10. 2,482 inline style attributes

**Measured:** 2,482 `style="` occurrences.

Every spacing and colour decision is made 2,482 times independently. A change to how a
callout looks is 2,482 places to check, so in practice it never gets changed and the page
drifts visually as it grows.

**Correction:** not urgent and not surgical. Recorded because it is why B2 through B8 will
keep recurring. The five or six repeated patterns should become classes.

### B11. Zero forms on the homepage

**Measured:** 0 `<form>`. Same finding as A5, stated here because it is a layout decision
as much as a conversion one.

24,772 words of authority-building and no point at which a convinced reader can act.

**Correction:** one capture block after the dual-track band, and one repeated at the end.

---

## RECOMMENDED ORDER

| # | Item | Effort | Why first |
|---|---|---|---|
| 1 | A1 analytics on the two private pages | 10 min | Only item that leaks anything |
| 2 | B1 headings become real headings | 20 min | No visual change, unlocks B9, largest a11y and SEO gain |
| 3 | A2 offer pages connect to the track | 30 min | Highest-intent pages, 13 recorded attempts |
| 4 | A5 + B11 capture on index and review-engine | 1 hour | Nothing on the homepage can capture a visitor |
| 5 | A3 rebuild org-pilot | 1 hour | It is the promoted enterprise entry point |
| 6 | A4 link engagement.html | 10 min | Currently unreachable |
| 7 | B4 + B5 + B6 + B7 merge duplicates and stubs | 45 min | Removes contradiction and dead weight |
| 8 | B2 + B3 split the seven long blocks | half day | The real fix for a 100-minute homepage |
| 9 | A6 + A7 + A9 + A10 mechanical hygiene | 1 hour | Bulk, low risk, scriptable |
| 10 | B8 promote the conditions table | 30 min | Content you already own |
| 11 | B9 section index | 1 hour | Needs B1 |
| 12 | B10 inline styles to classes | ongoing | Not surgical |

**Items 1 to 6 are a single working day and address every finding that costs you a buyer or
leaks a slug.**
