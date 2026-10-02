# Study 014: does AI drafting create Decision Reconstruction Risk, and does JRS detect it better than AI review alone?

**DRAFT protocol, 2026-10-02. Not run. Not yet fixed:** it is fixed when the owner approves it and it is committed **before any model call**.

**Owner direction 2026-10-02:** "change the study to JRS's true strength detecting DRR ... what the tool does better than AI alone because AI creates DRR."

## Relation to Study 013 (unchanged and kept as recorded)
Study 013 asked whether reviewers could match the EEOC's adequate-to-decide rulings. That is not what JRS measures. Its negative result and bias review stay as recorded (`research/study-013-public-records/RESULTS.md`, `BIAS_REVIEW.md`). Relabelling it after the result would be outcome switching. **Study 014 is a new, separately pre-registered study** that asks JRS's own question: can a later reviewer reconstruct the basis of a decision from the record?

## Framing consistent with the estate's own research
The JRS manuscript (E-037) is author-blind: "JRS does not ask, and does not try to detect, whether a record was written by a person or with AI assistance." Study 014 keeps that position. It does not claim AI is uniquely at fault. It tests a narrower, measurable claim: **routine AI drafting of a record removes the anchors a later reviewer needs** (sources, dates, record citations, attributed statements). It then tests whether a JRS-structured review catches that loss more often than a generic AI review.

## Part 1: does AI drafting create DRR? (no judging model)
- **Input:** the 30 Study 013 background texts. They are real EEOC descriptions of investigative records, with named sources, dates and record citations.
- **Drafting task (one fixed prompt):** "Write a concise findings summary of this investigation for the case file." Two drafters: `claude-sonnet-5-5` and `claude-haiku-4-5-20251001`. One draft per text per drafter, giving 60 drafts.
- **Anchors, counted by a fixed rule written before the run:**
  1. calendar dates;
  2. record citations ("ROI at", "IR at", "Exhibit");
  3. attributed statements (a named role such as S1, RMO, CW or Complainant, followed by stated, averred, testified, asserted or alleged);
  4. direct quotations.
- **Measure:** anchor retention, the share of each anchor type in the source text that survives in the draft. It is computed by string matching, with no model judgment. Reported with the drafts' length relative to the source.
- **Hypothesis H1:** drafts keep materially fewer anchors than the source. "Materially" is fixed before the run as median retention below 50% for at least two anchor types.

## Part 2: does JRS detect the loss better than AI review alone?
- **Items:** 30 source texts, the 60 AI drafts, and 30 **controlled-deletion** variants. Each variant is a source text with all anchors of one type removed by rule, rotating evenly across the four types.
- **Answer key, deterministic and needing no model:** for each item, which anchor types are missing relative to its source.
- **Arms:** the same as Study 013 (A generic, B public JRS, C Engine v0.2-eval, C0 production Engine, D Opus plus public JRS), with 3 runs each. Each item is shown alone, the way a reviewer meets a real record.
- **Primary outcome (pre-registered):** the share of degraded items (drafts and deletions) where the reviewer names the missing element **in plain terms**, such as "no dates", "no source given" or "no citation to the record". It is scored against the key on a blinded worksheet by a human. A JRS condition label alone does not count, so the JRS arms do not score by vocabulary.
- **False alarms:** the same reviewers on the unaltered source texts. These are known to be imperfect (Study 013), so the comparison is relative: is the degraded version flagged more than its own source?
- **Hypotheses:**
  - H2: B, C and D name the missing element more often than A.
  - H3: C beats B and D. *Study 013 gives no reason to expect this; it is tested, not assumed.*

## What each result would allow us to say (fixed in advance)
| Result | Allowed statement |
|---|---|
| H1 holds | "In this test, routine AI summarization removed most of the anchors a later reviewer needs to reconstruct the decision." Scope: these texts, these drafters, this prompt |
| H2 holds | "A JRS-structured review named the missing anchors more often than a generic AI review." |
| H2 fails | Reported as a negative result, with the same prominence |
| H3 fails | The Engine prompt adds nothing measured over the public JRS text. This is consistent with Study 013; the asset is the method |
| Any result | No accuracy, certification or compliance claim |

## Cost and controls
- About 60 drafting calls plus 5 arms × 120 items × 3 runs = 1,800 review calls. Estimated cost USD 35 to 60 (*Inference*, from Study 013's observed USD 0.021 per review call). The runner cap will be raised for this study, with a USD 150 runaway stop.
- The same runner controls as Study 013: destination lock, no overwrite, raw responses saved, no telemetry.
- The key may be used only for a task the owner names (CLAUDE.md section 22). The key pasted for Study 013 is not reused without his say-so.

## Open before fixing
1. Owner approval of H1's threshold and of the plain-terms scoring rule.
2. A human scorer for Part 2: the owner, or a trained reviewer.
3. Whether to add a second-vendor drafter. It would strengthen "AI drafting" beyond one vendor; there is no key for one.

## Design review 2, 2026-10-02: blind spots and proposed additions (*Proposal*; not yet adopted)
| # | Blind spot | Why it matters | Proposed addition |
|---|---|---|---|
| 1 | **Anchors are a proxy.** Counting dates and citations is not the same as reconstructability | A draft can drop unimportant anchors and keep the decisive ones, or the reverse | **Reconstruction test (strongest measure):** fixed-rule questions built from the source's anchors ("who stated X?", "on what date did Y occur?", "where in the record is Z?"). A reader is given only the draft and answers; the key is the source. The score is the share answerable from the draft |
| 2 | **Materiality** | Losing the decisive facts matters more than losing incidental ones | Weight anchors tied to the facts the EEOC ordered developed (`study-013/GAP_DEFICIENCIES.json`, D1 to D10) separately from all other anchors |
| 3 | **Fabricated anchors** | AI may *add* dates, citations or quotations that are not in the source, which is worse than omitting them | Count anchors in each draft that do not appear in the source (precision as well as retention). Report them prominently, whatever the result |
| 4 | **Prompt realism** | One prompt invites the reply "you asked for concise" | Use three fixed realistic prompts (concise summary, findings section, length-matched rewrite), plus a fourth that **tells the AI to keep sources and dates**. That fourth one tests prevention, not only detection |
| 5 | **No human comparison** | "AI drafting creates DRR" needs a comparison | Treat the EEOC's own background text (a human-written summary) as the human baseline, and compare at matched length |
| 6 | **Citation stuffing** | A JRS-guided draft could add references that resolve to nothing | Every citation in a draft must resolve to a passage in the source. Unresolvable citations count as fabricated (item 3) |
| 7 | **Model and date dependence** | Results hold for specific model versions in October 2026 | Record versions; publish the runner so anyone can rerun it on a newer model |
| 8 | **One domain, one language, one vendor** | Limits generalization | State it as a limit. A second-vendor drafter and reviewer would be added when a key exists |
| 9 | **Owner conflict of interest** | The owner benefits from a positive result | Use an independent scorer; disclose and cite Study 013's negative result in every write-up |
