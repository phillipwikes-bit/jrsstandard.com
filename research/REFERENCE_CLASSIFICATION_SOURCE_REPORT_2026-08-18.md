# REFERENCE CLASSIFICATION: SOURCE-OF-TRUTH REPORT

**Date:** 2026-08-18
**Repository:** phillipwikes-bit/jrsstandard.com
**Manuscript audited (read only, not modified):** `research/Detection_Article_Submission_Final_v2_2026-08-18.md`
**Scope:** information gathering and source verification only. No manuscript, dataset, statistic or participant record was modified.

---

## 1. EXECUTIVE FINDING

**The reference classification was reproduced by three raters, and those three raters were large-language-model instances, not people.** The source record states this in terms and flags it as a publication issue.

`research/Verified_Key.md:8`:

> "**Disclosure (important for publication):** the three raters in this pass were independent large-language-model instances applying the objective operational rule, **not human raters**. … For the peer-reviewed write-up, replicate with 1–2 **human** raters using the blind packet in `AnswerKey_Verification_Packet.md`; the human result is the gold standard the paper should report."

`research/JRS_Validation_Report.md:187` repeats the same disclosure verbatim. `research/JRS_Validation_Report.md:297` carries the human replication as open item 4.

The manuscript nowhere states this. Section 4.4 says "blind raters"; the Abstract says "raters blind to the study hypotheses"; Section 3 says "blinded raters"; the validity table says "raters not involved in corpus construction". Every one of those reads as human to a reviewer.

**Three further findings, none of which the manuscript currently reflects:**

- **The rater count executed does not match the count planned.** Protocol, pre-registration and the blind packet all specify **two** raters with an adjudication rule. **Three** were used. The manuscript says only "blind raters".
- **The judgment denominator is 72, not 24.** Three raters × 24 records. "24 of 24" is a record count, not a judgment count.
- **The verified key was fixed after detection-panel reading began.** The key was committed 2026-07-06; the earliest recorded detection-panel activity is 2026-06-28. The pre-registration requires the key to be fixed before *analysis*, which it was, so no pre-registration term was breached. The manuscript does not state the sequence either way.

---

## 2. NUMBER OF REFERENCE RATERS

**Three.** ESTABLISHED.

| Source | Wording | Count |
|---|---|---|
| `research/Verified_Key.md`, Method | "**Three independent raters**, each blind to the study's hypotheses and to the intended construction labels" | 3 executed |
| `research/Verified_Key.md`, Result | "All **three** raters assigned identical labels on all 24 records." | 3 executed |
| `research/JRS_Validation_Report.md:187` | "The **three** raters in this verification pass…" | 3 executed |
| `research/DRR_Detection_Validation_Protocol.md:30-33` | "an **independent rater**… A **second independent rater** resolves any record on which the first rater disagrees… requires only **one to two** independent raters" | 1–2 planned |
| `research/OSF_PreRegistration.md:27-28` | "**Two raters** blind to the hypotheses and to the intended labels apply this operational rule to all 24 records. Rater 1 scores all 24; Rater 2 resolves any record where Rater 1 diverges" | 2 planned |
| `research/AnswerKey_Verification_Packet.md:16` | "**Rater 1** scores all 24. **Rater 2** independently scores any record and, if used to resolve, scores all 24 as well." | 2 planned |
| `research/Intended_Key_authorside.md`, header | "**Two independent raters** (blind to these labels) apply the operational rule" | 2 planned |

**Planned 2 (with a conditional adjudicator). Executed 3, all scoring all 24 independently.** The executed design is stronger than the planned one: three full independent passes instead of one pass plus conditional adjudication. The deviation is undocumented in the manuscript.

---

## 3. REFERENCE RATER IDENTITIES / CODES

**NOT ESTABLISHED FROM AVAILABLE SOURCE RECORDS.**

No participant code, rater ID, model name, vendor, version, date, or per-rater response sheet exists anywhere in the repository for the three reference raters. `research/Verified_Key.md` records only the aggregate outcome. Searches for `reference rater`, `verification rater`, `key rater`, `Rater 1/2/3` return only the planning documents listed in section 2.

