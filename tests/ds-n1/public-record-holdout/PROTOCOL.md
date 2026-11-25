# Real-record hold-out: protocol (fixed before the texts are fetched and before any fix)

Written 2026-11-25 on owner instruction: "Continue fixing until it works for real records."

**Texts.** The next 30 eligible EEOC federal-sector appellate decisions after study 014's study set (30) and reserved set (29), under study 014's own selection rule (`build_corpus.py`), skipping decisions posted after 2026-10-02. They are fetched once, hashed and committed, and are **not run through the engine** until the fixes are finished. Fixes are made only on the development sets (study 014's 30, the 29 reserved decisions now used in eval 3, and the 14 public documents of eval 1).

**Items (no AI model):**
- Intact: record = the decision; source = the same decision.
- Dates removed: every date the study 014 extractor finds is deleted together with a directly preceding "on", "in", "dated", "by", "since", "until" or "from", with no placeholder left.
- Speakers removed: every attributed role token is replaced with "an individual" (study 014 Part 2 method).

**Pass criteria, all three required ("works on real records" for this test):**
1. Intact records reach READY_FOR_HUMAN_FINALIZATION in at least 27 of 30 (90%).
2. Dates-removed records are held or flagged with a finding that names a dropped date, in at least 24 of 30 (80%).
3. Speakers-removed records are held or flagged with a finding that names a dropped speaker, in at least 24 of 30 (80%).

The detector may not key on the strings "an individual" or on a missing-placeholder pattern; it must compare the record with its source. The result is reported as measured, including failure.
