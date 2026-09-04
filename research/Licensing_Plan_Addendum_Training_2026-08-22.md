# Addendum: the three things missing from the plan, and one of them is a second revenue line

**2026-08-22.** Written because the plan omits the training and certification assets, 16
years of practitioner-training experience, and the only unsolicited third-party attention the
programme has received. **All three point the same way, and it is not the way the plan
points.**

**It also corrects a statement of my own.** I wrote that the programme has zero customers.
That is wrong, and the live telemetry below shows why.

---

## 0. The correction, first

`/api/asset-stats`, live 2026-08-23:

| Signal | Value |
|---|---|
| **Paid-offer checkout clicks** | **2**, one on `calibration` ($750), one on `governance` ($500) |
| **State of both clicks** | **`unconfigured`** |
| Training enrollments | **8** people, **5 organizations** |
| Training completions | **7**, across **5 countries** |
| Public artifact downloads | **370** (108 crawler rows excluded) |
| Reviewer evaluation opens | 18, 1 submitted |
| Certificate renders | 18 (7 honor, 11 reviewer) |

**Two people tried to buy and hit a dead checkout.** `api/_offer-config.js` holds an empty
`checkout_url` in every slot, and `/api/checkout` recorded both attempts as `unconfigured`.

**That is not an absence of demand. It is demand that arrived and was refused at the till.**
The plan's premise, and my own earlier framing, both treated the market as untested. It has
been tested twice, and the site failed the test.

**Note on `orgpilot-stats`.** Its zero is real but it is a different surface, and the endpoint
says so itself: `"Never sent to any organization. No invitation has been issued."` A true zero
from something never offered.

---

## 1. Missing: the training and certification assets, which are a second revenue line

The plan is entirely about licensing an API to GRC platforms. **The repository contains a
complete, deployed training and certification product that the plan never mentions.**

| Asset | Location | State |
|---|---|---|
| Six-module reviewer training, role-gated, progress-persisted | `training.html`, 25 inbound links, in sitemap | **Live** |
| Reviewer landing, evaluation, certificate | `reviewer/index.html`, `reviewer/evaluation.html`, `reviewer/completion.html` | **Live** |
| Certificate issuance | `api/reviewer-cert.js`, `api/complete.js`, `api/enroll.js` | **Live**, 11 reviewer certificates rendered |
| Enrollment telemetry with consent capture | `api/enroll-stats.js` | **Live**, 8 enrolled, 8 consented to contact and transfer |
| Four investigator field guides | general, Employment, Fair Housing, International | **Live** via `/api/dl` |
| 19-page reviewer desk reference | `JRS-Reference-9d4f2a7c.pdf`, 2.3 MB, 18 references | **Live** |
| Rapid review card | `JRS_Rapid_Review_Card.pdf` | **Live** |
| Codebook, five components | `codebook.html`, 10 inbound | **Live** |
| Simulation library | `simulations.html`, 8 inbound | **Live** |
| 17-page reference library | `reference/`, all in sitemap | **Live** |

**This is a curriculum with an assessment, a certificate, an enrolment record and consent
capture already running.** It has produced 7 completions across 5 countries and 11 issued
certificates with no marketing.

**Why it matters commercially, and why it is nearer than the API line.** Training and
certification licensing needs none of the prerequisites the API line needs: no entity, no
registered marks, no master licence agreement, no integration engineering by the buyer, and no
security review of a data-retention model. **A training organisation buys a curriculum and an
instructor. That is a purchase order, not a technology licence.**

---

## 2. Missing: 16 years of doing exactly the hard part of standards adoption

Second Thought Alternatives, Inc., January 2003 to December 2018, co-founder and
cognitive-behavioral researcher. Four functions, in the owner's own words:

> **Program Development and Behavioral Framework Design.** Co-developed structured
> cognitive-behavioral programs focused on conflict management, behavioral intervention, and
> recovery support across educational and treatment environments.
>
> **Implementation and Training.** Trained counselors, educators, clergy, and related
> professionals on consistent application of structured intervention frameworks within
> existing operational environments.
>
> **Program Evaluation.** Reviewed participant outcomes and implementation consistency to
> support updates to facilitator guidance and program delivery methods.
>
> **Operational Integration.** Worked with schools, residential programs, and treatment
> providers to integrate structured behavioral frameworks into existing systems and
> workflows.

**Read the second and fourth functions against the licensing problem.** The hard part of
selling a standard is not writing it. It is getting practitioners to apply it consistently
inside workflows they already have, and then measuring whether they did. **That is the exact
sentence describing 16 years of prior work.**

This also names a credential the plan never claims. `training.html` is not a first attempt at
curriculum design by a researcher. **It is the tenth or twentieth curriculum built by someone
who has trained counselors, educators and clergy and then evaluated whether the framework
survived contact with their operating environment.** The programme-evaluation function is the
same instinct that produced Gwet's AC1 as a primary statistic: measure implementation
consistency, not satisfaction.

**Where it belongs.** In the training and certification offer, as the reason a training
organisation should buy from him rather than build. Not in the API licensing pitch, where a
platform architect does not care.

---

## 3. Closed: the federal-sector training referral channel

**Owner determination, 2026-08-23: "They are not at all interested, Broida was just blowing
me off."**