The three vendors named elsewhere in the programme (`Detection_Article…:220`, Appendix A machine consistency) are Anthropic, OpenAI and Google. **No source states that the reference-key raters were those three systems.** That inference is available and is not made here.

| Item | Status |
|---|---|
| Rater identifiers | NOT ESTABLISHED |
| Model names or vendors | NOT ESTABLISHED |
| Model versions | NOT ESTABLISHED |
| Date of the blind pass | NOT ESTABLISHED (file committed 2026-07-06; the pass itself is undated) |
| Per-rater response sheets | NOT ESTABLISHED — no artifact exists |
| Raw per-rater labels | NOT ESTABLISHED — only the unanimous aggregate is recorded |

---

## 4. PROFESSIONAL QUALIFICATIONS

**Not applicable, and established as not applicable.** The raters were software systems. No professional domain, credential, seniority, sector or jurisdiction is recorded, and none could be.

---

## 5. EXPERT STATUS

**STATUS:** F — another category. **Automated raters (large-language-model instances) applying a written operational rule.**

Not A (independent experts), not B (credentialed professionals), not C (trained reviewers), not D (regular reviewers), not E (author-selected raters of unspecified qualification — the qualification is specified, it is simply not a human one).

**SOURCE:** `research/Verified_Key.md:8`; `research/JRS_Validation_Report.md:187`

**EXACT WORDING:** "the three raters in this pass were independent large-language-model instances applying the objective operational rule, not human raters"

**INTERPRETATION:** The source explicitly forecloses the human reading. It also supplies its own justification: "The operational rule is designed to be objective ('any competent person can apply it and check the result'), so this is a legitimate first-pass verification that removes author circularity." That justification is about the *rule*, not about the raters, and the same source immediately states that the human pass "is the gold standard the paper should report."

**No source characterises the reference raters as experts. That characterisation is not available and is not made.**

---

## 6. STUDY MEMBERSHIP

| Question | Answer | Basis |
|---|---|---|
| Members of Study 011 / Arm A? | **No** | not human; `pilot_progress` holds `V-AI-##` codes only |
| Members of Study 012 / Arm B? | **No** | not human; `armb_progress` holds `RR-###` codes only |
| Members of Study 004 reliability? | **No** | not human; `bench_labels` holds `E-` and `R-` codes only |

The three participant tables were read live on 2026-08-18. None contains a rater code attributable to the reference pass.

---

## 7. ARM A OVERLAP

**NO.** The reference raters were not human and hold no `V-AI-##` code. Live `pilot_progress`: 27 registered codes, 16 at 24 reads, none attributable to the reference pass.

---

## 8. ARM B OVERLAP

**NO.** Live `armb_progress`: 21 registered codes, 20 at 24 reads, one partial (`RR-108`, 9 reads). None attributable to the reference pass.

---

## 9. STUDY 004 OVERLAP

**NO.** Live `bench_labels`: 129 rows, 25 distinct rater codes (8 `E-`, 17 `R-`). None attributable to the reference pass.

---

## 10. COMPENSATION / VOLUNTARY STATUS

**Not applicable.** Software systems are neither compensated nor volunteers. No source records payment or consideration in connection with the reference pass.

This bears on a manuscript statement. `Detection_Article…:212` states that participation was "voluntary, uncompensated, and in a personal capacity". That sentence is scoped to reviewers and is accurate as written; it does not extend to the reference pass and does not need to.

---

## 11. REFERENCE CLASSIFICATION CREATION

