# Study 013: bias review

**2026-10-02, at the owner's request.** The owner asked whether the study is biased, using an analogy: an allegation judged against an established documented history is assessed differently from one judged against an empty record. The analogy fits this study closely. The owner's source text concerns a private matter and is not reproduced here, because the repository is public.

## Short answer
**Yes. The study has a measurement bias, and it pushes toward over-flagging.**
- The reviewers judged the EEOC's short background summaries **as if they were the records**. The EEOC judged the full investigative file.
- A summary leaves out sources, exhibits and the agency's reasoning by design. So nearly every summary looks deficient: an "empty record" problem.
- **This bias does not change the narrow result** (on these summaries, no arm separated adequate from inadequate records).
- **It does mean the result says almost nothing about how JRS or the Engine perform on real files.** It also makes "JRS made the model worse" an unsafe reading (item 1 below).

## Bias inventory
| # | Source of bias | Direction | Evidence | Size |
|---|---|---|---|---|
| 1 | **Summary treated as the record (unit bias)** | Against PASS records, for every arm; strongest for the arms given the JRS conditions | *Observed* in the reviewers' own notes. On upheld cases, Opus with JRS wrote, for example, "The record ends with the bare statement that the Agency concluded Complainant 'failed to prove' discrimination", and "No affidavits, interview scores, panel members, emails, or other ROI exhibits are identified as the source". That one-line conclusion is the EEOC's summary of the agency's decision; the agency's reasoning and the exhibits are in documents the reviewer never saw. A keyword count (a heuristic) of first-run notes found missing-source or bare-conclusion complaints in 21 to 23 of 30 cases for each JRS arm (B 22, C 21, D 23), against 9 for the generic prompt (A) and 8 for the production Engine (C0) | **Large.** It likely explains most of the over-flagging, and why B flagged more than A: JRS conditions RC1 (connected reasoning) and RC2 (identified sources) test exactly what a summary removes |
| 2 | **Two different bars** (JRS documentation sufficiency against the EEOC's "adequate to decide") | Against PASS | *Inference*, stated in the protocol before the run ("specificity is a lower bound") | Unmeasured |
| 3 | **Stripping asymmetry** | Mostly against PASS | *Observed* in `STRIP_LOG.json`. Removing "supplemental investigation" sentences took 7 sentences from PASS cases and 2 from GAP cases. In S013-28 it removed the fact that the agency itself found missing witness testimony and ran a supplemental investigation; that is evidence of a thorough record. Two other removed PASS sentences were the complainant's own complaints, which would point toward a gap | Small (4 PASS cases: 02, 12, 15, 28) |
| 4 | **The AI-judge tendency toward negative verdicts** | Toward flagging | *Source-reported*: published surveys of LLM-as-judge bias describe systematic biases, including sentiment (negativity) bias, and show that prompt wording skews decisions (search results, papers not opened). Discrimination complaints are negative narratives by nature. Not tested in this study | Unknown |
| 5 | **Label meaning** (an affirmance is not a complete record) | Against PASS | *Inference*. In federal-sector EEO cases the complainant bears the burden of proof, so the EEOC can affirm when proof fails even if the record is imperfect. "Failed to establish" style wording appears in 14 of 15 PASS and 15 of 15 GAP decisions, so it cannot separate the two | Unmeasured |
| 6 | **Designer bias** (the study was built by an AI for the JRS owner) | Would favor JRS | The selection rule and protocol were fixed before any model call, and every amendment is dated. The result went **against** JRS, which suggests this bias did not drive it. There has been no independent replication | Low for this result |

## What the result can and cannot be used for
- **Can:** "When AI reviewers were given EEOC summaries, every configuration over-flagged, and none matched the EEOC's adequacy rulings."
- **Cannot:**
  - "AI or JRS cannot assess investigation records";
  - "JRS makes AI review worse" (item 1 is a sufficient alternative explanation);
  - any statement about real investigative files.

## Fixes for the next round (*Proposal*; nothing has been changed in the run already done)
1. **Settle the format question with a human check.** A human JRS reviewer, such as the owner or a trained reviewer, scores the same 30 summaries blind.
   - If the human also flags nearly all of them, the bias is in the format.
   - If the human passes the upheld ones, the models are applying the bar too strictly.
   - This needs no model call and no money.
2. **Use fuller records:** decisions whose text sets out the investigative evidence in detail, or publicly filed administrative records. A source is NOT ESTABLISHED yet.
3. **Fix the stripping rule:** remove only the EEOC's ruling sentences, and keep facts about how the record was developed (for example "the Agency conducted a supplemental investigation").
4. **Pre-register a format-aware question as a separate arm**, such as "judge only what a summary of this kind can show". It must not replace the original arms.
5. **Report notes-based checks with a human coder,** not keyword counts. The counts above are a quick heuristic.
