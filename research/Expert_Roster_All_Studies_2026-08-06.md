# Independent experts, all studies: names, titles, countries

**Built 2026-08-06. PRIVATE. `research/` is never deployed to production.**

**Downloadable copies:** `Expert_Roster_All_Studies_2026-08-06.csv` (all 56 rows), `Study004_Raters_2026-08-06.csv` (the 24 reliability raters), and `Expert_Roster_All_Studies_2026-08-06.docx`. All three regenerate from `research/build_expert_roster.py`, which re-verifies completion live on every run.

**Do not publish this list while Arm B is blind.** Naming an Arm B reviewer next to an Arm A reviewer in one public document identifies who was in which study, which is the exact leak the neutral "Records Review Study" recognition track exists to prevent. This file is for the owner, the acquisition data room, and the manuscript acknowledgments after the study closes.

**Source of truth.** Completion status pulled live from `pilot_progress` and `armb_progress` on 2026-08-06 via `research/check_completion.py`. Study 004 identities read directly from `bench_experts` with the service-role connection on 2026-08-06. Names, titles, and countries are from the roster tables in `research/MASTER_TRACKER.md` sections 12 and 12B, the recruit notes, `api/contributor.js`, and the two certificate registries. Nothing here is inferred.

**Totals: 53 international reviewers have graded records across three studies. 32 completed a full 24-record set. 35 named.**

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
| 7 | V-AI-11 | Andrey Ekhmenin | Founder, EAS; governance diagnostics and post-execution review | Poland |
| 8 | V-AI-12 | Kyle McMullan | Chief Audit Executive; internal audit and financial crimes; the audit hub, London | United Kingdom |
| 9 | V-AI-16 | Dr Gabriela Bar | Attorney, PhD; AI ethics advisor (EU); Gabriela Bar Law & AI | Poland |
| 10 | V-AI-20 | Hekim Colpan | AI Governance and Compliance Manager; ISO/IEC 42001 auditor; EU AI Act, GDPR, DORA | Germany |
| 11 | V-AI-23 | Niloofar Kandi | AI Governance and Strategy Specialist; ISO/IEC 42001 Lead Implementer; PhD Researcher in AI Governance, University of Wollongong | Australia |
| 12 | V-AI-24 | SungSoo In | AI Governance and Responsible AI; author of the Athena Governance Architecture | South Korea |
| 13 | V-AI-27 | Sidharth Borah | Advocate, High Court of Delhi (13+ years); Partner, Gurinder & Partners; litigation and legal defensibility | India |
| 14 | V-AI-28 | Nigel Hee | AI Ethics, Safety and Governance; AI Policy; Co-founder, OpenNexus; researcher, University of Glasgow | Singapore |
| 15 | V-AI-29 | Marguerite Maroudis, PhD | AI and Law Expert; DPO and AI Governance Consultant; PhD Private Law; Founder, TechLegalExperts | UAE (Dubai) |
| 16 | V-AI-30 | Andres Lage Freire | AI Governance Lead and Responsible AI Architect; EU AI Act, ISO 42001; SDLC-native governance | Spain (Madrid) |

**Arm A countries: 11.** US, Australia, India, Nigeria, Poland, United Kingdom, Germany, South Korea, Singapore, UAE, Spain. This is the figure the manuscript uses for the detection panel.

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
| 22 | RR-110 | Jean-Luc Adade | Regional IT Leader, West, Central and North Africa; multi-country IT operations, IT governance, digital transformation; 10+ years | Cote d'Ivoire | B2 |
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

**Arm B countries among the 14 named: 9.** US, South Africa, Canada, Iran, Australia, Singapore, Nigeria, Kenya, Cote d'Ivoire.

---

## Study 004: Reviewer reliability - 24 rater codes, expert raters now named

Read from `bench_experts` with the service-role connection on 2026-08-06. Every expert-rater identity is recovered except E-11, which carries one label and no identity row. The sixteen `R-` codes were generated in the reviewer's own browser by `bench-review.html` and were never attached to an identity, so those are anonymous by design and no name exists to recover.

**Three of these codes are the same people as Arm A completers.** E-09 is Dr Nitin Deshpande (V-AI-06), E-12 is Saurabh Nanda (V-AI-07), E-13 is Frank Schouten (V-AI-03). They sat on the detection panel and also rated the reliability set, so each is one human being holding two study codes. E-14, Alankar Yaduvanshi, holds V-AI-05 but never started Arm A, so he is a distinct person from the 32.

Country is taken from the affiliation field where the affiliation names a place. E-03's affiliation names no country, so it is left unrecorded rather than inferred from the name.

