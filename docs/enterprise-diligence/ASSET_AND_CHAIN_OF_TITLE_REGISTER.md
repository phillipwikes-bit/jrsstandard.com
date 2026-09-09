# JRS Asset and Chain-of-Title Register

## 1. Document control

| Field | Value |
|---|---|
| Version | **2.0, rebuilt from underlying evidence** |
| Date | 2026-09-09 |
| Supersedes | Version 1.0 (2026-09-09), preserved in git history at the prior commit |
| Method | **Rebuilt from the evidence ledger, not merged from prior reports** |
| Traceability | Every finding cites an `E-###` entry in `EVIDENCE_LEDGER.md` |
| Prior registers | Treated as evidence sources, **not as authoritative conclusions** |

## 2. Purpose and scope

To state what the accessible evidence establishes about the JRS asset suite and its
chain-of-title questions. **The objective is not to make JRS appear ownership-complete.**

**This is not legal advice, and no asset is classified as legally owned**, because no
evidence supporting that classification was located.

## 3. Audit scope and corpus map

| Source category | Locations examined | File types | Searchable directly | OCR required | Structured extraction | Status |
|---|---|---|---|---|---|---|
| Repository root | `/` | html, json, pdf, md | yes | no | no | **Complete** |
| Research corpus | `research/` (598 files) | md, docx, pdf, csv | partly | no | **yes, done** | **Complete** |
| **Evidence directory** | `research/evidence/` | **png**, md | no | **yes** | n/a | **Complete: 4 of 4 images viewed 2026-09-09** |
| Correspondence | `research/correspondence/` | md | yes | no | no | **Complete** |
| Scripts | `scripts/` (145) | py | yes | no | no | Complete |
| API and source | `api/` (56) | js | yes | no | no | Complete |
| Structured application data | `pilot_contacts`, `interaction_events` | Postgres | no | no | **yes, queried** | **Complete** |
| Live application state | 4 endpoints | JSON | yes | no | no | Complete |
| Git metadata | 2,031 commits | — | yes | no | yes | Complete |
| Trackers | 9 records | md, docx, pdf | yes | no | yes | Complete |
| Website | 54 public pages | html | yes | no | no | Complete |

## 4. Evidence sources examined

1,162 files. **259 of 259 binaries text-extracted** (90 PDF, 169 DOCX; 7,313,550 bytes,
zero failures). **4 of 4 evidence images visually inspected.** Structured data queried
directly. Git history searched with `-S`. Nine tracker records searched full-text.

## 5. Search methodology and coverage

| Pass | Executed | Result |
|---|---|---|
| A Asset discovery | yes | 35 material assets |
| B Person and identity | yes | See section 10 |
| C Rights language | yes | 30+ terms across text and binary corpora |
| D Tracker and historical | yes | 9 records, plus git history |
| **E Screenshot and image** | **yes, 2026-09-09** | **4 images viewed. Closed a gap this audit had itself recorded as standing** |
| F Structured data | yes | **The pass that located the consent records** |
| G Git and software provenance | yes | Attribution measured per file |

## 6. Evidence classification framework

Levels A to E per `EVIDENCE_LEDGER.md`. **Higher levels do not automatically invalidate
lower ones.** Classifications are never collapsed into a single "unresolved".

## 7. Consolidated executive findings

| # | Finding | Evidence | Classification |
|---|---|---|---|
| 1 | **33 distinct people hold executed consent records**, 37 rows, 2026-08-19 to 2026-09-05 | E-004 | **VERIFIED DIRECT** |
| 2 | **`consent_use` and `consent_transfer` are yes on 100%, zero refusals** | E-004 | **VERIFIED DIRECT** |
| 3 | Consent scope is **study publications and successor transfer**. It is **silent on licensing, commercial products, revenue and vendor platforms** | E-012 | **VERIFIED DIRECT** |
| 4 | The consent is **revocable at will** and stores **no terms version** | E-012, E-011 | **VERIFIED DIRECT** |
| 5 | **No executed signed instrument exists anywhere.** No Level A evidence in the ledger | E-016, E-009 | **NOT LOCATED after full-protocol search** |
| 6 | The co-author instrument **asks the commercial question directly and is unused by all three** | E-013, E-005 | **VERIFIED DIRECT** |
| 7 | Ubayet Hossain's authorship consent is **corroborated by two independent sources**: transcript and primary image | E-006, E-007, E-008 | **CORROBORATED** |
| 8 | His exchange is **silent on commercial use and transfer** | E-006 to E-008 | **VERIFIED DIRECT** |
| 9 | Hekim Colpan's written CCI terms **restrict commercial use of JRS material by prior approval**; acceptance not located | E-010 | **WRITTEN COMMUNICATION / acceptance NOT LOCATED** |
| 10 | **No USPTO filing or registration evidence** against 23 pages using `JRS™` | E-017 | **NOT LOCATED after full-protocol search** |
| 11 | **No JRS output has a DOI** | E-018 | **VERIFIED DIRECT** |
| 12 | **Four third-party processors**, none published | E-019 | **VERIFIED DIRECT** |
| 13 | **85.5% of commits and 100% of surviving lines** in core implementation carry the AI tool identity | E-014 | **VERIFIED DIRECT**, ownership **NOT ESTABLISHED** |
| 14 | The canonical standard is **89% human-attributed** | E-015 | **VERIFIED DIRECT** |

