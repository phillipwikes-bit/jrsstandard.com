# Reply to Hekim Colpan: his revisions applied and the draft trimmed (2026-08-06)

*He confirmed the terms, restated the equal-co-authorship request, supplied his own biography and disclosure wording, set a condition on the JRS figures, and said what he will do next. Answer by confirming each item is already in the attached draft, and tell him the trim is done and where it came from. Send from info@jrsstandard.com with the article attached. No long dashes.*

*Note for you, not for him: he wrote his own bio and disclosure, so they go in exactly as written and the letter says so. The length problem is solved before he starts work rather than raised as a future task, which means his sections land in a piece that already fits the venue instead of one he has to defend space in.*

---

Dear Hekim,

Thank you. Everything you asked for is in the draft attached, so this is confirmation rather than promises.

Equal co-authors, as you asked. The byline reads Hekim Colpan and Phillip Wikes in alphabetical order rather than by seniority, with a line under it saying we contributed equally. Nothing in the article, the note to the editor, or either biography calls one of us lead, senior, or primary.

Your biography and your disclosure are in exactly as you wrote them, word for word. The disclosure sits directly under the byline, where a reader meets it early rather than at the end. Your biography appears once, in About the Authors at the foot of the piece. There was a short author line under the byline as well and I have taken it out, because it repeated the same material in wording you did not write.

On the figures, you put your finger on the right thing, and I took the second half of your condition as seriously as the first. Every number now carries its method in the article itself: the corpus is 24 constructed records, twelve with traceable support and twelve without; the answer key was fixed before any reviewer saw a record and then independently reproduced by blind raters, 24 of 24; reviewers are blind to the key and to each other; accuracy is computed per reviewer rather than per read; and the thresholds were registered before the data were examined. The reliability figures now say plainly that they rest on 10 records against a target of about 26, that the intervals are wide, and that they will be re-estimated at target. Anything that still cannot be supported at close comes out. I would rather publish four defensible numbers than six impressive ones.

Where the numbers stand today, all provisional until close on or about 14 August. Fifty three international reviewers across three studies have graded records for this work, unpaid and in a personal capacity, and thirty two independent experts among them completed a full 24-record set in 16 countries across 5 continents. Detection is 83.9 percent against the verified key, from 16 reviewers in 11 countries over 384 graded reads, with a 95 percent interval of 72.7 to 95.1, sensitivity 87.0 and specificity 80.7. Cross-vendor agreement is 84 percent, which is consistent application and not accuracy, and the draft labels it that way. Reliability is Gwet's AC1 of 0.739 among expert raters and 0.624 among trained reviewers on 10 records and 99 labels, against a floor of 0.61. You will have the locked set before anything is submitted.

One more thing I have done rather than left for later. The draft had grown past what Corporate Compliance Insights runs, so I cut it back before sending it to you, and every word of that cut came out of my own material. The Introduction, the Conclusion and the About JRS block are shorter. Section V, the practitioner checklist, your biography and your disclosure are untouched. The article body now runs about 1,750 words, which is inside their range, and the About JRS block and the biographies sit outside it as an author note. That leaves you room to expand the European analysis without either of us having to argue about space.

Your plan is the right one, and the sequence you describe is the one I would want: your revisions with primary sources first, then both of us over the whole article, then a decision about submission. No deadline from me.

Section V is marked for you in the attached draft.

With appreciation,

Phillip Wikes
The Right to Know Why | https://jrsstandard.com
info@jrsstandard.com

---

## Every item he asked for, and where it sits in the draft

| His request | Status in `Evidentiary_Deficit_Article_Hekim_Version.md` |
|---|---|
| Equal co-authors, no emphasis on him as lead or primary | Line under the byline: "Both authors contributed equally to this article. Names appear in alphabetical order." No lead, senior, or primary framing anywhere. |
| He owns the European sections | Section V is his and was not touched by the trim. |
| His biography, his wording | Verbatim, in About the Authors. |
| His disclosure, his wording | Verbatim, directly under the byline. |
| Figures updated at close, or removed if not supportable with methodological detail | Every figure carries its design detail: corpus balance, key verification, blinding, unit of analysis, pre-registered thresholds. Reliability explicitly marked interim on 10 records against a target of about 26. |
| Publication route, joint approval, copyright and future use | Unchanged from the 2026-08-05 letter. |

## The trim, section by section

All of it came from Phillip's material. Section V, the checklist, Hekim's biography and his disclosure were not touched.

| Section | Before | After | Change |
|---|---|---|---|
| Title block | 123 | 73 | -50 |
| I. Introduction | 428 | 305 | -123 |
| IX. Conclusion | 256 | 179 | -77 |
| About JRS | 576 | 430 | -146 |
| Acknowledgment | 100 | 39 | -61 |
| **Article body, title block through Conclusion** | 2,181 | **1,746** | **-435** |
| Back matter (About JRS, Acknowledgment, biographies) | 808 | 599 | -209 |
| Total file | 2,804 | 2,345 | -459 |

The body is now inside Corporate Compliance Insights' 1,200 to 1,800 range. Nothing was dropped from the argument: the Introduction lost a restated paragraph and a summary sentence, the Conclusion lost a second statement of the Right to Know Why, and About JRS lost its lead-in prose while keeping every piece of methodological detail Hekim asked for.

Two further removals: the standfirst biography line under the byline, which duplicated the About the Authors block at the foot of the piece and still carried the old Hekim wording rather than the biography he supplied; and the closing sentence under the Acknowledgment about reviewers reading records they were never paid to read. The disclosure stays under the byline. Hekim's supplied biography stays in About the Authors, where it is the only place his biography now appears.

## Removed

The V-AI-08 credit added earlier today is out. That reviewer did not contribute to this article. (SUPERSEDED 2026-08-16: withdrawn as a contributor from the detection paper as well, on the owner's instruction.)

## Figures in the letter and the article, and where each comes from

| Figure | Source |
|---|---|
| 53 international reviewers across three studies | `research/count_participants.py`, graded-records basis |
| 32 independent experts completed a full 24-record set | `pilot_progress` and `armb_progress`, 16 per arm |
| 16 countries, 5 continents (all completers) | `research/Expert_Roster_All_Studies_2026-08-06.md` |
| 83.9 percent, CI 72.7 to 95.1, sensitivity 87.0, specificity 80.7, 384 reads, 16 reviewers, 11 countries | Detection paper, Section 5 |
| AC1 0.739 expert, 0.624 trained, 10 records, 99 labels, floor 0.61 | `compute_ac1_ci.py`; extract at `reliability_labels_2026-08-04.tsv` |
| 84 percent cross-vendor, three vendors, 15 records | Reproducibility analysis, nightly run |

The 11-country figure belongs to the 16-person detection panel. The 16-country figure belongs to all 32 completers. Both are correct in their own scope and neither should be swapped for the other.
