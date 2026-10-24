# Adapter Construction Record

**Revision 4 (2026-10-24). Outside the repository. Adapter status: CONSTRUCTED AND
TESTED OFFLINE ONLY.** Revision 3 is preserved in `history/rev3/`; revisions 2 and 1 in
`history/rev2/` and `history/rev1/`. B-018 OPEN. NO_GO_NOT_VERIFIED in effect. Gate 1
OPEN. Gate 3 OPEN. Gate 4 BLOCKED.

## 1. Authority

Owner construction assignment of 2026-10-24, which authorizes only construction and
offline testing of a separate, scratch-only adapter harness. It does not authorize
provider access, credential use, network access, model calls, a pilot or any evaluation.
No provider or model was selected for this work; offline tests use the placeholder model
identifier `MOCK-MODEL-NOT-A-PROVIDER`.

## 2. Phase 0 baseline (verified 2026-10-24)

HEAD `428c307`; 0 tracked and 0 staged changes; 482 untracked files; fingerprints
`20bba1b6...` and `e93fed1d...`; Phase 6 and 7 packages match their registry bindings with
0 file mismatches; Phase 8 manifest 83 of 83; Phase 9 manifest 99 of 99; live-pilot
readiness package revision 2.3 verifies; B-018 OPEN. No discrepancy.

## 3. Phase 1 Gate 1

No owner-uploaded `JRS_CONTROLLED_LOCAL_ARCHIVE_2026-10-24.tar.gz` present (the uploads
directory is empty). The session-retained Gate 4B copy was not used. **Gate 1: OPEN.**

## 4. Harness components (`harness/`)

| Component | File | SHA-256 |
|---|---|---|
| Adapter: request schema, V1 to V9, A-DUP, capture, replay, execution record, binding, pair check | `src/adapter.mjs` (version `0.1.0-offline`) | `88b6934494f0aed9f108207d55af09e34a48eef6c9b9900efe4bfc151aa3e3f2` |
| Mocked transport; live transport refused; disabled transport | `src/transport.mjs` | `d056ea8fd130b9d59398c6fe8a65766de6083fb5ca6a8f46880afb8e19c9c933` |
| Network guard (fetch, net, tls, http, https, dns) | `src/net-guard.mjs` | `eb379b68ee86b615b78c27b3091653b75303b6452c2be78b4aa7dd5403b2bfca` |
| Isolated Engine copy, verification, deletion | `src/isolate.mjs` | `922e84d8cdb5c3c1bab8958c726b31e675fd66c1140139e395dc3c82f180853f` |
| 21-test runner | `src/run-tests.mjs` | `58c209f7bfc882d6e6605631a6915c5d9be8c0d913dbe58d224a7b5fe7918907` |
| Mutation runner | `src/run-mutations.mjs` | `91bfeef718852040180b014d09b9019c139cdb57c4ccea46d29d8d9aaa3330f5` |
| Synthetic record fixture HF-001 | `fixtures/HF-001.record.txt` | `f5b6a15779b592fa150142605841c209a28f2afc77adc1fd69208798b5af34ce` |
| Synthetic mock-response fixtures (21) | `fixtures/mock-responses.json` | `7b58cc5e1f0a7d6001f1832000a3699c668ba47800eed42229d35ce1059a582f` |

Every harness file, including run artifacts, is listed in `ADAPTER_MANIFEST_SHA256.txt`.
The manifest builder is the standard `sha256sum` tool over the full harness tree.

Design properties: dependency-injected mock transport; no live transport implemented;
transport disabled by default; no credential is read (only the presence of provider and
credential variable names is checked, and any present name refuses the run); no endpoint
recorded; immutable raw-response capture (files written with exclusive-create); replay
only against an isolated temporary copy; execution record outside the graph; graph label
`local_mocked` unchanged; nine-field canonical binding and pair check as in adapter
contract section 8A; no package installed; no registry contacted.

## 5. Development history (disclosed)

One development run (`harness/dev-runs/dev-1.json`) and one mutation run
(`harness/dev-runs/mutations-1.json`) preceded the official run; both passed and are
preserved. Two harness defects were found and fixed before the first run: an isolation
snapshot that compared a directory the copy did not include, and a mutation runner path
that would have placed temporary copies outside the scratch directory. Neither involved
Engine code. An exploratory replay before construction used an isolated copy that was
then deleted.

## 6. Results

Official run `offline-2026-10-24T13-27-17-033Z`: **21 of 21 passed**; 0 failed; 0
skipped; 0 load or setup errors; 0 network attempts; 10 of 10 mutations detected;
isolated copy verified, unchanged and deleted; repository unchanged. See
`OFFLINE_TEST_REPORT.md`.

## 7. Owner decisions recorded and open

| ID | Status |
|---|---|
| AC-OD-01 Control allocation (adapter structural; Engine semantic) | RECORDED |
| AC-OD-02 V9 covers every non-`not_assessed` status | RECORDED |
| AC-OD-03 Offline execution records carry `response_origin: mock_transport_fixture`; `live_provider_captured` is reserved for a live transport | OPEN: owner confirmation requested; adopted in this build because labeling mock output as live would misstate provenance |
| AC-OD-04 Live transport mapping (provider response to the adapter envelope) | OPEN: not built; requires a selected provider and a later authorization |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
