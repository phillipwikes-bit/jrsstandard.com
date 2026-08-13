# UPWORK PROPOSAL TEMPLATES

**Three proposal scripts, one per offer. Written 2026-08-13.**

## Rules these were written under

**Every prohibited term is absent.** The list is not repeated here: it lives in `CLAIMS_REGISTER.md` claim C-09, which is the one place it is maintained. Repeating it in this file would put the banned strings inside the very document a compliance grep scans, and would be a second copy of a list that must not drift.

**Every figure below is live and belongs to a stated population.** 36 completers across 16 countries and 5 continents; the detection panel is **16 experts across 11 countries**, which is a different figure and must not be swapped for the 16-country one. Full rules in `CLAIMS_REGISTER.md`.

**Do not paste these verbatim.** Retype them so they read as yours, and cut anything that does not apply to the posting in front of you. A proposal that answers a different posting is worse than a short one.

**The opening line does the work.** Name the problem in the client's words before mentioning JRS at all. If they cannot recognize their own problem in the first two sentences, nothing after it matters.

---

## Offer 1: AI Documentation Defensibility Review
**$250 to $500. Five de-identified records. Five working days.**
**Page:** `audit-request.html`

> Your posting mentions `[their words: investigation reports / case files / decision memos]`. The question I work on is narrower than quality: **can that record still explain why the decision was reached, months later, to someone who was not there?**
>
> That is a different question from whether the decision was right, and AI-assisted drafting has made it harder to answer, because a generated draft reads as finished long before it is defensible.
>
> There are seven documented ways this shows up in writing. Two of them: **fluent groundlessness**, where the record reaches a confident conclusion no identifiable evidence supports, and **basis substitution**, where a paraphrase stands in for the source so the reader cannot verify it. Both read perfectly well. Both fail on challenge.
>
> **What I would do:** read five of your closed, de-identified records against those seven modes and five review conditions, and return a written finding that names what is missing, in which record, and the sentence that shows it. Five working days.
>
> **What you get:** a defensibility assessment per record, every mode found with its evidence, findings against each condition, and a short list of documentation controls ordered by which changes most.
>
> Your files are read in working memory and deleted when the report is delivered. They are never stored, never added to a research set, never used for training.
>
> The method is public and ungated if you would rather check your own files first: jrsstandard.com/check.html
>
> Phillip Wikes, JRS

**Adapt:** lead with their record type in their words. Cut the two named modes if the posting already names the problem.

---

## Offer 2: AI Governance Documentation Review
**$500 to $1,000. A standard or template set plus up to five records produced under it. Ten working days.**
**Page:** `governance-request.html`

> You are asking about `[their words: AI governance / documentation standards / ISO 42001 readiness]`. The gap I would look for is the one between the policy and what it actually produces.
>
> **A documentation standard can be complete on paper and still permit records nobody can reconstruct.** That gap does not show up in a policy review, because the policy is fine. It shows up in the files.
>
> **What I would do:** read the standard or template set against five review conditions, then read up to five records produced under it against the same conditions, and report where the two diverge. Ten working days.
>
> **What you get:** the specific clauses where your standard permits an unreconstructable record, and recommended control changes written so they drop into your existing policy rather than replacing it.
>
> Relevant background: this method has been graded by 36 reviewers across 16 countries who each completed a full 24-record set, with published inter-rater reliability. I also run a nightly cross-vendor harness that puts the same records to independent AI models and escalates only where two or more agree, which produces a dated agreement series rather than a policy document.
>
> Two things I will not claim. **JRS does not establish compliance with the EU AI Act, NIST AI RMF or ISO/IEC 42001**, and no framework requires it. It supports auditability and traceability that those frameworks ask you to evidence. It is also under operational validation, so I will show you what has been measured and what has not.
>
> Records are read in working memory and deleted on delivery. Never stored, never added to a research set, never used for training.
>
> Phillip Wikes, JRS

**Adapt:** if the posting names a framework, mirror that framework and keep the two-things-I-will-not-claim paragraph. It is the most credible thing in the message.

---

## Offer 3: Benchmark Calibration
**$750 to $1,500. Held-out record set, scoring returned by the holder.**
**Page:** `calibration-request.html`

> One question for anyone building a tool that flags weak documentation: **what did you test the claim against?**
>
> Building an independent benchmark means recruiting credentialed raters across jurisdictions and fixing a key before anyone scores anything. That is months of work and the part that cannot be shortcut.
>
> **What exists:** a 24-record detection set with a held-out answer key, independently verified 24 of 24 by raters blind to it, graded by **16 independent experts across 11 countries over 384 graded reads**, with measured inter-rater reliability (Gwet's AC1 0.739 among experts, 0.624 among trained reviewers).
>
> **What I would do:** license the set for one run. Your tool or your team scores it; scoring is returned by me and **the answer key never leaves my hands**, which is the only way the benchmark stays worth anything to the next person who uses it. You receive a calibration report against the human rater distribution, and a written statement of what your result does and does not support.
>
> One honest limit: this measures agreement with a credentialed human panel on constructed records. **It is not evidence of real-world outcomes**, and I will write that into the report rather than let a number travel further than it should.
>
> Phillip Wikes, JRS

**Adapt:** if they have published an accuracy figure, ask what it was measured against. That is the whole conversation.

---

## Applies to all three

**Do not offer a discount to win the first one.** The price is the experiment. A job won at half price tells you nothing about demand.

**Record every send and every reply, including silence**, in `IP_COMMERCIALIZATION_TRACKER.md` section 3c. Three considered proposals with no reply is a demand signal. Three sends with no record of them is nothing.

**If a posting asks for the answer key, the scoring internals, or a guarantee of effectiveness, do not bid.** `scripts/scout_opportunities.py` flags these automatically as DO NOT BID.
