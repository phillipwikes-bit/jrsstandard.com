# Master JRS Asset Inventory

**Evidence of existence** is direct observation on disk or live, on 2026-09-09.
Existence is not ownership; ownership is treated in
`ASSET_AND_CHAIN_OF_TITLE_EVIDENCE_REGISTER.md`.

| ID | Asset | Category | Location | Version | Date | Evidence of existence | Current status |
|---|---|---|---|---|---|---|---|
| A-01 | JRS Standard (canonical document) | Core methodology | `JRS-Standard.pdf` | not stated in filename | in repo | File present, 326,013 bytes | Public, served |
| A-02 | JRS standard documentation (web) | Core methodology | `jrsstandard.html` | n/a | continuous | 4,314 lines, 89% human-attributed | Public, served |
| A-03 | Canonical JRS Codebook | Core methodology | `codebook.html` | **1.0** | n/a | Five conditions with definitions and detection criteria | Public, served |
| A-04 | Decision Reconstruction Risk (construct) | DRR | site-wide; `DRR_Article.pdf` | n/a | earliest located use **2026-06-23** | Commit `9ea3687` | Public |
| A-05 | Review Engine (versioned) | Source code | `api/v1/review-engine.js` | `engine_version` in payload | n/a | 259 lines | Live, token-gated |
| A-06 | Review proxy | Source code | `api/review.js` | n/a | n/a | 280 lines | Live |
| A-07 | Review engine (partner) | Source code | `api/review-engine.js` | n/a | n/a | 266 lines | Live, token-gated |
| A-08 | OpenAPI contract (primary) | API schema | `openapi.json` | **1.0.0** (OpenAPI 3.1.0) | n/a | 220 lines | Public. **Conflicts with A-09** |
| A-09 | OpenAPI contract (validation) | API schema | `openapi-review-engine.json` | **0.1.0-validation** (OpenAPI 3.0.3) | n/a | Present | Public. **Conflicts with A-08** |
| A-10 | API modules (all) | Source code | `api/` | n/a | n/a | 56 modules | Live |
| A-11 | Investigator Field Guide (combined) | Field guide | `JRS_Investigator_Field_Guide.pdf` | n/a | in repo | 24,471 bytes | Public download |
| A-12 | Field Guide: Employment/EEO | Field guide | `JRS_Investigator_Field_Guide_Employment.pdf` | n/a | in repo | 17,500 bytes | Public download |
| A-13 | Field Guide: Fair Housing | Field guide | `JRS_Investigator_Field_Guide_FairHousing.pdf` | n/a | in repo | 17,807 bytes | Public download |
| A-14 | Field Guide: International | Field guide | `JRS_Investigator_Field_Guide_International.pdf` | n/a | in repo | 18,244 bytes | Public download |
| A-15 | Rapid Review Card | Practitioner resource | `JRS_Rapid_Review_Card.pdf` | n/a | in repo | 4,532 bytes | Public download |
| A-16 | Practitioner Self-Review | Practitioner resource | `JRS_Practitioner_Self_Review_Final.pdf` | Final | in repo | 104,118 bytes | Public download |
| A-17 | JRS Reference | Reference | `JRS-Reference-9d4f2a7c.pdf` | n/a | in repo | 2,308,034 bytes | Public download |
| A-18 | Training modules | Training | `training.html` | n/a | n/a | 3,579 lines, 100% Claude-attributed | Public, ungated |
| A-19 | Simulation library | Training | `simulations.html` | n/a | n/a | Page present | Public |
| A-20 | Operational Evaluation Study ledger | Research | `JRS_Operational_Evaluation_Study_Twenty_Record_Ledger.pdf` | n/a | in repo | 350,351 bytes | Public download |
| A-21 | Reliability and Accuracy document | Research | `JRS_Reliability_Accuracy.pdf` | n/a | in repo | 11,078 bytes | Public download |
| A-22 | Research paper (public) | Research | `JRS_Research_Paper.pdf` | n/a | in repo | 36,125 bytes | Public download |
| A-23 | DRR article | Publication | `DRR_Article.pdf` | n/a | in repo | 8,449 bytes | Public download |
| A-24 | AI and Ethics submission packet | Research | `research/aie_submission_2026-09-01/` | n/a | 2026-09 | Cover letter, title page, blinded manuscript, generated docx | Private, **submission-ready** |
| A-25 | Detection study dataset | Dataset | Supabase; `research/` | data lock **2026-08-15** | 2026 | 384 graded judgments, 24-record corpus | Private |
| A-26 | Reliability study dataset | Dataset | Supabase; `research/` | n/a | 2026 | 25 raters | Private |
| A-27 | Comparison study dataset | Dataset | Supabase; `research/` | n/a | 2026 | 20 experts | Private |
| A-28 | Research corpus (all) | Research | `research/` | n/a | continuous | 598 files | Private, never deployed |
| A-29 | Guard suite | Source code | `scripts/check_zero_drift.py` | n/a | continuous | 126 checks | Private, never deployed |
| A-30 | Scripts (all) | Source code | `scripts/` | n/a | continuous | 145 files | Private, never deployed |
| A-31 | Public website | Digital asset | 54 `.html` files | n/a | continuous | Files present, live | Public |
| A-32 | Trademark filing dossier | Branding | `TRADEMARK_FILING_DOSSIER_JRS_DRR.md` | n/a | prepared **2026-08-11** | File present | **Preparation only, not a filing** |
| A-33 | Consent and release audit | Rights document | `research/CONSENT_AND_RELEASE_AUDIT_2026-08-13.md` | n/a | **2026-08-13** | File present | Private. **Nearest thing to a rights record located** |
| A-34 | Domain `jrsstandard.com` | Domain | external registrar | n/a | n/a | Resolves and serves | **Registrar record NOT AUDITABLE** |
| A-35 | Enterprise diligence package | Documentation | `docs/enterprise-diligence/` | 2026-09-08 | 2026-09-08 | 13 documents | Private, excluded from deployment |
