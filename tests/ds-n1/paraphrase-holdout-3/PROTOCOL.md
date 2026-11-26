# Paraphrase hold-out 3: protocol (fixed before the severity recalibration)

Written 2026-11-25 on owner instruction to fix "it can't clear a long reworded draft completely". Hold-outs 1 and 2 have been run and are development material now.

**Change under test.** Calibration of the serious ("critical") label. A sample of remaining critical findings on good drafts (`paraphrase-holdout-2/FLAG_SAMPLE_REVIEW.md`) found about 15 of 24 wrong. Proposed: when a statement's cited passage is related to it but the wording cannot be confirmed, report SUPPORT_NOT_CONFIRMED (review: a person must check it; the record still cannot reach READY without them) instead of UNSUPPORTED_CLAIM (critical). Critical stays for a statement with no related passage at all, and for contradictions. This changes labels, not what a reviewer must look at; that is stated wherever results are reported.

**Hold-out texts.** Study 014's P2 drafts ("findings section") by Sonnet for the 30 public EEOC decisions (branch `claude/engine-eval-v8-2026-10-01`, commit `8d61c681`); study 014 measured them as keeping the source's anchors (median pooled retention 0.975). Not run through the engine until the change is final.

**Pass criteria on the 30 drafts, all required:**
1. Median open findings per 10 statements at most 3.
2. At least 15 of 30 drafts reach READY_FOR_HUMAN_FINALIZATION or REVIEW_REQUIRED with no critical finding.
3. Calibration check: of the critical findings that remain on the hold-out drafts, a fixed sample of up to 20 (ordered by SHA-256) is read against the decision; at least half must be genuine problems. If not, the label is still not trustworthy and the change fails.

**Guards (must still hold):** real-record hold-out 1 (28/28 each); lossy summaries separated in at least 24 of 30 for each drafter; every earlier sealed fictional result unchanged; fictional fixtures that must not reach READY still do not.