| Question | Answer | Source |
|---|---|---|
| Who created the author-side classification? | The first author | `research/Intended_Key_authorside.md`, header; `Detection_Article…:172` |
| When? | Committed 2026-07-06 (`db7a34c`); the file states it was fixed before verification | `git log`; file header |
| Methodology | A written operational rule: identify each material conclusion; ask whether it is traceable to identifiable supporting evidence within the record; GROUNDED if every material conclusion is traceable, UNGROUNDED if at least one is not | `research/AnswerKey_Verification_Packet.md`, "The rule"; `research/OSF_PreRegistration.md` |
| Based on JRS? | **Partly.** The author-side file records "the JRS conditions implicated" per record, but the binary rule itself does not invoke the five conditions | `Detection_Article…:172`; `AnswerKey_Verification_Packet.md` |
| Based on DRR? | **Yes.** The grounded/ungrounded binary is the operationalised DRR distinction | `OSF_PreRegistration.md`, "Ground truth" |
| A separate rubric? | The binary operational rule is separate from, and simpler than, the five-condition instrument | `AnswerKey_Verification_Packet.md` versus the five conditions in `api/review.js` |
| Independently checked before the blind pass? | **No.** The blind pass *was* the check | `Intended_Key_authorside.md`, header |
| Design | 12 grounded, 12 ungrounded, balanced | `Intended_Key_authorside.md` |
| Per-record rationale recorded? | **Yes**, one line per record | `Intended_Key_authorside.md` table |

---

## 12. BLIND-RATER PROCEDURE

From `research/Verified_Key.md`, Method:

> "Three independent raters, each blind to the study's hypotheses and to the intended construction labels, were given only the operational rule and the 24 records and asked to classify each GROUNDED or UNGROUNDED. Raters worked independently, with no access to one another's answers or to the intended key."

| Element | Established |
|---|---|
| Each rater received all 24 records | Yes |
| Each rater classified all 24 | Yes — "All three raters assigned identical labels on all 24 records" |
| Raters worked independently | Yes — "no access to one another's answers" |
| Raters saw the intended key | No |
| Raters saw the operational rule | Yes, and only that |

---

## 13. INSTRUCTIONS PROVIDED

The full instruction set is `research/AnswerKey_Verification_Packet.md`, quoted here in the minimum necessary:

> "You are helping verify the answer key for a study of records. You are **blind to the study's hypotheses and to any intended labels.** Apply the rule below to each of the 24 records and record one label per record."
>
> "1. Identify each **material conclusion** in the record — a statement that, if incorrect, would change the decision or its defensibility. 2. For each material conclusion, ask: **is it traceable to identifiable supporting evidence *within the record itself*** … 3. Label the record: **GROUNDED** if *every* material conclusion is traceable … **UNGROUNDED** if *at least one* material conclusion is not traceable."
>
> "Judge the record on its own terms only. Do not use outside knowledge of the topic, and do not judge whether the decision was correct — only whether its basis is visible in the record."

| Question | Answer |
|---|---|
| Told the purpose of the study? | Told only that they were verifying an answer key for "a study of records". Hypotheses withheld |
| Told the intended classification? | No |
| Given the five-condition JRS instrument? | **No.** They received the binary operational rule only |
| Given JRS training? | **No** |
| Given examples? | **No.** The packet contains the rule and the 24 records; it contains no worked example |
| Same instructions as the detection panel? | **No.** The detection panel applied the five-condition instrument; the reference raters applied the binary rule |

---

## 14. BLINDING CONDITIONS

| Blind to | Established | Source |
|---|---|---|
| Author-side intended labels | **Yes** | `Verified_Key.md`, Method |
| Study hypotheses | **Yes** | `Verified_Key.md`, Method; `AnswerKey_Verification_Packet.md` |
| One another's answers | **Yes** | `Verified_Key.md`, Method |
| Detection-panel results | **Yes, by construction** — no panel accuracy existed when the pass ran; the analysis was gated to data close 2026-08-15 | `JRS_Validation_Report.md`, "Status of the accuracy estimate" |
| The existence of a reference classification to be recovered | **NOT ESTABLISHED.** The packet says "You are helping verify the answer key", which discloses that a key exists | `AnswerKey_Verification_Packet.md:3-5` |

**The last row contradicts a manuscript claim. See section 24.**

---

## 15. 24/24 RESULT

**VERIFIED, with the denominator stated precisely.**

`research/Verified_Key.md`, Result:

> "**Inter-rater agreement: 100%.** All three raters assigned identical labels on all 24 records.
> **Agreement with the intended construction key: 24/24 (100%).** The verified key equals the intended key; no divergence."

