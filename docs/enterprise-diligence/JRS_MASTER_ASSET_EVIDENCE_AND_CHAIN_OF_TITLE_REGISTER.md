# JRS Master Asset, Evidence, and Chain-of-Title Register

# 1. Document control

| Field | Value |
|---|---|
| Status | **AUTHORITATIVE LIVING RECORD.** Single source of truth for JRS asset, contributor, rights and chain-of-title evidence |
| Version | 1.0 |
| Created | 2026-09-09 |
| Supersedes as the primary register | `ASSET_AND_CHAIN_OF_TITLE_REGISTER.md` v2.0 and all fragment registers, **which are retained as evidence sources and are not deleted** |
| Update rule | **Never restart the audit. Add evidence, name the finding it changes, preserve the prior status in the correction history, update the index.** |
| Traceability | 27 ledger entries in `EVIDENCE_LEDGER.md` |

**The purpose of this document is that no future review should have to rediscover
Hekim, Ubayet, Tanvi, Stacyann, the DRR evidence, the consents, or the Master Tracker
history. If evidence was previously supplied, it is recorded here.**

# 2. Purpose and scope

To state what the accessible evidence establishes about JRS assets and their
chain-of-title questions, and to preserve that evidence so it is recovered once.

**This is not legal advice.** No asset is classified as legally owned, because no
evidence supporting that classification was located. **Authorship is not ownership.
Consent is not assignment. Publication is not a rights conveyance.**

# 3. Evidence methodology

Classifications used, never collapsed into a bare "unresolved":

**VERIFIED PRIMARY EVIDENCE** · **VERIFIED SECONDARY RECORD** (tracker-recorded, underlying
instrument not located) · **WRITTEN COMMUNICATION EVIDENCE** · **INFERENCE** · **CONFLICT** ·
**NOT LOCATED AFTER EXHAUSTIVE SEARCH** · **OWNER INPUT REQUIRED** · **REQUIRES TARGETED
PROFESSIONAL REVIEW**

Evidence levels: **A** primary executed · **B** structured primary record · **C**
contemporaneous written communication · **D** contemporaneous project record · **E**
secondary summary. **A higher level does not erase a lower one.**

# 4. Evidence sources examined

| Category | Scope | Status |
|---|---|---|
| Repository files | 1,162 files indexed | Complete |
| Binary documents | **90 PDF + 169 DOCX, 259 of 259 extracted, 7,313,550 bytes, zero failures** | Complete |
| **Images** | **4 of 4 rights-relevant screenshots visually inspected.** Other images are FOIL scans and a page capture, not rights evidence | **Complete** |
| Structured application data | `pilot_contacts`, `interaction_events` queried directly | **Complete. This layer held the consents** |
| Live application state | 4 endpoints | Complete |
| Git history | 2,031 commits, `-S` searches, per-file blame | Complete |
| Trackers | 9 records including historical and generated | Complete |
| Correspondence | `research/correspondence/`, 40+ message and reply records | Complete |
| **External published articles** | **3 LinkedIn articles fetched and read live** | **Complete** |
| Website | 54 public pages | Complete |

# 5. Consolidated executive findings

