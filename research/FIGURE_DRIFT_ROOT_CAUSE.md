# Forensic audit: top vs bottom figure inconsistency

**Diagnostic only. No file was modified, no patch applied.** 2026-08-14.

---

## Summary in one paragraph

The aggregation is not broken. Server-side and client-side counts agree exactly
everywhere they read the same view. The defect is in the **publishing layer**:
the site has exactly one mechanism for binding a published number to its source,
the `data-panel` attribute, and it is applied to **16 spans across the whole
repository** against roughly **130 sentences that state the same class of fact**.
Every figure on the site is therefore in one of two states, bound or frozen, and
which state it is in was decided by whoever last edited that paragraph. Top-of-page
cards are where people remembered to bind. Body prose is not. The two sets diverge
by construction and re-diverge after every patch, because a patch edits a literal
instead of adding a binding.

A second factor explains why the fixes did not hold: **the two number sets are not
the same population.** Making them equal would make one of them false.

---

## 1. Data flow mapping

### Path A: bound figures (top of page)

```
Supabase views  pilot_progress, armb_progress, bench_labels
      |
      v
api/panel-stats.js  handler()            lines 90-139
      |  completersA = pilot_progress where total_reads >= 24
      |  completersB = armb_progress  where reads       >= 24
      |  completers  = completersA + completersB
      |  countries   = resolvePanelGeo(codesA ++ codesB)      api/_panel-countries.js
      v
JSON: {reviewers, completers, countries, continents, registered,
       detection_completers, detection_countries, comparison_completers}
      |
      v
per-page binder:  document.querySelectorAll('[data-panel]')
      research.html:283   access.html:217   org-pilot.html:610
      investigator-guides.html:207   acquisition-9f3c2a7d4b.html:211
      |
      v
16 <span data-panel="..."> elements repo-wide
```

### Path B: static figures (body prose, further down the same pages)

```
a human typed a number into the HTML on some date
      |
      v
it renders forever
```

There is no path B. That is the finding. Path B has no source, no refresh, and
no test.

### Path C: the owner dashboard

`programme-status-9872fb93cc94.html` carries **zero** `data-panel` elements. Its
top cards call `/api/panel-stats` directly in `loadPanel()` (line 1525) and set
`textContent` by id; its lower sections query PostgREST directly and aggregate in
the browser (`loadDetection()` line 510, `loadArmB()` line 630). Those two are a
genuinely different design from paths A and B, which is a third convention for
the same job.

---

## 2. State and aggregation audit

Each item was tested, not assumed.

| Suspected cause | Verdict | Evidence |
|---|---|---|
| Divergent aggregation, client vs server | **RULED OUT** | Both compute `>= 24` on the same view and return the same answer. Live: `panel-stats.detection_completers` = 16; browser aggregation of `pilot_progress` = 16. `comparison_completers` = 20; browser aggregation of `armb_progress` = 20. Exact match. |
| Different date or status boundaries | **RULED OUT** | Neither path filters on date or status. Both filter on read count alone. |
| Race conditions / mismatched re-render | **RULED OUT** | Rendered the dashboard headless with all 13 endpoints stubbed: 0 page errors, 0 unstubbed requests. Every loader owns its own element ids and writes only its own; there is no shared mutable store and no cross-loader ordering dependency. `refresh()` (line 1591) fires all 16 loaders in parallel and each is self-contained. |
| Cached / stale store values | **RULED OUT as the cause** | `panel-stats` sets `Cache-Control: max-age=60, s-maxage=60`. A 60-second skew cannot produce a 36 versus 16 difference. |
| Global state mutation bypassing one section | **RULED OUT** | No global stats object exists. Each loader declares its own local `setv`; the code comments at line 1528 record a past bug from assuming otherwise. |
| Cohort filtering: how suppressed / inactive / zero cohorts are handled | **CONFIRMED CONTRIBUTING** | This is the real divergence, and it is a *scope* divergence, not a bug. See below. |
| Binding coverage of published prose | **CONFIRMED ROOT CAUSE** | 16 bound elements versus ~130 static claim sentences. |