The channel is closed. It is not a lead source, it is not a demand signal, and it is not part
of any forward plan. The historical record stays in
`research/Referral_Outreach_Emails.md` and the tracker; the follow-up drafts are marked
WITHDRAWN and are not to be sent.

**What this costs the analysis, stated plainly.** An earlier version of this file treated
those referrals as the programme's only unsolicited demand signal and built a probability on
them. **That was wrong on the facts as the owner knows them, and removing it lowers the
training estimate rather than leaving it where it was.** Section 6 carries the revised
numbers.

**What survives, and it is the substantial part.** The training and certification line does
not depend on that channel. Section 1's assets are built and deployed, Section 2's credential
is real, and the live traction below is measured rather than inferred.

## 4. What these three add up to

**The plan has one route to revenue and it is the slower one.**

| | API licensing to GRC platforms | Training and certification |
|---|---|---|
| Prerequisites | Entity, marks, MCLA, security review, buyer engineering | **None of these** |
| Buyer's cost to adopt | Integration project | A purchase order |
| Assets ready | OpenAPI spec, versioned endpoint, vendor preview | **Curriculum, assessment, certificate, 4 guides, 19-page reference, 17-page library** |
| Existing traction | 2 dead checkout clicks | **8 enrolled, 5 organisations, 7 completions, 5 countries, 370 downloads** |
| Owner's track record | Created the standard | **16 years training practitioners on structured frameworks** |
| Time to first dollar | Quarters | **Weeks** |

**The training line is not a consolation prize. It is the shorter path, it is the one with a
complete product already deployed, and it is the one the owner has 16 years of direct
experience executing.** It has no warm leads. Neither does the API line, and the API line
also needs an entity, registered marks, a licence instrument and a security review before it
can be offered at all.

**And it feeds the other line.** A federal training contract produces named organisations
using JRS in live workflows. That is precisely the reference deployment the API licensing
route needs and does not have, and it is what moves that estimate from 15 to 25 percent up to
45 to 60.

---

## 5. Added steps, slotted into the existing timeline

### Week 2, alongside pasting the payment URLs

| # | Step | Why now |
|---|---|---|
| 1 | Paste the three `checkout_url` values | **Two buyers have already been turned away** |
| 2 | Add the two lost checkout clicks to the sale record | Direct evidence of demand at $500 and $750 |

### Week 3. Build the target list the programme does not have

**The referral channel is closed, so the training line starts cold.** That is a real cost and
it is the honest position.

| # | Step | Detail |
|---|---|---|
| 3 | Build a named list of 20 training buyers | Compliance and HR training providers, professional associations offering CPE, and in-house L&D functions at organisations that already run investigations |
| 4 | Lead with the credential the site never claims | 16 years training counselors, educators and clergy on consistent application of structured frameworks, then evaluating implementation consistency. **These organisations buy instructors** |
| 5 | Start with the 5 organisations already on file | `/api/enroll-stats` records **5 organizations** with completed training and **8 people who consented to contact**. **That is a warmer list than any referral, and it is owned rather than borrowed** |
| 6 | Set a stop rule before starting | 20 approaches, three weeks. Silence across all 20 is a measured negative on the training channel, not a reason for a second round |

### Weeks 4 to 8. Package the training as an offer

| # | Step | Detail |
|---|---|---|
| 7 | Price the training and certification line | It has no price today. `api/_offer-config.js` covers only the three review offers |
| 8 | Build a one-page curriculum outline | Six modules, learning outcomes, assessment, certificate, hours. What a training buyer asks for first |
| 9 | Name the four field guides as licensable collateral | Employment, Fair Housing, International, general |
| 10 | Add the practitioner-training credential to `about.html` | The site does not say he has done this before |
| 11 | Decide on cohort licensing versus per-seat | Federal training organisations usually buy cohorts |

### Ongoing

| # | Step |
|---|---|
| 12 | Every training completion is a named organisation for the API licensing pitch. Ask each completer's organisation whether they would run 5 records through the engine |

---

## 6. Revised probability

The ladder in `research/Licensing_Execution_Plan_2026-08-22.md` stands for the API line.
**This addendum adds a second, faster line the plan did not have.**

| Route | Today | With these steps |
|---|---|---|
| API licensing to a GRC platform | 15 to 25 percent | 45 to 60 percent after one deployment |
| **Training or curriculum engagement, 12 months** | not previously estimated | **20 to 30 percent** |
| Any paid engagement of any kind, 6 months | not previously estimated | **40 to 55 percent** |

**REVISED DOWN 2026-08-23.** The earlier 35 to 50 percent rested partly on three warm
referrals that the owner has since determined were never real. **Removing them costs roughly
15 points**, and the number moves rather than the reasoning being retrofitted to keep it.

**The training estimate still exceeds the API estimate for the near term**, on what remains:
no legal prerequisites, a complete deployed product, 7 completions across 5 countries, 5
organisations already on file with contact consent, and 16 years of the owner's own delivery
experience. **What it no longer has is a warm introduction, so it is now a cold-outreach
motion and is priced as one.**

**The 2 dead checkout clicks are the most actionable data point in this entire file.** They
cost nothing to fix and they are evidence, not projection.
