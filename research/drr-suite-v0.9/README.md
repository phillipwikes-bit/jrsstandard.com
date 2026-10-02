# JRS DRR Test Suite, v0.9 (pre-release)

**Status: PRE-RELEASE, built 2026-10-02.** Not a certification. No conformance mark is offered at v0.9 (see "Path to v1.0"). Licence terms are a draft that requires owner review (`LICENCE_TERMS_DRAFT.md`).

## What it measures
The suite tests a **drafting tool**: software or a model prompt that turns an investigation record into a summary, findings section or report. It measures whether the draft keeps the material a later reviewer needs in order to reconstruct how and on what basis a decision was reached. This is Decision Reconstruction Risk (DRR), the subject of the Justification Review Standard (JRS).

| Measure | What it is | How it is scored |
|---|---|---|
| Anchor retention | The share of the source's dates, record citations, attributed statements (who said it) and quotations that survive into the draft, by type and pooled | Deterministic extractor, `lib/anchors_v12.py` |
| Unsupported additions | Dates, citations and quotations in the draft that are not in the source | Same extractor; a shortened date or a faithful bracket resolution is not counted |
| Reconstruction (cloze) | Five sentences per text with a date or speaker masked; a reader fills the mask from the draft alone | Exact normalized match, `lib/cloze.py`; no model grades |
| Length ratio | Draft words divided by source words | Reported for context only |

**It does not measure** accuracy of the underlying decision, fairness, bias, legal sufficiency, regulatory compliance, or whether a record is "good". A high score means the draft kept reconstruction anchors on these texts. It does not mean the tool is safe, compliant or fit for any use.

## Contents
| Path | Purpose |
|---|---|
| `practice/S014-01.txt` to `S014-30.txt` | **Public practice set.** BACKGROUND sections of 30 EEOC federal-sector appellate decisions, selected by the fixed rule in `research/study-014-drr/PROTOCOL.md`. These are U.S. government records; the source URLs and PDF hashes are in `research/study-014-drr/corpus/MANIFEST.json` |
| `score.py` | Scorer: `drafts`, `cloze-items`, `cloze-score`, `verify` |
| `lib/anchors_v10.py` | Study 014's pre-registered extractor, kept for comparison |
| `lib/anchors_v11.py`, `lib/anchors_v12.py` | Post-hoc corrections (below). **v1.2 is the suite's scorer** |
| `lib/cloze.py` | Cloze items and the reader instruction, frozen from Study 014 |
| `test_suite.py` | 16 tests; two injected faults are caught |
| `BASELINES.json` | Reference scores from Study 014's 240 drafts. Reference points, not pass marks |
| `HARNESS_SPEC.md` | How a vendor runs a tool through the suite |
| `VERSION.json` | SHA-256 of every frozen file; `python3 score.py verify` checks them |

## Quick use
```
python3 score.py verify
python3 score.py drafts path/to/drafts       # one file per text: S014-01.txt ... S014-30.txt
python3 score.py cloze-items > items.json    # for the reader step in HARNESS_SPEC.md
python3 score.py cloze-score answers.json
```
Python 3.8 or later, standard library only. No network access, no model calls.

## Reference results (Study 014, one draft per text; extractor v1.2)
| Drafter and prompt | Pooled retention | Citations | Attributions | Unsupported additions | Length ratio |
|---|---|---|---|---|---|
| Sonnet 5.5, P1 concise summary | 0.33 | 0.00 | 0.33 | 0 | 0.47 |
| Haiku 4.5, P1 concise summary | 0.07 | 0.00 | 0.29 | 1 | 0.22 |
| Sonnet 5.5, P4 JRS-guided | 1.00 | 1.00 | 0.67 | 0 | 0.94 |
| Haiku 4.5, P4 JRS-guided | 1.00 | 1.00 | 1.00 | 0 | 0.88 |

The values are medians across the 30 texts; citations are taken over the 13 texts that contain them. Cloze reconstruction, read by Sonnet 5.5: source 0.967; P1 draft 0.773; P4 draft 0.973; no document 0.113. The full table is in `BASELINES.json` and `research/study-014-drr/RESULTS.md`.

## Known limits (v0.9)
1. **The scorer was corrected after the data were seen, and its unsupported-additions count is not yet reliable.**
   - v1.1 and v1.2 fix extractor errors found by reading every flagged item in Study 014.
   - The confirmatory run on the 29 held-out texts (`research/study-014-drr/CONFIRMATORY_RESULTS.md`) found four more source forms that v1.2 misses.
   - Every flag on the JRS-guided drafts there was an extractor error.
   - Until v1.3 is confirmed on new texts, the automatic count is a screening step: each flag is read by hand (`HARNESS_SPEC.md` section 3.4) and labelled before it is reported.
2. **The private set is reproducible from the public rule.** The 29 held-out texts are the next texts the published selection rule yields, so anyone can rebuild them. They guard against tuning a scorer, not against a vendor tuning a tool. v1.0 needs a private set drawn by a rule that is not published (for example, a sealed random draw).
3. **One text family.** Every text is an EEOC federal-sector decision background. Results may not carry over to workplace investigation reports, police reports or audit files.
4. **Small set.** 30 texts; intervals are wide.
5. **Anchors are surface features.** Retention counts whether a date or citation survives, not whether it is attached to the right event.
6. **Attribution matching is narrow.** It sees a role label followed by a speech verb. A draft that names the speaker in other words can score as a loss.
7. **Cloze needs a reader model.** The reader is a variable; the suite fixes the instruction and scoring but not the reader.

## Path to v1.0
- Extractor v1.3 (the four forms in `CONFIRMATORY_RESULTS.md`), confirmed on texts not yet used. Both earlier sets are now spent.
- A sealed private set drawn by an unpublished rule, kept outside this public repository (B-018).
- Study 014 Part 2 completed (detection; 205 of 1,350 calls done).
- Licence terms reviewed by the owner.
- A conformance mark only after a trademark registration decision (the filing package is prepared separately; the owner files).

## Provenance
- Built by Claude Code (AI-assisted) at the direction of Phillip Wikes on 2026-10-02.
- The practice texts are U.S. federal government records.
- Authorship and ownership of the suite are not determined here (CLAUDE.md Rule 4); they are recorded for review in the estate registers.
