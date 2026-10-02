# JRS sales and licensing potential: evidence-based assessment

**2026-10-02. Advice, not a valuation and not a legal opinion.** Labels: **Observed** (inspected or executed in this session), **Recorded** (stated in an estate record, underlying evidence not re-checked today), **Inference** (my reasoning from the cited evidence), **Unknown**.

## 1. Bottom line

1. **Full IP sale in the next 12 months: unlikely.** The recorded owner anchor is 5 to 10% (IP_SALE_TRACKER header). I see no evidence that justifies moving it up yet, and two findings today that push against it (sections 4.1 and 4.2).
2. **A meaningful licence (more than about USD 10,000): possible but unproven.** The recorded estimate is 15 to 25% (tracker revisions 20 to 22). That figure has never been tested against a single buyer conversation, so it is a judgment, not a measurement.
3. **A small first paid engagement (USD 500 to 5,000) within 6 months: the most achievable outcome.** It is recorded at 40 to 55% (revision 21). **Inference:** that holds only if outreach starts. With no outreach, the realistic probability is close to zero, because no channel currently brings buyers in.
4. **The single largest driver is not product readiness but the absence of any buyer contact.** Zero buyer conversations have ever been held (tracker section 9, item 1). The tracker records that this was caused by earlier advice to wait, not by the owner.

I did not previously give you this full picture in one place. My recent work concentrated on the Engine evaluation licence. That is real progress, but the estate's own commercialization audit ranks three other packages above it (section 5).

## 2. What supports value (strengths)

| Strength | Evidence | Status |
|---|---|---|
| A named, publicly attributed construct (JRS 2026-06-02; DRR 2026-07-02) | Register F-5 | Recorded, third-party timestamped |
| Research base: 36 full-set reviewers in 16 countries; detection 83.9% (95% CI 72.7 to 95.1), 16 experts, 24 records, 384 judgments | Register s7; tracker s4 | Recorded |
| Two accepted trade-press publications: CEP Magazine (SCCE, November issue) and Corporate Compliance Insights (published; card live on resources.html 2026-09-29) | Tracker s6; MASTER_TRACKER 2026-09-29 | Recorded |
| Working Engine with an evaluation package, a live test (10/10 calls, USD 0.035), a technical report and a buyer-ready offer | evaluation-license-v8/ | **Observed** today and yesterday |
| Unusually complete documentation, guard suite and evidence discipline | Repository | Observed; valuable in diligence |
| 33 executed contributor consents with transfer = yes | Register F-1, F-2 | Recorded |

## 3. Key assumptions behind any sale or licence (and how well each is supported)

| # | Assumption | Support today |
|---|---|---|
| A1 | Organizations feel real pain about documentation defensibility, especially for AI-assisted records, and will pay to reduce it | **Weak to moderate.** Publications and editor acceptance show the topic interests compliance media. No buyer has stated the pain or a budget |
| A2 | JRS is differentiated beyond "an LLM prompt plus a checklist" | **Weak.** The five conditions and the Engine prompt are public, and a GRC vendor could approximate the Engine in days (Inference). The defensible parts are the research, the construct and its name, the standard, and the credibility |
| A3 | A buyer would value the research and standard more than the code | **Inference, plausible.** Consistent with tracker s4 ("the 36-reviewer panel is the asset") |
| A4 | Rights can be cleaned up at a cost below the deal value | **Recorded estimate USD 12,000 to 24,000** for contributor releases, trademark clearance and tax advice (tracker rev 20). Not quoted by any lawyer |
| A5 | The owner can run outreach and sales conversations | **Unknown.** No outreach has been attempted |
| A6 | The research results hold up under a buyer's scrutiny | **Mixed.** The detection result is solid for its sample. The pre-registered reliability criterion was **not met** (lower bounds below 0.41, register s7), and the corpus is constructed, not real records |

## 4. Material risks (ranked)

### 4.1 No confidentiality left in the core assets (CRITICAL, Observed)
The GitHub repository is public (blocker B-018). Observed today, the following are readable by anyone:
- **The answer key for the 24-record detection study.** It is in `research/Verified_Key.md`, `research/Blind_Recheck_KEY_E08.md` and inside `api/variance-*.js`, on `origin/main`. The tracker's own guardrail says the answer key "never leaves the building" (tracker s3), and the benchmark package it rates "highest ceiling" (tracker s7b, package 3) depends on a held-out key. **That package cannot be sold as held-out while this stands.** Making the repository private now limits future exposure. It cannot recall copies already taken, so a fresh held-out set would be needed to sell benchmark access.
- The Engine source and its system prompt.
- Internal sale strategy, probability estimates and contributor analysis.

### 4.2 Chain of title (HIGH, Recorded)
- No signed rights instrument exists anywhere (register F-4).
- Consents cover study publications and successor transfer, but are silent on licensing and commercial products, and are revocable (F-3; CT-4).
- Hekim's terms require prior approval for commercial use of JRS material (register line 175).
- Ubayet's commercial and successor scope is deferred until publication (register s12). An employer context (KPMG India) appears in the source images (s21).
- Engine code is 100% AI-tool-attributed, and copyright in it is uncertain (F-11).