### The cohort divergence, stated precisely

`panel-stats.completers` = **36** = Arm A detection panel (16) + Arm B comparison
(20). It counts every completer in the programme.

The static prose figures are **detection-panel only**: 16 completers, 11 countries,
5 continents.

Both are correct. Neither sentence names its denominator. Read down the page, they
look like the same fact disagreeing with itself.

Live values confirming this, pulled during the audit:

```
panel-stats     reviewers 58   completers 36   countries 16   continents 5   registered 48
                detection_completers 16   detection_countries 11   comparison_completers 20
raw views       pilot_progress 27 rows, 16 with >=24 reads
                armb_progress  21 rows, 20 with >=24 reads
```

---

## 3. Hypothesis and proof

### The hypothesis

> Published figures have no binding to their source unless someone remembered to
> add a `data-panel` attribute to that specific span. The attribute is opt-in,
> undocumented, applied to 16 of roughly 130 candidate sites, and covered by no
> test. Every previous fix corrected one frozen literal; none added a binding or a
> guard, so the next stale literal surfaced as soon as the underlying figure moved
> again. Compounding it, the bound and static figures describe two different
> populations, so any fix that forced them to agree replaced a stale-but-true
> number with a fresh-but-false one.

### Proof 1: the same sentence, twice, on one page

`research.html`

- **Line 108** (top, Headline Metrics card):
  *"<span data-panel="completers">36</span> of them completed a full 24-record set,
  spanning <span data-panel="countries">16</span> countries and
  <span data-panel="continents">5</span> continents."*
  **BOUND.**

- **Line 160** (further down, Study 011 block):
  *"Sixteen reviewers across 11 countries and 5 continents have completed the full
  24-record set, producing 384 graded reads."*
  **STATIC.** No `data-panel` on that line.

Same claim. Same page. 36/16 at the top, 16/11 at the bottom.

### Proof 2: sentinel injection

I served the repository locally, intercepted every request, and replaced the
`panel-stats` response with sentinel values: `reviewers 9111, completers 9222,
countries 9333, continents 9444, registered 9555`.

| Page | Sentinels that appeared | Bound elements |
|---|---|---|
| research.html | 9111, 9222, 9333, 9444 | 5 |
| access.html | 9111, 9222, 9333 | 3 |
| org-pilot.html | 9111, 9222, 9333 | 3 |
| investigator-guides.html | 9111, 9222, 9333 | 3 |
| acquisition-9f3c2a7d4b.html | 9222, 9555 | 2 |
| research-data.html | none | 0 |

On `research.html` the top card changed to 9222 and 9333. **Line 160 still read
"Sixteen reviewers across 11 countries."** That is the mechanism, demonstrated
rather than argued.

### Proof 3: one sentence, half bound and half frozen

`acquisition-9f3c2a7d4b.html:116`

*"48 credentialed reviewers registered and 36 completed a full 24-record set as of
11 August 2026. The 16 completers on the named detection panel span 11 countries
and 5 continents..."*

`48` and `36` are bound. `11 August 2026`, `16`, `11` and `5` are not. The date
attached to the live numbers is itself hardcoded, so the sentence will keep
asserting an as-of date that has nothing to do with when the numbers were read.
The same pattern is on `research.html:108`: *"Counted from the study database on
11 August 2026"* sits beside three live spans.

### Proof 4: no guard covers any of it

`scripts/check_zero_drift.py` runs 12 checks online and 8 offline. Its
hand-written-constant checks scan `api/`, `research/` and `scripts/`. **No check
reads a `.html` file.** All 69 HTML files, carrying every published figure the
public and buyers see, are outside the guard entirely. This is why the defect
survives: nothing can fail when it reappears.

### Proof 5: the binder is copied, not shared

Five byte-similar copies of the same 12-line fetch-and-bind loop, at
`research.html:283`, `access.html:217`, `org-pilot.html:610`,
`investigator-guides.html:207`, `acquisition-9f3c2a7d4b.html:211`. Nothing asserts
they stay identical. `research-data.html` mentions `/api/panel-stats` in a comment
at line 130 but has **no binder and no bound elements**, so it publishes figures
that can never update.

