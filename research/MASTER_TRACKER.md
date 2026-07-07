# JRS / DRR — MASTER TRACKER

*Single source of truth. All figures verified against the live database, not memory. Update this file instead of relying on chat history.*

---

## 1. Validation ladder — where each stage stands

| Stage | Question | Status |
|---|---|---|
| **Rung 1 — Reproducibility** | Do 3 independent AI models (Claude, GPT, Gemini) give the same JRS read on the same record? | ✅ 84% agreement across 15 records. Auto-runs nightly. |
| **Rung 2a — Reliability** | Do independent human reviewers agree with each other? | ✅ Experts AC1 0.74, reviewers 0.63 (10 records). |
| **Rung 2b — Accuracy** | Can reviewers match a hidden answer key on 24 records? | 🟡 2 of 9 reviewers done. Key verified 24/24. |
| **Construct validity** | Are the five conditions distinct dimensions? | 🟡 Data ready (108 rows). No psychologist recruited. |
| **Rung 3 — Criterion validity** | Do flagged records fail in real cases? | 🟡 12 real cases collected. Stalled. |
| **External validity** | Does it hold on real (non-constructed) records? | ⬜ Future. |

**The single unproven result everything commercial depends on:** does JRS help experienced reviewers catch problems they would otherwise miss? This is the *comparison test* (experienced people with the checklist vs. without). It is built but not yet run.

---

## 2. People

**Detection panel (24-record study)** — 2 complete, 1 in progress, 6 registered-not-started:

| Code | Name | Country | Reads | Status |
|---|---|---|---|---|
| V-AI-01 | Jake McDonough | US | 24/24 | ✅ Complete |
| V-AI-03 | Frank Schouten | Australia | 24/24 | ✅ Complete |
| V-AI-07 | Saurabh Nanda | India | 7/24 | 🟡 In progress |
| V-AI-05 | Alankar Yaduvanshi | India | 0/24 | Not started |
| V-AI-06 | Dr Nitin Deshpande | India | 0/24 | Not started |
| V-AI-08 | Gabriela Cortez | US | 0/24 | Not started |
| V-AI-10 | Lawal Olabanji | Nigeria | 0/24 | Not started |
| V-AI-11 | Andrey Ekhmenin | Poland/EU | 0/24 | Not started |
| V-AI-12 | Kyle McMullan | UK/Ireland | 0/24 | Not started |

**Methodology:** M-01 **Ubayet Hossain** — reliability/validation framework (the Rung 1–2 statistics and floors). Credited in the analysis plan, both research PDFs, and the article.

**Real-case contributors (Rung 3):** Stacy Young (7 cases), Tanvi Pokhriyal (5), Keith Carrington (0, healthcare).

**Open seat:** organizational psychologist (construct validity) — not recruited.

**Flag:** E-03 Andrzej Skulski is registered as an expert; previously flagged as fringe — decide keep or remove.

---

## 3. Publications

| Paper | Covers | File | State |
|---|---|---|---|
| The Justification Review Standard | Full framework | `JRS_Research_Paper.pdf` | On research page (staged) |
| Reliability & Accuracy (Rungs 1 & 2) | Repro + reliability + prelim accuracy | `JRS_Reliability_Accuracy.pdf` | Drafted, peer-review-revised, linked (staged) |
| Decision Reconstruction Risk | The concept (essay) | `DRR_Article.pdf` | Live |

Articles 2–4 (FOIL pilot; HR pilot; capstone with construct validity) — planned, not drafted.

---

## 4. Open threads

| # | Thread | Next action | Owner |
|---|---|---|---|
| 1 | Finish the 24-record detection study (2/9 done) | Nudge the 6 unfinished reviewers | You send / I draft |
| 2 | Run the comparison test (checklist vs. no checklist) | Deploy the page + recruit participants | Say "deploy" |
| 3 | Recruit an organizational psychologist | Find one; hand over the data package (ready) | Not started |
| 4 | Publish Article 1 (Rungs 1 & 2) | See Section 5 below | Decide path |
| 5 | Real-case pilot (Rung 3) | Nudge Keith; get more cases | You send / I draft |
| 6 | Website 404s (~20% of traffic) | Send bad URLs from GA4 → I build redirects | You send URLs |
| 7 | Dewey / Peter Broida | Send the reply + blurb (drafted) | You |
| 8 | Rotate the exposed Supabase token | In the Supabase dashboard | You |

---

## 5. How to publish Article 1 (recommended order)

1. **Send it to Ubayet Hossain first** — he is the methodology author and is credited; he should review before anything external.
2. **Preprint** (Zenodo or SSRN) for a citable DOI and a dated record. Optional but low-cost.
3. **Practitioner journal** (Records Management Journal or ISACA Journal) — the realistic peer-reviewed home while accuracy is still preliminary.
4. **Hold full academic/conference submission** until the accuracy data and the comparison test mature.

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
