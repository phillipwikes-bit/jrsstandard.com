# Evidentiary Deficit article: Section V revision

**Date:** 2026-08-18
**Source:** `research/Evidentiary_Deficit_Article_Hekim_Version.md` (preserved, not overwritten)
**Source sha256:** `0115966c4d478a8b57eb64b5288843b2a8893708b8630ebdc349d7066cf3153a`
**Output:** `research/Evidentiary_Deficit_Article_Hekim_Version_rev2026-08-18.md`
**Contributed by:** Hekim Colpan, covering note of 2026-08-18
**Script:** `scripts/apply_hekim_sectionV.py`

Section V replaced in full. Nothing else in the article was touched.

---

## 1. The change

| | Before | After |
|---|---|---|
| Heading | `V. Data Protection and the European Frame` | `V. Data Protection and the European Governance Frame` |
| Words | 226 | 332 |
| Paragraphs | 2 | 3 |

### Replaced text

> Public AI tools bring two risks that feed each other. First, there is the processing risk: dropping sensitive information into an outside interface may not meet the lawful-basis requirement under the GDPR, and it can cut against data minimization. Second, there is an integrity risk: when drafting happens outside approved systems, the organization often cannot later produce the metadata showing which tool was used, what was entered, and when. Both come back to the same problem. Without visibility into the tool, the input, and the output, the provenance of the record cannot be defended.
>
> Inside the EU, that single gap runs into two regimes at once. The GDPR's accountability principle expects an organization to demonstrate how personal data was processed, and a record whose provenance cannot be shown is hard to square with that duty or with records-of-processing obligations. The EU AI Act, for its part, attaches record-keeping, logging, and technical-documentation expectations to high-risk uses, precisely so that AI-assisted processing can be audited after the fact. Those logs and that documentation are not incidental extras in the high-risk regime; they are the mechanism by which an organization proves, later, that the system did what it was supposed to. An organization that cannot reconstruct how an AI-assisted record was produced is exposed on both fronts at the same time.
>

### Replacement text, as contributed

> In Europe, the governance problem begins the moment AI-assisted drafting severs the evidentiary link between a consequential record and the information, human judgment, and controls that produced it. Under the GDPR, the accountability principle in Article 5(2) does not merely require controllers to comply with the data-protection principles; it requires them to be able to demonstrate that compliance when scrutinised. Article 30's record of processing activities is one part of that accountability framework, but a modest one: it does not require every prompt or draft to be retained, nor does it become a decision log simply because a model was involved upstream. What matters is more disciplined than either extreme: proportionate controls capable of showing how the processing was governed and, where the risk warrants it, assessed.
>
> The timing of the EU AI Act makes that distinction more than academic. The Regulation now generally applies, while its core high-risk requirements on risk management, data governance, technical documentation, logging, and human oversight have been postponed by Regulation (EU) 2026/1744. Annex III high-risk systems are subject to those requirements from 2 December 2027; high-risk systems linked to regulated products under Annex I from 2 August 2028. Organisations are therefore deploying AI-assisted workflows today while some of the Act's strongest statutory traceability controls remain pending. The practical governance question is broader than formal AI Act compliance: has enough reliable evidence been preserved to reconstruct what the AI contributed, what a human verified, and why the final record was accepted?
>
> ISO/IEC 42001 offers an operational bridge across that gap through structured AI governance, risk management, defined responsibilities, monitoring, and continual improvement. In financial services, DORA adds a documented ICT-risk and governance framework, including management accountability and technology-risk controls. The governance objective is not indiscriminate retention. It is more surgical: preserve the right evidence, under the right controls, for the right period, so that a consequential record can still account for itself when someone eventually asks it to.
>

---

## 2. Two deviations from the submitted draft

Both are recorded here rather than made silently. Neither changes the sense of anything Hekim wrote.

**Deviation 1: one em-dash replaced by a colon.**

| | |
|---|---|
| Submitted | "What matters is more disciplined than either extreme [em-dash] proportionate controls capable of showing..." |
| In the article | "What matters is more disciplined than either extreme: proportionate controls capable of showing..." |
| Reason | `CLAUDE.md` section III.7 bans the em-dash in body prose across this repository. The article carried zero before this revision and carries zero after it. |

**Deviation 2: the working-references line was not inserted into the article body.**

