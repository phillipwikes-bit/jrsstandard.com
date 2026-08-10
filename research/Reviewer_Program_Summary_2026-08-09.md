# JRS Reviewer Training and Certificate: programme summary

**Revised 2026-08-10. Live at https://jrsstandard.com/reviewer**

---

## When contacts get collected

**Four moments. Only four. Everything else in this programme collects nothing about a person.**

| # | Moment | What is captured | Required? |
|---|---|---|---|
| 1 | Registering to unlock modules 2 to 6 | Name, work email | Yes, to see modules 2 to 6. Module 1 needs nothing |
| 2 | Ticking **Issue me a certificate** at the end of the evaluation | Name, printed title, work email, organization | No. Off by default |
| 3 | Ticking **Request a LinkedIn Peer Reviewer Recommendation** at the end of the evaluation | Name, work email, LinkedIn URL | No. Off by default |
| 4 | Running the full record check on `/pilot` | Identity carried from the access gate, plus what the diagnostic found | No. The one-record test above it asks for nothing |

### The single most important line in this document

**Answering the nine questions collects nothing about you.** A person can open the evaluation, answer all nine, hit submit, and leave no name, no email and no contact record of any kind. That is not an oversight. It is the reason the answers are worth having: question 2 asks whether their own employer has a formal second reader, and a name attached to that answer buys a careful answer instead of a true one.

### So where do contacts actually come from?

Moments 2 and 3 sit side by side on the same screen, both unticked, both at the foot of the evaluation. A respondent can tick neither, either, or both.

- **Neither ticked** → one anonymous answer row. Research value, no contact.
- **Certificate ticked** → answer row, plus a contact row with a completion code.
- **Recommendation ticked** → answer row, plus a contact row with a LinkedIn URL.
- **Both ticked** → answer row, plus **two** contact rows, which is why the funnel counts them separately.

The recommendation tick exists because before it, a respondent who did not want a certificate produced a data point and nothing that transfers with the asset.

### There is no registration link on the evaluation page

The evaluation never sends anyone to a gate and never asks anyone to register. The only required tick on that page is consent to anonymous research use of the answers, and it captures no identity.

---

## What it is

A free, six-module self-paced training in the five JRS review conditions, ending in an anonymized reviewer evaluation and a certificate. It is an open educational standard, not a licence or an accreditation, and the pages say so in those words.

## The five-step pathway

| Step | What happens | What is asked for |
|---|---|---|
| 1 | Read Module 1 | Nothing. No email, no account |
| 2 | Register to unlock modules 2 to 6 | Name and work email |
| 3 | Work the six modules | Progress saves in the browser |
| 4 | Submit the reviewer evaluation | Nine questions, about four minutes |
| 5 | Collect the certificate | Optional. Name and title as they should print |

Steps 4 and 5 can be taken without steps 1 to 3. The evaluation is a standalone link, and the two optional contact ticks sit on it.

## The six modules

These are the modules that exist in the live training, not a rewritten set.

1. **JRS Review Conditions.** The five conditions themselves and what a failure looks like.
2. **Common Documentation Conditions.** Patterns that recur across real records.
3. **Secondary Review and Escalation.** What a second reviewer needs from a file.
4. **AI-Assisted Record Review.** Reviewing records a model helped draft.
5. **Investigation Review.** Applying the conditions to investigative files.
6. **Implementation Sequence.** Putting pre-finalization review into an existing workflow.

The companion desk reference is the Rapid Review Card, free and ungated at `/api/dl?e=card`.

---

## The evaluation, and why it is the part that matters commercially

The programme can already state how consistently the five conditions are applied under study conditions: 83.9% detection accuracy against a verified key, Gwet's AC1 0.739 among experts, 86.7% cross-vendor agreement. What it cannot yet state is what record review looks like **inside working organizations**, and no amount of further accuracy testing produces that. The evaluation does.

**The nine questions.**

| # | Question |
|---|---|
| 1 | How many people read a consequential record before it is finalized? |
| 2 | Is there a formal second reader before finalization? |
| 3 | How often is a record returned to its drafter because the basis is missing or unclear? |
| 4 | When a conclusion is reached, is the basis recorded in the file at the time? |
| 5 | Is AI-assisted drafting used on records? |
| 6 | Is there a written policy covering it? |
| 7 | If a record from two years ago were questioned today, how confident are you the file alone would explain the decision? |
| 8 | Has documentation quality ever been audited or sampled? |
| 9 | How useful would a pre-finalization review of the five conditions be in your workflow? (1 to 5) |

Context captured alongside: function, sector, and a coarse organization size. All three optional, none of them identifying an employer.

