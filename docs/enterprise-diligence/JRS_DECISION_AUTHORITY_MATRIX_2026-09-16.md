# JRS Decision Authority Matrix — 2026-09-16

**Under the delegation in the governing directive, "OWNER ACTION REQUIRED" is no longer a valid
resting place for a question the Board can decide. Every item below is re-classified, and where
the Board can decide, it has decided.**

---

| ID | Prior label | Re-classified | Why the restriction exists, or does not |
|---|---|---|---|
| **B-001** | Owner action | **OWNER EXTERNAL ACTION REQUIRED** | **External action.** Rotation happens in Vercel's account system. No repository evidence can observe it and the Board cannot perform it |
| **B-006** | Blocked | **OWNER EXTERNAL ACTION REQUIRED (dependent)** | **External action.** Needs the rotated credential. The procedure is written and ready |
| **B-004** | Counsel | **COUNSEL REVIEW REQUIRED** | **Legal judgment.** Whether consents convey commercial rights is a legal question |
| **B-007 / D-1** | Counsel | **COUNSEL REVIEW REQUIRED** | **Legal judgment.** Published document carrying a Commercial licence |
| **B-013A** | Owner action | **BOARD DECISION — OWNER-DELEGATED** → decided below. **Implementation: PRODUCTION VERIFICATION / authorization boundary** | Security posture is delegated. **The grant change itself is a production operation** |
| **B-013B** | Owner factual | **PARTLY ESTABLISHED FROM EVIDENCE** (new). Residual: **OWNER FACTUAL CONFIRMATION** | The repository **does** establish what contributors were instructed to submit. It does not establish whether they were told the rows would be readable |
| **B-013C** | Owner action | **BOARD DECISION — OWNER-DELEGATED** → decided below | Privacy posture is delegated. Implementation crosses the production boundary |
| **D-2** | Intentionally unresolved | **INTENTIONALLY UNRESOLVED** | **Factual reconstruction, not design.** The directive expressly forbids inventing it |
| **D-3** | Owner action | **BOARD DECISION — OWNER-DELEGATED, IN PART** → decided below | Three pairs are a design decision the Board may take. The fourth is D-2 |
| **D-10** | Partly decided | **BOARD DECISION — OWNER-DELEGATED** → decided below | Privacy posture. The restricted-surface half was never separately decided |
| **D-12** | Owner action | **BOARD DECISION — OWNER-DELEGATED** → decided and implemented | Architecture. No production authorization needed to stop calling a dead host |
| **D-18** | Owner action | **BOARD DECISION — OWNER-DELEGATED** → decided below | Research **presentation** is delegated. Research **data** is not, and is untouched |
| **F-8 / F-14** | Owner decision | **BOARD DECISION — OWNER-DELEGATED** → decided below | Privacy and security posture |
| **B-005** | Reopened | **BOARD DECISION — OWNER-DELEGATED** → decided below | Scope of a technical remediation |
| **B-008 / B-009 / B-014 / B-015 / D-11 / D-13 / D-15 / D-16 / D-17** | Remediated | **PRODUCTION VERIFICATION REQUIRED** | Development evidence cannot close them |
| **Deployment authorization** | — | **OWNER EXTERNAL ACTION REQUIRED** | Reserved absolutely. Never inferred |

## The ten questions, answered for the items that moved

**B-013A, B-013C, D-3 (part), D-10, D-12, D-18, F-8, F-14, B-005** were labelled Owner because
earlier cycles treated *any* consequential choice as reserved. **Under the delegation that is
wrong.** None requires Phillip's personal knowledge, none requires an external action, none
requires legal judgment, and the evidence is sufficient in each case. **Engineering can proceed
on all of them except where implementation itself crosses the production boundary.**

**B-013B moved for a different reason: I had not looked.** It was labelled NOT ESTABLISHED
without searching the submission surface. The evidence was there.

## What genuinely remains reserved

| Matter | Restriction arises from |
|---|---|
| B-001, B-006 | **External action** |
| B-004, B-007/D-1 | **Legal judgment** |
| B-013B residual | **Personal knowledge** |
| D-2 | **Factual insufficiency** |
| All production verification | **Production verification** |
| Deployment authorization | **Contractual/owner authority** |

**Six categories. Not one of them is a matter the Board could have decided and declined to.**
