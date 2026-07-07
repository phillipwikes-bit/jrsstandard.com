# JRS / DRR — MASTER TRACKER
*The single source of truth. Verified against the live database. Open one file, see the whole board. Update this instead of trusting memory.*

Last verified against Supabase: this entry reflects a direct database read (not memory).

---

## 1. THE BIG PICTURE — the validation ladder

You are proving JRS works in stages ("rungs"). Each rung answers one question.

| Rung | Question it answers | Live status |
|---|---|---|
| **Rung 1 — Reproducibility** (Study 001) | Do 3 independent AI models (Anthropic Claude, OpenAI GPT, Google Gemini) give the SAME JRS read on the same record? | ✅ **LIVE RESULT: 84% cross-vendor agreement across 15 synthetic records** (nightly auto-run via `api/run-study.js`, updated 2026-07-06). Agreement ≠ accuracy ≠ validation. |
| **Rung 2a — Reliability** | Do independent human experts + reviewers agree when scoring records? | ✅ **Real data: 10 records, 8 experts + 16 reviewers. Experts AC1 = 0.74, reviewers AC1 = 0.63** |
| **Rung 2b — Accuracy / Detection** | On the 24-record set with a hidden key, can reviewers tell grounded from ungrounded? | 🟡 **2 of 9 reviewers complete; answer key independently verified 24/24** |
| **Rung 3 — Criterion validity** | Do real cases JRS flags actually fail in real life (appeals, audits)? | 🟡 **12 real cases collected (2 contributors); stalled** |
| **Construct validity** | Do the five conditions hold together as distinct things? | 🟡 **Per-condition DATA EXISTS (10 records × 21 raters, 108 rows, all 5 conditions scored) — exported to `construct_validity_data.csv`. Naming RECONCILED: codebook titles aligned to the standard's five names; authoritative crosswalk in `CONSTRUCT_VALIDITY_PACKAGE.md`. Remaining blocker: no psychologist recruited.** |

### Condition naming — now consistent (fixed)
**Canonical five conditions = the deployed standard** (`jrsstandard.html` + `codebook.html`): RC1 Reconstructability, RC2 Basis Identification, RC3 Chronology, RC4 Decision-Process Traceability, RC5 Evidentiary Sufficiency. (An alternate name set — Record Self-Sufficiency / Evidentiary Anchoring / Chronological Integrity — existed only in project notes and never on the live site; it has been dropped.) The live review instrument (`bench-review.html`) keeps its working keys unchanged **on purpose** — reviewers are mid-study, and renaming their form would break continuity with data already collected. Data keys map to the standard as:

| Data key (as collected) | Standard condition (canonical) |
|---|---|
| reasoning_traceability | RC1 Reconstructability |
| basis_identification | RC2 Basis Identification |
| temporal_reconstructability | RC3 Chronology |
| accountability_support | RC4 Decision-Process Traceability |
| cold_reviewer_clarity | RC5 Evidentiary Sufficiency |

> CORRECTION (this update): Rung 1 is the **3-AI-model reproducibility** study (Study 001), and it **has live data** (84%, 15 records). An earlier version of this tracker and the Article 1 draft wrongly said Rung 1 had "no data" — that was an error; the reproducibility study runs nightly and its result lives in the `findings` table, not in the human-rater tables.

### Rung 2 — methodology and floors (Ubayet Hossain, M-01)
Rung 2's methodology is the **pre-registered analysis plan** (`research/JRS_PreRegistered_Analysis_Plan.md`). Per Section 13, the **reference-panel design and the chance-corrected reliability framework are methodological contributions of Ubayet Hossain (Model Validation).** It specifies:
- **Reference-panel design:** answer key = expert-panel majority, fixed before accuracy is scored.
- **Chance-corrected reliability:** Gwet's AC1 primary (robust to the kappa paradox), Krippendorff's alpha + Fleiss' kappa reported alongside, all with 95% CIs.
- **Floor 1 (reliability):** expert AC1 ≥ 0.61, lower CI bound ≥ 0.41, computed on records **pooled across batches 1–4 (~26 records)**.
- **Floor 2 (detection/accuracy):** agreement with the held-out key on the 24-record set > 0.50 (lower CI > 0.50), target ≥ 0.70.

| Rung 2 part | Data now | vs Ubayet's floor |
|---|---|---|
| **2a Reliability** | 10 records: experts AC1 **0.74**, reviewers **0.63** | Experts **clear Floor 1 (0.61)** on data so far; full test needs batches 3–4 labeled (~26 pooled) |
| **2b Detection** | 24-record set, 2 of 9 reviewers complete | Floor 2 **not yet computable** — needs 4–5 complete |

The one result that unlocks selling: **does JRS catch what experienced reviewers miss?** That is "Arm B" of Rung 2b, and it is BUILT but NOT YET RUN.

---

## 2. PEOPLE REGISTRY (verified live)

