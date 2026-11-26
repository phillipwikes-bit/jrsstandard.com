# Paraphrased real records: hold-out protocol (fixed before any paraphrase fix)

Written 2026-11-25. The first real-record hold-out (`public-record-holdout/`) passed, but it tested exact copies and deletions. Real records reword their sources. This tests that.

**Texts.** Study 014's AI drafts of the 30 public EEOC decisions (branch `claude/engine-eval-v8-2026-10-01`, `runs/2026-10-02-draft/raw/`). **Development uses only the Sonnet drafts. The Haiku drafts are the hold-out** and are not run through the engine until the paraphrase fixes are finished.

**Truth (from study 014, measured before this work).** P1 concise summaries lost most citations and quotations (reconstruction 77% against 97% from the source); P4 drafts kept them (97%).

**Pass criteria on the 30 Haiku pairs, all required:**
1. Good drafts are not buried in false alarms: the median P4 draft has at most 3 open findings per 10 statements.
2. Lossy drafts are told apart: P1 receives more dropped-detail questions (DATE_OMITTED, SPEAKER_OMITTED and omission questions) than P4 of the same decision in at least 24 of 30 pairs (80%).
3. At least half of the P4 drafts reach READY_FOR_HUMAN_FINALIZATION or REVIEW_REQUIRED with no critical finding.
