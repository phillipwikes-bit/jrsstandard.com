# Study 014 Part 2b: Engine 0.3.0 against Engine 0.1.0 (FIXED before any call)

**Fixed 2026-10-03, before any Part 2b call.** The owner's instruction was "build Engine v0.3 and revise study". Part 2 found that the production Engine (0.1.0) cannot report missing record citations, and caught 4 of 10 attribution deletions (`PART2_RESULTS.md`). Part 2b tests whether Engine 0.3.0 closes those gaps without losing its specificity on dates.

## Systems under test
| Arm | Engine source | Model | What is read |
|---|---|---|---|
| E1 | `api/review-engine.js` at commit `35c33f6` (0.1.0-validation; SHA-256 prefix `97176e22`, the file Part 2's C0 arm used) | `claude-haiku-4-5-20251001` | The five conditions, mapped as in Part 2: basis_identification gap or review means sources; temporal_reconstructability means dates; reasoning_traceability means decision_maker and criteria |
| E3 | `api/review-engine.js`, 0.3.0-validation. Engine 0.3.0 source SHA-256: `0ef0452f0a1423e1e7ad734c7e4fe5bf6df6de6d0bec57f6861f4c371c0b3482` | same | **Primary:** the new `missing` list. **Secondary:** the five conditions, mapped as for E1 |

- Both arms send exactly what the production handler sends: its system prompt, its user message ("Examine this record against the five JRS conditions:" followed by the text) and its `max_tokens` (900 for E1, 1000 for E3).
- As in Part 2, the text is sent **without** the production handler's 8,000-character truncation. 10 of the 29 held-out texts are longer than 8,000 characters, so production would see less of them than this test does.
- The runner refuses to start if either source differs from the hashes above.
- The rule-based `anchor_profile` in 0.3.0 is **not** tested here. On rule-based deletions it would detect them by construction, which proves nothing.

## Texts and items
- The texts are the held-out set, P014-01 to P014-29 (hashes in `research/drr-suite-v0.9/VERSION.json`).
- **The set contains 5 duplicate pairs** (identical text under two EEOC links): 01/04, 02/05, 03/06, 12/18, 17/20. Each text is used once; the first ID is kept. That leaves **24 texts**.
- Deletion rotation, by ID order on the 24:
  - every text with a record citation gets the citations deletion (9 texts);
  - of the remaining 15, the first 8 get the attributions deletion and the last 7 the dates deletion.
- **Citation deletion is new for Part 2b** (`tools/part2b.py::delete_citations`).
  - It removes exactly the spans that extractor v1.2 reads as record citations, with any "See" or "Supplement to" lead-in, then removes parentheses left empty.
  - Checked before any call: across all 12 held-out texts with citations, 0 citations remain, and the dates, attributions and quotations are unchanged.
  - Part 2's rule left citations behind in 6 of 10 texts.
- The dates and attributions deletions are Part 2's, unchanged (`study014.delete`). Checked: 0 anchors of the deleted type remain.
- Each text gives three items: the intact text (control), its deletion, and its Sonnet P1 concise-summary draft from the confirmatory run. That is 72 items.
- **Volume:** 72 items × 2 arms × 3 runs = **432 Haiku calls.** Estimate USD 2 to 4 (*Inference*). Runaway stop at USD 150 is inherited, and the owner's instruction covers the spend.

## Scoring (deterministic; modal = named in at least 2 of 3 runs)
For each arm and output layer, and each deleted type:
- **Hit rate:** deletions of that type on which the type was named.
- **False-flag rate:** intact texts **that contain that type** on which it was named.
  - For citations, those are the same 9 texts in intact form, which gives a paired comparison.
  - The false-flag rate over all 24 intact texts is also reported.
- Hit keys:
  - E3 `missing` list: dates → `dates`; citations → `record_citations`; attributions → `attributions`.
  - Condition mapping: as in Part 2. It cannot name citations, so citations are reported for completeness.
- **Draft hits:** a draft that lost a type (v1.2 retention below 0.5) counts as hit if a lost type is named. This is descriptive only.

## Hypotheses (pre-registered)
- **H6:** on E3's `missing` list, for **record citations** and for **attributions** separately:
  - hit rate is at least 0.70, **and**
  - the false-flag rate on intact texts containing the type is at most 0.20.
  - Both types must meet both conditions.
- **H6d (no regression on dates):** on E3's `missing` list, the date hit rate is at least 0.70 and the date false-flag rate is at most 0.20.
- **Reported, not tested:** E3's condition mapping against E1's. This shows whether the prompt change shifted the five conditions.

## Allowed statements
| Result | Allowed |
|---|---|
| H6 holds | "On 24 held-out EEOC decision backgrounds, Engine 0.3.0 named missing record citations in X of 9 and missing attributions in Y of 8 controlled deletions, while flagging them on Z and W of the intact texts that contain them." With the limits: synthetic deletions, one text family, one model, small n |
| H6 fails | Reported with the same prominence, naming the failing condition |
| Any | No accuracy, certification or compliance claim. Engine 0.3.0 is a development build and is not deployed |

## Data handling
- The held-out texts, the deletions, the drafts and the raw responses are not committed. The repository is public (B-023), and the responses contain notes grounded in the text.
- Only counts are committed: `runs/PART2B_SCORES.json`.