## 8. Complete JRS asset register

See `MASTER_JRS_ASSET_INVENTORY.md`, 35 assets, unchanged and incorporated by reference.

## 9. Asset evidence profiles

See `ASSET_PERSON_EVIDENCE_CROSS_REFERENCE.md`.

## 10. Contributor and identity resolution register

| Identity | Resolves to | Classification | Evidence |
|---|---|---|---|
| `phillipwikes-bit` / `Phillip Wikes` | One person | **VERIFIED SAME PERSON** | Same email in git metadata |
| `Ubayet` / `Ubyatt Hossaine` / `U.H.` / M-01 | Ubayet Hossain | **VERIFIED SAME PERSON** | Roster code plus transcript |
| `Stacyann` / `Stacy Anne` / `S.Y.` / E-08 | Stacyann Young | **VERIFIED SAME PERSON** | Roster code |
| `Hekim` / `Colpan` / V-AI-20 | Hekim Colpan | **VERIFIED SAME PERSON** | Roster code plus consent row |
| `Philip Wicks` | Phillip Wikes | **PROBABLE SAME PERSON** | Auto-generated podcast transcript mis-rendering |
| `Claude <noreply@anthropic.com>` | AI tool identity | **DISTINCT, NOT A PERSON** | Commit metadata |
| `Jeff Billups`, `Anholzer, Bill` | Unknown | **NOT RESOLVED** | DOCX metadata only, in no roster |
| `R-` vs `RR-` codes | Two populations | **DISTINCT** | Reliability raters vs comparison completers |

## 11. Contributor and person rights matrix

| Person | Identity | Role | Assets | Contribution ev. | Consent ev. | Release ev. | Co-author ev. | Written agreement | Commercial language | Assignment ev. | Strength | Status | Remaining question |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Phillip Wikes | Verified | Creator | All | E-015 | n/a | n/a | n/a | n/a | n/a | Not located | D | Owner assertion | Ownership unevidenced |
| **Hekim Colpan** | Verified | Panel + CCI co-author | Detection, CCI | Roster | **E-001, executed** | E-001 | E-010 | **E-010** | **E-010: prior approval required** | Not located | **B + C** | Panel covered | CCI co-authorship rights; terms acceptance |
| **Ubayet Hossain** | Verified | Co-author, methodology | Detection, reliability | E-006 to E-008 | Not located | Not located | **E-006 to E-008, corroborated** | **E-006** | **Not located** | Not located | **C, corroborated** | Authorship evidenced | **Commercial use and transfer** |
| **Tanvi Pokhriyal** | Verified | First author | Employment study | Roster | **E-002, executed** | E-002 | Not confirmed | Not located | Not located | Not located | **B** | Covered | Co-author instrument unused |
| **Stacyann Young** | Verified | First author | Public records, RMJ | Roster | **E-003, executed** | E-003 | Not confirmed | Not located | Not located | Not located | **B** | Covered | Co-author instrument unused |
| **Section 2.1 contributor** | Verified (V-AI-08) | Originated DRR argument | DRR core construct | Manuscript | Contributor consent | Not located | n/a | Not located | Not located | **Not located** | C | **Credit only** | **Assignment** |
| 29 further contributors | Verified by code | Panel / raters | Studies | Roster | **E-004, executed** | E-004 | n/a | n/a | Not located | Not located | **B** | Covered | Scope limits apply |

