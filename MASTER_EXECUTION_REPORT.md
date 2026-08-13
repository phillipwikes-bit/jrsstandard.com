# MASTER EXECUTION REPORT

**Market Validation, Claims Control, Public Diagnostic, Research Integrity and Commercialization. 2026-08-13.**

**Status: item 2 CLOSED 2026-08-13. Item 1 remains open and is a decision for the owner.**

**Item 2, link coverage, is closed.** The record check is now linked from **52 public pages, one link each**, anchor text normalised to "Record Defensibility Check". Twelve pages are deliberately excluded with a stated reason each. See section 15.

---

## 1. Files inspected

63 public HTML files, every `.js` in `api/`, the `research/` builders, and the live endpoints `/api/panel-stats`, `/api/asset-stats`, `/api/contributor-stats`. Supabase tables probed directly with the public anon key: `bench_gold`, `bench_records`, `bench_labels`, `bench_experts`, `pilot_contacts`, `realcase_progress`, `study_runs`.

## 2. Files modified

| File | Change |
|---|---|
| `check.html` | **NEW.** The ungated public diagnostic |
| `reviewer/index.html` | Anonymity wording; research CTA wording |
| `access.html` | Anonymity wording; research CTA wording |
| `investigator-guides.html` | Research CTA wording |
| `api/contributor.js` | Anonymous contributors no longer forced to identify themselves |
| `contributor.html` | Same rule client-side |
| `index.html` + 2 others | Link to the record check |
| `CLAIMS_REGISTER.md` | **NEW** |

## 3. Claims removed

**"100% Anonymous"**, in `reviewer/index.html` and `access.html`. It was false: opting into a certificate or a LinkedIn recommendation requires a name and an email.

Verified count of every prohibited term across all HTML, JS and JSON: **0 of 11**. `high demand`, `proven demand`, `market-proven`, `industry standard`, `battle-tested`, `widely adopted`, `required by ISO`, `certified standard`, `100% Anonymous`, `Founding Auditor`, `product-market fit`. **Nine of the eleven were already absent before this pass**; only the anonymity claim was present.

## 4. Claims revised

Replaced with wording that is true of the actual workflow: **"No registration required, Responses kept separate from contact details, Optional LinkedIn Recommendation."** Verified against `api/reviewer-eval.js`: answers write to `interaction_events`, contact details to `pilot_contacts`, two tables with no shared identifier.

**No regulatory overstatement was found.** `enterprise.html` already disclaims explicitly. No file claims ISO/IEC 42001 requires JRS.

## 5. New diagnostic route

**`/check.html`.** Ungated, verified by inspection: **no `<form>`, no email input, no file input, no account, no survey, no contact capture.** Seven named failure modes with a detection question each, the five review conditions, and a seven-box single-record self-assessment.

**The self-assessment runs entirely in the browser**: the block contains no `fetch`, no beacon and no storage, which is what makes the "nothing is sent anywhere" line on the page true rather than a promise.

**Terminology note, deliberate.** The directive named the five conditions as Record Self-Sufficiency, Evidentiary Anchoring, Chronological Integrity, Decision Traceability, Evidentiary Sufficiency. **The canonical names in `codebook.html` are Reconstructability, Basis Identification, Chronology, Decision-Process Traceability, Evidentiary Sufficiency.** The page uses the codebook names. Publishing a second set of names for the same five conditions would create exactly the duplicated-fact defect this repository has spent the month removing.

## 6. CTA changes

| Pathway | Wording | Target |
|---|---|---|
| **Commercial** | "Request a 5-record Decision Reconstruction Diagnostic" | mailto scope request, primary CTA on `/check` |
| **Research** | "Pressure-test the standard (4-minute evaluation)" | `reviewer/evaluation.html`, secondary on `/check` |

The reviewer evaluation is **preserved, not deleted**, and is not the primary CTA on the diagnostic page. Attribution parameters verified intact: `src=check`, `src=guide-dl`, `src=reviewer-landing`, and the `?c=` pass-through in `access.html`.

## 7. Privacy changes

