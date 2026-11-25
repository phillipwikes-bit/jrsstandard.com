# Public-record eval 3: protocol (fixed before the decisions are fetched or the engine is run)

Written 2026-11-25 on owner instruction to test the records.

**Texts.** Study 014's reserved set, rebuilt with its own fixed selection rule (`research/study-014-drr/tools/build_corpus.py`, branch `claude/engine-eval-v8-2026-10-01`): EEOC federal-sector appellate decisions, query `"report of investigation" affidavit`, newest first; decisions posted after 2026-10-02 and the 30 study-set decisions are skipped; the next 30 eligible are taken. If EEOC has removed or added older decisions since 2 October, the set may differ slightly from the one reserved then; that is reported, not hidden.

**Items, built deterministically for each decision (no AI model):**
- Intact: record = the decision text; source = the same text.
- Dates removed: every date the study 014 extractor finds is replaced with "[date]".
- Speakers removed: every attributed role token (Complainant, S1, RMO2 and similar) is replaced with "an individual", as in study 014 Part 2.

**Signal.** Omission questions (`findOmissions`) plus open findings after review.

**Rules (decided now).**
1. Primary: for each decision, each removal version gets a higher signal than the intact version. Success: the removal version is higher in at least 80% of the 60 comparisons, and a two-sided sign test gives p < 0.05.
2. Secondary: the intact version reaches READY_FOR_HUMAN_FINALIZATION in at least half of the 30 decisions.

**Stated in advance.** If dates or speakers are removed, sentences may also stop matching the source and raise findings for that reason rather than as omissions; the result is reported as measured.
