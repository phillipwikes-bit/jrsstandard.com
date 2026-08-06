# Independent experts, all studies: names, titles, countries

**Built 2026-08-06. PRIVATE. `research/` is never deployed to production.**

**Downloadable copies:** `Expert_Roster_All_Studies_2026-08-06.csv` (all 56 rows), `Study004_Raters_2026-08-06.csv` (the 24 reliability raters), and `Expert_Roster_All_Studies_2026-08-06.docx`. All three regenerate from `research/build_expert_roster.py`, which re-verifies completion live on every run.

**Do not publish this list while Arm B is blind.** Naming an Arm B reviewer next to an Arm A reviewer in one public document identifies who was in which study, which is the exact leak the neutral "Records Review Study" recognition track exists to prevent. This file is for the owner, the acquisition data room, and the manuscript acknowledgments after the study closes.

**Source of truth.** Completion status pulled live from `pilot_progress` and `armb_progress` on 2026-08-06 via `research/check_completion.py`. Names, titles, and countries are from the roster tables in `research/MASTER_TRACKER.md` sections 12 and 12B, the recruit notes, `api/contributor.js`, and the two certificate registries. Nothing here is inferred.

**Totals: 56 reviewers across three studies. 32 completed a full 24-record set. 31 named.**

---

## Study 011: Detection panel (Arm A) — 16 completers, all named

| # | Code | Name | Title | Country |
|---|---|---|---|---|
| 1 | V-AI-01 | Jake McDonough | AI governance, self-accountable AI runtimes; SAEONYX Global Holdings | US |
| 2 | V-AI-03 | Frank Schouten | AI Governance and Assurance; risk and accountability; AEGF | Australia |
| 3 | V-AI-06 | Dr Nitin Deshpande | Chief Human Resources Officer; 38+ years HR and industrial relations | India |
| 4 | V-AI-07 | Saurabh Nanda | General Manager, APAC business leader (P&L); Align Technology | India |
| 5 | V-AI-08 | Gabriela Cortez | Civil-rights records and bilingual intake; Maryland Commission on Civil Rights | US |
| 6 | V-AI-10 | Lawal Olabanji | Operations and records management; ALTV Engineering | Nigeria |
| 7 | V-AI-11 | Andrey Ekhmenin | Founder, EAS; governance diagnostics and post-execution review | Poland / EU |
| 8 | V-AI-12 | Kyle McMullan | Chief Audit Executive; internal audit and financial crimes | UK / Ireland |
| 9 | V-AI-16 | Dr Gabriela Bar | Attorney, PhD; AI ethics advisor (EU); Gabriela Bar Law & AI | Poland / EU |
| 10 | V-AI-20 | Hekim Colpan | AI Governance and Compliance Manager; ISO/IEC 42001 auditor; EU AI Act, GDPR, DORA | Germany |
| 11 | V-AI-23 | Niloofar Kandi | AI Governance and Strategy Specialist; ISO/IEC 42001 Lead Implementer; PhD Researcher in AI Governance, University of Wollongong | Australia |
| 12 | V-AI-24 | SungSoo In | AI Governance and Responsible AI; author of the Athena Governance Architecture | South Korea |
| 13 | V-AI-27 | Sidharth Borah | Advocate, High Court of Delhi (13+ years); Partner, Gurinder & Partners; litigation and legal defensibility | India |
| 14 | V-AI-28 | Nigel Hee | AI Ethics, Safety and Governance; AI Policy; Co-founder, OpenNexus; researcher, University of Glasgow | Singapore |
| 15 | V-AI-29 | Marguerite Maroudis, PhD | AI and Law Expert; DPO and AI Governance Consultant; PhD Private Law; Founder, TechLegalExperts | UAE (Dubai) |
| 16 | V-AI-30 | Andres Lage Freire | AI Governance Lead and Responsible AI Architect; EU AI Act, ISO 42001; SDLC-native governance | Spain (Madrid) |

**Arm A countries: 11.** US, Australia, India, Nigeria, Poland, UK/Ireland, Germany, South Korea, Singapore, UAE, Spain.

---

## Study 012: Randomized comparison (Arm B) — 16 completers, 14 named

Arm assignment is by deterministic hash of the participant code, made before any record is judged. Nobody was steered into an arm.

