# Detection Article FINAL4, change log

**VERSION:** FINAL3 -> FINAL4
**Source:** `research/Detection_Article_Submission_FINAL3_2026-08-18.md` (preserved, not overwritten)
**Source sha256:** `a8dd50a99b07222376a0ae8328fdd19aa36f4875629409e8ede8cda9b079d80b`
**Output:** `research/Detection_Article_Submission_FINAL4_2026-08-18.md`
**Script:** `scripts/apply_final4_provenance.py`
**Date:** 2026-08-18

**Authority.** The author has confirmed that the 24 records were created through Claude and that no separate corpus construction log was retained, in this repository or outside it. The manuscript promised a record-level provenance artifact that cannot be supplied.

---

## EDIT 1: Section 4.3

**Location.** Section 4.3, corpus construction provenance

**ORIGINAL**

> The generation prompts, the model and version used for each record, the generation dates, and the extent of human editing per record are recorded in the corpus construction log, which is part of the materials released under the data-availability terms in Section 11.

**REVISED**

> Record-level generation provenance was not retained in a separate construction log sufficient to reconstruct the generation process for each record, including model and version, generation date, prompt, and extent of human editing.

**RATIONALE.** The manuscript previously represented that a complete corpus construction log existed and was available for release. The author has confirmed that no such log was retained. The statement was therefore corrected to disclose the actual provenance limitation.

---

## EDIT 2: Section 11

**Location.** Section 11, data availability

**ORIGINAL**

> Released under the study's data-availability terms: the 24 constructed records; the corpus construction log, including generation model, version, date, prompt, and extent of human editing per record;

**REVISED**

> Released under the study's data-availability terms: the 24 constructed records; a record-level corpus construction log containing complete generation provenance was not retained, so model and version, generation date, prompt, and extent of human editing cannot be independently reconstructed for each record from the retained study materials;

**RATIONALE.** The data-availability statement was corrected so the manuscript does not promise a provenance artifact that cannot be supplied.

---

## Nothing was reconstructed

No prompt, generation date, model version or editing extent was written, inferred from git history, recovered from memory, or estimated. No synthetic provenance table was created and no retrospective log was produced.

A pattern guard runs over both edited regions and their surrounding context and fails the run on any of the following:

| Pattern | Would indicate |
|---|---|
| `\b(?:claude|gpt|gemini|llama|mistral)[- ]?[\d.]+` | a model version |
| `\bgenerated on \d` | a generation date |
| `\b20\d\d-\d\d-\d\d\b` | a date stamp |
| `\b\d{1,3}\s*(?:percent|%)\s*(?:of the text|edited|human)` | an editing percentage |
| `\bprompt was\b` | a recovered prompt |
| `\bthe prompt used was\b` | a recovered prompt |
| `\bapproximately \d+\s*(?:percent|%)` | an estimated proportion |

**Result: clean, nothing fabricated.**

**What survives, because it was already established.** Section 4.2 states that every record was generated with large-language-model assistance and then edited by the first author to instantiate the intended classification. That sentence is untouched by this pass. It is a statement about the corpus as a whole and makes no per-record claim, so it remains supportable while the per-record log does not exist.

---

## What this correction does and does not mean

| | |
|---|---|
| The corpus is unaffected | 24 records, 12 grounded and 12 unsupported, unchanged |
| The detection result is unaffected | 16 experts, 384 graded reads, 83.9 percent, CI 72.7 to 95.1, unchanged |
| The reliability result is unaffected | unchanged, including the failed pre-registered criterion |
| The limitation concerns | reproducibility of the record-generation history |
| The limitation does not concern | the participant observations or any reported statistic |

**This is a disclosure correction, not a data defect.** Nothing about the missing generation log bears on what sixteen experts judged, or on what they judged it against.

---

## Corpus generation is not reference classification

The two procedures remain separate and the Section 4.4 reference-classification disclosure is **byte-identical to FINAL3**: verified

