# Test-Governance Scalability Model

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

**Language rule.** Earlier package results remain historically recorded results for their sealed package scope. A later whole-worktree run may show a declared compatibility condition without establishing a defect in the earlier package.

## Problem

Each earlier suite checks that new files sit only in its own locations. Every later local package therefore makes an earlier suite report a failing check in a whole-worktree run. Phase 8 handled this with four hand-written exceptions (CPC-01 to CPC-04). That list grows with every new package and must be edited by hand each time.

## Model

Three contexts are kept apart:

| Context | What it answers | Source of record |
|---|---|---|
| Historical package integrity | What did the package produce within its own sealed scope, and are its files still byte-identical? | registry/VERSION_REGISTRY.json, registry/manifests/, isolated replay |
| Current whole-worktree composition | What do the frozen earlier suites report when every local package is present? | execution-record/WORKTREE_RUN_RECORD.json (composition and dual_context) |
| Authorized later-package additions | Which later packages exist, where, under which owner reference, and which earlier checks they trip? | governance/LATER_PACKAGE_REGISTRY.json |

The earlier suites are frozen, so the earlier checks a later package can trip form a fixed catalogue of four. Later packages are open-ended: each is one registry entry. Composition conditions are derived from the registry and the catalogue, never written by hand. Adding a package means one admitted registry entry; no exception list is edited.

## Fail-closed rules

- A later file outside every registered package fails closed.
- A later package that trips an earlier check it did not declare fails closed.
- A stale manifest binding, a missing owner reference or a changed protected earlier file fails closed.
- A catalogued check that fails with no later file to explain it is a regression.
- A declared condition is reported as "declared composition condition, not a historical-package defect", and is never called a pass.