| # | Finding | Level | Classification |
|---|---|---|---|
| F-1 | **33 distinct people hold executed structured consents** (37 rows, 2026-08-19 to 2026-09-05) | B | **VERIFIED PRIMARY** |
| F-2 | **`consent_use` and `consent_transfer` are yes on 100%; zero refusals** | B | **VERIFIED PRIMARY** |
| F-3 | Consent scope is study publications and successor transfer. **Silent on licensing, commercial products, revenue, vendor platforms.** Revocable at will. No terms version stored | B | **VERIFIED PRIMARY** |
| F-4 | **No executed signed instrument exists anywhere.** No Level A evidence in the entire corpus | — | **NOT LOCATED AFTER EXHAUSTIVE SEARCH** |
| F-5 | **JRS publicly named and attributed to Wikes on 2026-06-02**; DRR publicly defined by him 2026-07-02 | C | **VERIFIED PRIMARY**, third-party timestamped |
| F-6 | Ubayet's authorship approval corroborated by transcript **and four primary images** | C | **VERIFIED PRIMARY** |
| F-7 | Hekim confirmed the CCI publication terms, recorded 2026-08-06 | D | **VERIFIED SECONDARY RECORD** |
| F-8 | **No USPTO filing or registration evidence** against 23 pages using `JRS™` | — | **NOT LOCATED AFTER EXHAUSTIVE SEARCH** |
| F-9 | **No JRS output has a DOI or publisher record** | — | **VERIFIED PRIMARY** |
| F-10 | **Four third-party processors, none publicly disclosed** | B | **VERIFIED PRIMARY** |
| F-11 | 85.5% of commits and 100% of surviving lines in core implementation carry the AI tool identity; the canonical standard is 89% human-attributed | D | **VERIFIED PRIMARY** as metadata; ownership **NOT ESTABLISHED** |
| F-12 | **No `package.json` or lockfile.** No transitive dependency obligations | — | **VERIFIED PRIMARY**, and a strength |

# 6. Complete JRS asset register

**38 assets.** Full table retained at `MASTER_JRS_ASSET_INVENTORY.md` and incorporated
here by reference, including A-36 to A-38, the three published articles.

| Category | Count | Rights position |
|---|---|---|
| Core methodology (standard, Codebook, DRR) | 4 | Owner assertion; **public attribution 2026-06-02** |
| Software (engine, API, OpenAPI, modules, guards) | 6 groups | Owner assertion; 100% tool-attributed lines |
| Field guides and practitioner resources | 7 | Owner assertion |
| Training and simulations | 2 | Owner assertion |
| Research datasets and studies | 4 | **33 executed consents, transfer yes** |
| Manuscripts and submissions | 5 | Co-authored; see section 10 |
| **Published articles** | **3** | **Self-published, attributed, externally timestamped** |
| Website, domain, branding | 3 | Use evidence only for marks |
| Rights and audit records | 4 | — |

# 7. Asset evidence profiles

Retained at `ASSET_PERSON_EVIDENCE_CROSS_REFERENCE.md`. Principal profiles:

**DRR construct.** Publicly defined by Wikes 2026-07-02 (E-027); JRS publicly attributed
to him 2026-06-02 (E-025); first repository use 2026-06-23. **Section 2.1 credit first
appears 2026-08-02, 61 days after public attribution.**

**Review Engine and API.** Token-gated, server-side, `claude-haiku-4-5-20251001`.
Record text not retained; result telemetry is. **Two conflicting OpenAPI documents.**
Engine declares its own stage as unvalidated in every response.

**Research evidence base.** 24-record constructed corpus; 16 experts, 11 countries, 384
graded judgments; **83.9%**, 95% CI 72.7 to 95.1; data lock 2026-08-15. **Pre-registered
reliability criterion NOT met** (point estimates clear 0.61; both lower bounds fail 0.41).

# 8. Contributor and person rights matrix

| Person | Role | Assets | Contribution ev. | Consent ev. | Release ev. | Co-author consent | Written communication | Commercial rights language | Assignment / transfer | Status | Remaining question |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Phillip Wikes** | Creator | All | E-015, E-025 to E-027 | n/a | n/a | n/a | **3 published articles** | n/a | Not located | **Public authorship attributed 2026-06-02** | Ownership unevidenced |
| **Hekim Colpan** | Panel reviewer; CCI co-author | Detection, CCI | Roster; E-001 | **E-001, executed 2026-08-19** | E-001 | Not in instrument | **E-010, E-022** | **E-010: prior approval required** | Not located | **Panel work covered; terms confirmed at Level D** | His own words on the CCI terms |
| **Ubayet Hossain** | Co-author; methodology | Detection, reliability | E-006 to E-008 | Not located | Not located | Not confirmed | **E-006 to E-008, corroborated by images** | **NOT LOCATED (E-021, targeted search complete)** | Not located | **Authorship corroborated** | **Commercial use and successor transfer** |
| **Tanvi Pokhriyal** | First author | Employment study | Roster; correspondence | **E-002, executed 2026-08-22** | E-002 | Not confirmed | Level D records | Not located | Not located | **Covered** | Co-author instrument unused |
| **Stacyann Young** | First author | Public records, RMJ | Roster; dossier | **E-003, executed 2026-08-27** | E-003 | Not confirmed | Level D records; **affiliation policy honoured** | Not located | Not located | **Covered** | Co-author instrument unused |
| **V-AI-08** | Section 2.1 argument | **Panel design** | Manuscript; E-024 | Contributor consent | Not located | n/a | Not located | Not located | **Not located** | **Credit only** | Assignment for the specific argument |
| 29 further contributors | Panel / raters | Studies | Roster | **E-004, executed** | E-004 | n/a | n/a | Not located | Not located | **Covered** | Scope limits apply |

