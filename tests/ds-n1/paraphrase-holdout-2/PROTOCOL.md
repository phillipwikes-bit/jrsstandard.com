# Paraphrase hold-out 2: protocol (fixed before the non-AI paraphrase work)

Written 2026-11-25 on owner instruction "Find a way without AI". Paraphrase hold-out 1 (Haiku drafts) has been run and is now development material; it cannot be reused as a hold-out.

**Hold-out texts.** Study 014's P3 drafts ("rewrite at the source's own length") by Sonnet for the 30 public EEOC decisions, branch `claude/engine-eval-v8-2026-10-01` at commit `8d61c681`, `runs/2026-10-02-draft/raw/S014-NN_claude-sonnet-5-5_P3.txt`. Study 014 measured them as keeping the source's anchors (median pooled retention 1.00), so they are good, reworded drafts. They are not run through the engine until the work below is finished. Development uses the P4 drafts of both drafters and the P1 drafts.

**Method constraint.** No AI model, no network, same answer every time: only fixed word lists and fixed rules that are written into the code and reviewable.

**Pass criteria on the 30 Sonnet P3 drafts, both required:**
1. Median open findings per 10 statements at most 3.
2. At least 15 of 30 drafts reach READY_FOR_HUMAN_FINALIZATION or REVIEW_REQUIRED with no critical finding.

**Guard, also required.** On the development pairs, the lossy P1 summary still gets more dropped-detail questions than the P4 draft in at least 24 of 30 decisions for each drafter, and the first real-record hold-out still passes (28/28 on each count). Loosening matching must not hide real problems.
