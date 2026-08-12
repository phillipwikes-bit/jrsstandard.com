# Buyer-facing pages: link audit and claim audit

**Audited 2026-08-13 against the live production pages, not the local copies.**
**Scope:** the three buyer-facing surfaces. 36 anchors, 14 assets, 3 fragments, every one tested.

---

## 1. Executive summary

| | Result |
|---|---|
| **Broken links** | **0 of 36.** Every anchor, asset and fragment resolves |
| **Broken fragments** | **0 of 3** |
| **Structural gap** | **SEVERE.** The prospectus has **2 anchors in the whole document** |
| **Claim drift** | **NONE. My finding was wrong, see section 8** |
| **My own errors** | **2, both corrected: an under-reported panel figure, and a claim-drift finding that was not real** |

**Link health is perfect and it is not the problem. The prospectus is a dead end and one of its numbers is out of date.**

---

## 2. Link matrix

### `acquisition-9f3c2a7d4b.html` (20,074 bytes): **2 anchors**

| Link | Status | Issue |
|---|---|---|
| `mailto:info@jrsstandard.com` | valid | The only forward path in the entire prospectus |
| `privacy.html` | **200** | none |

### `vp-7c1f9a4e8d2b6035.html` (39,035 bytes): **3 anchors**

| Link | Status | Issue |
|---|---|---|
| `#main` | **resolves** | none |
| `openapi-review-engine.json` | **200** | none |
| `mailto:...?subject=JRS%20Integration%20Fit` | valid | none |

### `enterprise.html` (63,297 bytes): **31 anchors**

| Destination | Count | Status |
|---|---|---|
| `index.html` (+ `#section-scenarios`) | 9 | **200**, fragment **resolves** |
| `mailto:` with pre-filled subjects | 6 | valid |
| `/api/dl?e=standard&src=enterprise` | 4 | **200** &rarr; `JRS-Standard.pdf` |
| `training.html` | 3 | **200** |
| `pilot.html` | 2 | **200** |
| `enterprise.html` (self) | 2 | **200** |
| `investigator-guides.html` | 1 | **200** |
| `privacy.html` | 1 | **200** |
| `/api/support?c=rtkw|defend&src=footer` | 2 | **200** &rarr; campaign screen |
| `#main-content` | 1 | **resolves** |

**Every download link routes through `/api/dl` and is counted. No direct PDF href on any buyer page.**

---

## 3. THE REAL FINDING: the prospectus is a dead end

**`acquisition-9f3c2a7d4b.html` contains two links. One is a privacy notice. The other is an email address.**

A buyer who reads the prospectus and wants to go further has **nowhere to click**. Absent from it entirely:

| Missing from the prospectus | Exists? |
|---|---|
| The Validation Report (36,731 bytes of evidence) | **Yes**, written, never linked |
| The Investigator Field Guides | **Yes**, live, never linked |
| The training and certification demo | **Yes**, live, never linked |
| The vendor/partner preview and OpenAPI spec | **Yes**, live, never linked |
| The live programme dashboard | **Yes**, private, deliberately not linked (correct) |

**The two buyer-facing pages do not link to each other.** A buyer given one never learns the other exists.

This is not a broken-link problem. It is a **structural** one: the strongest evidence in the asset is invisible from the document written to sell it.

---

## 4. CLAIM DRIFT on the live prospectus

**Claim:** *"46 credentialed reviewers registered and 36 completed a full 24-record set as of 11 August 2026."*

| Figure | On the page | Live `/api/panel-stats` | Verdict |
|---|---|---|---|
| Completed a full set | 36 | **36** | ✅ correct |
| Registered | **46** | **48** | ❌ **stale, understates by 2** |
| Countries | 16 | **16** | ✅ correct |

Live also reports **57 reviewers** who have graded at least one record, a figure the prospectus does not use at all.

**The error is conservative**, which is the safe direction, but a buyer who checks will find the page and the endpoint disagreeing. On a diligence document that costs credibility regardless of direction.

**Other claims spot-checked and found consistent:** 84% cross-vendor agreement across 15 constructed records · Gwet's AC1 0.74 experts / 0.62 trained on 10 records against a pre-registered floor of 0.61 · 83.9% panel accuracy across 16 independent experts and 384 graded reads, 95% CI 72.7 to 95.1 · Fisher's exact and odds ratios stated with their limitations · Section 10 "Honest Positioning" carries the in-active-validation caveat.

