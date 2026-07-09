# JRS / DRR — MASTER TRACKER

*Single source of truth. All figures verified against the live database, not memory. Update this file instead of relying on chat history. Last reconciled against the live DB and production site: 2026-07-08.*

---

## 1. Validation ladder — where each stage stands

| Stage | Question | Status |
|---|---|---|
| **Rung 1 — Reproducibility** | Do 3 independent AI models (Claude, GPT, Gemini) give the same JRS read on the same record? | ✅ 84% agreement across 15 records. Auto-runs nightly. |
| **Rung 2a — Reliability** | Do independent human reviewers agree with each other? | ✅ Experts AC1 0.74, reviewers 0.63 (10 records). |
| **Rung 2b — Accuracy** | Can reviewers match a hidden answer key on 24 records? | 🟡 5 of 17 reviewers complete (Jake, Frank, Lawal, Hekim, Andrey); Saurabh 7/24. Key verified 24/24. |
| **Construct validity** | Are the five conditions distinct dimensions? | 🟡 Data ready (108 rows). No psychologist recruited. |
| **Rung 3 — Criterion validity** | Do flagged records fail in real cases? | 🟡 12 real cases collected. |
| **External validity** | Does it hold on real (non-constructed) records? | ⬜ Future. |

### The pilots — evidence collected (verified live)
| # | Pilot | What it collects | Evidence to date |
|---|---|---|---|
| 1 | **AI-Assisted Records Detection** (Study 011) | Reviewer reads on the 24-record set vs a verified key | **128 reads; 5 complete (Jake, Frank, Lawal, Hekim, Andrey), Saurabh 7/24, 17 registered** |
| 2 | **Bench Reliability** (Studies 003/004) | Expert + reviewer scoring of a shared record set | **8 experts + 13 reviewers, 108 labels, 10 records → AC1 0.74 / 0.63** |
| 3 | **Real-Case Criterion** (Study 010, Rung 3) | Real public cases + documented outcomes, in 3 domain pilots | **12 real cases: FOIL/Stacy 7, HR/Tanvi 5, Healthcare/Keith 0 (breakdown in §2)** |

**How the rungs map to the site's study registry (research.html):**
| Rung / stage | Site study |
|---|---|
| Rung 1 Reproducibility | Study 001 (AI Reproducibility) |
| Rung 2a Reliability | Studies 003/004 (condition performance / reviewer agreement) |
| Rung 2b Accuracy | Study 011 (AI-Assisted Records Detection) |
| Construct validity | Study 009 (Organizational-Psychology Readiness) |
| Rung 3 Criterion validity | Study 010 (Criterion Validity, real-outcome) |

---

## 2. People

**Detection panel (24-record study)** — 5 complete, 1 in progress, 11 not started (17 registered):

| Code | Name | Title / role (verified) | Country | Reads | Status |
|---|---|---|---|---|---|
| V-AI-01 | Jake McDonough | AI governance (self-accountable AI runtimes), SAEONYX Global Holdings | US | 24/24 | ✅ Complete |
| V-AI-03 | Frank Schouten | AI Governance & Assurance; risk & accountability (AEGF) | Australia | 24/24 | ✅ Complete |
| V-AI-10 | Lawal Olabanji | Operations & records management, ALTV Engineering | Nigeria | 24/24 | ✅ Complete |
| V-AI-11 | Andrey Ekhmenin | Founder, EAS; governance diagnostics & post-execution review | Poland/EU | 24/24 | ✅ Complete |
| V-AI-20 | Hekim Colpan (Expert Panel) | AI Governance & Compliance Manager; ISO/IEC 42001 auditor (EU AI Act, GDPR, DORA) | Germany | 24/24 | ✅ Complete |
| V-AI-07 | Saurabh Nanda | General Manager / APAC business leader (P&L), Align Technology | India | 7/24 | 🟡 In progress |
| V-AI-05 | Alankar Yaduvanshi | Data Privacy & Corporate Compliance (CIPP-E), WNS | India | 0/24 | Not started |
| V-AI-06 | Dr Nitin Deshpande | Chief Human Resources Officer; 38+ yrs HR & industrial relations | India | 0/24 | Not started |
| V-AI-08 | Gabriela Cortez | Civil-rights records; bilingual intake (Maryland Commission on Civil Rights) | US | 0/24 | Not started |
| V-AI-12 | Kyle McMullan | Chief Audit Executive; internal audit & financial crimes | UK/Ireland | 0/24 | Not started |
| V-AI-14 | Terra Shouse | Risk analysis & regulatory compliance (FMEA), independent | US | 0/24 | Not started |
| V-AI-15 | Yetunde Adesiyan | Senior Manager Internal Audit (CISA, CISSP, FCCA), Tate & Lyle | UK | 0/24 | Not started |
| V-AI-16 | Dr Gabriela Bar | Attorney, PhD; AI ethics advisor (EU), Gabriela Bar Law & AI | Poland/EU | 0/24 | Not started |
| V-AI-17 | Shakiba Mahvash | AI & Law researcher (governance & liability), Islamic Azad University | Iran | 0/24 | Not started |
| V-AI-18 | Saad Farooq | Regulatory & Public Policy Leader, AI governance (e& / Etisalat) | UAE | 0/24 | Not started |
| V-AI-19 | Sanya Dalal (Expert Panel) | Ethics & Compliance; investigations (LLB, MBL, CFE), GE Vernova | India | 0/24 | Not started |
| V-AI-21 | Tarun Samtani (Expert Panel) | Senior Director, Data & AI Governance; global DPO (CIPM, AIGP, CIPP/A) | Singapore | 0/24 | Not started |