## 12. Participant consent and release register

See `PROGRAMME_STATUS_PARTICIPANT_AND_RELEASE_CROSSWALK.md` and
`EXHAUSTIVE_PARTICIPANT_AND_CONTRIBUTOR_RELEASE_AUDIT.md`.

## 13. Co-author and authorship evidence register

Four relationships. Three hold executed contributor consents; **all four are outside the
co-author instrument**, which none has used (E-005).

## 14. Written communications and informal agreement evidence

| Communication | Date | Participants | Permission | Authorship | Attribution | Publication | Commercial | Transfer |
|---|---|---|---|---|---|---|---|---|
| LinkedIn, corroborated by image | 2026-07-14 | Wikes, Hossain | **located** | **located** | **located** | **located** | **not located** | **not located** |
| Publication terms reply | 2026-08-05 | Wikes to Colpan | located | located | located | located | **located: prior approval required** | not located |

**No legal conclusion on enforceability is offered.**

## 15. AI-assisted creation provenance record

See `AI_ASSISTED_CREATION_PROVENANCE_RECORD.md`. Human conception, direction, review,
selection and acceptance: **NOT ESTABLISHED FROM ACCESSIBLE CORPUS** for the assets at
100% tool attribution. No provenance was manufactured.

## 16. Third-party materials and dependencies

| Third party | Relationship | Asset | Terms located | Rights question | Status |
|---|---|---|---|---|---|
| Anthropic | Service dependency | Review Engine | Not located | Subprocessor disclosure | **Undisclosed publicly** |
| Vercel | Service dependency | Hosting | Not located | as above | **Undisclosed publicly** |
| Supabase | Service dependency | Data | Not located | as above | **Undisclosed publicly** |
| **Formspree** | Service dependency | `pilot.html` | Not located | as above | **Undisclosed publicly** |
| Google Fonts | Third-party content | Site-wide | Public terms, not restated | Low | Acceptable |
| npm dependency tree | **Absent** | — | n/a | **None** | **Strength: no transitive obligations** |

## 17. IP asset value tracker

| Asset | Strategic function | Maturity | Differentiation | Validation | Rights clarity | Classification |
|---|---|---|---|---|---|---|
| Methodology + Codebook | Defines the construct | Published v1.0 | High | Detection measured | **Contributor argument embedded** | **CORE STRATEGIC ASSET** |
| DRR construct | The named property | Named 2026-06-23 | High | Detection measured | **Section 2.1 unassigned** | **CORE STRATEGIC ASSET** |
| Research evidence base | Proof of detectability | Data lock 2026-08-15 | High | Positive + reported negative | **33 consents, transfer yes** | **CORE STRATEGIC ASSET** |
| Review Engine + API | Implementation | Operational validation | Medium | Unvalidated by its own payload | 100% tool-attributed | **HIGH STRATEGIC RELEVANCE** |
| Field guides, training, simulations | Delivery | Published | Medium | n/a | Owner assertion | **SUPPORTING ASSET** |
| Guard suite | Integrity control | 126 checks | High for diligence | n/a | Owner assertion | **SUPPORTING ASSET** |
| Trademarks | Brand | Use only | n/a | n/a | **No filing evidence** | **EARLY-STAGE ASSET** |

**No dollar values assigned.**

## 18. Superseded or corrected findings

| Prior finding | Source | Original limitation | Later evidence | Corrected status | Explanation |
|---|---|---|---|---|---|
| "0 rights documents located" | 2026-09-08 | Files searched, not structured data | E-001 to E-004 | **SUPERSEDED** | 33 people hold executed consents |
| "Hekim: instrument None" | 2026-09-09 | Co-author roster only | E-001 | **CORRECTED** | Category error |
| "Tanvi / Stacyann not confirmed" | 2026-09-09 | Co-author instrument only | E-002, E-003 | **CORRECTED** | True of one instrument, misleading overall |
| "Ubayet: no consent of either kind" | 2026-09-09 | **Output truncated to 2 of 4 hits** | E-006 to E-008 | **CORRECTED** | Reporting fault, not a search fault |
| "0 DOI strings anywhere" | 2026-09-09 | Text files only | E-018 | **SUPERSEDED** | 3 exist, all citations; conclusion intact |
| "three subprocessors" | 2026-09-08 | Scope | E-019 | **SUPERSEDED** | Four |
| "Images never examined" | 2026-09-09 | Extraction gap | **PASS E, 4 of 4 viewed** | **CLOSED** | Gap this audit recorded against itself |