### Detection panel — 24-record study (Rung 2b)
| Code | Name | Country | Reads | Status |
|---|---|---|---|---|
| V-AI-01 | Jake McDonough | US | 24/24 | ✅ Complete |
| V-AI-03 | Frank Schouten | Australia | 24/24 | ✅ Complete |
| V-AI-05 | Alankar Yaduvanshi | India | 0/24 | Registered, not started |
| V-AI-06 | Dr Nitin Deshpande | India | 0/24 | Registered, not started |
| V-AI-07 | Saurabh Nanda | India | 7/24 | 🟡 In progress |
| V-AI-08 | Gabriela Cortez | US (LatinX) | 0/24 | Registered, not started |
| V-AI-10 | Lawal Olabanji | Nigeria | 0/24 | Registered, not started |
| V-AI-11 | Andrey Ekhmenin | Poland/EU | 0/24 | Registered, not started |
| V-AI-12 | Kyle McMullan | UK/Ireland | 0/24 | Registered, not started |

### Bench experts (Rung 2a reliability) — named
E-08 Stacy Young · E-09 Dr Nitin Deshpande · E-10 Rahul Potdar · E-12 Saurabh Nanda · E-13 Frank Schouten · E-14 Alankar Yaduvanshi · E-03 Andrzej Skulski ⚠️(fringe theorist — review whether he should be a named expert)

### Real-case pilot contributors (Rung 3)
| Code | Name | Cases | Last activity |
|---|---|---|---|
| E-08 | Stacy Young | 7 | 2026-07-06 |
| V-HR-01 | Tanvi Pokhriyal | 5 | 2026-06-22 |
| V-HC-01 | Keith Carrington | 0 | Accepted, never started (healthcare) |
| V-IR-01 | Dr Nitin Deshpande | — | Independent-review pilot |

### Methodology & specialist seats
- **M-01 Ubayet Hossain** — validation/reliability methodology (Rungs 1–2). Credited in all methodology docs.
- **Organizational psychologist** — construct validity. **SEAT EMPTY. Not recruited. Data package not built.**

### Data hygiene flags
- Empty expert codes E-11, E-16–E-40 exist as unused placeholders (name = None).
- **E-03 Andrzej Skulski** is registered as an expert — previously flagged as a fringe theorist; decide keep or remove.

---

## 3. WHAT IS SAVED IN GIT (durable, won't be lost)
`research/` folder on branch `claude/html-pilot-L8rC3`:
- `MASTER_TRACKER.md` (this file)
- `PROJECT_STATE.md` — short state summary
- `JRS_PreRegistered_Analysis_Plan.md` — Rung 1/2 methodology (Ubayet Hossain credited)
- `DRR_Detection_Validation_Protocol.md` — detection methodology
- `JRS_Research_Paper.md` — full paper
- `DRR_Article.md` — DRR essay
- `Verified_Key.md` — answer key, independently verified 24/24
- `Intended_Key_authorside.md` — construction key
- `AnswerKey_Verification_Packet.md` — blind packet for human raters
- `OSF_PreRegistration.md` + `OSF_DEPOSIT_FORM.md` — pre-registration, ready to deposit
- `ArmB_Design.md` — the standard-vs-baseline test design
- `ai-records-arm-b.html` — Arm B page, built, staged (NOT live)

---

## 4. OPEN THREADS (nothing here is lost anymore)

| # | Thread | Status | Next action | Owner |
|---|---|---|---|---|
| 1 | **Finish Rung 2b detection** | 2/9 done | Nudge 6 reviewers to complete 24 records | You send / I draft |
| 2 | **Run Arm B** (the money question) | Built, not run | Deploy page + recruit experienced participants | Say "deploy Arm B" |
| 3 | **Organizational psychologist** | Seat empty | Recruit one; build their construct-validity data package | Not started |
| 4 | **Four-article plan** | Article 1 (Rungs 1+2) **DRAFTED, peer-review-revised, PDF built (`JRS_Reliability_Accuracy.pdf`), linked on research.html**. Articles 2–4 not yet drafted | Draft Articles 2–4 when their data matures | I draft |
| 5 | **Real-case pilot (Rung 3)** | 12 cases, stalled | Nudge Keith; get more cases from Stacy/Tanvi | You send / I draft |
| 6 | **OSF pre-registration** | Form ready | You log in and paste (optional, for publication) | You |
| 7 | **Dewey / Peter Broida** | Warm; awaiting author intros | Send the reply + blurb already drafted | You |
| 8 | **Website 404s (~20% of traffic)** | Diagnosed: site clean, bad links are external | Get exact bad URLs from GA4 → I build redirects | You send URLs |
| 9 | **Publication venue** | Advised: OSF → practitioner journal → FAccT | After Arm B result | Later |
| 10 | **Security: Supabase token** | Pasted in chat, exposed | Rotate it in Supabase dashboard | You |

### The four-article plan (recovered from the conversation, re-recorded here)
- **Article 1** — Rungs 1 + 2 combined: *Reliability and Accuracy of a Record-Level Review Standard*
- **Article 2** — FOIL / public-records pilot (contributor E-08)
- **Article 3** — third pilot (employment/HR — confirm scope)
- **Article 4** — Capstone: Rungs 1–3 plus the organizational-psychology construct-validity work

---

## 5. THE ONE THING THAT MATTERS MOST
Everything commercial depends on one unproven result: **does JRS help experienced reviewers catch documentation risk they would otherwise miss?** That is Arm B. It is built and waiting. Until it runs, hold off on marketing, benchmarks, and enterprise licensing.
