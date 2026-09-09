# Evidence Ledger

Machine-readable intermediate. **Every conclusion in
`ASSET_AND_CHAIN_OF_TITLE_REGISTER.md` traces to a row here.**

Levels: **A** primary executed · **B** structured primary record · **C** contemporaneous
written communication · **D** contemporaneous project record · **E** secondary summary.

| ID | Source | Location | Type | Date | Person | Asset | Lvl | Proposition supported | Limitation | Conflict |
|---|---|---|---|---|---|---|---|---|---|---|
| E-001 | Live DB | pilot_contacts source=contributor-confirm | structured | 2026-08-19 | Hekim Colpan (V-AI-20) | Detection study panel work | B | Consent executed: named/use/transfer all true, country DE | No terms version stored | none |
| E-002 | Live DB | pilot_contacts source=contributor-confirm | structured | 2026-08-22 | Tanvi Pokhriyal (V-HR-01) | Employment records study | B | Consent executed: named/use/transfer all true, country AE | No terms version stored | none |
| E-003 | Live DB | pilot_contacts source=contributor-confirm | structured | 2026-08-27 | Stacyann Young (E-08) | Public records study | B | Consent executed: named/use/transfer all true, country US | No terms version stored | none |
| E-004 | Live DB | pilot_contacts aggregate | structured | 2026-08-19 to 2026-09-05 | 33 distinct people | Study publications | B | 37 rows / 33 people; consent_use 100%; consent_transfer 100%; zero refusals | Scope limited to study publications and successor transfer | none |
| E-005 | Live API | /api/coauthor-stats | structured | 2026-09-09 | M-01, V-HR-01, E-08 | Three studies | B | Co-author instrument: expected 3, confirmed 0 | Instrument unused | Two of the three consented via the contributor instrument instead |
| E-006 | Repo file | research/evidence/ubayet_coauthor_2026-07-14/TRANSCRIPT.md | text | 2026-07-14 | Ubayet Hossain (M-01) | Detection study methodology | C | Verbatim transcript: methodology approval, attribution approval, submission clearance, affirmative reply to co-author offer | Not an executed instrument; silent on commercial use | none |
| E-007 | Primary image | 04_ubayet_reply_happy_to_help.png | image | 2026-07-14 11:50 | Ubayet Hossain | Co-authorship offer | C | VIEWED 2026-09-09. Corroborates transcript: offer text and 'Happy to help! Thanks for sharing the update' | Affirmative in context; not a crisp yes to named papers | none |
| E-008 | Primary image | 02_ubayet_review_part2.png | image | 2026-07-14 10:41 | Ubayet Hossain | Reliability methodology | C | VIEWED 2026-09-09. Corroborates: AC1 primary 'the right approach'; floor 0.61 'standard and methodologically sound'; 'attribution reads perfectly'; 'ready for the next stage' | Employer KPMG India visible in his suggested attribution | none |
| E-009 | Repo file | research/CONSENT_AND_RELEASE_AUDIT_2026-08-13.md | text | 2026-08-13 | All participants | All | D | 'There is no signature anywhere. Nobody signs anything.' | Audit, not an instrument | none |
| E-010 | Repo file | research/Reply_Hekim_Publication_Terms_2026-08-05.md | text | 2026-08-05 | Hekim Colpan | CCI article | C | Written terms: joint copyright; prior approval for commercial/promotional/certification/training/marketing use of JRS material | Acceptance NOT located | Restricts commercial use if accepted |
| E-011 | Source | api/_coauthor-roster.js | code | 2026-08-24 | 3 co-authors | Three studies | B | TERMS_VERSION coauthor-v1.0-2026-08-24 stored on every row written | Contributor instrument stores none | none |
| E-012 | Source | contributor.html | code | current | All contributors | Study publications | B | Consent wording: credited name and contributed work may continue to be used in study publications 'including by a successor organization' | Silent on licensing, commercial products, revenue, vendor platforms | none |
| E-013 | Source | coauthor.html | code | current | 3 co-authors | Papers + underlying study | B | Asks commercial question directly: 'may at some point be used... in a licensed product'; 'the work earns money and you would not receive a share of it' | Unused by all three | none |
| E-014 | Git | git log / blame | metadata | 2026-04-14 to 2026-09-08 | Claude identity | API, OpenAPI, Codebook, training | D | 1,737 of 2,031 commits (85.5%); 100% surviving lines on core implementation files | Commit metadata is not authorship-in-fact | none |
| E-015 | Git | git blame | metadata | continuous | Phillip Wikes | jrsstandard.html | D | 3,839 of 4,314 lines (89%) human-attributed | Attribution is not ownership | none |
| E-016 | Corpus | 10 rights-term variants, 1,162 files + 7.31MB extracted | search | 2026-09-09 | All | All | - | Zero executed assignments, work-for-hire or contractor instruments | Email/external correspondence outside boundary | none |
| E-017 | Corpus | USPTO term search + 8-digit scan | search | 2026-09-09 | JRS / DRR marks | Branding | - | Zero filing or registration numbers. One candidate traced and excluded as SHA-256 prefix | Dossier is preparation only | 23 pages use the TM symbol |
| E-018 | Corpus | DOI regex over full corpus | search | 2026-09-09 | Publications | All manuscripts | - | 3 DOIs, all citations of other authors. No JRS output has a DOI | - | Corrects an earlier 'zero anywhere' statement |
| E-019 | Source | pilot.html | code | current | n/a | Website | B | formspree.io/f/mreddwdg receives form submissions | Not disclosed on any privacy or security page | Baseline recorded three processors, not four |
| E-020 | Metadata | docProps/core.xml across research DOCX | metadata | various | Jeff Billups (14), Anholzer Bill (1) | Research documents | D | Third-party names in authoring metadata | Metadata provenance only; not contribution evidence | In no roster |

**20 ledger entries.** No Level A entry exists: **no executed signed instrument
was located anywhere in the accessible corpus.** The strongest rights evidence is
Level B, structured consent records, of which 33 people hold one.
