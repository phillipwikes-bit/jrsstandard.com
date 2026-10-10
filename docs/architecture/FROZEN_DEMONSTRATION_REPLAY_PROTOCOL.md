# Frozen demonstration replay protocol (internal)

**Package `JRS-FROZEN-DEMO-20261007-PR39` version 0.1.0. Status: `DEMO_PREPARATION_COMPLETE_NOT_RELEASED`.** Internal, local-only and not deployed. This protocol prepares material for a future demonstration review. It is not a public demonstration, a pilot, a production deployment or a release authorization, and it records no owner release decision.

## 1. What is frozen
| Item | Where | Bound by |
|---|---|---|
| Five synthetic records, FD-01 to FD-05 | `tools/frozen-demo/corpus/v0.1.0/` | file sha256 and source sha256 in the manifest; committed alone in `1717f1b` before any code that uses them |
| Expected input-preparation and candidate behaviour | each record's `expected` block, copied into the manifest | the record hash and a field-by-field comparison |
| Expected result, packet and export digests | `demo-manifest.json`, `records[].expected_digests` | exact comparison on every replay |
| Candidate, prompt, contract and workspace versions | `demo-manifest.json`, `versions` | compared with the live constants |
| Module bytes | `demo-manifest.json`, `bound_modules` (10 candidate modules, workspace `core.js` and `correspondence.js`, `lib/replay.js`) | sha256 of each file |
| Adapter | `demo-manifest.json`, `adapter`: the deterministic mock, `lib/engine-candidate/mock-adapter.js` | identity comparison and an import allow-list on the replay |
| Time stamp, example reviewer, example date | `lib/replay.js` (`2026-10-07T00:00:00Z`, `SYNTHETIC-REVIEWER-EXAMPLE`) | the replay module hash |

A change to any frozen item is a new package version. Records are never edited in place, and expectations are never edited to match a result.

## 2. The cases
| Case | Shows | Expected behaviour |
|---|---|---|
| FD-01 | complete, reconstructable record | examined; no source-preparation finding; no key flagged by the scripted mock. Three scope probes on the same text are refused before the adapter. |
| FD-02 | missing identifiable basis | examined; deterministic `profile_element_not_found` (exception_basis); `basis_identification` gap and one `evidentiary_overreach` finding |
| FD-03 | chronology gap | examined; no deterministic finding; `temporal_reconstructability` gap and two `chronology_collapse` findings, one marked uncertain |
| FD-04 | missing logical bridge | examined; no deterministic finding; `reasoning_traceability` gap and one `reasoning_elision` finding |
| FD-05 | partial record | refused as `partial_input` (`pages_missing`, `ends_mid_sentence`) before model review; adapter calls 0 |

All five are completed, non-HR supplier-access exception drafts naming invented organisations and people, with dates in 2031. Every text opens with its SYNTHETIC label, and every record reference starts `SYNTHETIC-`. The texts are registered as development material (`lib/engine-candidate/dev-material.js` 0.4.0), so a future holdout builder refuses them, and before the freeze they were screened against the 89 existing development texts with no exact or possible match.

## 3. Replay
Run from the repository root, on Node 22.22.0 (the only tested version), with no dependencies to install:

| Command | Effect |
|---|---|
| `node tools/frozen-demo/verify-demo-manifest.mjs` | Replays and verifies the whole package; exit 0 only on `EXACT_REPLAY_CONFIRMED` |
| `node tools/frozen-demo/run-demo.mjs --table` | Replays and prints one line per case |
| `node tools/frozen-demo/run-demo.mjs --check` | Fails if `generated/replay-output.json` or `viewer/demo-data.js` differs from a fresh replay |
| `node tools/frozen-demo/serve-viewer.mjs` | Serves the read-only viewer on `http://127.0.0.1:4318/` (loopback only) |
| `node tests/frozen-demo/run-all.mjs` | The package tests, including the mutation run (`--quick` skips it) |

## 4. Fail-closed verification
`tools/frozen-demo/lib/verify.js` fails the whole package on any of:
- a changed record, index, expectation or frozen digest;
- a changed candidate version, prompt version or prompt hash, adapter identity, contract version or bound module;
- an import in the replay outside the approved set, which is how a provider adapter would have to enter, or a network, provider, credential, clock or storage pathway in any package file;
- a record outside the supplier-access scope, or text that indicates an excluded domain;
- a capitalised word that is not a month, a listed word or a declared fictional entity, or a real-organisation, real-person or contact marker;
- a score, verdict, legal or compliance determination or Codebook mapping in a result, packet or package file;
- a record, packet or export without its synthetic label, or a record reclassified as a holdout;
- a stale generated output;
- an evidence record that claims more than exact replay, names an advanced gate or records an owner release decision, or a release-gate record with a gate marked PASS;
- a missing limitation, a capability-matrix row without a limitation, a prohibited status, or a public page, route or configuration that names the viewer.

## 5. What a pass means
A pass means the fixed local package replayed exactly. It does not mean the findings are semantically correct. It also says nothing about how any real provider behaves or how the candidate performs on real records. It is not independent labeling or operational-control verification, and it shows no production or commercial readiness. It satisfies no release gate, and the independent holdout, operator-control, counsel, owner-authorization and independent production-QA gates remain open.

## 6. Boundaries
No real record, public case record, participant or pilot material, or sealed-holdout material is used or permitted. No provider is called, and no network connection is made. The package lives under `tools/`, `tests/` and `docs/architecture/*.md`, all excluded from deployment by `.vercelignore`, and no public page or route links to it. A demonstration to anyone, public or private, would be a separate act needing its own owner decision.
