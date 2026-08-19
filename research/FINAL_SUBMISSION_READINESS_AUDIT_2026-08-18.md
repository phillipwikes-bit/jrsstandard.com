# FINAL SUBMISSION READINESS AUDIT

**Detection Article v3**

**Date:** 18 August 2026
**Manuscript audited:** `research/Detection_Article_Submission_Final_v3_2026-08-18.md` / `.docx`
**Reference audit:** `research/REFERENCE_CLASSIFICATION_SOURCE_REPORT_2026-08-18.md`
**Change log:** `research/Detection_Article_Submission_Final_v3_CHANGE_LOG_2026-08-18.md`
**Report version:** 1.0, 2026-08-18
**Mode:** read only. No manuscript, dataset, script or pre-registration was modified. No commit was created.

---

## EXECUTIVE FINDING

**v3 is submittable after one surgical correction.** There is no methodological defect requiring repair, and no reported statistic fails to trace to an authoritative source.

The v3 pass closed the one issue that was a genuine blocker: the manuscript no longer presents an automated reproducibility check as human validation. All fourteen instructed corrections hold, and 59 standing assertions plus 23 zero-drift checks pass against the current file.

**One item warrants a correction before submission.** The novelty claim at Section 2 is an unhedged universal negative about the literature: *"reconstructability of the individual record has not been operationalised as a measurable property with a stated instrument, a stated scale, and reported detection and agreement statistics."* No source can establish a universal negative, and reviewers in this field routinely require "to our knowledge" or equivalent. This is a one-clause fix, not a methodological problem.

**Three items are AMBER and require your judgement rather than an edit.** The most consequential is the claim that the author-side classification was fixed *"before any reviewer was recruited"*. It is not contradicted by anything, but it is also not verifiable from the repository: `pilot_progress` exposes no registration timestamp. You know whether it is true; the repository cannot show it either way.

**The reproducibility position is honestly stated and is weaker than the paper's other evidence.** The 72 reference classifications are supported by an aggregate result, not by retained per-pass outputs. v3 now says so. That is a real limitation, correctly disclosed, and not a submission blocker.

---

## PART 1. REFERENCE-CLASSIFICATION PROVENANCE

### 1. Are the Section 4.4 instances the same as the Appendix A models?

**NOT ESTABLISHED.**

`research/Verified_Key.md` records that three large-language-model instances performed the pass and names no vendor, model or version. `Detection_Article…:220` names three vendors (Anthropic, OpenAI, Google) for the Appendix A nightly cross-vendor runs. **No source connects the two procedures.** The inference is available and is not drawn.

### 2. If SAME

Not applicable. For completeness, the retained configuration fields for the reference pass are:

| Field | Retained |
|---|---|
| Model name | **No** |
| Vendor | **No** |
| Version | **No** |
| Execution date | **No** (the file was committed 2026-07-06; the pass itself is undated) |
| Prompt | **Partially** — the operational rule given to the raters is `research/AnswerKey_Verification_Packet.md`; no system prompt or wrapper is recorded |
| Temperature or sampling configuration | **No** |
| Per-pass outputs | **No** |

### 3. If DIFFERENT

Not established as different either. The two procedures are distinct in purpose and are distinguished in the manuscript:

| | Reference classification, Section 4.4 | Machine consistency, Appendix A |
|---|---|---|
| Purpose | reproduce the author-side key | measure cross-vendor agreement |
| Instrument | binary operational rule | five-condition JRS instrument |
| Corpus | 24 records | 15 records |
| Vendors named | none | three, named |
| Reported as | methodological check | supporting result |

**The manuscript distinguishes them adequately.** They sit in different sections, describe different instruments and different corpora, and neither cross-references the other in a way that could merge them.

### 4. If NOT ESTABLISHED

**The manuscript's current wording remains accurate.** Section 4.4 says "three separate large-language-model instances" and asserts nothing about identity. No model name was added for symmetry with Appendix A.

### 5. Are the 72 classifications supported by retained outputs?

**NO. The arithmetic is supported; the outputs are not retained.**

| Element | Status | Source |
|---|---|---|
| 3 instances | stated | `Verified_Key.md`, Method |
| 24 records | tabulated | `Verified_Key.md`, key table, R01–R24 |
| 3 × 24 = 72 | arithmetic, verified | — |
| 72 individual retained classifications | **not retained** | no per-pass artifact exists |