**Why this is the asset piece.** Questions 1, 2, 3 and 8 measure whether the control this standard describes exists anywhere today. Questions 5 and 6 measure how fast the problem is arriving. Question 9 is a stated demand signal from named professional functions. A buyer can price a market they can see the shape of; they cannot price an assertion.

---

## The optional exchange: LinkedIn Peer Reviewer Recommendation

At the foot of the evaluation, above the submit button, sits one optional tick:

> Request a **LinkedIn Peer Reviewer Recommendation** for contributing to this research baseline.

Ticking it reveals three fields: full name, work email, LinkedIn profile URL. Beneath them:

> By checking this box, you consent to research follow-up and secure storage and transfer of your contact information if JRS assets are transferred to a successor project.

**Why it exists.** Before this, an evaluation submitted with the certificate box unticked produced one row of anonymous answers and no contact record at all. That is a market data point with no `consent_transfer`, and `consent_transfer` is the field that makes a contact record travel with the assets rather than being a list that dies with the seller. The recommendation is the exchange that converts an anonymous respondent into a transferable contact.

**What the recommendation says, and what it does not.** It is offered for the contribution to the research baseline. The page states in the same block that it does not assert anything about the person's professional performance, which has not been observed. A recommendation claiming otherwise would be an endorsement written about work nobody saw, and the first person to notice would be whoever reads it on their profile.

**The LinkedIn field is not stored as typed.** A URL field that later renders in any dashboard is an injection surface. Input passes a host allowlist: a bare handle normalises to `linkedin.com/in/`, a bare domain gains the scheme, a regional subdomain keeps its own host, and anything that is not a LinkedIn host or contains a quote, angle bracket or backslash is dropped rather than stored.

---

## Measurement: opened, submitted, completed, captured, and from where

Five things, answering five different questions that were previously collapsed into one. All live at `https://jrsstandard.com/api/asset-stats` under `reviewer_evaluation_funnel`.

| Metric | What it counts |
|---|---|
| `opened` | People who clicked through to the evaluation |
| `submitted` | Submissions with at least one answer |
| `completed_all_questions` | Submissions answering all nine |
| `mean_questions_answered` | Average answered per submission |
| `contacts_captured` | Transferable contact records produced |
| `contacts_via_recommendation` | Of those, from the incentive block |
| `contacts_via_certificate` | Of those, from the certificate tick |
| `open_to_submit_pct` | Did they start and finish? |
| `submit_to_contact_pct` | Did a respondent give details? |
| `open_to_contact_pct` | End-to-end yield from a click |
| `countries_opened` | Country of reviewer at the open stage, counts per country |
| `countries_submitted` | Country of reviewer at the submission stage |
| `countries_contacts` | Country of reviewer for the contacts captured |
| `distinct_countries_opened` | How many countries the instrument has reached |

**Country of reviewer is tracked at every stage.** The two-letter code has been written on all four row types from the edge since they were built and was surfaced on 2026-08-10. Opens, submissions and contacts are reported side by side per country, because a country that opens and never submits is a different signal from one that converts, and a single total hides both.

**Answers are deliberately not broken down by country.** With a handful of responses, "the one respondent from Iceland says their employer has no second reader" is a re-identification, and the whole instrument depends on that being impossible. Counts per country, never answers per country.

**Where a reviewer sits is not necessarily where their employer is.** The code comes from the network edge at the moment of the request, so it reports the reader's location and not the organization's.

**The open count was not being recorded until 2026-08-10.** The endpoint served the question set on a GET and logged nothing, so the first event the system could see was a completed submission: a page nobody finished and a page nobody opened were indistinguishable. The GET now writes an `eval-view` row carrying the source tag, country and device, guarded against deploy checks and owner previews.

**`opened` counts page opens, not distinct people.** The evaluation page carries no per-person key, and inventing one would mean fingerprinting the reader, which the rest of this system deliberately does not do. That is stated inside the endpoint response rather than left for a reader to assume.

**Source attribution.** Any link can carry `?src=`, and the page passes it through to the open event, so `?src=linkedin` and `?src=email` are separable in the funnel. An untagged link is counted but not attributed.

---

## Three unlinked rows: the design decision the whole instrument rests on

A submission writes up to **three separate records that share nothing linking them**.

| Row | Table | Contains | Does not contain |
|---|---|---|---|
| Evaluation | `interaction_events`, source `reviewer-eval` | Answers, sector, coarse org size, country code | Any name, email, employer, or free text |
| Certificate | `pilot_contacts`, source `reviewer-cert` | Name, email, printed title, completion code | Any answer |
| Recommendation | `pilot_contacts`, source `reviewer-eval-incentive` | Name, work email, LinkedIn URL, consent flags | Any answer, and no completion code, no evaluation id, no sector, size or role |

