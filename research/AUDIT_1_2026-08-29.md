# AUDIT 1: pre-surgical-revision audit

**Manuscript.** `research/Detection_Article_Submission_FINAL5_2026-08-18.md`, frozen as `v1-preaudit`, SHA-256 `9506eb8cc15bbdf82189a3094211abc7693ec03e424c86cbf8c08b35c47cbc18`, 12,590 words, 622 lines.

**Contract.** `research/AUDIT_PROMPT_MASTER.md`, run point 1 of 3.

> **OWNER COPY. DO NOT FORWARD.** Section F names the internal arm and rung nomenclature in order to certify that none of it reaches the manuscript, and Section K points at the participant inventory, which is itself an owner copy because it shows the arm split. Neither the split nor the Arm B method appears here, and no participant is named anywhere in this file, but the vocabulary alone is enough that this report goes to the authors and to nobody else. Anything shared outward is counts only.

**Machine pass.** `python3 scripts/audit_manuscript.py`, 61 checks. Findings in `research/AUDIT_1_findings_2026-08-29.json`.

**Nothing in this audit was applied to the manuscript.** Audit 1 identifies the correction set. The corrections are a separate, authorised pass that produces `v2-surgical`.

---

## A. Executive verdict

| Dimension | Grade | Basis |
|---|---|---|
| Scientific | 84 / 100 | Pre-registered, blinded, correct unit of observation, a failed criterion reported rather than buried. Held back by n = 16, a bimodal author-generated corpus, and no criterion validation. |
| Methodological | 86 / 100 | Every reported figure reconciles arithmetically. The estimand is stated correctly and the confidence interval reproduces exactly from the reported mean, SD and n. One real accounting defect in the reliability table. |
| Publication readiness | 62 / 100 | The manuscript is close. The package is not: no keywords, no AI-use disclosure, no ORCID, no named venue, no title page, no cover letter. |
| Research integrity | 88 / 100 | Unusually strong. The conflict is declared without minimisation, the failed criterion is retained, the withdrawn contributor is honoured, and the provenance gap is disclosed rather than reconstructed. |
| **Overall** | **80 / 100** | |

**Recommendation: revise before submission.**

Not "major revision". The scientific and integrity work is done and the claim architecture is already narrower than most authors would allow. What stands between this manuscript and submission is one genuine numerical defect, one credit-denominator error introduced on 29 August, five uncited references, and a submission package that does not yet exist.

**The single most important sentence in this audit:** the reliability table on line 283 pairs a ten-record count with a fifteen-record label count. That is the only defect found that a hostile reviewer could describe as an error of fact rather than of presentation.

---

## B. Critical P0 corrections

### P0-1. Section 6.5 pairs a ten-record count with a fifteen-record label count

**Location A.** Line 283, Section 6.5. The regular-reviewer row reads `| Regular reviewers | 10 | 68 | 14 | 0.623 | ... |`, and the sentence above it reads: "the ten records with two or more raters formed the analysed reliability set. Those ten records carry 113 submitted determinations, reduced to 104 after keeping one label per rater per record".

**Location B.** `research/current_reliability_2026-08-18.json`, the file that produced the printed coefficients. The regular-reviewer block reports:

```
"labels": 68,
"raters": 14,
"records_with_any_label": 15,
"records_estimable": 10,
"records_single_rater": 5,
```

**Nature of the discrepancy.** `research/recompute_current_ac1.py::block` sets `"labels": len(rows)` over every row in the group. The 68 therefore spans all fifteen records the regular reviewers labelled, not the ten that enter the coefficient. Because 104 is 36 + 68, the 104 spans fifteen records as well. The table prints `Records 10` beside `Labels 68`, and the prose attributes 104 to the ten records. A record count and a label count from different record sets appear on the same row and in the same sentence.

**Corroboration.** The ten-record deduplicated count is 104 less the five single-rater labels, that is **99**. `research/reliability_labels_2026-08-04.tsv` is an extract of exactly the analysed set and carries **99 rows over 10 records with no single-rater record**. Two independent sources agree that 99, not 104, is the ten-record figure.

