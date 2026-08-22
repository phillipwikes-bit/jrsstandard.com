# Corrected Licensing Plan and Execution Timeline

**2026-08-22.** Built from `research/SITE_MASTER_INVENTORY_2026-08-22.md` against the running
code and live endpoints. Supersedes the timeline in the playbook. Every asset named below was
confirmed present and, where deployed, confirmed returning 200.

---

## 1. The inventory changes the plan, and it moves it forward by eight months

The playbook schedules "Publish the Integration Schema" for **April to June 2027**. The
inventory shows the work is already done and live.

| Playbook says | Inventory and live check say | Effect |
|---|---|---|
| Publish the integration schema, Q2 2027 | **`/openapi-review-engine.json` is live.** OpenAPI 3.0.3, `JRS Review Engine API`, version `0.1.0-validation`, documenting `POST /api/v1/review-engine` | **Done. Pull forward 8 months** |
| Versionable API contract as a future property | **`api/v1/review-engine.js` exists and is deployed.** The versioned route is real | Done |
| Build vendor-facing packaging | **`vp-7c1f9a4e8d2b6035.html` is live**, titled "JRS: Safeguarding Decision Defensibility, Integration Preview" | Done |
| Deterministic engine as positioning | `api/review-engine.js:109-111`, ternary status with gap over review over pass, zero exceptions across the labelled corpus | **Verified property, not a claim** |
| Establish a free door opener | **`check.html` carries 57 inbound links and is in the sitemap.** The Seven-Point Check is fully wired | Done |
| Build an SEO surface | **17 `reference/` pages, all in the sitemap**, 2 to 7 inbound links each | Done |
| Stand up commercial offers | **Three offer pages live at 200**: `audit-request.html` $250, `governance-request.html` $500, `calibration-request.html` $750, all reading `api/_offer-config.js` | Built |

**The 2027 build phase is largely already built.** What is missing is not engineering. It is
three payment URLs, a navigation decision, and outbound contact.

---

## 2. The single highest-value finding: the commercial funnel is complete and unreachable

`api/_offer-config.js:26,34,42` each hold `checkout_url: ''`, marked
`[REQUIRES USER INPUT]`. `api/_offer-config.js:61` refuses to treat an offer as buyable
until that string is an https URL.

Meanwhile all three offer pages, plus `engagement.html` and `terms.html`, have **zero inbound
links from any page and are absent from `sitemap.xml`** (inventory 5.3).

**This is deliberate, not a defect.** `research/IP_SALE_TRACKER.md` revision 14, 2026-08-15,
records the decision: the paid offer was withdrawn from the public site until the research
programme completes, five commercial pages unlinked and removed from the sitemap, nothing
deleted, restore is a single `git revert`.

**So the reason organizations = 0 is not that the market rejected the offer. The offer has
never been reachable and has never carried a payment path.** That is the most encouraging
fact in the inventory, because it means the 15 to 25 percent estimate has never actually been
tested.

**One inconsistency to resolve.** The three offer pages still carry
`<meta name="robots" content="index,follow">` while being out of the sitemap and unlinked.
`engagement.html` is correctly `noindex,nofollow`. Either the withdrawal is complete, in which
case those three become `noindex`, or it is being lifted, in which case they return to the
sitemap. **The current half-state is the one position that gets neither benefit.**

---

## 3. Defects the inventory exposed, in priority order

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | `/CLAUDE.md` is publicly served and publishes the opaque slug of the private owner page and the private endpoint | Live 200, 19,854 bytes. Those slugs are the only access control on those surfaces | `scripts/block_internal_docs.py` |
| 2 | `engine-activity.html:62,66` promises a stored 200-character preview of the customer record | Untrue since 2026-08-14. Contradicts the Data Isolation Guarantee on three intake pages and the zero-retention claim in the playbook | `scripts/fix_engine_activity_copy.py` |
| 3 | Five more internal documents publicly served | `/JRS-Platform-Strategy.md` 39,736 bytes, `/RESEARCH-ENGINE-DEPLOY.md`, `/RUNG2-REFERENCE-PANEL-METHODOLOGY.md`, two `.docx` | Same script as 1 |
| 4 | `sitemap.xml` carries 24 duplicate URLs, 67 entries for 43 unique pages | Canonicals are present and correct, so ranking harm is limited. Crawl waste and an audit smell | `scripts/fix_sitemap_duplicates.py` |
| 5 | `people.html` is live at 200 with `<title>Not found</title>` and zero inbound links | A dead surface answering 200 | Decide: remove from `main` or restore content |
| 6 | `terms.html` is orphaned and out of the sitemap | A licensing counterparty asks for terms of engagement early | Link from the footer when the funnel reopens |
| 7 | `og-card.svg` is deployed and referenced by nothing; `og-card.png` is used by 25 pages | Dead asset | Remove or reference |

