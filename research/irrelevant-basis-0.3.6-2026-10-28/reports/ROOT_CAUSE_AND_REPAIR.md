# Irrelevant-basis weakness: root cause, repair and cost

Dated 2026-10-28. Investigation of live run RUN-LIVE-AUTH-20261028-02 (arm L2, 0.3.5-research-candidate). Offline only: no provider request was sent. 0.3.1-candidate remains the engine of record; B-018 OPEN; NO_GO_NOT_VERIFIED; 0.3.6 is not adopted. All references below are AI-proposed, not human labels; agreement with them is not accuracy.

**Disposition: BOUNDED_REPAIR_IMPLEMENTED_OFFLINE.** The repair corrects a demonstrated defect: a stated link alone can establish support and a clean result. By design it does **not** restore the 28 weakened flags. Under the evidence contract, that weakening is the honest outcome while relevance is unassessed (section 3).

## 1. Verified baseline (FACT)

| Item | Value |
|---|---|
| Pairs | 42 records with an AI-proposed UNGROUNDED reference, each with a stated-irrelevant-basis variant (TGT-SB-*) |
| Recorded originals | FLAG in all three repeats for all 42 |
| Recorded variants (one send each) | FLAG 14, INDETERMINATE 28 |
| Offline replay of every capture by the frozen 0.3.5 | equal to the recorded result in 42 of 42 pairs |
| Inserted sentences | the frozen synthetic pool: "The decision rests on the printer service log PL-3 of 3 February." and "This outcome was based on canteen menu CM-12 dated 4 April." |
| Limitation | each variant was sent once and each original three times; variant stability is not measured |

Evidence: `out/PAIR_COMPARISON.json` and `reports/PAIR_COMPARISON.md`. Captures and journal are hash-checked before and after and are unchanged.

## 2. Why the 28 findings weakened (FACT, reproduced)

**One cause in all 28, in two forms. It lies in the compiler's linkage rules (RP-SRP-09), not in the model.**

The research rules count an anchor (a date or identifier) as stated, decision-linked evidence ("strong") when one of two things holds:
- **It sits in a sentence that gives a reason and refers to "the decision" or "this outcome"** (`basis_statement`). This form covers 20 pairs, with the sentence "This outcome was based on canteen menu CM-12 dated 4 April."
- **It sits in a sentence the rules read as a decision** (`decision_sentence`). This form covers 8 pairs: "The decision rests on the printer service log PL-3 of 3 February." is itself classified as a decision sentence, so its identifier and date count as the decision's own evidence.

No test of whether the material concerns the decision exists, and none is possible lexically. In all 28 pairs the original record had **no** strong anchor and the variant's only strong anchors come from the inserted sentence. Once `strong` is non-empty, the absence rules stop firing:

| Flaw code lost (counts across the 28) | Rule condition that the inserted link switches off |
|---|---|
| identifiable_basis: no_identifiable_basis_evidence (28) | `!strong && !weak` |
| reasoning_traceability: conclusion_without_stated_basis (18) | `!rationaleUnits && !strong && !weak` |
| reasoning_traceability: conclusion_restated_as_basis (10) | `!strong` |
| reconstructability: rule conclusion_without_identifiable_basis (7) | decision with `!strong` |

Separating the causes with controlled offline replays (captured proposals placed on the other text; these are not new model responses):

| Possible cause | Test | Result |
|---|---|---|
| The model changed its proposal | X2: original text + variant proposal | FLAG in 28 of 28, so not the cause |
| Compiler counted an asserted link as linked evidence | X1: variant text + each original proposal (r1, r2, r3) | not FLAG in 28 × 3; no strong anchor in the original; only the inserted sentence's | **cause in 28 of 28** |
| An added quotation changed eligibility or precedence | X1 uses proposals that never quote the inserted sentence, and still loses the flag | not the cause (every variant proposal quoted the sentence, but the quotation is not needed) |
| Genuine ambiguity warranting review | the inserted sentences are irrelevant by construction | not applicable |
| Unresolved | none | 0 |