**The expert row is unaffected.** That group reports `records_single_rater: 0`, so its 10 and its 36 come from the same record set.

**Does this change any result?** No. AC1, the intervals and the failed criterion are computed over the estimable records regardless of how the label total is described. This is an accounting error in the table's labelling, not an error in the coefficients.

**Evidence required before correcting.** The 2026-08-18 per-record five-condition label counts, split into the ten estimable records and the five single-rater records. Those counts are not in this repository. The 2026-08-04 extract is a fortnight stale and cannot be substituted for them.

**Recommended correction.** Keep 104 where it is described as the deduplicated five-condition set and say that it spans fifteen records; give the ten-record analysed set its own number in the table. **Do not change 104, 68 or 113 without those counts.**

**Reviewer risk.** High. A reviewer who requests the reliability data will reproduce 99 and find the paper says 104. That is the kind of finding that converts a revise into a reject, not because the error is large but because it suggests the numbers were not checked against the source.

### P0-2. The submission package does not exist

Absent from the manuscript file and from the repository: **keywords, AI-use disclosure, ORCID, a named target venue, a title page as a separate file, a cover letter.**

Each is required or expected by essentially every journal in scope. The AI-use disclosure is the sharpest of the six: a paper whose subject is AI-generated records, whose corpus was AI-generated, and which used automated raters, will be read with particular attention to what it says about its own use of AI. Its absence is conspicuous in a way that a missing keyword line is not.

**Not asserted here:** any specific journal's current requirements. Master prompt Section 21 and absolute rule 13 forbid stating them from memory, and none has been verified in this run. Before submission, open the target journal's own author guidance and check word limit, abstract structure, reference style, declaration wording and supplementary-file policy against the package.

---

## C. Surgical revision map

| # | Location | Current | Action | Recommended | Reason | Reviewer risk | Priority |
|---|---|---|---|---|---|---|---|
| 1 | L283, §6.5 table and prose | `Records 10` beside `Labels 68`; "Those ten records carry 113 ... reduced to 104" | VERIFY then REPLACE | Give the ten-record set its own label count; state that 104 spans fifteen records | The two figures come from different record sets | A reviewer reproducing the data gets 99, not 104 | **P0** |
| 2 | Package | No keywords, AI-use disclosure, ORCID, venue, title page, cover letter | ADD | Six separate package items | Required by journals in scope | Desk rejection | **P0** |
| 3 | L469, Appendix B | "Appendix B uses the 113 recorded five-condition determinations" | REPLACE | Name the record set in the same clause | §6.5 has just said fifteen records carry labels, so an unqualified 113 reads as global | Reader cannot reconcile 113 with 15 | P1 |
| 4 | L597, Acknowledgments | "Of the twenty-five reliability raters, three have confirmed" | REPLACE | "Of the eight invited expert raters, three have confirmed and three elected to be named", plus a clause recording that the other raters took part anonymously by design | Seventeen of the twenty-five are browser-generated codes never bound to an identity; they cannot confirm | Implies 22 confirmations that will never arrive | P1 |
| 5 | References | Cohen 1960, Cronbach 1955, Messick 1995, Mittelstadt 2016, Wachter 2017 | DELETE or CITE | Either cite each in the body or remove it | Five entries are never cited anywhere in the manuscript or appendices | Copy-editor queries every one | P2 |
| 6 | L41 | "as plainly as we know how" | REPLACE | "Section 2.4 states that limit; Section 10 says what would close it." | Named in master prompt §19 | Reads as protesting candour | P2 |
| 7 | L166 | "The consequence is specific and we accept it" | REPLACE | "The consequence is specific:" | Named in master prompt §19 | Same | P2 |
| 8 | L178 | "read honestly, a second indication" | REPLACE | "is also a second indication" | Named in master prompt §19 | Same | P2 |
| 9 | L216 | "Ethics review status, stated plainly." | REPLACE | "Ethics review status." | Named in master prompt §19 | Same | P2 |
| 10 | L259 | "Reviewer heterogeneity is a finding, not noise" | KEEP | | This one earns its place: it is a section heading that states a methodological position the section then defends | None | P3 |
| 11 | L294 | "The correct reading is that" | REPLACE | "The reliability sample is too small to establish reliability." | Named in master prompt §19 | Same | P2 |
| 12 | §4.9 L226 and §6.5 L281 | "Sixteen labels" and "Three regular reviewers" stated separately | VERIFY then MOVE | State both in one place: "sixteen labels from three raters" | The paper never gives labels per rater, so the reader cannot check the exclusion | Low, but it is a free fix | P2 |

