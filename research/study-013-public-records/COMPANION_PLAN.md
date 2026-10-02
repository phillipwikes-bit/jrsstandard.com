# Study 013 as a companion to the publishing targets

**Prepared 2026-10-02, on the owner's request** to review the study and make it a companion piece for four of the November publishing targets (assessment section 7, D10). **DRAFT. Nothing has been sent, submitted or published.** Before anything goes out it needs the publication review in CLAUDE.md section 23 and the owner's approval.

## 1. Review: what the study already gives these audiences, and what it lacked
| Question | Before this review | Now |
|---|---|---|
| Is it about their work? | Yes for federal EEO investigators: 30 EEOC federal-sector decisions | Unchanged. The link to the other three audiences is stated as an analogy, not a finding (section 3) |
| Does it say anything a practitioner can use **before** the AI results exist? | No. Every output depended on the live run, which is blocked by the missing key | **Yes.** `GAP_DEFICIENCIES.json` codes the EEOC's own remand orders for all 15 GAP cases into 10 deficiency types, mapped to the JRS conditions. It needs no model call |
| Does it measure what a practitioner cares about, whether the reviewer finds **what** was missing? | No. Only the route (ready, review, gap) was scored | **Yes.** PROTOCOL amendment 1 adds a deficiency-match outcome, scored by a human on a blinded worksheet |
| Can it be used for training? | No | **Yes.** `TRAINING_EXERCISE_DRAFT.md`: six cases, a worksheet, and facilitator answers drawn from the EEOC's orders |
| Healthcare angle for HCCA? | None | A health-sector band: VA, VHA, Defense Health Agency and HHS, 8 cases (4 GAP and 4 PASS) |
| Fair-housing angle for NFHTA? | None | **Still none.** Every case is an employment case; S013-18 is a HUD *employment* case. A fair-housing set needs its own source (section 4, item 5) |

## 2. What the deficiency coding shows (*Inference*: my coding of the EEOC's order text; owner verification required)
How often each deficiency type appears among the 15 GAP cases (a case can carry several):

| Code | What the EEOC ordered the agency to fix | Cases | JRS condition |
|---|---|---|---|
| D1 | A decision-maker or responsible official not examined, or not under oath | 9 | RC5, RC4 |
| D4 | Relevant documents not obtained (policies, files, records, reports) | 7 | RC2, RC5 |
| D2 | Identified witnesses not interviewed, or non-responses not pursued | 6 | RC5, RC2 |
| D3 | Comparator evidence missing | 4 | RC5 |
| D7 | Accepted claims or incidents not investigated at all | 4 | RC5, RC1 |
| D5 | Management's stated reason not explained or supported | 3 | RC4, RC1 |
| D6 | Reasonable accommodation and interactive process not developed | 3 | RC4, RC5 |
| D8 | Failed attempts to obtain evidence not documented | 3 | RC4 |
| D9 | Notice and timing of management's knowledge not established | 3 | RC3, RC4 |
| D10 | Evidence left in equipoise; sent to a hearing instead | 1 | RC5 |

The pattern a practitioner can use: in these 15 remands, the commonest failures were missing testimony from the people who made the decision and missing documents. Both can be checked before a report of investigation closes. The EEOC's orders cite "29 C.F.R. § 1614.108(b)" and "EEO MD-110, Chapter 6" as the standard the supplemental investigation must meet (*Observed* in the order text of S013-10, S013-19, S013-21 and S013-24).

**Limits:** 15 cases, chosen by a fixed search rule, not sampled; a feasibility round. These are frequencies in this set, not rates in the population of EEOC decisions.

## 3. Per target
**Standing rules applied to every row:**
- Trade articles are vendor-neutral, so no piece promotes the Engine.
- The training stays free (D8).
- Every contribution goes out on a non-exclusive licence only (section 7, D10).
- Contact happens after the November issue, one target at a time. Nothing is sent without the owner.
- No piece claims accuracy, validation or compliance. Negative results get the same prominence as positive ones.

| # | Target | The companion piece | What the study supplies | Must not do |
|---|---|---|---|---|
| 1 | **Dewey Publications** (via Broida): *EEO Counselors' and Investigators' Manual* | A chapter or supplement, "What the EEOC sends back: building a record that survives appeal". It turns D1 to D10 into a pre-closing checklist for the report of investigation, with the EEOC's own order language as examples | The deficiency coding; the decisions' public URLs; and later the AI-review results as one section ("can an AI reviewer flag these before closing?") | Present the coding as the EEOC's taxonomy (it is ours); name the Engine |
| 2 | **SCCE**: a chapter in *The Complete Compliance and Ethics Manual* | "What an adjudicator treats as an adequate investigation record, and whether AI reviewers can tell". It presents the public-record benchmark method, plus the arm A, B and D comparison: does a published standard help general AI models review investigation files? | The method (pre-registered rule, independent labels, no AI grading); the deficiency types as a cross-sector checklist (*Inference* by analogy); the results once run | Claim federal-sector findings apply to private internal investigations (state it as an analogy); claim alignment with any regulator's guidance without quoting the current text |
| 3 | **HCCA**: *Complete Healthcare Compliance Manual* | **The same single SCCE and HCCA chapter at first** (decisions log: one chapter between the two organizations, not one each), with a healthcare section built on the health-sector band | The 8 health-sector agency cases (4 and 4), descriptive only | Treat 8 cases as a healthcare finding; write a second, separate HCCA piece before the first is placed |
| 5 | **IAOHRA and NFHTA**: free training or a webinar for civil-rights and fair-housing investigators | "Spot the gap": a 60 to 90 minute session in which investigators review stripped records, decide what they would request before closing, and then compare with what the EEOC ordered | `TRAINING_EXERCISE_DRAFT.md`; the cases and orders are public federal records | Present the employment cases as fair-housing material. For NFHTA, a fair-housing case set is needed first (section 4, item 5) |

**Target 4 (AWI Journal)** is not in this request. It stays in the section 7 plan unchanged; the study's method section would suit it if you want it added.

## 4. Before any of this is used
1. **Run the study** (`README.md`). The AI-review sections stay empty until then, and the results are reported whatever they show.
2. **Owner verification of the coding:** read the 15 orders in `GAP_DEFICIENCIES.json` and confirm or correct each code. About 1 hour.
3. **Owner scoring** of the deficiency-match worksheet after the run (amendment 1).
4. **Publication review** (CLAUDE.md section 23):
   - **Rights:** EEOC decisions are federal works, generally not under copyright (17 U.S.C. 105). REQUIRES HUMAN REVIEW.
   - The study text and coding are JRS work.
   - **AI provenance:** the study was designed, coded and run with AI assistance. Publishers ask authors to warrant originality (the CEP form did), so disclose it accurately.
5. **A fair-housing case set for NFHTA.** Fair-housing records need a separate public source, such as HUD administrative decisions. Not identified or tested yet: NOT ESTABLISHED.
