# Mutation Catalogue

**Gate V0, 2026-10-25.** Mutations against the Gate V0 validation controls. A mutation is detected only when its named direct probe fails. Detection shows the probes catch these faults; it does not show the absence of other faults. Target: `tools/controls.mjs` (the evaluator's validation controls). The frozen Engine and adapter are not mutated. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

Method: `tools/run-mutations.mjs`. Each mutation is one exact text replacement in a temporary copy of the controls; an emptied statement becomes `;` so the module still loads. The copy is loaded and all 60 direct probes (`tools/probes.mjs`) are run. A mutation counts as detected only if its named probe fails. The temporary copies are deleted.

Baseline (unmutated): 60 of 60 probes pass. Totals: 50 mutations, 50 applied, 50 detected, 0 survivors. Load errors: 0. Network attempts: 0.

| ID | Mutation | Control | Named probe | Detected |
|---|---|---|---|---|
| M01 | Remove the graph-hash check from the provenance pair | VC-04 | P-PAIR-GRAPH | yes |
| M02 | Permit a graph-hash mismatch (compare the hash with itself) | VC-04 | P-PAIR-GRAPH | yes |
| M03 | Remove the captured-response hash check | VC-04 | P-PAIR-RESP | yes |
| M04 | Remove the binding-digest comparison | VC-04 | P-PAIR-DIGEST | yes |
| M05 | Swallow an invalid binding field | VC-04 | P-PAIR-BINDFIELD | yes |
| M06 | Permit an incorrect model identity in the execution record | VC-05 | P-MODEL-REC | yes |
| M07 | Permit an incorrect model identity in the captured envelope | VC-05 | P-MODEL-ENV | yes |
| M08 | Compare the record model with itself | VC-05 | P-MODEL-REC | yes |
| M09 | Accept altered expected results | VC-03 | P-EXP-ALTERED | yes |
| M10 | Accept an expectation for another case | VC-03 | P-EXP-CASEID | yes |
| M11 | Allow an unsealed corpus | VC-01 | P-SEAL-MISSING | yes |
| M12 | Allow post-seal modification | VC-01 | P-SEAL-MODIFIED | yes |
| M13 | Allow an unsealed file to be added | VC-01 | P-SEAL-ADDED | yes |
| M14 | Ignore a seal-manifest hash mismatch | VC-01 | P-SEAL-MANIFEST | yes |
| M15 | Allow a seal without a timestamp | VC-01 | P-SEAL-TIMESTAMP | yes |
| M16 | Allow missing Layer 1 facts | VC-02 | P-L1-FACTS | yes |
| M17 | Allow Layer 1 not declared synthetic | VC-02 | P-L1-SYNTH | yes |
| M18 | Allow an ambiguous quotation to be selected | VC-09 | P-AMB-SELECT | yes |
| M19 | Allow an ambiguous quotation without candidate locations | VC-09 | P-AMB-LOCATIONS | yes |
| M20 | Permit an unsupported status increase to supported | VC-10 | P-MONO-RAISE | yes |
| M21 | Permit a status change to gap | VC-10 | P-MONO-GAP | yes |
| M22 | Permit sufficiency to be supported | VC-10 | P-MONO-SUFF | yes |
| M23 | Remove the status-rank check | VC-10 | P-MONO-RANK | yes |
| M24 | Permit a status with no candidate proposal | VC-10 | P-MONO-NOPROP | yes |
| M25 | Suppress a required finding route to human review | VC-11 | P-ROUTE-FIND | yes |
| M26 | Accept a missing human-review route | VC-11 | P-ROUTE-MISSING | yes |
| M27 | Suppress conflict routing | VC-11 | P-ROUTE-CONF | yes |
| M28 | Conceal an execution error as a normal result | VC-15 | P-ERR-GUARD | yes |
| M29 | Stop counting execution errors as failures | VC-15 | P-ERR-COUNT | yes |
| M30 | Permit a network-related configuration key | VC-16 | P-NET-KEY | yes |
| M31 | Permit a network URL in configuration | VC-16 | P-NET-VALUE | yes |
| M32 | Permit forbidden provider environment variables | VC-16 | P-NET-ENV | yes |
| M33 | Ignore network attempts | VC-16 | P-NET-ATTEMPTS | yes |
| M34 | Permit forbidden validation or release language | VC-17 | P-LANG | yes |
| M35 | Treat every mention as negated | VC-17 | P-LANG | yes |
| M36 | Drop "ready for release" from the forbidden terms | VC-17 | P-LANG-RELEASE | yes |
| M37 | Remove the span-text offset check | VC-07 | P-OFF-SPAN | yes |
| M38 | Remove the evidence offset check | VC-07 | P-OFF-EV | yes |
| M39 | Remove the assertion-to-evidence linkage check | VC-08 | P-LINK-ASSERT | yes |
| M40 | Permit a favourable finding without an assertion | VC-08 | P-LINK-FAV | yes |
| M41 | Ignore recorded provider or network calls | VC-06 | P-ID-CALLS | yes |
| M42 | Ignore an unexpected execution mode | VC-06 | P-ID-MODE | yes |
| M43 | Ignore live provenance labels | VC-06 | P-ID-LABELS | yes |
| M44 | Permit an unlowered chronology conflict | VC-12 | P-CHRONO | yes |
| M45 | Discard graph-validity problems | VC-13 | P-GV | yes |
| M46 | Stop comparing statuses with the sealed expectation | VC-14 | P-CMP-STATUS | yes |
| M47 | Stop comparing conflict kinds | VC-14 | P-CMP-CONFLICT | yes |
| M48 | Stop comparing refusal codes | VC-14 | P-CMP-REFUSAL | yes |
| M49 | Stop comparing quotation statuses | VC-14 | P-CMP-QUOTE | yes |
| M50 | Accept any adapter outcome | VC-14 | P-CMP-ADAPTER | yes |

## Required mutation classes

| Required class | Mutations |
|---|---|
| remove a provenance-pair check | M01, M03, M04, M05 |
| permit hash mismatch | M02 |
| permit incorrect model identity | M06, M07, M08 |
| accept altered expected results | M09, M10 |
| allow an unsealed corpus | M11 |
| allow post-seal modification | M12, M13, M14, M15 |
| allow missing Layer 1 facts | M16, M17 |
| allow ambiguous quotation selection | M18, M19 |
| permit an unsupported status increase | M20, M21, M22, M23, M24 |
| suppress a required human-review route | M25, M26, M27 |
| conceal an execution error as a normal result | M28, M29 |
| permit a network-related configuration marker | M30, M31, M32, M33 |
| permit forbidden validation or release language | M34, M35, M36 |

No survivor was recorded, so the stop condition for a surviving mutation was not triggered.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