**Methodology:** M-01 **Ubayet Hossain, FRM** — Associate Director (Model Validation), KPMG India; 9+ years in credit/market-risk model development and validation. Contributed the reliability/validation framework (the Rung 1–2 statistics and floors). Credited in the analysis plan, both research PDFs, and the article.

**Proportionality principle:** surfaced by **Saurabh Nanda, General Manager and APAC Business Leader (Align Technology)** — also detection reviewer V-AI-07. Credited (with permission) in the research paper, Article 1, and the detection protocol.

**Rung 3 — Real-Case Criterion pilots (public determinations paired with documented outcomes):**

| Domain pilot | Contributor | Cases | Outcomes recorded | Last activity |
|---|---|---|---|---|
| Public Records / FOIL | Stacy Young (E-08) | **7** | challenged, failed appeal | 2026-07-06 |
| HR / Employment | Tanvi Pokhriyal (V-HR-01) | **5** | challenged, failed appeal, held up | 2026-06-22 |
| Healthcare Compliance | Keith Carrington, EJD, MBA (V-HC-01) | **0** | — | accepted, not started |

Total: **12 real cases** across two active domain pilots; the healthcare pilot is accepted but not yet started.

**Open seat:** organizational psychologist (construct validity) — not recruited.

---

## 3. Publications & live research platform

**Deployed to production (jrsstandard.com) — current commit `62a586a`, verified live 2026-07-08:**
- research.html shows Early Results (reproducibility 84%, reliability AC1 0.74/0.63), Study 004 "Reviewer Reliability — Result reported", Study 009 "Dataset ready", and the methods-paper link. Duplicate research questions are deduped on display.
- Live findings feed: reproducibility (STUDY-001) and reliability (STUDY-004).
- Answer-key docs (`research/`) are deliberately NOT on production — `research/Verified_Key.md` returns 404. Blind study intact (re-verified 2026-07-08: `research/` absent from the deployed tree; selective deploy publishes public HTML only).

| Paper | Covers | File | State |
|---|---|---|---|
| The Justification Review Standard | Full framework | `JRS_Research_Paper.pdf` | ✅ Live on research page (Ubayet full title) |
| Reliability & Accuracy (Rungs 1 & 2) | Repro + reliability + prelim accuracy | `JRS_Reliability_Accuracy.pdf` | ✅ Live on research page |
| Decision Reconstruction Risk | The concept (essay) | `DRR_Article.pdf` | ✅ Live |

Articles 2–4 (FOIL pilot; HR pilot; capstone with construct validity) — planned, not drafted.

---

## 4. Open threads

| # | Thread | Next action | Owner |
|---|---|---|---|
| 1 | Finish the 24-record detection study (5/17 complete) | Nudge the 12 unfinished reviewers | You send / I draft |
| 2 | Recruit an organizational psychologist | Find one; hand over the data package (ready) | Not started |
| 3 | Publish Article 1 (Rungs 1 & 2) | Ubayet reviews first, then preprint/journal | Decide path |
| 4 | Real-case pilot (Rung 3) | Nudge Keith; get more cases | You send / I draft |
| 5 | Website 404s (~20% of traffic) | Send bad URLs from GA4 → I build redirects | You send URLs |
| 6 | Dewey / Peter Broida | Reply + LinkedIn post drafted; hold until he emails (author intros). Do not tag him. | You |
| 7 | Rotate the exposed Supabase token | In the Supabase dashboard | You |

---