### Why the previous fixes failed

Each one edited a literal. That is a correct fix for exactly one paragraph and
provides no protection for the other 129. Worse, where a patch made a
detection-scope sentence match a programme-scope card, it turned a true statement
into a false one, which would then be reverted, which restored the visible
mismatch. The loop is structural, not a matter of care.

---

## 4. Proposal, for approval before any file is touched

Six parts. Parts 1, 2 and 4 are the fix; the rest are what stops it returning.

**1. Name every figure by its scope.** The ambiguity is the root of the confusion:
`countries` currently means "countries of all 36 completers" in one place and
"countries of the 16 detection completers" in another. `panel-stats` already
returns both (`countries` / `detection_countries`), so this is a naming change,
not new data. Proposed vocabulary, all already computed:

```
completers_all 36        completers_detection 16       completers_comparison 20
countries_all  16        countries_detection  11
continents_all  5        reviewers_all       58        registered_all       48
```

Old keys stay as aliases so nothing breaks mid-migration.

**2. Bind every published figure, and put the scope in the sentence.** Convert each
static claim to `<span data-panel="countries_detection">11</span>`, and render the
scope alongside so a reader never has to infer it: *"11 countries (detection panel)"*
versus *"16 countries (all completers)"*. Triage first: the ~130 candidate sentences
include false positives, so I would produce the classified list for your review
before editing a single one.

**3. One binder, not five.** Either a single shared snippet, or keep the five copies
and have the guard assert they are byte-identical.

**4. Extend the drift guard to HTML.** A new check that fails when a numeral sits
adjacent to the panel vocabulary (`reviewer`, `completer`, `expert`, `country`,
`continent`, `24-record set`) outside a `[data-panel]` span, unless allowlisted with
a written reason. This is the part that makes fix number 2 stay fixed. It runs
offline in the pre-commit hook like the other eight checks.

**5. Decide the fallback policy.** Today, if `/api/panel-stats` fails, the page keeps
its shipped literal and looks live. That is a stale figure wearing a live figure's
clothes, which `api/panel-stats.js` lines 45-58 already record as a defect class
that was removed from the endpoint but left in the pages. Three options, your call:
keep the fallback but mark it, blank the figure, or show the value with its
`generated_at`.

**6. Bind the as-of dates or delete them.** `generated_at` is already in the payload.

### What I would not do

Force the top and bottom numbers to be equal. They describe different populations
and that is correct. The fix is to say which population each one is, and to make
both of them move.

### Cost and blast radius

| Part | Files touched | Risk |
|---|---|---|
| 1 Scope naming | `api/panel-stats.js` (additive, aliases kept) | low |
| 2 Bind prose | up to 18 HTML files, triaged list first | medium, needs your review of the list |
| 3 Single binder | 5 HTML files | low |
| 4 HTML guard | `scripts/check_zero_drift.py` | low, will fail loudly until part 2 is done |
| 5 Fallback policy | same 18 files | depends on which option |
| 6 Dates | 2 files known so far | low |

Nothing proceeds until you approve.

---

## Method

Live data pulled from 10 endpoints and 4 database views. Both pages rendered in
headless Chromium against stubbed responses with zero network access, so nothing
in this report depends on my reading the code correctly: the sentinel test shows
what the browser actually does.

---

## IMPLEMENTED 2026-08-15, all six parts, approved by Phillip

| Part | Done | Where |
|---|---|---|
| 1 Scope naming | yes | `api/panel-stats.js`, 9 scoped keys + `scope_labels`, every old key kept as an alias assigned from the same expression |
| 2 Bind prose and show the scope | yes | 13 frozen claims bound across 7 pages; 45 bound spans on 10 pages |
| 3 Unify binders | yes | one canonical delimited block, byte-identical on 10 pages, asserted by the guard |
| 4 Extend the guard | yes | 2 new offline checks over all 70 HTML files |
| 5 Fallback policy | **mark**, with the reason | `data-panel-state=live\|stale`, dotted underline when stale, `title` giving the read time and scope or the reason it is missing |
| 6 As-of dates | yes | `data-panel-generated` renders `generated_at` |