**Item 10 is a deliberate KEEP.** The master prompt lists "not noise" among the phrases to watch. Here it is doing methodological work rather than performing candour: the section argues that dispersion is a result, and the heading states that claim. Removing it would sterilise the author's voice, which the prompt forbids.

---

## D. Statistical audit

**Every reported figure reconciles.** This is the strongest part of the manuscript and it is worth stating precisely, because it is what the author can rely on under challenge.

| Check | Result |
|---|---|
| 16 reviewers × 24 records = 384 graded reads | Reconciles |
| Appendix C item table sums to 322 of 384 = 83.85%, printed as 83.9% | Reconciles |
| All 24 item rows agree with their own printed percentage | Reconciles |
| (sensitivity 87.0 + specificity 80.7) / 2 = 83.85 | Reconciles, as it must on a per-reviewer balanced corpus |
| 83.9 ± t(15, .975) × 21.0/√16 = 72.7 to 95.1 | **Reproduces exactly** |
| 113 determinations × 5 conditions = 565 condition labels | Reconciles |
| 216 + 207 + 142 = 565 coding-level labels | Reconciles |
| 41 fixed-set runs + 15 short runs = 56 cross-vendor runs | Reconciles |
| 8 experts + 17 regular = 25; 8 + 14 = 22 analysed; 14 + 3 = 17 | Reconciles |
| 16 + 25 + 20 = 61 participations, less 3 dual-code people = 58 distinct | Reconciles |
| Appendix C floor "at least ten of the sixteen" matches the table minimum | Reconciles |
| Record-accuracy range 62.5 to 93.8 matches the table | Reconciles |
| 11 countries asserted, 11 named | Reconciles |

**The estimand is stated correctly and defended.** §4.6 names the reviewer as the unit of observation, gives the reason, and says what treating reads as independent would do to the interval. §6.1 labels the interval "participant level, n = 16". The master prompt's specific warning, that "panel accuracy" must not imply 384 independent observations, is already answered in the text.

**One presentational residue.** The phrase "Panel accuracy" survives in the §6.1 table and in the Abstract. It is defused everywhere it appears, by "(participant level, n = 16)" in the table and by the Abstract's own "Accuracy is analysed at the participant level, treating each reviewer rather than each read as the unit of observation". The master prompt prefers "Mean reviewer-level accuracy against the reference classification". This is a P3 preference, not a defect, and is not in the revision map because the current wording is already qualified at every occurrence.

**The failed criterion is handled correctly.** §6.5 states both parts of the pre-registered floor, reports the analytic interval as the pre-specified construction, reports the bootstrap as a sensitivity analysis, and says in terms: "We do not treat that as satisfying the pre-registration." It then names the reason the pre-registration exists. This is the strongest single passage in the paper and nothing in this audit touches it.

**Appendix C is correctly bounded.** Labelled exploratory at the head, the record SD of 0.011 carries its own subsection saying it "must not be interpreted as zero", and the profile interval 0.001 to 0.556 is given as the informative quantity. §8.3 is updated to match. The master prompt's specific concern, that a boundary estimate becomes proof that record difficulty is negligible, does not arise here.

---

## E. Construct and conceptual audit

**All eleven prohibited implications are explicitly disavowed.** Verified mechanically:

criterion validity · measurement invariance · workflow independence · psychometric validation of the five conditions · advantage over unaided judgment · reproducibility as validity · group accuracy as individual reliability · bootstrap as satisfying the pre-registration · accuracy as field performance · boundary record variance as zero · Appendix C as confirmatory.

