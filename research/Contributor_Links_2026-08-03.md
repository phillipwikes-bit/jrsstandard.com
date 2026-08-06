# Contributor confirmation links (private, do not publish this file)

One unguessable link per person. Each link opens a page that captures how the person wants their name and title printed, their contact address, and three forced-choice permissions, then releases the initiatives, the Investigator Field Guide, the training, the free private diagnostic, and the results summary.

Base: `https://www.jrsstandard.com/contributor.html?k=`

**Fallback date shown on every page: Friday, 14 August 2026.** If a person does not respond by then, the paper uses what is on file. Where there is no naming election on file, the fallback is anonymous: a name is never printed on silence alone.

---

## International detection panel (completion verified via `check_completion.py`, all at 24 or more reads; Maroudis V-AI-29 added 2026-08-04 on completing)

| Person | Code | Link |
|---|---|---|
| Jake McDonough | V-AI-01 | https://www.jrsstandard.com/contributor.html?k=upbtroc754 |
| Frank Schouten | V-AI-03 | https://www.jrsstandard.com/contributor.html?k=08c17ihb60 |
| Dr Nitin Deshpande | V-AI-06 | https://www.jrsstandard.com/contributor.html?k=im06wa5vd4 |
| Saurabh Nanda | V-AI-07 | https://www.jrsstandard.com/contributor.html?k=u63k28aizs |
| Gabriela Cortez | V-AI-08 | https://www.jrsstandard.com/contributor.html?k=agbhlh6n4d |
| Lawal Olabanji | V-AI-10 | https://www.jrsstandard.com/contributor.html?k=s3ln3ud13s |
| Andrey Ekhmenin | V-AI-11 | https://www.jrsstandard.com/contributor.html?k=h5dypgmtdu |
| Kyle McMullan | V-AI-12 | https://www.jrsstandard.com/contributor.html?k=xoam4zq6yh |
| Dr Gabriela Bar | V-AI-16 | https://www.jrsstandard.com/contributor.html?k=hpyvpad2sk |
| Hekim Colpan | V-AI-20 | https://www.jrsstandard.com/contributor.html?k=2s7eencte4 |
| Niloofar Kandi | V-AI-23 | https://www.jrsstandard.com/contributor.html?k=h7a376209q |
| SungSoo In | V-AI-24 | https://www.jrsstandard.com/contributor.html?k=vxieh79z7v |
| Sidharth Borah | V-AI-27 | https://www.jrsstandard.com/contributor.html?k=jusnt4chyx |
| Nigel Hee | V-AI-28 | https://www.jrsstandard.com/contributor.html?k=si81km0m1r |
| Andres Lage Freire | V-AI-30 | https://www.jrsstandard.com/contributor.html?k=42zgubzfq8 |
| Marguerite Maroudis, PhD | V-AI-29 | https://www.jrsstandard.com/contributor.html?k=s3ud3trom6 |

## Authors and pilot facilitators

| Person | Code | Role | Link |
|---|---|---|---|
| Ubayet Hossain, FRM | M-01 | Methodology co-author | https://www.jrsstandard.com/contributor.html?k=6dyc0l2757 |
| Stacy Young | E-08 | Co-author and facilitator, public records pilot | https://www.jrsstandard.com/contributor.html?k=1wlgcn02gn |
| Tanvi Pokhriyal | V-HR-01 | Facilitator, HR and employment pilot | https://www.jrsstandard.com/contributor.html?k=zobi7fgt8q |
| Keith Carrington, EJD, MBA | V-HC-01 | Facilitator, healthcare compliance pilot | https://www.jrsstandard.com/contributor.html?k=qtgiiqlcqk |

Kyle McMullan appears once, in the panel table. His link is already flagged as panel reviewer and co-author, so do not send him a second one.

---

## Two things that need your decision

**1. Which two completers elected anonymity.** You said all but two agreed to be in the paper, and that the two were regular reviewers who did not receive a certificate. Which two is not recorded anywhere in the repository, so I did not guess. Until you tell me, the roster treats every listed person's fallback as their on-file election, except Niloofar Kandi, who has no title and no naming election on file and therefore falls back to anonymous.

To set it: open `api/contributor.js` and put the codes in the empty list near the top.

```js
const ANON_CODES = ['V-AI-xx', 'V-AI-yy'];
```

Their page then shows the anonymity election back to them and offers them the chance to change it, and the fallback stays anonymous. Everything else on their link works the same.

**2. The results summary is gated, and I recommend leaving it gated for now.** The page serves the summary from the server, never from the page source, and only when `RESULTS_RELEASED` is set to true in `api/contributor.js`. It is currently false because the comparison arm is still open: RR-108 is at 9 of 24 and RR-132 finished yesterday. Your own release plan sets a single release date after recruitment closes and the analysis locks, precisely so that nobody sees findings while others are still reviewing, and a link that can be forwarded is exactly the leak path that rule exists to close.

Until then, a contributor who confirms sees an honest pending notice, the reason for the delay, and the figures that are already public on the site: the 24-record design, 10 countries on 5 continents, the fixed and independently verified key, and the 84 percent cross-vendor consistency figure with the consistency-not-accuracy caveat attached.

When data collection closes, set `RESULTS_RELEASED = true` and the full summary appears for everyone who has confirmed, and for everyone who confirms afterwards. The released text is already written into the file and matches the wording you approved in `Reviewer_Results_Release_Plan.md`, including the plain statement that the study did not establish improvement over unaided judgment.

---

## What the page asks and what it releases

**Captured:** name as printed, title as printed, organization, best email, optional profile link.

**Three forced choices, none of which can be skipped and none of which default to yes:**

1. May your name and title be printed in the paper as a named contributor?
2. May the review work you contributed, and your credited name and title, continue to be used in publications and materials about this study?
3. If this work transfers to a successor organization, may that permission and your contact details transfer with it?

Question 2 and question 3 together are what a buyer's counsel asks for, recorded per person with a timestamp. Note the honest limit: this is a recorded permission, not an executed assignment. For the co-authors specifically, a short countersigned agreement is still the right instrument, and this makes that conversation easier rather than replacing it.

**Released after confirmation:** both initiative sign-ups, all three Investigator Field Guide editions, the training, the free private diagnostic on their own records, and the results summary block.

**Comparison-arm reviewers (RR-###) are deliberately not in this roster.** That arm is blind. A JRS-branded page naming the standard would break the blind for anyone still reviewing. Their debrief is the separate message already drafted in `Reviewer_Results_Release_Plan.md`, section 7.

---

## Where it shows up

`pilot-status.html` has a new Contributor Confirmations panel: confirmed against roster, outstanding, confirmed today, how many elected to be named, how many granted continuing use and transfer, initiative sign-ups taken from these links, and the list of codes that have responded so you know who still needs a nudge before 14 August.
