# PROPOSED FOR OWNER APPROVAL: Gate 2 Owner Decision Record

**PROPOSED FOR OWNER APPROVAL. NOT EFFECTIVE. Prepared 2026-10-24 outside the
repository.** Every disposition below is proposed only and has no effect until the owner
approves it by completing its approval block. Counsel matters remain with counsel. No
item is recorded in the repository, `.jrs/state/BLOCKERS.json`, any tracker or any
ledger by this document. **B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

Proposed record identifier: G2-DR-PROPOSED-2026-10-24

## 0. How to use this record

- Each disposition (P-01 to P-07) stands alone. The owner may approve, reject or modify
  each one independently; approving one does not approve another.
- Each item carries "Points for the owner to confirm". These are gaps between the
  proposed wording and the Gate 2A analysis, not recommendations. The owner may resolve
  them by the modification line.
- An approved item takes effect only on the date the owner signs it, and only for the
  scope stated. Recording it in the repository requires a separate authorization
  (proposed change-control rule CC-12).
- References: decision cards `external-gate-2-2026-10-23/B018_OWNER_DECISION_CARDS.md`;
  consequence matrix `external-gate-2a-2026-10-24/G2A_B018_DECISION_CONSEQUENCE_MATRIX.md`;
  proposed rules `external-gate-2a-2026-10-24/G2A_B018_CHANGE_CONTROL_RULES.md`.

## 1. Evidence basis (verified 2026-10-24)

| Record | SHA-256 |
|---|---|
| Phase 9 dual-review protocol (`DUAL_REVIEW_PROTOCOL.md`, execution disabled, synthetic only) | `750b350897455f66b9ef9b421b5a89700223ba7196401e6f84d7406f2b9f6360` |
| Historical adjudication protocol (`docs/architecture/JRS_ADJUDICATION_PROTOCOL_v1.0.md`) | `c68b664335f32cebef5bae00ba2a0dc8f652e372fcf6f5c4770f2be27e7b95d6` |
| October 5 operating handoff (`docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`) | `ec9854d2d76bbd2809157ec15a6b9860cb67c20c6f8753e432f3042297600ba5` |
| Candidate `phase7-candidate` package | `815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3` |
| Gate 2A package manifest | verifies (3 of 3) |
| Gate 3A package manifest | verifies (4 of 4) |

---

## P-01. B018-OD-01: Ledger namespace

**Authority:** owner. **Current status:** PENDING OWNER APPROVAL.

**Proposed disposition.**
1. Adopt an interim local-alias rule: entries in the repository ledger are cited as
   "local E-nnn".
2. The source ledger and the local ledger are not merged, renumbered or crosswalked
   without a later, authorized source review.

**What it would not do.** It would not establish that any local entry corresponds to any
source entry, change any ledger entry, or support any evidentiary or public claim.

**Corresponds to.** Decision card option B (prefix in new records, no mapping); Gate 2A
state "Limited decision".

**Points for the owner to confirm.**
- Whether the rule applies to new records only (as card option B describes) or also
  requires existing records to be read as "local E-nnn".

**Approval.** [ ] Approve  [ ] Reject  [ ] Approve with modification: ______________
Owner: ______________ Date: __________

---

## P-02. B018-OD-02: Human-review protocol

**Authority:** owner. **Current status:** PENDING OWNER APPROVAL.

**Proposed disposition.**
1. For a synthetic-only methods rehearsal, the Phase 9 dual-review protocol is the
   protocol used.
2. This is not a designation for real records, consequential decisions, external
   controlled use or production operation.
3. The historical adjudication protocol remains unchanged and is not superseded.

**What it would not do.** It would not enable the Phase 9 protocol's execution, which
stays disabled; would not decide P9-OD-01 (whether, when and under whose authority a dual
review may run); would not recruit anyone or run any review; and would not authorize
Gate 3 Option B.

**Corresponds to.** Gate 2A state "Limited decision" (bounded object: synthetic
rehearsal). Would address gap GOV-02 for Option B only, with P9-OD-01 still required.
Would not address GOV-02 for Option C.

**Points for the owner to confirm.**
- Whether P9-OD-01 is to be decided together with this item or separately.
- That the protocol version bound is the one with the SHA-256 in section 1; any revision
  would need a new protocol version and a new approval.

**Approval.** [ ] Approve  [ ] Reject  [ ] Approve with modification: ______________
Owner: ______________ Date: __________

---

## P-03. B018-OD-03: Version lineage

**Authority:** owner. **Current status:** PENDING OWNER APPROVAL.

**Proposed disposition.**
1. Adopt a parallel-lineage rule: the source-era Engine and the later local candidates
   remain distinct lineages.
2. Evidence, results, performance findings and claims do not transfer between them
   without separately documented justification.

