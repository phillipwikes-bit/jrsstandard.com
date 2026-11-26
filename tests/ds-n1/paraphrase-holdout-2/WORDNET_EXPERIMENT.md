# WordNet experiment (2026-11-25): tried, measured, not adopted

**What was tried.** Princeton WordNet 3.1 (free licence; npm `wordnet-db` 3.1.14), reduced to a 1.7 MB table of each single word's four most frequent meanings. Two words counted as matching when they shared a meaning. Used in support scoring and the relevance check. No AI; offline; deterministic. The table builder is kept here (`build-wordnet-table.py`).

**Word-pair check before use.** Of 13 equivalent pairs common in these records, 7 matched (say/state, say/aver, put/place, decline/refuse, begin/start, get/receive, fire/terminate); ask/request, job/position, boss/supervisor, tell/inform, give/provide and remove/dismiss did not, because WordNet links them by other relations, not as synonyms. None of 22 opposite or different pairs matched at four senses (say/deny, hire/fire, grant/deny, begin/end and others).

**Effect on the development drafts (P4, 30 decisions each).**

| | Before | With WordNet |
|---|---|---|
| Sonnet: findings per 10 statements | 2.80 | 2.65 |
| Sonnet: good drafts free of serious flags | 1 / 30 | 1 / 30 |
| Haiku: findings per 10 statements | 2.56 | 2.46 |
| Haiku: good drafts free of serious flags | 5 / 30 | 4 / 30 |

No earlier result changed, and real-record hold-out 1 still passed 28/28.

**Why not adopted.** It barely moved the target, it would add a 1.7 MB data file and licence notices to every copy, and it broke the single-file offline starter edition (its test failed: the table cannot be loaded there). The remaining serious flags on good drafts come mostly from sentence structure (which clause is cited, how negation and attribution are worded), not from vocabulary. Hold-out 2 was not run.