**A buyer's lawyer will price all of this in or walk away.**

### 4.3 No demand evidence (HIGH, Recorded and Observed)
- Revenue USD 0. Leads 0 (database read 2026-10-01). Zero buyer conversations.
- The only channel tested, federal training referrals, failed (tracker s5).
- Pay-screen visits without contact details: 13 between 14 and 21 August (recorded), and 6 between 9 and 27 September (observed), all on offers that had no working payment method. This is weak but real interest that the site could not convert.

### 4.4 Weak technical moat (MEDIUM, Inference)
The Engine is a single-model prompt with a fixed routing rule. Its value depends on the JRS method and evidence, not on hard-to-copy code. Known open defect: ED-05, records sent to the model without delimiters.

### 4.5 Positioning tension (MEDIUM, Recorded)
The public positioning and the articles focus on employment records. The safest product scope excludes HR, which raises EU AI Act Annex III questions for counsel. The strongest evidence and the safest scope point in different directions.

### 4.6 Solo-founder capacity and no entity or trademark (MEDIUM, Recorded)
No entity; marks unfiled (F-8). A buyer prefers to acquire a clean entity with registered marks.

## 5. What is most likely to sell first (Inference, from the estate's own audit)

`IP_COMMERCIALIZATION_AUDIT.md` (tracker s7b) ranked:

1. **Seven-Point Record Defensibility Check**, aimed at General Counsel and investigations leads. Speed: **days**. Not started.
2. **Model-Agreement Evidence Pack**, aimed at Chief AI Officers and model-risk teams: cross-vendor harness, 86.7% agreement over 37 runs. Speed: weeks. Not started.
3. **Benchmark access and calibration.** Highest ceiling, months away, **compromised by 4.1** until a new held-out set exists.

The **Engine evaluation licence** (built this week) sits between these. It is the most complete product, but it depends on buyers who will run software themselves.

**My view:** the first money is most likely to come from a **service-shaped offer** (the Seven-Point Check, or a fixed-fee documentation review for a GC or investigations team), with the Engine used behind it. A licence or a sale follows evidence of paying customers.

## 6. Specific next steps, with measurable targets

| # | Step | Who | Target | Why |
|---|---|---|---|---|
| 1 | Make the repository private | Owner (1 click) | This week | Stops further leakage of the answer key, the sale strategy and the source (4.1) |
| 2 | Build a named target list of 50 organizations across GRC software, e-discovery and legal-tech, investigation and case-management platforms, AI-governance vendors, and compliance consultancies, each with a named role and the reason they fit | Claude (research), owner reviews | 1 week | No target list exists (tracker s9, item 3) |
| 3 | Send 20 personal messages, owner to owner, citing the CEP and CCI articles and offering a 20-minute call. No price in the first message | Owner | Weeks 2 to 3; measure replies and calls | The only untried channel (tracker s5) |
| 4 | Put a working payment link on one offer (the Seven-Point Check or the evaluation) using a payment service you already have | Owner chooses; Claude builds and deploys | 2 weeks | 19 pay-screen arrivals went unconverted for lack of a checkout (4.3) |
| 5 | Ship the Seven-Point Record Defensibility Check as a fixed-fee offer | Claude drafts from `JRS_Validation_Report.md` s4; owner approves | 2 to 3 weeks | Fastest package in the estate's own audit |
| 6 | Rights clean-up, staged: (a) a one-page owner assignment of the IP to an entity, once formed; (b) short written confirmations from Ubayet (after publication), Hekim, Tanvi and Stacyann; (c) one lawyer review of those papers and the evaluation agreement | Owner and lawyer; Claude prepares drafts | 1 to 3 months | Turns 4.2 from a deal-breaker into a known, priced item |
| 7 | Independent real-record evidence: 50 to 100 public records (for example published federal "Justification and Approval" documents, permitted use to be verified), labelled blind by Tanvi, Hekim or Ubayet on the disagreement cases | Claude runs; co-authors label | 1 to 2 months; needs a new API key and a spend cap | Answers "fixture only" and "creator only" (A6) |
| 8 | Fix ED-05, then run a proper repeatability test | Claude | 1 to 2 weeks | Removes the main engineering objection |
| 9 | File the JRS trademark, and form an entity to hold the assets | Owner, with a lawyer or filing service | 1 to 3 months | 4.6 |
| 10 | Create a fresh held-out benchmark set, kept private from day one | Claude and co-authors | Only after step 1 | Restores package 3 |

**Decision points:** after 20 messages (step 3), count replies and calls. Zero replies means the positioning or the targets are wrong, and that is the thing to fix, not more product. One or more calls means pursuing a first paid engagement before spending on the lawyer, entity and trademark.

## 7. What not to do now
- More internal documents, prompts or gates before a single buyer conversation.
- Offering contributors profit shares before rights are papered and a first customer exists.
- Claiming that the Engine is validated, or that the articles prove it works.