Isolation is enforced by omission rather than by a filter: the incentive payload contains no value that also appears on the evaluation row, so there is no foreign key, join key or shared identifier of any kind. The only thing the rows have in common is a coarse timestamp, and a timestamp shared by every submission in the same minute is not an identifier.

This is what lets question 2 ask a compliance officer whether their own employer has no second reader and get a truthful answer. If the two rows were joined, every answer would be a statement attributable to a named person about their employer's weaknesses, and the honest answer rate would collapse.

It also means the consent ticks are separate: one for research use of the anonymous answers, a different one for contact.

Answer options are validated server-side against the question set, so a hand-crafted POST cannot inject free text into the research record.

---

## Documentation: who is recorded, and how

**Yes, participants are documented, in three separate places with different purposes.**

| Record | Where | Identifiable? | Purpose |
|---|---|---|---|
| Enrolment | `pilot_contacts`, source `training-enroll` | Yes: name, work email | Contact, and the record that they registered |
| Evaluation | `interaction_events`, source `reviewer-eval` | **No** | The anonymized research baseline |
| Certificate | `pilot_contacts`, source `reviewer-cert` | Yes: name, printed title, completion code | Proof of completion, reissue if lost |
| Recommendation request | `pilot_contacts`, source `reviewer-eval-incentive` | Yes: name, work email, LinkedIn URL | Transferable contact, and the basis for writing the recommendation |
| Certificate collected | `interaction_events`, source `reviewer-cert-render` | Code only | Engagement signal: who came back for the artifact |
| Public listing | Only if separately ticked | Yes, name and organization only | The public reviewer list |

`pilot_contacts` has row-level security on with no anonymous read. Nothing in it is reachable from the public site. Aggregates only are exposed, through `/api/asset-stats` and the other stats endpoints.

Consent on the certificate row covers contact, secure storage, and transfer with the project if the JRS assets are transferred to a successor. That third element is what makes the contact record part of the asset rather than a list that dies with the seller. It is disclosed in the registration terms behind the tick, and public listing is a separate optional choice.

---

## The training link is unchanged

**Yes, it is the same free training.** Nothing about the existing six-module course changed.

| Route | Goes to | Status |
|---|---|---|
| `/reviewer` | The new landing page | New |
| `/train` | `training.html?access=reviewer&focus=1` | **Unchanged** |
| `/training` | `training.html` | **Unchanged** |
| Landing page CTA | `training.html?access=reviewer&focus=1&src=reviewer-landing` | Same page, now tagged |

The 7 existing enrolments and 4 recorded completions are untouched, and browser progress under `jrs-training-progress` still resumes. The only change is that `/reviewer` now opens a landing page that explains the programme first, instead of dropping a visitor straight into the training with no context, and its CTA carries a source tag so the landing page's contribution is measurable.

---

## Operability: verified end to end on production

| Step | Result |
|---|---|
| Landing page loads, links to the real training | 200, correct module names, correct CTA target |
| Evaluation instrument loads | 9 questions, 11 sectors, 6 sizes, 9 roles |
| Full nine-answer submission with certificate | `answered 9/9`, completion code issued |
| Certificate renders from that code | 200, correct name, title and code printed |
| Malformed code | 400 |
| `/train` and `/training` | 200, unchanged |

All seven routes return 200: `/reviewer`, `/reviewer/`, `/reviewer/index.html`, `/reviewer/evaluation.html`, `/reviewer/completion.html`, `/evaluation`, `/completion`.

**One defect found during that test and fixed.** The evaluation endpoint had no deploy-check guard, so verifying it wrote a fabricated row into the research baseline: the one table in the programme that must contain only real answers. A guard now validates the whole path and writes nothing when a test tag is present, and the row that landed before the guard deployed has been purged. The baseline reads zero rows.

---

## LinkedIn, described accurately

The completion page opens LinkedIn's own **Add to profile** flow, prefilled with certification name, issuing organization, issue month and year, credential ID and credential URL. That creates a Licenses and Certifications entry.

It does **not** verify a credential and does **not** endorse a skill, because LinkedIn exposes no interface by which a third party can do either. The page offers a copyable post and a copyable skills list the holder adds themselves, labelled as such.

---

## Open items

1. **Nobody has taken the evaluation yet.** The baseline reads zero on every funnel metric. The instrument shipped 2026-08-09 and the incentive block and open counter shipped 2026-08-10, so a zero here is the expected state and not a measured result.
2. **The certificate is issued on a completion code checked for shape, not looked up.** A certificate grants access to nothing, so protecting it like a credential would add friction without protecting anything. The verifiable record is the database row. If that ever needs to change, the row already exists to check against.
3. **Sample size.** The commercial value of the evaluation is a function of how many are collected. One is an anecdote. Fifty is a market description.