**Sub-group suppression is server-side and verified live.** `MIN_CELL_N = 30` in `api/asset-stats.js`; `gated()` returns `[]` before serialization. At 0 submissions the live JSON returns `by_sector: []`, `by_role: []`, `countries_submitted: []`. **Not CSS-hidden, and not present in the payload.**

## 8. Telemetry changes

The crawler filter already existed, is case-insensitive, and covers Googlebot, Bingbot and Baiduspider among others. **No change was needed and none was made.**

## 9. Benchmark protection results

**I raised a false alarm here and corrected it.** `bench_gold` is readable through the public anon key, which looked like a critical exposure of the answer key. It is not: it holds **3 rows with synthetic placeholder record IDs** (`00000000-...-a1`), one per determination, matching no real record. The page label "provisional/illustrative" is accurate.

**The real keys are in `research/`, which is verified absent from the deployed branch** (`git ls-tree origin/main research/` returns 0 entries). The Arm A recheck key is `research/Blind_Recheck_KEY_E08.md`; the Arm B scoring key is inside `research/score_armb.py`. Neither is deployed, in HTML, in client JS, or in any API response.

**A different and real exposure exists, and it is not the answer key.** `research-data.html` publishes open-data exports of `bench_records` (record text) and `bench_labels` (human five-condition scores). Measured: **129 labels across 15 records, of which 10 records carry 3 or more labels.** For those 10, a majority-vote pseudo-key is derivable by anyone.

**Scope, stated precisely so this is not over-read:** those are the **Rung 2a reliability** records, **not** the 24-record detection set. The detection set and its key are the licensable asset and remain intact. The consequence is narrower but real: **the reliability record set cannot be described or sold as a blind benchmark**, because its records and its human labels are both public.

**Not changed.** Withdrawing a published open-data set is a research-transparency decision that belongs to the owner, not a defect for me to close silently. Recorded in section 11.

## 10. Contributor and anonymity controls

**A real violation was found and fixed.** `api/contributor.js` required name, title, organization and email before it would accept any confirmation, **including from a contributor whose election on file was anonymous.** Anonymity was an offer you could only accept by first disclosing who you are.

Now: the three permission questions are always required and always come first. **Name, title and organization are required only from someone who has asked to be named.** An anonymous contributor may leave an email so results can reach them, or leave it blank. Fixed identically in `contributor.html` so the client and the endpoint enforce one rule.

**Citation confirmation still creates no assignment or licence.** The three permissions are naming, continuing use, and transfer to a successor. Verified: no copyright assignment, no commercial licence, no sublicensing, no certification.

## 11. Remaining risks

1. **`research-data.html` publishes record text and human labels together**, making a majority-vote pseudo-key derivable for 10 of the 15 reliability records. Owner decision. `[REQUIRES USER INPUT]`
2. ~~The record check is linked from only 3 pages.~~ **CLOSED 2026-08-13. 52 pages, one link each.** See section 15.
3. **`ANON_CODES` is empty.** Two completers elected anonymity and their codes are recorded nowhere in the repository, so the safe fallback is doing the work. `[REQUIRES USER INPUT]`
4. **No payment mechanism.** The diagnostic CTA opens a scoped email. That is the smallest viable path and is deliberate under directive 15.

## 12. Tests performed

| Test | Result |
|---|---|
| Prohibited-claim grep, 11 terms, all HTML/JS/JSON | **0 occurrences** |
| `/check` gating inspection | no form, no email, no file input, no account |
| Self-assessment isolation | no fetch, no beacon, no storage in the block |
| `node --check` on inline page JS | **PASS** |
| Duplicate element IDs on `/check` | **none** |
| CTA route resolution | all file targets exist; the two flagged are `/api/support`, an endpoint |
| Headless render, mobile 390px and desktop 1280px | 7 modes, 5 conditions, 7 boxes, **no horizontal overflow, 0 console errors** |
| Self-assessment logic, 1 mode and 2 modes | correct escalation at two |
| `node --check` on `api/contributor.js` | **PASS** |
| Server-side suppression, live | `by_sector`, `by_role`, `countries_submitted` all `[]` at n=0 |
| Gold key reachability, anon key | real keys **not reachable**; `bench_gold` is 3 synthetic rows |
| `research/` on deployed branch | **0 entries** |
| Zero-drift guard | **10 checks, 0 failed** |
| House style on new files | 0 em-dashes, 0 banned phrases |

