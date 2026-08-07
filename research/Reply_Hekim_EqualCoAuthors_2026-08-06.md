# Reply to Hekim Colpan: equal co-authorship, with current study figures (2026-08-06)

*He accepted every term and asked for one change: equal co-authors, article presented on its substance rather than on either of you. Give him a plain yes, say what actually changes, and hand him the current numbers so he is drafting from live figures instead of the ones sitting in the manuscript. Send from info@jrsstandard.com. No long dashes.*

*Note for you, not for him: your 08-05 letter put his name first because he carries the European analysis. That reason is the thing he is declining, not the position. Keeping the byline where it is and calling it alphabetical order settles both at once, and the letter says so outright so he is not left wondering whether he got quietly demoted for asking.*

---

Dear Hekim,

Yes to all of it, and thank you for saying it plainly.

Equal co-authors it is. The byline stays Hekim Colpan and Phillip Wikes, but the reason is alphabetical order, not seniority, and I will say so anywhere it comes up. The article will carry a line stating that we contributed equally. Nothing in the piece, in the note to the editor, or in either biography will call one of us lead, senior, or primary.

The European sections are still yours. The EU AI Act, GDPR, DORA and ISO/IEC 42001 analysis is your work, and I will not touch it without sending it back to you first. That is how we split the labour, and the article will not read as though it is a ranking.

I am also going back through the draft for anywhere it leans on either of our credentials to carry a point. Where it does, I am replacing it with the source. If a claim needs one of us to vouch for it rather than a clause or a case, we probably should not be making it.

Everything else from my last message stands: independent publication rather than my site, mutual approval before anything moves, joint copyright with no exclusive assignment without your written agreement, your right to reuse your own contribution, prior approval for commercial or promotional use of any kind including anything JRS, binding on whoever holds those materials in future, primary sources throughout the European analysis, and your personal-capacity line in your own words.

Here is where the study actually stands, so you are drafting from current numbers rather than the ones sitting in the manuscript.

Fifty three international reviewers across three studies have now graded records for this work, all unpaid and in a personal capacity. Thirty two independent experts among them completed a full 24-record set, in 16 countries across 5 continents.

The detection result is 83.9 percent accuracy against a verified answer key, from a panel of 16 reviewers in 11 countries over 384 graded reads. The confidence interval runs 72.7 to 95.1, sensitivity 87.0, specificity 80.7. It clears the threshold that was fixed before anyone saw the data.

Reliability came out at Gwet's AC1 of 0.739 among the expert raters and 0.624 among trained reviewers, both above the floor of 0.61 we set in advance, on 10 records and 99 labels. Three models from three separate vendors agreed at 84 percent on the same records, which is consistent application rather than accuracy, and the draft already labels it that way.

All of it is provisional until the study closes, which I still expect around 14 August, and you will have the final figures before anything is submitted.

The revised draft is attached. I have already folded these numbers in, added the equal-contribution line under the byline, and gone back through for anywhere the piece leaned on a credential instead of a source. Section V is marked for you.

With appreciation,

Phillip Wikes
The Right to Know Why | https://jrsstandard.com
info@jrsstandard.com

---

## What was applied to the draft, all done

The revised article is `research/Evidentiary_Deficit_Article_Hekim_Version.md` and the matching `.docx`. Attach the docx to the message.

1. Equal-contribution line added under the byline: "Both authors contributed equally to this article. Names appear in alphabetical order."
2. No lead, senior, or primary framing anywhere in the piece or in either biography. Byline unchanged.
3. The validation paragraph in About JRS was rebuilt from scratch. It previously read "Independent reviewers across 10 countries on 5 continents have completed structured reviews", which predates both the detection panel and the comparison study and had no detection result in it at all.
4. Current figures folded in and marked provisional until mid-August: 53 international reviewers across three studies, 32 independent experts completing a full 24-record set in 16 countries across 5 continents, detection at 83.9% with its interval and its sensitivity and specificity, cross-vendor reproducibility at 84% labelled as consistent application, and interim reliability at AC1 0.739 and 0.624 against the 0.61 floor on 10 records and 99 labels.
5. The year range 2012 to 2025 removed from the author biography.
6. Acknowledgment now credits the reviewers alongside the methodology author.
7. Three machine cadences rewritten: "Different legal vocabulary, same underlying requirement", "The organizations that come through the next decade in good shape will be the ones that", and "Pull these currents together and they point at a single governance idea that outlasts any one jurisdiction."

Article now runs 2,549 words. Zero em-dashes, zero banned vocabulary.

## Figures used in this letter, and where each one comes from

| Figure | Source |
|---|---|
| 53 international reviewers, three studies | `research/count_participants.py`, graded-records basis |
| 32 completed a full 24-record set | `pilot_progress` and `armb_progress`, 16 per arm |
| 16 countries, 5 continents | `research/Expert_Roster_All_Studies_2026-08-06.md` |
| 83.9 percent, CI 72.7 to 95.1, sensitivity 87.0, specificity 80.7, 384 reads, 16 reviewers, 11 countries | Detection paper, Section 5 |
| AC1 0.739 expert, 0.624 trained, 10 records, 99 labels, floor 0.61 | `compute_ac1_ci.py`; extract at `reliability_labels_2026-08-04.tsv` |
| 84 percent cross-vendor, three vendors | Reproducibility analysis, nightly run |

The 11-country figure belongs to the 16-person detection panel. The 16-country figure belongs to all 32 completers. Both are correct in their own scope and neither should be swapped for the other.

On "32": that is the number who completed a full 24-record set across the programme's two review studies, sixteen in each. All 32 are credentialed experts. It is the right figure for the practitioner article, which describes the programme. It is not the right figure for the detection paper's Results, which report the sixteen-person panel and their 384 reads, and where pooling two studies into one reported number is the error a referee would find first. The detection paper now carries the 32 in its Acknowledgments, labelled as programme context.
