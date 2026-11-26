# Record Check Benchmark v1

Date: 25 November 2026 (tracks E and F added the same day). Status: first public version, built from published public decisions and from the developer's own sealed test sets. Anyone can run their tool on it; the scorer and every answer key are included.

## What it measures

Whether a tool can tell, from the documents alone, what a later reviewer, auditor or regulator could not rebuild from a decision record.

| Track | Task | Items | Truth |
|---|---|---|---|
| A. Dropped dates and speakers | Given a public decision (the source) and a record, report whether the record drops dates or the "who said it" the source gives, and which | 84: 28 EEOC appeal decisions, each unchanged, with its dates removed, and with its speakers removed | Built by rule from the source (study 014's anchor extractor) |
| B. Lossy AI summaries | Given a public decision and two AI-written drafts of it, report which draft lost more of what a reviewer needs | 60 pairs: 30 EEOC decisions, two AI drafters | Study 014 (2 October 2026): concise summaries lost most citations and quotations; a reader rebuilt 77% of masked facts from them against 97% from the source |
| C. EU AI Act deployer records | For each of ten deployer points (Regulation (EU) 2024/1689, Articles 4, 6, 14 and 26), report whether a fictional AI authorisation record shows it and a document backs it | 12 fictional records, 120 points | Answer key written and sealed before the checking code existed |
| D. Outcome risk from the record account | Flag EEOC decisions whose agency decision was not affirmed, reading only the BACKGROUND section (never the analysis or order) | 206 development + 183 test decisions | Outcome read from the order by a fixed rule; checked by hand on 3 decisions |
| E. Changed figures | Given a public decision and a passage of it, report whether the passage changes an amount, percentage or period the decision gives, and which figure | 120: 40 EEOC decisions (not used in tracks A to D), each passage unchanged, with the figure written another way (same value), and with the figure changed; in 16 of the 40 the new figure is another figure from the same decision | Built by rule (`build-track-e.mjs`) |
| F and FH. Good AI drafts | Given a public decision and an AI-written account of it, report whether it has a serious problem and which sentences; good drafts should pass, and in a copy with one error put in, the changed sentence should be flagged | F: 120 (the 60 study 014 drafts that kept their citations, two drafters, 30 decisions, each also with one changed date, negation or figure). FH and FH2: 60 each, sealed hold-outs of 30 further drafts (Haiku P3 rewrites; Haiku P2 "findings" write-ups) built the same way (`FH_PROTOCOL.md`, `FH2_PROTOCOL.md`) | Study 014 (good drafts); the change is made by rule (`build-track-f.mjs`) |

## How to take part

1. Read `data/track-a.json` to `data/track-f.json` (track D: tune only on its `development` split).
2. Write one answers file in the format of `answers/ds-n1.json`: `{"tool": "...", "A": {id: {flagged, dropped_dates, dropped_speakers}}, "B": {id: {lossier: "x"|"y"}}, "C": {id: {point: "S"|"U"|"U-SHORT"|"N"|"NA"}}, "D": {id: {flag}}, "E": {id: {flagged, wrong_figures}}, "F": {id: {serious, flagged_sentences}}}`. Any track may be left out.
3. Run `node score.mjs your-answers.json`.

## Results so far

| Track | Measure | Decision Spellcheck | Flag everything | Flag nothing |
|---|---|---|---|---|
| A | Unchanged decisions passed | 28 of 28 (100%) | 0 of 28 (0%) | 28 of 28 (100%) |
| A | Altered decisions flagged | 56 of 56 (100%) | 56 of 56 (100%) | 0 of 56 (0%) |
| A | Dropped dates named | 244 of 265 (92%) | 0 of 265 (0%) | 0 of 265 (0%) |
| A | Dropped speakers named | 80 of 88 (91%) | 0 of 88 (0%) | 0 of 88 (0%) |
| B | Lossier AI draft identified | 56 of 60 (93%) | 26 of 60 (43%) | 26 of 60 (43%) |
| C | EU AI Act points agreeing with key | 118 of 120 (98%) | 46 of 120 (38%) | 43 of 120 (36%) |
| C | Points wrongly credited as backed (lower is better) | 0 | 0 | 77 |
| D | Not affirmed when flagged | 24 of 107 (22%) | 27 of 183 (15%) | - |
| D | Not affirmed when not flagged | 3 of 76 (4%) | - | 27 of 183 (15%) |
| D | Fisher exact p | 0.000503 | 1 | 1 |
| E | Unchanged passages passed (of which: figure written another way) | 80 of 80 (40 of 40) | 0 of 80 | 80 of 80 |
| E | Changed figures flagged and named | 39 of 40 (98%); first run 33 of 40 | 40 flagged, 0 named | 0 of 40 |
| E | ... where the new figure is another figure from the same decision | 15 of 16; first run 10 of 16 | 16 of 16 | 0 of 16 |
| F | Good AI drafts with no serious flag | 29 of 60 (48%); first run 11 of 60 | 0 of 60 | 60 of 60 |
| F | Changed sentence flagged as serious | 48 of 60 (80%); first run 21 of 60 | 60 of 60 | 0 of 60 |
| F | Both in the same pair (good draft passed and its changed copy caught) | 21 of 60 (35%); first run 3 of 60 | 0 of 60 | 0 of 60 |
| FH (sealed hold-out 1, run once) | Good AI drafts with no serious flag | **0 of 30 (failed; needed 15)**; now development material: 3 of 30 | 0 of 30 | 30 of 30 |
| FH (sealed hold-out 1, run once) | Changed sentence flagged as serious | **18 of 30 (failed; needed 21)**; now development material: 25 of 30 | 30 of 30 | 0 of 30 |
| FH2 (sealed hold-out 2, run once) | Good AI drafts with no serious flag | **7 of 30 (failed; before 4, needed 9)** | 0 of 30 | 30 of 30 |
| FH2 (sealed hold-out 2, run once) | Changed sentence flagged as serious | **19 of 30 (failed; before 17, needed 21)**: dates 15 of 16, negations 2 of 10, figures 2 of 4 | 30 of 30 | 0 of 30 |

**A stronger baseline for track E.** `adapters/number-diff.mjs` flags every number in the passage that appears nowhere in the decision. It passes all 80 unchanged passages and catches 16 of 40 changed figures (2 of the 16 where the new figure comes from elsewhere in the same decision). Any vendor could build it in an afternoon; a figure check has to beat it.

Decision Spellcheck answers come from `adapters/ds-n1.mjs`; the baselines from `adapters/baselines.mjs` and `adapters/number-diff.mjs`.

## Proofs that run with the benchmark

| Claim | Proof | Result |
|---|---|---|
| Same input, same answer | `proofs/determinism-and-offline.mjs`: two fresh runs, byte comparison | Identical (SHA-256 `598976ce...` on the code of 26 November; earlier versions `8988cd3f...` and `5f0db08d...`) |
| Nothing leaves the computer | Same script, with every network route in Node blocked during both runs; static check of 21 runtime files | Completed with the network blocked; no runtime file names a network API |
| Every finding shows its working | `proofs/traceability.mjs` on tracks A and B | 1,475 of 1,475 open findings name the record sentence; 987 of 987 findings about a source name the source sentence (rerun 26 November; fewer findings than before because false flags were removed) |

## Read this before comparing numbers

- **Decision Spellcheck was developed with some of this material.** Track A is its first real-record hold-out: run once after the fixes and passed (28 of 28 on each count), then used as a guard. Track B was its development set for reworded drafts. Track C's records were written by its developer. Track D's rule was chosen on the development split and run once on the test split. A tool seeing these items for the first time is being tested more strictly.
- **Track D's result for Decision Spellcheck is procedural, not about record quality.** The rule flags decisions whose background does not mention a decision without a hearing or on summary judgment. The record-quality rule (gaps such as "did not provide", "failed to investigate") pointed the same way (25% against 12% not affirmed) but did not reach significance (p 0.067). See `tests/ds-n1/outcome-holdout/`.
- **All answer keys are public, including track D's test split.** The benchmark works on trust until an independent party holds a hidden test set.
- **Every key was written or built by one developer.** No independent person has checked them. Corrections are welcome and will be recorded, not silently applied.
- **"First run" means the number before any change was made for that track.** Tracks E and F were built, then Decision Spellcheck was run on them once and the result kept (`answers/FIRST_RUN_E_F.json`). The fixes that followed were made by looking at what it missed on those same items, so the later numbers are on seen material. A tool seeing E and F for the first time should be compared with the first-run figures.
- **What Decision Spellcheck does not do well, now measured (tracks F and FH):** clearing a long reworded draft without any serious flag. On the development drafts 29 of 60 pass after tuning; on two sealed hold-outs of fresh drafts, **0 of 30** and **7 of 30** pass, and most inserted negations are missed. On the second hold-out about one statement in ten carries a serious flag, and in a sample of 20 such flags 7 were real (the draft added analysis the decision does not support). See `FH_RESULT.md`, `FH2_RESULT.md` and `tests/ds-n1/FLAG_REVIEW.md`. Earlier locked sets gave 0 to 5 of 30 (target 15). These failures are recorded in `tests/ds-n1/EVIDENCE_INDEX.md` and `tests/ds-n1/BLIND_SPOTS.md`.
- **Track E's decisions were not used to build any earlier check**, but tracks E and F were built by the same developer who built Decision Spellcheck, and the changes put into them follow fixed rules the developer chose.
- **Sources.** Decisions are published by the U.S. Equal Employment Opportunity Commission (eeoc.gov). Works of the U.S. federal government are generally not subject to copyright in the United States (17 U.S.C. section 105); check the position in your own country before reuse. The AI drafts in tracks B and F were produced in study 014 for this research and are published on branch `claude/engine-eval-v8-2026-10-01` (`research/study-014-drr/runs/2026-10-02-draft/raw/`). Track C is fictional.
- **No accuracy, compliance or market claim** is made by publishing these numbers. They describe these items only.
