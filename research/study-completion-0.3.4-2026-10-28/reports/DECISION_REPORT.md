# Decision report: continue, narrow or stop the 0.3.4 research candidate

**2026-10-28. Recommendation: NARROW.** This is a recommendation for the owner, not a decision. 0.3.1 remains the engine of record; nothing is adopted, merged or deployed.

## What the evidence shows (offline, scripted, AI-labelled development material)

| For continuing | Against |
|---|---|
| No flawed record reached CLEAR in any candidate arm (0.3.3 let some through) | False alarms on clean records rose (rule-aligned arm 2 to 10 of 62) and CLEAR on clean records fell (48 to 34) |
| Flagged 38 to 40 of 42 flawed records (0.3.3: 33 to 35) | A basis stated in the record is taken at its word: relevant and irrelevant bases give the same outcome in 210 of 210 rows, and the flaw signal is lost in 132 of them |
| Quotations verify exactly; injected text is never counted as evidence; 18 of 22 instruction phrasings detected | 4 phrasings never detected; one benign sentence always detected |
| The live machinery is complete and tested offline | None of this is model output, none of it is human-labelled, and no record is a holdout |

## Why narrow, not continue or stop

- **Not continue as before:** another round of rule repair would be tuned on the same exposed material, and the main remaining weakness (relevance) is structural for lexical rules. More repair before real-model evidence would add risk without adding evidence.
- **Not stop:** the two questions that decide the candidate's value are cheap to answer and are not answered yet: does a real model produce verifiable quote-only proposals, and do Phillip's labels agree with the AI references the results rest on.
- **Narrow to three steps, in order, each with a stop point:**
  1. **PRE (3 requests, cap $0.05).** Stop if the PRE gate fails: a model that cannot reliably return the contract makes the rest moot.
  2. **Phillip's labels on the 44 Part 1 records** (four batches). If they disagree with the AI references on many records, the reference set cannot carry the study's conclusions; stop and fix the references before any further measurement.
  3. **RUN and TGT (398 requests, within a $1.00 cap)** only if both hold. Judge the results against LC-01 to LC-10, approved before the run; stop the candidate if false reassurance appears with a real model (LC-03, LC-07, LC-08).

## What would change this recommendation

- To **stop**: the PRE gate fails; or the labels contradict the references broadly; or the live run shows CLEAR on flawed records.
- To **continue further** (for example fresh evaluation records, AC-37): RUN and TGT meet the approved criteria, with human labels in agreement. Even then, adoption would remain a separate decision with its own release dependencies (operator controls, counsel review, independent production QA).
