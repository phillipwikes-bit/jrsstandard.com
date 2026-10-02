# Study 014 results

**Run 2026-10-02, against the protocol fixed in commit `b184ca6` (`PROTOCOL.md`).**

- Parts 1 and 3 are complete.
- **Part 2 is incomplete: 205 of 1,350 calls.** The owner's API account ran out of credit mid-run.
- Spend was USD 9.20: drafting 4.99, cloze 0.59, detection 3.61. Failed calls are not billed.
- Scores are in `runs/SCORES.json`; the raw outputs are in `runs/`.

Labels follow CLAUDE.md Rule 2.

## Headline (what may be said, per the protocol's fixed statements)
1. **H1 holds (FACT, pre-registered rule).** "In this test, routine AI drafting of investigative records lost most of the record citations and quotations a later reviewer needs." This is scoped to these two drafters, these prompts and these 30 EEOC texts.
2. **H4 is NOT MET under the pre-registered rule (FACT).**
   - The retention part held: the JRS-guided instruction P4 kept more anchors than P1 and P2 for both drafters.
   - The fabrication part failed as measured: the pre-registered extractor counted more unsupported anchors in P4 drafts than in P1 drafts.
   - The H4 sentence ("without more fabrication") **may not be used.**
3. **The H4 failure traces to the measuring tool, not the drafts (INFERENCE, post-hoc, REQUIRES HUMAN REVIEW).**
   - Every unsupported anchor flagged in the 60 P4 drafts was read against its source. All were extractor errors.
   - Under the corrected extractor (v1.2), P4 drafts contain **0** unsupported dates, citations or quotations, for both drafters.
   - This is a post-hoc finding. It needs a confirmatory run on unseen texts before it can support any claim (see "Next").
4. **H5, reconstruction loss (FACT).** A reader answered 96.7% of masked facts from the source and 77.3% from a concise Sonnet summary (P1), a loss of 19.4 points. From a JRS-guided draft (P4) it answered 97.3%, a loss of -0.6 points, which is within noise.
5. **H2 and H3 (provisional, 84% complete; see `PART2_RESULTS.md`; updated after the resume).**
   - H2 is met by the letter but is not informative: the Codebook-prompted reviewers flag missing material on nearly every intact record too.
   - H3 is not met.
   - The production Engine caught 10 of 10 date deletions while flagging 1 of 26 intact records. It cannot report citations by design.

## Part 1: drafting (240 drafts; 239 ended normally; Haiku P3 on S014-24 hit the 4,000-token limit and is scored as delivered)
Median retention across 30 texts, pre-registered extractor v1.0. Citations are over the texts that contain them.

| Drafter | Prompt | Dates | Citations | Attributions | Quotes | Pooled | Length ratio |
|---|---|---|---|---|---|---|---|
| Sonnet 5.5 | P1 concise summary | 0.73 | 0.00 | 0.33 | 0.07 | 0.33 | 0.47 |
| Sonnet 5.5 | P2 findings section | 1.00 | 1.00 | 0.67 | 0.80 | 0.97 | 1.23 |
| Sonnet 5.5 | P3 same-length rewrite | 1.00 | 1.00 | 0.71 | 1.00 | 1.00 | 0.99 |
| Sonnet 5.5 | **P4 JRS-guided** | 1.00 | 1.00 | 0.67 | 1.00 | **1.00** | 0.94 |
| Haiku 4.5 | P1 concise summary | 0.48 | 0.00 | 0.29 | 0.00 | 0.09 | 0.22 |
| Haiku 4.5 | P2 findings section | 0.74 | 0.00 | 0.67 | 0.11 | 0.57 | 0.62 |
| Haiku 4.5 | P3 same-length rewrite | 0.95 | 0.00 | 0.67 | 0.29 | 0.67 | 0.97 |
| Haiku 4.5 | **P4 JRS-guided** | 1.00 | 1.00 | 1.00 | 1.00 | **1.00** | 0.88 |

**H1 rule:** for P1 and P2 together, median retention must be below 50% for at least 2 types. Citations and quotes are both below 50%, so it is met.

**H4, retention part:** P4's pooled median exceeds P1 and P2 for both drafters, so it is met. For Sonnet, P4 (1.00) against P2 (0.97) is a narrow margin.

### Fabrication: counts of draft anchors not found in the source
| Drafter | Prompt | v1.0, pre-registered (dates / citations / quotes) | v1.1, post-hoc | v1.2, post-hoc (suite scorer) |
|---|---|---|---|---|
| Sonnet 5.5 | P1 | 19 / 0 / 6 = 25 | 5 | **0** |
| Sonnet 5.5 | P4 | 4 / 22 / 12 = 38 | 11 | **0** |
| Haiku 4.5 | P1 | 24 / 0 / 2 = 26 | 1 | **1** |
| Haiku 4.5 | P4 | 5 / 7 / 12 = 24 | 10 | **0** |