| # | Code | Class | Name | Title | Country |
|---|---|---|---|---|---|
| 33 | E-08 | expert rater | Stacy Young | Deputy Records Access Officer, NYC Dept. of Housing Preservation and Development; records governance and FOIL administration; 22 years | US |
| 34 | R-mqa2qg2g9gtz | bench reviewer | *anonymous by design* | self-declared domain: AI Governance | not recorded |
| 35 | R-mqa4a9ewsfr8 | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 36 | E-03 | expert rater | Andrzej Skulski | Founder, Dom Ciszy - Resonance Lab; AI Governance and Decision Systems | not recorded |
| 37 | R-mqal7tzzwpy5 | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 38 | R-mqb8ye82rcmw | bench reviewer | *anonymous by design* | self-declared domain: AI Governance | not recorded |
| 39 | R-mqbsllcmqh6n | bench reviewer | *anonymous by design* | self-declared domain: HR | not recorded |
| 40 | R-mqc70xbh96yc | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 41 | R-mqcfb4p9lbji | bench reviewer | *anonymous by design* | self-declared domain: HR | not recorded |
| 42 | E-09 | expert rater | Dr Nitin Deshpande **(same person as V-AI-06)** | Chief Human Resources Officer, Cooper Corporation Pvt. Ltd.; 38+ years HR and industrial relations | India |
| 43 | R-mqgufe1fqup8 | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 44 | R-mqhv2o4r8nct | bench reviewer | *anonymous by design* | self-declared domain: AI Governance | not recorded |
| 45 | R-mqifd9ia9dsq | bench reviewer | *anonymous by design* | self-declared domain: AI Governance | not recorded |
| 46 | R-mqkvqo8kcu04 | bench reviewer | *anonymous by design* | self-declared domain: Quality Assurance | not recorded |
| 47 | E-10 | expert rater | Rahul Potdar | Independent Director (IICA Certified); Corporate Governance, Risk Management and ESG Strategy; Board Adviser; Leontra Technologies; IIM Raipur | India |
| 48 | R-mqmhtalpwuhb | bench reviewer | *anonymous by design* | self-declared domain: Management | not recorded |
| 49 | R-mqn414vzho7i | bench reviewer | *anonymous by design* | self-declared domain: Management | not recorded |
| 50 | R-mqnibu38bbxi | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 51 | R-mqq7jo173iob | bench reviewer | *anonymous by design* | self-declared domain: Other | not recorded |
| 52 | E-11 | expert rater | *no identity on record* | self-declared domain: AI Governance | not recorded |
| 53 | R-mqxqi8i3ukt1 | bench reviewer | *anonymous by design* | self-declared domain: Inny | not recorded |
| 54 | E-14 | expert rater | Alankar Yaduvanshi | Data Privacy Professional (CIPP-E), WNS; 8+ years data privacy and corporate compliance | India |
| 55 | E-13 | expert rater | Frank Schouten **(same person as V-AI-03)** | AI Governance and Assurance; Interim Steering Committee, AI Execution Governance Forum; CAMA-certified ISO 55001 assessor | Australia (Perth) |
| 56 | E-12 | expert rater | Saurabh Nanda **(same person as V-AI-07)** | General Manager, APAC Business Leader, Align Technology; 22+ years P&L leadership | India |

**Totals: 8 expert raters (7 named, 1 with no identity row), 16 anonymous bench reviewers, 124 labels on the shared 5-record set.**

**New people this study adds to the programme: 4.** Andrzej Skulski, Stacy Young, Rahul Potdar, Alankar Yaduvanshi. The other three named expert raters are already counted among the 32 completers, and E-11 is excluded because it cannot be resolved to a person.

---

## Combined

| | Count |
|---|---|
| **International reviewers who have graded records, all three studies** | **53** |
| Completed a full 24-record set (Studies 011 and 012) | 32 |
| Graded records but not yet a full set | 1 (RR-108, Archana Dhinakaran, 9 of 24) |
| Study 004 expert raters who are NOT already counted | 4 |
| Anonymous bench reviewers (Study 004) | 16 |
| Rater codes held by someone already counted | 3 (E-09, E-12, E-13) |
| Codes that cannot be resolved to a person | 1 (E-11) |
| Named people | **35** |
| Anonymous by their own choice | 2 (RR-130, RR-132) |
| Anonymous by design, no identity ever captured | 16 (the `R-` bench pool) |
| Distinct countries across the 32 completers | **16** |

**53 is a distinct-human count on a graded-records basis.** The public sentence says reviewers have graded records, so the figure counts everyone who submitted at least one graded read rather than only those who finished a full set. That is 16 in Arm A, 17 in Arm B, 4 Study 004 expert raters the other studies never touched, and the 16 anonymous bench reviewers. E-11 stays out because one label and a null identity row cannot be resolved to a person; counting it would give 54. Reproduce with `research/count_participants.py`.

**The 32 completers span 16 countries, not 11.** US, Australia, India, Nigeria, Poland, United Kingdom, Germany, South Korea, Singapore, UAE, Spain, South Africa, Canada, Iran, Kenya, Cote d'Ivoire. Eleven is the Study 011 detection-panel figure. It is correct for the 16-person panel, which is how the manuscript, research.html and pilot.html use it, and it was wrongly carried onto all 32 in the gate copy. Corrected in public copy on 2026-08-06.

**Both country gaps are now closed.** Jean-Luc Adade's country is Cote d'Ivoire, supplied by the owner on 2026-08-06, replacing the "West Africa" region entry. Kyle McMullan's earlier "UK / Ireland" entry resolved to the United Kingdom from his `bench_experts` affiliation, "the audit hub (London, United Kingdom)". Every one of the 30 named completers now carries a country; the only two without one are the two anonymous Arm B participants.

---

## Not in this list, and why

**Arm A registrants who never started: 11.** V-AI-05 Alankar Yaduvanshi, V-AI-14 Terra Shouse, V-AI-15 Yetunde Adesiyan, V-AI-17 Shakiba Mahvash, V-AI-18 Saad Farooq, V-AI-19 Sanya Dalal, V-AI-21 Tarun Samtani, V-AI-22 Ilya Diankoff, V-AI-25 David Grannum, V-AI-26 Anant Rai, V-AI-31 Alexandria Davis. Registered, zero reads.

**Arm B in progress: 1.** RR-108, Archana Dhinakaran, India (Puducherry), at 9 of 24.