**The DRR / JRS distinction holds throughout.** §3 states that the detection task "does not require reviewers to apply" JRS. §7 says the result "is not evidence that JRS itself improves documentation outcomes". §5 fences the comparison study off in one paragraph and says the boundary is "stated once, here, and not repeated".

**The novelty claim is already narrow.** §2.2 states it as: not that reconstructability has never been valued, but that reconstructability *of the individual record* has not been operationalised as a measurable property with a stated instrument, scale, and reported statistics. That is defensible and is the narrowest form of the claim available.

**The adjacent-construct table asserts eight distinctions, none empirically demonstrated.** This is correct and the paper does not pretend otherwise, but the prose around the table does not say it in one place. A reviewer will ask. **Recommended addition, P2:** one sentence after the table stating that the distinctions are conceptual and that none is tested by this study.

**The relational reformulation is a strength, not a weakness.** §2.4 abandons an earlier intrinsic-property formulation in the paper's own voice and states the construct-validity limit that follows. Reviewers reward this. It should not be softened in revision.

---

## F. Research-integrity audit

| Item | Status |
|---|---|
| Competing interests | Declared without minimisation. §9 states the conflict, lists the mitigations, then says "Those mitigations are real and they are not sufficient" |
| Residual investigator dependence | Named: corpus authorship, the operationalisation encoded in the key, and the absence of an independent validation adjudicator |
| Funding | "No external funding was received. No participant was compensated." Present but buried at the end of §9; journals want it as its own declaration |
| Ethics review | Absent IRB declared, with the reason and the safeguards actually applied. Not glossed |
| Consent | Voluntary, uncompensated, withdrawable before publication, opt-in attribution |
| Withdrawal honoured | One panel member withdrew consent to be named after data close; her judgments remain, unnamed, at her election, and the paper says so |
| Provenance | The gap is disclosed in §4.3 and again in Data availability. Not reconstructed |
| AI-use disclosure | **Absent.** See P0-2 |
| Data availability | Present and specific about what is released and what was not retained |
| Reproducibility | Analysis scripts released; the per-pass execution record for the three automated reference passes was not retained, and the paper says so |

**The blind is intact.** The manuscript contains no instance of "Arm A", "Arm B", "B1", "B2", "Rung 2a" or "Rung 2b". The comparison study's participants are described only by the label the paper already uses in public prose. Verified mechanically and guarded.

---

## G. Internal-consistency audit

**One confirmed discrepancy** (P0-1, above) and **two items requiring source documents**:

| # | Location A | Location B | Nature | Evidence required |
|---|---|---|---|---|
| 1 | §6.5 L283, `Records 10` / `Labels 68`, "ten records ... 104" | `current_reliability_2026-08-18.json`, `records_with_any_label: 15`, `records_single_rater: 5` | A ten-record count and a fifteen-record label count on one row | 2026-08-18 per-record label counts, split ten / five |
| 2 | Appendix B L469, "the 113 recorded five-condition determinations" | §6.5 L283, "Fifteen records carried at least one label" | Appendix B does not name its record set, so 113 reads as global | Same counts as row 1 |
| 3 | §4.9 L226, "Sixteen labels" | §6.5 L281, "Three regular reviewers" | Labels per rater is never stated, so the exclusion cannot be checked | Per-rater baseline label counts |

**Everything else reconciles.** Thirteen separate arithmetic identities were checked and all thirteen hold. See Section D.

---

## H. Publication and submission audit

**Present in the manuscript:** title, abstract, author information, author contributions, competing interests, funding sentence, ethics statement, consent statement, data availability, acknowledgements, references, tables, appendices A to C.

**Absent, and required before submission:**

| Item | Destination | Note |
|---|---|---|
| Keywords | Manuscript | 4 to 6, drawn from the abstract's own terms |
| AI-use disclosure | Manuscript, own declaration | The sharpest omission given the subject matter |
| ORCID for both authors | Metadata | Register if either lacks one |
| Named target venue | Cover letter and internal record | Not currently recorded anywhere in the manuscript |
| Title page as a separate file | Package | Most journals require author details separable for blind review |
| Cover letter | Package | Must state the venue, the contribution, and what the study does not claim |
| Funding as its own declaration | Manuscript | Currently a sentence at the end of §9 |

