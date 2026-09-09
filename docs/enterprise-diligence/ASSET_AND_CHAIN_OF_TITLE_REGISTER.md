# JRS Asset and Chain-of-Title Register

**Built:** 2026-09-09 · **Baseline:** the findings in `INBOUND_ENTERPRISE_DILIGENCE_PACKAGE.md`,
`CHANGE_AND_VERIFICATION_REPORT.md` and `EVIDENCE_AND_LIMITATIONS_REGISTER.md` (2026-09-08)
are treated as the existing record. **Nothing in those documents is overwritten,
contradicted or silently superseded.** This register confirms, extends, or flags shift
against them, and preserves unresolved conflicts as unresolved.

**This is not legal advice.** No asset is upgraded to verified legal ownership, because
no new documentary evidence supporting that conclusion was located.

## Classification key

VERIFIED · EVIDENCE OF AUTHORSHIP OR CREATION · CONTRIBUTOR EVIDENCE · THIRD-PARTY
CONTENT · POSSIBLE OWNERSHIP ISSUE · UNRESOLVED · GAP · NOT AUDITABLE · OWNER INPUT
REQUIRED

---

# 1. Executive evidence summary

| Metric | Count | Note |
|---|---|---|
| Public HTML pages | 54 | Deployed assets |
| Public PDFs at repository root | 12 | Served as static downloads |
| API modules | 56 | Server-side |
| OpenAPI documents | 2 | **Conflicting versions, unresolved from baseline** |
| Research files | 598 | Never deployed |
| Scripts | 145 | Never deployed |
| Total commits in history | 2,031 | 2026-04-14 to 2026-09-08 |
| Distinct human commit identities | **1 person, 2 identities** | `phillipwikes-bit` (292) and `Phillip Wikes` (1), same email |
| Commits authored under the `Claude` identity | **1,737 (85.5%)** | AI-assisted creation evidence, Section 5 |
| Commits carrying a `Co-Authored-By: Claude` trailer | 1,100 | Explicit AI-assistance disclosure in the record |
| Rights documents located (assignment, work-for-hire, contractor, co-author) | **0** | GAP |
| Repository licence | **0** | GAP, confirms baseline C-1 |
| USPTO serial or registration numbers located | **0** | Against 23 pages using the `JRS™` symbol |
| DOI strings located anywhere in the repository | **0** | No published-with-DOI evidence |
| Third-party runtime processors evidenced in code | **4** | One more than the baseline recorded |
| Package manifests (`package.json`, lockfile) | **0** | No declared software dependency tree |

**No ownership percentage is calculated**, because the evidence does not support
apportioning ownership and doing so would convert authorship evidence into a legal
conclusion.

---

# 2. Verified asset baseline

What the evidence directly establishes:

| Finding | Classification |
|---|---|
| A repository exists with continuous history from **2026-04-14** to **2026-09-08**, 2,031 commits | **VERIFIED** |
| 54 public HTML pages, 12 root PDFs, 56 API modules, 2 OpenAPI documents, 598 research files, 145 scripts exist at the stated paths | **VERIFIED** |
| A canonical Codebook exists with five named conditions, definitions and detection criteria (`codebook.html`, version string `1.0`) | **VERIFIED** |
| A token-gated review API exists at `/api/v1/review-engine` | **VERIFIED** |
| The engine declares its own stage as unvalidated in every response payload | **VERIFIED** |
| The pre-registered inter-rater reliability criterion **was not met** | **VERIFIED, and preserved as a negative finding** |
| Detection study: 83.9% mean reviewer accuracy, 95% CI 72.7 to 95.1, n = 16, 384 graded judgments, data lock 2026-08-15 | **VERIFIED** |
| **There is no signature anywhere on this project.** Every permission is a tick box plus a stored boolean | **VERIFIED** (`research/CONSENT_AND_RELEASE_AUDIT_2026-08-13.md`, quoted verbatim) |
| No package manifest exists, so there is no declared npm dependency tree | **VERIFIED** |

---

# 3. Creation and contributor evidence

**Factual mapping only.** Evidence of authorship is not converted to verified legal
ownership anywhere in this section.

## 3.1 Human creator evidence

