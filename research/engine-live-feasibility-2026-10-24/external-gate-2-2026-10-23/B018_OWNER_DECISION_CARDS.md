# B-018 Owner Decision Cards

**NON-OPERATIVE. Prepared 2026-10-23. B-018 remains OPEN. Release status remains
NO_GO_NOT_VERIFIED.** No card recommends an option; the existing records do not establish
a required outcome for any of these items. Each decision remains for the owner.

Material marked "owner-reported" was verified in an external reconciliation workspace
outside the repository and has not been verified by any local session.

---

## B018-OD-01: Ledger namespace and crosswalk

**Decision question.** How should the local evidence ledger identifiers relate to the
canonical source-ledger namespace, given that both use identifiers of the form E-nnn?

**Local evidence anchors.**
- `docs/enterprise-diligence/EVIDENCE_LEDGER.md`: 39 entries, E-001 to E-039 (local).
- `docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md`:
  cites the local ledger by identifier.
- `docs/enterprise-diligence/B-018_RECONCILIATION_RECORD_2026-10-23.md`, section 5 item 1:
  interim citation convention "local E-nnn".
- Owner-reported: the source Evidence Ledger defines E-001 to E-045.

**Options and consequences.**

| Option | Consequence |
|---|---|
| A. Approve a crosswalk record that maps each local identifier to a source identifier, or records that no counterpart exists, keeping both ledgers unchanged | A traceable mapping exists; both namespaces stay intact; every later citation can be resolved unambiguously |
| B. Approve a permanent prefix for local identifiers (for example a local alias) in new records only, without a mapping | Ambiguity in new records ends; existing records still use bare E-nnn and remain ambiguous until mapped |
| C. Approve a crosswalk and a later, separately authorized renumbering of one ledger | Long-term single namespace; the renumbering itself would touch many records and needs its own change record and drift-guard handling |
| D. Defer | The interim "local E-nnn" convention continues; any statement that relies on matching a local entry to a source entry remains NOT ESTABLISHED |

**Explicit non-consequences.** No option changes the content or truth of any ledger entry,
establishes that a local entry and a source entry describe the same evidence, or supports
any public, evidentiary or rights claim.

**Required future record if approved.** A dated crosswalk record listing each local
identifier, its SHA-256-identified source counterpart where one exists, and the basis for
each pairing. Pairings that depend on source content must be prepared where the source is
available and attributed accordingly.

**Dependencies and stop conditions.** Depends on access to the source Evidence Ledger in an
authorized workspace. Stop if a pairing would require copying source content into the
repository, or if the drift guard's ledger-count rule would report a new failure.

**Owner disposition:** ______________________  **Date:** __________

---

## B018-OD-02: Controlling human-review protocol

**Decision question.** Which protocol, if any, governs future human review of Engine
output, and how does it relate to the 2026-10-05 scope exclusions?

**Local evidence anchors.**
- `docs/architecture/JRS_ADJUDICATION_PROTOCOL_v1.0.md` (2026-09-20, labelled operational
  for controlled challenge and testing use): independent first pass, PASS/REVIEW/GAP codes
  under the Codebook, mandatory secondary review on divergence, scope covering masked
  consequential case records.
- `research/engine-human-review-phase9-2026-10-20/DUAL_REVIEW_PROTOCOL.md`
  (execution-disabled, synthetic-only): two blinded reviewers, seven-outcome
  semantic-support model, adjudicator on disagreement or escalation.
- `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`: Engine scope limited to
  non-HR supplier-access drafts; employment, housing, lending, insurance, medical and
  legal-outcome uses excluded; human review always required.
- Related open decisions: P9-OD-01 (whether a dual review may run), P8-OD-04 (whether
  independent evaluation is authorized).

**Options and consequences.**

| Option | Consequence |
|---|---|
| A. Designate the 2026-09-20 adjudication protocol for Engine review | Codebook coding becomes the governing review model; its consequential-record scope would need an explicit reconciliation with the 2026-10-05 exclusions |
| B. Designate the Phase 9 dual-review protocol for Engine review | The semantic-support model governs; it remains execution-disabled until P9-OD-01 is decided |
| C. Designate distinct roles: one protocol for research coding, the other for Engine-output review | Both remain in force for different objects; a boundary record must state which applies to what |
| D. Defer | Neither protocol is treated as controlling for Engine review; no review runs |

**Explicit non-consequences.** No option runs a review, recruits a reviewer, enables
execution, authorizes real-record or label use, or establishes reviewer reliability.

