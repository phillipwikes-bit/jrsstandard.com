# 0.3.6-research-candidate: exact changes from 0.3.5-research-candidate

Dated 2026-10-28. Version choice: 0.3.6 is the next unused research version. Parent: `research/study-continuation-0.3.5-2026-10-28/candidate/` (manifest SHA-256 `9f96dd48…`, unchanged). This candidate: `candidate/` (manifest `CANDIDATE_0.3.6_MANIFEST_SHA256.txt`, SHA-256 pinned in `tools/harness/engines.mjs`). It is a compiler-only change: the prompt file and its version (`jrs-engine-local-0.3.5-research/prompt-1`) are byte-identical, so every 0.3.5 capture replays unchanged.

11 of 46 files differ:

| File | Change |
|---|---|
| `lib/.../research-profile.mjs` | RP-SRP-14: `relevance_assessments` accepted in the research profile and validated (person only; fail closed); `applyRelevanceAssessments()`; in `evaluateResearchConditions` a stated link supports a basis condition only when a person assessed its sentence as relevant (`supports`, `strongSupport`); otherwise review reason `stated_link_relevance_unresolved` and an explanatory note. Absence gaps are computed as before. |
| `lib/.../compiler.mjs` | Calls `applyRelevanceAssessments` after the sentence units are built; header comment. |
| `lib/.../contract.mjs` | `COMPILER_VERSION` `0.3.4-research-candidate` → `0.3.6-research-candidate` (the compiler changed). |
| 7 default rule packs (`rule-packs/*.json`) | `candidate_version` → `0.3.6-research-candidate`; content seal recomputed. Rules unchanged. |
| `rule-packs-research/RPK-SRP.json` | `candidate_version` → 0.3.6; `pack_version` 2.0.0 → 3.0.0; rule RP-SRP-14 added; content seal recomputed. RP-SRP-01 to 13 unchanged. |

Unchanged: the validator, strict parser, quotation resolution, scope and intake, conditions other than the support gate, conflict detection, controls and their templates, the instruction screen, dispositions, and E1 and E2 scoring. Rationale, tests and cost: `reports/ROOT_CAUSE_AND_REPAIR.md`.