What exists is the aggregate: *"All three raters assigned identical labels on all 24 records."* v3 discloses this limitation in the Disclosure paragraph.

### 6. 72/72 agreement

**VERIFIED as reported, from the aggregate.** `Verified_Key.md`, Result: 100 percent inter-rater agreement, and 24/24 against the intended key. Unanimity across three passes on 24 records entails 72 agreeing classifications. Not independently re-derivable from retained per-pass data.

### 7. Adjudication

**VERIFIED: none occurred.** No divergence, so the pre-specified rule at `OSF_PreRegistration.md:28` was never triggered.

### 8. Pre-registered 2, executed 3

**VERIFIED.** `OSF_PreRegistration.md:27-28`, `DRR_Detection_Validation_Protocol.md:30-33`, `AnswerKey_Verification_Packet.md:16` and `Intended_Key_authorside.md` all specify two with conditional adjudication. `Verified_Key.md` records three, each scoring all 24.

### 9. Unreported methodological consequence of the 3-pass procedure

**One, and it is minor.** The pre-registered design was one full pass plus a conditional adjudicator. The executed design was three full independent passes, which permits a majority rule the pre-registration did not contemplate. Because agreement was unanimous, no rule of any kind was needed and the two designs coincide on this data. Had there been divergence, the executed design would have required a resolution rule that was never specified. **No consequence for the reported result.**

### 10. Is the current disclosure sufficient?

**YES.** v3 states the count, the automated nature, the absence of expert status, the denominator, the packet's disclosure of the task, the absence of adjudication, the deviation from two passes to three, that the check is not human validation, that no human replication has been performed, and that implementation details were not retained in a form sufficient for independent reproduction.

---

## PART 2. REFERENCE-KEY TIMELINE

| | Event | Date | Source |
|---|---|---|---|
| A | Author-side key created | **on or before 2026-07-06**; creation itself undated | `Intended_Key_authorside.md`; `git log db7a34c` |
| B | Fixed and committed | **2026-07-06** | `git log db7a34c`, `48f3ead` |
| C | Detection panel reading | began **on or before 2026-06-28** | live `pilot_progress`, earliest `last_at` 2026-06-28T08:33:02Z |
| D | Study 004 labelling | began **2026-06-11** | live `bench_labels`, earliest `created_at` 2026-06-11T21:01:51Z |
| E | Primary analysis | **2026-08-15** | `research/FULL_DATA_ANALYSIS_2026-08-15.txt`; `closed_aggregates_2026-08-15.json` `generated_at` 2026-08-15T06:27:02Z |
| F | Pre-registration requirement | *"The verified key … is fixed **before any accuracy analysis**"* | `OSF_PreRegistration.md` |

**The pre-registration requirement is met.** It governs analysis, not recruitment or reading. Analysis ran on 2026-08-15, six weeks after the key was fixed. Reviewers never saw either key, so blinding is unaffected.

### The "before any reviewer was recruited" claim

`Detection_Article…:172`: *"Before any reviewer was recruited, the first author recorded an intended classification…"*

**PARTIALLY VERIFIED.**

- **Not contradicted.** Nothing in the repository shows a recruitment predating the key.
- **Not verifiable.** `pilot_progress` exposes `code`, `last_at`, `name`, `reads_today`, `total_reads` and no registration timestamp. `ai_pilot_reads` is RLS-locked and returns zero rows to the public key. No recruitment or invitation log exists in the repository.
- **Circumstantially strained.** The key file was committed 2026-07-06; a participant's final activity is recorded 2026-06-28, so reading had begun at least eight days earlier. The claim can still be true — the intended key states it was fixed before verification, and a file can be authored well before it is committed — but the repository cannot demonstrate it.

**Classification: EDITORIAL RISK, not a submission blocker.** The manuscript does not rest any statistical claim on it, and the substantive protection against post-hoc fitting is the blind reproduction, not the recruitment sequence. You know from personal knowledge whether the claim is true; if it is, no change is needed. If you cannot date it confidently, the safe form is *"before verification began"*, which the intended-key file does establish.

---

## PART 3. PARTICIPANT ARCHITECTURE

