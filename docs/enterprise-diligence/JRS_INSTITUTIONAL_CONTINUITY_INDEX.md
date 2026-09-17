# JRS Institutional Continuity Index

**What this is.** A single entry point into the JRS estate for a qualified
organization that has not been part of building it. It answers the seventeen
questions Phase V requires by **pointing at the authoritative record for each**.

**What this is NOT.** It is not a register. It creates no authoritative content
and supersedes nothing. Where this index and a record it points to disagree,
**the record controls**. Nothing here may be cited as evidence; cite the source.

Created 2026-09-17. State at creation: **STATE 1 — DEVELOPMENT REMEDIATION ·
DEPLOYMENT NOT AUTHORIZED · GATE 1 NOT READY · PHASE II LOCKED.**

---

## 0. Read these four first

| Order | File | Why |
|---|---|---|
| 1 | `docs/enterprise-diligence/README.md` | The package's own entry point |
| 2 | `JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md` | The authoritative living record of assets, contributors, rights and title |
| 3 | `EVIDENCE_LEDGER.md` | The evidentiary layer beneath every proposition in the register |
| 4 | `.jrs/state/BLOCKERS.json` | The authoritative blocker registry. **There is no other** |

`docs/repository-operations/OPERATIONS_ANNEX.md` holds the long-form operational
record. Root `CLAUDE.md` §36 carries the drift-critical invariants inline.

---

## 1. The seventeen questions

| Question | Where it is answered |
|---|---|
| What is JRS? | `README.md`; the public standard pages |
| What is DRR? | Public methodology pages; `TECHNICAL_ARCHITECTURE_BRIEF.md` |
| How do the five conditions work? | `METHODOLOGY_TO_API_MAPPING.md` — **authoritative** |
| What does the engine actually do? | `api/v1/review-engine.js`; `.jrs/reports/REVIEW_ENGINE_BOUNDARY.md` |
| What does the Manifest establish? | `JRS_MANIFEST_VALIDATION_REPORT_2026-09-15.md`; `lib/manifest/build.js` |
| **What does the Manifest NOT establish?** | Same. **Integrity is a hash, not a signature.** It does not establish authorship, accuracy, legal sufficiency, admissibility, compliance, fairness or validation |
| What evidence supports the methodology? | `RESEARCH_AND_VALIDATION_STATUS.md`; `research/` |
| What evidence supports the implementation? | `JRS_FINAL_TEST_MATRIX_2026-09-15.md`; `JRS_GUARD_INTEGRITY_AUDIT_2026-09-17.md` |
| **What does the research NOT establish?** | `RESEARCH_AND_VALIDATION_STATUS.md`. The engine is **empirically unvalidated**; a constructed corpus is **not** real-world prevalence; a pre-registered reliability lower bound was **not met** and that failure is preserved |
| What rights exist? | `ASSET_AND_CHAIN_OF_TITLE_EVIDENCE_REGISTER.md`; `CONTRIBUTOR_AND_THIRD_PARTY_REGISTERS.md` |
| **What rights remain unresolved?** | `CHAIN_OF_TITLE_STATUS.md`; `RIGHTS_EVIDENCE_GAP_MEMO.md`; **B-004**. No Level A executed assignment instrument has been located |
| What data moves where? | `ACTUAL_DATA_FLOW_AND_PROCESSOR_MATRIX_2026-09-15.md` |
| What is retained, and for how long? | `lib/retention/policy.js` (executable); BD-10/BD-12/BD-13 in the Board Decision Register |
| What is public and what is controlled? | `.vercelignore` — each rule carries its own reason inline |
| How is it deployed? | `docs/repository-operations/OPERATIONS_ANNEX.md` §36.8; `scripts/preflight_deploy_check.py` |
| **What must never be claimed?** | §2 below |
| What is deliberately not built? | `JRS_DEFERRED_BUILD_REGISTER.md` |

---

## 2. Prohibited claims

Carried here because an incoming organization needs them before it reads
anything else, not after.

**Never claim** JRS is certified, accredited, validated, legally compliant,
legally defensible, court-admissible, litigation-proof, or that it guarantees
regulatory acceptance, a litigation outcome or reduced liability.

**Never convert** authorship into ownership · consent into assignment ·
publication into rights conveyance · repository control into legal title ·
test success into validation · functional operation into accuracy · integrity
into authenticity · development evidence into production evidence.

**The engine does not make the consequential decision.** It evaluates
documentation conditions. A human retains the decision.

**The permitted formulation**: JRS is designed to produce reviewable, traceable
and integrity-protected records that can support audit, investigation,
regulatory review and other forms of external scrutiny.

---

## 3. What an incoming organization must know is unfinished

Stated plainly, because a continuity index that reads as a completion
certificate is worse than none.

| Matter | State |
|---|---|
| **Production-verified controls** | **NONE.** Every control below is development evidence |
| **B-001** | Credential rotation. Owner-only. **Seven production operations queue behind it** |
| **B-014** | Three files are publicly served on production now; remediated in configuration, not deployed |
| **B-016** | The published API contract asserts statelessness the implementation contradicts. **Counsel** |
| **B-017** | Responses collected under a promise of non-publication sit behind an anon SELECT grant. Repository half closed; **grant not revoked** |
| **B-004, B-007/D-1, V-4(3)** | Counsel |
| **B-013B, S-1, S-6, T-6** | Owner factual confirmation |
| **D-2** | `cold_reviewer_clarity` — **INTENTIONALLY UNRESOLVED**, and enforced as such by a guard |
| **Phase II** | Locked |

**The grant is the control, not the page projection.** The publishable key ships
in 17 HTML files by design, so a narrowed page query is drift control, not
protection. B-013 limb A and B-017 are the controls.

---

## 4. How to keep this index honest

It points; it does not assert. When a record changes, update the pointer, not the
substance. **Do not let this file accumulate conclusions** — that is how a
parallel source of truth is born, and §8 of the operating architecture forbids it.
