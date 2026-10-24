# PROPOSED FOR OWNER APPROVAL: Version Lineage Record (B018-OD-03)

**PROPOSED FOR OWNER APPROVAL. NOT EFFECTIVE. Prepared 2026-10-24 outside the
repository.** This is the dated lineage record that proposed disposition P-03 would
adopt if approved. It has no effect until the owner approves P-03. It is not recorded in
the repository or in any registry. **B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in
effect.**

Proposed record identifier: LINEAGE-PROPOSED-2026-10-24

## 1. Rule

Two lineages are recorded as distinct and parallel. No continuity between them is
asserted or denied.

- **Lineage S (source-era Engine):** the historical Engine described in the source
  records held outside the repository.
- **Lineage L (local packages):** the packages registered in the Phase 8 version
  registry and later-package registry.

Evidence, results, performance findings and claims do not transfer between Lineage S and
Lineage L, in either direction, without separately documented justification approved by
the owner (and by counsel where the transfer would bear on title).

## 2. Lineage S: source-era Engine

| Field | Entry |
|---|---|
| Identification | By the SHA-256 of the three controlling source documents, as recorded in `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md` (all three values present there, checked 2026-10-24) |
| Source document SHA-256 values | `0c64eaff74cae34b4c4fbe00c93ae80ac81007c59ecfe68d6f0a1f9ada795c5e`; `57e2ec50fc431381b65048f978175e779481bb174993448cd1b475a218dad0e0`; `a8822d7f54012dd646d822ab2eaca1b00a77e4c7f2c81522c61e6d774573efe9` |
| Content | Not present in the repository or this workspace; not read. Owner-reported: the source records contain historical Engine material not represented locally |
| Status | Identified by hash only. Hash identity establishes file identity, not the content, performance or legal effect of anything described |

## 3. Lineage L: local packages (hashes verified 2026-10-24)

| Package | Registry status | Files | Package SHA-256 | Binding check |
|---|---|---|---|---|
| v1-historical | frozen | 1 | `70c76d942960732bbadfa16cb7e9d622ca7380397050aceaba8d9bbe93d6661d` | matches |
| v0.1-assurance | frozen | 183 | `bf47e7b846862232f95864e6f095bd4151b8f5707d0e052fbda4afcc6130e2f4` | matches |
| v0.2-evidence-contract | frozen | 235 | `91464918068fd336b546ca0e929f3d9da19471e555ed463b057b6fdd7dabd251` | matches |
| v0.3-evidence-graph | frozen | 218 | `ecf0c04766a4e521af7ec1ca93d194a94c6db2fd2e2c130884296863b8756b12` | matches |
| phase4-change-control | frozen | 277 | `8b12a2384e81d727cc8eb57b12f02632a6a44d419e25e71d44ba6c2fb3a6f853` | matches |
| phase6-reliability | local_only | 139 | `cdd51355e92e8a62dbdb3f2147115f17f559d92efc12a951f4c45e96c1a38576` | matches |
| phase7-candidate (v0.3.1) | candidate_only | 147 | `815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3` | matches |
| phase8-governance (1.1.0) | present_local_only | 83 | `a0e59dc89c12bbfafb972d55e7237fa1a48b228fd164760868e96ff9141017b7` (hash of manifest rows, per the registry note) | matches |
| phase9-human-evidence-adjudication (0.1.0) | local_construction_only | 99 | No package hash in its registry binding. Manifest v2 rows hash to `dd19a3a2ab23f826192741577efcb7d616e44d9f05e495c1ee8b0c10ae7e79ac`; v1 manifest preserved as `edd4e635...` | manifest verifies (99 of 99) |

Sources: `research/engine-governance-phase8-2026-10-19/registry/VERSION_REGISTRY.json`;
`research/engine-governance-phase8-2026-10-19/governance/LATER_PACKAGE_REGISTRY.json`.
Every Lineage L package is local and uncommitted from Phase 6 onward. A registry status is
not a validation, release, ownership, commercial or deployment status.

## 4. What this record does not do

It does not assert that any Lineage L package is, derives from or replaces the
source-era Engine; does not establish that any version performs as described; does not
commit, publish, release or deploy any version; does not change any registered manifest
or registry; and does not support any ownership or chain-of-title statement.

## 5. Re-evaluation triggers

Any change to a Lineage L package hash; admission of a new package; any new source-era
material or source document with a different SHA-256; any proposed transfer of evidence,
results or claims between lineages.

## 6. Approval

This record is approved only together with P-03 in
`PROPOSED_GATE2_OWNER_DECISION_RECORD.md`.

Owner: ______________ Date: __________
