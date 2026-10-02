# Study 014 protocol (FIXED)

**Fixed 2026-10-02, before any corpus decision was read and before any model call.** Owner instruction 2026-10-02: "run Study 014, then build suite v0.9 ...".

This supersedes `PROTOCOL_DRAFT.md`, which is kept for history. Where this document is silent, the draft's framing applies (author-blind, no accuracy or compliance claims).

## Questions
1. **H1:** does routine AI drafting of an investigative record lose the anchors a later reviewer needs?
2. **H4:** does a JRS-guided drafting instruction keep more anchors than plain prompts? (Prevention.)
3. **H5:** can a reader reconstruct anchored facts from the AI drafts as well as from the source?
4. **H2 and H3:** do JRS-structured reviewers name missing anchors more often than a generic reviewer (H2), and does the Engine do better than the public JRS text (H3)?

## Corpus (selection rule)
- **Source:** EEOC federal-sector appellate decisions, through the search at `eeoc.gov/federal-sector/appellate-decisions`.
- **Query:** `"report of investigation" affidavit`. All result pages are read; only PDFs in dated folders are used.
- **Ordering:** newest posting folder first, then appeal number.
- **Eligible:** a BACKGROUND section of 400 to 2,500 words, containing at least 3 dates and at least 3 attributed statements, as counted by the anchor extractor below.
- **Selection:**
  - The first 30 eligible decisions form the **study set**. They are published here and become suite v0.9's public practice set.
  - The next 30 eligible decisions are reserved as the **v0.9 private set**. Their text is not committed, because the repository is public.
- **Text:** the BACKGROUND section, with page numbers, footnote markers and the pseudonym footnote removed. Appeal and agency numbers are replaced with "[number removed]".

## Anchors (deterministic extractor, `tools/anchors.py`, fixed with tests before any run)
| Type | Matched | Identity used for matching |
|---|---|---|
| `date` | Month D, YYYY; Month YYYY; M/D/YYYY | Normalized to YYYY-MM-DD, or YYYY-MM |
| `citation` | "ROI at N", "IR at N", "Report of Investigation at N", "Exhibit X", "Ex. N", "Tab N" | Normalized kind plus number |
| `attribution` | A role token (Complainant, S1, RMO2, CW3, C1, Witness 4, Supervisor 2, Manager, and similar) followed within 40 characters by a speech verb (stated, averred, testified, asserted, alleged, denied, explained, maintained, indicated, affirmed, contended, claimed, noted, reported, attested) | The role token |
| `quote` | Text in double quotes of 3 or more words | The normalized quote text |

- **Retention:** the share of a source's distinct anchors of each type that are also found in the draft.
- **Fabrication:** draft anchors of the date, citation and quote types that are not in the source.

## Part 1: drafting (H1, H4)
- **Drafters:** `claude-sonnet-5-5` and `claude-haiku-4-5-20251001`.
- **Prompts** (fixed text in `tools/study014.py`):
  - P1: concise summary.
  - P2: findings section.
  - P3: rewrite at the source's own length.
  - P4: the **JRS-guided instruction** (keep every date, every source attribution, every record citation, the decision-maker, the criteria applied and the responses considered).
- **Volume:** 30 sources × 2 drafters × 4 prompts = 240 drafts, one each.
- **H1 holds** if, for P1 and P2 together, median retention is below 50% for at least 2 anchor types.
- **H4 holds** if P4's median retention, pooled across types, exceeds both P1's and P2's for both drafters, **and** P4's fabrication rate is not higher than P1's.

## Part 3: reconstruction test (H5)
- **Items:** for each source, 5 cloze items chosen by rule: the first 5 source sentences containing a date or attribution anchor, with that anchor masked.
- **Reader:** `claude-sonnet-5-5`. It is given **only** the document under test (the source, a P1 Sonnet draft or a P4 Sonnet draft) and must fill each mask, answering "not stated" if the document does not say.
- **Null baseline:** no document at all.
- **Scoring:** an exact normalized match with the masked anchor. No model grades.
- **H5:** report accuracy for each condition. "Reconstruction loss" is source accuracy minus draft accuracy.

## Part 2: detection (H2, H3)
- **Items (90):**
  - 30 unaltered sources, as controls;
  - 30 controlled deletions, rotating across sources: 10 with **dates** removed, 10 with **citations** removed, 10 with **attributions** removed (role tokens replaced with "an individual");
  - the 30 P1 Sonnet drafts.
- **Arms:**
  - A: Sonnet, a generic reconstructability prompt with no JRS terms.
  - B: Sonnet with the public Codebook text.
  - C: Engine v0.2 evaluation build: Codebook keys, no rewrite, delimited input.
  - C0: the production Engine prompt on Haiku, read from `api/review-engine.js` and hash-locked to `97176e22`.
  - D: `claude-opus-5-5` with the public Codebook text.
  - 3 runs each, giving 90 × 5 × 3 = 1,350 calls.
- **Output:** A, B, C and D return `missing`, chosen from a fixed list: dates, sources, record_citations, attributions, decision_maker, criteria, responses_considered, other. C0's production output is mapped from its conditions:
  - basis_identification gap or review → sources;
  - temporal_reconstructability → dates;
  - reasoning_traceability → decision_maker and criteria.
- **Scoring (deterministic, modal across runs):**
  - **deletion hit** when the deleted type is named (attributions also counts as sources);
  - **draft hit** when the reviewer names at least one type the draft actually lost (retention below 50% in Part 1);
  - **control flag rate** is the share of sources on which the same type is named.
- **H2:** B, C and D have a higher deletion-hit rate than A, with the control flag rate reported alongside.
- **H3:** C beats B and D.

## Statements allowed by result (fixed)
| Result | Allowed |
|---|---|
| H1 holds | "In this test, routine AI drafting of investigative records lost most of the [types] a later reviewer needs." Scoped to these drafters, these prompts and these texts |
| H4 holds | "A JRS-guided drafting instruction kept more reconstruction anchors than plain prompts, without more fabrication." |
| H5 | The measured reconstruction loss, reported as is |
| H2 or H3, either way | Reported with the same prominence |
| Any | No accuracy, certification or compliance claim; no "prevents" or "eliminates" |

## Cost and controls
- The estimate is USD 35 to 60 (*Inference*). The owner's instruction to run is the authorization. A runaway stop is set at USD 150, and a hard cap at 2,200 calls.
- **Key:** the owner's own key, pasted in chat and named by him for this run ("run Study 014"), used only as a process variable under CLAUDE.md section 22. It is never written to any file.
- **Network:** the only destinations are `api.anthropic.com` and `eeoc.gov` for the corpus.
- **Outputs:** never overwritten; raw responses saved.
- **Retries:** up to 2, on 429, 529 and 5xx only.
- No refusal fallback.

## Implementation note 1, 2026-10-02 (before any model call; after corpus counts were seen)
The corpus has record citations in only 11 of 30 sources, so the deletion rotation is fixed as follows, by source ID order:
- the first 10 sources with at least one citation get the **citations** deletion;
- the next 10 remaining sources get the **dates** deletion;
- the last 10 get the **attributions** deletion.

The Codebook text is re-extracted, word for word, to `engine/codebook-conditions.json`.

## Implementation note 2, 2026-10-02 (before any model call)
The attribution deletion is strengthened. The speaker of every attributed statement (a role followed by a speech verb) is replaced with "someone", so no attributed statement keeps its source. The first version only replaced numbered roles and left "Complainant", "Supervisor" and similar speakers in place.
