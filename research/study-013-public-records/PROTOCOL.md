# Study 013 feasibility round: protocol

**Fixed 2026-10-02, before any model call.** Owner instruction 2026-10-02: "Execute all recommended proposals to successfully facilitate this study." Spending: "Spend whatever for study" (assessment Appendix A).

## Question
On 30 public EEOC decisions, each labeled from the EEOC's own finding (`KEY.json`):
- Does applying JRS improve AI review of whether an investigative record supports a decision on the merits? (Arm A against Arm B.)
- Does the Engine add anything beyond a model given the public JRS? (Arm B against Arm C, and Arm C against Arm D.)

## Arms
| Arm | Model | Instructions | Why |
|---|---|---|---|
| A | `claude-sonnet-5-5` | A strong generic reviewer prompt, with no JRS | Baseline: same model, no JRS |
| B | `claude-sonnet-5-5` | The same task plus the five published Codebook conditions, verbatim (`engine/codebook-conditions.json`) | Same model plus public JRS |
| C | `claude-sonnet-5-5` | **Engine v0.2-eval** (`engine/review-engine-v0.2-eval.mjs`) | The Engine under test |
| C0 | `claude-haiku-4-5-20251001` | **Engine v0.1, the production prompt unchanged**, with the evaluation length limit | What the live Engine does today |
| D | `claude-opus-5-5` | The same prompt as B | A stronger current model plus public JRS |

- **Equal budgets:** every arm runs 3 times per case. The case's route is the modal route across the 3 runs; a three-way tie counts as `review`.
- **Thinking:**
  - Sonnet 5.5 and Opus 5.5 run with adaptive thinking, the API default, at `effort: "high"`, set explicitly for both.
  - Haiku 4.5 (C0) runs without thinking, as production does.
- **Structured JSON output** (`output_config.format`) is used for A, B, C and D. C0 keeps production's prompt-only JSON.
- **No refusal fallback:** a fallback would swap the model under test in the middle of the study. A refusal is recorded as its own outcome.
- **Arm D is single-vendor:** no second vendor's key is set in this environment. A cross-vendor arm (D2) can be added later by a dated amendment.

## Decisions taken under the owner's instruction (assessment items 24 to 28)
| Item | Decision |
|---|---|
| 24 Model | The study Engine (v0.2-eval) runs on `claude-sonnet-5-5`. Anthropic's model-deprecations page, checked earlier and recorded in assessment E.1, lists it as not retiring before 2027-09-28. **The production Engine is not changed by this study.** `api/_model.js` requires reproducibility evidence before a model change, and this study produces that evidence. Production migration is a separate release step after the results |
| 25 Codebook mapping | v0.2-eval uses the Codebook's keys (`rc1` to `rc5`), its definitions and detection criteria verbatim, and its scope line |
| 26 Rewrite | v0.2-eval has no `compliant_version`, in either its prompt or its output |
| 27 Unit of review | **An evaluation-only limit of 40,000 characters, for every arm.** All 30 cases fit (the longest is about 26,000). Production's 8,000-character limit is unchanged. Results apply to record summaries of this length |
| 28 Telemetry | The study runner has no database client and no logging to JRS. Its only network destination is `api.anthropic.com`; anything else is refused |

## Outcomes (pre-registered)
- **Primary, flag:** a case is *flagged* when its modal route is `gap` or `review`.
  - Sensitivity = share of GAP cases flagged.
  - Specificity = share of PASS cases not flagged.
  - Each comes with a Wilson 95% interval (n = 15 each).
- **Secondary, strict:** the same calculation counting `gap` only.
- **Stability:** the share of cases where all 3 runs gave the same route.
- **Paired comparisons:** A against B, B against C, C against D, and C0 against C. The case-level agreement table is reported. At n = 30 these are descriptive, not significance tests.
- **Bands:**
  - by text length, below or above the median word count, because GAP texts are shorter;
  - by posting year, before 2023 or 2023 and later, as a memorization check.
- **Per-condition results** for B, C and D are exploratory only (see `CODEBOOK_ENGINE_MAPPING.md`).
- **No model grades any outcome.** Scoring is a deterministic comparison of the route against `KEY.json`.

## Known limits
- Specificity is a lower bound. A PASS label means the EEOC found the record adequate for the issues it decided; a documentation gap may still exist.
- The texts are EEOC summaries of the records, not the records themselves.
- 30 cases is a feasibility round. A signal here justifies a 100 to 150 case round; it does not establish accuracy.
- The case selection had 5 amendments (`SELECTION_RULE.md`). All were made before any model call.

## Controls in the runner
- A hard cap of 500 calls, counted before each call is sent.
- A runaway stop at USD 100 observed cost. This is a guard against a loop, not a budget.
- A 180-second timeout per call. Retries only on 429, 529 and 5xx, up to 2, honoring `retry-after`. No retry on a timeout.
- An output directory is never overwritten.
- Every raw response is saved, together with the model, the system prompt's hash, the case hash and the usage.
- The key is read from `ANTHROPIC_API_KEY` only and is never written anywhere.