| Population | Count | Nature | Verified from |
|---|---:|---|---|
| Study 011 / Arm A | **16** completers of 27 registered | independent human experts | live `pilot_progress`; `Expert_Roster_All_Studies_2026-08-06.md` Study 011 |
| Study 012 / Arm B | **20** completers of 21 registered (B1 7, B2 13) | independent human experts, same professional standing | live `armb_progress`; same roster, Study 012 |
| Study 004 reliability | **25** raters (8 `E-`, 17 `R-`) | human | live `bench_labels`; `REVIEWER_ROSTER_COMPLETE.md` §004 |
| Reference classification | **3** | automated LLM instances | `Verified_Key.md:8` |

| Check | Result | Evidence |
|---|---|---|
| Arm A expertise | **VERIFIED** | all 16 named with credentials |
| Arm B expertise | **VERIFIED** | 20 completers; anonymous entries typed "JRS-naive expert professional" |
| Arm A / Arm B distinction is condition, not expertise | **VERIFIED** | `DRR_Detection_Validation_Protocol.md:46` |
| Arm A / Arm B disjoint | **VERIFIED** | no named person holds both a `V-AI` and an `RR` code |
| Study 004 kept separate | **VERIFIED** | protocol §4 names no `E-` or `R-` code |
| LLM separation from all human populations | **VERIFIED** | zero overlap; not human |
| 61 human study participations | **VERIFIED** | 16 + 25 + 20 |
| 58 unique humans | **VERIFIED** | 61 − 3 dual-code holders |
| Three-person overlap | **VERIFIED** | E-09/V-AI-06, E-12/V-AI-07, E-13/V-AI-03, `build_expert_roster.py:121` |

**No manuscript statement conflicts with this architecture.** The Acknowledgments are byte-identical to v2 and credit 61 participations held by 58 distinct people. The three automated raters appear nowhere in that count.

**One residual, recorded rather than smoothed over.** `E-11` is one of the 25 credited raters and carries one label with no identity row, so it cannot be resolved to a named person. `count_participants.py` reaches 58 by a different composition that excludes `E-11` and includes `RR-108`, a non-completer; the two exclusions cancel. Both routes print 58 while describing sets that are not identical. No reported figure depends on which route is taken.

---

## PART 4. PRIMARY STATISTICAL LINEAGE

| Statistic | Source data | Analysis file | Output file | Manuscript location | Verified |
|---|---|---|---|---|---|
| 83.9% accuracy | `ai_pilot_reads` scored against `research/Verified_Key.md` | `api/pstat-4c8e1b6a2d90.js` (deleted at `120c11e`, recovered from `120c11e^`) | `research/closed_aggregates_2026-08-15.json` → `detection_panel.accuracy.mean` = 83.85 | Abstract, §6.1 | **YES** |
| 95% CI 72.7–95.1 | same | same, `tcrit(15)=2.131`, `h = t·s/√n` | same → `ci95_low` 72.66, `ci95_high` 95.05 | Abstract, §6.1 | **YES** |
| Sensitivity 87.0% | same | same | same → `sensitivity.mean` = 86.98 | §6.4 | **YES** |
| Specificity 80.7% | same | same | same → `specificity.mean` = 80.73 | §6.4 | **YES** |
| 384 graded reads | same | same | same → `judgments_analysed` = 384 | Abstract, §6.1, Acknowledgments | **YES** |
| 16 experts | `pilot_progress` | `research/check_completion.py`; `research/count_participants.py` | live read 2026-08-18: 27 registered, 16 at ≥24 reads | throughout | **YES** |
| 24 records | `research/Verified_Key.md` key table | — | R01–R24, 12 grounded / 12 ungrounded | throughout | **YES** |

**The confidence-interval method was verified arithmetically:** 2.131 × 21.02 / √16 = 11.198; 83.85 ∓ 11.198 = 72.65 / 95.05, matching the stored values to the rounding of the stored SD, and printing as 72.7 and 95.1. Corroborated independently by `scripts/verify_detection_accuracy.py`, whose `ci95_t()` carries the same t table.

**One lineage weakness, already on the register.** The producer `api/pstat-4c8e1b6a2d90.js` was deleted after use and exists only in git history. The output file names its own producer, and the arithmetic reproduces, so the lineage is traceable — but it is traceable through `git show`, not through a file a third party would find in the working tree.

---

## PART 5. RELIABILITY STATISTICAL LINEAGE

