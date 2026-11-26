# Outcome prediction from the record alone: protocol (fixed before any outcome is read)

Written 2026-11-25 on owner instruction to fix "it can't predict a decision's outcome from the decision text alone".

**Data.** Public EEOC federal-sector appellate decisions already downloaded from eeoc.gov:
- Development: the 248 PDFs of the study 014 query (`DEVELOPMENT_PDFS.sha256`). Outcomes and features may be examined freely.
- Hold-out: the 375 PDFs of the wider query (`HOLDOUT_PDFS.sha256`), whose outcomes have not been read. Scored once, after the rule below is fixed and committed.

**What the tool may see.** Only the decision's BACKGROUND section (study 014's extractor, `build_corpus.background`), which recounts the agency record. Never the analysis, the order or any sentence stating the Commission's result. Decisions with no extractable background, and requests for reconsideration, are excluded before scoring.

**Outcome (truth).** Read from the full decision by a fixed rule written before any hold-out outcome is read: "affirmed" when the order affirms the agency's decision and does not reverse, vacate, remand or modify any part of it; otherwise "not affirmed". Decisions whose order cannot be classified by the rule are excluded and counted.

**Rule.** A deterministic score from the background text alone, chosen on the development set and committed with its threshold before the hold-out is scored. Only fixed word rules; no AI model.

**Pass criteria on the hold-out, both required:** (1) decisions the rule flags are not affirmed more often than unflagged ones, two-sided Fisher exact p < 0.05; (2) the rule flags between 10% and 90% of decisions (it must separate, not flag almost everything or nothing). Reported with counts, rates and Wilson intervals, whether it passes or fails.