**The 14 that held:** in 10, the original already had stated links. In all 14, the separate-conclusion gap (`conclusion_without_identifiable_basis`, from RP-SRP-08 subject grouping) survives, because the inserted material shares no subject with the decision.

**Secondary effect:** one variant (S-023) had `identifiable_basis` **supported** through the inserted sentence. That is an asserted relationship establishing support.

## 3. Is the weakening justified by the evidence contract?

**Partly (INFERENCE, stated precisely).**
- **The flag disappearing is defensible.** After the insertion the record *does* state a basis. "No linked evidence" and "no stated reason" are no longer literally true. Whether the stated material concerns the decision is a relevance judgement the lexical rules cannot make. Turning unresolved relevance back into a defect would fabricate a finding (owner instruction; test IB-04).
- **Support from a stated link is not justified.** A quotation match, date, identifier or asserted relationship must not independently establish semantic support (owner instruction, 2026-10-28). On 0.3.5 it does. A flawed synthetic record with "The decision rests on the printer service log PL-3…" and an over-claiming proposal reaches **CLEAR** with all three basis conditions supported (IB-03, failing before). In the frozen paired suite this happens in 64 rows on UNGROUNDED records. That is the residual limitation the 0.3.4 package recorded (Owner Decision Sheet V2, Decision 3). No owner ruling on that decision is recorded.

## 4. The repair: 0.3.6-research-candidate, rule RP-SRP-14 (compiler only)

There is no prompt or model change. The prompt version stays `jrs-engine-local-0.3.5-research/prompt-1`, so every 0.3.5 capture replays unchanged. The parent 0.3.5 is unchanged. The exact diff is in `CHANGES_FROM_0.3.5.md`.

| Distinction the contract requires | How 0.3.6 represents it |
|---|---|
| A quotation exists in the source | quote resolution, unchanged |
| The record asserts a relationship | stated link (strong anchor), unchanged; still removes absence gaps |
| A structural defect is demonstrated | rule visible gaps, unchanged; never removed by the repair |
| Relevance assessed by a separately identified person | `relevance_assessments` in the research profile: one sentence (SHA-256 of its text), relevant true or false, `assessor_kind: "human"`, a named person, a date. A model-like name or any non-human kind fails the profile closed. The candidate response cannot carry one. |
| Relevance unresolved | review, reason `stated_link_relevance_unresolved`; never supported, never a gap |

The effects:
- **Assessed relevant:** the stated link may support.
- **Assessed not relevant:** the link is removed, so a demonstrated absence of evidence is reported again (FLAG, IB-07).

**Tests** (`out/REPAIR_TESTS.json`; synthetic records, scripted proposals):
- 12 of 12 behave as expected: 7 repair tests fail on 0.3.5 and pass on 0.3.6, and 5 controls hold on both.
- 8 of 8 deliberately weakened implementations are caught.
- A deliberate failure gives exit code 1, and no failure gives 0.

The controls cover an unrelated sentence, a sentence sharing a date or identifier, a sound record acquiring no gap, a gap proposal on unresolved relevance not becoming a defect, and a model-supplied relevance field being refused. The repair tests cover a "rests on" irrelevant sentence, relevant new evidence with and without a person's assessment, ambiguous relevance, a person's "not relevant" assessment, non-human assessors, and an assessment of a sentence not in the record.

## 5. Benefits and regressions on the same available proposals (`out/COST_COMPARISON.json`)

