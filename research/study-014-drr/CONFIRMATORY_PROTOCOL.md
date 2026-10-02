# Study 014 confirmatory run (FIXED before any call)

**Fixed 2026-10-02, after the owner added API credit and before any confirmatory draft exists.** Its purpose is to test, on texts the corrected scorer was never tuned on, the post-hoc finding in `RESULTS.md`: that the JRS-guided instruction keeps more anchors **without** more unsupported additions.

## Frozen instrument
- Scorer: DRR Test Suite v0.9, extractor `anchors_v12.py`.
- The SHA-256 values in `research/drr-suite-v0.9/VERSION.json` are frozen at commit `ce15933`.
- `score.py verify` must pass before scoring. No change to the extractor is allowed after drafts exist. Any defect found is reported, not fixed, in this run.

## Texts
The 29 held-out texts (P014-01 to P014-29). Their hashes are in `VERSION.json` under `private_set`. The texts and the drafts are **not committed**, because the repository is public (B-023). Only scores, per-text counts and hashes are committed.

## Drafting
Identical to Part 1:
- the same system prompt and prompt text, P1, P2 and P4 (P3 is not repeated);
- drafters `claude-sonnet-5-5` and `claude-haiku-4-5-20251001`, at the same settings;
- one draft per text, prompt and drafter, giving 174 calls.

## Confirmatory rule (H4c)
H4c holds only if **all** of the following hold, for **both** drafters:
1. P4's median pooled retention is greater than both P1's and P2's;
2. P4's total automatic unsupported count (v1.2: dates, citations and quotes) is not higher than P1's.

Automatic counts decide H4c. Manual reading of the flagged items is reported beside the counts but cannot change the verdict.

## Allowed statements
| Result | Allowed |
|---|---|
| H4c holds | "On 29 held-out EEOC texts, a JRS-guided drafting instruction kept more reconstruction anchors than plain prompts, without more unsupported additions, for both models tested." It must be paired with: "The original pre-registered test did not meet this condition because of scorer errors; this is the confirmatory test with a corrected scorer." |
| H4c fails | Reported with the same prominence, with the failing condition named |

## Controls
- Cost estimate: USD 3 to 5 (*Inference*). Runaway stop: USD 150, inherited from the runner.
- The key is used only as a process variable.
- Output goes to the scratchpad. Nothing is overwritten.
