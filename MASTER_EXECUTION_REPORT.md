# MASTER EXECUTION REPORT

**Market Validation, Claims Control, Public Diagnostic, Research Integrity and Commercialization. 2026-08-13.**

**Status: NOT COMPLETE.** Two items are unfinished and one is a decision for the owner. They are named in sections 11 and 13 rather than rounded up.

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
2. **The record check is linked from only 3 pages.** The footer markup is not shared across the site, so a single edit could not reach all 63. Full coverage needs a per-page pass.
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