In the covering note it addresses the co-author rather than the reader, and the article carries no references apparatus of any kind: no footnotes, no endnotes, no bibliography. Inserting a bare citation string into the body would be the only such element in the piece. It is reproduced here so it is not lost:

> GDPR Articles 5(2), 24, 30 and 35; the EU AI Act and Article 113 as amended by Regulation (EU) 2026/1744; DORA Articles 5 and 6; and ISO/IEC 42001:2023.

**If the authors want these carried in the published piece, say so and they can be added as a short notes block.** That is a structural decision for the two of you, not a copy-edit.

---

## 3. Citations this pass did not verify

**These are carried exactly as drafted. Nothing was corrected, softened, hedged or invented.**

| Citation | Status |
|---|---|
| Regulation (EU) 2026/1744 | **NOT VERIFIED**: postdates this assistant's knowledge; no repository source references it |
| 2 December 2027 | **NOT VERIFIED**: Annex III high-risk application date, per the above |
| 2 August 2028 | **NOT VERIFIED**: Annex I high-risk application date, per the above |
| EU AI Act Article 113 as amended | **NOT VERIFIED**: the amendment depends on the regulation above |

This assistant's knowledge ends before the instrument Hekim cites, and no source in this repository references it. The claim that the AI Act's high-risk requirements were postponed, and the two application dates that follow from it, therefore rest on his authority as the contributing co-author and an ISO/IEC 42001 auditor working in this area. **They should be checked against the Official Journal before publication**, because a wrong date in a compliance-facing article is the kind of error a reader will find.

The GDPR, DORA and ISO/IEC 42001 references are stable instruments and raise no such issue.

---

## 4. What the revision changes about the argument

The previous Section V argued that public AI tools create a processing risk and an integrity risk, and that both converge on provenance. The replacement is narrower and better aimed at the article's own question. Three things are new:

1. **Article 30 is explicitly bounded.** The old text let a reader infer that records-of-processing obligations reach prompts and drafts. The new text says directly that they do not, and that a record of processing does not become a decision log because a model was involved upstream. That is a concession, and it makes the surrounding argument harder to dismiss.
2. **The AI Act is dated rather than invoked.** The old text described high-risk logging duties as though they were in force. The new text separates what applies now from what applies later, which is the distinction a practitioner reading this in 2026 actually needs.
3. **ISO/IEC 42001 and DORA are added** as the operational bridge across the interval, which the previous version did not address at all.

**The central argument is unchanged and still rests on the record rather than the regulation.** The closing sentence makes that explicit: the objective is not indiscriminate retention but preserving the right evidence so a consequential record can account for itself.

---

## 5. Integrity

| Check | Result |
|---|---|
| Text before Section V | byte-identical |
| Text after Section V | byte-identical |
| Heading count | 13 to 13 |
| Em-dashes in the article | 0 |
| Source file overwritten | no |

| Section that must survive untouched | Present |
|---|---|
| title | yes |
| I. Introduction | yes |
| II. Documentation as Legal Evidence | yes |
| III. How AI-Assisted Records Fail in Practice | yes |
| IV. Pattern Risk and Proxy Language | yes |
| VI. Oversight and Review | yes |
| VII. Litigation and Regulatory Exposure | yes |
| VIII. Practitioner's Checklist | yes |
| IX. Conclusion | yes |
| About JRS | yes |
| Acknowledgment | yes |
| About the Authors | yes |

| Required content in the new Section V | Present |
|---|---|
| GDPR Article 5(2) accountability | yes |
| Article 30 is modest, not a decision log | yes |
| AI Act postponement | yes |
| Annex III date | yes |
| Annex I date | yes |
| the practical question is reconstruction | yes |
| ISO/IEC 42001 bridge | yes |
| DORA in financial services | yes |
| not indiscriminate retention | yes |
| the record accounts for itself | yes |

| House prose rule | Violations |
|---|---|
| em-dash, CLAUDE.md III.7 | 0 |
| AI fingerprint, CLAUDE.md III.7 | 0 |
| filler adverb, CLAUDE.md III.7 | 0 |
| CLAUDE.md III.7 | 0 |

**Sections I to IV and VI to IX, the JRS block, the Acknowledgment and the About the Authors block are byte-identical to the source.**

---

"Section V replaced with the contributed draft. Two recorded deviations, both formatting rather than substance. Four citations carried as drafted and flagged as unverified. No other section of the article was changed."