# 9. Participant consent and release register

| Population | Consent type | Source | Level | Date range | Directly establishes | Does NOT establish | Status |
|---|---|---|---|---|---|---|---|
| **33 distinct people** | Contributor consent | `pilot_contacts` `source='contributor-confirm'` | **B** | 2026-08-19 to 2026-09-05 | Named in paper; credited name and contributed work may continue to be used in study publications **including by a successor organisation** | **Copyright assignment; irrevocability; exclusivity; licensing, commercial products, revenue or vendor-platform rights** | **VERIFIED PRIMARY** |
| 3 co-authors | Co-author consent | `api/_coauthor-roster.js`, terms `coauthor-v1.0-2026-08-24` | B | — | Instrument exists; **stores a terms version** | **Nothing: confirmed 0 of 3** | **NOT USED** |
| All participants | Tick-box registration | `privacy.html` and endpoints | B | continuous | Contact and naming elections, kept separate and never bundled | Any conveyance | **VERIFIED PRIMARY** |

**Project's own finding, preserved verbatim: "There is no signature anywhere. Nobody
signs anything."**

# 10. Co-author and authorship evidence register

Four relationships. **Three hold executed contributor consents. All four are outside the
co-author instrument, which none has used.**

| Person | Work | Author position | Authorship evidence | Rights instrument |
|---|---|---|---|---|
| Ubayet Hossain | Detection study | Co-author | **Corroborated Level C** | None |
| Hekim Colpan | CCI article (accepted) | **Named first**, equal co-authors | Level D confirmation | Contributor consent (panel work only) |
| Tanvi Pokhriyal | Employment study | First author | Roster + correspondence | Contributor consent |
| Stacyann Young | Public records / RMJ | First author | Roster + dossier | Contributor consent |

# 11. LinkedIn and informal written communication evidence

| Person | Date | Asset | Exact agreement or permission | Authorship language | Rights language | Commercial language | Transfer language | Classification |
|---|---|---|---|---|---|---|---|---|
| **Ubayet Hossain** | **2026-07-14** | Detection methodology | Methodology "**absolutely correct**"; AC1 floor "**standard and methodologically sound**"; attribution "**reads perfectly**"; "**ready for the next stage**"; reply to co-author offer: "**Happy to help!**" | **Located** | Located | **NOT located** | **NOT located** | **VERIFIED PRIMARY**, transcript **plus 4 primary images** |
| **Hekim Colpan** | **2026-08-05 / 08-06** | CCI article | Terms put: joint copyright; **prior approval for commercial, promotional, certification, training or marketing use of JRS material**. Recorded 2026-08-06: "**He confirmed the terms**", conditions set and met | Located | **Located** | **Located** | Not located | **VERIFIED SECONDARY RECORD** |
| Stacyann Young | 2026-07-20, 2026-08-09 | FOIL study, certificate | Committed to additional documented cases; three changes to her recognition applied; **affiliation policy set 2026-08-09** | Located | Not located | Not located | Not located | **VERIFIED SECONDARY RECORD** |
| Tanvi Pokhriyal | 2026-08-21 | Employment study | Acknowledgment and email records | Located | Not located | Not located | Not located | **VERIFIED SECONDARY RECORD** |

**No legal conclusion on enforceability is offered.**