**Retain in the research archive, do not submit unless asked:** the participant inventory by rung (owner copy, shows the arm split), the contributor credit list, the reliability source extracts, the frozen version store, and this audit.

---

## I. Peer-review attack map

The twenty-eight anticipated objections in master prompt §23 were worked through. Twenty-two are already answered in the manuscript text. The six that are not, or not fully, are below.

| # | Criticism | Valid? | Severity | Response | Manuscript action |
|---|---|---|---|---|---|
| 1 | "Your reliability numbers do not reproduce. I get 99 labels on ten records, you print 104." | **Yes** | **High** | The coefficients are correct; the label total in the table spans fifteen records while the record count spans ten. | **Fix before submission.** P0-1 |
| 2 | "What does 24 of 24 automated agreement establish?" | Partly | Medium | §4.4 already answers: reproducibility of the rule, not validation of the labels, and unanimity is itself a second indication of the spectrum problem. | None. The answer is in the text |
| 3 | "Why should I believe DRR is distinct from reviewability or auditability?" | Yes | Medium | The distinctions are conceptual and none is tested here. | **Add one sentence** after the §2.2 table saying so. P2 |
| 4 | "Sixteen reviewers is too few." | Yes | Medium | Conceded. The interval is wide and reported; §8.9 and §6.3 both say the sample cannot characterise heterogeneity. | None. Do not argue |
| 5 | "You created the construct, the corpus and the key. Why is this not self-validation?" | Yes | High | §9 concedes it, names what the mitigations do not fix, and names the fix that has not been done. | None. §9 is already the right answer |
| 6 | "Where is your AI-use disclosure?" | **Yes** | **High** | No answer currently exists. | **Add the declaration.** P0-2 |

**On objections 4 and 5, the instruction is to concede.** The master prompt is explicit: never argue with a reviewer where a clarification or a methodological concession resolves the issue. The manuscript already concedes both in the text; the risk is the author arguing in correspondence what the paper concedes on the page.

---

## J. Author defence briefing

Short answers, to be given without reaching for the paper.

**What DRR is.** Whether a consequential decision record lets an independent reviewer reconstruct the basis for the decision from the record and what that reviewer can legitimately be expected to know. It is relational: defined against a stated reviewer standpoint, not as an intrinsic property of the document.

**What JRS is.** The record-level review method that evaluates a record against five documentation conditions and returns one of three reads. DRR is the property; JRS is the instrument. The detection study does not require reviewers to apply JRS.

**What the study tested.** Whether independent experts can tell apart records constructed to instantiate the operationalised distinction, blind to the key.

**What it did not test.** Criterion validity, measurement invariance, workflow independence, the psychometric structure of the five conditions, any advantage over unaided judgment, and any effect on documentation outcomes.

**What the 83.9% is.** The mean of sixteen reviewer-level accuracy scores, each out of 24 records. Not a pooled proportion over 384 reads, and not an estimate of field performance.

**Why sixteen reviewers are the analytical units.** Reads from one reviewer reflect one person applying one threshold. Treating 384 reads as independent would understate uncertainty substantially. The interval is a t interval across the sixteen scores.

**Why the corpus is bimodal.** Deliberate, so the detection question could be asked cleanly. It makes classification easier than the operational task, in the way a diagnostic test evaluated on clear-cut cases overstates field performance. Study 1b is specified to fix it.

**What the automated raters established.** That three model passes, without access to the intended labels, reproduced the operational classification rule on all 24 records. That rules out fitting the key to the reviewers' answers. It is not independent human validation and it is not criterion validity, because the raters were briefed with the authors' own operationalisation.

**Why the reliability criterion failed.** The floor had two parts, a point estimate of at least 0.61 and a lower bound of at least 0.41. Both point estimates cleared the first. Neither cleared the second on the analytic interval, which is the interval the plan specified. The expert lower bound was 0.402 against a required 0.41.

