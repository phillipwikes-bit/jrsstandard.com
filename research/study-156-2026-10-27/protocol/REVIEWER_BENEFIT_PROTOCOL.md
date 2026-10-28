# Reviewer-Benefit Protocol

**Version S156-RB-1.0, 2026-10-27. NOT RUN.** No participant has been recruited or contacted, and this study recruits no one. The only person who could take part without a separate authorization is the owner, Phillip Wikes.

## 1. Question

Does a reviewer judge study records differently, or faster, with Engine output and with cognitive controls than with the record alone?

## 2. Conditions

| Code | The reviewer sees |
|---|---|
| H | The record only |
| E | The record and the Engine's findings, without cognitive controls |
| EC | The record, the Engine's findings and the cognitive controls (detect, reflect, correct, learn) |

**Which Engine output can be shown:**
- **Not the mock-arm outputs.** The ORACLE mocks are told each record's reference label, so showing their results would show the answer.
- **Offline version (possible now).** E shows the research profile's deterministic output (A2): conflicts and refusals only, every condition `not_assessed`. EC adds the A2 controls.
  - A2 runs with no candidate, so its controls come from the record rules alone and cannot carry the reference label.
  - In the mock arms, every control except a cited-evidence conflict also comes from the record rules. A cited-evidence conflict depends on the candidate's quotations.
- **Live version (only after a separate authorization).** E and EC show findings compiled from real model candidates.

## 3. Allocation

- **Records:** the 60 evaluation records.
- **Assignment:** condition = (family index + construction-type index) mod 3. This gives 20 records per condition, each construction type exactly twice per condition, and 3 or 4 records from every family.
- **Order:** a seeded shuffle (seed 1561027), with conditions interleaved record by record.
- **Files:**
  - `sealed/BENEFIT_ALLOCATION.json` holds the key. The participant does not open it.
  - `forms/BENEFIT_SESSION_SHEET.csv` is the participant's sheet, by blind code and condition.

## 4. Measures

For each record the participant gives:
- the E1 label;
- confidence, from 1 to 5;
- minutes taken;
- which controls they read (EC only);
- usefulness, from 1 to 5 (E and EC).

**Analysis, by condition:**
- agreement with the AI-proposed reference;
- agreement with the participant's own blinded-form label, where one exists and was given before the session;
- median minutes;
- confidence;
- false reassurance (GROUNDED given to a record designed UNGROUNDED).

## 5. Threats that cannot be removed with one participant

| Threat | Effect | What the protocol does |
|---|---|---|
| Single participant | No estimate of between-reviewer variation; nothing generalizes | Reported as a case study only |
| Participant is the owner and programme designer | Expectation and motivation effects | Disclosed; no independence is claimed |
| Learning across records | Later records are easier whatever the condition | Interleaved order; position recorded for each record |
| Order of conditions | Cannot be fully counterbalanced within one person | Interleaving; an order-by-condition table is reported |
| Prior exposure | A record already labelled in the blinded form is remembered | **Run the sessions before Part 2 of the blinded form**, or leave Part 2 out for these records |
| AI-authored reference | "Agreement" means agreement with the designer's intent | Reported as agreement, never as accuracy |

## 6. What it could show

- At most a case-study observation: whether controls changed one experienced reviewer's labels or time on constructed records.
- It cannot show reviewer benefit in general, reliability, or validity.
- A multi-reviewer study would need owner authorization to recruit, a rights and consent instrument, and a privacy review.
