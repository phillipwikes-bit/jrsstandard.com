# Owner Decision Package (Gate V0)

**2026-10-25. Three decisions only. None is pre-filled.** No decision here authorizes provider access, a live request, a restart of Stage A, a commit, a release or any public claim. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## Decision V0-01: preserve the package as local engineering evidence

| Field | Entry |
|---|---|
| Purpose | Keep `research/validation-readiness-gate-v0-2026-10-25/` as a record of offline engineering evidence |
| Evidence available | Baseline record; evidence map; sealed 60-case corpus; two clean runs (60 of 60 expectation matches, 0 mechanical failures, identical under the pre-specified criterion); 50 of 50 mutations detected; handoff drafts; package manifest |
| Evidence missing | Independent review of any of it; the 16 uncertainties in the register |
| Permitted effect | The package stays untracked locally. A later, separately authorized commit may preserve it in the repository |
| Prohibited effect | Treating it as validation, accuracy, reliability or release evidence; using the corpus as a holdout |
| Stop conditions | Any manifest stops verifying; any credential-like value found; any claim beyond the claim boundary table |
| Required future authority | Owner, for any commit and push (not authorized by this assignment) |

Decision: [ ] Preserve  [ ] Do not preserve    Owner: __________ Date: __________

## Decision V0-02: a separate, tightly scoped correction project for a genuine Engine defect

| Field | Entry |
|---|---|
| Purpose | Decide whether to open a correction project for any defect the owner judges genuine |
| Evidence available | Candidates from the register: U-04 (EV-32 cited-evidence conflict on a consistent record; detector K6 keys on assertion type, not event role); U-03 (EV-23 conclusion-only basis supports reconstructability); U-07 (graph_sha256 carries the run timestamp); U-06 (EV-38 "tenant parking" over-refusal). None is confirmed as a defect |
| Evidence missing | Adjudication of whether each behaviour is a defect or intended; impact on earlier Phase 6 to 9 results |
| Permitted effect | Open a new, separately versioned candidate with its own sealed regression set, change-impact classification and mutation evidence. The frozen 0.3.1 candidate stays unchanged |
| Prohibited effect | Editing the frozen candidate, its manifests or the V0 sealed expectations; re-baselining historical suites; claiming improvement without fresh, pre-specified evidence |
| Stop conditions | Any change touching more than the named defect; any regression in the V0 corpus that is not pre-declared; any frozen manifest change |
| Required future authority | Owner, for the correction scope, and again for any adoption of the corrected candidate |

Decision: [ ] Authorize a correction project for: __________  [ ] Not now    Owner: __________ Date: __________

## Decision V0-03: begin planning, not executing, an independent evaluation pathway

| Field | Entry |
|---|---|
| Purpose | Decide whether planning may begin once the preconditions below are addressed |
| Evidence available | `independent-evaluation/` drafts (protocol, roles, blinding, admission gate, holdout criteria, measurement plan) |
| Evidence missing | Every precondition in the protocol draft section 2: B-018 closure, rights and data admission, independent roles, holdout, measures, counsel review where applicable |
| Permitted effect | Planning only: refine the drafts and identify the roles and their requirements. No recruitment, contact, real data or run |
| Prohibited effect | Recruiting or contacting anyone; using real or third-party records; running any evaluation; any live-model request |
| Stop conditions | Any planning step that would need real material, an external contact or a live request |
| Required future authority | Owner, after B-018, rights, data-admission and role-separation conditions are addressed; a further separate authorization to execute |

Decision: [ ] Begin planning when conditions are addressed  [ ] Not now    Owner: __________ Date: __________

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
