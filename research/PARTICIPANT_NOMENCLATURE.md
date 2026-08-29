# Participant nomenclature: the canonical code map

> **OWNER COPY. DO NOT FORWARD.** Names the internal arm and rung vocabulary. The B1 / B2 split is the blind. Anything outward-facing is counts only.

**Why this file exists.** `RR-` looks like it abbreviates "regular reviewer". It does not. "Regular reviewer" is the reliability study's term for its `R-` coded raters, and it has never described an Arm B participant. The two abbreviations sit one letter apart and the mistake has been made in this repository, so the mapping now lives in one place and a guard enforces it.

**Standing instruction from Phillip, 2026-08-29: all Arm B participants are experts. Do not drift.**

---

## The map

| Code | Rung / study | Manuscript's own term | n | Expertise |
|---|---|---|---|---|
| `V-AI-##` | Rung 2b, detection | "the detection panel, 16 independent experts" | 16 | Credentialed practitioners or researchers, recruited on that basis |
| `E-##` | Rung 2a, reliability | "invited experts whose credentials are recorded" | 8 | Credentials recorded |
| `R-<hash>` | Rung 2a, reliability | "regular reviewers who entered through the open review page" | 17 | Self-declared domain, no identity verification. Codes were generated in the browser and **were never bound to an identity**, so no name exists to recover |
| `RR-###` | Arm B, randomised comparison | "the comparison study, 20 independent experts" | 20 | **Credentialed experts of the same professional standing as the detection panel** |

**`RR-` is not "regular reviewer".** What the letters abbreviate is not recorded anywhere in this repository, and it is not guessed at here. What matters is settled: an `RR-` code denotes an Arm B participant, and every Arm B participant is a credentialed expert.

---

## Evidence that Arm B is an expert population

| Source | Statement |
|---|---|
| `DRR_Detection_Validation_Protocol.md:46` | "Random assignment holds participant caliber constant, so any accuracy difference between B1 and B2 is attributable to the standard, not to expertise" |
| `FINAL_SUBMISSION_READINESS_AUDIT_2026-08-18.md:143` | "Arm A / Arm B distinction is condition, not expertise. **VERIFIED**" |
| `Detection_Article_Submission_Final_v2_CHANGE_LOG.md:43` | "Are Arm A and Arm B both expert populations? **Yes.**" |
| `PARTICIPANT_INVENTORY_BY_RUNG.md:136-137` | The two anonymous Arm B entries self-describe as "JRS-naive expert professional" |
| Manuscript §4.2 | "its two conditions differ in the method applied and not in the expertise of the people applying it" |
| Manuscript §5 | "20 independent experts of the same professional standing as the detection panel" |
| Manuscript §5 | "JRS-naive because they had no prior exposure to the method, which is a statement about exposure and not about expertise" |
| Manuscript Acknowledgments | "The comparison study, 20 independent experts" |

**"JRS-naive" is a statement about exposure, never about expertise.** It records that a participant had not seen the method before. It is the condition being randomised, not a description of the person.

---

## The three sentences that must survive every revision

These are the manuscript's expert-parity anchors. A revision that removes any of them lets a reader infer that Arm B was a weaker population, which would misdescribe the participants and would also misstate the design of the comparison.

1. §4.2: `differ in the method applied and not in the expertise of the people applying it`
2. §5: `a statement about exposure and not about expertise`
3. §5: `of the same professional standing as the detection panel`

Guarded by `check_zero_drift.py::check_arm_b_is_described_as_an_expert_population`.

---

## What must never be written

| Never | Because |
|---|---|
| An `RR-` code called a "regular reviewer" | That term belongs to the reliability study's `R-` raters |
| Arm B called non-expert, lay, unverified, self-enrolled, or untrained | Every Arm B participant is a credentialed expert |
| "JRS-naive" used to mean inexperienced | It means unexposed to the method |
| The B1 / B2 split, anywhere outward-facing | The split is the blind |