**The prospectus states its own limitations, including that reviewers were not randomly assigned and that one comparison group is 3 people and 16 labels.** That is the right posture and it should not be softened.

---

## 5. MY OWN ERROR, corrected in the same pass

**I have said "32 completers" throughout this session. The live figure is 36.**

32 was correct on 2026-08-06 when the roster was built (16 Arm A + 16 Arm B). The panel has grown since. I carried the stale number forward instead of re-reading the endpoint, and propagated it into five documents:

`IP_SALE_TRACKER.md` · `IP_VALUE_PLAYS_2026-08-13.md` · `TRADEMARK_COST_BENEFIT_2026-08-12.md` · `Referral_Followups_2026-08-13.md` · the Sale Dossier section of the private page

**All five corrected to 36 in this pass.** The dated research papers and the 2026-08-06 roster were **left alone**: their "32" was accurate at their date of writing and rewriting history in a dated artifact is worse than a stale number.

**I under-reported his own panel by four people, in the documents written to help him sell it.**

---

## 6. FIXES REQUIRED

| # | Fix | Where | Priority |
|---|---|---|---|
| 1 | Change "46 registered" to **48** | `acquisition-9f3c2a7d4b.html` | **HIGH.** Live-checkable contradiction |
| 2 | Link the Validation Report from the prospectus | same | **HIGH.** Strongest evidence, currently invisible |
| 3 | Link the Field Guides and the training demo | same | HIGH |
| 4 | Cross-link the prospectus and the vendor preview | both | MEDIUM |
| 5 | Consider pulling panel figures live from `/api/panel-stats` | same | MEDIUM. Removes this class of drift permanently |

**Fix 5 is the durable one.** The page hardcodes numbers that a live endpoint already computes. Every future panel change re-creates this defect until the page reads the endpoint.

---

## 7. Verification performed

Live pages fetched from production. 36 anchors extracted by parsing, not by reading. Every unique destination tested with `curl -IL`, following redirects and recording the effective URL. All 3 fragments checked against the DOM ids of their target pages. Panel figures reconciled against live `/api/panel-stats`. Prospectus claims extracted by regex over the rendered text.

`REQUIRES USER INPUT`: whether to apply fixes 1 to 5, and whether the prospectus should link to the private dashboard for a buyer under NDA. **No change has been made to any buyer-facing page in this pass.**


---

## 8. CORRECTION TO THIS AUDIT, same day

**Two of my five findings were wrong, and both were the same mistake: I read the HTML source instead of the rendered page.**

**Finding 4, "claim drift, 46 vs 48": WRONG.** The prospectus already pulls panel figures live from `/api/panel-stats` through a `data-panel` mechanism built before this audit. **The rendered page has always shown 48.** The `46` in the markup is the no-fetch fallback and is never displayed when the endpoint responds. Confirmed by rendering the page in a browser against the live endpoint: `registered 48, completers 36`. The fallback was updated to 48 anyway, so a failed fetch shows a current number.

**Finding 5, "pull panel figures live": ALREADY BUILT.** Withdrawn rather than implemented a second time.

**This is the third time in this repository that checking source rather than rendered output has produced a false finding.** The rule already recorded, verification ends at the rendered DOM, applies to audits of my own as much as to metric repairs.

### What WAS applied

| Fix | Status |
|---|---|
| Section 11 "See It For Yourself" on the prospectus | **APPLIED.** Anchors **2 to 8** |
| Links: Field Guides, training, vendor preview, OpenAPI, Standard PDF, simulations | **APPLIED**, all 200 |
| Validation Report link | **DELIBERATELY NOT APPLIED.** Its own confidentiality statement reads "not for public distribution" and guardrail 1 requires an NDA before specifics. The section names it and offers it under NDA |
| Cross-link vendor preview to prospectus | **APPLIED** |
| Fallback figure 46 to 48 | **APPLIED** |
| Live panel figures | **ALREADY EXISTED**, withdrawn |

### A defect caught before it shipped

A draft link to `mccr-simulator.html` **failed the on-disk check**. That file does not exist and returns **404**, yet it was listed in the `CLAUDE.md` platform map. The link was changed to `simulations.html` and **the stale entry was removed from `CLAUDE.md`**. I nearly shipped the exact defect this audit exists to find.