# 12. DRR origin and development evidence record

**Four distinct questions, kept separate.**

| Question | Evidence | Classification |
|---|---|---|
| **DRR concept origin** | **JRS publicly named and attributed to Wikes 2026-06-02** (E-025), four assessment dimensions described; **The Reconstructability Test published 2026-06-11** with JRS "built upon this test" (E-026); **DRR publicly defined by him 2026-07-02** (E-027). Repository first use 2026-06-23 | **VERIFIED PRIMARY, third-party timestamped.** Consistent with the owner's stated origination |
| **DRR development** | Codebook v1.0; repository history 2026-04-14 onward | **VERIFIED PRIMARY** |
| **DRR contribution by others** | V-AI-08 contributed the Section 2.1 argument: that "a record must remain understandable to the person it describes and that linguistic and jurisdictional range is a property of review rather than a courtesy", which drove **international panel design**. Credit first appears **2026-08-02** | **WRITTEN COMMUNICATION EVIDENCE.** **This is an accessibility and study-design argument, not the DRR construct** |
| **DRR publication** | Three self-published articles. **No peer-reviewed publication, no DOI** | **VERIFIED PRIMARY** |

**Owner position:** Phillip Wikes states DRR was his idea. **The evidence located is
consistent with that position and includes three externally timestamped publications,
the earliest 61 days before the Section 2.1 credit appears.** No broader legal ownership
conclusion is drawn.

# 13. AI-assisted creation evidence record

| Aspect | Evidence | Classification |
|---|---|---|
| AI-assisted development | 1,737 of 2,031 commits (85.5%); 1,100 explicit co-authorship trailers; 100% of surviving lines in API modules, `openapi.json`, `codebook.html`, `training.html` | **VERIFIED PRIMARY** as metadata |
| Human conception | **The three published articles predate or accompany the build and are attributed to Wikes** | **WRITTEN COMMUNICATION EVIDENCE**, partial |
| Human direction | Commit messages record instructions, corrections and refusals; the tracker records decisions in the owner's voice throughout | **VERIFIED SECONDARY RECORD**, partial |
| Human review, selection, revision, acceptance | Not tied to specific artifacts | **NOT ESTABLISHED FROM ACCESSIBLE CORPUS** |

**No provenance was manufactured. Neither exclusive human nor exclusive AI authorship is
inferred from repository metadata.**

# 14. Master Tracker historical evidence

Nine tracker records searched full-text plus git history. Material recoveries:

- The tracker's **own analysis of the contributor consent scope**, preserved verbatim in section 9.
- The line that led to the co-author consent discovery: contributor links went to "**19 people: 15 verified Arm A completers, co-authors Ubayet Hossain M-01 and Stacy Young E-08**".
- **"He confirmed the terms"** for Hekim, 2026-08-06.
- The USPTO sequencing analysis: filing personally then assigning creates a recordation gap; file in an entity's name.
- Ubayet "**REVIEWED and APPROVED 2026-07-14**", byline acceptance confirmed 2026-07-27.

# 15. Third-party materials and dependencies

| Third party | Relationship | Terms located | Dependency type | Rights question | Status |
|---|---|---|---|---|---|
| Anthropic | Model inference | Not located | Service | Subprocessor disclosure | **Undisclosed publicly** |
| Vercel | Hosting / edge | Not located | Service | as above | **Undisclosed publicly** |
| Supabase | Data storage | Not located | Service | as above | **Undisclosed publicly** |
| **Formspree** | Form processing (`pilot.html`) | Not located | Service | as above | **Undisclosed publicly** |
| Google Fonts / GTM | Content / analytics | Public terms, not restated | Content / service | Low | Acceptable |
| **npm dependency tree** | **Absent** | n/a | **None** | **None** | **Strength** |

**Technology dependency is not third-party ownership**, and none of the above is
recorded as a contributor.

# 16. IP strategic value record