| Finding | Evidence | Classification |
|---|---|---|
| Phillip Wikes is the sole human commit author in the repository | 292 + 1 commits across two git identities sharing one email; no other human identity appears in 2,031 commits | **EVIDENCE OF AUTHORSHIP OR CREATION** |
| Human authorship spans the full project life | Earliest human commit 2026-04-14; latest 2026-09-07 | **VERIFIED** |
| `jrsstandard.html`, the full standard documentation, is **predominantly human-attributed** | Surviving-line blame: 3,839 of 4,314 lines (89%) under the human identity | **EVIDENCE OF AUTHORSHIP OR CREATION** |
| `index.html` is **mixed** | 2,937 of 5,882 lines (50%) human-attributed | **EVIDENCE OF AUTHORSHIP OR CREATION** |
| Whether Phillip Wikes is the legal owner of any asset | no assignment, work-for-hire, employment or licence document located | **The current evidence does not establish this.** |

## 3.2 Contributor evidence

| Finding | Evidence | Classification |
|---|---|---|
| A second author designed the reliability and validation framework | Manuscript author-contributions statement | **CONTRIBUTOR EVIDENCE** |
| A named contributor originated the Section 2.1 argument, credited with permission | Manuscript acknowledgements; withdrawal register history | **CONTRIBUTOR EVIDENCE**, and **POSSIBLE OWNERSHIP ISSUE**: the contributed argument sits inside the core construct |
| 58 distinct people participated across three studies; 32 elected to be named | Title page and contributor roster | **CONTRIBUTOR EVIDENCE** |
| Whether any contributor assigned rights | **No assignment located for any contributor** | **The current evidence does not establish this.** |
| Consent architecture separates "may contact me" from "may publish my name", and never bundles either into receiving the material | `research/CONSENT_AND_RELEASE_AUDIT_2026-08-13.md` | **VERIFIED**, and a genuine strength |
| Whether consent operates as a rights conveyance | The consent audit states there is no signature anywhere | **The current evidence does not establish this.** |

---

# 4. Chain-of-title evidence gaps

Highest priority first. **All confirm and none contradict the baseline.**

| Priority | Missing document | Consequence | Classification |
|---|---|---|---|
| **High** | Contributor assignment for the Section 2.1 contributor | Contributed material sits inside the core construct | **GAP / OWNER INPUT REQUIRED** |
| **High** | Written rights allocation with the second author | Research instruments and manuscripts are co-authored | **GAP / OWNER INPUT REQUIRED** |
| **High** | Any executed assignment, work-for-hire or contractor instrument | None exists for any asset | **GAP** |
| **High** | USPTO filing evidence | 23 pages use `JRS™`; 0 serial or registration numbers located | **GAP** |
| **Medium** | Repository LICENSE | Terms on which the suite is held or conveyed are unstated | **GAP** |
| **Medium** | Domain registrar record | Ownership of `jrsstandard.com` not evidenced in-repo | **NOT AUDITABLE** |
| **Medium** | Publisher agreements | Two acceptances recorded internally; no agreement located | **GAP** |
| **Medium** | Terms version stored against each consent row | Consent rows exist; the wording in force at consent is not versioned against them | **GAP** |
| **Low** | Employment-context record for the creation window | Creation dates are established; employment status is not recorded here | **OWNER INPUT REQUIRED**, and no inference about employer ownership is drawn |

---

# 5. AI-assisted creation evidence

**This is the principal new evidence in this pass and it is not in the baseline
documents.** It is presented as fact, with no legal conclusion attached.

| Measure | Value |
|---|---|
| Commits authored under the identity `Claude <noreply@anthropic.com>` | **1,737 of 2,031 (85.5%)** |
| Commits carrying an explicit `Co-Authored-By: Claude` trailer | **1,100** |
| Surviving lines in `api/v1/review-engine.js` under the Claude identity | **259 of 259 (100%)** |
| Surviving lines in `api/review.js` | **280 of 280 (100%)** |
| Surviving lines in `api/review-engine.js` | **266 of 266 (100%)** |
| Surviving lines in `openapi.json` | **220 of 220 (100%)** |
| Surviving lines in `codebook.html` | **360 of 360 (100%)** |
| Surviving lines in `training.html` | **3,579 of 3,579 (100%)** |
| Surviving lines in `jrsstandard.html` | **475 of 4,314 (11%)** |