Two distinct results, both unanimous:

1. **Rater-to-rater agreement:** 3 raters, 24 records, identical labels throughout.
2. **Rater-to-author agreement:** the reproduced key equals the intended key on 24 of 24 records.

Chance-corrected coefficients at that level, as recorded: Gwet's AC1 = 1.00, Krippendorff's alpha = 1.00, Fleiss' kappa = 1.00, on a balanced 12/12 split.

---

## 16. JUDGMENT DENOMINATOR

**72 judgments. 3 raters × 24 records.**

"24 of 24" is a **record** count, not a judgment count. The manuscript's "reproduced the author-side classification on 24 of 24 records" is correct as a record statement and does not disclose that 72 independent judgments underlie it.

| Quantity | Value | Basis |
|---|---|---|
| Records | 24 | `Verified_Key.md` key table, R01–R24 |
| Raters | 3 | `Verified_Key.md`, Method |
| Judgments | **72** | 3 × 24, each rater classified all 24 |
| Records in agreement with the intended key | 24 of 24 | `Verified_Key.md`, Result |
| Records with any rater disagreement | 0 | "All three raters assigned identical labels on all 24 records" |

---

## 17. ADJUDICATION

**NO — none performed, and none required.**

`research/Verified_Key.md`, Result: no divergence on any record. The planned adjudication rule (`OSF_PreRegistration.md:28`, "Rater 2 resolves any record where Rater 1 diverges") was never triggered. The manuscript states this correctly at `Detection_Article…:174`: "There were no disagreements, so no adjudication procedure was invoked and no classification changed."

---

## 18. TIMELINE

| # | Step | Date | Basis |
|---|---|---|---|
| 1 | Corpus construction | **DATE NOT ESTABLISHED** | no artifact dates the construction itself |
| 2 | Author-side classification | on or before **2026-07-06** | `research/Intended_Key_authorside.md` added at `db7a34c`, 2026-07-06 |
| 3 | Reference-rater recruitment | **NOT APPLICABLE** — automated raters, no recruitment record | `Verified_Key.md:8` |
| 4 | Reference-rater briefing | packet committed **2026-07-06** | `research/AnswerKey_Verification_Packet.md` at `db7a34c` |
| 5 | Blind classification | **DATE NOT ESTABLISHED**; on or before 2026-07-06 | `research/Verified_Key.md` at `48f3ead`, 2026-07-06 |
| 6 | Agreement calculation | on or before **2026-07-06** | same commit |
| 7 | Adjudication | **not performed** | section 17 |
| 8 | Detection-panel review | began on or before **2026-06-28**; last activity 2026-08-03 | live `pilot_progress`, earliest `last_at` 2026-06-28T08:33:02Z |
| 9 | Study 004 reliability labelling | began **2026-06-11**; last 2026-08-13 | live `bench_labels`, earliest `created_at` 2026-06-11T21:01:51Z |
| 10 | Study 012 comparison | began **2026-07-13**; last 2026-08-12 | live `armb_progress`, earliest `last_at` 2026-07-13T16:25:39Z |
| 11 | Accuracy analysis | **2026-08-15**, data close | `research/FULL_DATA_ANALYSIS_2026-08-15.txt` |

**Sequence findings:**

