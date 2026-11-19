# Decision Spellcheck: repository review for existing evidence, blind spots and missed opportunities

Date: 2026-11-19. Scope: the jrsstandard.com repository (research/, docs/, api/, tests/), read for anything that strengthens the Decision Spellcheck (DS-N1) evaluation or sale/licence path. Labels: FACT (seen in a file named here), INFERENCE, PROPOSAL.

## 1. Existing evidence assets

### 1.1 The 24-record detection study (the study with all the records)
- FACT. The 24 records are embedded in `ai-records-arm-b.html` (`var RECORDS`, R01 to R24, eight domains: HR, investigations, AI-assisted summaries, FOIL, compliance and AML, audit, litigation, administrative eligibility).
- FACT. The intended labels are fixed in `research/Intended_Key_authorside.md` (12 grounded, 12 ungrounded). `research/Completer_Results_Summary_2026-08-15.md` states the key was independently reproduced 24 of 24 by raters blind to it.
- FACT. Results (same file): 58 experts across three studies, 36 completed full 24-record sets in 16 countries; detection panel of 16 reviewers, 384 blind reads, 83.9% accuracy against the verified key (95% CI 72.7 to 95.1; sensitivity 87.0%, specificity 80.7%); individual accuracy 37.5% to 100%.
- FACT. A randomized comparison (five conditions 75.0% vs general prompt 67.6%) did not meet its pre-registered bar (p = 0.50; underpowered).
- FACT. Rosters: `research/Expert_Roster_All_Studies_2026-08-06.csv` (61 rows across studies 004, 011, 012), `research/Study004_Raters_2026-08-06.csv` (25 rows).

### 1.2 The 32-case public-records corpus (JCI package)
- FACT. `research/JCI_SUBMISSION_2026-08-28/02_DATA/JCI_JRS_32_Case_Master_Dataset.csv`: 32 published New York and Connecticut decisions and audits with public URLs, JRS reads, documented outcomes, a blind second read and agreement figures (`03_RELIABILITY/`), plus a reproduction script (`04_REPRODUCTION/analysis.py`).
- FACT. A 22-row companion employment corpus: `06_COMPANION_STUDY/JCI_Companion_Employment_Corpus_Verification.csv`.

### 1.3 Contactable practitioners
- FACT. `docs/enterprise-diligence/CORPUS_INVENTORY.md`: 37 contributor-confirm rows from 33 people in `pilot_contacts`.
- FACT. The contributor consent (`contributor.html`) covers use of their contribution, publication and transfer to a successor. INFERENCE: it does not cover commercial contact; consent is not a sales permission (CLAUDE.md Rule 5).

### 1.4 DS-N1's own unused evidence
- FACT. A sealed holdout set for DS-N1 (`tests/ds-n1/build-holdout2.mjs`, `holdout2-expectations.json`, `holdout2-predictions.json`, in the DS branch) has never been scored; scoring it needs owner authorization by the programme's own rule.

## 2. Blind spots and missed opportunities

1. **Existing human labels are not used to evaluate DS.** 384 blind expert judgments on 24 records already exist. Comparing DS against the same verified key gives a machine-versus-expert figure at no cost to anyone's time. Obstacle (FACT): the 24 records are self-contained narratives with no separate source documents, while DS-N1 checks claims against cited sources. PROPOSAL: add a standalone-record screen (the result-summary, certainty, missing-date, missing-basis and authority checks applied to the record text alone) and score it against the verified key.
   - Contamination caveat: the developer has now read these records and the key, so a DS score on R01 to R24 is developer-seen, not blind. PROPOSAL: freeze the screen's rules, record its R01 to R24 output, then report it as developer-seen alongside a blind score on the sealed holdout and, if authorized, the 32-case public corpus.
2. **The sealed DS holdout has never been run.** It is the cheapest blind evidence available. Needs owner authorization.
3. **The practitioner link yields only free text.** Scoring free text requires the developer to code it, which is a bias a buyer will notice. PROPOSAL: add one forced-choice line to the same page ("Would you rely on this record as it stands? Yes / No"). That is still a single visit and gives an objective label directly comparable with DS's HOLD or READY.
4. **The warmest audience is already known.** The 33 people who confirmed as contributors, and the wider roster, have already reviewed 24 records under this method. They are the natural first recipients of the practitioner link (a research ask, covered in spirit by their study participation). Commercial follow-up only where they tick the pilot or licence box.
5. **No "assisted versus unaided" test for DS.** The comparison study measured the instrument against a general prompt and could not show a difference. Buyers will ask the same of DS. The existing two-arm infrastructure (`ai-records-arm-b.html`, deterministic assignment by participant code) can be reused with DS output as the assisted arm. PROPOSAL, sized honestly: about 205 reviewers per arm for a 7-point effect; a smaller run is evidence of direction only.
6. **Determinism is an unused selling point.** The Review Engine needed a 41-run, three-vendor consistency study (87.2% agreement). DS-N1 makes no model calls, and its reproducibility baseline is byte-identical across runs. That is a differentiator worth stating plainly in buyer material, with the caveat that consistency is not correctness.
7. **Work is not on the main branch.** PRs #214 to #221 are unmerged; the practitioner page goes live only after merge. Until then a buyer-facing link cannot be sent.
8. **Private trial material is in temporary storage.** AR-81 to AR-83, their predictions and the answer key exist only in session scratch storage; only their hashes are in the tracker.
9. **Provenance for a sale.** DS-N1 records that it was developed by an AI development agent (`lib/ds-n1/identity.mjs`, `provenance`). A buyer's counsel will ask about authorship and ownership of AI-assisted code (CLAUDE.md Rule 7). REQUIRES HUMAN REVIEW: a short provenance and ownership statement prepared with counsel.
10. **No evaluation licence or terms.** The licensing bundle has a manifest and verifier but no evaluation-licence draft. PROPOSAL: prepare a draft evaluation licence for counsel (preparation only; acceptance is the owner's).
11. **Naming is inconsistent.** "Decision Spellcheck" and "Decision Spellchecker" both appear. INFERENCE: pick one before buyer material circulates; `research/TRADEMARK_COST_BENEFIT_2026-08-12.md` exists for the mark question.
12. **Public-record corpus versus the real-record rule.** DS-N1 refuses anything not marked `constructed_fictional`. The 32-case corpus is real but published. Running DS on it needs an explicit owner decision about published public records, separate from private real records.
