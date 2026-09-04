# Evaluation: Commercial Licensing and Exclusive Distribution Playbook

**2026-08-22.** Every finding below is anchored to a file and line or to a live endpoint
response. Assertions run from `scripts/verify_licensing_plan.py`.

**Verdict: the strategy is sound and the document is not yet safe to circulate.** Eleven
defects, four of which a licensee's own engineers or counsel would find in the first hour.
Three of the four are in the technical section, which is the part the document was built to
make credible.

---

## A. BLOCKING. Fix before this reaches any external reader

### A1. The integration schema names the wrong file

Section 2 heading: "The Integration Schema (api/review.js)".

**`api/review.js` does not implement that contract.** It returns a routing determination of
**Low / Moderate / High / Critical** (`api/review.js:22`). The `ready` /
`review_required` / `gap_identified` contract the playbook describes lives in
**`api/review-engine.js`** (`api/review-engine.js:109-111`).

An architect who opens the named file finds a different API than the one the document
promised. Every reference to `api/review.js` in Sections 2 and 4 must become
`api/review-engine.js`, with `api/v1/review-engine.js` named as the versioned route.

### A2. The deterministic rule is stated wrongly, and determinism is the selling point

Playbook, Section 1: "all five conditions passed equal ready, any condition unmet equals
gap_identified, and mixed results equal review_required."

**The actual rule** (`api/review-engine.js:109-111`):

```javascript
if (vals.indexOf('gap') !== -1) return 'gap_identified';
if (vals.indexOf('review') !== -1) return 'review_required';
return 'ready';
```

Condition status is ternary: **`pass` | `review` | `gap`**, not binary. The precedence is
**gap beats review beats pass**. One `gap` produces `gap_identified` whatever the other four
say. A mix of `pass` and `review` with no `gap` produces `review_required`.

The playbook's "any condition unmet equals gap_identified" collapses `review` into `gap` and
inverts the precedence. **A licensee implementing from this text writes a conformance test
that fails against the engine**, on the one property the document sells as unit-testable.

### A3. "Never persisted, logged, or echoed" is false, and the document contradicts itself
two paragraphs later

Section 1 defines Stateless Execution as input "never persisted, logged, or echoed to
external surfaces." Section 2 then states, correctly, that the engine "retains only a
structured evaluation row."

**`api/review-engine.js:172-190` POSTs a row to `engine_reviews` on every review.** The row
carries `request_id`, `determination`, `conditions`, `finding`, `runs` and
`overall_consistency`. **No record text.**

The Section 2 formulation is accurate and is the stronger claim, because it survives
inspection. Delete the Section 1 absolute. A security team that diffs the two paragraphs
against the code stops trusting the rest of the document.

### A4. A live public page still says a preview of the customer record is stored

`engine-activity.html:62` tells the public each call records "a short preview of the
submitted record", and `:66` states "A stored row holds the structured result and a
200-character input preview".

**Neither is true any more.** The `input_preview` column was removed from the write on
2026-08-14 and the page does not select it (`engine-activity.html:79`). **The copy was never
updated with the code.**

This is worse than a stale sentence. A prospective licensee doing security diligence reads
the public page, finds a stated 200-character retention of customer text, and compares it to
the zero-retention promise in the playbook and to the Data Isolation Guarantee on
`audit-request.html:129`, `calibration-request.html:129` and `engagement.html:153`. **The
contradiction is on the live site right now.** `scripts/fix_engine_activity_copy.py` corrects
it. It is not deployed.

---

## B. MATERIAL. Wrong numbers or wrong status

### B1. The 55 to 65 percent probability is not supported by anything measurable

Live, 2026-08-22, `/api/orgpilot-stats`: **organizations 0, sessions 0, records_run 0**.
Revenue $0. Trademarks unfiled (`research/IP_SALE_TRACKER.md:80`). No paying pilot.

Platform vendors license standards their customers already ask for. **Nobody is asking yet.**
A 55 to 65 percent figure describes a programme with inbound interest and at least one
reference deployment. **The verified estimate is 15 to 25 percent** and it is recorded in
`research/MASTER_TRACKER.md` for 2026-08-22.