| Statistic | Source data | Analysis file | Output file | Manuscript location | Verified |
|---|---|---|---|---|---|
| Expert AC1 0.739 | live `bench_labels`, `mode = jrs`, deduplicated | `research/compute_ac1_ci.py` `ac1()` | `research/current_reliability_2026-08-18.json` | §6.5 table | **YES** |
| Expert analytic CI 0.402–1.000 | same | `compute_ac1_ci.py` `analytic_ci()` | same | §6.5 table | **YES** |
| Expert bootstrap CI 0.427–1.000 | same | `compute_ac1_ci.py` `bootstrap_ci()`, B=20000, seed=20260727 | same | §6.5 table | **YES** |
| Regular AC1 0.623 | same | `ac1()` | same, 0.6228 | §6.5 table | **YES** |
| Regular analytic CI 0.252–0.993 | same | `analytic_ci()` | same | §6.5 table | **YES** |
| Regular bootstrap CI 0.285–0.894 | same | `bootstrap_ci()` | same | §6.5 table | **YES** |
| 25 / 22 / 3 participants | live `bench_labels` | `research/recompute_current_ac1.py` | same, `totals` and `excluded_baseline` | §6.5, Acknowledgments | **YES** |
| 113 / 104 determinations | same | same | same, 113 submitted, 104 retained | §6.5, Appendix B | **YES** |
| 15 / 10 records | same | same | same, 15 labelled, 10 estimable, 5 single-rater | §6.5 | **YES** |

### Is `compute_ac1_ci.py` responsible for reported statistics?

**YES. It is the estimator behind every reliability value in the manuscript.** `research/recompute_current_ac1.py` imports it unmodified and calls `ac1()`, `analytic_ci()` and `bootstrap_ci()`, reading that module's own `B` and `SEED` constants at run time.

### Consequence of the crash

**D. REPRODUCIBILITY ONLY.**

`compute_ac1_ci.py` raises `KeyError: 'basis_identification'` at `per_condition_ac1()`, line 169, when run as `__main__` against its own committed dataset `research/construct_validity_data.csv`, which carries three columns where the function needs five.

| Component | Reported in the manuscript | Affected by the crash |
|---|---|---|
| `ac1()` | yes, both AC1 values | **no** |
| `analytic_ci()` | yes, both analytic intervals | **no** |
| `bootstrap_ci()` | yes, both bootstrap intervals | **no** |
| `krippendorff_alpha()`, `fleiss_kappa()` | not reported numerically in v3 | no |
| `per_condition_ac1()` | **not reported anywhere** | crashes |

**No reported value passes through the crashing function.** The defect is that a replicator who runs the script as documented gets a traceback before seeing the trained-reviewer block, and must import the module to reach it, as this audit did. It affects the replication experience, not the results.

A second defect in the same file: `dedup_last()` is a no-op against the committed CSV, which was already deduplicated before commit. Consequence: **no committed file demonstrates the 113 → 104 reduction.** The reduction is verified against the live table instead, and `recompute_current_ac1.py` sorts by `created_at` before deduplicating so the "latest submission retained" rule is deterministic rather than iteration-order dependent.

---

## PART 6. HISTORICAL VALUE CONTAMINATION

**SUPERSEDED VALUES FOUND:** `0.624`, `0.253 to 0.994`, `0.301 to 0.886`, `63 labels`, `108 submitted`, `99 after keeping`, plus the retired terminology `trained reviewer`, `blind raters`, `blinded raters`, `same pool`, `those same experts`, `expert panel`, `All 61`, `36 independent experts`.

**SUPERSEDED VALUES IN ACTIVE MANUSCRIPT:** **none.** `scripts/verify_manuscript_figures.py` checks 29 superseded values against v3 and reports the body clean of all of them.

**Where they persist:** in `research/construct_validity_data.csv` (the 2026-08-04 extract, which is the historical dataset and correctly holds historical values), in the superseded manuscript versions v2 through v9, and in the change logs that record the corrections. All are archival.

**CURRENT VALUE:** `0.623`, on 68 labels from 14 raters, paired with intervals computed on that same set.

**RISK: GREEN.** The one live hazard — a 68-label point estimate printed beside 63-label intervals — was the defect the Final pass repaired. `research/construct_validity_data.csv` is not labelled as superseded in the file itself, which is an archival tidiness matter and not a manuscript risk.

---

## PART 7. JRS CLAIM AUDIT

