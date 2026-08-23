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

## 3. Missing: Peter Broida, with a hard constraint attached

**What happened.** Twice in July 2026 he referenced JRS publicly: the Dewey Publications
Podcast episode of 2026-07-06, with jrsstandard.com in the published episode notes, and Dewey
News and Case Alert **Issue 18-07 of 2026-07-10**, listing it as an **Extra Credit Reading
Assignment** with a favourable paragraph. He later wrote: **"No offense taken. You've got
something to offer the civil service world."**

**The constraint, and it is absolute.** He stated on the record: **"I'm not endorsing it, nor
is Dewey."** He has declined endorsement twice, in public.

**So the permitted use is narrow and it is still worth something.** It may be cited as
independent third-party attention from a recognised federal-sector publisher, by naming the
publication and issue and quoting the Case Alert paragraph. **It may never be presented as an
endorsement, and his name must never appear as a reference or a supporter.** Presenting it
otherwise would be falsified by one email to him, and the relationship record says the loop
closed warmly and should be left that way.

**The larger point the plan misses entirely.** Broida is not the opportunity. **His referrals
are.** On 2026-07-15 he named three federal-sector training organisations and said they
"might well be interested in having you as a trainer":

| Organisation | Contact named |
|---|---|
| FELTG | Deborah J. Hopkins |
| Gilbert Training Group | Gary M. Gilbert, former EEOC Chief Administrative Judge |
| LRP | Seth Supran |

**That is the only unsolicited demand signal anyone has offered this programme.** Emails went
out in July and all three were silent, and the recorded diagnosis is that the emails caused
the silence: each ended **"Use it or not, NO REPLY NEEDED"**, two went to general inboxes
rather than the named person, and **none of them asked to teach anything**, which is the one
thing Broida actually teed up. `research/Referral_Followups_2026-08-13.md` holds six-line
rewrites carrying that single ask. **They have not been sent.**

---

## 4. What these three add up to

**The plan has one route to revenue and it is the slower one.**

| | API licensing to GRC platforms | Training and certification |
|---|---|---|
| Prerequisites | Entity, marks, MCLA, security review, buyer engineering | **None of these** |
| Buyer's cost to adopt | Integration project | A purchase order |
| Assets ready | OpenAPI spec, versioned endpoint, vendor preview | **Curriculum, assessment, certificate, 4 guides, 19-page reference, 17-page library** |
| Existing traction | 2 dead checkout clicks | **8 enrolled, 5 organisations, 7 completions, 5 countries, 370 downloads** |
| Named warm leads | 0 | **3, from a federal-sector publisher** |
| Owner's track record | Created the standard | **16 years training practitioners on structured frameworks** |
| Time to first dollar | Quarters | **Weeks** |

**The training line is not a consolation prize. It is the shorter path, it has the only warm
leads in the programme, and it is the one the owner has 16 years of direct experience
executing.**

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

### Week 3, and this is the highest-value new action in the plan

| # | Step | Detail |
|---|---|---|
| 3 | **Send the three Broida referral follow-ups** | `research/Referral_Followups_2026-08-13.md`. Six lines, one ask, to the named person, and the ask is a guest session or a conference slot |
| 4 | Attach the credential that was never mentioned | 16 years training counselors, educators and clergy on consistent application of structured frameworks. **These organisations buy trainers** |
| 5 | Cite the Case Alert correctly | Issue 18-07, 2026-07-10, Extra Credit Reading Assignment. **Never as an endorsement. Broida is a connector, with no opinion attributed** |
| 6 | Observe the stop rule already recorded | Silent again after three weeks means the federal training channel is a measured negative, and no third round is sent |

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
| **Training or curriculum engagement, 12 months** | **not previously estimated** | **35 to 50 percent** |
| Any paid engagement of any kind, 6 months | not previously estimated | **55 to 70 percent** |

**The training estimate is higher than the API estimate for the near term** because it has
warm named leads, no legal prerequisites, a complete product, measured completions in five
countries, and 16 years of the owner's own delivery experience behind it.

**The 2 dead checkout clicks are the most actionable data point in this entire file.** They
cost nothing to fix and they are evidence, not projection.