The playbook is a good plan carrying a probability it has not earned. Its own recommendations
are the route to the deployments that would justify the number. **Presenting the plan as
evidence of its own success rate is the single most dangerous line in the document**, because
it is the number that drives the spend in Section 5.

**One structural point the matrix gets backwards.** It puts outright buyout at 15 to 25
percent and licensing at 55 to 65. Licensing is genuinely the more likely route, and the
ranking is right. **The values are the licensing estimate and the buyout estimate swapped
with an optimism premium added.**

### B2. Total Annual Potential double-counts the one-time fee

Playbook: upfront integration fee **$10,000 to $25,000**, described as "Year 1 one-time";
recurring royalties **$25,000 to $75,000+ per year**; then "Total Annual Potential (Per
Partner): $35,000 to $100,000+ **per year**".

$35k to $100k is upfront plus recurring. **That is Year 1 only.** Years 2 through 5 are $25k
to $75k. Labelling it "per year" overstates a five-year partner by $10k to $25k.

Correct form:

| Year | Per partner |
|---|---|
| Year 1 | $35,000 to $100,000 |
| Years 2 to 5 | $25,000 to $75,000 |
| 5-year total | $135,000 to $400,000 |

### B3. The multi-partner figures do not follow from the single-partner figures

"Scaling to $75,000 to $200,000+ per year when securing a modest cohort of 2 to 3
non-competing platform partners." Two to three partners at $35k to $100k is **$70,000 to
$300,000**, not $75,000 to $200,000.

Best case: "3 active platform partners" generating "$150,000 to $350,000+ per year". Three
partners at $35k to $100k is **$105,000 to $300,000** in Year 1 and **$75,000 to $225,000**
thereafter. The stated floor is $45k above what the model produces.

**Three separate figures in the same document, none reconcilable to the stated inputs.** This
is the section a partner's finance function checks first.

### B4. Title inflation on the one credential that must be exact

Playbook: "a model-validation **director** at a Big Four firm".

**Verified: Associate Director, Model Validation** (`api/_contributor-roster.js:75`).

The document correctly refuses institutional involvement and then inflates the individual's
title in the same sentence. That is the worst possible place to be inexact, because it is the
sentence a reader scrutinises.

### B5. "61 trials" is the wrong noun

They are **61 nightly runs of the same harness on the same corpus**, not 61 independent
trials. `research/MASTER_TRACKER.md`, 2026-08-21, records them as non-independent and says
so. Any reader with a statistics background reads "trials" as independent replications and
revises down when they learn otherwise.

The dispersion is handled correctly in Section 3 and should be handled the same way here:
**mean 84.9 percent, SD 6.4 points, range 66.7 to 100, across 61 nightly runs, series closed
2026-08-21.**

### B6. A second reproducibility series exists and is not mentioned

`research/Detection_Article_Submission_FINAL5_2026-08-18.md:453` reports **41 nightly runs,
87.2 percent, SD 3.2, range 82.2 to 93.3** on a fixed 15-record set.

Both figures are true; the denominators differ. Fifteen runs scored only 2 or 3 records while
the corpus was being built, and those short runs are the entire source of the 66.7 percent
floor. **A licensee who reads the manuscript and the playbook finds two agreement figures and
no explanation.** State both with their denominators.

### B7. The five conditions are given human labels and no keys

An integrator receives JSON. The actual keys (`api/review-engine.js:32-36`) are
`basis_identification`, `reasoning_traceability`, `cold_reviewer_clarity`,
`accountability_support`, `temporal_reconstructability`. The playbook's labels also drift
from the engine's own names: the engine calls condition 5 **Chronology**, not "Chronological
Integrity", and condition 2 **Decision-Process Traceability**, not "Decision Traceability".

Publish the key, the label and the status enum together, or the schema is not a contract.

---

## C. TAX AND ENTITY. The strategy is coherent. Three claims are overstated

**None of this can be verified from the repository.** No entity, no formation record, no
election, no income figure. `SURGICAL_REMEDIATION_PROMPT.md:68` states the standing rule: do
not assert an entity type that has not been formed. This is a structural review, not tax
advice.