| Claim that must be absent | Present |
|---|---|
| JRS efficacy | no |
| JRS superiority | no |
| JRS validated / validation | no |
| JRS psychometrically validated | no (heading 8.6 states the negative) |
| JRS improved reviewer accuracy | no |
| JRS improved documentation outcomes | no |

Current wording, §7: *"For JRS, the result provides preliminary evidence that the record-level distinction embodied in its review logic is operationally detectable; it is not evidence that JRS itself improves documentation outcomes."*

Supporting boundaries retained: §5 states the comparison against unaided judgment is a separate study with its own participants and registration; heading 8.10 states "No criterion validity, and no efficacy."

**JRS CLAIM STATUS: PASS.**

---

## PART 8. DRR CLAIM AUDIT

| Construct | Distinguished | Where |
|---|---|---|
| Detectability | claimed, bounded to the constructed corpus | Abstract, §6.1, §7 |
| Reliability | reported and **failed** against the pre-registered lower bound | §6.5 |
| Criterion validity | explicitly not established | Abstract; §2 table "Not attempted"; 8.10 |
| Construct validity | explicitly construct-dependent | §4.4 "independent of the *results* and not fully independent of the *construct*"; §2.4 |
| Psychometric validation | explicitly not established | 8.6 |
| Workflow independence | explicitly a design intention, not a result | 8.5 |
| Efficacy | explicitly not established | 8.10 |
| Generalisability to human-authored records | explicitly not established | 8.5 |
| Cross-cultural validity | explicitly not established | 8.4 |
| Superiority over unaided judgment | out of scope, separate study | §5 |

The manuscript's own framing at §9: *"What the paper does not establish is longer than what it does."* The four-rung validity table at §2 marks criterion validity "**Not attempted.** Study 4."

**DRR CLAIM STATUS: PASS.**

---

## PART 9. REFERENCE-CLASSIFICATION CLAIM AUDIT

| Description that must be absent | Present |
|---|---|
| human raters | no — v3 states "not human raters" |
| expert raters | no |
| credentialed professionals | no |
| expert validators | no |
| human validation | no — v3 states it "does not constitute independent human validation" |
| criterion validation | no |

| Distinction | Stated correctly |
|---|---|
| Aware of the verification task | **YES** — "The verification packet identified the task as verification of an answer key" |
| Access to intended labels | **NO** — "without access to the intended labels" |
| Access to author-side classification | **NO** — "or to the author-side classification" |

**"Blind" terminology.** `blind raters` and `blinded raters` appear zero times in v3. The contradicted claim *"were not told that a reference classification existed to be recovered"* is removed. The surviving uses of "blind" refer to the reviewer panel, which was genuinely blind to the reference classification, and to the author-side classification being withheld.

**REFERENCE-CLASSIFICATION CLAIM STATUS: PASS.**

---

## PART 10. REPRODUCIBILITY DISCLOSURE

| Element | Status | Notes |
|---|---|---|
| Operational classification rule | **FULLY REPRODUCIBLE** | `research/AnswerKey_Verification_Packet.md`, complete text |
| Intended labels | **FULLY REPRODUCIBLE** | `research/Intended_Key_authorside.md`, all 24 with rationale |
| 24-record corpus | **FULLY REPRODUCIBLE** | released under the data-availability terms in §10 |
| Verified key | **FULLY REPRODUCIBLE** | `research/Verified_Key.md`, all 24 labels |
| Detection-panel results | **PARTIALLY REPRODUCIBLE** | aggregates in `closed_aggregates_2026-08-15.json`; producer recoverable only from git history; per-read data RLS-locked |
| Reliability results | **FULLY REPRODUCIBLE** | live `bench_labels` is anon-readable; `compute_ac1_ci.py` + `recompute_current_ac1.py` regenerate every value |
| 72 LLM classifications | **NOT REPRODUCIBLE** | aggregate only; no per-pass outputs |
| LLM model identity | **NOT REPRODUCIBLE** | not retained |
| LLM version | **NOT REPRODUCIBLE** | not retained |
| Execution date | **NOT REPRODUCIBLE** | not retained |
| Prompt | **PARTIALLY REPRODUCIBLE** | the rule given to raters is retained; no system prompt or wrapper |
| Temperature / configuration | **NOT REPRODUCIBLE** | not retained |
| Per-pass outputs | **NOT REPRODUCIBLE** | not retained |

