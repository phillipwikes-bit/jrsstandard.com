# The Reviewer Evaluation: what it is, what it captures, what it has returned

**Page:** `jrsstandard.com/reviewer/evaluation.html`
**Endpoint:** `api/reviewer-eval.js`
**Prepared:** 2026-08-11, read from the live instrument and the live database rather than from notes

---

## In one paragraph

The evaluation is a nine-question anonymous instrument that asks working professionals how consequential records are reviewed where they actually work. It takes about four minutes, asks nothing identifying, and can be completed by anyone who reaches the page. At the end it offers two things in return, a certificate and a LinkedIn peer reviewer recommendation, and only those two optional ticks produce a name and an email address. Answers and identities are written to different tables with no shared key, so a response cannot be traced to a person even by the person running the study. It is live, instrumented end to end, and **has been opened zero times**, because it has not been sent to anyone.

---

## 1. What it asks

Three profile fields, each with an explicit "Prefer not to say" and none required:

| Field | Options |
|---|---|
| Role | Compliance, HR or employee relations, Legal, Audit, AI governance, and 4 more |
| Sector | 11 options, from government and healthcare to financial services and higher education |
| Organization size | Under 50, 50 to 249, 250 to 999, 1,000 to 9,999, 10,000 or more |

Then the nine questions. Each is single-choice, each carries a "Not sure" so nobody has to guess, and none is required.

| # | Question | Answer set |
|---|---|---|
| 1 | Before a consequential record is finalized where you work, how many people read it? | One (author only) / Two / Three or more / It varies / Not sure |
| 2 | Is there a formal second reader before finalization? | Always / High-risk only / Rarely / Never / Not sure |
| 3 | How often is a record returned to its drafter because the basis for a conclusion is missing or unclear? | Often / Sometimes / Rarely / Never / Not sure |
| 4 | When a conclusion is reached, is the basis for it recorded in the file at the time? | Always / Usually / Sometimes / Rarely recorded / Not sure |
| 5 | Is AI-assisted drafting used on records where you work? | Routinely / Occasionally / No / Not permitted / Not sure |
| 6 | Is there a written policy covering AI-assisted drafting of records? | In force / In draft / No policy / Not sure |
| 7 | If a record from two years ago were questioned today, how confident are you that the file alone would explain why the decision was made? | Confident / Somewhat / Not confident / Not sure |
| 8 | Has record documentation quality been audited or sampled where you work? | Within the last year / More than a year ago / No / Not sure |
| 9 | How useful would a pre-finalization review of the five conditions be in your workflow? | 1 (not usable) to 5 (highly usable) |

**The shape of the instrument is deliberate.** Questions 1 through 4 establish whether a second pair of eyes exists at all and whether the basis for a conclusion survives into the file. Questions 5 and 6 measure the gap between AI drafting in practice and AI drafting under written policy, which is the gap the standard exists to address. Question 7 is the reconstructability question stated in plain language, with no method vocabulary attached. Question 8 asks whether anyone has ever checked. Question 9 is the only question that asks about the standard itself, and it is asked last, after the reader has already thought about their own files.

---

## 2. What it captures, and what it deliberately does not

Three rows, in two tables, with no key that joins them.

**Row 1: the research answer.** Written to `interaction_events` as `source = 'reviewer-eval'`.

Carries: the nine answers, how many were answered, sector, organization size, role, country, modules completed, and the `src` attribution tag.
Carries no name, no email, no LinkedIn, no completion code.

**Row 2: the certificate contact.** Written to `pilot_contacts` as `source = 'reviewer-cert'`, only when the reader ticks the certificate box.

Carries: name, email, organization, printed title, completion code, country, consent flags.
Carries no answers.

**Row 3: the recommendation contact.** Written to `pilot_contacts` as `source = 'reviewer-eval-incentive'`, only when the reader ticks the recommendation box.

Carries: name, work email, LinkedIn URL, country, consent flags.
Carries no answers, no completion code, no evaluation id.

**Isolation is enforced by what row 3 does not contain.** There is no identifier written to both sides. The rows can be aligned only by a coarse timestamp, and a timestamp shared by every submission in the same minute is not an identifier. This was verified on 2026-08-11 by extracting each write payload from the endpoint by brace matching, not by reading comments.

A separate row, `source = 'eval-view'`, logs a page open with country, device and `src`, and no other content. It exists so the funnel has a denominator.

---

## 3. What the reader gets

**Certificate.** Ticking the box issues a completion code and opens `reviewer/completion.html`, which renders a certificate carrying their printed name and title. The code returned to the browser is the same code written to the database, so it verifies.

**LinkedIn peer reviewer recommendation.** Ticking the box reveals three fields (name, work email, LinkedIn URL) and a consent line stating plainly that the details will be stored securely and will transfer with the project if the JRS assets are transferred to a successor. The LinkedIn field is sanitised against a host allowlist: a bare handle is normalised, a regional subdomain keeps its own host, anything else is dropped.

**Both are optional and neither gates the questions.** A reader can answer all nine and leave without giving a name, and that response is kept and counted.

---

## 4. What it has returned

| Stage | Count |
|---|---|
| Page opens | **0** |
| Submissions | **0** |
| Completed all nine questions | **0** |
| Mean questions answered | **0** |
| Contacts captured | **0** |
| Countries represented | **0** |

Every figure is a true zero rather than a missing measurement. The instrument logs a view on GET and a submission on POST, both are deployed, and both have been verified working. **The evaluation has never been sent to anyone.** There is nothing wrong with it and there is nothing in it.

The live funnel is published at `/api/asset-stats` under `reviewer_evaluation_funnel` and mirrored on the public dashboard at `pilot-status.html`.

---

## 5. Where it now sits in the funnel

As of 2026-08-11 the campaign gate feeds it directly. Both LinkedIn campaign links land on a screen offering two routes and no form:

```
https://jrsstandard.com/api/support?c=rtkw&src=linkedin
https://jrsstandard.com/api/support?c=defend&src=linkedin
        |
        v  endorsement row written, then redirect
   access.html  (campaign mode)
        |
        +--> /train?access=reviewer&focus=1&src=linkedin&c=rtkw   (Module 1, preview, no registration)
        +--> /reviewer/evaluation.html?src=linkedin&c=rtkw        (the nine questions)
```

`src` and campaign travel with both links, so a reviewer recruited through a campaign is attributed to it rather than logged as direct traffic.

---

## 6. What would make it worth reading

The instrument is sound and empty. Two things change that, in order:

1. **Send it.** One post carrying the evaluation link, or the campaign links now that they land on it. Until there is traffic there is nothing to summarise, and no amount of further instrumentation changes that.
2. **Decide the reporting threshold before the first response arrives.** With fewer than roughly 30 responses, breaking answers down by sector or country becomes a re-identification, and the instrument's whole claim to the reader is that this is impossible. `/api/asset-stats` already refuses to break answers down by country for exactly this reason. Set the same rule for sector and role now, in writing, rather than deciding it when the data is in front of you and the temptation runs the other way.

---

## 7. Provenance

Question text, answer sets, profile fields and the scale endpoints were read from `reviewer/evaluation.html` and `api/reviewer-eval.js` on 2026-08-11. Row contents were extracted from the endpoint by brace-matched parsing of each write payload. Funnel counts were read from the live `/api/asset-stats`. No figure in this document was carried forward from an earlier note.
