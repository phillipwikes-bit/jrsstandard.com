# Reply to Amanda Harvey + validation appendix (2026-08-02)

**Her question:** "What is the demonstrated rate at which JRS-identified deficiencies result in successful process redesign?"

**The honest answer: that rate is not established, because it has not been measured.** Her question is about organizational adoption and downstream effectiveness, which sits above everything the validation program has reached. Answering it directly, and then showing exactly what has been measured, is far stronger than deflecting. Anyone who checks the claims below will find them accurate, which is the entire point of the initiative.

Every figure in the reply is verified against the study database on 2026-08-02 and sourced in the appendix.

---

## PART 1: The reply (postable as-is)

Amanda, that is the right question and I am going to give you a direct answer: **that rate is not established. I have not measured it.**

What you are asking about is downstream organizational effectiveness, whether a flagged deficiency actually produces a redesigned process that works better. That sits at the top of the evidence ladder, and I am not there. Claiming a number would be exactly the behavior this initiative exists to argue against.

Here is what has been measured, in order.

**Rung 1, reproducibility.** Three AI systems from three different vendors applied the review to the same 15 constructed records and agreed 84 percent of the time. That is consistency of application, not correctness.

**Rung 2a, reliability.** Independent reviewers applying the five conditions to a shared record set reached chance-corrected agreement of 0.74 among experts and 0.63 among trained reviewers, clearing the threshold set in advance. Interim, on 10 of roughly 26 planned records.

**Rung 2b, detection.** This is the strongest result. An international panel of 15 experienced professionals, across 10 countries on 5 continents, judged 24 constructed records against an answer key that was fixed and independently verified before any scoring. Accuracy was 82.8 percent, 95 percent CI 71.0 to 94.6 at the reviewer level, sensitivity 86.1, specificity 79.4. It clears the pre-registered threshold. The property is detectable.

**The comparison I could not finish.** A randomized arm tested whether the standard beats unaided judgment. The standard condition scored 73.3 percent against 62.0 percent unaided, but the confidence interval includes zero. I report it as a null. It was underpowered: a conclusive test needs roughly 110 participants per arm and I had 5 and 8.

**Rung 3, real cases.** Two pilots against documented outcomes. In HR employment records (n=22), records the review flagged had an adverse documented outcome 78 percent of the time versus 15 percent for records it passed (Fisher exact, one-tailed, p = 0.006). Preliminary, and the significance is sensitive to how outcomes are coded: under a broader coding the same direction holds at p = 0.10. A public-records pilot (n=7) has no outcome spread yet and is illustrative only.

So: detectable, applied consistently, and preliminary signal that flagged records fare worse in real cases. Whether flagging drives successful redesign is unmeasured, and it is the study I would want next.

---

## PART 2: Validation appendix (every figure and its source)

Use this to answer any follow-up. All figures verified 2026-08-02 against the study database.

| Claim in the reply | Exact figure | Source |
|---|---|---|
| Cross-vendor reproducibility | 84% mean pairwise agreement, 15 constructed records, 3 vendors (Anthropic, OpenAI, Google) | Automated nightly run, latest 2026-07-06; band 78 to 87% as the set grew from 3 to 15 records |
| Reliability, experts | Gwet's AC1 = 0.74, raw agreement 88% | 10-record shared set; pre-registered floor 0.61; `compute_ac1_ci.py` |
| Reliability, trained reviewers | Gwet's AC1 = 0.63, raw agreement 83% | Same set; both interim against a pooled target of ~26 records |
| Panel size | 15 reviewers completed all 24 records | `pilot_progress`, V-AI codes, 2026-08-02 |
| Panel reach | 10 countries, 5 continents | Completed Arm A roster: US, UK/Ireland, Germany, Poland, Spain, India, Singapore, South Korea, Nigeria, Australia |
| Detection accuracy | 82.8%, 360 graded reads | Scored against verified key R01-R24; participant-level mean |
| Detection CI | 95% CI 71.0 to 94.6 | Participant level (n=15), the conservative unit |
| Sensitivity / specificity | 86.1% / 79.4% | Same analysis |
| Pre-registered detection threshold | Point estimate ≥70% and lower bound >50%: both met | `JRS_PreRegistered_Analysis_Plan.md` |
| Randomized comparison | 73.3% (n=5) vs 62.0% (n=8), difference +11.4 pp | Participant-level, ≥18-read inclusion rule |
| Comparison CI | Bootstrap 95% CI −16.4 to +39.1, includes zero | 20,000 participant-level resamples |
| Power requirement | ~110 per arm at 80% power (d = 0.379) | Two-sample power calculation on the observed effect |
| HR pilot, flagged | 7 of 9 flagged records had an adverse outcome = 78% | `bench_outcomes`, contributor V-HR-01, n=22 |
| HR pilot, passed | 2 of 13 passed records had an adverse outcome = 15% | Same |
| HR pilot significance | Fisher exact one-tailed p = 0.0059 | Strict coding: adverse = failed appeal or failed audit |
| HR pilot sensitivity to coding | Broad coding ("held up" vs not): 46% vs 11%, p = 0.10 | Same data, different outcome definition; reported for transparency |
| Public-records pilot | n = 7, no records held up, 0 Gap reads | `bench_outcomes`, contributor E-08; no outcome spread, illustrative only |

### Anticipated follow-ups and the honest answers

**"Why report the HR pilot if significance depends on the coding?"**
Because both codings are reported, and the direction is the same in each. The stricter coding reaches p = 0.006 and the broader reaches p = 0.10. Presenting only the first would be selective; presenting neither would withhold a real signal. The pre-registered coding is the one reported as primary and the other as a sensitivity check.

**"Isn't the HR pilot answering my redesign question?"**
No, and it should not be read that way. It tests whether records the review flagged went on to fare worse in documented outcomes. It says nothing about whether flagging led anyone to change a process. Those are different studies.

**"Why is the randomized arm a null if the standard scored higher?"**
Because 11.4 points across 5 and 8 participants cannot be distinguished from chance. At that sample the smallest detectable difference was roughly 42 to 53 points. The design could not have found an effect this size, so the null is uninformative rather than negative.

**"How do I know the answer key was not fitted to the standard?"**
The intended classification of each record was documented before verification, and the key was then independently reproduced by blind raters who did not see the study hypotheses, 24 of 24. The verification packet is retained.

**"Is the panel just people who already agree with you?"**
The panel is recruited, not randomly sampled, and self-selects for interest in the topic. That is stated as a limitation. Reviewer accuracy ranged from 100 percent down to below chance, including two panel members scoring below chance, which is reported rather than trimmed.

### Boundaries to hold in any follow-up

- Do not describe the standard as proven to improve outcomes. It is not.
- Do not compare the expert panel to the randomized arms. That comparison confounds expertise with method and is uninterpretable.
- Do not upgrade the HR pilot from preliminary. Two pilots, one of which has no outcome spread.
- Do not describe the podcast appearance as an endorsement. It is a discussion.
- Keep 84 percent labeled as consistency, never accuracy.