| # | Code | Name | Title | Country | Arm |
|---|---|---|---|---|---|
| 17 | RR-101 | Boris Khazin | AI Governance, Digital Risk and GRC leader; ClearView MRI; ex-EPAM Global Head of DRM/GRC; EU AI Act, DORA, NIST AI RMF | US (North Carolina) | B2 |
| 18 | RR-104 | Donavine Smith, MBA | Chief Strategy and Transformation Officer; frontier AI strategy and governance; NED, Rape Crisis Cape Town Trust | South Africa (Pretoria) | B1 |
| 19 | RR-106 | Nicholas Evans | AI Governance and Runtime Auditor; adversarial and non-adversarial testing; ex-USMC | US | B1 |
| 20 | RR-107 | Tuneer Mondal | AI, HealthTech and Governance; Consultant, Operations and AI Solutions; AI Governance Taskforce researcher, Arcadia Impact; University of Cambridge | Canada (Waterloo) | B2 |
| 21 | RR-109 | Mostafa Mahmoudi | AI Governance Researcher; Founder and Director, Iran Tech Diplomacy Institute; PhD candidate, Technology Governance, University of Tehran | Iran (Tehran) | B2 |
| 22 | RR-110 | Jean-Luc Adade | Regional IT Leader, West, Central and North Africa; multi-country IT operations, IT governance, digital transformation; 10+ years | West Africa | B2 |
| 23 | RR-114 | MacKenzie McCowan | AI Governance Specialist, Atomi; PhD candidate, University of Sydney; Sessional Lecturer, Avondale University; former Student Appeals Panel member, University of Sydney | Australia (Sydney) | B2 |
| 24 | RR-116 | Dr. Eric J. W. Orlowski | AI Governance Specialist, Ethnographer, Tech Policy Researcher; Research Fellow, NUS Artificial Intelligence Institute; PhD Social and Cultural Anthropology, UCL | Singapore | B2 |
| 25 | RR-121 | Dr Sharon Licqurish, PhD | CEO, Chief Scientist and AI Governance Architect, AIIP | Australia (Melbourne) | B2 |
| 26 | RR-123 | Greg Searle | AI Governance and Model Behaviour Researcher; Master's candidate | Australia (Brisbane) | B2 |
| 27 | RR-124 | Adesh Sharma | Data and AI Governance Leader, Digital Frontier Partners; IAPP AIGP | Australia (Melbourne) | B1 |
| 28 | RR-125 | Muhammad Dauda | Programme leadership, sustainability and governance; UN SDSN Youth Nigeria; Miva Open University; PgMP | Nigeria | B2 |
| 29 | RR-126 | Joseph Mungai | Public-Interest Technology and AI Ethics/Governance Professional; independent research and projects; Maasai Mara University | Kenya (Kitale) | B1 |
| 30 | RR-128 | Sagarika Banerjee | AI Governance and Software QA Leader; ISO/IEC 42001, NIST AI RMF | Canada (Toronto) | B1 |
| 31 | RR-130 | *Anonymous by choice* | JRS-naive expert professional | not recorded | B2 |
| 32 | RR-132 | *Anonymous by choice* | JRS-naive expert professional | not recorded | B2 |

**Arm split: B1 (five conditions) 5, B2 (unaided baseline) 11.**

**Arm B countries among the 14 named: 9.** US, South Africa, Canada, Iran, Australia, Singapore, Nigeria, Kenya, plus one recorded only as the West Africa region.

---

## Study 004: Reviewer reliability — 24 raters, 1 named

**The names for this study do not exist in reachable form, and no field below is guessed.** `bench_labels` is the only place this study's participation is recorded, and it stores a labeler code, a self-declared domain, and the labels. It stores no name, no title, and no country. `bench_experts`, which would carry the `E-` code identities, returns zero rows through the anon key, so those eight names need a service-role read from the Supabase dashboard. The sixteen `R-` codes were generated in the reviewer's own browser by `bench-review.html` and were never attached to an identity at all, so for those sixteen no name exists anywhere to recover.

The one identity on the study record is E-08.