| Element | Status |
|---|---|
| three automated LLM instances | unchanged |
| 72 record-level classifications | unchanged |
| 100 percent agreement, 24 of 24 | unchanged |
| no adjudication triggered | unchanged |
| two pre-registered passes, three executed | unchanged |
| absence of human validation | unchanged |
| reference-pass execution metadata not retained | unchanged |

The two provenance gaps are separate facts about separate procedures and are disclosed separately. Neither was merged into the other.

---

## CONFIRMATIONS

| Confirmation | Value |
|---|---|
| Statistics unchanged | **YES** |
| Participant counts unchanged | **YES** |
| Methodology unchanged | **YES** |
| JRS claims unchanged | **YES** |
| DRR claims unchanged | **YES** |
| Reference-classification architecture unchanged | **YES** |
| Chronology unchanged | **YES** |
| Novelty statement unchanged | **YES** |
| Unauthorized edits | **0** |
| Guard failures | recorded in the execution report |
| Zero-drift failures | recorded in the execution report |

### Frozen values, asserted individually

| Protected value | Present |
|---|---|
| accuracy | yes |
| CI low | yes |
| CI high | yes |
| sensitivity | yes |
| specificity | yes |
| graded reads | yes |
| detection panel | yes |
| comparison panel | yes |
| corpus | yes |
| grounded half | yes |
| unsupported half | yes |
| expert row | yes |
| regular row | yes |
| 113 and 104 | yes |
| 25 and 22 | yes |
| three baseline-only | yes |
| 58 and 61 | yes |
| three instances | yes |
| automated not human | yes |
| 72 judgments | yes |
| 24 of 24 | yes |
| no adjudication | yes |
| 2 vs 3 passes | yes |
| no human validation | yes |
| no human replication | yes |
| reference reproducibility limit | yes |
| chronology, Abstract | yes |
| chronology, Methods | yes |
| novelty qualified | yes |
| JRS boundary | yes |
| no criterion validity or efficacy | yes |
| construct dependence | yes |
| reliability criterion failed | yes |
| bootstrap not a pass | yes |
| psychometric limitation | yes |
| workflow limitation | yes |
| automated instances in Section 11 | yes |
| automated raters in Section 9 | yes |

### Phrasing that must be absent

| Term | Present |
|---|---|
| `are recorded in the corpus construction log` | no |
| `the corpus construction log, including generation model` | no |
| `0.624` | no |
| `0.253 to 0.994` | no |
| `0.301 to 0.886` | no |
| `36 independent experts` | no |
| `All 61` | no |
| `blind raters` | no |
| `blinded raters` | no |
| `blind reference raters` | no |
| `trained reviewer` | no |
| `non-expert` | no |
| `expert panel` | no |
| `same pool` | no |
| `fixed before recruitment` | no |
| `Before any reviewer was recruited` | no |
| `human validation` (exempt: `does not constitute independent human validation`) | no |
| `JRS validated` | no |
| `validated JRS` | no |
| `JRS proven` | no |
| `JRS efficacy demonstrated` | no |
| `JRS outperforms` | no |
| `criterion validity established` | no |
| `psychometrically validated` (exempt: `not psychometrically validated`) | no |
| `workflow independence demonstrated` | no |
| `measurement invariance established` | no |

---

## Document integrity

| Section | Unchanged from FINAL3 |
|---|---|
| Section 4.4, reference classification | yes, byte-identical |
| References | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Appendix C | yes, byte-identical |
| Acknowledgments | yes, byte-identical |
| Abstract | unchanged |
| Section 4.3 | Edit 1 only |
| Section 11 | Edit 2 only |
| All other sections | unchanged |

Paragraphs over 120 characters 184 to 184, duplicates 0, em-dashes 0. **2 lines differ from FINAL3 against 2 authorised edits**; the script fails if those numbers disagree, so no reflow, reference reordering or formatting drift can enter unnoticed.

**Document integrity: PASS**

---

"FINAL4 completed. Two edits, both removing an unsupported promise of record-level generation provenance and replacing it with an accurate disclosure of the limitation. Nothing was reconstructed. No statistic, participant count, methodological choice, chronology, claim boundary, reference-classification disclosure, limitation, reference, appendix or acknowledgment was changed."
