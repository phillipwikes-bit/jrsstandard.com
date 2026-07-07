# JRS / DRR — MASTER TRACKER

*Single source of truth. All figures verified against the live database, not memory. Update this file instead of relying on chat history.*

---

## 1. Validation ladder — where each stage stands

| Stage | Question | Status |
|---|---|---|
| **Rung 1 — Reproducibility** | Do 3 independent AI models (Claude, GPT, Gemini) give the same JRS read on the same record? | ✅ 84% agreement across 15 records. Auto-runs nightly. |
| **Rung 2a — Reliability** | Do independent human reviewers agree with each other? | ✅ Experts AC1 0.74, reviewers 0.63 (10 records). |
| **Rung 2b — Accuracy** | Can reviewers match a hidden answer key on 24 records? | 🟡 3 of 10 reviewers complete (Jake, Frank, Lawal); Saurabh 7/24. Key verified 24/24. |
| **Construct validity** | Are the five conditions distinct dimensions? | 🟡 Data ready (108 rows). No psychologist recruited. |
| **Rung 3 — Criterion validity** | Do flagged records fail in real cases? | 🟡 12 real cases collected. |
| **External validity** | Does it hold on real (non-constructed) records? | ⬜ Future. |

### The pilots — evidence collected (verified live)
| # | Pilot | What it collects | Evidence to date |
|---|---|---|---|
| 1 | **AI-Assisted Records Detection** (Study 011) | Reviewer reads on the 24-record set vs a verified key | **80 reads; 3 complete (Jake, Frank, Lawal), Saurabh 7/24, 6 registered** |
| 2 | **Bench Reliability** (Studies 003/004) | Expert + reviewer scoring of a shared record set | **8 experts + 13 reviewers, 108 labels, 10 records → AC1 0.74 / 0.63** |
| 3 | **Real-Case Criterion** (Study 010, Rung 3) | Real public cases + documented outcomes, in 3 domain pilots | **12 real cases: FOIL/Stacy 7, HR/Tanvi 5, Healthcare/Keith 0 (breakdown in §2)** |
| 4 | **Independent Review Challenge** (`independent-review-challenge.html`; data stored in the `extended_reviews` table) | Independent multi-record review | **Live, but 0 real submissions yet — 1 diagnostic-test row only** |

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

**Detection panel (24-record study)** — 3 complete, 1 in progress, 6 not started (10 registered):

| Code | Name | Country | Reads | Status |
|---|---|---|---|---|
| V-AI-01 | Jake McDonough | US | 24/24 | ✅ Complete |
| V-AI-03 | Frank Schouten | Australia | 24/24 | ✅ Complete |
| V-AI-10 | Lawal Olabanji | Nigeria | 24/24 | ✅ Complete |
| V-AI-07 | Saurabh Nanda | India | 7/24 | 🟡 In progress |
| V-AI-05 | Alankar Yaduvanshi | India | 0/24 | Not started |
| V-AI-06 | Dr Nitin Deshpande | India | 0/24 | Not started |
| V-AI-08 | Gabriela Cortez | US | 0/24 | Not started |
| V-AI-11 | Andrey Ekhmenin | Poland/EU | 0/24 | Not started |
| V-AI-12 | Kyle McMullan | UK/Ireland | 0/24 | Not started |
| V-AI-14 | Terra Shouse | US | 0/24 | Not started |

**Methodology:** M-01 **Ubayet Hossain, FRM** — Associate Director (Model Validation), KPMG India; 9+ years in credit/market-risk model development and validation. Contributed the reliability/validation framework (the Rung 1–2 statistics and floors). Credited in the analysis plan, both research PDFs, and the article.

**Rung 3 — Real-Case Criterion pilots (public determinations paired with documented outcomes):**

| Domain pilot | Contributor | Cases | Outcomes recorded | Last activity |
|---|---|---|---|---|
| Public Records / FOIL | Stacy Young (E-08) | **7** | challenged, failed appeal | 2026-07-06 |
| HR / Employment | Tanvi Pokhriyal (V-HR-01) | **5** | challenged, failed appeal, held up | 2026-06-22 |
| Healthcare Compliance | Keith Carrington, EJD, MBA (V-HC-01) | **0** | — | accepted, not started |

Total: **12 real cases** across two active domain pilots; the healthcare pilot is accepted but not yet started.

**Open seat:** organizational psychologist (construct validity) — not recruited.

**Flag:** E-03 Andrzej Skulski is registered as an expert; previously flagged as fringe — decide keep or remove.

---

## 3. Publications & live research platform

**Deployed to production (jrsstandard.com) — commit `2bdc8b9`, verified live:**
- research.html shows Early Results (reproducibility 84%, reliability AC1 0.74/0.63), Study 004 "Reviewer Reliability — Result reported", Study 009 "Dataset ready", and the methods-paper link. Duplicate research questions are deduped on display.
- Live findings feed: reproducibility (STUDY-001) and reliability (STUDY-004).
- Answer-key docs (`research/`) are deliberately NOT on production — `research/Verified_Key.md` returns 404. Blind study intact.

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
| 1 | Finish the 24-record detection study (2/9 done) | Nudge the 6 unfinished reviewers | You send / I draft |
| 2 | Recruit an organizational psychologist | Find one; hand over the data package (ready) | Not started |
| 3 | Publish Article 1 (Rungs 1 & 2) | See Section 5 below | Decide path |
| 4 | Real-case pilot (Rung 3) | Nudge Keith; get more cases | You send / I draft |
| 5 | Website 404s (~20% of traffic) | Send bad URLs from GA4 → I build redirects | You send URLs |
| 6 | Dewey / Peter Broida | Send the reply + blurb (drafted) | You |
| 7 | Rotate the exposed Supabase token | In the Supabase dashboard | You |

---

## 5. How to publish Article 1 (recommended order)

1. **Send it to Ubayet Hossain first** — he is the methodology author and is credited; he should review before anything external.
2. **Preprint** (Zenodo or SSRN) for a citable DOI and a dated record. Optional but low-cost.
3. **Practitioner journal** (Records Management Journal or ISACA Journal) — the realistic peer-reviewed home while accuracy is still preliminary.
4. **Hold full academic/conference submission** until the accuracy data matures.

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