## 5. Platform & deployment activity log — 2026-07-08 (verified)

**Reviewers registered this session (all confirmed in the live DB, 0 reads each, links live):**
| Code | Name | Country | Panel / perspective |
|---|---|---|---|
| V-AI-16 | Gabriela Bar | Poland/EU | Expert — AI law & EU governance (attorney, PhD) |
| V-AI-17 | Shakiba Mahvash | Iran | AI & law researcher (AI governance & liability) |
| V-AI-18 | Saad Farooq | UAE | AI governance / regulatory & public policy (e&) |
| V-AI-19 | Sanya Dalal | India | **Expert panel** — ethics, compliance & investigations (LLB, MBL, CFE, GE Vernova) |

- **Sanya Dalal incident:** her first link (bench-review flow) rejected the write and triggered the fail-safe download; re-issued as V-AI-19 on the expert panel with a working `ai-records-pilot.html?code=V-AI-19` link. Prior downloaded scoring discarded.

**Website conformance audit + production deploys (commits `ac34c45` → `645094e` → `62a586a`, verified live):**
- Removed all customer-facing prices ($27, $77) → free during validation. Test-record dollar amounts and the private admin cost note intentionally kept.
- Removed all 150 long dashes site-wide (em/en, literal + entities); re-census = 0.
- Fixed a homepage structural bug: missing closing `</div>` tags had nested the About section and the site footer inside a hidden section, so both were not rendering on the default homepage. Now div-balanced and rendering (browser-verified).
- Fixed two self-sabotaging deep-links (enterprise, workflow-fit), undefined CSS-variable colour bugs (bench-review indicators, research-data notes), added the canonical blob fail-safe to submit-record, added missing `.catch()` handlers to bench-admin, corrected a false "saves as you go" claim (submit-validation).
- Standardised the copyright line to `© 2026 Phillip Wikes · JRS™` (index, jrsstandard).
- Corrected the investigator-guides edition count in meta tags (two → three); the visible page Broida reviewed was left untouched.
- Rewrote two broken reference-page sentences (failure-modes "inputs"; escalation-triggers circular).
- Added GA4 tag `G-NVYHJ7BJ92` to all 52 pages (was missing on 12).
- Added all 17 `reference/` pages to `sitemap.xml`; linked the reference hub from the homepage footer (was orphaned).
- Removed the last `TODO` markers from view-source (bench-results).
- Full conformance audit **PASS on all 52 pages**; `training.html` verified functional (6/6 module progress, cert function, sanctioned localStorage key only, no JS errors).

**Verified private on production:** `research/` (answer key, this tracker, protocols) is absent from the deployed tree — selective deploy publishes public HTML only.

