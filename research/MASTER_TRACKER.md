# JRS / DRR: MASTER TRACKER

*Single source of truth. All figures verified against the live database, not memory. Update this file instead of relying on chat history. Last full reconciliation against the live DB and production site: 2026-07-14. Training-funnel figures re-pulled live 2026-07-15 (access gate now live; see below).*

*Live snapshot (detection/bench/real-case as of 2026-07-14 pull; training re-pulled 2026-07-15 via `/api/enroll-stats` + roster): detection panel 26 registered, 7 complete, 1 in progress (Saurabh 7/24), 18 not started, 200 read-rows (SungSoo 48 and Jake 25 include resubmissions); Arm B RR-101 (Boris, arm B2) complete 24/24, RR-102 and RR-103 assigned with 0 reads; real-case Rung 3 has 12 cases across 2 contributors (FOIL/E-08 7 cases, HR/V-HR-01 5 cases); **training enrollments 4, completions 1** (Jake, Lawal, Boris via `?src=panel`; Nicholas Evans enrolled+completed 2026-07-14). The reliability figures (Gwet's AC1 0.74 experts / 0.63 reviewers, 108 labels, 10 records) are from the fixed, pre-registered Rung 2a analysis and were not re-derived in this reconciliation.*

---

**Document conventions (enforced 2026-07-10):** Do not use long dashes (em or en dashes) anywhere in this file, or in any copy produced for JRS (connection notes, invitations, prospectuses, site prose). Use a colon, comma, or parentheses instead. This mirrors the house rule in CLAUDE.md and a standing instruction from Phillip.

**Standing directive (Phillip, 2026-07-15): every time this tracker is updated, deliver a fresh copy of the file to Phillip in the same turn (attach `research/MASTER_TRACKER.md`), without being asked again.** Applies whenever any edit is made to this file, not only on an explicit "provide copy" request.

**Standing directive (Phillip, 2026-07-13):** always take whatever legitimate steps raise IP value and move toward a sale. Operating plan and prioritized path: `research/IP_Sale_Playbook.md`. Integrity rule governs all of it: only real, verifiable assets and claims (diligence tests every number).

**Authorship policy (enforced 2026-07-11):** Reviewers who complete the study are recognized as named contributors only (certificate, named international panel, acknowledgment in any write-up). They are NOT offered co-authorship. Co-authorship is reserved for the specific collaborators doing substantial analysis or writing (currently Stacy Young on the FOIL paper; Sanya Dalal, pending, on the Business Ethics paper; and Ubayet Hossain, offered 2026-07-14 and pending, as co-author on EACH paper that uses his methodology across HR, compliance, and AI governance, for the reliability/validation methodology he designed). Integrity guardrail: his co-authorship on any given paper is legitimate only if he reviews and signs off on that specific manuscript (the offer message commits to sending each draft for his review), which keeps it earned authorship, not courtesy. Future prospectuses omit the co-authorship line entirely: the recognition section ends at "Featured by name among the international panel of professionals in any publication or write-up." with no co-author clause.

**Acknowledgment is not endorsement (clarified 2026-07-13, prompted by Marguerite Maroudis, PhD):** naming a reviewer reflects participation in the validation study only. Reviewers are credited as independent reviewers or contributors, never as endorsers or validators of JRS. Attribution is opt-in, reviewers approve the exact public wording before it appears, and may withdraw before publication. This distinction is now stated in the prospectus consent section.

**Open co-authorship item:** SungSoo In (V-AI-24) received the earlier conditional offer and has been given a genuine "maybe" (2026-07-11): revisit once the initial detection results are in. He has consented to named panel recognition. If authorship is ultimately not shared, convert his recognition to acknowledged contributor, not a writing seat.

**Hekim Colpan (V-AI-20), 2026-07-13:** sent Phillip a reciprocal LinkedIn recommendation (received; Phillip should accept/publish it) and offered to stay involved and contribute to the analysis and development. Same handling as SungSoo: welcome his continued input, no co-authorship promised; revisit only if a substantial written contribution arises. His voluntary recommendation is his own endorsement (fine and valuable); distinct from our naming him, which remains participation-only.

## 1. Validation ladder: where each stage stands

| Stage | Question | Status |
|---|---|---|
| **Rung 1: Reproducibility** | Do 3 independent AI models (Claude, GPT, Gemini) give the same JRS read on the same record? | ✅ 84% agreement across 15 records. Auto-runs nightly. |
| **Rung 2a: Reliability** | Do independent human reviewers agree with each other? | ✅ Experts AC1 0.74, reviewers 0.63 (10 records). |
| **Rung 2b: Accuracy** | Can reviewers match a hidden answer key on 24 records? | 🟡 7 of 26 reviewers complete (Jake, Frank, Lawal, Andrey, Hekim, Kyle, SungSoo); Saurabh 7/24. Key verified 24/24. |
| **Construct validity** | Are the five conditions distinct dimensions? | 🟡 Data ready (108 rows). No psychologist recruited. |
| **Rung 3: Criterion validity** | Do flagged records fail in real cases? | 🟡 12 real cases collected. |
| **External validity** | Does it hold on real (non-constructed) records? | ⬜ Future. |

### The pilots: evidence collected (verified live)
| # | Pilot | What it collects | Evidence to date |
|---|---|---|---|
| 1 | **AI-Assisted Records Detection** (Study 011) | Reviewer reads on the 24-record set vs a verified key | **200 read-rows (SungSoo and Jake include resubmissions); 7 complete (Jake, Frank, Lawal, Andrey, Hekim, Kyle, SungSoo), Saurabh 7/24, 26 registered** (reconciled live 2026-07-14) |
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

**Detection panel (24-record study)**: 7 complete, 1 in progress, 18 not started (26 registered):

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
| V-AI-12 | Kyle McMullan | Chief Audit Executive; internal audit & financial crimes | UK/Ireland | 24/24 | ✅ Complete |
| V-AI-14 | Terra Shouse | Risk analysis & regulatory compliance (FMEA), independent | US | 0/24 | Not started |
| V-AI-15 | Yetunde Adesiyan | Senior Manager Internal Audit (CISA, CISSP, FCCA), Tate & Lyle | UK | 0/24 | Not started |
| V-AI-16 | Dr Gabriela Bar | Attorney, PhD; AI ethics advisor (EU), Gabriela Bar Law & AI | Poland/EU | 0/24 | Not started |
| V-AI-17 | Shakiba Mahvash | AI & Law researcher (governance & liability), Islamic Azad University | Iran | 0/24 | Not started |
| V-AI-18 | Saad Farooq | Regulatory & Public Policy Leader, AI governance (e& / Etisalat) | UAE | 0/24 | Not started |
| V-AI-19 | Sanya Dalal (Expert Panel) | Ethics & Compliance; investigations (LLB, MBL, CFE), GE Vernova | India | 0/24 | Not started |
| V-AI-21 | Tarun Samtani (Expert Panel) | Senior Director, Data & AI Governance; global DPO (CIPM, AIGP, CIPP/A) | Singapore | 0/24 | Not started |
| V-AI-22 | Ilya Diankoff | Investigations & corporate due diligence (certified PI; SCCE member) | UK | 0/24 | Not started |
| V-AI-23 | Niloofar Kandi | AI Governance & Strategy Specialist; ISO/IEC 42001 Lead Implementer; PhD Researcher in AI Governance (University of Wollongong) | Australia | 0/24 | Not started |
| V-AI-24 | SungSoo In (Expert Panel) | AI Governance & Responsible AI; author of the Athena Governance Architecture (Runtime Governance, Authority Drift, accountable Governance Records) | South Korea | 24/24 | ✅ Complete |
| V-AI-25 | David Grannum (Expert Panel) | Founder, IsleConnect / Vectis ONE; "Sovereign AI" mesh, human-in-the-loop review (note: AI product founder: adjacent commercial interest; keep JRS vendor-neutral) | UK (Isle of Wight) | 0/24 | Not started |
| V-AI-26 | Anant Rai | Information & Cyber Security and Data Privacy Leader (14+ yrs; IT GRC, NIST CSF, risk & compliance) | India | 0/24 | Invited |
| V-AI-27 | Sidharth Borah | Advocate, High Court of Delhi (13+ yrs); Partner, Gurinder & Partners; litigation & legal defensibility | India | 0/24 | Not started |
| V-AI-28 | Nigel Hee | AI Ethics, Safety & Governance; AI Policy; Co-founder OpenNexus; researcher, University of Glasgow | Singapore | 0/24 | Not started |
| V-AI-29 | Marguerite Maroudis, PhD | AI & Law Expert; DPO & AI Governance Consultant; contract law; PhD Private Law; Founder, TechLegalExperts (Arabic/English/French) | UAE (Dubai) | 0/24 | Invited |
| V-AI-30 | Andres Lage Freire (Expert Panel) | AI Governance Lead / Responsible AI Architect; Responsible AI & Gen AI, RAG, EU AI Act, ISO 42001; SDLC-native governance; Harvard exec-ed | Spain (Madrid) | 0/24 | Registered 2026-07-13 via the token-free `/api/register` endpoint (service-role); not started |

**Methodology:** M-01 **Ubayet Hossain, FRM**: Associate Director (Model Validation), KPMG India; 9+ years in credit/market-risk model development and validation. Contributed the reliability/validation framework (the Rung 1-2 statistics and floors). Credited in the analysis plan, both research PDFs, and the article.

**Proportionality principle:** surfaced by **Saurabh Nanda, General Manager and APAC Business Leader (Align Technology)**: also detection reviewer V-AI-07. Credited (with permission) in the research paper, Article 1, and the detection protocol.

**Rung 3: Real-Case Criterion pilots (public determinations paired with documented outcomes):**

| Domain pilot | Contributor | Cases | Outcomes recorded | Last activity |
|---|---|---|---|---|
| Public Records / FOIL | Stacy Young (E-08) | **7** | challenged, failed appeal | 2026-07-06 |
| HR / Employment | Tanvi Pokhriyal (V-HR-01) | **5** | challenged, failed appeal, held up | 2026-06-22 |
| Healthcare Compliance | Keith Carrington, EJD, MBA (V-HC-01) | **0** | n/a | accepted, not started |

Total: **12 real cases** across two active domain pilots; the healthcare pilot is accepted but not yet started.

**Open seat:** organizational psychologist (construct validity): not recruited.

---

## 3. Publications & live research platform

**Deployed to production (jrsstandard.com): current commit `62a586a`, verified live 2026-07-08:**
- research.html shows Early Results (reproducibility 84%, reliability AC1 0.74/0.63), Study 004 "Reviewer Reliability: Result reported", Study 009 "Dataset ready", and the methods-paper link. Duplicate research questions are deduped on display.
- Live findings feed: reproducibility (STUDY-001) and reliability (STUDY-004).
- Answer-key docs (`research/`) are deliberately NOT on production: `research/Verified_Key.md` returns 404. Blind study intact (re-verified 2026-07-08: `research/` absent from the deployed tree; selective deploy publishes public HTML only).

| Paper | Covers | File | State |
|---|---|---|---|
| The Justification Review Standard | Full framework | `JRS_Research_Paper.pdf` | ✅ Live on research page (Ubayet full title) |
| Reliability & Accuracy (Rungs 1 & 2) | Repro + reliability + prelim accuracy | `JRS_Reliability_Accuracy.pdf` | ✅ Live on research page |
| Decision Reconstruction Risk | The concept (essay) | `DRR_Article.pdf` | ✅ Live |

Articles 2-4 (FOIL pilot; HR pilot; capstone with construct validity): planned, not drafted.

---

## 4. Open threads

| # | Thread | Next action | Owner |
|---|---|---|---|
| 1 | Finish the 24-record detection study (7/26 complete) | Nudge the 19 unfinished reviewers | You send / I draft |
| 2 | Recruit an organizational psychologist | Find one; hand over the data package (ready) | Not started |
| 3 | Publish Article 1 (Rungs 1 & 2) | **Ubayet REVIEWED and APPROVED 2026-07-14** (methodology + attribution + green light). Next: choose preprint vs journal and submit. | Decide path |
| 4 | Real-case pilot (Rung 3) | Nudge Keith; get more cases | You send / I draft |
| 5 | Website 404s (~20% of traffic) | Send bad URLs from GA4 → I build redirects | You send URLs |
| 6 | Dewey / Peter Broida | 2026-07-10: Broida emailed that he forwarded the site to Dewey's investigation-book authors ("glad to be of help"). Reply this round is purely grateful (co-publishing question held for later). Still not an endorsement. **2026-07-14 VERIFIED IN WRITING (screenshots): the mention ran in Dewey Publications' _News and Case Alert_, Issue #18-07, July 10 2026 (author Peter Broida), as an "Extra Credit Reading Assignment." Exact quote:** "for those of you who are involved in agency investigations, or rely on them, check out the website of www.jrsstandard.com. Its creator and author, Phillip Wikes, a former civil rights officer, offers good guidance on proper assembly and quality controls for investigations and investigators. Take a look at the Investigator Field Guide and Justification Review Standard." Playbook Tier 1 item 5 ("get the Broida mention in writing") is now satisfied. Favorable third-party mention, still not a formal endorsement/certification. **There are TWO separate Dewey mentions (both verified 2026-07-14): (a) the newsletter above, fully cited and quotable; (b) the Dewey Publications Podcast, episode "July 6th, 2026" (published July 7 2026, host Peter Broida), which discusses JRS at the 23:45 mark and lists the site in its published episode notes under "Resources for investigators: www.jrsstandard.com." Link: https://podcasts.apple.com/us/podcast/the-dewey-publications-podcast/id888037481?i=1000775802123** Both are now cited in the prospectus and the Validation Report. NOTE on honesty: the newsletter is quoted from its text; the podcast is cited by its published episode notes and timestamp, NOT by a transcript, because the audio was not transcribed here. Neither is a formal endorsement/certification. **Transcript verification attempted 2026-07-14: NO transcript is accessible. Checked (a) the Apple episode page (no transcript present on the web page; Apple's in-app auto-transcript is not web-exposed) and (b) the publisher RSS `deweypub.com/podcast.xml` (no `<podcast:transcript>` tag). Audio cannot be transcribed in this environment. The exact spoken words at 23:45 remain UNVERIFIED and must not be quoted. What IS double-verified (Apple listing + publisher RSS `<description>` and `<itunes:summary>`): the episode lists "Resources for investigators: www.jrsstandard.com". Full episode topics per the feed: OPM/MSPB proposed regulations; Slaughter (summary removal authority); Jackler litigation (Federal Circuit); Resources for investigators (jrsstandard.com); buy Dewey books.** **UPDATE 2026-07-14: Phillip supplied Apple Podcasts' in-app transcript (4 screenshots), chapter "Investigation Guide Resource." Spoken segment now verified in substance. Caveats: it is Apple's AUTO-GENERATED transcript (labeled "Automatically created transcript"), so not authoritative verbatim, and it mis-renders the name as "Philip Wicks"/"Wicks" (Broida verbally spelled "W-I-K-E-S" and said "I hope I got that right"). Key verified content: Broida calls the field guide "darn good... succinct," written for "EEO intake counseling investigations and pre-finalization review of administrative investigation records," spells out "jrsstandard.com," and EXPLICITLY disclaims endorsement: "And I'm not endorsing it, nor is Dewey." This strengthens our non-endorsement framing (the source says it himself). TIMESTAMP DISCREPANCY: the episode header shows "18 min," which is inconsistent with the earlier "23:45 mark"; removed the 23:45 claim from the prospectus. The transcript itself carries no timestamps, so no exact mark is asserted.** | Send grateful reply |
| 7 | **CLOSED 2026-07-13: no Supabase management token is needed for anything.** All runtime writes use the service-role key in Vercel (`/api/submit`, `/api/register`, `/api/enroll`, `/api/enroll-stats`, `/api/dl`). The one feature that needed DDL (training enrollment) was re-architected onto the existing `pilot_contacts` table, so no CREATE TABLE, no token, no SQL editor is required. The old rotated token stays dead; that is fine. Only reason to ever add a token again: optional new DDL, which we now avoid by design. | None. (Optional cleanup: delete the now-unused `scripts/supabase-apply.py` SessionStart hook for a clean posture.) | Done |
| 8 | Reviewer submissions were failing: anon INSERT on `ai_pilot_reads` got blocked by RLS (change after 07-11). Boris hit the fail-safe. **FIXED 2026-07-13**: submissions now route through server-side relay `api/submit.js` (service-role key in Vercel), deployed and live on both study pages. Boris's answers imported. | (a) DONE 2026-07-13: smoke-test/diag rows purged automatically by `api/register` (it deletes known test codes on each run).  (b) optional: restore the anon INSERT policy so the direct path works too (not needed; relay handles it) | You (SQL editor, optional) |

---

## 5. Platform & deployment activity log: 2026-07-08 (verified)

**Reviewer Reference gated to training only (deploy `c2f4a9f`, 2026-07-14):** the 19-page JRS Reviewer Reference is no longer a free public download. Renamed to an opaque filename (`JRS-Reference-9d4f2a7c.pdf`, old `/JRS-Reference.pdf` now 404), removed the 5 public links (index x2, jrsstandard, pilot x2), kept only the two training-page links (behind the blocking enrollment modal). Purpose: make it a training-only package that can be offered exclusively to a partner (e.g. Dewey) or sold. Soft spot: the training page HTML still exposes the opaque link in source, so this is discovery-gating, not a hard gate; a gated download endpoint (server-verified enrollment) would be the hard gate if exclusivity must be enforced. Also note: the companion-workbook callout added `82a2a8e` was repointed to the opaque name.

**Dewey pitch elements to add (2026-07-14):** (1) Ubayet credibility line, see below; (2) the two real-world pilots Dewey does not know about: public records / FOIL with Stacy Young, and HR compliance with Tanvi Pokhriyal, both in progress and each heading to a journal article, in exactly Dewey's domains (EEO, employment, public records). Frame the pilots as in-progress with forthcoming articles, not as proven (criterion claims are gated until n reaches 20 to 30 with a spread of outcomes).


**Production deploys 2026-07-14 (on `main`, selective, all verified live):**
- `d3635b4`: relabeled the generic guide as "Investigator Field Guide (Combined Overview)" across `jrsstandard.html` and `training.html` (6 display spots) and dropped the two "v1.0" tags that made it read as outdated. Context: the three domain editions (`_Employment`, `_FairHousing`, `_International`) are the current v1.1 set; the single generic `JRS_Investigator_Field_Guide.pdf` (v1.0) is kept on purpose as the combined overview. The PDF cover still says "v1.0" internally (the site labels carry the message; regenerate the PDF only on request, since the scratchpad build script outputs a different `_v1.1.pdf`).
- `8b73892`: corrected `privacy.html` guide-download wording to match the code (records the edition and a hardcoded channel tag `src`, count only, NOT the HTTP referring page).
- `9711605` then `e094df3` then `2915351`: Dewey prospectus corrections (newsletter quoted; podcast added, then transcript-verified with the explicit non-endorsement; the impossible "23:45" timestamp removed since the episode is 18 min). Full detail in Open Thread #6.

**Production deploy 2026-07-13 (commit `3a8d854` on `main`, selective, verified live): footer Privacy links + schema-file hygiene:**
- Privacy Policy link added to all public page footers (33 pages). `privacy.html` is now discoverable site-wide, not only from the enrollment modal. Idempotent copyright-anchored pass for the uniform footers; bespoke footer-nav placement for `index.html`, `enterprise.html`, `jrsstandard.html`. Skipped by design: `404.html`, `bench-admin.html`, and `vp-...html` (vendor preview). No double-inserts, no long dashes; homepage footer render-verified; live-verified across a sample.
- `supabase-ALL.sql` REMOVED from production (now HTTP 404). It was publicly served, pure DDL with no secrets, unreferenced, and not needed at runtime (token-free). Retained on the dev branch for reference. Closes the schema-disclosure diligence item.

**Production deploy 2026-07-13 (commit `040e6f8` on `main`, selective, verified live):** enrollment modal consent note now links `privacy.html` (verified: 1 privacy link in live `training.html`, `privacy.html` 200, `/api/enroll-stats` 200). Note: `supabase-ALL.sql` is served on prod (HTTP 200); it is pure DDL with no secrets, deliberately NOT re-deployed (no functional need, and it documents the now-unused `training_registrations`); consider removing it from prod for a clean diligence posture.

**Production deploy 2026-07-13 (commit `5506bf0` on `main`, selective, verified live): token-free training capture:**
- Directive: "everything to run without Supabase token." Done. The last management-token dependency (DDL for `training_registrations`) is eliminated.
- `api/enroll.js` repointed to insert into the existing private `pilot_contacts` (service-role), `source='training-enroll'`; title/audience/consent preserved as JSON in `message`.
- `api/enroll-stats.js` (NEW): service-role aggregate, returns counts only (no PII), replaces the DDL-only `training_stats` view. Live, returns the correct zero-state.
- `training.html` enrollment modal now LIVE (backend unblocked); `pilot-status.html` adoption tile reads `/api/enroll-stats`.
- Verified live: `/api/enroll` GET `serviceKey:true`; POST without consent to `/api/enroll` returns `consent_required` (no write); `/api/enroll-stats` returns the six-count shape. Write path not smoke-tested on purpose (would leave an undeletable fake row inflating the adoption count); proven instead by equivalence to `pilot.html`'s existing `pilot_contacts` insert.
- Audit: no served `*.html`/`api/*` file references `SUPABASE_ACCESS_TOKEN` or the `training_stats`/`training_registrations` DDL objects (only an explanatory comment in `enroll-stats.js`). `scripts/supabase-apply.py` + its SessionStart hook remain but are now unused and no-op without the token; harmless, optional to remove.

**Production deploy 2026-07-13 (commit `07ea714` on `main`, selective, verified live):**
- `privacy.html` (NEW) is LIVE at `https://www.jrsstandard.com/privacy.html` (HTTP 200). Standalone privacy policy: enrollment PII, the required-contact vs optional-transfer consent tiers, the private-by-construction storage model, sharing limits, retention, and access/deletion via `info@jrsstandard.com`. Mirrors the public secondary-page chrome (tokens `--bg:#0a0a0a`, JetBrains Mono body, header nav, footer, mobile nav). 0 em/en dashes; canonical email, GA4 tag, and copyright.
- `acquisition-9f3c2a7d4b.html` (prospectus) updated live: added sections 05 The Reviewer Panel, 06 The Investigator Field Guides (Dewey mention as a mention, not endorsement), and the partner review API in both the included list and the IP inventory. Confidential, noindex, unlinked.
- Deploy method: selective (`git checkout -B deploy-X origin/main; git checkout <dev> -- <files>; push deploy-X:main`). The CLAUDE.md `push dev:main` form was rejected because it would publish `research/`. Re-verified post-deploy: `research/MASTER_TRACKER.md` returns HTTP 404 on prod.
- HELD from this deploy (intentional, to prevent a broken feature): `training.html` and `pilot-status.html`. The `training_registrations` table and `training_stats` view were re-verified missing on the live DB (HTTP 404, PGRST205) and `SUPABASE_ACCESS_TOKEN` is still unset, so enrollment would fail. These deploy only after the table is applied.
- Follow-up bundled with the eventual training deploy: add a Privacy link to the site footers and point the enrollment modal's privacy note at `privacy.html` (currently reachable by URL but not linked).
- Note (pre-existing, low risk, flagged not fixed): `supabase-ALL.sql` is served as a static file on prod. It is pure DDL with no keys or data, but it does reveal table shapes; consider removing it from `main` or blocking it if a clean posture is wanted.

**Reviewers registered this session (all confirmed in the live DB, 0 reads each, links live):**
| Code | Name | Country | Panel / perspective |
|---|---|---|---|
| V-AI-16 | Gabriela Bar | Poland/EU | Expert: AI law & EU governance (attorney, PhD) |
| V-AI-17 | Shakiba Mahvash | Iran | AI & law researcher (AI governance & liability) |
| V-AI-18 | Saad Farooq | UAE | AI governance / regulatory & public policy (e&) |
| V-AI-19 | Sanya Dalal | India | **Expert panel**: ethics, compliance & investigations (LLB, MBL, CFE, GE Vernova) |

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

**Verified private on production:** `research/` (answer key, this tracker, protocols) is absent from the deployed tree: selective deploy publishes public HTML only.

**Security (still open):** the Supabase management token pasted in chat is compromised and should be rotated (open thread #7).

---

## 6. Collaborations & co-author assignments (private: recruitment planning)

**Standing rule: one article ↔ one co-author. Never offer the same article to two people.**

| Deliverable | Topic / audience | Proposed collaborator | Verified basis | Status |
|---|---|---|---|---|
| LinkedIn Article 2: "When AI Writes the Record" | HR / compliance defensibility | **Sanya Dalal (V-AI-19)** | Ethics & compliance; LLB, MBL, CFE; 8+ yrs internal investigations, GE Vernova | **ON HOLD: superseded by the Journal of Business Ethics co-author pitch (do not double-ask Sanya).** |
| LinkedIn Article 4: "The Evidentiary Deficit" | Legal / governance | **Gabriela Bar (V-AI-16)** | Attorney, PhD; EU AI-ethics advisor | **Offered** (co-credit) per your instruction; persuasive reply drafted, awaiting her response |
| **Journal article: FOIL** ("Documentation as a Governance Layer") | Public records / FOIL; *Journal of Civic Information* | **Stacy Young (E-08)** | Records Governance Advisor; FOIL pilot contributor (7 real cases, verified) | **Co-author CONFIRMED: Stacy Young, 2026-07-09**; outline drafted (`research/FOIL_Article_Outline.md`); data collection ongoing (n=7, target 20-30 by Aug 31, 2026). Not submittable until sample target met. |
| **Journal article: Business Ethics** ("Documentation Governance in AI-Assisted Decision-Making") | Multi-domain governance; *Journal of Business Ethics* | **Sanya Dalal** (pending) | Ethics & Compliance, CFE, GE Vernova, ex-KPMG | **Draft started 2026-07-09** (`research/BusinessEthics_Article_Draft.md`); pitch sent via LinkedIn DM (follow-up; no reply to yesterdays email). Awaiting yes/no. |

**Alternate co-author (hold for a future governance/liability article, not the HR piece):** Shakiba Mahvash (V-AI-17): aspiring AI & law researcher, bar candidate; would value co-authorship most.

**Already credited (not co-authors, do not re-offer):** Saurabh Nanda (V-AI-07, proportionality principle). **Ubayet Hossain (M-01): ELEVATED 2026-07-14 from contributor to CO-AUTHOR OFFER on the reliability / Detection paper** (he designed the core reliability/validation methodology the paper reports, and reviewed and approved it, so it is earned authorship, not courtesy, and consistent with the integrity policy). Pending his acceptance. **Broadened 2026-07-14 (Phillip): offer co-authorship on EACH paper that uses his methodology, across HR, compliance, and AI governance (this now INCLUDES the Business Ethics/compliance paper, superseding the earlier "not Business Ethics" note).** Legitimate per-paper provided he reviews and signs off on each manuscript. No paper byline changes until he accepts each.

---

## 7. FOIL journal article: Journal of Civic Information (progress-tracked)

**Standing directive (from 2026-07-09): all progress on this article is documented here and in `research/FOIL_Article_Outline.md`.**

- **Deliverable:** co-authored empirical research article for the *Journal of Civic Information* (FOIA / public records / transparency; empirical).
- **Co-author:** Stacy Young (E-08), Records Governance Advisor and Public-Records Domain Lead (Deputy Records Access Officer, NYC HPD).
- **Basis:** the Public-Records Documentation Validation Pilot (PR-DVP); real public determinations paired with documented outcomes; JRS read recorded blind to outcome.
- **Verified data (live DB, `bench_outcomes`, contributor E-08):** 7 cases, 7 distinct public sources, collected 2026-06-26 to 2026-07-06; JRS reads 5 Ready / 2 Needs-work / 0 Gap.
- **Target / deadline:** 20-30 cases with a spread of outcomes; first-batch and full-set deadlines per the pilot (full set by Aug 31, 2026).
- **Positioning (per the May 28, 2026 Chief FOIA Officers Council technology initiative):** JRS evaluates the reviewability of records produced by any workflow (manual or AI-assisted); it is a governance layer above any FOIA technology, complementary to technology inventories that measure software but not record reviewability.
- **Gate (no fabrication):** not submittable until n reaches the pre-registered target with a spread of outcomes; Results/Abstract remain placeholders until then.

**Progress log:**
- 2026-07-09: Outline drafted (`research/FOIL_Article_Outline.md`) from the PR-DVP prospectus and verified n=7 data.
- 2026-07-09: **Stacy Young accepted co-authorship** and committed to building out more cases. Next: drive collection toward 20-30 with a spread of outcomes; finalize the upheld/overturned outcome-coding scheme; then write Results and Abstract.

---

## 8. Business Ethics journal article: Journal of Business Ethics (progress-tracked)

**Deliverable:** empirical, practitioner-informed paper on documentation governance in AI-assisted decision-making. Draft: `research/BusinessEthics_Article_Draft.md`.

- **Spine (established, verified):** Rungs 1-2 evidence woven in: reproducibility 84% (15 records), reliability Gwet's AC1 0.74 experts / 0.63 reviewers (10 records); reliability/validation methodology by **Ubayet Hossain (KPMG India)**, named in-text.
- **Criterion legs (preliminary):** HR pilot (Tanvi Pokhriyal, **UAE**) n=5, includes one Gap-read record that held up (counter-example): no criterion claim yet; public-records pilot (Stacy, E-08) n=7 used **illustratively only**.
- **Co-author pitch:** Sanya Dalal (ex-KPMG; GE Vernova; CFE). Pitched via LinkedIn DM 2026-07-09 as a follow-up (she did not reply to yesterday's email). Goal: a clear yes/no. Tanvi is NOT told about the paper until Sanya agrees (per your instruction).
- **Gates (no fabrication / no duplication):** (1) no criterion claim until HR and public-records pilots reach 20-30 with a spread of outcomes; (2) the public-records primary results live in the FOIL paper only: used illustratively here to avoid duplicate publication; (3) authorship assigned by substantive intellectual contribution (ethics-journal integrity).

**Progress log:**
- 2026-07-09: Initial draft created; Rungs 1-2 + Ubayet woven in; Sanya pitched (LinkedIn DM). Next: Sanya yes/no; then define her section and drive HR/public-records pilots toward target.
- 2026-07-14: Ubayet co-author offer now includes this (compliance) paper, contingent on his review/sign-off (see the authorship note in the header). Open housekeeping: `BusinessEthics_Article_Draft.md` still contains pre-existing long dashes (9 em, 6 en as of 2026-07-14) beyond the one fixed on the attribution line; clean them in one pass before this draft advances (house no-dash rule). Not urgent (paper is gated on Sanya + pilot maturity).

---

## 9. Field Guide distribution & download counter (built 2026-07-10)

**Why:** the three Investigator Field Guides (EEO, Fair Housing, International) are meant to be shared off-site (emailed, forwarded, mentioned in a Dewey case alert), so on-site GA4 `file_download` events undercount badly. A redirect counter captures every download regardless of where the link is clicked, and tags it by channel.

**How it works:** each download link points at the edge function `/api/dl?e=<edition>&src=<channel>`, which writes one append-only row to `public.guide_downloads` and 302-redirects to the static PDF. The DB write is best-effort: if Supabase is down or the service key is unset, the user still gets the file.

| Piece | Location |
|---|---|
| Edge function | `api/dl.js` (Vercel edge; uses `SUPABASE_SERVICE_ROLE_KEY`) |
| Table + private aggregate view | `public.guide_downloads`, `public.guide_download_counts` (RLS on, no anon read) |
| Repointed links | `investigator-guides.html` (3 on-site links tagged `src=site`) |

**Edition tokens:** `employment`, `fairhousing`, `international`.

**Per-channel share links** (use the right `src` so you learn which channel works):
- Site (already wired): `/api/dl?e=employment&src=site`
- Dewey author intros: `https://www.jrsstandard.com/api/dl?e=employment&src=dewey`
- LinkedIn post/comment: `https://www.jrsstandard.com/api/dl?e=employment&src=linkedin`
- AWI: `https://www.jrsstandard.com/api/dl?e=employment&src=awi`
(swap `employment` for `fairhousing` / `international` as needed)

**Read the counts** (Supabase SQL editor or service role): `select * from public.guide_download_counts;`

**Status:** LIVE in production as of 2026-07-10. Table applied to Supabase; `api/dl.js` + repointed `investigator-guides.html` deployed to `main` (commit `57534d8`) via a **selective deploy**: only those two files were taken onto `main` from `origin/main`, so `research/` (answer key included) and the other unreviewed dev changes did NOT ship. Verified live: `GET /api/dl?e=employment` returns 302 → the EEO PDF. Two `deploytest` rows created during verification were deleted; the table starts clean.

**Deploy note (important):** production `main` currently contains **no `research/` files** and there is **no `.vercelignore`**. Do NOT deploy by pushing the whole dev branch to `main`: that would publish the answer key and the private `pilot-status.html` dashboard. Always deploy selected public files only (as was done here).

**Dashboard charts (added 2026-07-11, LIVE):** `pilot-status.html` now shows two inline charts (no external library, matching the site's no-dependency convention).
- **Panel completion:** horizontal stacked bar (Complete / In progress / Not started), computed client-side from `pilot_progress`.
- **Investigator Guide Downloads by day:** stacked bar chart colored by edition, from a new aggregate-only view `public.guide_downloads_public` (day x edition counts, granted to anon; the raw `guide_downloads` log stays private). Categorical palette validated for the dark surface: EEO `#3987e5`, Fair Housing `#199e70`, International `#c98500`.
- Deployed to `main` via selective deploy (commit `73b57f1`); only `pilot-status.html` shipped.

---

## 10. Publication sequencing & strategy (three papers in flight)

**Principle (from the plan review, 2026-07-10):** the *study* is the contribution, not the framework. A publication is a credibility anchor for the IP, not the finish line: pair it with at least one real-org pilot (a demand signal), which a buyer weighs more than any single paper. Post a **preprint** (OSF/SSRN) at submission so credibility exists before peer review clears (realistically 9-15 months). Scope every claim to what the data shows and honor the pre-registered floors.

**The three papers (all already in the tracker: see §6, §7, §8):**

| # | Paper | Venue | Co-author | Data basis | Gating item |
|---|---|---|---|---|---|
| A | **Detection**: "Detecting Decision Reconstruction Risk in AI-Assisted Documentation" | AI and Ethics (alt: AI & Society; FAccT/AIES workshop) | panel; Ubayet methodology credited | Study 011: 24-record set vs verified key (+ Arm B if run) | Finish the panel (7/26 complete); decide Arm B |
| B | **FOIL**: "Documentation as a Governance Layer" | Journal of Civic Information | **Stacy Young (E-08): CONFIRMED** | Public-records pilot n=7 → target 20-30 | Reach 20-30 cases with a spread (Aug 31, 2026) |
| C | **Business Ethics**: "Documentation Governance in AI-Assisted Decision-Making" | Journal of Business Ethics | **Sanya Dalal (pending)** | **Tanvi HR pilot n=5** + Rungs 1-2; public-records illustrative only | Sanya yes/no; HR data maturity; no duplication with FOIL |

**Sequence:**
1. **Submit Paper A (Detection) first.** It is the novel-contribution anchor, and its hard-to-copy asset is the international blind panel + verified answer key. It reaches "submittable" by finishing the panel (recruiting/nudging you control), not by slow real-world case accrual. **Arm B decision:** run it for the strong "JRS beats unaided review" claim, or skip it and scope Paper A to "accuracy against a verified key." Preprint at submission.
2. **Paper B (FOIL) second.** Co-author confirmed; gated only on case accrual to 20-30 (deadline Aug 31, 2026). Submit once n≥20 with a spread of outcomes.
3. **Paper C (Business Ethics) third.** Gated on Sanya's acceptance AND the HR/criterion data maturing; must not duplicate FOIL's primary results. Sanya's yes also unblocks telling Tanvi about the paper.

**Immediate actions (parallel, now):**
- Nudge the 19 unfinished detection reviewers (binding task for Paper A).
- Decide Arm B (run vs scope-down).
- Get Sanya's yes/no (unblocks Paper C + Tanvi).
- Keep FOIL and HR case collection moving toward 20-30 each.
- Land one real-org pilot (the demand signal that a paper cannot supply).

**Progress log:**
- 2026-07-10: Sequencing set: A (Detection) → B (FOIL) → C (Business Ethics). Corrects an earlier omission of the Business Ethics / Tanvi HR-pilot paper from the plan analysis; all three are now sequenced together rather than treating the detection paper as the only one.
- 2026-07-13: Paper A (Detection) now has a **draft manuscript**: `research/Detection_ArmB_Article_Draft.md`, targeted at **AI and Ethics** (Springer). Methods and pre-registered analysis plan are complete; Results are gated (panel 7/24 complete; Arm B not yet run). Introduction incorporates the author's mentorship narrative (Gabi). Ubayet credited for methodology; reviewers acknowledged, not co-authors.
- 2026-07-14: **Ubayet Hossain reviewed and approved the draft (LinkedIn message, screenshots on file).** He confirmed the methodology is sound: Gwet's AC1 as the primary metric with Fleiss' kappa and Krippendorff's alpha alongside ("absolutely correct"; robust to the kappa paradox), and the pre-set Floor 1 at AC1 >= 0.61 as "standard and methodologically sound." He approved his attribution ("reads perfectly and accurately captures my role") and said it is "ready for the next stage," asking to be told when it is submitted. **Attribution FINALIZED 2026-07-14 (Phillip's decision: use the recommended version):** the canonical form is **"Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India"** in all papers. His suggested tweak was garbled (repeated FRM; em-dash) and was not adopted; "(Model Validation)" is kept. The primary papers already used this exact wording; the two divergent draft lines were aligned to it (Detection_ArmB added "KPMG India"; BusinessEthics fixed the title format and removed an em-dash). No further attribution confirmation needed. This clears the Section 4 open thread #3 review gate. **CO-AUTHOR DECISION 2026-07-14 (Phillip):** given how central his contribution is (he designed the framework the paper reports), elevate Ubayet from acknowledged contributor to CO-AUTHOR on the paper his methodology anchors (reliability / Detection), pending his acceptance. Earned authorship (methodology design + review), not courtesy. Message offering co-authorship sent to him; if he accepts, add him to that paper's author byline as "Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India" and confirm the exact paper(s). **BROADENED later 2026-07-14 (Phillip):** offer him co-authorship on EACH paper that uses his methodology, across HR, compliance, and AI governance (not just reliability/Detection). Message updated to reflect this and to commit to sending each draft for his sign-off before submission (the guardrail that keeps per-paper authorship legitimate). Add him to each paper's byline only after he accepts and reviews that specific manuscript.
- 2026-07-13: **Two-track publication plan for Paper A.** Because the empirical paper cannot be submitted without results, the concept was split out as a **Perspective** article, submittable now: `research/DRR_Perspective_AIandEthics.md` (title "When the Record Cannot Stand on Business...") plus a cover letter `research/CoverLetter_AIandEthics_DRR_Perspective.md`. Open consent item: confirm Gabriela Cortez ("Gabi") agrees to be named in Acknowledgments, or anonymize.
- 2026-07-13: **DECISION (author): do ONE article, the empirical Detection/Arm B paper** (`research/Detection_ArmB_Article_Draft.md`), submitted to AI and Ethics once results are in (finish detection panel + run Arm B). The Perspective (`DRR_Perspective_AIandEthics.md`) is retained as an OPTIONAL faster alternative or a preprint/LinkedIn essay, not a required second paper. Single-article path chosen for a stronger, sale-grade publication.

---

## 11. Reviewer recruiting workflow (two tracks): added 2026-07-10

When a profile comes in, it is routed to one of two tracks by a single label ("Panel" or "Comparison"). If no label is given, ask which track before doing anything.

**Track 1: "Panel" (main JRS reviewers, 24-record detection study, Study 011):**
- Register a **V-AI-##** code in `bench_experts` (needs the Supabase token).
- Build a personalized JRS reviewer prospectus + invitation.
- Link: `ai-records-pilot.html?code=V-AI-##`.
- Prior JRS exposure is fine here (these reviewers use JRS). Warm post-likers and interested people belong on this track.
- **Next available code: V-AI-31** (last used: V-AI-30 Andres Lage Freire, registered 2026-07-13 via the token-free endpoint).

**Token-free Panel registration (added 2026-07-13, works with NO Supabase token):** the management token is dead, so Panel reviewers are now registered via `api/register.js`, a Vercel edge function that writes to `bench_experts` using the service-role key already in the Vercel environment. It upserts a FIXED list of reviewers hard-coded in the file (no request input decides what is written, so it is safe and idempotent). To register a new Panel reviewer without a token: (1) add their row to the `REVIEWERS` array in `api/register.js`, (2) deploy that file to `main` (selective deploy), (3) `GET https://www.jrsstandard.com/api/register` once. Verify via `pilot_progress`. This is now the standard Panel-registration path until a working management token exists. (Arm B still needs nothing: no DB write at all.)

**Track 2: "Comparison" (Arm B controlled study, `ai-records-arm-b.html`, LIVE in production):**
- Assign the **next RR-### code** (no `bench_experts` registration needed; the page uses an anon key and writes to `ai_pilot_reads` with batch `armB-B1`/`armB-B2`).
- Give the neutral invitation + the generic neutral prospectus (`Records_Review_Study.pdf`, no JRS method, no reads, no codebook link).
- Link: `ai-records-arm-b.html?code=RR-###`.
- **Next available comparison code: RR-111.** Assigned 2026-07-13: RR-101 to Boris Khazin (no-JRS/B2), RR-102 to Sundeep Mattaparti (JRS/B1), RR-103 to Pankaj Kumar Bhagat (no-JRS/B2). Assigned 2026-07-14: RR-104 to Donavine Smith (JRS/B1), RR-105 to Doreen Abiero (no-JRS/B2), RR-106 to Nicholas Evans (JRS/B1, COMPLETE), RR-107 to Tuneer Mondal (no-JRS/B2), RR-108 to Archana Dhinakaran (JRS/B1), RR-109 to Mostafa Mahmoudi (no-JRS/B2). Assigned 2026-07-15: RR-110 to Jean-Luc Adade (no-JRS/B2). See Section 12. Batch RR-101 to RR-140 generated (20 land JRS-arm B1, 20 land no-JRS B2); handed out in sequence, never steered. Arm B needs no Supabase token and no `bench_experts` row: just hand out the RR code and the arm-b link.

**Guardrails (these protect the study: do not skip):**
1. **The Comparison person does NOT get hand-assigned to the JRS or no-JRS half.** The page decides that automatically and at random from the code string (`conditionFor()` = parity of the uppercased code). You only choose the *study*; the tool splits the arms. Hand-sorting the halves would bias the result.
2. **A Comparison recruit must be JRS-naive:** no liking/commenting on JRS posts, no reading the guides, no prior exposure to the reconstructability idea. If unsure, ask the founder "has this person engaged with your JRS content?" If yes, route to Panel instead.
3. Keep a running note of which RR/ V-AI code went to whom; never reuse a code.

**Code-to-arm reference (Arm B, from `conditionFor`):**
- JRS arm (B1): RR-102, 104, 106, 108, 111, 113, 115, 117, 119, 120, 122, 124, 126, 128, 131, 133, 135, 137, 139, 140
- No-JRS arm (B2): RR-101, 103, 105, 107, 109, 110, 112, 114, 116, 118, 121, 123, 125, 127, 129, 130, 132, 134, 136, 138

---

## 12. Comparison group (Arm B) participants (roster)

Completion thank-you notes (send with the certificate) live in `research/Completion_ThankYou_Templates.md` (Panel variant A; neutral Arm B variant B). Only send after DB-verified 24/24.

Arm B recruits review the same 24 records at `ai-records-arm-b.html`. Each code is randomly assigned by the tool to the JRS arm (B1) or the no-JRS baseline (B2); we do not steer people into arms (that would bias the comparison). Only JRS-naive people are eligible (Section 11). No `bench_experts` registration is needed (the page uses the anon key and writes to `ai_pilot_reads` with batch `armB-B1` / `armB-B2`). Live participation is on `pilot-status.html` (aggregate view `armb_progress`, codes not names).

| Code | Name | Country | Assigned arm | Status |
|---|---|---|---|---|
| RR-101 | Boris Khazin | US (North Carolina) | no-JRS (B2) | **COMPLETE 24/24** (submitted 2026-07-13; first submission hit the RLS bug and fail-safe-downloaded, then imported via /api/submit relay). JRS-naive confirmed. Recognition issued 2026-07-13: Records Review Study certificate + LinkedIn recommendation (participation only, no JRS-method/endorsement claim, since he was the no-JRS arm) |
| RR-102 | Sundeep Mattaparti | India (Hyderabad) | JRS (B1) | Invited 2026-07-13; JRS-naive per Arm B direction |
| RR-103 | Pankaj Kumar Bhagat | India (Chennai) | no-JRS (B2) | Invited 2026-07-13; JRS-naive per Arm B direction (IP & patent strategy, XLSCOUT; ex-Indian Patent Examiner) |
| RR-104 | Donavine Smith, MBA | South Africa (Pretoria) | JRS (B1) | Invited 2026-07-14; JRS-naive per Arm B direction (**CONFIRM she has not engaged with JRS content; if she has, route to Panel instead**). Chief Strategy / Transformation Officer; frontier AI strategy & governance; NED, Rape Crisis Cape Town Trust. Code lands in B1 by the deterministic hash, not by selection |
| RR-105 | Doreen Abiero | Kenya (Nairobi) | no-JRS (B2) | Invited 2026-07-14; JRS-naive per Arm B direction (**CONFIRM she has not engaged with JRS content; if she has, route to Panel instead**). Advocate of the High Court of Kenya; AI & Data Governance Policy Analyst (Qhala); University of Cape Town. Code lands in B2 by the deterministic hash, not by selection |
| RR-107 | Tuneer Mondal | Canada (Waterloo/Cambridge) | no-JRS (B2) | Invited 2026-07-14; JRS-naive per Arm B direction. AI, HealthTech & Governance; Consultant Operations & AI Solutions (1860393 Ontario Ltd); AI Governance Taskforce researcher (Arcadia Impact); University of Cambridge. Code lands in B2 by the deterministic hash, not by selection |
| RR-108 | Archana Dhinakaran | India (Puducherry) | JRS (B1) | Invited 2026-07-14; JRS-naive per Arm B direction. AI-First Fractional General Counsel; AIGP (IAPP), ISO/IEC 42001 Lead Implementer; 18+ yr corporate lawyer; board advisory. Code lands in B1 by the deterministic hash, not by selection |
| RR-109 | Mostafa Mahmoudi | Iran (Tehran) | no-JRS (B2) | Invited 2026-07-14; JRS-naive per Arm B direction. AI Governance Researcher; Founder/Director, Iran Tech Diplomacy Institute; PhD candidate, Technology Governance (University of Tehran). Code lands in B2 by the deterministic hash, not by selection. Arms now 4 B1 (RR-102, RR-104, RR-106, RR-108) / 5 B2 (RR-101, RR-103, RR-105, RR-107, RR-109) |
| RR-106 | Nicholas Evans | US | JRS (B1) | **COMPLETE 24/24** (verified in `armb_progress` 2026-07-14, all 24 reads same day, last activity 20:16 UTC). AI Governance & Runtime Auditor; adversarial/non-adversarial testing; Ex-USMC. Code lands in B1 by the deterministic hash, not by selection. **Recognition issued 2026-07-14: Records Review Study certificate (`Records_Review_Study_Certificate_Nicholas_Evans.pdf`) + LinkedIn recommendation, neutral framing (participation and his own judgment; no JRS-method/endorsement claim, consistent with Boris and the blind design).** Arms balanced 3/3 (B1: RR-102, RR-104, RR-106; B2: RR-101, RR-103, RR-105) |
| RR-110 | Jean-Luc Adade | West Africa | no-JRS (B2) | Invited 2026-07-15; JRS-naive per Arm B direction. Regional IT Leader (West, Central & North Africa); multi-country IT operations, IT governance, digital transformation, risk management; 10+ yr; progressing toward CIO/CISO/IT Director. Prospectus `Records_Review_Study_Jean-Luc_Adade.pdf` (built from the canonical Sundeep template; name/location/code only). Code lands in B2 by the deterministic hash, not by selection. Arms now 4 B1 (RR-102, RR-104, RR-106, RR-108) / 6 B2 (RR-101, RR-103, RR-105, RR-107, RR-109, RR-110) |

Note on RR-101: Boris Khazin is an AI Governance, Digital Risk, and GRC leader (ClearView MRI; ex-EPAM Global Head of DRM/GRC; EU AI Act, DORA, NIST AI RMF). He is the first Arm B participant. His code lands in the no-JRS baseline arm by the deterministic hash, not by selection.

Note on RR-102: Sundeep Mattaparti is Head of Legal and Compliance at bioMérieux (Hyderabad, India); pharma, FMCG, and corporate-law compliance background (ex Novo Nordisk, Alstom, Metro, Walmart). His code lands in the JRS arm by the hash. JRS-naive status is per Phillip's Arm B direction; confirm before he begins.

---

## 13. Training enrollment capture (IP-value asset, built 2026-07-13)

**Goal:** convert interest into named, consented, *trained/certified* users, the strongest demand-and-adoption signal for the sale. Free guides stay ungated (reach preserved); the JRS training is the opt-in that captures name, organization, title, email with consent. A trained-user base is higher value than a raw download list and harder to copy.

**Built (token-free, service-role pattern):**
| Piece | File | Status |
|---|---|---|
| Consented enrollment modal (name/org/title/email + required contact consent + optional transfer consent) | `training.html` | **LIVE on prod (deploy `5506bf0`)** |
| Enrollment endpoint (service-role insert into `pilot_contacts`, PII never exposed) | `api/enroll.js` | **LIVE, token-free (`serviceKey:true`)** |
| Aggregate stats endpoint (counts only, no PII) | `api/enroll-stats.js` | **LIVE, token-free (returns zeros until first enrollment)** |
| Dashboard adoption tile (reads `/api/enroll-stats`) | `pilot-status.html` | **LIVE on prod** |

**RESOLVED, token-free, 2026-07-13 (deploy `5506bf0`): the training table no longer exists or is needed.** Phillip's directive was "everything to run without Supabase token." The only remaining dependency on the management token (`SUPABASE_ACCESS_TOKEN`) was DDL to create `training_registrations`. That dependency is now eliminated: enrollment writes into the **existing** `pilot_contacts` table (which already exists and is private, RLS-locked, service-role-only) via `api/enroll.js`, tagged `source='training-enroll'` so it never collides with real pilot contacts (`source='pilot'`). Fields `pilot_contacts` has no column for (title, audience, consent flags) ride along losslessly as JSON in the `message` column. The dashboard reads a new service-role aggregate endpoint `api/enroll-stats.js` (counts only, no PII) instead of the DDL-only `training_stats` view. No management token, no SQL editor, no new table. Write path proven equivalent to `pilot.html`'s already-working `pilot_contacts` insert; read + validation paths verified live. `training_registrations` / `training_stats` in `supabase-ALL.sql` are now dead (never applied) and can be ignored or removed. Reading the captured PII list for diligence: query `pilot_contacts where source='training-enroll'` in the Supabase Table Editor (or a service-role read), parsing `message` JSON for title/consents.

**Consent design (for sellability + compliance):** required checkbox = consent to contact + storage; optional checkbox = consent to transfer to an acquirer (without this the list cannot legally transfer with the IP). Privacy note on the modal; deletion/access via info@jrsstandard.com. **Privacy policy page DONE and LIVE 2026-07-13** (`privacy.html`, deployed commit `07ea714`); it documents both consent tiers. When `training.html` deploys, point the modal's privacy note at `privacy.html` and add the footer link.

**Panel angle:** when an international-panel reviewer asks "anything else I can do?", invite them to complete the JRS training + certification (link `training.html?src=panel`, which tags their enrollment as `panel`). High-credential enrollments strengthen the trained-user asset.

**Completion, certificate, and invites (verified 2026-07-14):**
- Enrollment is LIVE and collects name/organization/title/email with consent; **0 enrollments so far**. Guide downloads collect **no personal data** (anonymous edition + channel-tag counter for the three domain editions via `/api/dl`; the Combined Overview generic guide uses plain links and records nothing). Identity capture is the training enrollment ONLY, by design: free guides stay ungated to preserve reach.
- Training completion is recorded **client-side only** (browser `localStorage` key `jrs-training-progress`). The certificate is generated **in the browser** via `downloadCert()` for the user to download. There is **no server-side record of who completed**, and **no email is sent**: the backend has no email service (verified: no mail code in `api/`). Certificates to reviewers are issued **manually by Phillip** (existing practice; see the per-reviewer cert builders in scratchpad).
- Invite assets drafted in chat (2026-07-14, for Phillip to send): (1) a reviewer invite pointing to `training.html?src=panel` (tags the enrollment `panel`); (2) a public LinkedIn post pointing to `training.html` offering the free training to all followers. Guidance: send the follower invite as one **public post**, not mass DMs.
- **Campaign source tracking (DONE + LIVE 2026-07-14, deploy `fd13078`):** `enrollSubmit()` now captures any `?src=` tag (sanitized to `[a-z0-9_-]`, 40 chars) into the enrollment `source`, stored as `page_source` in the `pilot_contacts.message` JSON. `audience` still resolves to `panel` (via `?src=panel`) or `public`. Hand out one tagged link per channel: `training.html?src=<tag>` (e.g. `?src=hrw`, `?src=aba`, `?src=linkedin`). Per-campaign readout: service-role/Table-Editor query `pilot_contacts where source='training-enroll'`, read `message.page_source`. `/api/enroll-stats` is unaffected (it filters the row `source='training-enroll'`, not the body source). A per-source count breakdown on the dashboard is NOT built (optional; the data is captured and queryable now).
- **Admin read + completion recording BUILT and LIVE 2026-07-14 (deploy `4b065cd`):** `api/enroll-admin.js` (GET, token-gated via `BENCH_ADMIN_TOKEN`/`RUN_TOKEN`, service-role) returns the enrolled people (name, title, email, organization, channel, consents, `enrolled_at`, `completed`, `completed_at`) plus counts; fails safe (401, no PII) with no/invalid token, verified live. `api/complete.js` (POST, service-role) records a completion event keyed by email into `pilot_contacts` (`source='training-complete'`), append-only. `training.html` now stores the enrollee email at sign-up and POSTs `/api/complete` once when all six modules are done. **Pull the list:** `https://www.jrsstandard.com/api/enroll-admin?token=<BENCH_ADMIN_TOKEN>` (or Supabase Table Editor). **Completion-recording gap FIXED 2026-07-14 (deploy `6baa274`):** the recorder was refactored into one `recordCompletion()` helper called from module-complete (silent), page-load (silent catch-up), and certificate download (prompts for the registered email if none is stored). This means the 3 people who enrolled before email-capture DO record completion now, when they finish or when they download their certificate (the prompt captures their email). As of 2026-07-14: **3 enrollments, 0 recorded completions** (verified accurate; no evidence anyone has finished all six modules yet).
- **NO-TOKEN roster viewer BUILT and LIVE 2026-07-14 (deploy `146c71e`):** `api/roster-8c3f1a9e7b2d6045.js` renders the full enrolled list (name, title, email, organization, channel, consents, enrolled date, completion) as an HTML table, secured only by its opaque unlinked noindex URL (same model as `acquisition-9f3c2a7d4b.html`), so it needs no token, no login. **Bookmark:** `https://www.jrsstandard.com/api/roster-8c3f1a9e7b2d6045`. If the URL ever leaks, rotate it by renaming the file. The token-gated `api/enroll-admin` remains as the stronger alternative.
- **Current roster (verified live 2026-07-14): 3 enrolled, 0 completed** - Jake McDonough (SAEONYX), Olabanji Lawal (ALTV Engineering), Boris Khazin (Clear View); all via `?src=panel`, all consented to contact and transfer. The named list itself is not duplicated here (it lives behind the roster link) to keep this tracker PII-light.
- **Still not built (unchanged recommendation):** auto-emailing certificates (needs a new email provider + API key; recommended against at current scale, manual issuance is fine).

**Recommended next steps: free-training distribution plan (2026-07-14; decision: offer now, honestly framed):**
1. **Offer now, do not wait for validation.** The binding constraint is demand, not more validation (peer review is ~9 to 15 months out). Honest framing is the safeguard: a free method, in active validation, certificate of completion (not accreditation or endorsement). Overclaiming is the only thing that makes offering-now risky, and the drafts avoid it.
2. **Reviewer invites first (this week):** the 7 who completed (Jake, Frank, Lawal, Andrey, Kyle, Hekim, SungSoo), via `training.html?src=panel`. Warmest; converts them to certified advocates. Draft = message A (chat 2026-07-14).
3. **Source tracking:** DONE and live (see the bullet above). Hand out one tagged link per channel.
4. **Training / professional organizations (highest IP value):** pitch them to distribute the free training + guides to members (channel adoption = the CE-partner story a buyer pays for). Tagged link e.g. `training.html?src=<partner>`. Draft = message B.
5. **Named mission organizations (human rights, fair housing, EEO, labor):** send guide + training, aiming for ONE to adopt or circulate it (the single biggest value lever). Tagged link e.g. `training.html?src=<org>`. Draft = message C.
6. **Public follower post last:** reach, not evidence. `training.html` or `?src=linkedin`.
7. **In parallel (raises the ceiling on every pitch):** finish the detection panel and run Arm B.
8. **Phillip-only, highest value, unchanged:** land one real-org pilot, file the JRS and DRR trademarks, sign contributor IP agreements while relationships are warm.
- Integrity guardrails on all outreach: JRS is in validation; the certificate is completion, not accreditation; naming reviewers stays participation-only, not endorsement.
- Outreach messages finalized 2026-07-14 as "donation" framing with working tracked links (A reviewers `?src=panel`; B training/professional orgs `?src=partner` or a per-org tag; C mission orgs `?src=org` or a per-org tag; guides hub `investigator-guides.html`). Full drafts are in chat. Clarification: enrollment already requires name/organization/title/email + consent to start the training, so the `?src` tag is attribution (which channel drove the sign-up), NOT additional data collection. Per-org measurement: give each recipient its own short tag (e.g. `?src=aba`, `?src=hrw`).

**BROIDA LOOP CLOSED WARMLY (2026-07-15, 2:49 PM reply): relationship confirmed intact.** After Phillip's thank-you, Peter replied: "No offense taken. You've got something to offer the civil service world. I am reasonably sure each of the organizations I mentioned offers training for investigators. peter" (full signature block: Peter Broida, Suite 211, 4620 Cherry Hill Rd., Arlington, VA 22207). This directly retires the "did the offer damage the relationship" worry: the answer, from Broida himself, is no, plus another unprompted vote of confidence. **Decision: do NOT reply again.** He gave a warm close that asks for nothing; a further message would be the 4th in the chain with nothing new and would trip the cadence risk. Bank it on the high note; next contact is a GIVE (validation results). **Integrity:** "something to offer the civil service world" is personal encouragement, NOT an endorsement of JRS (he has twice disclaimed endorsement). Do not use it in buyer-facing or research materials.

**BROIDA RELATIONSHIP STRATEGY (decided 2026-07-15):**
- **Do NOT thank Broida in any research article.** He explicitly disclaimed endorsement (podcast: "I'm not endorsing it, nor is Dewey"), and he did not contribute to the validation work. Putting him in a paper's acknowledgments would imply the endorsement he declined, read as borrowing credibility to a peer reviewer, and reopen an ask. Keep gratitude in the private email only. CITING his public mention (with the non-endorsement caveat, as already done in the prospectus/Validation Report) is fine; THANKING him in article acknowledgments is not. Only exception: a future paper he actually reviews/shapes, credited to the specific act and approved by him in writing first.
- **Cadence is the real risk, not the offer.** Sequence from his side: unsolicited newsletter mention, podcast mention, forwarded to Dewey authors, then received our offer. One ask is fine; a pattern of asks tips "I discovered good work" into "this person keeps bringing me requests." Go quiet on requests now.
- **Next Broida touch should be a GIVE, not an ask** (e.g., a short "here is where the validation went" note when results land). That does more for a future mention/supplement than any request.
- **Supplement odds are essentially unchanged by the offer.** A further published mention / investigations-guide author inclusion is driven by his editorial judgment (he called the Field Guide "darn good... succinct"), which the offer did not touch. Estimated ~40-60% eventually, contingent on the authors/editorial cycle, NOT on this exchange. Probability the offer damaged the relationship: ~5-10%, and mostly contingent on our NEXT moves (restraint), not the offer itself.

**ACCESS OPENED TO BROAD DISTRIBUTION (2026-07-15, deploy `c177882`): general invite code replaces the single-org founding model.** Peter/Dewey declined founding access, so the training is now distributed by invitation to any organization or reviewer via ONE shared opaque code. The retired `dewey` code (`9f4c2a7db6e1`) was removed from the gate (no longer grants access; nobody held it).
- **Share this link (works for everyone you hand it to):** `https://www.jrsstandard.com/training.html?access=k7m2p9x4t1c8` (neutral "JRS training" label; names no one).
- **Per-organization / per-reviewer measurement without new codes:** append `&src=<tag>` and that tag wins for attribution, e.g. `...?access=k7m2p9x4t1c8&src=feltg`, `&src=lrp`, `&src=linkedin`. The tag lands in the enrollment `source` (`pilot_contacts.message.page_source`); read per-channel counts from the roster. No code edit or redeploy needed to add a channel.
- **Gate behavior unchanged otherwise:** cold visitors (no code) still see the by-invitation screen and are routed to the free field guides; `?src=panel` research participants and prior enrollees still auto-granted; Module 1 preview still applies. Free guides remain public.
- **Logic verified:** 9/9 decision cases pass (general code grants; `&src` overrides tag; old dewey code now denied; wrong code + cold visitor denied; panel/stored/enrollee retained). Live on prod.

**DEWEY OUTCOME (2026-07-15): soft no. Founding access now available to reassign.** Peter Broida replied to the founding-access offer: Dewey publishes and does not distribute training to its subscribers (it is not a training reseller), so the "offer it to your customers" premise did not fit his business. Important: this was NOT a rupture. He spent real effort referring Phillip to three federal-sector training organizations and said they "might well be interested in having you as a trainer," and signed "Kind regards." That is a soft no plus a genuine endorsement of Phillip as a trainer. Handling: a short, warm thank-you (no re-pitch, one light acknowledgment of the Dewey misread), drafted in `research/Broida_Reply_ThankYou.md`. Per the no-chase plan, the founding-access slot is now free to offer to the next organization or a pilot program; keep code `9f4c2a7db6e1` (`dewey`) retired for attribution honesty and issue a fresh opaque code to the next recipient. **Referral leads Peter surfaced (better-fit than a publisher list, all federal employment-law training):** FELTG / Deborah Hopkins (feltg.com); Gary Gilbert's firm training group; LRP (lrp.com).

**ACCESS GATE + exclusive-access link BUILT and LIVE 2026-07-15 (deploy `e06702b`, dev `3f5ddef`):** the training and certificate are now gated behind an opaque access code carried in an organization-neutral "JRS training" link (the URL never names the partner). Client-side gate in `training.html`: on load it reads `?access=<code>`, maps the code to an internal attribution tag, persists the grant to `localStorage` key `jrs-training-access` `{granted,channel}`, and reveals the enrollment modal; without a valid code (and not a panel participant, not a prior enrollee) it shows a by-invitation gate screen that routes to the free materials (`index.html#section-tools`) and a `mailto:info@jrsstandard.com` request-access link. Attribution: the code's channel tag flows into `enrollSubmit()` as the enrollment `source` (`training.html?src=<channel>`), so the partner's participation is measured passively at sign-up with no extra data collection. Free field guides remain fully public.
- **Codes (internal map, not public):** `9f4c2a7db6e1` → `dewey` (FOUNDING ACCESS, partner slot 1, reserved first for Peter Broida / Dewey Publications as a goodwill gesture). The exclusive link to hand out: **`https://www.jrsstandard.com/training.html?access=9f4c2a7db6e1`** (neutral label "JRS training"; nothing in it says Dewey).
- **Reversible / no-chase by design:** if a partner declines, do not reuse its code; add a fresh opaque code → new tag (e.g. `partner-02`) to the `ACCESS_CODES` map in `training.html` and issue that link to the next organization. One org at a time; measure that org's adoption via the roster (`?src=<channel>` in `pilot_contacts.message.page_source`). No permanent legal exclusivity is asserted (framed as "by invitation / founding access"), so it can be widened or reassigned freely.
- **Continuity kept:** panel research participants (`?src=panel`) and anyone already enrolled on their device (`jrs-training-enrolled=1`) are still granted automatically, so the existing 3 enrollees are not locked out. `localStorage` key `jrs-training-access` added to the sanctioned-keys list (self-contained tool state, namespaced).

**PARTNER-READY CHECKLIST (final production sweep, 2026-07-15): all green.** Everything Peter/Dewey will touch is verified live on `www.jrsstandard.com`.
- **Founding link to hand out:** `https://www.jrsstandard.com/training.html?access=9f4c2a7db6e1` (resolves 200; neutral label; nothing says Dewey).
- **Invited experience:** loads to Module 1 preview + "Register free" banner (no blocking modal). Modules 2 to 6 and certificate gate to registration.
- **Cold visitor:** by-invitation gate (Open free materials / Request access). Exclusivity intact.
- **Capture endpoints:** `/api/enroll` validates (400 `name_required` on empty), `/api/complete` validates (400 `valid_email_required`), `/api/enroll-stats` returns counts (currently 4 enrolled / 4 consented contact / 4 consented transfer).
- **Companion guide:** `JRS-Reference-9d4f2a7c.pdf` 200 and linked from training (2 in-page links); old `/JRS-Reference.pdf` 404; worksheet 200. No orphaned/old refs.
- **Certificate:** client-side, honest disclaimer ("Educational material. Does not constitute professional certification, legal qualification, or compliance accreditation.").
- **Inspect anytime:** counts at `/api/enroll-stats`; full named roster at `https://www.jrsstandard.com/api/roster-8c3f1a9e7b2d6045`.
- **Offer email:** drafted and ready to send (`research/Broida_Founding_Access_Offer.md`); deliver the founding link on his yes.

**DATA-USE COMMITMENT (Phillip, 2026-07-15): the enrollment list is NOT used for marketing.** Permitted uses only: certificate delivery, honest project/research updates, the credibility/adoption narrative for diligence, and transfer to an acquirer for those who ticked the optional consent. No sales drip, no marketing campaign to enrollees (including Dewey's customers). This keeps the Broida founding-access gift honest (no lead-generation behind a gift) and keeps use inside the existing consent scope ("contacted about the JRS project"). No consent-copy change needed.

**MODULE 1 PREVIEW added and LIVE 2026-07-15 (deploy `7e9c5f5`, dev `7e9c5f5` chain):** invited (granted) visitors who are not yet enrolled now land on the open training with a "Preview" banner and Module 1 readable, instead of an immediate blocking register modal. Opening any later module (idx >= 1) or clicking "Register free" opens enrollment; the enroll modal in preview shows a "Keep previewing Module 1" dismiss link. Successful registration clears preview (`window._jrsPreview=false`), hides the banner, and unlocks all six modules + certificate. Cold visitors (no code) still get the by-invitation gate; exclusivity and identity capture are both preserved (capture just happens after a genuine look inside). Verified live via DOM inspection: founding link -> `preview-banner display:block`, enroll/gate overlays `none`; cold visitor -> `gate-overlay display:flex`. Directly addresses the "hard gate suppresses interest" blind spot and gives Peter the preview he will expect.

**FUNNEL QA before partner inspection (2026-07-15):** full end-to-end audit passed.
- **Gate logic:** 8/8 decision cases pass (founding code grants + tags `dewey`; upper/space-padded code normalizes; wrong code and cold visitor both denied to the by-invitation screen; `?src=panel` grants; stored-grant and prior-enrollee `jrs-training-enrolled=1` both retain access; injection-shaped code rejected). Verified by replicating the deployed decision logic in Node.
- **Live states rendered (headless Chromium, local file):** cold visitor sees "By invitation" (Open the free materials / Request access); founding link `?access=9f4c2a7db6e1` opens "Register to begin" (name/org/title/email + required contact consent + optional transfer consent + Start the training). Screenshots on file in scratchpad.
- **Endpoints live + validating:** `/api/enroll-stats` returns counts; `/api/enroll` rejects empty body `{"error":"name_required"}` (400); `/api/complete` rejects empty `{"error":"valid_email_required"}` (400); roster viewer 200. No test rows injected into production (write-probes deliberately avoided).
- **Attribution confirmed:** `enrollSubmit()` records the gate channel into the enrollment `source` (founding link -> `training.html?src=dewey`), so Dewey participation is measured passively; channel persists on same-device return visits via `localStorage jrs-training-access`.
- **Roster state now 4 enrolled / 1 completed (verified live 2026-07-15):** #4 Nicholas Evans (neae123@pm.me, source `training.html`) enrolled AND completed 2026-07-14, the first real end-to-end enroll->complete data point (supersedes the "0 completed" line above). Rows 1-3 unchanged (Jake, Lawal, Boris, all `?src=panel`). All 4 consented to contact and transfer. No stray/test rows.
- **Pre-existing analytics (not gating):** `jrsRec()` posts module-open/complete events to Supabase `interaction_events` via the anon key (silent-fail `.catch`). Untouched by the gate work; not part of the sale-critical enrollment/completion capture.

**Resolved (superseded):** the earlier "do not deploy training.html before the table exists" caution no longer applies. There is no table to create: enrollment writes to the existing `pilot_contacts` via the service role, so `training.html` is safely live. Modal privacy link DONE and LIVE 2026-07-13 (deploy `040e6f8`). Site-wide footer Privacy links DONE and LIVE 2026-07-13 (deploy `3a8d854`, 33 pages, verified). `privacy.html` is now discoverable from every public page footer and from the enrollment modal. Privacy-integration polish is complete.

---

## Appendix: condition naming (reference)

Canonical five conditions = the deployed standard (`jrsstandard.html`, `codebook.html`): RC1 Reconstructability · RC2 Basis Identification · RC3 Chronology · RC4 Decision-Process Traceability · RC5 Evidentiary Sufficiency.

The review instrument stores working keys; they map to the standard as follows (kept as-collected so existing data stays valid):

| Data key | Standard condition |
|---|---|
| reasoning_traceability | RC1 Reconstructability |
| basis_identification | RC2 Basis Identification |
| temporal_reconstructability | RC3 Chronology |
| accountability_support | RC4 Decision-Process Traceability |
| cold_reviewer_clarity | RC5 Evidentiary Sufficiency |