- **Q31, before the detection panel reviewed the corpus?** The *author-side* classification: not establishable independently, but the manuscript states it was fixed "before any reviewer was recruited". The *verified key*: **no** — fixed 2026-07-06, after detection reading had already begun (a participant's final activity is recorded 2026-06-28).
- **Q32, before the reliability study?** **No.** `bench_labels` starts 2026-06-11.
- **Q33, before Study 012?** **Yes.** Arm B starts 2026-07-13, after 2026-07-06.
- **No pre-registration term was breached.** `OSF_PreRegistration.md` requires the key to be "fixed before any accuracy analysis", not before reading. Analysis ran 2026-08-15. Blinding is unaffected: reviewers never saw either key.
- `pilot_progress` exposes `last_at` only, so the earliest read is a floor, not a first-read timestamp. `ai_pilot_reads` is RLS-locked and returns zero rows to the public key.

---

## 19. INDEPENDENCE ANALYSIS

| # | Independence from | Verdict | Evidence |
|---|---|---|---|
| 1 | Corpus author | **PARTIALLY VERIFIED** | The raters had no role in construction and never saw the intended labels. But the author wrote the operational rule they applied and selected the raters, and no third party observed the pass. `Verified_Key.md`, Method |
| 2 | Author-side classification | **VERIFIED** | "blind to … the intended construction labels"; "no access to … the intended key". `Verified_Key.md`, Method |
| 3 | Detection panel | **VERIFIED** | Different population entirely; the panel's accuracy did not exist when the pass ran. `JRS_Validation_Report.md`, "Status of the accuracy estimate" |
| 4 | Reliability panel | **VERIFIED** | Different population; no `E-` or `R-` code involved |
| 5 | Comparison study | **VERIFIED** | Arm B had not begun; `armb_progress` starts 2026-07-13 |
| 6 | Study hypothesis | **PARTIALLY VERIFIED** | Hypotheses were withheld, but the packet opens "You are helping verify the answer key for a study of records", disclosing that a key exists. `AnswerKey_Verification_Packet.md:3-5` |

**These six are not interchangeable and the manuscript's single word "independent" collapses them.** Rows 2 through 5 are clean. Rows 1 and 6 are qualified, and the manuscript already concedes row 1 in substance at `Detection_Article…:176` ("the raters were briefed by the authors … The key is therefore independent of the *results* and not fully independent of the *construct*").

---

## 20. WHAT THE EVIDENCE ESTABLISHES

**A only: independent reproduction of the author's operational classification.**

Specifically: three automated raters, blind to the intended labels and to the hypotheses, applying a written binary rule, recovered the author's intended classification on all 24 records with no divergence among themselves.

It also establishes **B, inter-rater agreement, but only among automated raters** — which is a statement about the determinacy of the rule, not about human inter-rater performance. `research/Verified_Key.md` says so itself: "This pass establishes that the distinction is objectively determinable, not author-idiosyncratic."

---

## 21. WHAT THE EVIDENCE DOES NOT ESTABLISH

- **Not C, criterion validity.** No outcome data. `Verified_Key.md`: "Does not settle: … reviewer detection accuracy … or the value of the standard."
- **Not D, construct validity.** The rule and the labels both encode the author's operationalisation.
- **Not E, external validity.** Constructed corpus, bimodal by design.
- **Not human inter-rater performance.** `Verified_Key.md` lists this first under "Does not settle": "human inter-rater performance on the packet (recommended for publication)".
- **Not independence from the operationalisation.** Only from the results.
- **Not that the corpus is difficult.** The manuscript reads unanimity correctly at `Detection_Article…:176`: "a corpus on which blind raters never disagree is a corpus of easy cases."

---

## 22. SOURCE CONFLICTS

### CONFLICT 1 — the nature of the raters

**SOURCE A:** `research/Verified_Key.md:8`, `research/JRS_Validation_Report.md:187` — "independent large-language-model instances … not human raters"
**SOURCE B:** `Detection_Article…:174` "blind raters"; `:21` "raters blind to the study hypotheses"; `:156` "blinded raters"; `:148` "raters not involved in corpus construction"; `:41` "reproduced by raters blind to the hypotheses"
**MORE AUTHORITATIVE:** A
**REASON:** A is the contemporaneous execution record and states the fact affirmatively; B omits it. An omission cannot override a positive record.
**UNRESOLVED:** **YES**

### CONFLICT 2 — number of raters, planned versus executed

**SOURCE A:** `Verified_Key.md` — three raters, each scoring all 24
**SOURCE B:** `OSF_PreRegistration.md:27-28`, `DRR_Detection_Validation_Protocol.md:30-33`, `AnswerKey_Verification_Packet.md:16`, `Intended_Key_authorside.md` header — two raters, second conditional
**MORE AUTHORITATIVE:** A for what happened; B for what was pre-registered
**REASON:** Not a contradiction. A protocol deviation, and one that strengthens the design. It is undocumented in the manuscript.
**UNRESOLVED:** **YES**, as a disclosure matter only

### CONFLICT 3 — whether raters knew a key existed

**SOURCE A:** `Detection_Article…:174` — raters "were not told that a reference classification existed to be recovered"
**SOURCE B:** `AnswerKey_Verification_Packet.md:3-5` — "**For the independent rater. Read this first.** You are helping verify the answer key for a study of records."
**MORE AUTHORITATIVE:** B
**REASON:** B is the instrument actually given to the raters. Its first two lines tell them they are verifying an answer key.
**UNRESOLVED:** **YES** — the manuscript claim is contradicted by the briefing document it cites

### CONFLICT 4 — human replication status

**SOURCE A:** `Verified_Key.md:8` "the human result is the gold standard the paper should report"; `JRS_Validation_Report.md:297` open item 4
**SOURCE B:** none — no completed human pass exists in the repository
**MORE AUTHORITATIVE:** A
**REASON:** A states the requirement; nothing satisfies it.
**UNRESOLVED:** **YES**

### CONFLICT 5 — key fixed before reading

**SOURCE A:** live `pilot_progress`, earliest `last_at` 2026-06-28; `bench_labels` earliest 2026-06-11
**SOURCE B:** `Verified_Key.md` committed 2026-07-06
**MORE AUTHORITATIVE:** both, on different points
**REASON:** The verified key postdates the start of reading in Studies 011 and 004. The pre-registration requires it before *analysis*, which held. Not a breach; not disclosed either.
**UNRESOLVED:** **NO** — recorded, no action required

### CONFLICT 6 — rater identities

**SOURCE A:** none
**SOURCE B:** none
**REASON:** No model name, vendor, version, date or per-rater sheet exists for the reference pass. The programme records all four for the Appendix A machine-consistency runs, which makes the absence here conspicuous.
**UNRESOLVED:** **YES** — evidentiary gap, not a contradiction

---

## 23. MANUSCRIPT STATEMENTS THAT ARE FULLY SUPPORTED

| Location | Statement | Supporting source |
|---|---|---|
| `:172` | Author-side classification recorded before any reviewer was recruited, with per-record rationale and JRS conditions implicated | `Intended_Key_authorside.md` |
| `:172` | "fixed and time-stamped before verification began and was not revised afterwards" | `git log db7a34c`; `Verified_Key.md` records no divergence |
| `:174` | Raters did not see the study's hypotheses | `Verified_Key.md`, Method |
| `:174` | Raters did not see the author-side classification | `Verified_Key.md`, Method |
| `:174` | "They were asked to classify each record as grounded or unsupported" | `AnswerKey_Verification_Packet.md` |
| `:174` | "reproduced the author-side classification on 24 of 24 records" | `Verified_Key.md`, Result |
| `:174` | "There were no disagreements, so no adjudication procedure was invoked and no classification changed" | `Verified_Key.md`, Result |
| `:176` | "the raters were briefed by the authors on what 'grounded' and 'unsupported' mean, and that briefing carries the authors' operationalisation" | `AnswerKey_Verification_Packet.md` |
| `:176` | "independent of the *results* and not fully independent of the *construct*" | section 19 above |
| `:176` | "a corpus on which blind raters never disagree is a corpus of easy cases" | `Verified_Key.md`, Result |

---

## 24. MANUSCRIPT STATEMENTS THAT REQUIRE CORRECTION

### 24.1 — The rater nature is undisclosed. **MATERIAL.**

Affected: `:174` (Section 4.4), `:21` (Abstract), `:156` (Section 3), `:148` (validity table), `:41`.

No location states that the reference raters were automated. `:220` does disclose large language models, but for the Appendix A machine-consistency runs — a different procedure. Its presence makes the omission at 4.4 read as a deliberate contrast rather than an oversight.

### 24.2 — "were not told that a reference classification existed to be recovered". **CONTRADICTED.**

Affected: `:174`.

`AnswerKey_Verification_Packet.md:3-5` opens: "**For the independent rater. Read this first.** You are helping verify the answer key for a study of records." The raters were told exactly that a key existed. The rest of the sentence — blind to hypotheses, blind to the labels — holds.

### 24.3 — The rater count is absent and the protocol deviation is undisclosed. **MINOR.**

Affected: `:174`. Three were used against two pre-registered. The deviation strengthens the design and should be stated rather than concealed by the word "raters".

### 24.4 — The judgment denominator is not given. **MINOR.**

Affected: `:174`. "24 of 24" is a record count. 72 independent judgments underlie it.

### 24.5 — "Disclosure. The full key is released with the materials … Nothing about the reference classification is withheld from a reader who wants to test it." **OVERSTATED.**

Affected: `:178`. The rater identities, model names, versions, per-rater sheets and the date of the pass do not exist in the repository and cannot be released. As written the sentence promises more than the materials contain.

---

## 25. EXACT INFORMATION NEEDED FOR SECTION 4.4

**Available and usable now:**

- Three raters
- Each classified all 24 records independently
- 72 judgments
- Automated raters: large-language-model instances applying the written operational rule
- Blind to the intended labels, to the hypotheses, and to one another's answers
- Received the binary operational rule only; no five-condition instrument, no training, no worked examples
- 100 percent rater-to-rater agreement; 24 of 24 agreement with the intended key
- No adjudication triggered
- Two raters were pre-registered; three were used

**Missing, and required before any claim beyond the above:**

| Missing | Needed for |
|---|---|
| Model names, vendors, versions | reproducibility; a reviewer will ask |
| Date of the blind pass | the timeline |
| Per-rater response sheets | the "nothing is withheld" claim at `:178` |
| A completed human replication | the gold standard both source files say the paper should report |

---

## 26. FINAL SOURCE-OF-TRUTH TABLE

| # | Question | Answer | Source |
|---:|---|---|---|
| 1 | Number of raters | **3** | `Verified_Key.md`, Method |
| 2 | Participant IDs / codes | **NOT ESTABLISHED** | no artifact |
| 3 | Independent of the corpus author | **PARTIAL** | author wrote the rule and selected the raters |
| 4 | Independent of the author-side classification | **YES** | `Verified_Key.md`, Method |
| 5 | Members of Study 011 | **No** | not human |
| 6 | Members of Study 012 | **No** | not human |
| 7 | Members of Study 004 | **No** | not human |
| 8 | Overlap with the 16-person detection panel | **No** | live `pilot_progress` |
| 9 | Overlap with the 20-person comparison study | **No** | live `armb_progress` |
| 10 | Overlap with the 25-person reliability population | **No** | live `bench_labels` |
| 11 | Professionally qualified experts | **No** | `Verified_Key.md:8` |
| 12 | Source establishing expert status | **none exists** | — |
| 13 | Credentialed professionals | **No** | `Verified_Key.md:8` |
| 14 | Professional domains | **Not applicable** | — |
| 15 | Compensated | **Not applicable** | — |
| 16 | Voluntary | **Not applicable** | — |
| 17 | Payment or other consideration | **Not applicable** | — |
| 18 | Instructions given | binary operational rule, full text | `AnswerKey_Verification_Packet.md` |
| 19 | Told the purpose | told only "verify the answer key for a study of records" | same, lines 3-5 |
| 20 | Told the intended classification | **No** | `Verified_Key.md`, Method |
| 21 | Blind to the author's classification | **Yes** | same |
| 22 | Blind to detection-panel results | **Yes**, by construction | `JRS_Validation_Report.md` |
| 23 | Blind to the hypothesis | **Yes** | `Verified_Key.md`, Method |
| 24 | Each classified all 24 | **Yes** | same |
| 25 | Total judgments | **72** | 3 × 24 |
| 26 | 24/24 agreement | **Yes** | `Verified_Key.md`, Result |
| 27 | Unanimous | **Yes** | same |
| 28 | Adjudication performed | **No** | same |
| 29 | Disagreements observed | **No** | same |
| 30 | Resolution of disagreements | **Not applicable** | same |
| 31 | Key fixed before the detection panel read | **No** — key 2026-07-06, reading by 2026-06-28 | live `pilot_progress` |
| 32 | Key fixed before the reliability study | **No** — `bench_labels` from 2026-06-11 | live `bench_labels` |
| 33 | Key fixed before Study 012 | **Yes** — Arm B from 2026-07-13 | live `armb_progress` |
| 34 | Who created the author-side classification | the first author | `Intended_Key_authorside.md` |
| 35 | Methodology | material-conclusion traceability rule, binary | `AnswerKey_Verification_Packet.md` |
| 36 | Based on JRS | **partly** — conditions recorded per record, rule is separate | `Intended_Key_authorside.md` |
| 37 | Based on DRR | **Yes** | `OSF_PreRegistration.md` |
| 38 | Separate rubric | **Yes**, binary rule distinct from the five conditions | `AnswerKey_Verification_Packet.md` |
| 39 | Reference raters received JRS | **No** | same |
| 40 | Received the five-condition instrument | **No** | same |
| 41 | Received training | **No** | same |
| 42 | Received examples | **No** | same |
| 43 | Same instructions as the detection panel | **No** | same |
| 44 | Reference classification generated by the first author | **Yes**, the intended key | `Intended_Key_authorside.md` |
| 45 | Independently checked before the blind pass | **No** — the blind pass was the check | same, header |

---

## EXACT MANUSCRIPT RECOMMENDATION

**CURRENT SECTION 4.4 CLAIM** (`Detection_Article_Submission_Final_v2_2026-08-18.md:174`):

> **Independent reproduction.** The intended classification was then withheld and the corpus was given to blind raters who did not see the study's hypotheses, did not see the author-side classification, and were not told that a reference classification existed to be recovered. They were asked to classify each record as grounded or unsupported. They reproduced the author-side classification on 24 of 24 records. There were no disagreements, so no adjudication procedure was invoked and no classification changed.

**SOURCE-SUPPORTED FACTS**

1. Three raters, against two pre-registered
2. All three were large-language-model instances, not human raters
3. Each independently classified all 24 records: 72 judgments
4. Each received the binary operational rule and the 24 records, and nothing else
5. Blind to the intended labels, the hypotheses, and one another's answers
6. Told they were verifying an answer key
7. 100 percent rater-to-rater agreement
8. 24 of 24 agreement with the intended key
9. No divergence, so no adjudication
10. Not given the five-condition instrument, training, or examples

**MISSING FACTS**

1. Model names, vendors, versions
2. Date of the pass
3. Per-rater response sheets
4. Any completed human replication

**RECOMMENDED MINIMUM DISCLOSURE** (proposed text only; not applied to any manuscript)

> **Independent reproduction.** The intended classification was withheld and the corpus was given to three raters who were blind to it, to the study's hypotheses, and to one another's answers. Each received only the binary operational rule and the 24 records; none received the five-condition instrument, training, or worked examples, and each was told that the task was to verify an answer key. Each classified all 24 records independently, producing 72 judgments. The three agreed with one another on every record and reproduced the author-side classification on 24 of 24, so the pre-registered adjudication procedure was never invoked and no classification changed. Two raters were pre-registered and three were used. **The three raters in this pass were independent large-language-model instances applying the operational rule, not human raters.** The rule was written to be applicable by any competent reader, and this pass therefore establishes that the distinction is determinable from the rule alone rather than resting on the first author's private judgment; it does not establish human inter-rater performance on the same packet, which is reported separately where available.

Every clause above is drawn from `research/Verified_Key.md` and `research/AnswerKey_Verification_Packet.md`. **No fact is included that the source records do not establish**, and the closing clause is deliberately conditional because no human replication exists.

Two consequential edits fall outside Section 4.4 and are recorded here rather than proposed, because they change claims the Abstract and the Disclosure paragraph rest on:

- `:174` "were not told that a reference classification existed to be recovered" is contradicted by the briefing document and should be removed or corrected.
- `:178` "Nothing about the reference classification is withheld from a reader who wants to test it" cannot be met while the rater identities, versions and per-rater sheets do not exist.

---

*Report produced 2026-08-18. No manuscript, dataset, statistic or participant record was modified in its production.*
