# Study Codebook (156-record study)

**Version S156-CB-1.0, 2026-10-27. Written before any scored run and frozen with the study.** It defines what the reference labels mean and how Engine outputs are scored against them. It does not change the JRS Codebook (`codebook.html`, v1.0, 2026-06-03), whose five conditions are all classified Experimental.

## 1. The study rule (label E1)

Applied to each record on its own terms, with no outside knowledge, and without judging whether the decision was right:

1. Identify each **material conclusion**: a statement that, if wrong, would change the decision or its defensibility.
2. For each, ask whether it is **traceable to identifiable evidence within the record itself**: a cited, attached, dated or described source, anchor or basis.
3. Label:
   - **GROUNDED** if every material conclusion is traceable;
   - **UNGROUNDED** if at least one is not;
   - **CANNOT TELL** (reviewer forms only) if the record does not allow a decision.

Source: the rule in `research/AnswerKey_Verification_Packet.md`, unchanged.

## 2. The four questions

Each is answered for every record (blinded forms ask all four everywhere; "not applicable" is an allowed answer).

| Q | Question | Answers |
|---|---|---|
| Q1 | Does a reference to an authority (rule, policy, section) establish the basis by itself, or are facts given that show its conditions are met? | authority only / authority with linked facts / no authority cited |
| Q2 | Does a stated reason only repeat the conclusion? | restates the conclusion / gives a separate basis / no reason stated |
| Q3 | Do the dates describe the same event or different events? | one event given two different dates / different events, consistent / no dated events / cannot tell |
| Q4 | Do apparently contradictory outcomes concern separate requests or items? | separate items, no contradiction / the same item, contradiction / no opposite outcomes |

## 3. Designed construction types (synthetic records)

The AI-authored construction intent for each type. These are **AI proposals**, not human reference findings, until the development reviewer's blinded review is recorded.

| Type | Construction | E1 | Question targeted |
|---|---|---|---|
| G | grounded, closing sentence names the basis | GROUNDED | none |
| G2 | grounded, basis inline | GROUNDED | none |
| U | generic evaluative wording, no evidence | UNGROUNDED | none |
| A | authority only, no facts showing its conditions are met | UNGROUNDED | Q1: authority only |
| L | authority linked to facts that meet its stated condition | GROUNDED | Q1: authority with linked facts |
| C | conclusion restated as its own basis | UNGROUNDED | Q2: restates the conclusion |
| D | several dates for different events, consistent | GROUNDED | Q3: different events |
| S | one event given two dates | GROUNDED basis, chronology conflict | Q3: one event, two dates |
| P | two separate requests with opposite outcomes, each with a basis | GROUNDED | Q4: separate items |
| M | one supported and one unsupported conclusion | UNGROUNDED | none |

## 4. Scoring Engine output against E1

From `tools/scoring.mjs` (frozen):

| Engine class | Meaning |
|---|---|
| FLAG | A basis condition is `gap`, or carries a record-flaw reason (visible basis gap, authority-only, decision-outcome conflict) |
| CLEAR | All three basis conditions (reconstructability, identifiable_basis, reasoning_traceability) are `supported`. A favourable signal only: human review is still required, and sufficiency is never supported |
| INDETERMINATE | Review required for reasons that are not record flaws (citation problems, quotation failures, instruction risk, other conflicts, a candidate gap the rules did not confirm) |
| NOT_ASSESSED | Intake stopped, or every basis condition is `not_assessed` |

| Measure | Definition |
|---|---|
| Sensitivity | FLAG among UNGROUNDED |
| False alarm | FLAG among GROUNDED |
| False reassurance | CLEAR among UNGROUNDED |
| Precision | UNGROUNDED among FLAG |
| Abstention | INDETERMINATE or NOT_ASSESSED, over all assessed records |
| Coverage | Records with a substantive result (FLAG or CLEAR), over records in scope |

**Every rate compares the Engine with an AI-authored or LLM-reproduced reference. It is agreement, not accuracy.**

## 5. Correspondence: Engine conditions and Codebook conditions RC1 to RC5

Version S156-CORR-1.0. **Semantic and inferred; NOT ESTABLISHED.** The Engine's condition rules are engineering choices (`research/evidence-graph-compiler-2026-10-10/CONDITION_RULEBOOK.md`). No reviewer-agreement evidence connects them to the Codebook.

| Engine condition | Nearest Codebook condition | What the Engine checks | What it does not check |
|---|---|---|---|
| reconstructability | RC1 Reconstructability (partial) | A decision and identifiable evidence are both visible and cited | Whether the steps from evidence to conclusion are connected |
| identifiable_basis | RC2 Basis Identification (partial) | A cited quotation holds an evidence anchor (date, identifier, quantity, on-file or stated absence) | Whether each characterization has its own source; whether a reference is generic |
| chronology_integrity | RC3 Chronology (partial) | Two or more dated events cited; no same-event date conflict | Review period, prior steps, narrative order without dates |
| reasoning_traceability | RC1 Reconstructability (partial), not RC4 | A reason linked to evidence; restated or absent reasons | Who decided, criteria or threshold, mitigating information |
| sufficiency | RC5 Evidentiary Sufficiency (partial) | Visible gaps only; never `supported` | The aggregate judgement |
| (none) | RC4 Decision-Process Traceability | Not implemented | Everything RC4 defines |

**Naming hazard.** In the human-study data (`research/CONSTRUCT_VALIDITY_PACKAGE.md`), the column `reasoning_traceability` is RC1. The Engine condition of the same name is a different, narrower check. Do not join the two by name.

## 6. Reviewer roles and status

| Role | Who | Status |
|---|---|---|
| Required development reviewer | Phillip Wikes | Blinded forms issued in `forms/`; **no review recorded** |
| Independent reviewer | None | NOT ESTABLISHED; none recruited or contacted |
| Adjudication | None | NOT PERFORMED |

AI-proposed labels stay AI proposals until a human review is recorded. No human review or adjudication is claimed by this study.
