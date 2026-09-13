# JRS Enterprise Diligence Package

**Purpose.** Let a serious inbound evaluator understand JRS without reconstructing the
entire website. This package is an evidence index, not a sales brief.

**Built:** 2026-09-08 · **Repository commit at build:** see `_PREFLIGHT_STATE.txt`

## What this package is, and is not

This is an **evidence packaging and documentation exercise**. It does not create
enterprise capability, and a polished document here is not a verified capability.
Where evidence was not available, the absence is recorded rather than filled.

## Classification scheme

Every material statement in this package carries one of these:

| Class | Meaning |
|---|---|
| **VERIFIED** | Directly supported by repository files, source code, configuration, controlled tests, signed records, public documents, or observed live behaviour. |
| **INFERENCE** | Professional conclusion derived from identified verified evidence. The supporting evidence is named. |
| **GAP** | A required or useful artifact, capability, or control could not be located or verified. |
| **NOT AUDITABLE** | Material needed to reach a conclusion is unavailable, restricted, or outside the current access boundary. |
| **OWNER INPUT REQUIRED** | A fact or document must be supplied by the owner before it may be represented as verified. |

**An assertion on a public JRS page is not evidence that the assertion is true.**
Public operator disclosure and independently verified implementation evidence are
recorded separately throughout.

## Documents

| File | Function |
|---|---|
| `EVIDENCE_AND_LIMITATIONS_REGISTER.md` | One row per material claim or asset, with classification and exact source. |
| `METHODOLOGY_TO_API_MAPPING.md` | Canonical Codebook conditions against actual API keys. Names are compared, never normalised. |
| `RESEARCH_AND_VALIDATION_STATUS.md` | What the studies do and do not establish, with figures, dates and unmet thresholds. |
| `TECHNICAL_ARCHITECTURE_BRIEF.md` | Request lifecycle, boundaries, retention, versioning. Each item marked by how it is known. |
| `SECURITY_AND_DATA_HANDLING_EVIDENCE_INDEX.md` | An index of what is and is not evidenced. Not a security claim. |
| `IP_ASSET_REGISTER.md` | Assets, ownership status, transferability, diligence risk. |
| `CHAIN_OF_TITLE_STATUS.md` | What would be needed to establish clean title, and what is missing. |
| `CURRENT_COMMERCIAL_POSTURE.md` | What is actually available now, separated from closed legacy engagements. |
| `INBOUND_ENTERPRISE_DILIGENCE_PACKAGE.md` | The executive brief an evaluator reads first. |
| `PUBLIC_CLAIM_RECONCILIATION_LOG.md` | Public statements against this package. Proposed corrections, none published. |
| `CHANGE_AND_VERIFICATION_REPORT.md` | Files examined, created, modified, deliberately unchanged; tests run; conclusions. |
| `_PREFLIGHT_STATE.txt` | Machine-readable working-tree state captured before any modification. |

## Standing limits observed in building this

- No live authenticated API test was run. No partner token was available, and
  authentication was not bypassed. Recorded as **NOT AUDITABLE** rather than assumed.
- No public page was modified. Public corrections are proposed in the reconciliation
  log and held at the approval gate.
- No legal, licensing, privacy, or security language was changed.
- No test is reported as passed that was not run.

---

## Authoritative register, from 2026-09-09

**Start here: `JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md`.**

It is the single source of truth for JRS asset, contributor, rights and chain-of-title
evidence, traceable to `EVIDENCE_LEDGER.md` (27 entries). Every other document in this
directory is retained as an evidence source and correction history, not as a competing
conclusion.

**Its purpose is that no future review has to rediscover Hekim, Ubayet, Tanvi,
Stacyann, the DRR evidence, the consents, or the Master Tracker history.**

**Update rule: add evidence, name the finding it changes, preserve the prior status.
Never restart the audit.**