**H4, fabrication part (pre-registered, v1.0):**
- Sonnet P4 has 38 against P1's 25, which is higher.
- Haiku P4 has 24 against P1's 26, which is not higher.
- Both drafters are required, so the rule is **not met**.
- It also fails under v1.1. It would be met under v1.2, but v1.2 was written after the data were seen. **The pre-registered result stands: H4 not met.**

### What the extractor got wrong (found by reading every flagged item)
| Version | Defect | Example |
|---|---|---|
| v1.0 | Record-citation forms not matched, so a draft that kept them looked as if it had invented them | "Report of Investigation (ROI) at 12", "Id. at 5", page lists |
| v1.0 | A shortened date counted as invented | "March 2018" for "March 3, 2018" |
| v1.0 | Quotes were changed by bracket edits | "[s]he" against "she" |
| v1.1 | Mis-paired quote marks. Short quotes ("huh?", "H", "2.") were skipped, so the text between two real quotes was read as a quote | 17 of 19 v1.1 quote flags in P1 and P4 |
| v1.1 | A faithful bracket resolution counted as invented | "[human resources (HR)]" written as "HR" |
| v1.1 | Page lists joined by "and", ";" or "(" missed | "ROI at 77- 80 and 90" |

**Genuine misquotation was found, but not in P4.** Read against the source, v1.2's remaining flags across all 240 drafts are:
- Haiku P3, S014-09: one invented quotation ("accept this offer or decline it entirely" is not in the source), and two quotations reworded inside quote marks.
- Sonnet P2: three paraphrases placed in quote marks (S014-10 twice, S014-26 once).
- Haiku P1, S014-05: one quotation with a word dropped ("slap upside the head" for "slap her upside the head").
- Two date flags (Haiku P2 and P3, S014-26) are extractor errors: the source's "May 15 and June 3, 2015" is not parsed as a date.

The reading was done by Claude Code, a model, and has not been checked by a person. That is why it is labelled *Requires human review*.

## Part 3: reconstruction (cloze; reader Sonnet 5.5; 150 items, 5 per text)
| Document given to the reader | Correct | Rate | 95% interval |
|---|---|---|---|
| Source | 145 / 150 | 0.967 | 0.924 to 0.986 |
| Sonnet P1 concise summary | 116 / 150 | 0.773 | 0.700 to 0.833 |
| Sonnet P4 JRS-guided summary | 146 / 150 | 0.973 | 0.933 to 0.990 |
| No document | 17 / 150 | 0.113 | 0.072 to 0.174 |

- The no-document baseline (0.113) shows that some masks can be guessed, mostly "Complainant".
- The P1 interval does not overlap the source interval.

## Part 2: detection (INCOMPLETE; not interpreted)
- 205 of 1,350 calls returned. The other 1,145 were refused by the API with "Your credit balance is too low".
- The returned calls cover texts S014-01 to S014-05: 5 controls, 5 date deletions and 5 drafts, across the five arms.
- With 5 deletions of a single type, every interval runs from about 0.5 to 1.0, so **no comparison between arms is possible.** The partial tallies are in `runs/SCORES.json` only so that nothing is hidden.
- Resuming is one command once credit is added. It sends only the 1,145 missing calls to a new folder and checks that the items match by hash:

  `python3 tools/study014.py detect-resume 2026-10-03-detect-resume 2026-10-02-draft 2026-10-02-detect`

  Score both folders together with `score ... 2026-10-02-detect,2026-10-03-detect-resume`.
- Estimated cost: about USD 20 (*Inference*, from the cost of the 205 calls already made).

## Deviations and limits
1. **Post-hoc extractors.** v1.1 and v1.2 were written after the data were seen. They are labelled as such, and v1.0 is reported as primary.
2. **Attribution deletion over-anonymizes** in a few places where "claims" is a noun ("Complainant's claims were..."), so some deletion items remove more than attributions. This affects Part 2 only.
3. **Citation deletion is imperfect.** S014-22's deletion item keeps one citation (v1.0 count).
4. **One truncated draft:** Haiku P3 on S014-24 stopped at the token limit and is scored as delivered.
5. **One draft per condition, so no sampling variance is measured.** One text family (EEOC federal-sector decisions). Two drafters, both from one provider.
6. **The P4 instruction was written by the study's author.** The test shows what this instruction does with these models. It does not show that a vendor's product would behave the same way.

## Next (updated 2026-10-02, after the confirmatory run)
- The confirmatory run is done: **H4c failed** on the automatic count, while the manual reading found only extractor errors in P4. See `CONFIRMATORY_RESULTS.md`.
- Part 2 resumed after the owner added credit; its results are reported in `PART2_RESULTS.md` when complete.