### The headline case, before and after

**Before.** `research.html` line 108 said *"36 of them completed a full 24-record set, spanning 16 countries"* (bound). Line 160 said *"Sixteen reviewers across 11 countries and 5 continents have completed the full 24-record set"* (frozen).

**After.** Line 108 reads *"36 of them (all completers, both arms) completed a full 24-record set, spanning 16 countries and 5 continents. Counted from the study database at [generated_at]."* Line 160 reads *"The detection panel, 16 reviewers across 11 countries and 5 continents, has completed the full 24-record set."* Every figure in both sentences is live, and each sentence names its population.

### `continents_detection` was new

Eight of the nine scoped keys are renames of values the endpoint already returned. `continents_detection` was the one figure of the set with no key at all, which is precisely why it stayed hardcoded on four pages. It is the same `resolvePanelGeo(codesA)` call the endpoint already made.

### The guard was validated adversarially, and two real bugs in it were found that way

Eight defects were injected one at a time; all eight failed the guard, and the tree passed clean before and after each.

| Injected | Caught by |
|---|---|
| A frozen prose figure on a line that also holds a bound span | unbound panel figure |
| A spelled-out figure ("Thirty-six completers") | unbound panel figure |
| A numeric figure in fresh prose | unbound panel figure |
| One binder copy edited | binder copies are byte-identical |
| Binder deleted, spans left behind | has data-panel spans but no binder block |
| A key the endpoint does not return | not returned by api/panel-stats.js |
| `data-bound` marker with no script feeding the id | no script on this page assigns it |
| `data-panel-scope` with no entry in `scope_labels` | no entry in scope_labels |

**Case A passed on the first attempt, which was the check being wrong.** It was line-granular, so one bound span shielded every frozen figure sharing its line: exactly the shape of `acquisition-9f3c2a7d4b.html` line 116, half bound and half frozen in a single sentence. Bound elements are now removed from the text before scanning, and replaced with a marker rather than whitespace, because a plain space let a match run through a bound span and report "384 graded reads" as an expert count.

Two further corrections came out of the same pass: the scan read only the 50 pages in the repository root and missed `reviewer/` and the whole `reference/` hub, which is where a sixth binder copy and one more frozen figure were sitting; and `re.I`, added for the spelled-out numbers, silently made `[a-z]` match capitals and brought 12 headings back as false failures. Only the number words are case-insensitive now, because a published claim is lowercase and a heading is not.

### One correct-state failure fixed

The pre-commit hook blocked the deploy commit: `research/` is deliberately excluded from the deploy, so on a branch cut from `main` the three generated-document checks reported "file missing" and the geo check raised `FileNotFoundError`. None was a defect. Those checks now skip when `research/` is absent, with the reason printed. Verified on a tree with `research/` removed: 10 checks, 0 failed, 4 skipped.

### Verification

```
guard                    10 checks, 0 failed (dev)  |  0 failed, 4 skipped (deploy branch)
adversarial injections   8 of 8 caught
headless, data present   45 of 45 spans live, 0 unmarked, sentinels visible on all 9 pages
headless, endpoint 503   45 of 45 spans marked stale with a reason, 0 silently live
live endpoint            9 scoped keys present, all 8 aliases equal to their scoped twin
deployed pages           45 spans and 1 binder each, 0 copies of the frozen sentence
```

### Still open, deliberately

Four figures next to panel vocabulary are allowlisted rather than bound, each with a written reason: the Rung 2a comparison results (`21 reviewers`, `16 labels from 3 reviewers`), the reliability set size (`62 trained reviewers`), and one count of failure patterns. `api/panel-stats.js` returns no key for any of them, so there is nothing to bind them to. Binding them would mean adding Rung 2a figures to the endpoint, which is a separate decision.