**All three fix scripts are written, dry-run verified, and not applied.** Each states in its
own docstring that it does not deploy.

---

## 4. Corrected commercial model

The playbook's yield table double-counts the one-time fee across every year.

| Year | Per partner | Basis |
|---|---|---|
| Year 1 | $35,000 to $100,000 | $10k to $25k integration plus $25k to $75k recurring |
| Years 2 to 5 | $25,000 to $75,000 | Recurring only |
| **5-year total, one partner** | **$135,000 to $400,000** | |
| **5-year total, three partners** | **$405,000 to $1,200,000** | Non-competing verticals |

**Probability.** The playbook says 55 to 65 percent. Verified live: organizations 0, sessions
0, records_run 0, revenue $0, marks unfiled.

**Held at 15 to 25 percent today.** The stages below name what each step is worth, because a
probability that never moves is not a forecast.

| After | Estimate | Why |
|---|---|---|
| Today | 15 to 25 percent | Nothing has been offered to a named buyer |
| Payment paths live and funnel reopened | 20 to 30 percent | The offer becomes purchasable, which it has never been |
| First paying diagnostic customer | 30 to 40 percent | Revenue is no longer $0 and a reference exists |
| Marks filed, Class 042 | 35 to 45 percent | A licence to unregistered marks is a harder sale |
| One organisation running records through `api/v1/review-engine` | **45 to 60 percent** | This is the step that moves it most |
| CEP November publication in hand plus one deployment | 55 to 65 percent | The playbook's number, earned |

**The playbook's figure is reachable. It is the finish line, not the starting position.**

---

## 5. Execution timeline

### Week 1, 25 to 31 August 2026. Close the exposures. Zero cost

| Day | Step | Command or action | Done when |
|---|---|---|---|
| 1 | Block internal documents from public serving | `python3 scripts/block_internal_docs.py --check` then without `--check` | `vercel.json` gains two rewrites |
| 1 | Correct the retention copy | `python3 scripts/fix_engine_activity_copy.py --check` then without | Both false statements gone |
| 1 | Dedupe the sitemap | `python3 scripts/fix_sitemap_duplicates.py --check` then without | 67 urls become 43 |
| 2 | Selective deploy to `main` | Temp branch off `origin/main`, `git checkout <dev> -- vercel.json engine-activity.html sitemap.xml`, **confirm `research/` staged count is 0**, push `deploy-tmp:main`, delete temp branch | `curl -s -o /dev/null -w "%{http_code}" https://www.jrsstandard.com/CLAUDE.md` returns 404 |
| 2 | Re-verify | `python3 scripts/verify_licensing_plan.py --live` | 22 of 22 pass |
| 3 | Decide on slug rotation | The slug was published for an unknown period. Rotating breaks any circulated link | Decision recorded either way |

**Rotation is your call and I did not make it.** If the private page has only ever been used
by you, rotate. If it has been sent to anyone, rotate and reissue.

### Week 2, 1 to 7 September 2026. Make the offer purchasable

| Step | Action | Blocked on |
|---|---|---|
| 1 | Create three payment links, $250, $500, $750 | A payment processor account |
| 2 | Paste them into `api/_offer-config.js:26,34,42` | Step 1 |
| 3 | `node --check api/_offer-config.js`, then deploy | Step 2 |
| 4 | Buy one yourself end to end and refund it | Step 3 |
| 5 | Resolve the robots half-state on the three offer pages | Your decision on reopening |

**Step 4 is not optional.** An offer nobody has ever transacted has an unknown failure rate.

### Weeks 3 to 6, 8 September to 5 October 2026. Reopen the funnel and file the marks

