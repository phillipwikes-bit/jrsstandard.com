# Record Check Benchmark v1

Date: 25 November 2026. Status: first public version, built from published public decisions and from the developer's own sealed test sets. Anyone can run their tool on it; the scorer and every answer key are included.

## What it measures

Whether a tool can tell, from the documents alone, what a later reviewer, auditor or regulator could not rebuild from a decision record.

| Track | Task | Items | Truth |
|---|---|---|---|
| A. Dropped dates and speakers | Given a public decision (the source) and a record, report whether the record drops dates or the "who said it" the source gives, and which | 84: 28 EEOC appeal decisions, each unchanged, with its dates removed, and with its speakers removed | Built by rule from the source (study 014's anchor extractor) |
| B. Lossy AI summaries | Given a public decision and two AI-written drafts of it, report which draft lost more of what a reviewer needs | 60 pairs: 30 EEOC decisions, two AI drafters | Study 014 (2 October 2026): concise summaries lost most citations and quotations; a reader rebuilt 77% of masked facts from them against 97% from the source |
| C. EU AI Act deployer records | For each of ten deployer points (Regulation (EU) 2024/1689, Articles 4, 6, 14 and 26), report whether a fictional AI authorisation record shows it and a document backs it | 12 fictional records, 120 points | Answer key written and sealed before the checking code existed |
| D. Outcome risk from the record account | Flag EEOC decisions whose agency decision was not affirmed, reading only the BACKGROUND section (never the analysis or order) | 206 development + 183 test decisions | Outcome read from the order by a fixed rule; checked by hand on 3 decisions |

## How to take part

1. Read `data/track-a.json` to `data/track-d.json` (track D: tune only on its `development` split).
2. Write one answers file in the format of `answers/ds-n1.json`: `{"tool": "...", "A": {id: {flagged, dropped_dates, dropped_speakers}}, "B": {id: {lossier: "x"|"y"}}, "C": {id: {point: "S"|"U"|"U-SHORT"|"N"|"NA"}}, "D": {id: {flag}}}`. Any track may be left out.
3. Run `node score.mjs your-answers.json`.

## Results so far

| Track | Measure | Decision Spellcheck | Flag everything | Flag nothing |
|---|---|---|---|---|
| A | Unchanged decisions passed | 28 of 28 (100%) | 0 of 28 (0%) | 28 of 28 (100%) |
| A | Altered decisions flagged | 56 of 56 (100%) | 56 of 56 (100%) | 0 of 56 (0%) |
| A | Dropped dates named | 238 of 265 (90%) | 0 of 265 (0%) | 0 of 265 (0%) |
| A | Dropped speakers named | 61 of 88 (69%) | 0 of 88 (0%) | 0 of 88 (0%) |
| B | Lossier AI draft identified | 56 of 60 (93%) | 26 of 60 (43%) | 26 of 60 (43%) |
| C | EU AI Act points agreeing with key | 118 of 120 (98%) | 46 of 120 (38%) | 43 of 120 (36%) |
| C | Points wrongly credited as backed (lower is better) | 0 | 0 | 77 |
| D | Not affirmed when flagged | 24 of 107 (22%) | 27 of 183 (15%) | - |
| D | Not affirmed when not flagged | 3 of 76 (4%) | - | 27 of 183 (15%) |
| D | Fisher exact p | 0.000503 | 1 | 1 |

Decision Spellcheck answers come from `adapters/ds-n1.mjs`; the baselines from `adapters/baselines.mjs`.

## Proofs that run with the benchmark

| Claim | Proof | Result |
|---|---|---|
| Same input, same answer | `proofs/determinism-and-offline.mjs`: two fresh runs, byte comparison | Identical (SHA-256 `5f0db08d...`) |
| Nothing leaves the computer | Same script, with every network route in Node blocked during both runs; static check of 21 runtime files | Completed with the network blocked; no runtime file names a network API |
| Every finding shows its working | `proofs/traceability.mjs` on tracks A and B | 1,542 of 1,542 open findings name the record sentence; 987 of 987 findings about a source name the source sentence |

## Read this before comparing numbers

- **Decision Spellcheck was developed with some of this material.** Track A is its first real-record hold-out: run once after the fixes and passed (28 of 28 on each count), then used as a guard. Track B was its development set for reworded drafts. Track C's records were written by its developer. Track D's rule was chosen on the development split and run once on the test split. A tool seeing these items for the first time is being tested more strictly.
- **Track D's result for Decision Spellcheck is procedural, not about record quality.** The rule flags decisions whose background does not mention a decision without a hearing or on summary judgment. The record-quality rule (gaps such as "did not provide", "failed to investigate") pointed the same way (25% against 12% not affirmed) but did not reach significance (p 0.067). See `tests/ds-n1/outcome-holdout/`.
- **All answer keys are public, including track D's test split.** The benchmark works on trust until an independent party holds a hidden test set.
- **Every key was written or built by one developer.** No independent person has checked them. Corrections are welcome and will be recorded, not silently applied.
- **What Decision Spellcheck does not do well, and this benchmark does not yet measure:** clearing a long reworded draft without any serious flag. On three locked sets of good AI drafts, 0 to 5 of 30 were free of serious flags (target 15). These failures are recorded in `tests/ds-n1/EVIDENCE_INDEX.md`.
- **Sources.** Decisions are published by the U.S. Equal Employment Opportunity Commission (eeoc.gov). Works of the U.S. federal government are generally not subject to copyright in the United States (17 U.S.C. section 105); check the position in your own country before reuse. The AI drafts in track B were produced in study 014 for this research. Track C is fictional.
- **No accuracy, compliance or market claim** is made by publishing these numbers. They describe these items only.