**Required future record if approved.** A dated designation record naming the controlling
protocol and version, its object of review, its relation to the 2026-10-05 scope, and any
protocol revision needed (each protocol requires a new version for rule changes).

**Dependencies and stop conditions.** Interacts with P9-OD-01 and P8-OD-04. Stop if the
designation would imply authority to run a review or to process any excluded record type.

**Owner disposition:** ______________________  **Date:** __________

---

## B018-OD-03: Source-era versus local-candidate version separation

**Decision question.** How should the records distinguish the Engine described in the
source documents from the later local candidates?

**Local evidence anchors.**
- `research/engine-governance-phase8-2026-10-19/registry/VERSION_REGISTRY.json`: seven
  packages (v1 historical, v0.1, v0.2, v0.3, Phase 4 frozen; Phase 6 local-only; Phase 7
  candidate-only).
- `research/engine-governance-phase8-2026-10-19/governance/LATER_PACKAGE_REGISTRY.json`:
  Phase 6, 7 and 8 as retroactive seeds; Phase 9 admitted, local construction only.
- `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`: the Engine is a controlled
  local-development candidate.
- Related open decisions: P7-OD-01 and P8-OD-05 (future of the v0.3.1 candidate),
  P8-OD-08 (ratifying the retroactive seeds), OD-06, P7-OD-08, P8-OD-03 and P9-OD-06
  (commit or preserve).
- Owner-reported: the source records contain historical Engine material not represented
  in the local records.

**Options and consequences.**

| Option | Consequence |
|---|---|
| A. Approve a lineage record that places the source-era Engine as the earliest version and the registered packages after it, each with its status | One traceable lineage; later candidates stay marked local-only and candidate-only |
| B. Approve a lineage record that keeps the source-era Engine as a separate, parallel lineage with no asserted continuity to the local packages | Avoids asserting continuity that may not be established; leaves the relationship open |
| C. Defer | The registries continue to describe local packages only; no record states how the source-era Engine relates to them |

**Explicit non-consequences.** No option commits, publishes, releases or deploys any
version, changes any package, or establishes that any version performs as described.

**Required future record if approved.** A dated version lineage record identifying each
version by its recorded manifest hash or source SHA-256, its status, and the record that
establishes it.

**Dependencies and stop conditions.** Option A depends on source content available only in
an authorized workspace. Stop if the record would require changing a registered manifest
or re-labelling a local candidate as released.

**Owner disposition:** ______________________  **Date:** __________

---

## B018-OD-04: Commercial-language precedence

**Decision question.** How should internal commercial records be read against the
2026-10-05 operating boundary, and which text, if any, should later be revised?

**Local evidence anchors.**
- `docs/enterprise-diligence/CURRENT_COMMERCIAL_POSTURE.md` (last committed 2026-10-02):
  no executed licence, pricing, contract template or customer deployment; inquiry
  pathways for integration, acquisition and pilot access described as accepted.
- `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`: the Engine is not a licensing
  offer or acquisition pathway; customer onboarding, licensing, acquisition and rights
  transfer are prohibited without a new explicit owner instruction.
- `docs/enterprise-diligence/PUBLIC_CLAIM_RECONCILIATION_LOG.md`: public-claim corrections
  are deferred pending owner approval.

**Options and consequences.**

| Option | Consequence |
|---|---|
| A. Record that the 2026-10-05 handoff takes precedence for all Engine-related commercial statements, and list the earlier text that conflicts | Internal reading is settled; the earlier record stays preserved and is marked as superseded where it conflicts |
| B. Record that inquiry intake (receiving messages) is distinct from an offer or pathway, and state what each record means | Both records stand with a stated boundary; requires precise wording, with counsel where licensing terms are involved |
| C. Defer | The 2026-10-05 handoff continues to govern Engine work by its own supersession rule; the earlier record is unchanged and its relationship is unrecorded |

**Explicit non-consequences.** No option changes public, commercial or licensing text,
makes an offer, sets a price, accepts an inquiry as a customer, or authorizes onboarding,
licensing, acquisition or rights transfer.

**Required future record if approved.** A dated precedence record, plus a separate,
later-approved revision list for any text to be changed under the publication and claim
policies.

**Dependencies and stop conditions.** Any licensing language requires counsel. Stop if
the decision would change public text or imply commercial availability.

**Owner disposition:** ______________________  **Date:** __________
