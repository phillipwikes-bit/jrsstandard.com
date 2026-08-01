# Completion checklist: "Detecting Decision Reconstruction Risk in AI-Assisted Documentation" (Detection / Arm B paper)

Prepared 2026-08-01. Target close: about two weeks (on or around 15 August 2026). Target journal: *AI and Ethics* (Springer), or a Perspective/validation-design submission if the primary sample is not completed in time.

Items are ordered by priority. Blocking items (B) must be resolved before submission; the rest are standard completion tasks.

---

## SECTION 0 — Source-of-truth correction (do this first)

**[B0] Use the corrected repo draft, not the uploaded copy.**
The uploaded `Detection_ArmB_Article_Draft.md` is an older version. Its Abstract and Section 5.1 still state expert AC1 0.74 and trained-reviewer 0.63 "in the substantial range." That reliability claim was superseded: on the full current data the trained-reviewer coefficient falls to about 0.18 (below the pre-registered 0.61 floor), so the number is not reportable as a passed result. The corrected repo version (`research/Detection_ArmB_Article_Draft.md`) already reads "inter-rater reliability is preliminary and not reported here." Submit from the corrected version. Do not reintroduce 0.74, 0.63, or "substantial" anywhere in the manuscript, the cover letter, or the companion files.

**[B1] Confirm no reliability coefficient survives anywhere.**
Sweep the manuscript and every companion file for "0.74", "0.63", "substantial", "AC1", and "Gwet" used as a reported result. Per the earlier sweep, these files still need checking: `LinkedIn_Profile_Copy.md`, `IP_Asset_Transfer_Map.md`, everything under `research/submission/`, `Article1_Submission_Plan.md`, and the tracker summary table. Reliability is described only as preliminary and not yet reported until the pooled set is complete.

---

## SECTION 1 — Contributors, authorship, and credentials

**[1.1] Send the contributor-verification message** (`research/Message_Contributor_Verification.md`).
Send to each named detection-panel completer. Ask each person to confirm the exact name and professional title/affiliation they want printed, or to elect anonymity. State the deadline. State that if they do not reply by the deadline, you will list them using the name and title they provided at registration. This is the message you asked for.

**[1.2] Named contributors to verify (completed Arm A detection panel).**
These 24/24 completers are the named contributors. Titles as registered, to be confirmed by each person:

- Jake McDonough (V-AI-01) — AI governance, SAEONYX Global Holdings (US)
- Frank Schouten (V-AI-03) — AI Governance & Assurance, AEGF (Australia)
- Dr Nitin Deshpande (V-AI-06) — Chief Human Resources Officer, 38+ years HR (India)
- Saurabh Nanda (V-AI-07) — General Manager / APAC business leader (India)
- Gabriela Cortez (V-AI-08) — civil-rights records, bilingual intake (US) [see 1.4]
- Lawal Olabanji (V-AI-10) — operations & records management (Nigeria)
- Kyle McMullan (V-AI-12) — Chief Audit Executive, internal audit & financial crimes (UK/Ireland)
- Dr Gabriela Bar (V-AI-16) — attorney, PhD; AI ethics advisor (Poland/EU)
- Hekim Colpan (V-AI-20) — AI Governance & Compliance Manager; ISO/IEC 42001 auditor (Germany)
- SungSoo In (V-AI-24) — AI Governance & Responsible AI (South Korea)
- Sidharth Borah (V-AI-27) — Advocate, High Court of Delhi; Partner, Gurinder & Partners (India)
- Nigel Hee (V-AI-28) — AI Ethics, Safety & Governance; University of Glasgow (Singapore)
- Andres Lage Freire (V-AI-30) — AI Governance Lead / Responsible AI Architect (Spain)
- Andrey Ekhmenin (V-AI-11) — Founder, EAS; governance diagnostics & post-execution review (Poland/EU)

**[1.3] Andrey Ekhmenin (V-AI-11) is a verified expert contributor.**
Per Phillip's verification (documentation on file with the owner), Andrey is a named expert reviewer and is included in the panel above with his registered title. Send him the verification message like the other named contributors. The only standing note is general vendor-neutrality: keep JRS uncoupled from any reviewer's own product line (the same handling applied to any reviewer with an adjacent commercial interest), which does not affect his status as a named expert contributor. File the verification documentation with the study record so the roster is self-documenting.

**[1.4] Confirm Gabriela Cortez's status.**
She was removed as co-author (2026-08-01). She remains a completed reviewer. Confirm she still consents to be named as a reviewer, or move her to anonymous. Do not name her without that confirmation.

**[1.5] Anonymity handling.**
The few reviewers who requested anonymity are regular reviewers, not part of the named-expert panel. Keep them aggregate-only: they count in totals and country/continent spread, but no name, title, or identifying detail appears. Confirm the exact anonymous count before submission so the panel arithmetic is internally consistent.