**No earlier error was silently deleted.**

## 19. Chain-of-title issue register

| ID | Asset / person | Precise question | Evidence located | Evidence missing | Why it matters | Classification | Next step |
|---|---|---|---|---|---|---|---|
| CT-1 | Ubayet Hossain / reliability framework | May his contribution be used in paid or licensed material, and does that travel to a successor? | Authorship corroborated (E-006 to E-008) | **NO ADDITIONAL COMMERCIAL OR TRANSFER LANGUAGE LOCATED IN ACCESSIBLE EVIDENCE** (E-021, targeted search complete) | He designed the framework the detection paper reports | **OWNER INPUT REQUIRED** | Ask him the single question. **No further repository search will answer it** |
| CT-2 | Section 2.1 contributor / **panel design** | Was any assignment agreed for the accessibility argument? | Credit permission; **contribution precisely characterised (E-024)** | **Any instrument** | **Shaped panel design. NOT the DRR construct: DRR predates the credit by six weeks (E-023)** | **OWNER INPUT REQUIRED** | Request assignment for the specific argument |
| CT-3 | Hekim Colpan / CCI | Were the 2026-08-05 terms accepted? | **Terms located (E-010) AND contemporaneously recorded as confirmed 2026-08-06 (E-022)** | **His own words; the record is the owner's characterisation** | If accepted, restricts commercial use of JRS material | **TRACKER-RECORDED EVIDENCE at Level D** | Retrieve his actual reply if a stronger record is wanted |
| CT-4 | 33 contributors | Does consent survive revocation risk? | Consents executed | Irrevocability | Revocable licence cannot support exclusivity | **REQUIRES TARGETED PROFESSIONAL REVIEW** | Counsel |
| CT-5 | AI-assisted assets | What human conception and direction occurred? | Attribution measured | **The account itself** | Counsel will ask first | **OWNER INPUT REQUIRED** | Answer B1 |
| CT-6 | Trademarks | Filed? | Preparation dossier | **Filing evidence** | 23 pages use `JRS™` | **EXTERNAL EVIDENCE REQUIRED** | USPTO check |
| CT-7 | Contributor instrument | What wording was in force per row? | Current wording | **Terms version** | Provability | **FACTUALLY RESOLVED as a gap** | Add versioning |

## 20. Evidence not located in the accessible corpus

Executed signed instruments of any kind; assignment, work-for-hire and contractor
agreements; USPTO filing records; publisher agreements; DOI or acceptance letters for
JRS outputs; domain registrar records; DPA, SLA, licence; acceptance of the CCI terms;
commercial or transfer language for Ubayet Hossain.

## 21. Owner input required

CT-1, CT-2, CT-5; plus the eleven items in `OWNER_INPUT_QUESTIONNAIRE.md`.

## 22. External evidence potentially required

CT-3, CT-6; publisher agreements; registrar record; the LinkedIn thread beyond the four
captured screenshots.

## 23. Matters potentially requiring targeted professional review

CT-4 revocability against exclusivity; the AI-assisted authorship question; employer
context during the creation window; whether successor transfer as worded reaches a
licensing model.

## 24. Final factual readiness assessment

**Evidence gathering is materially complete for the accessible corpus.** The rights
position is **better than the first two passes reported and narrower than the third**:
**33 people hold executed structured consents including transfer**, and the outstanding
questions reduce to **one question for one person (CT-1)**, **one assignment (CT-2)**,
and **one acceptance to confirm (CT-3)**.

**What remains genuinely unresolved is not discoverable by further repository searching.**

## 25. Evidence index

`EVIDENCE_LEDGER.md`, 20 entries. **No Level A entry exists.**

## 26. Search completion manifest

| Requirement | Status |
|---|---|
| All material asset categories searched | **yes** |
| All identifiable contributors searched by identity and variant | **yes** |
| Historical trackers searched | **yes**, 9 records |
| Consent and release terminology searched | **yes**, 30+ terms |
| Structured data searched | **yes** |
| **Screenshots and OCR-capable sources searched** | **yes, 4 of 4 images viewed** |
| Priority individuals reconciled | **yes**, 5 |
| Prior negative findings tested | **yes**, 11 |
| Conflicting evidence preserved | **yes** |
| Remaining gaps specifically defined | **yes**, CT-1 to CT-7 |
| Adversarial search completed | **yes**, see below |
| Traceable to an evidence ledger | **yes** |

