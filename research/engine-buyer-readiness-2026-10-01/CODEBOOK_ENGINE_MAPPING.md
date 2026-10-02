# Codebook-to-Engine condition mapping (assessment item 25; defect ED-06)

**Prepared 2026-10-02 in Claude Code. Analysis only: no Engine or Codebook file was changed.** Publication is the owner's decision (CLAUDE.md section 23).

**Sources (*Observed*):**
- `codebook.html`: sha256 prefix `fe0f8c6abc214a61`, last commit `f2b85e3` (2026-09-22), Codebook v1.0 dated 2026-06-03.
- `api/review-engine.js`: sha256 prefix `97176e22a6c075f2`. The condition keys are at lines 33 to 39 and the prompt definitions at lines 41 to 48.

## Mapping
The mapping follows the Engine prompt's own label, which carries the Codebook name. The key names do not (ED-06).

| Engine order | Engine key | Engine prompt label and question | Codebook | Codebook definition (abridged) | Match |
|---|---|---|---|---|---|
| 1 | `basis_identification` | Basis Identification: "Is the basis for each conclusion identifiable within the record?" | **RC2** Basis Identification | Whether the source of each **characterization** (observation, measurement, audit finding, reported incident) is visible and traceable | **Close.** The unit differs: the Engine asks about each conclusion, the Codebook about each characterization |
| 2 | `reasoning_traceability` | Decision-Process Traceability: "Can a later reviewer trace the decision process from evidence to conclusion?" | **RC4** Decision-Process Traceability | Who reviewed the matter, what criteria or threshold triggered it, and whether responsive or mitigating information was considered | **Weak.** The Engine's question is close to RC1's wording (the path from evidence to conclusion). It does not ask RC4's three elements: reviewer, criteria, and consideration of responses |
| 3 | `cold_reviewer_clarity` | Reconstructability: "Can a reviewer with no prior knowledge reconstruct the basis from the record alone, years later?" | **RC1** Reconstructability | Whether the conclusion can be reconstructed from the record itself: the cited evidence, the steps and the conclusion are present and connected | **Partial.** The "reviewer with no prior knowledge" framing is RC5's wording. The key name says clarity, not reconstructability |
| 4 | `accountability_support` | Evidentiary Sufficiency: "Is the evidence in the record sufficient to support the conclusion?" | **RC5** Evidentiary Sufficiency | The **aggregate** condition: whether the record stands on its own as an evidentiary document an independent reviewer could assess | **Partial, with a scope risk.** The Engine's question can be read as asking whether the conclusion is right. The Codebook says it assesses documentation adequacy, "not the correctness, lawfulness, or merits". The key name says accountability, not sufficiency |
| 5 | `temporal_reconstructability` | Chronology: "Can the sequence of events be followed from the record, with dates and intervals?" | **RC3** Chronology | Whether the sequence of events is followable, including the timing of prior interventions, escalation steps and the review period | **Close.** The Engine does not mention prior interventions or escalation steps |

## What this means (*Inference*)
1. **Results cannot be reported per Codebook condition without this table.** The Engine's output key `cold_reviewer_clarity` is RC1, and `accountability_support` is RC5.
2. **Two Engine questions drift from the Codebook:**
   - Engine 2 asks RC1's question under RC4's name.
   - Engine 4 can be read as a merits question, which the Codebook excludes.
   Any study should therefore score the **route** (ready, review or gap) as its primary outcome. Per-condition results are secondary and exploratory until v0.2.
3. **The order differs.** The Engine runs RC2, RC4, RC1, RC5, RC3; the Codebook runs RC1 to RC5.

## Proposed for Engine v0.2 (production change: owner approval, deployment and byte verification required)
- Rename the keys `rc1_reconstructability` to `rc5_evidentiary_sufficiency`, in Codebook order.
- Put the Codebook's experimental definitions and detection criteria in the prompt word for word.
- Add the Codebook's scope line (documentation adequacy, not merits) to the system prompt.
- Keep a compatibility map from the old keys for any stored results (B-013A records).
- Re-anchor the guard `ENGINE_CONDITION_KEYS` (currently read from `lib/manifest/`; see the defect register's guard note) in the same change.
