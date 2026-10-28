# Fresh Evaluation Records: Authoring Specification

**2026-10-27. For an author chosen by Phillip Wikes.** No author has been chosen, named or contacted. Nothing in this package was written by an independent author, and no record written in this session can serve as evaluation material: anything the rule author writes is development material (`registers/EXPOSURE_REGISTER.json`).

## 1. Who may write the records

| Requirement | Why |
|---|---|
| A person other than the author of the 0.3.4 rules | The rules were written by the same developer who wrote every existing study record; agreement with those records is conformance, not accuracy |
| Has not read the candidate source, its rule packs, the test suites, the study's failure register or this package's reports | Knowledge of the rules lets an author write to them, or around them |
| Has not seen the Engine's output on any record | Same reason |
| Is not an AI system acting as an "independent author" | An AI-written set would be a further AI-authored reference |
| Is chosen and recorded by the owner | Recruiting or contacting anyone is outside this assignment |

The author may read this specification, the definitions in `forms/HUMAN_REFERENCE_FORM_V2.md`, and the scope limits below. Nothing else from the repository is needed.

## 2. What to write

**At least 60 records, in at least 6 new families.** A family is one subject and one decision type (for example: library acquisitions, fleet tyre replacement, software licence renewals, room bookings for training, laboratory equipment calibration sign-off, translation vendor selection, IT asset disposal, internal grant allocation between teams). Do **not** use the ten families already studied: change approvals, procurement awards, records requests, retention exceptions, work-order priority, release decisions, budget reallocation, incident reviews, control tests, meeting summaries.

**Balance across the set (approximately):**

| Kind | Share | Examples of what the author might write |
|---|---|---|
| Grounded, evidence linked in words | 20% | "approved because the inspection of 3 May found ..." |
| Grounded, evidence stated but not linked in words | 15% | facts in one sentence, the decision in the next, the link plain to a reader |
| Grounded, authority with facts meeting its conditions | 10% | a rule, and facts showing its conditions are met |
| Ungrounded, no evidence at all | 15% | a decision with general statements only |
| Ungrounded, authority only | 10% | a rule cited, no facts |
| Ungrounded, the reason restates the conclusion | 10% | "approved because it was considered acceptable" |
| Ungrounded, with irrelevant dated or numbered material present | 10% | a decision without evidence, plus unrelated dates, numbers or references that a reader would recognise as irrelevant |
| Records with a date question (same event given two dates; next, previous or revised events) | 10% | either grounded or ungrounded |

**Wording.** Use your own words. Vary sentence length (2 to 12 sentences), structure (with or without headings or labelled lines), the order of facts and decision, and the verbs used for decisions and reasons. Do not copy or paraphrase any existing study record. Include ordinary irrelevant detail where a real record would have it.

**A separate set of instruction texts (at least 20).** Text addressed to a reviewing system or trying to direct the assessment, in any phrasing the author chooses, across these categories: direct command, indirect request, claimed authority, quotation, embedded reviewer note, split across sections, suppressing findings, inventing support, changing the output format or status. Also at least 10 benign passages that discuss instructions, tools or reviewers without directing anything. The author is told the categories only, never the screen's patterns.

## 3. What not to include

- No real person, organisation, case or event; no personal data.
- Nothing in an excluded domain: employment or HR, medical, legal outcomes, benefits, immigration, credit, tenancy, or any other consequential decision about a person.
- No text copied from the repository or from public sources.

## 4. What the author records for each record (before handing it over)

The fields of `forms/HUMAN_REFERENCE_FORM_V2.md`: E1 (GROUNDED, UNGROUNDED or CANNOT TELL); material conclusions; supporting passages (stated link or plain link); the conclusion without a basis; applicability and uncertainty; Q1 to Q4; expected controls; unresolved interpretations. These labels become the reference for the evaluation, with the status **human-reviewed (author)**.

## 5. What the author hands over

| Item | Form |
|---|---|
| Records | One plain-text file per record, UTF-8, under 8,000 characters |
| Instruction texts and benign passages | One plain-text file each |
| Labels | The completed form for every record |
| Authoring log | Dates, time spent, anything consulted |
| Statement | That the conditions of section 1 hold |
| Manifest | SHA-256 of every file, computed before handover |

Handover follows `protocol/PROTECTED_EVALUATION_PROCEDURE.md`.