| # | Code | Class | Name | Self-declared domain or title | Country |
|---|---|---|---|---|---|
| 33 | E-08 | expert rater | Stacy Young | Records Governance Advisor; Public-Records Domain Lead; Deputy Records Access Officer | US |
| 34 | R-mqa2qg2g9gtz | bench reviewer | *anonymous by design* | self-declared domain: AI Governance | not recorded |
| 35 | R-mqa4a9ewsfr8 | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 36 | E-03 | expert rater | *not recorded* | self-declared domain: AI Governance | not recorded |
| 37 | R-mqal7tzzwpy5 | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 38 | R-mqb8ye82rcmw | bench reviewer | *anonymous by design* | self-declared domain: AI Governance | not recorded |
| 39 | R-mqbsllcmqh6n | bench reviewer | *anonymous by design* | self-declared domain: HR | not recorded |
| 40 | R-mqc70xbh96yc | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 41 | R-mqcfb4p9lbji | bench reviewer | *anonymous by design* | self-declared domain: HR | not recorded |
| 42 | E-09 | expert rater | *not recorded* | self-declared domain: HR | not recorded |
| 43 | R-mqgufe1fqup8 | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 44 | R-mqhv2o4r8nct | bench reviewer | *anonymous by design* | self-declared domain: AI Governance | not recorded |
| 45 | R-mqifd9ia9dsq | bench reviewer | *anonymous by design* | self-declared domain: AI Governance | not recorded |
| 46 | R-mqkvqo8kcu04 | bench reviewer | *anonymous by design* | self-declared domain: Quality Assurance | not recorded |
| 47 | E-10 | expert rater | *not recorded* | self-declared domain: Compliance | not recorded |
| 48 | R-mqmhtalpwuhb | bench reviewer | *anonymous by design* | self-declared domain: Management | not recorded |
| 49 | R-mqn414vzho7i | bench reviewer | *anonymous by design* | self-declared domain: Management | not recorded |
| 50 | R-mqnibu38bbxi | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 51 | R-mqq7jo173iob | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 52 | E-11 | expert rater | *not recorded* | self-declared domain: AI Governance | not recorded |
| 53 | R-mqxqi8i3ukt1 | bench reviewer | *anonymous by design* | self-declared domain: Inny | not recorded |
| 54 | E-14 | expert rater | *not recorded* | self-declared domain: Compliance / Data Privacy | not recorded |
| 55 | E-13 | expert rater | *not recorded* | self-declared domain: AI Governance | not recorded |
| 56 | E-12 | expert rater | *not recorded* | self-declared domain: Management | not recorded |

**Totals: 8 expert raters, 16 bench reviewers, 124 labels on the shared 5-record set.**

**To recover the seven remaining `E-` names**, open the Supabase table editor and read `bench_experts` with the service-role key, matching on `code`. That is the only route: it is a single table read, and it cannot be done from the anon key this repository ships with. Once read, add them to `S004_KNOWN` in `research/build_expert_roster.py` and re-run it; both CSVs regenerate.

---

## Combined

| | Count |
|---|---|
| Reviewers across all three studies | **56 rows** (48 is the published floor, see below) |
| Completed a full 24-record set (Studies 011 and 012) | **32** |
| Study 004 raters | **24** (8 expert, 16 bench) |
| Named | **31** (30 completers plus E-08) |
| Anonymous by their own choice | **2** (RR-130, RR-132) |
| Anonymous by design, no identity ever captured | **16** (the `R-` bench pool) |
| Name exists but needs a service-role read | **7** (E-03, E-09, E-10, E-11, E-12, E-13, E-14) |
| Distinct countries recorded | **15**, plus one regional entry |

**Why the site publishes 48 and not 56.** Codes are issued per study, so a person who sat on the panel and also rated the reliability set holds two codes. Arm A and Arm B are disjoint by design, and the 16 bench reviewers are a separately recruited pool, but the 8 `E-` raters may overlap the panel, so they are excluded from the published figure entirely. 48 holds even in the worst case. See `research/count_participants.py`.

Countries: US, Australia, India, Nigeria, Poland, UK/Ireland, Germany, South Korea, Singapore, UAE, Spain, South Africa, Canada, Iran, Kenya, plus West Africa recorded as a region rather than a country.

**Two recording imprecisions, stated rather than smoothed over.** Kyle McMullan is recorded as "UK / Ireland" and Jean-Luc Adade as "West Africa", so neither resolves to a single country in the study record. The published "11 countries" figure is the Arm A panel figure and is unaffected by both.

---

## Not in this list, and why

**Arm A registrants who never started: 11.** V-AI-05 Alankar Yaduvanshi, V-AI-14 Terra Shouse, V-AI-15 Yetunde Adesiyan, V-AI-17 Shakiba Mahvash, V-AI-18 Saad Farooq, V-AI-19 Sanya Dalal, V-AI-21 Tarun Samtani, V-AI-22 Ilya Diankoff, V-AI-25 David Grannum, V-AI-26 Anant Rai, V-AI-31 Alexandria Davis. Registered, zero reads.

**Arm B in progress: 1.** RR-108, Archana Dhinakaran, India (Puducherry), at 9 of 24.
