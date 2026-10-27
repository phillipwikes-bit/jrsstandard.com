# Final Report: 156-Record Study of the JRS Review Engine (offline)

**2026-10-27.**
- **Engine of record:** 0.3.1-candidate, unchanged.
- **Research candidate:** 0.3.3, not adopted.
- **No model was called, no credential was read, no network attempt was made, nothing was committed.**
- **B-018 OPEN. NO_GO_NOT_VERIFIED in effect.**

Every rate below is agreement with a reference written by an AI: construction intent for synthetic records, or a key reproduced by three LLM raters for the originals. It is not accuracy. No partition is a holdout, because one developer wrote the records, the rules and the scoring.

## 1. What kind of result this is

| Stage | Status |
|---|---|
| Research preparation | **Done.** Inventory of all 156 records, 100 disclosed synthetic replacements, feature matrix, research candidate, codebook, blinded forms, label and contamination registers, proposed criteria, freeze, request and cost plan, unsigned authorization draft |
| Full study | **Partly done.** Offline mechanical runs over every eligible record and 809 variants, with scripted mock candidates. **Not done:** model runs, human reference labels, reviewer-benefit sessions, the 32 public cases, the 20 out-of-scope originals |
| Independent evaluation | **Not done.** Nothing in the package is independent |
| Release | **Not done.** No release, adoption or production claim is made |

## 2. Every record's disposition

| Records | Count | Disposition | Evidence |
|---|---|---|---|
| Synthetic, development (F01 to F04) | 40 | Substantive with mock candidates | `out/run-1` |
| Synthetic, evaluation (F05 to F10) | 60 | Substantive with mock candidates | `out/run-1` |
| Originals in scope (R03, R08, R15, R22) | 4 | Substantive with mock candidates (development) | `out/run-1` |
| Originals outside scope (13 excluded, 7 ambiguous) | 20 | Correct refusal by the research profile; mock arms not run pending SC-1 | `out/run-1` |
| Public cases | 32 | Not run: text not held; retrieval needs authorization; rights and privacy NOT ESTABLISHED | `registers/RECORD_INVENTORY_V2.json` |

**Of the 104 substantive records:**
- 71 were fully assessed in every research arm.
- 33 were partial in at least one arm: a basis condition stayed `not_assessed` because a mock candidate could not quote it.

**Failures:** 0 technical failures, 0 incorrect refusals, 0 scope leaks. Per-record dispositions are in `reports/ANALYSIS.json`.

## 3. Main results (evaluation partition: 60 records, 24 designed ungrounded, 36 grounded, 6 families)

| Candidate policy (all scripted) | Flags on ungrounded | Flags on grounded (false alarm) | CLEAR on ungrounded (false reassurance) | Abstention |
|---|---|---|---|---|
| A3 heuristic, told the answer | 18 of 24 | 0 of 36 | 0 | 53% |
| A4 heuristic, always claims support | 19 of 24 | 0 of 36 | **0** | 52% |
| A5 heuristic, always claims a gap | 18 of 24 | **0 of 36** | 0 | 70% |
| A3R rule-aligned, told the answer (ceiling) | 19 of 24 (79.2%; family interval 66.7% to 91.7%) | 1 of 36 | 0 | 22% |
| A4R rule-aligned, always claims support | 19 of 24 | 1 of 36 | **0** | 22% |
| A6 default profile, false supplier declaration | 16 of 24 | **33 of 36** | 0 | 18% |

**What the table shows**
- **Over-claiming is held back on unaltered records.** No ungrounded record became CLEAR, even when the candidate claimed support everywhere.
- **Under-claiming does not create false alarms.** Gaps the rules cannot confirm are routed to review.
- **The default profile cannot read study records.** It flags 33 of 36 clean records.
- **Agreement fell from development to evaluation.** On the development partition the ceiling arm flagged 15 of 16 ungrounded records. The evaluation drop comes from decisions phrased in ways the lexicon does not know, a dated title line counted as evidence, and one rule defect (EF-01 to EF-08).

### Questions (evaluation; same result in every research arm)

| Q1 authority alone | Q2 restated conclusion | Q3 same event or not | Q4 separate requests |
|---|---|---|---|
| 11 of 12 | 5 of 6 | 11 of 12 | 6 of 6 |

### Variants (evaluation, rule-aligned arms)

- **Stable:**
  - formatting: 60 of 60;
  - sentence order: 58 of 58;
  - repeated quotation, always ambiguous and unused.
- **Failures:**
  - **An irrelevant sentence with a date or a document number lets an over-claiming candidate make 15 of 24 ungrounded records CLEAR** (VF-01, VF-02);
  - an indirectly worded instruction is never detected (0 of 30; VF-03);
  - evidence removal: 38 of 49 flagged and none CLEAR under A3R. Under the always-supporting candidate, 2 of 49 reached CLEAR, and in both the removal transform had left evidence in place (generator defect HF-05);
  - the record rules (A2) do not detect 7 of 53 inserted contradictions.

## 4. Cognitive controls