### C1. "Fully written off against joint income" overstates by the marginal rate

Best-case row: setup outlays of $7k to $16k are "fully written off against joint income".

A deduction reduces taxable income. It returns **the amount multiplied by the marginal
rate**, not the amount. At a 24 percent marginal rate, a $16,000 deduction is worth about
$3,840, not $16,000. The playbook says "substantially offset in Year 1" in Section 5 and
"fully written off" in Section 6. **State the marginal rate or the sentence reads as a
promise of a full refund.**

### C2. The Section 195 description is not what Section 195 does

Playbook: "You can **immediately deduct** qualifying pre-opening startup costs."

Section 195 permits a limited immediate deduction, and the remainder is **amortised over 180
months**. The immediate portion also phases out once total startup costs exceed a threshold.
On a $7k to $16k spend most of it is likely currently deductible, so the practical outcome
may be close to what the playbook describes, **but the mechanism as stated is wrong and a
practitioner will correct it.** Confirm the current-year figures with the practitioner rather
than from this document.

### C3. The worst-case row understates the risk it is describing

Worst case: $0 revenue, outlays "claimed as a net operating loss on Schedule C, providing a
constructive tax shelter."

**An activity with $0 revenue deducting expenses against unrelated household income is the
profile that draws for-profit scrutiny.** The defence is a businesslike record: a written
plan, pricing, an outreach log, a commercialization tracker. **All four already exist in this
repository, and that is a real asset.** The weakness is not documentation. It is that revenue
is $0 and no offer has been shown to a named buyer.

The worst-case row currently reads as though zero revenue is tax-advantaged. It is a tolerated
outcome with a condition attached, and the condition should be named.

### C4. Timing is right and worth keeping

Deferring formation costs out of late 2026 into a 1 January 2027 entity is coherent, and
Phase 1's instruction to keep 2026 clean is the correct instinct. **Confirm with the
practitioner before the spend, not after**, because startup-cost treatment runs from when the
business begins rather than when money leaves.

---

## D. What the playbook gets right, and it is most of it

**The core strategic move is correct.** Licensing to a platform that already owns the
distribution beats an outright sale of an unproven standard, and it beats building a direct
sales motion from zero.

**The determinism framing is right and is undersold.** The playbook treats it as positioning.
It is a verified property: across the entire labelled corpus, labels with all five conditions
passed but determination not Ready = 0, and labels with any condition failed but determination
Ready = 0. Zero exceptions. **That makes the mapping genuinely unit-testable**, which is what
an integrating engineer needs.

**Section 3 is the strongest part of the document.** Refusing the peer-review claim, refusing
institutional involvement, and marking the series as closed rather than live are exactly the
disclosures that survive diligence. **Sections 1 and 2 then break two of those disciplines**
by overstating retention and misstating the rule.

**The pre-finalization gate framing is correct and specific.** "Evaluated before it is written
to a system of record" gives an integrator an injection point rather than a concept.

**The 10 to 15 hour rhythm and the $7k to $16k ceiling are honest constraints**, and the
worst-case row correctly identifies that the downside is capped.

---

## E. Priority order

| # | Action | Cost |
|---|---|---|
| 1 | Correct the file name to `api/review-engine.js` throughout | Minutes |
| 2 | Restate the determination rule with the ternary status and gap-beats-review precedence | Minutes |
| 3 | Delete the Section 1 "never persisted" absolute; keep the Section 2 formulation | Minutes |
| 4 | Deploy `scripts/fix_engine_activity_copy.py` so the live page stops claiming a stored preview | One deploy |
| 5 | Replace 55 to 65 percent with 15 to 25 percent, or state the conditions under which it becomes 55 to 65 | Minutes |
| 6 | Rebuild the yield table with Year 1 separated from Years 2 to 5 | Minutes |
| 7 | Correct the title to Associate Director | Seconds |
| 8 | Publish the five condition keys and the status enum | Minutes |
| 9 | Take C1, C2 and C3 to the practitioner before any 2026 spend | One meeting |

**Items 1, 2 and 3 are the ones that cost a deal.** They are all in the section written to
establish technical credibility, and all three are corrections rather than rewrites.
