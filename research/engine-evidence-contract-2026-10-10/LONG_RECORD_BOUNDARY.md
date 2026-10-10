# Long-Record Boundary

**The boundary is a refusal boundary.** A record longer than 8000 characters is refused for analysis. At exactly 8000 characters it is analysable; at 8001 it is refused (fixtures LR-002, LR-003). Length is measured in UTF-16 code units of the record as submitted, without trimming.

## What the long-record plan does

`lib/engine-evidence-contract/long-record.mjs` produces, for any record:

- `length_chars`, `limit_chars`, `length_status` (`below_limit`, `at_limit`, `above_limit`), `analysis_boundary`;
- for an over-limit record, a deterministic segmentation proposal: whole record sections packed greedily into segments of at most 8000 characters, a section longer than the limit split at line boundaries, every segment carrying its original `start_offset` and `end_offset`, with segments tiling the record exactly;
- human-review points that must be resolved before any future segmented analysis could even be considered: chronology appearing in more than one segment, instruction risk located by segment, a section split across segments, and in every case `cross_segment_dependency_unassessed`.

## What it never does

It does not analyse any segment, combine findings, call a candidate, or imply that any part of a long record is supported. The plan carries `analysis_performed: false`, `segmented_analysis_authorized: false`, `findings_combined: false`, and `analysed: false` on every segment. Result validator RV-11 rejects any other value and rejects an over-limit record that was not refused.

## Fixtures

| Case | Length | Expected |
|---|---|---|
| LR-001 | 7999 | below limit, proceeds |
| LR-002 | 8000 | at limit, proceeds |
| LR-003 | 8001 | refused; at least 2 segments; cross-segment review point |
| LR-004 | 12057 | refused; dates in two segments (and they conflict); chronology review point |
| LR-005 | 11086 | refused; hostile instruction located by segment |

## Claim, local engineering evidence, interpretation, limitation, external evidence

- **Claim.** Over-limit records are refused for analysis, and the plan is descriptive only.
- **Local engineering evidence.** Replay: 5 long-record cases match, including tiling and offset checks; EC-016 end to end; mutation M-15 (refusal removed) is killed.
- **Interpretation.** No code path in this package analyses a record over 8000 characters.
- **Limitation.** Section detection is lexical (a line beginning with a label and a colon). The plan does not say whether segmentation would preserve meaning, and the chronology review point detects dates across segments, not whether they conflict.
- **External evidence still required.** Any future segmented analysis needs its own design, a decision on cross-segment reasoning, and separate evaluation. It is not authorised.
