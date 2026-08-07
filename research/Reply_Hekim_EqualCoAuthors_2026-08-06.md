# Reply to Hekim Colpan: his revisions applied (2026-08-06)

*He confirmed the terms, restated the equal-co-authorship request, supplied his own biography and disclosure wording, set a condition on the JRS figures, and told you what he will do next. Answer by confirming each item is already in the draft rather than promising it. Send from info@jrsstandard.com with the revised article attached. No long dashes.*

*Note for you, not for him: he wrote his own bio and disclosure, so use them exactly as written and say that you did. Authors notice when their words come back edited. His figures condition is also the sharpest thing in his message and he is right about it, which is why the validation block now carries the design detail rather than bare numbers.*

---

Dear Hekim,

Thank you. Everything you asked for is in the draft attached, so this is mostly confirmation rather than promises.

Equal co-authors, as you asked. The byline reads Hekim Colpan and Phillip Wikes in alphabetical order rather than by seniority, and a line under it says we contributed equally. Nothing in the article, the note to the editor, or either biography calls one of us lead, senior, or primary.

Your biography and your disclosure are in exactly as you wrote them, word for word. The disclosure sits directly under the byline where a reader meets it early rather than buried at the end.

On the figures, you put your finger on the right thing, and I have taken the second half of your condition seriously rather than just the first. Every number now carries the method behind it in the article itself: the corpus is 24 constructed records, twelve with traceable support and twelve without; the answer key was fixed before any reviewer saw a record and then independently reproduced by blind raters, 24 of 24; reviewers are blind to the key and to each other; accuracy is computed per reviewer rather than per read; and the thresholds were registered before the data were examined. The reliability figures now say plainly that they rest on 10 records against a target of about 26, that the intervals are wide, and that they will be re-estimated at target. Anything that still cannot be supported when the study closes comes out. I would rather publish four defensible numbers than six impressive ones.

Where the numbers stand today, all provisional until close on or about 14 August: fifty three international reviewers across three studies have graded records for this work, unpaid and in a personal capacity, and thirty two independent experts among them completed a full 24-record set in 16 countries across 5 continents. Detection is 83.9 percent against the verified key, from 16 reviewers in 11 countries over 384 graded reads, with a 95 percent interval of 72.7 to 95.1, sensitivity 87.0 and specificity 80.7. Cross-vendor agreement is 84 percent, which is consistent application and not accuracy, and the draft labels it that way. Reliability is Gwet's AC1 of 0.739 among expert raters and 0.624 among trained reviewers on 10 records and 99 labels, against a floor of 0.61. You will have the locked set before anything is submitted.

Your plan for the European sections and the checklist is exactly right, and the sequence you describe is the one I would want: your revisions with primary sources first, then both of us over the whole article, then a decision about submission. No deadline from me.

One thing worth flagging now rather than at the end. The draft has grown to roughly 2,800 words, and Corporate Compliance Insights runs contributed pieces closer to 1,200 to 1,800. Once your sections are in and we can see the whole thing, we will need a trim pass. I would rather cut from my half than from the European analysis, and I would like us to make those calls together rather than have me quietly shorten your work.

Section V is marked for you in the attached draft.

With appreciation,

Phillip Wikes
The Right to Know Why | https://jrsstandard.com
info@jrsstandard.com

---

## Every item he asked for, and where it now sits in the draft

| His request | Status in `Evidentiary_Deficit_Article_Hekim_Version.md` |
|---|---|
| Equal co-authors, no emphasis on him as lead or primary | Line under the byline: "Both authors contributed equally to this article. Names appear in alphabetical order." No lead, senior, or primary framing anywhere in the piece or either biography. |
| He owns the European sections | Section V is his. Not edited without returning it to him. |
| His biography, his wording | Used verbatim, in the About the Authors block. |
| His disclosure, his wording | Used verbatim, placed directly under the byline. |
| Provisional figures updated at close, or removed if not supportable with enough methodological detail | Every figure now carries its design detail in the article. Corpus balance, key verification, blinding, unit of analysis, and pre-registered thresholds are stated. Reliability is explicitly marked interim on 10 records against a target of about 26. |
| Publication route, joint approval, copyright and future use | Unchanged from the 2026-08-05 letter. |

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

## Open item for the trim pass

The article now runs about 2,800 words against a target range of 1,200 to 1,800 for the primary venue. Do not cut before his sections land, because the shape of the piece will change once the European analysis is expanded. The offer in the letter to cut from your half first is the right opening position and it is also true.