| Asset | Strategic function | Maturity | Differentiation | Validation | Rights clarity | Classification |
|---|---|---|---|---|---|---|
| Methodology + Codebook | Defines the construct | v1.0, publicly attributed 2026-06-02 | High | Detection measured | Owner assertion; **public attribution strong** | **CORE STRATEGIC ASSET** |
| DRR construct | The named property | Publicly defined 2026-07-02 | High | Detection measured | **Origination evidence external and dated** | **CORE STRATEGIC ASSET** |
| Research evidence base | Proof of detectability | Data lock 2026-08-15 | High | Positive result **and reported negative** | **33 consents, transfer yes** | **CORE STRATEGIC ASSET** |
| Review Engine + API | Implementation | Operational validation | Medium | Unvalidated by its own payload | 100% tool-attributed | **HIGH STRATEGIC RELEVANCE** |
| Guides, training, simulations | Delivery | Published | Medium | n/a | Owner assertion | **SUPPORTING ASSET** |
| Guard suite | Integrity control | 126 checks | High for diligence | n/a | Owner assertion | **SUPPORTING ASSET** |
| Trademarks | Brand | Use only | n/a | n/a | **No filing evidence** | **EARLY-STAGE ASSET** |

**Not a monetary valuation.**

# 17. Superseded or corrected findings

| # | Prior finding | Source | New evidence | Corrected status | Explanation |
|---|---|---|---|---|---|
| 1 | "0 rights documents located" | 2026-09-08 | E-001 to E-004 | **SUPERSEDED** | Files searched, not structured data |
| 2 | "Hekim: instrument None" | 2026-09-09 | E-001 | **CORRECTED** | Category error: co-author roster searched, contributor instrument not |
| 3 | "Tanvi / Stacyann not confirmed" | 2026-09-09 | E-002, E-003 | **CORRECTED** | True of one instrument, misleading overall |
| 4 | "Ubayet: no consent of either kind" | 2026-09-09 | E-006 to E-008 | **CORRECTED** | **Reporting fault: search found 4 files, output printed 2** |
| 5 | "0 DOI strings anywhere" | 2026-09-09 | E-018 | **SUPERSEDED** | 3 exist, all citations; conclusion intact |
| 6 | "three subprocessors" | 2026-09-08 | E-019 | **SUPERSEDED** | Four |
| 7 | "Images never examined" | 2026-09-09 | 4 of 4 viewed | **CLOSED** | Gap the audit recorded against itself |
| 8 | "Section 2.1 sits inside the core construct" | 2026-09-09 | E-023, E-024, E-025 | **CORRECTED** | Accessibility and study-design argument; **DRR publicly attributed 61 days earlier** |
| 9 | "Hekim CCI terms acceptance not located" | 2026-09-09 | E-022 | **SUPERSEDED** | Contemporaneously recorded as confirmed, Level D |

**No prior finding was deleted.**

# 18. Genuine evidence not located

After the full protocol: executed signed instruments of any kind; assignment,
work-for-hire and contractor agreements; USPTO filing records; publisher agreements;
DOI or acceptance letters; domain registrar records; DPA, SLA, repository licence;
**commercial or transfer language for Ubayet Hossain (E-021, targeted search complete)**;
Hekim's own words accepting the CCI terms; retention and deletion policy.

# 19. Owner input required

1. **Ubayet:** may his contribution be used in paid or licensed material, and does that travel to a successor? **This is the only outstanding rights question for him.**
2. **Section 2.1 contributor:** assignment for the specific accessibility argument.
3. **AI involvement account**: conception, direction, review, selection, acceptance.
4. Canonical OpenAPI designation; Codebook-to-API correspondence; `JRS_SANDBOX_OPEN` state; telemetry retention; Formspree status; trademark filing status; domain registrar; publisher agreements.

# 20. Chain-of-title issue register