**[1.6] Add the verified-credentials sentence to Section 4.3 (your "expert professionals" note).**
State plainly that the reviewers are experienced expert professionals in the domains they were registered from: AI governance, compliance, audit, human resources, investigations, data privacy, records, and law, across 10 countries on 5 continents. This holds for both the detection panel (Arm A) and the Arm B participants, who are expert professionals recruited fresh for the randomized comparison. This is accurate and supported by the roster of registered titles.
One precision to keep the Arm B logic clean: "JRS-naive" means the Arm B participants had no prior exposure to the JRS method, not that they lacked expertise. The randomized comparison isolates the effect of the JRS method itself (whether a reviewer is given the five conditions or a general prompt), among equally expert professionals. So describe Arm B participants as expert professionals who were new to the JRS method, and describe the B1-vs-B2 difference as the effect of the method, not a difference in expertise.

**[1.7] Co-author sign-off: Ubayet Hossain.**
He is a co-author. Send him this specific manuscript for review and written sign-off before submission (that is what makes the co-authorship earned). Confirm his byline name and affiliation. Adjust his author-contributions wording so it credits the reference-panel design, the chance-corrected statistics, and the pre-registered floors and analysis plan, without implying a reliability coefficient is being reported in this paper (it is not).

---

## SECTION 2 — Results state and submission type

**[2.1] Decide the submission type within the two-week window.**
- Option A: complete the pre-registered primary sample (detection panel to target, Arm B to per-arm target) and report primary results. Arm B is currently 3 in the JRS condition and 4 in the baseline, well short of the per-arm target, so completing it in two weeks is unlikely.
- Option B (realistic): submit as a Perspective / validation-design paper. Report the reproducibility supporting result (84 percent, consistency not accuracy), state the design and pre-registered plan in full, and keep the primary detection and Arm B analyses explicitly gated. This is publishable now and does not overclaim.

**[2.2] Keep the primary results gated and labeled.**
Detection accuracy and the B1-vs-B2 comparison are not reported until the pre-registered sample and thresholds are met. The current numbers are directional only. Do not state any sensitivity, specificity, or between-condition figure before the plan's conditions are met.

**[2.3] State Arm B honestly if not completed.**
If Arm B is not run to target, report it as preliminary and underpowered, and keep the possible-baseline-exposure limitation. Do not drop Arm B from the paper to avoid a null; a timestamped pre-registration plus issued reviewer certificates make a hidden arm discoverable.

**[2.4] Refresh the panel counts to the submission date.**
The draft cites 12 complete as of 28 July 2026. Re-verify against the live counts on the day of submission and update Sections 4.3 and 5.2. Keep 10 countries on 5 continents unless the completer set changes.

---

## SECTION 3 — Reproducibility figure

**[3.1] Lock one reproducibility number.**
The draft reports 84 percent across 15 records (run dated 2026-07-06). The nightly figure has since moved (latest around 88.9 percent). Choose one: keep the locked 84 percent / 15 records as the reported figure with its date, or update to the current figure with its date. Report it consistently everywhere and always as consistency, not accuracy.

---

## SECTION 4 — Pre-registration and data availability

**[4.1] Deposit the pre-registration and insert the DOI.**
The draft says the plan is "held in the study's pre-registration." Deposit the analysis plan (for example at OSF) and replace that phrase with the citable link or DOI, so "pre-registered" is verifiable to an editor.

**[4.2] Finalize the data-availability statement.**
Confirm the terms under which the constructed records, the verified key, and the aggregate results are available to reviewers, and keep the answer key off the public site to protect the blind study.

---

## SECTION 5 — Journal mechanics

**[5.1] Cover letter** to *AI and Ethics*, framing the paper as a validation-phase governance contribution with complete supporting results and pre-registered primary analyses.
**[5.2] Author metadata:** corresponding author, ORCIDs, affiliations, and order (Wikes, Hossain).
**[5.3] Required statements:** competing interests (note Phillip's JRS authorship), funding (none, if that is correct), ethics/consent (constructed and de-identified records; voluntary, uncompensated, personal-capacity participation; opt-in attribution).
**[5.4] Final prose pass:** confirm no em-dashes, none of the banned filler terms, and no "8 countries" anywhere; the count is 10 countries on 5 continents.

---

## What can be drafted now (and is or will be drafted)

- The contributor-verification message: drafted (`research/Message_Contributor_Verification.md`).
- The cover letter: can be drafted now once the submission type (2.1) is chosen.
- The competing-interests, funding, and data-availability statements: can be drafted now.
- The Section 4.3 verified-credentials sentence: can be drafted now from the roster, pending title confirmations.
- Ubayet's author-review cover note: can be drafted now.

Tell me which of these to draft next and I will produce them.