**Does the missing information materially affect interpretation?** Partly. A replicator can apply the same rule to the same corpus with their own raters, human or automated, and check whether the key reproduces — which is the substantive replication. What they cannot do is reproduce *this particular* automated pass. v3 says exactly that.

**None of the missing fields can reasonably be recovered.** The pass was executed before the disclosure standard was set and the outputs were not written to disk. No recommendation to recover them is made.

---

## PART 11. ETHICS / PARTICIPANT DISCLOSURE

| Item | Manuscript statement | Assessment |
|---|---|---|
| IRB review | §4.8: *"This study was not reviewed by an institutional review board. It was conducted outside any institution holding an IRB, by an independent researcher, with adult professional volunteers"* | **ADEQUATE.** Stated plainly, no exemption claimed or implied |
| Informed consent | §4.8: participation voluntary, in a personal capacity, withdrawable before publication; attribution opt-in with consent | **ADEQUATE** |
| Voluntary participation | §4.8, and Acknowledgments *"All 58 worked unpaid, in a personal capacity"* | **ADEQUATE** |
| Compensation | uncompensated, stated twice | **ADEQUATE** |
| Professional identity | contributors named only with consent; may participate anonymously | **ADEQUATE** |
| Data retention | responses stored append-only, used only in aggregate | **ADEQUATE** |
| Anonymity / confidentiality | records constructed and de-identified; no real case, individual or organisation | **ADEQUATE** |
| Withdrawal exercised | §4.8 and Acknowledgments record one panel member who withdrew consent to be named; judgments retained unnamed at her election | **ADEQUATE**, and unusually candid |

**No IRB exemption or approval is invented anywhere.** The absence is disclosed as an absence.

**Assessment: ADEQUATE.**

---

## PART 12. NOVELTY CLAIM

**CURRENT NOVELTY CLAIM** (§2):

> "The claim of novelty is narrow and we state it narrowly. It is not that reconstructability has never been valued: it is presupposed throughout administrative law and audit practice. It is that reconstructability of the individual record **has not been operationalised as a measurable property with a stated instrument, a stated scale, and reported detection and agreement statistics**. That is what this paper supplies…"

**SOURCE SUPPORT:** none, and none is possible. This is a universal negative over the literature. The repository contains no systematic review, no search protocol and no coverage claim that could support it.

**OVERBROAD: YES.**

The paragraph does good work: it pre-empts the obvious objection by conceding that reconstructability is long-valued, and narrows the claim to operationalisation. But the narrowed claim is still stated as fact about the whole literature, without qualification. Reviewers in AI governance and measurement routinely require "to our knowledge" on exactly this construction, and its absence invites a reviewer to supply a counterexample and treat the omission as overreach.

**CLASSIFICATION: SURGICAL EDIT.**

A qualifying clause — "to our knowledge", "we are not aware of", or "we have not found" — resolves it without touching the substance. Not a blocker in the sense of invalidating anything, but it is the single item most likely to draw an avoidable reviewer objection, and it costs three words.

---

## PART 13. CONSTRUCT-DEPENDENCE

| Limitation | Present | Location |
|---|---|---|
| Author-generated corpus | **YES** | §4.2 provenance, §2.4, 8.1 |
| Author-defined operationalisation | **YES** | §4.4 "the reference classification encodes that operationalisation" |
| Bimodal spectrum / ends of the severity range | **YES** | §4.3, §7, and the §4.4 concession that unanimity indicates easy cases |
| Lack of naturalistic records | **YES** | 8.5, "establishes detectability on AI-generated records" |
| Lack of independent human validation | **YES, new in v3** | §4.4, "does not constitute independent human validation … No human replication … has been performed" |
| Lack of criterion validity | **YES** | Abstract, §2 table, 8.10 |
| Investigator dependence | **YES** | §9, "None of them removes investigator dependence", and the recommendation of an independent adjudicator |
| Competing interests | **YES** | §9, first author created the construct and would benefit from adoption |

The §2 four-rung table makes the position visible at a glance rather than burying it in a limitations section, and §9 states that what the paper does not establish is longer than what it does.

**CONSTRUCT-VALIDITY DISCLOSURE: ADEQUATE.**

---

## PART 14. EDITORIAL OVER-DEFENSIVENESS

**Qualitative assessment: A, with a trace of C.**