| | 401 live replays | 624 scripted proposals |
|---|---|---|
| FLAG lost / new FLAG / new FLAG on AI-grounded | 0 / 0 / 0 | 0 / 0 / 0 |
| Condition gaps or flaw reasons lost / added | 0 / 0 | 0 / 0 |
| Quotation statuses or intake decisions changed | 0 | 0 |
| Reviewer controls (count; repeated) | 581 → 581; 0 | 825 → 825 |
| Guard or mechanical failures | 0 → 0 | 0 → 0 |
| Supported basis conditions | 52 → 0 | 429 → 0 |
| CLEAR | 1 → 0 (RUN-r3-S-019, AI-grounded) | 99 → 0 |
| Basis conditions at review | 1,115 → 1,167 | 1,020 → 1,449 |
| E1 INDETERMINATE rate | 0.509 → 0.511 | 0.32 → 0.48 |

Frozen suites run unchanged on both versions (`out/FROZEN_SUITES.json`):
- **Wording and controls:** identical.
- **Paired suite:** 1,820 of 1,820 pass on both. FLAGs are unchanged at 1,540, and the suite's flag-lost count is unchanged at 406. CLEAR goes 666 → 0, including the 64 CLEARs on UNGROUNDED records with a stated irrelevant basis.
- **Injection suite:** detection, quarantine and kept flags are unchanged; oracle-supported basis goes 63 → 0.
- **Regression probes:** 77 of 77 → 76 of 77. RG-23 ("ORACLE-R gives CLEAR on S-001") fails **by design**: support now needs a person's assessment.

**What this means.** The repair removes unsupported promotion of stated links: no support and no CLEAR from wording alone. It creates no new warnings and does not touch any demonstrated gap or control. Its cost is real. Without human relevance assessments **no** basis condition is supported and CLEAR is unreachable, on sound records too, and review rises. That makes the tool more conservative, not more accurate; zero CLEAR is not evidence of success. Under the live replays it changes no flag, so **the 28 weakened findings remain INDETERMINATE** unless a person assesses the inserted sentences as not relevant. No such assessment exists, and none was simulated on study records.

## 6. Residual limitations

1. **Relevance is not detected.** The repair defers it to a person; it does not judge it. No human assessment exists for any study record, so the support path through assessments is tested on synthetic records only.
2. **Assessments are matched to the exact sentence text** as the rules split it. An edited record needs a new assessment.
3. **"The decision rests on X" is still classified as a decision sentence** (8 of 28 pairs). Under 0.3.6 this no longer yields support, but the classification is unchanged.
4. **A sentence that shares the decision's date or identifier still turns a flag into review** (an inferred link). This is unchanged, measured in 0.3.4, and not addressed here.
5. **The variant was sent once.** Variant-level model stability is unmeasured. Only two irrelevant-sentence phrasings exist in the pool.
6. **The name check is a guard, not an identity check.** It cannot prove that a named assessor is a person; the record of who assessed is the owner's responsibility.

## 7. What new live testing could and could not add

The repair is compiler-only, so its effect on existing model outputs is already measured offline; no provider request is needed for that. New live testing would only measure variant stability: the 42 TGT-SB requests sent twice more with the frozen 0.3.5 prompt (84 requests), scored offline under both 0.3.5 and 0.3.6. That needs a new record set entry for repeats 2 and 3, a new plan and hash, a new signed authorization, and USD 0.05 or less (measured USD 0.00046 per request in L2). It is **not prepared as an executable plan here and not dispatched**. Whether 0.3.6 is better for reviewers is a human question that live testing cannot answer.

## 8. Reproduction (offline)

```
P=<private run dir of RUN-LIVE-AUTH-20261028-02>; S=<scratch>
cd research/irrelevant-basis-0.3.6-2026-10-28
node tools/trace-pairs.mjs "$P" "$S/trace"        # out/PAIR_COMPARISON.json   (exit 0)
node tools/test-repair.mjs "$S/repair"            # out/REPAIR_TESTS.json      (exit 0)
node tools/compare-cost.mjs "$P" "$S/cost"        # out/COST_COMPARISON.json   (exit 0)
node tools/run-frozen-suites.mjs "$S/suites"      # out/FROZEN_SUITES.json     (exit 0)
bash tools/run-all.sh "$S" "$P"                   # all of the above, then the package manifest
```