**Why the bootstrap does not rescue it.** The bootstrap puts the expert lower bound at 0.427. Choosing the interval that clears a criterion after seeing both is the practice pre-registration exists to prevent. It is reported as a sensitivity analysis and nothing more.

**Why the failed criterion is retained.** A threshold not met is a result. Reporting it is why the pre-registration was written.

**Why reviewer heterogeneity matters.** Accuracy ran from 37.5 to 100 percent with an SD of 21 points, and at least one credentialed professional scored below the balanced-corpus chance benchmark. Group-level detectability does not license individual-level reliance. Any production process built on this needs calibration, sampled double review, or adjudication.

**Why the international panel is not cross-cultural validity.** Eleven countries reduces the chance of a blind spot shared by one professional culture. With one to three participants per country there is no power to estimate jurisdictional effects and none was tested. It is a design feature, not a validation result.

**Why this is AI ethics.** Not because humans need help producing unreconstructable records. Because generative assistance raises the apparent completeness, fluency and professional register of a record without guaranteeing that the evidentiary chain survives, and the reader's ordinary heuristics for spotting a thin record lean on exactly the surface signals that assistance now supplies. That is a theoretical proposition motivating the work, not a finding of this study.

**Largest construct-validity limitation.** The corpus instantiates the authors' operationalisation and the key encodes it, so recovering the key shows the operationalisation is recognisable, not that it carves a phenomenon that exists independently of the definition.

**Largest external-validity limitation.** Twenty-four constructed, AI-generated records at the two ends of the severity range, judged by a self-selected credentialed panel. Nothing here speaks to ambiguous records, human-authored records, or real ones.

**The next study.** Study 1c: an independently generated corpus with independent adjudication. It is the single highest-value addition and it addresses the objection the authors cannot answer from the current design.

**What would falsify or materially weaken this.** Expert accuracy at or near chance on a graded-severity corpus; failure of an independently generated corpus to reproduce the detection result; or an independent adjudicator reaching different classifications from the same records and protocol. Any of the three would undercut the interpretation, and the first two are already specified as Studies 1b and 1c.

---

## K. Research archive checklist

| Item | State |
|---|---|
| Protocol and analysis plan, registered pre-collection | Held |
| Amended analysis plan adding the crossed model | Held, and labelled exploratory in the paper |
| The 24 constructed records | Held |
| Reference classification with per-record reason and conditions implicated | Held |
| Instructions given to the automated raters | Held |
| Record-by-record automated reproduction result | Held |
| Per-pass execution records for the three automated passes | **Not retained.** Disclosed in §4.4 |
| Record-level generation provenance | **Not retained.** Disclosed in §4.3 and Data availability |
| Coded participant-level response data | Held, under access terms |
| Analysis scripts reproducing every figure | Held |
| Reliability source extracts | Held: `current_reliability_2026-08-18.json`, `reliability_labels_2026-08-04.tsv` |
| Participant inventory by rung | Held. **Owner copy, shows the arm split, do not forward** |
| Contributor credit list and elections | Held |
| Frozen manuscript versions | `v1-preaudit` frozen; hash-checked on every drift run |
| This audit and its machine findings | Held |
| Provenance-status memorandum | **Does not exist.** Recommended: build one marking each field Known, Partially recoverable, or Not recoverable, without reconstructing anything |

---

## L. Final readiness decision

## NOT READY

**Minimum corrections to reach READY:**

1. **Settle P0-1** with the 2026-08-18 per-record label counts, then correct the §6.5 table and the sentence above it. Do not adjust any figure without those counts.
2. **Build the six missing package items:** keywords, AI-use disclosure, ORCID, named venue, separate title page, cover letter.
3. **Correct the credit denominator** at line 597 to the eight invited expert raters.
4. **Resolve the five uncited references:** cite or remove.
5. **Verify the target journal's current requirements** against the package, from the journal's own guidance rather than from memory.

Items 1 to 4 are inside the authors' control today. Item 5 requires a venue decision that has not been made.

**Everything else in this manuscript is submission-grade.** The claim architecture, the failed-criterion reporting, the conflict declaration and the arithmetic are all stronger than the median paper in this field. The gap is administrative, plus one table row.