**What it would not do.** It would not assert or deny continuity, commit, publish,
release or deploy any version, change any registered manifest, or establish that any
version performs as described.

**Corresponds to.** Decision card option B (separate, parallel lineage). The Gate 2A
matrix lists card option B, recorded in a dated lineage record, as a "Full disposition".
Would address gap GOV-04 for Options B and C.

**Points for the owner to confirm.**
- Whether this item is intended as a full disposition (card option B with a dated lineage
  record keyed to manifest hashes) or as a limited rule. Under P-06, the difference
  decides whether it counts toward closure.
- Who may approve a "separately documented justification" for any transfer, and whether
  counsel is involved where a transfer would bear on title.

**Approval.** [ ] Approve  [ ] Reject  [ ] Approve with modification: ______________
Owner: ______________ Date: __________

---

## P-04. B018-OD-04: Commercial-language precedence

**Authority:** owner (counsel for any licensing wording). **Current status:** PENDING
OWNER APPROVAL.

**Proposed disposition.**
1. The October 5 operating handoff governs current operating, public and commercial
   language.
2. No public or commercial text is altered under this decision.

**What it would not do.** It would not change any text, make any offer, set any price,
accept any inquiry as a customer, or authorize onboarding, licensing, acquisition or
rights transfer.

**Corresponds to.** Decision card option A (precedence record, no text change); Gate 2A
state "Limited decision". No counsel review is triggered while no licensing wording is
proposed.

**Points for the owner to confirm.**
- Scope. Card option A covers Engine-related commercial statements. The proposed wording
  covers all current operating, public and commercial language. The owner may wish to
  confirm the wider scope is intended.
- Whether the earlier text that conflicts (for example, the inquiry-pathway wording in
  `CURRENT_COMMERCIAL_POSTURE.md`) is to be listed in the record and marked superseded
  where it conflicts, without changing it.

**Approval.** [ ] Approve  [ ] Reject  [ ] Approve with modification: ______________
Owner: ______________ Date: __________

---

## P-05. B018-CQ-05: Rights and chain of title

**Authority:** counsel, with owner. **Current status:** PENDING COUNSEL.

**Proposed disposition.**
1. Retain as OPEN pending counsel disposition.
2. No ownership, transferability, licensing, publication-rights or chain-of-title
   conclusion is made.

**What it would not do.** It would not engage or contact counsel, dispose of any
counsel-brief question, or change any rights register.

**Corresponds to.** Gate 2A state "Deferred". The owner may approve this interim
practice; disposition of the item itself remains with counsel. Gap RTS-04 continues to
block Option C. For Option B, the disclosure question RTS-02 remains for the owner.

**Approval of the interim practice.** [ ] Approve  [ ] Reject  [ ] Approve with
modification: ______________
Owner: ______________ Date: __________

---

## P-06. B-018 closure rule

**Authority:** owner (counsel for its application to CQ-05). **Current status:** PENDING
OWNER APPROVAL.

**Proposed disposition.**
1. Limited decisions do not count toward B-018 closure unless a later owner decision
   expressly provides otherwise.
2. B-018 remains OPEN.

**What it would not do.** It would not change B-018's status, its description or its
required action, and would not change release status.

**Corresponds to.** The open question in the Gate 2A matrix and proposed rule CC-04.

**Points for the owner to confirm.**
- Combined effect. If P-01, P-02 and P-04 are approved as limited decisions and P-05 stays
  with counsel, none of those four counts toward closure. Only P-03, and only if confirmed
  as a full disposition, would count. B-018 would stay OPEN in every case.
- Whether adoption of the proposed change-control rules CC-01 to CC-14 is intended as part
  of this item or separately.

**Approval.** [ ] Approve  [ ] Reject  [ ] Approve with modification: ______________
Owner: ______________ Date: __________

---

## P-07. Gate 3 direction

**Authority:** owner. **Current status:** PENDING OWNER APPROVAL.

**Proposed disposition.**
1. Record a proposed future path of Gate 3 Option B only: a synthetic-only independent
   methods rehearsal.
2. Option B is not authorized to begin until every Gate 3 prerequisite is complete and a
   separate formal owner authorization is recorded.

**What it would not do.** It would not authorize, begin, simulate or score any
evaluation; would not appoint or contact anyone; would not select Option C; and would not
lift the Gate 4 block.

**Detail.** `PROPOSED_GATE3_OPTION_B_AUTHORIZATION_OUTLINE.md` lists the prerequisites.

**Approval.** [ ] Approve  [ ] Reject  [ ] Approve with modification: ______________
Owner: ______________ Date: __________

---

## 2. Statements that apply to every item

- Every disposition above is proposed only and requires owner approval. P-05 also
  requires counsel for any disposition of the item itself.
- No item is a release, deployment, licensing, ownership, commercial, production or
  validation decision (proposed rule CC-11).
- **B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