25 distinct limitation markers appear across the manuscript. For a paper whose first author created the construct under study, that density is defensible and is itself an integrity signal. A reviewer is far more likely to complain about an overclaiming paper than this one.

Five locations where the same concession is made more than once and the repetition is noticeable:

1. **§4.4 and 8.1** both make the construct-dependence point about the corpus instantiating the authors' operationalisation.
2. **§4.4 "a corpus on which automated raters never disagree is a corpus of easy cases"** and **§4.3 spectrum restriction** state the same easy-corpus concern from two directions.
3. **§6.3 and 8.9** both make the reviewer-heterogeneity point about not licensing individual-level reliance.
4. **§7 and 9** both state that what the paper does not establish exceeds what it does.
5. **Abstract, §2 table, and 8.10** each separately disclaim criterion validity.

Item 5 is arguably correct practice: an abstract-level disclaimer, a structural table and a limitations entry serve different readers.

**CLASSIFICATION: OPTIONAL.** No edit recommended. Compressing these would trade a real integrity signal for a marginal gain in concision, and every one of the repetitions is accurate.

---

## PART 15. UNRELATED TECHNICAL DEBT

| Issue | Affects this manuscript | Classification |
|---|---|---|
| `compute_ac1_ci.py` crash at `per_condition_ac1` | **YES**, reproducibility only; no reported value passes through it | REPRODUCIBILITY LIMITATION |
| `compute_ac1_ci.py` `dedup_last()` no-op on the committed CSV | **YES**, reproducibility only; the 113→104 step is not demonstrable from a committed file | REPRODUCIBILITY LIMITATION |
| `FULL_DATA_ANALYSIS_2026-08-15.txt` producer uncommitted | **YES**, partially; mitigated by `recompute_current_ac1.py`, which regenerates the reliability block | REPRODUCIBILITY LIMITATION |
| `api/pstat-4c8e1b6a2d90.js` deleted, recoverable from git only | **YES**, partially; the detection-panel producer | REPRODUCIBILITY LIMITATION |
| `construct_validity_data.csv` not labelled as superseded | NO | UNRELATED TECHNICAL DEBT |
| `E-11` unresolved identity | NO — no reported figure depends on it | UNRELATED TECHNICAL DEBT |
| Website deployment | NO | UNRELATED TECHNICAL DEBT |
| Cloudflare Workers check failing | NO — dashboard-side integration, no repository artifact | UNRELATED TECHNICAL DEBT |
| Outreach messages, due 31 August 2026 | NO | UNRELATED TECHNICAL DEBT |
| Arm B paper unwritten | NO — separate paper, correctly out of scope here | OPTIONAL FUTURE STRENGTHENING |
| Commercial pages paused | NO | UNRELATED TECHNICAL DEBT |
| `api/register.js` + `reference/index.html` undeployed | NO | UNRELATED TECHNICAL DEBT |
| `terms.html` placeholder spans | NO | UNRELATED TECHNICAL DEBT |

---

## PART 16. FINAL SUBMISSION GATE