| Step | Action | Evidence it worked |
|---|---|---|
| 1 | Return the signed SCCE/HCCA copyright form | November publication is secured |
| 2 | Chase manuscript sign-off from the methodology contributor | Detection paper can be submitted |
| 3 | File USPTO Class 042 for JRS and DRR | Serial numbers issued |
| 4 | Restore the five commercial pages to navigation and sitemap | `git revert` of the 2026-08-15 unlink |
| 5 | Link `terms.html` from the footer | A counterparty can find terms |
| 6 | Restart the nightly cross-vendor series | `api/_study-status.js`, one flag. `/api/run-study` stops returning `skipped` |
| 7 | Resolve `people.html` | Either content or removal from `main` |

**Step 3 is a real gate.** `research/IP_SALE_TRACKER.md:80` records the marks as not filed and
`TRADEMARK_FILING_DOSSIER_JRS_DRR.md:49` records Class 042 as drafted and not verified.
Licensing an unregistered mark is a materially weaker offer.

### Weeks 7 to 12, 6 October to 16 November 2026. First deployment, which is the whole game

| Step | Action | Why this order |
|---|---|---|
| 1 | Build a target list of 20 mid-market GRC and legal-tech platforms | Named companies, named people |
| 2 | Send the free Seven-Point Check as the opener, not the paid offer | `check.html` has 57 inbound links and costs nothing to give |
| 3 | Follow with `/openapi-review-engine.json` and `vp-7c1f9a4e8d2b6035.html` | **The integration proof already exists.** Send it, do not describe it |
| 4 | Convert one conversation into a free 5-record diagnostic run | Produces the reference and the first non-zero `orgpilot-stats` row |
| 5 | Reopen the three Broida referrals if the September stop rule has passed | `research/Referral_Followups_2026-08-13.md` |

**Target: one organisation with a non-zero row in `/api/orgpilot-stats` by 16 November.** That
single row moves the estimate from 15 to 25 percent up to 45 to 60 percent, and no document
does that.

### December 2026. Tax and entity decisions, before any spend

| Step | Action |
|---|---|
| 1 | Engage a licensed practitioner. Take C1, C2 and C3 from `research/Licensing_Playbook_Evaluation_2026-08-22.md` to that meeting |
| 2 | Settle whether startup costs incurred in 2026 can be treated against a business beginning in 2027 |
| 3 | Confirm the Section 195 current-year figure and the amortisation of the remainder |
| 4 | Name the marginal rate in every projection, or delete the yield claims |
| 5 | Keep formation costs out of 2026 unless the practitioner says otherwise |

### Q1 2027, January to March. Entity and assignment

| Step | Action | Gate |
|---|---|---|
| 1 | Form the Single-Member LLC, effective 1 January 2027 | Practitioner confirmation from December |
| 2 | Execute IP assignment of the 2026 corpus, datasets and schemas into the entity | Clean chain of title is the first thing a licensee's counsel checks |
| 3 | Draft the master licence agreement | Field-limited and territory-limited exclusivity only |
| 4 | Add a performance floor to any exclusivity clause | Exclusivity converts to non-exclusive if a deployment count is not met by a date |
| 5 | CEP November article becomes a circulating credential | Publication is in hand |

**Blanket exclusivity on an unproven standard with zero deployments hands the entire
distribution upside to a partner who has not shown they can distribute.**

### Q2 to Q4 2027. Conversion

| Quarter | Target |
|---|---|
| Q2 | Two to three named pilot deployments running |
| Q3 | First upfront integration fee recognised |
| Q4 | One field-limited exclusivity signed with a performance floor |

---

## 6. What actually raises the probability, ranked

| Rank | Action | Estimated movement | Cost |
|---|---|---|---|
| 1 | One organisation running records through the engine | **+20 to +30 points** | Outreach only |
| 2 | Paste three payment URLs and reopen the funnel | +5 to +10 | Minutes plus a processor account |
| 3 | File Class 042 | +5 | $1,000 to $2,500 |
| 4 | Close the public exposures | Prevents a loss, does not add | One deploy |
| 5 | CEP publication in circulation | +5 to +10 | Return one form |
| 6 | Restart the nightly series before diligence | +2 to +5 | One flag |
| 7 | More documents | **0** | Time you do not get back |

**Rank 7 is the trap.** The inventory shows 562 private research files, 333 of them markdown.
The programme does not have a documentation shortage. **It has zero customers, and it has
never once made its offer reachable and purchasable at the same time.**