**Security (still open):** the Supabase management token pasted in chat is compromised and should be rotated (open thread #7).

---

## 6. Collaborations & co-author assignments (private — recruitment planning)

**Standing rule: one article ↔ one co-author. Never offer the same article to two people.**

| Deliverable | Topic / audience | Proposed collaborator | Verified basis | Status |
|---|---|---|---|---|
| LinkedIn Article 2 — "When AI Writes the Record" | HR / compliance defensibility | **Sanya Dalal (V-AI-19)** | Ethics & compliance; LLB, MBL, CFE; 8+ yrs internal investigations, GE Vernova | **ON HOLD — superseded by the Journal of Business Ethics co-author pitch (do not double-ask Sanya).** |
| LinkedIn Article 4 — "The Evidentiary Deficit" | Legal / governance | **Gabriela Bar (V-AI-16)** | Attorney, PhD; EU AI-ethics advisor | **Offered** (co-credit) per your instruction; persuasive reply drafted, awaiting her response |
| **Journal article — FOIL** ("Documentation as a Governance Layer") | Public records / FOIL; *Journal of Civic Information* | **Stacy Young (E-08)** | Records Governance Advisor; FOIL pilot contributor (7 real cases, verified) | **Co-author CONFIRMED — Stacy Young, 2026-07-09**; outline drafted (`research/FOIL_Article_Outline.md`); data collection ongoing (n=7, target 20-30 by Aug 31, 2026). Not submittable until sample target met. |
| **Journal article — Business Ethics** ("Documentation Governance in AI-Assisted Decision-Making") | Multi-domain governance; *Journal of Business Ethics* | **Sanya Dalal** (pending) | Ethics & Compliance, CFE, GE Vernova, ex-KPMG | **Draft started 2026-07-09** (`research/BusinessEthics_Article_Draft.md`); pitch sent via LinkedIn DM (follow-up; no reply to yesterdays email). Awaiting yes/no. |

**Alternate co-author (hold for a future governance/liability article, not the HR piece):** Shakiba Mahvash (V-AI-17) — aspiring AI & law researcher, bar candidate; would value co-authorship most.

**Already credited (not co-authors, do not re-offer):** Ubayet Hossain (M-01, reliability framework), Saurabh Nanda (V-AI-07, proportionality principle).

---

## 7. FOIL journal article — Journal of Civic Information (progress-tracked)

**Standing directive (from 2026-07-09): all progress on this article is documented here and in `research/FOIL_Article_Outline.md`.**

- **Deliverable:** co-authored empirical research article for the *Journal of Civic Information* (FOIA / public records / transparency; empirical).
- **Co-author:** Stacy Young (E-08), Records Governance Advisor and Public-Records Domain Lead (Deputy Records Access Officer, NYC HPD).
- **Basis:** the Public-Records Documentation Validation Pilot (PR-DVP); real public determinations paired with documented outcomes; JRS read recorded blind to outcome.
- **Verified data (live DB, `bench_outcomes`, contributor E-08):** 7 cases, 7 distinct public sources, collected 2026-06-26 to 2026-07-06; JRS reads 5 Ready / 2 Needs-work / 0 Gap.
- **Target / deadline:** 20-30 cases with a spread of outcomes; first-batch and full-set deadlines per the pilot (full set by Aug 31, 2026).
- **Positioning (per the May 28, 2026 Chief FOIA Officers Council technology initiative):** JRS evaluates the reviewability of records produced by any workflow (manual or AI-assisted); it is a governance layer above any FOIA technology, complementary to technology inventories that measure software but not record reviewability.
- **Gate (no fabrication):** not submittable until n reaches the pre-registered target with a spread of outcomes; Results/Abstract remain placeholders until then.

**Progress log:**
- 2026-07-09 — Outline drafted (`research/FOIL_Article_Outline.md`) from the PR-DVP prospectus and verified n=7 data.
- 2026-07-09 — **Stacy Young accepted co-authorship** and committed to building out more cases. Next: drive collection toward 20-30 with a spread of outcomes; finalize the upheld/overturned outcome-coding scheme; then write Results and Abstract.

---

## 8. Business Ethics journal article — Journal of Business Ethics (progress-tracked)

**Deliverable:** empirical, practitioner-informed paper on documentation governance in AI-assisted decision-making. Draft: `research/BusinessEthics_Article_Draft.md`.

- **Spine (established, verified):** Rungs 1-2 evidence woven in — reproducibility 84% (15 records), reliability Gwet's AC1 0.74 experts / 0.63 reviewers (10 records); reliability/validation methodology by **Ubayet Hossain (KPMG India)**, named in-text.
- **Criterion legs (preliminary):** HR pilot (Tanvi Pokhriyal, **UAE**) n=5, includes one Gap-read record that held up (counter-example) — no criterion claim yet; public-records pilot (Stacy, E-08) n=7 used **illustratively only**.
- **Co-author pitch:** Sanya Dalal (ex-KPMG; GE Vernova; CFE). Pitched via LinkedIn DM 2026-07-09 as a follow-up (she did not reply to yesterday's email). Goal: a clear yes/no. Tanvi is NOT told about the paper until Sanya agrees (per your instruction).
- **Gates (no fabrication / no duplication):** (1) no criterion claim until HR and public-records pilots reach 20-30 with a spread of outcomes; (2) the public-records primary results live in the FOIL paper only — used illustratively here to avoid duplicate publication; (3) authorship assigned by substantive intellectual contribution (ethics-journal integrity).

**Progress log:**
- 2026-07-09 — Initial draft created; Rungs 1-2 + Ubayet woven in; Sanya pitched (LinkedIn DM). Next: Sanya yes/no; then define her section and drive HR/public-records pilots toward target.

---

## Appendix — condition naming (reference)

Canonical five conditions = the deployed standard (`jrsstandard.html`, `codebook.html`): RC1 Reconstructability · RC2 Basis Identification · RC3 Chronology · RC4 Decision-Process Traceability · RC5 Evidentiary Sufficiency.

The review instrument stores working keys; they map to the standard as follows (kept as-collected so existing data stays valid):

| Data key | Standard condition |
|---|---|
| reasoning_traceability | RC1 Reconstructability |
| basis_identification | RC2 Basis Identification |
| temporal_reconstructability | RC3 Chronology |
| accountability_support | RC4 Decision-Process Traceability |
| cold_reviewer_clarity | RC5 Evidentiary Sufficiency |