| Issue | Evidence | Status | Submission Impact | Action |
|---|---|---|---|---|
| Novelty claim is an unhedged universal negative | §2, "has not been operationalised as a measurable property…"; no supporting source exists or could | **AMBER** | EDITORIAL RISK — most likely avoidable reviewer objection | Add "to our knowledge" or equivalent. One surgical edit |
| "before any reviewer was recruited" not verifiable | §4.2; `pilot_progress` exposes no registration timestamp; key committed 2026-07-06, reading by 2026-06-28 | **AMBER** | EDITORIAL RISK | Owner confirms from personal knowledge, or narrow to "before verification began" |
| 72 reference classifications not retained per pass | `Verified_Key.md` records the aggregate only | **AMBER** | REPRODUCIBILITY LIMITATION, disclosed in v3 | None. Already stated |
| Reference LLM identity, version, date, configuration not retained | no artifact | **AMBER** | REPRODUCIBILITY LIMITATION, disclosed in v3 | None. Not recoverable |
| Section 4.4 vs Appendix A vendor-specificity asymmetry | `:220` names three vendors; §4.4 can name none | **AMBER** | EDITORIAL RISK — a reviewer may ask | Optional one-clause note; not required |
| `compute_ac1_ci.py` crashes as `__main__` | `KeyError: 'basis_identification'`, line 169 | **AMBER** | REPRODUCIBILITY LIMITATION; no reported value affected | Fix post-submission |
| `dedup_last()` no-op on the committed CSV | 63 labels both deduplicated and not | **AMBER** | REPRODUCIBILITY LIMITATION | Fix post-submission |
| Detection producer recoverable only from git history | `closed_aggregates…json` names `api/pstat-4c8e1b6a2d90.js`, deleted at `120c11e` | **AMBER** | REPRODUCIBILITY LIMITATION | Restore or archive post-submission |
| Reference raters described as automated, not human | v3 §4.4 | **GREEN** | resolved in v3 | None |
| Contradicted blinding claim removed | v3 §4.4 | **GREEN** | resolved in v3 | None |
| Pre-registration deviation, 2 passes vs 3, disclosed | v3 §4.4 | **GREEN** | resolved in v3 | None |
| Judgment denominator 72 stated | v3 §4.4 | **GREEN** | resolved in v3 | None |
| "Nothing withheld" claim corrected | v3 §4.4 Disclosure | **GREEN** | resolved in v3 | None |
| Human-validation limitation added | v3 §4.4 | **GREEN** | resolved in v3 | None |
| Primary detection statistics trace to source | Part 4 above, 7 of 7 verified | **GREEN** | none | None |
| Reliability statistics trace to source | Part 5 above, 9 of 9 verified | **GREEN** | none | None |
| No superseded value in the active manuscript | 29 checked, body clean | **GREEN** | none | None |
| Participant architecture, 58 / 61 / three-person overlap | Part 3 above | **GREEN** | none | None |
| Arm A / Arm B expertise parity and disjointness | Part 3 above | **GREEN** | none | None |
| JRS claim boundary | Part 7 above | **GREEN** | none | None |
| DRR claim boundary | Part 8 above | **GREEN** | none | None |
| Ethics and consent disclosure | Part 11 above | **GREEN** | none | None |
| Construct-dependence disclosure | Part 13 above | **GREEN** | none | None |
| Pre-registration timing requirement met | analysis 2026-08-15, key 2026-07-06 | **GREEN** | none | None |
| Editorial repetition at five locations | Part 14 above | **GREEN** | none | None. Integrity signal outweighs concision |
| Human replication of the answer key | `JRS_Validation_Report.md:297` open item 4; blind packet ready | **OPTIONAL** | would materially strengthen §4.4 | Future work |
| Arm B comparison paper | separate registration | **OPTIONAL** | out of scope | Future work |
| `construct_validity_data.csv` unlabelled as superseded | archival tidiness | **OPTIONAL** | none | Post-submission |
| `E-11` unresolved identity | no reported figure depends on it | **OPTIONAL** | none | Post-submission |
| Website, Cloudflare, outreach, commercial pages, API deployment, `terms.html` | Part 15 | **GREEN** | none | Unrelated technical debt |

**SUBMISSION BLOCKERS:** 0

**AMBER ISSUES:** 8

**GREEN ITEMS:** 21

**OPTIONAL FUTURE STRENGTHENING:** 4

---

## FINAL RECOMMENDATION

**ONE SURGICAL CORRECTION THEN SUBMIT.**

The correction is the novelty hedge at §2. It is the only item that is both a manuscript defect and cheap to fix: a universal negative about the literature, stated without qualification, in a paper that is otherwise scrupulous about the limits of what it claims. Three words resolve it.

Everything else that remains is either disclosed in the manuscript already, or is post-submission housekeeping, or is future research. The reproducibility gaps around the automated reference pass are real, are not recoverable, and are now stated in the paper rather than papered over — which is the correct disposition for a limitation that cannot be cured.

The "before any reviewer was recruited" claim needs your confirmation rather than my edit. If you can date the author-side classification against the first recruitment from your own records, leave it. If you cannot, narrowing it to "before verification began" costs nothing and is fully supported by `Intended_Key_authorside.md`.

---

**FINAL STATUS:**
AMBER

**RECOMMENDATION:**
ONE SURGICAL CORRECTION THEN SUBMIT

**MANUSCRIPT MODIFIED:**
NO

**DATA MODIFIED:**
NO

**SCRIPTS MODIFIED:**
NO

**PREREGISTRATION MODIFIED:**
NO

**COMMITS CREATED:**
NO
