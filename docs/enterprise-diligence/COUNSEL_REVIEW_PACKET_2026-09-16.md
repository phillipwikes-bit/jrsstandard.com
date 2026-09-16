# Counsel Review Packet — 2026-09-16

**Two standing questions and two conditional ones. No legal question is answered here.**

---

## 1 · B-004 — Rights and chain of title

**LEGAL QUESTION.** Do the available instruments support commercial exploitation, licensing or
transfer of the JRS estate?

**FACTUAL RECORD.** 33 people executed structured contributor consents. `consent_use = yes`,
`consent_transfer = yes`, scoped to **study publications and successor transfer**.

**EVIDENCE.** Consent records, contributor matrix, publication records, AI-assistance
provenance, Git chronology.

**UNKNOWN / NOT ESTABLISHED.** **No Level A executed assignment instrument exists anywhere in
the corpus.** The consents are **silent on commercial use**. The Section 2.1 accessibility and
study-design contribution is recorded as influencing international panel design; **whether that
creates any interest is not determined here**.

**POTENTIAL CONSEQUENCE.** A transaction premised on unrestricted commercial rights may rest on
instruments that do not grant them.

**QUESTION FOR COUNSEL.** What, if anything, do these consents convey beyond publication and
successor transfer, and what instrument would be needed for commercial licensing?

**Nothing here asserts ownership.** Authorship is not title; consent is not assignment;
publication is not a commercial licence.

## 2 · B-007 / D-1 — Published licensed API contract

**LEGAL QUESTION.** `openapi.json` is published, carries a **Commercial licence**, and is linked
from a confidential buyer surface. It describes a response the implementation does not return.
What are the implications of (a) leaving it, (b) amending it, (c) versioning it?

**FACTUAL RECORD.** Three breaking differences, all record-level: `routing` **required** and
**absent** from the implementation; `conditions` required top-level but nested at
`result.conditions`; different routing vocabulary and case. **The condition-level payload agrees
exactly.**

**EVIDENCE.** `openapi.json` v1.0.0; `api/v1/review-engine.js`; served at `/openapi.json`.

**UNKNOWN.** **EXTERNAL RELIANCE NOT ESTABLISHED.** *This is not the same proposition as "no one
relied on it"*, and the stronger statement is not made.

**POTENTIAL CONSEQUENCE.** A consumer built strictly to the contract fails on the first
response.

**QUESTION FOR COUNSEL.** May the published contract be amended, and does the Commercial licence
carry obligations that bear on the choice?

**`openapi.json` has not been modified.**

## 3 · CONDITIONAL — B-013B, if contributors were not told

**Triggered only if the owner answers B-013B "not told" or "not recorded".**
**QUESTION.** 54 contributor-supplied record texts are anonymously readable. What obligations
follow if participants were not informed?
**NOT ESTABLISHED:** what participants were told. **No privacy conclusion is offered.**

## 4 · CONDITIONAL — data-residency wording

Statements that "no data-residency obligation transfers to us" were **removed, not reworded**.
Any republication of a residency statement is a counsel matter.

---

## What counsel is NOT being asked

To approve engineering. To bless a deployment. To ratify a status. **The repository states
NOT ESTABLISHED wherever evidence is absent, and those statements are the record, not gaps to
be filled in.**