**What this evidence does establish.** AI-assisted generation was used extensively and
was **disclosed in the repository's own commit record** rather than concealed. The
disclosure is systematic: 1,100 commits carry an explicit co-authorship trailer.

**What this evidence does not establish.** Commit metadata records the identity that
authored a commit. It does not record who conceived, directed, specified, reviewed or
accepted the content, and it does not distinguish material authored by a tool under
human direction from material originating with the tool. **The current evidence does
not establish this.**

**Two facts worth holding together**, because either alone misleads:

- The **canonical standard document** (`jrsstandard.html`) is 89% human-attributed.
- The **implementation** (API modules, OpenAPI, training, Codebook page) is at or near
  100% Claude-attributed by surviving line.

**POSSIBLE OWNERSHIP ISSUE.** The treatment of AI-assisted output differs by
jurisdiction and by the facts of human direction and contribution. This register does
not resolve it, and no conclusion is offered. It is flagged because an acquirer's
counsel will ask, and because the repository record makes the question unavoidable and
answerable only with facts the owner holds.

> **OWNER INPUT REQUIRED: the extent, nature and direction of human involvement in the
> AI-assisted work, sufficient for counsel to assess it.**

---

# 6. Third-party content

| Item | Type | Where | Classification |
|---|---|---|---|
| Google Fonts (Bodoni Moda, JetBrains Mono, Inter) | Visual asset / font | 104 references to `fonts.googleapis.com`, 51 to `fonts.gstatic.com` across public HTML | **THIRD-PARTY CONTENT**. Licence terms not restated in-repo |
| Google Tag Manager / GA4 | Analytics service | 43 references to `www.googletagmanager.com` | **THIRD-PARTY CONTENT** |
| Anthropic (model inference) | Service / subprocessor | `api/v1/review-engine.js`, `api/review.js` | **THIRD-PARTY CONTENT** |
| Supabase | Data storage / subprocessor | 22 references to the project host | **THIRD-PARTY CONTENT** |
| Vercel | Hosting and edge execution | `vercel.json` | **THIRD-PARTY CONTENT** |
| **Formspree** (`formspree.io/f/mreddwdg`) | **Third-party form processor** | **`pilot.html`** | **THIRD-PARTY CONTENT. NEW: not recorded in the baseline** |
| schema.org | Vocabulary reference | 2 references | **THIRD-PARTY CONTENT**, non-material |
| npm / software dependency tree | Software | **No `package.json` or lockfile exists** | **VERIFIED ABSENT**: materially reduces third-party software risk |

**Material shift against the baseline.** `EVIDENCE_AND_LIMITATIONS_REGISTER.md` row C-4
and the reconciliation item R-4 record **three** processors evidenced in code with none
published. This pass locates a **fourth: Formspree**, receiving form submissions from
`pilot.html`. **R-4 is broadened, not corrected**: the finding stands and its scope was
understated.

---

# 7. Branding and trademark evidence

**Use, filing and registration are kept strictly separate.**

| Evidence type | Finding | Classification |
|---|---|---|
| **Use evidence** | `JRS™` appears on **23 public pages**; the domain `jrsstandard.com` resolves and serves | **VERIFIED (use in commerce evidence, factual only)** |
| **Filing evidence** | **None located.** A preparation dossier exists (`TRADEMARK_FILING_DOSSIER_JRS_DRR.md`, prepared 2026-08-11) which describes itself as "filing preparation, not legal advice" and labels its identifications "DRAFTED, NOT VERIFIED" | **GAP.** A preparation dossier is not proof of filing |
| **Registration evidence** | **None located.** Zero USPTO serial or registration numbers anywhere in the repository | **GAP.** A `™` symbol is not proof of registration |
| **DRR branding** | Treated as a separate named construct with its own article PDF (`DRR_Article.pdf`) | **VERIFIED as separate treatment** |
| **Earliest located use of "Decision Reconstruction Risk"** | Commit `9ea3687`, **2026-06-23**, "Vendor preview: reframe hero around Decision Reconstruction Risk" | **VERIFIED as earliest in this repository**. Earlier use outside the repository is **NOT AUDITABLE** |
| **Domain ownership** | No registrar record located in-repo | **NOT AUDITABLE** |

---

# 8. Publication and authorship evidence

**Strictly separated. No category is inflated.**