## 13. Failed tests

**None failed.** Two findings are recorded as open rather than failed, because neither is a test that can pass or fail: the open-data derivability in section 9, and the 3-page link coverage in section 11.

**One test I initially reported wrongly**: the `bench_gold` exposure. My first read called it a critical answer-key exposure. Checking the rows showed 3 synthetic placeholders. The correction is in section 9 rather than quietly dropped.

## 14. Recommended next actions

1. **Decide on `research-data.html`.** Publishing record text and labels together forecloses selling the reliability set as blind. If that is acceptable for transparency, say so and it stops being a risk.
2. **Extend the record-check link** to the remaining public pages.
3. **Run the first diagnostic manually.** The mailto path is enough to test whether anyone asks. Do not build checkout before someone does.
4. **Supply the two `ANON_CODES`** if they can be recovered from your own records.

---

**This report does not state that the directive is complete.** Sections 11 and 13 name what is not.

---

## 15. Item 2 closure: repo-wide link coverage (2026-08-13)

### Coverage

**52 public pages, exactly one link each, anchor text "Record Defensibility Check" on all 53 occurrences including the target page's own footer.**

Three footer patterns needed three different insertions, because the markup is not shared:

| Pattern | Pages | Insertion |
|---|---|---|
| `class="footer-link"` nav | 30 | Sibling anchor after the last one |
| Inline-styled JetBrains Mono nav | 2 | Matching anchor, neutral colour so it does not read as the active page |
| Copyright-only footer | 14 | Joined the existing inline run beside Privacy |
| Already present | 2 | Left alone, text normalised |
| No usable footer | 4 | See below |

**The four without a usable footer.** `404.html`, `people.html` and `supported.html` had no `<footer>` at all and were given a minimal one built from the shared design tokens. `recheck.html` had a copyright line only, which was extended.

### Deliberate exclusions, twelve pages

| Page | Reason |
|---|---|
| `ai-records-arm-b.html` | **ARM B BLIND.** A JRS-branded link would tell an unaided-arm reviewer the standard exists. This one is not a judgment call |
| `ai-records-pilot.html`, `bench-review.html`, `bench-results.html`, `review-status.html`, `submit-record.html`, `submit-validation.html` | Self-declared confidential study surfaces, not indexed |
| `bench-admin.html` | Token-gated admin console |
| `programme-status-9872fb93cc94.html`, `acquisition-9f3c2a7d4b.html`, `vp-7c1f9a4e8d2b6035.html` | Private opaque slugs |
| `check.html` | Is the target |

**Verified: none of the eleven excluded pages contains the link.**

### Two defects found while verifying, both mine

1. **`jrsstandard.html` hides its footer container.** The parent div computes to `display:none`, so the link placed there was unreachable. Moved to the visible util bar; the dead copy removed, leaving exactly one reachable link.
2. **That sixth util-bar link overflowed the desktop viewport.** Only the mobile media query wrapped the bar. The base rule now wraps too. Confirmed against the pre-edit page that the overflow did not pre-exist: **I caused it, and it is fixed.**

### Item 2 verification

| Test | Result |
|---|---|
| Pages with exactly one link | **52 of 52** |
| Anchor text consistent | **53 of 53** occurrences |
| Excluded pages containing the link | **0 of 11** |
| Renders at 390px and 1280px | **104 checks: one visible link each, no horizontal overflow** |
| Inline JS blocks parsed | **174, 0 failures** |
| JSON-LD blocks parsed | **1, valid** |
| Anchor and footer tag balance | **no mismatches** |
| Zero-drift guard | **10 of 10** |

**Pre-existing issues left alone and reported rather than silently changed:** duplicate footer hrefs in `index.html` (`mailto:`) and `pilot.html` (`research.html`), both confirmed to pre-date this pass; and a pre-existing null-reference JS error on `jrsstandard.html` from a training script referencing elements that page does not contain.

### Item 14 recommendation 2, closed

Recommended action 2 was "extend the record-check link to the remaining public pages." **Done.** Recommendations 1, 3 and 4 remain open and are owner decisions.