**Adversarial pass.** The conclusion most dependent on omission was "no executed
instrument exists". It was re-tested against structured data, which is where the
consents were found, and against images, which corroborated the Ubayet exchange. **The
person most likely to have evidence scattered across source types was Ubayet Hossain,
and he did: a text transcript, four images, a correspondence record and a tracker line.**

**Limitation stated rather than glossed:** external email and LinkedIn threads beyond
the four captured screenshots are outside the access boundary.

**FINAL ASSESSMENT: BROAD EVIDENCE DISCOVERY COMPLETE.**

---

# TARGETED CLOSURE PASS, 2026-09-09

**No broad crawl was run.** Three targeted searches only, per the closure protocol.

## CT-1 Ubayet Hossain: commercial and transfer language

**Searched:** the five Ubayet-specific accessible sources (the LinkedIn transcript, the
correspondence record, and three message records) for `commercial`, `licen[cs]`, `paid`,
`revenue`, `royalt`, `successor`, `acquir`, `assign`, `transfer`, `sold`, `monet`.

**Result: NO ADDITIONAL COMMERCIAL OR TRANSFER LANGUAGE LOCATED IN ACCESSIBLE EVIDENCE.**
Zero hits across all five sources (E-021).

**His authorship position is unchanged and remains corroborated.** The targeted search is
complete and **no further repository searching will answer this question.**

## CT-2 Section 2.1 contributor, and the DRR origination correction

**A correction to my own earlier phrasing.** Five of my registers described the
contribution as sitting "inside the core construct". **That overstates it, and the
chronology contradicts it.**

| Fact | Evidence |
|---|---|
| DRR first used in the repository | **2026-06-23**, commit `9ea3687` (E-023) |
| Section 2.1 credit first appears | **2026-08-02**, commit `6506e05` (E-023) |
| Gap | **Six weeks. The construct was named and in use before the credited argument entered the record** |

**What the contribution actually is (E-024):** that "a record must remain understandable
to the person it describes and that linguistic and jurisdictional range is a property of
review rather than a courtesy", and that argument "is the reason this study was designed
around an international panel rather than a single-jurisdiction one".

**That is an accessibility and study-design argument. It is not the DRR construct**,
which concerns whether a record's conclusion can be reconstructed from the record itself.

**Owner position, recorded as such:** Phillip Wikes states DRR was his idea. **The
repository chronology is consistent with that position.** The contributor question is
therefore narrower than my registers implied: an assignment for a specific argument that
shaped panel design, not for the construct.

**Diligence risk for this item is reduced from High to Medium** on this evidence.

## CT-3 Hekim Colpan: acceptance of the 2026-08-05 CCI terms

**Located, and it upgrades the prior finding.**
`research/Reply_Hekim_EqualCoAuthors_2026-08-06.md`, dated **the day after** the terms,
records: "**He confirmed the terms**, restated the equal-co-authorship request, supplied
his own biography and disclosure wording, set a condition on the JRS figures, and said
what he will do next" (E-022).

The reply then confirms each of his conditions was met: equal co-authorship with
alphabetical byline, his biography and disclosure "in exactly as you wrote them, word for
word", and every figure carrying its method.

**Classification: TRACKER-RECORDED / CONTEMPORANEOUS PROJECT RECORD, Level D.**

**What this establishes:** the project record contemporaneously states he confirmed the
terms, and documents a negotiated exchange in which he set conditions that were then met.

**What it does not establish:** his own words. The record is the owner's contemporaneous
characterisation, and the underlying message from him is not reproduced in the corpus.

**Prior status "acceptance NOT located" is SUPERSEDED.** The accurate status is
**contemporaneously recorded as confirmed at Level D, with his own words not captured.**

## Final assessment

**BROAD EVIDENCE DISCOVERY COMPLETE. TARGETED RIGHTS QUESTIONS REMAIN.**

The remaining questions are **not discoverable by further repository searching**:

1. **CT-1** Ubayet: one question, to be put to him directly.
2. **CT-2** Section 2.1: an assignment for the specific accessibility argument.
3. **CT-3** Hekim: his own reply, if a Level C record is wanted in place of Level D.
