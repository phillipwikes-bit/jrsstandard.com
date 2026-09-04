# Outreach message check: Priyam Dhamankar

**Checked 2026-08-12 against the live site.** Three problems. Two are factual errors in the message, one is about the recipient.

---

## ERROR 1: the scroll instruction points at a button that no longer exists

**The message says:**

> If you prefer to skip the training and go directly to the survey, scroll to the bottom of the page and click "GO STRAIGHT TO THE REVIEWER EVALUATION."

**On the live page right now:**

| Check | Result |
|---|---|
| Occurrences of "GO STRAIGHT TO THE REVIEWER EVALUATION" | **0** |
| Actual CTAs, in page order | "Take the 4-minute reviewer evaluation" (top, 419px), "Take the 4-minute reviewer evaluation" (bottom), "Open Module 1 first" (bottom) |

The button was renamed today, and the evaluation link was moved to the **top** of the page because the only links to it previously sat 89 percent of the way down.

Anyone following the instruction scrolls to the bottom, looks for a button with that text, does not find it, and the nearest thing is **"Open Module 1 first"**, which sends them the opposite way.

**Corrected wording:**

> If you would rather skip the training and go straight to the survey, the button is at the top of the page: **"Take the 4-minute reviewer evaluation."**

---

## ERROR 2: the recommendation is stated as automatic, and it is not

**The message says:**

> After completing the evaluation, you will receive a personalized LinkedIn Peer Reviewer Recommendation acknowledging your contribution.

**What actually happens:** the recommendation is an **opt-in checkbox** at the end of the evaluation, reading *"Request a LinkedIn Peer Reviewer Recommendation for contributing to this research baseline."* Ticking it reveals three fields. It is not issued automatically, and it is not posted at all without the person's explicit approval of the wording.

Saying "you will receive" promises something the system does not do on its own. If she completes the evaluation and does not tick the box, she gets nothing, and the message will have told her otherwise.

**Corrected wording:**

> At the end you can request a personalized LinkedIn Peer Reviewer Recommendation acknowledging your contribution. It is optional, and nothing is posted until you have seen the exact wording and approved it.

---

## ERROR 3, smaller: "At the end, there is a ... evaluation"

The evaluation is **not** at the end of the training. `training.html` contains **zero** links to it. It is reached from the reviewer landing page, not from inside the modules.

**Corrected wording:**

> The training and the evaluation are both on that page. You can do either first.

---

## THE THING TO CHECK BEFORE SENDING: she has already done this

**Priyam Dhamankar is RR-113.** She completed the full 24-record Records Review Study **today at 10:33Z**, verified: `check_completion.py RR-113` returns 24 of 24, exit 0.

Her certificate, message and LinkedIn recommendation were built earlier today and are sitting on disk unsent:

- `research/Records_Review_Study_Certificate_Priyam_Dhamankar.pdf`
- `research/Message_Priyam_Dhamankar_Completion_2026-08-12.md`
- `research/LinkedIn_Recommendation_Priyam_Dhamankar.md`

The message above opens **"It's great to connect"** and describes the project as if introducing it. She was recruited on 2026-07-21, agreed on two conditions, and has just given you an hour of unpaid work across 24 records.

**Sending her a cold recruitment message today would read as not knowing she did it.** Send the completion package instead. If you also want her perspective on the review conditions, that belongs in the completion message as a follow-on question, not as a first-contact pitch.

---

## What in the message IS correct

| Claim | Status |
|---|---|
| `https://jrsstandard.com/reviewer?src=linkedin` resolves | **Correct.** 307 to `/reviewer/index.html?src=linkedin`, src preserved |
| "Module 1 is completely open without signing up" | **Correct.** The page states "No sign-up for the first module" |
| "4-minute, 9-question evaluation" | **Correct.** 9 questions defined in `api/reviewer-eval.js`; the page says 4-minute |
| "Your survey answers are kept completely separate from your contact details" | **Correct, and stronger than stated.** Two different tables with no shared key. Nobody, including you, can match an answer to a person |
| The closing question about the review conditions | **Correct and well aimed.** That is the question the instrument exists to answer |

---

## Clean version, for a NEW recipient

*Not for Priyam. For someone who has not already taken part.*

Hi [name],

It is great to connect. Your work across ethics, compliance, legal and governance stood out, particularly your focus on investigations, decision quality, risk-based compliance and policy implementation.

I put together a free training on decision reconstruction. It teaches five basic review conditions for testing whether a consequential record actually explains why a decision was made, after the fact.

Module 1 is open without signing up, so you can see whether it is worth your time before entering an email:

https://jrsstandard.com/reviewer?src=linkedin

There is also a 4-minute, 9-question evaluation on that page about how consequential records are reviewed in practice. **That research data is what I am really trying to collect.** We know how reviewers apply the framework in controlled study settings. We have much less visibility into what record review looks like inside live organizations.

If you would rather skip the training and go straight to the survey, the button is at the top of the page: **"Take the 4-minute reviewer evaluation."**

Your answers are stored separately from any contact details, in different tables with no shared identifier, so no answer can be traced back to you. At the end you can request a personalized LinkedIn Peer Reviewer Recommendation acknowledging your contribution. It is optional, and nothing is posted until you have seen the wording and approved it.

Given your experience with investigations, compliance, governance and decision quality, I would particularly value your view on whether these review conditions adequately test whether a consequential record stays understandable, traceable and independently reviewable when someone later has to work out what happened and why.

With appreciation,

Phillip Wikes
Former Lead Civil Rights Officer, Maryland Commission on Civil Rights

---

## One standing risk this surfaced

**Outreach messages hardcode button text, and button text changes.** This message was correct when it was written and became wrong the moment the CTA was renamed and moved. Referring to the button by **position** ("at the top of the page") rather than by exact label survives a copy change; naming the label does not.