| ID | Asset / person | Precise question | Evidence located | Not located | Classification | Recommended action |
|---|---|---|---|---|---|---|
| CT-1 | Ubayet / reliability framework | Paid or licensed use, and successor transfer? | Authorship corroborated | **Commercial and transfer language (search complete)** | **OWNER INPUT REQUIRED** | Ask him one question |
| CT-2 | V-AI-08 / panel design | Assignment for the accessibility argument? | Credit permission; contribution characterised | Any instrument | **OWNER INPUT REQUIRED** | Request assignment |
| CT-3 | Hekim / CCI | Terms accepted? | **Recorded as confirmed 2026-08-06** | His own words | **EVIDENCE GATHERED** | Retrieve his reply only if Level C is wanted |
| CT-4 | 33 contributors | Revocability against exclusivity | Consents executed | Irrevocability | **REQUIRES TARGETED PROFESSIONAL REVIEW** | Counsel |
| CT-5 | AI-assisted assets | Human conception and direction | Attribution measured; articles dated | The account itself | **OWNER INPUT REQUIRED** | Answer question 3 |
| CT-6 | Trademarks | Filed? | Preparation dossier | Filing evidence | **EXTERNAL EVIDENCE REQUIRED** | USPTO check |
| CT-7 | Published articles | Durability | 3 articles read live | **Archived copies** | **NOT MATERIAL AT CURRENT STAGE, but cheap to close** | Capture dated PDFs |

# 21. Matters potentially requiring targeted professional review

Revocable consent against any exclusive or perpetual grant; the AI-assisted authorship
question; employer context during the creation window (KPMG India appears in the Ubayet
source images while the correspondence record states personal capacity); whether
"successor organization" as worded reaches a licensing model; publisher rights on the
two accepted articles.

# 22. Final factual readiness assessment

**The rights position is materially stronger than the first passes reported and the
outstanding questions are few and specific.**

**33 people hold executed structured consents including successor transfer.** Public,
externally timestamped authorship of JRS and DRR is established from 2026-06-02.
Ubayet's authorship is corroborated by primary images. Hekim's terms are recorded as
confirmed.

**What remains is three questions, none discoverable by further repository searching**,
and one durability task that takes minutes.

**No asset is classified as legally owned. That classification requires evidence that
does not exist in this corpus.**

# 23. Complete evidence index

`EVIDENCE_LEDGER.md`, **27 entries**, E-001 to E-027. **No Level A entry exists.**

Supporting registers retained as sources: `MASTER_JRS_ASSET_INVENTORY.md`,
`EXHAUSTIVE_PARTICIPANT_AND_CONTRIBUTOR_RELEASE_AUDIT.md`,
`UBAYET_HOSSAIN_LINKEDIN_EVIDENCE_RECORD.md`,
`PUBLISHED_ARTICLE_AUTHORSHIP_EVIDENCE.md`,
`PERSON_BY_PERSON_EVIDENCE_AUDIT.md`, `STALE_STATUS_CORRECTION_REGISTER.md`,
`MASTER_TRACKER_RELEASE_AND_RIGHTS_RECONSTRUCTION.md`,
`PROGRAMME_STATUS_PARTICIPANT_AND_RELEASE_CROSSWALK.md`,
`ASSET_PERSON_EVIDENCE_CROSS_REFERENCE.md`, `MISSING_EVIDENCE_REGISTER.md`,
`OWNER_INPUT_QUESTIONNAIRE.md`, `CORPUS_INVENTORY.md`,
`AI_ASSISTED_CREATION_PROVENANCE_RECORD.md`, `TRADEMARK_AND_BRAND_EVIDENCE_DOSSIER.md`,
`RIGHTS_AND_AGREEMENTS_EVIDENCE_REGISTER.md`, `DRR_CONTRIBUTOR_EVIDENCE_DOSSIER.md`,
`RESEARCH_AUTHOR_CONTRIBUTION_DOSSIER.md`, `PUBLICATION_STATUS_AND_RIGHTS_REGISTER.md`,
`CHAIN_OF_TITLE_CONTRADICTION_REGISTER.md`, `EMPLOYMENT_AND_CREATION_CONTEXT_RECORD.md`.

---

# 24. Future update protocol

**Do not restart the audit. Do not overwrite history.**

1. Add the new evidence as a ledger entry.
2. Name the finding it changes.
3. Update the status.
4. Preserve the prior status in section 17.
5. Update the index.

**This register must become more complete over time rather than being rebuilt.**
