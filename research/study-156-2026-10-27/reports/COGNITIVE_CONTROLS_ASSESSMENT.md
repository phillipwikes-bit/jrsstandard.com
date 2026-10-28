# Cognitive Controls Assessment (156-record study)

**2026-10-27. Offline; no model and no reviewer took part.** The four control fields (DETECT, REFLECT, CORRECT, LEARN) are scored with a rubric this study wrote and applied mechanically. That is an AI-applied rubric, not a human rating. Whether the controls help a reviewer is **NOT ESTABLISHED**: `protocol/REVIEWER_BENEFIT_PROTOCOL.md` is written and not run.

Sources:
- `reports/ANALYSIS.json`, section `controls` (frozen analysis of run-1);
- `out/controls/TEMPLATE_RUBRIC.json`;
- `out/vrun-1/RESULTS.json`.

## 1. How the controls are made

- Under the research profile, a control is produced when a record rule finds a defect.
- Its four fields are a fixed template for that defect (`RESEARCH_DEFECT_TEMPLATES`).
- So the text of a control never depends on the record. Only which controls appear depends on it.
- With one exception, the controls come from the record rules, not from the candidate. The exception is the cited-evidence conflict, which compares the candidate's quotations.
- A2 (no candidate) and the mock arms therefore show almost the same controls: 98 against 100 on the 60 evaluation records.

## 2. Scores (evaluation partition, A3R; A2 in brackets where it differs)

| Dimension | Measure | Result |
|---|---|---|
| DETECT validity | Record-flaw controls on records whose reference has that flaw | 84 of 87 (96.5%) |
| DETECT recall of the designed flaw | Signature defect present on records of that type | 27 of 30. U 5 of 6, A 5 of 6, C 5 of 6, M 6 of 6, S 6 of 6 |
| DETECT, chronology observation | `no_explicit_dates` on records that have no explicit date | 8 of 8 correct |
| DETECT, false controls | Record-flaw controls on grounded records | 3. S-041 and S-078 (decision not detected, EF-01 family); S-097 (false date conflict, EF-07) |
| REFLECT | Template states a consequence for a later reviewer | 9 of 9 research templates |
| CORRECT | Template asks the record owner a question rather than asserting a fix | 9 of 9 |
| LEARN | Template gives a process change beyond this record | 8 of 9 (`decision_outcome_conflict` missed by the lexical rubric, CF-03) |
| Traceability | Span links that resolve to the record text | 100% of graphs; but only 7 of 100 controls carry any span link |
| Redundancy | Same defect repeated within one graph | 36 repeats in 60 graphs (CF-01) |
| Contradiction | A control stating a defect the graph contradicts | 0 |
| Burden on clean records | Controls per grounded record with no designed flaw (type S excluded) | 0.17 (5 controls on 30 records) |
| Length | Words per graph | 72.9 |

## 3. Clean records

- 30 evaluation records are grounded with no designed flaw (types G, G2, L, D and P).
- **26 receive no control.**
- **4 receive one or two:**
  - S-041: a false "no decision" pair (EF-01);
  - S-051: a cited-evidence conflict between two candidate quotations;
  - S-089: a correct `no_explicit_dates`;
  - S-097: a false date conflict (EF-07).

## 4. Withheld, blocked and unavailable

| Category | Count | Meaning |
|---|---|---|
| Withheld by the neutrality check | 0 | No control was produced and then suppressed |
| Blocked by intake | 124 per default arm (A0, A0b); 20 under A2 | Refused records produce no controls |
| Unavailable | 32 public cases in every arm; 20 out-of-scope originals in the mock arms | No text held, or not run pending SC-1 |

## 5. Under variants

- **Anchor stuffing blinds the controls as well as the findings.**
  - Under A2, 21 ungrounded evaluation records carry a basis-flaw control.
  - When an irrelevant sentence with a date and an identifier is added (V2), 14 of the 21 lose every basis-flaw control.
- **Formatting (V1) changes nothing.** Under every arm, the E1 class stays the same on all 104 base records.

## 6. The default profile, for contrast (A6, counterfactual supplier-access declaration)

- 480 controls on the 60 evaluation records: 8 per clean record.
- None of them names a designed flaw; signature recall is 0 of 30.
- The supplier-access templates (expiry, compensating control, authority section) do not describe study records.
- This is why the study needed a research profile at all.

## 7. Development originals (A3R)

- **R03 (ungrounded):** 8 controls, 4 of them `conclusion_without_identifiable_basis`. This is the clearest example of redundancy.
- **R15 (ungrounded):** 4 controls.
- **R08 and R22 (grounded):** one correct `no_explicit_dates` each.

## 8. Answer to "were the controls useful?"

- **What the evidence supports:**
  - On these constructed records, the controls point at the designed flaw on 27 of 30 flawed records.
  - They are silent on 26 of 30 clean records.
  - They are neutral in form: questions and process changes, not verdicts.
- **What it does not support:**
  - Any claim that they help a reviewer. No reviewer has used them.
  - Any claim about records unlike these.
- **Defects to fix:**
  - repetition (36);
  - missing span links (93 of 100 controls have none);
  - blindness to anchor stuffing (14 of 21);
  - the false controls inherited from the lexical decision rules.