| Category | Items | Evidence | Classification |
|---|---|---|---|
| **Draft / internal** | Multiple manuscripts and article preparations under `research/` | Files present | **VERIFIED as drafts** |
| **Submitted** | AI and Ethics detection manuscript packet (`research/aie_submission_2026-09-01/`) | Complete packet with cover letter, title page, blinded manuscript | **VERIFIED as prepared for submission** |
| **Accepted** | Two acceptances recorded internally (CEP; CCI on 2026-09-03) | `research/MASTER_TRACKER.md`, `research/IP_SALE_TRACKER.md` rev 26 | **OWNER INPUT REQUIRED** for external evidence |
| **Published (DOI or publisher record)** | **None** | **Zero DOI strings located anywhere in the repository** | **GAP** |

**Confirms baseline.** `EVIDENCE_AND_LIMITATIONS_REGISTER.md` row C-7 requires an
acceptance letter, DOI, journal record or publisher page before acceptance may be
represented as verified. That evidence is still absent, and the zero-DOI result puts a
number on it. **Cite as accepted and in pipeline, never as published.**

---

# 9. Material conflicts

Preserved as unresolved, not harmonised.

| # | Conflict | Status |
|---|---|---|
| MC-1 | **Two OpenAPI documents describe the same endpoint at different versions** with different response schemas: `openapi.json` (3.1.0 / 1.0.0) vs `openapi-review-engine.json` (3.0.3 / 0.1.0-validation) | **UNRESOLVED**, carried forward from baseline R-3 |
| MC-2 | **Codebook condition names and API keys overlap on exactly one** of five | **UNRESOLVED**, carried forward from baseline R-5 |
| MC-3 | **One human, two git identities** (`phillipwikes-bit` and `Phillip Wikes`, same email) | **Non-material**, recorded so a later reader does not read two contributors |
| MC-4 | **Subprocessor count**: baseline records three; this pass locates four | **RESOLVED IN FAVOUR OF FOUR.** Baseline scope was understated, not wrong |
| MC-5 | Public pages state record text is never stored; result telemetry **is** stored | **UNRESOLVED**, carried forward from baseline R-1 |

---

# 10. Recommended next action

**One action, highest evidence-gathering value:**

> **Obtain a signed contributor assignment from the Section 2.1 contributor, and a
> written rights allocation from the second author.**

Rationale, from the evidence rather than from preference. Every other gap in this
register is a document the owner can produce alone or a fact the owner already knows:
a licence file, a registrar record, a USPTO filing, a subprocessor list, a canonical
OpenAPI designation. **These two require signatures from other people**, they are the
only gaps whose cost rises with time and distance, and they sit against material that
is inside the core construct and inside the co-authored research. The consent audit
establishes that **no signature exists anywhere on this project today**, so this is the
first signature rather than a replacement for a weaker one.

---

## Master Tracker status block

```
[Session ID / Timestamp]        session_01W9UtE7X76spacWeSvBH7tv / 2026-09-09
[Completed Phases & Artifacts]  Discovery across repository, public pages, research,
                                git history, dependencies; asset inventory; chain-of-
                                title evidence; AI-assistance evidence; third-party
                                register; trademark and publication separation.
[Active State & Variables]      Branch claude/html-pilot-L8rC3. Files created under
                                docs/enterprise-diligence/ only. No public page, API,
                                research file, legal or privacy language modified.
[Upstream Source / Generator]   No generated artifact was patched. Registers are
                                authored source, not build output. Evidence read from
                                upstream sources: git history, api/**, codebook.html,
                                openapi*.json, research/**, .vercelignore, vercel.json.
[Pending Technical Debt]        MC-1 conflicting OpenAPI documents; MC-2 unresolved
                                condition mapping; MC-5 retention wording; R-4 now
                                four processors, none published; 0 rights documents;
                                0 USPTO numbers; 0 DOIs; no LICENSE.
[Production Deployment Status]  NO DEPLOYMENT TRIGGER. Every file created in this
                                pass is markdown under docs/enterprise-diligence/,
                                excluded from deployment by two independent rules
                                (*.md, and the whole-directory rule). No website
                                source file, static asset, schema or content
                                component was mutated, so the live-sync directive
                                has nothing to synchronise. Production verified
                                unchanged and healthy; see below.
[Next Trigger / Expected Input] Owner responses to the questionnaire, in particular
                                the AI-involvement account and the two signatures.
```