See `reports/COGNITIVE_CONTROLS_ASSESSMENT.md`.

**What the controls do**
- They named the designed flaw on 27 of 30 flawed evaluation records.
- They stayed silent on 26 of 30 clean records.
- They are worded as questions, not verdicts.

**Where they fall short**
- They repeat (36 repeats in 60 graphs).
- 93 of 100 carry no span link.
- They disappear under anchor stuffing (14 of 21).

Their value to a human reviewer is NOT ESTABLISHED.

## 5. Stability and recovery

See `reports/STABILITY_RECOVERY_AND_PERFORMANCE.md`.

| Check | Result |
|---|---|
| Replay of the scored runs | 1,120 of 1,120 identical |
| Replay of the variant runs | 4,045 of 4,045 identical |
| Replay in another time zone and locale | 1,120 of 1,120 identical |
| Fresh-copy reproduction | 1,120 of 1,120 identical |
| Recovery | 9 of 10 (harness defect HF-01); corrected copy 10 of 10 |
| Transport | 49 of 49 |
| Regression probes | 32 of 32 |
| Mutation | 30 of 32 non-equivalent mutants killed by probes |
| Default path against 0.3.2 | 310 of 310 identical |

## 6. Proposed acceptance criteria (owner approval NOT GIVEN)

23 of 27 met. Not met:
- **AC-14:** sensitivity 79.2%, against 80%.
- **AC-17:** question minimum 83.3%, against 90%.
- **AC-18:** variants V2, V5, V6 and V7.
- **AC-22:** control redundancy.

Three of these were predicted to pass from development results: AC-14, AC-17 and the V5 part of AC-18. That gap is itself a finding about overfitting to the development families.

## 7. Recommendation for each capability

| Recommendation | Capabilities |
|---|---|
| **Continue** | Default-scope refusal; research-profile gating and fail-closed behaviour; quote-only contract, never-raise rule and guards; compiler determinism; offline transport design; regression and mutation suites |
| **Repair** (in a new candidate, evaluated on new material) | Anchor linkage to decisions (VF-01, VF-02, EF-05, EF-06); decision detection (EF-01, EF-03); the plural-quantity defect (EF-02); event identity (EF-07, VF-05); a research-profile instruction screen (VF-03); one control per defect, with span links (CF-01) |
| **Narrow** | Claims limited to constructed prose decision records of the kinds tested; never rely on the lexical backstop alone; decision contradictions detected only when a subject identifier is shared |
| **Stop** | Using the default supplier-access profile on study records; any thought of the full live plan before the repairs above |

## 8. Decisions for the owner

See `reports/OWNER_DECISION_SHEET.md`. The first, and smallest, is how to preserve this package before the container is reclaimed.

## 9. Six plain-English answers

**1. What works?**
- The Engine refuses what it should.
- It never raises a candidate's status, and never gives a "ready" or "sufficient" verdict.
- It gives exactly the same output every time, including in another time zone and language setting.
- The research mode does nothing unless it is deliberately switched on, and switching it on changes nothing for the normal path.
- The offline transport safeguards pass all 49 of their tests.
- On the constructed records, when the stand-in candidate cites the right text, the rules catch most flawed records and almost never flag a clean one.

**2. What was actually tested?**
- **Offline mechanics only.** The compiler and the research rules ran on 104 records: 100 synthetic records written by the same developer, and 4 public vignettes. Scripted stand-ins played the model, and some of them were told the answer.
- **Variants and replays.** 809 altered versions, two replays and one replay in another environment.
- **Tests.** 32 regression probes, 35 deliberate code breakages, 10 recovery scenarios and 49 transport tests.
- **Not tested.** No real model, no human reviewer, no public case and no excluded-domain original was involved.

**3. What important failures occurred?**
- **Irrelevant anchors.** A date or document number in an irrelevant sentence let an over-claiming candidate make 15 of 24 flawed records look clean.
- **Indirect injection.** An indirectly worded instruction hidden in a record was never detected.
- **New wording.** On record families the rules had not seen, decisions phrased differently were missed and a dated title line was taken as evidence, so agreement fell.
- **Controls.** They repeat themselves and seldom point at exact text.
- **Test harness.** One test-harness bug, kept on record and corrected in a separate copy.

**4. Were the cognitive controls useful?**
- For people: unknown, because no reviewer has used them.
- Mechanically: they named the right kind of flaw on 27 of 30 flawed records and stayed quiet on 26 of 30 clean ones.
- But they repeat, rarely link to the text, and vanish under the same anchor trick.

**5. What remains unproven?**
- Accuracy on real records.
- Behaviour with a real model.
- Whether the controls help reviewers.
- Agreement with human reference labels.
- Anything about the excluded domains or the public cases.
- Whether the rules hold for writing by anyone other than their author.
- Behaviour on other Node versions or operating systems.

**6. What is Phillip's smallest next decision?**
- Whether to keep this work before the container is reclaimed, in one of two ways:
  - commit it to the development branch, which is public on GitHub but not deployed;
  - or take a private archive.
