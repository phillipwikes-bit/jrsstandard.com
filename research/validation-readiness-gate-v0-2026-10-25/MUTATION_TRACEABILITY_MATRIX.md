# Mutation Traceability Matrix

**Gate V0, 2026-10-25.** Maps each validation control to its direct probes, and each probe to the mutations that made it fail. A mutation may make more than one probe fail; it is counted as detected only by its named probe (`MUTATION_CATALOGUE.md`). B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

| Control | Probe | Named target of | Also failed under |
|---|---|---|---|
| VC-01 | P-SEAL-GOOD | - | - |
| VC-01 | P-SEAL-MISSING | M11 | - |
| VC-01 | P-SEAL-MODIFIED | M12 | - |
| VC-01 | P-SEAL-ADDED | M13 | - |
| VC-01 | P-SEAL-MANIFEST | M14 | - |
| VC-01 | P-SEAL-TIMESTAMP | M15 | - |
| VC-02 | P-L1-GOOD | - | - |
| VC-02 | P-L1-FACTS | M16 | - |
| VC-02 | P-L1-SYNTH | M17 | - |
| VC-03 | P-EXP-GOOD | - | - |
| VC-03 | P-EXP-ALTERED | M09 | - |
| VC-03 | P-EXP-CASEID | M10 | - |
| VC-04 | P-PAIR-GOOD | - | - |
| VC-04 | P-PAIR-GRAPH | M01, M02 | - |
| VC-04 | P-PAIR-RESP | M03 | - |
| VC-04 | P-PAIR-DIGEST | M04 | - |
| VC-04 | P-PAIR-BINDFIELD | M05 | - |
| VC-05 | P-MODEL-GOOD | - | - |
| VC-05 | P-MODEL-REC | M06, M08 | - |
| VC-05 | P-MODEL-ENV | M07 | - |
| VC-06 | P-ID-GOOD | - | - |
| VC-06 | P-ID-CALLS | M41 | - |
| VC-06 | P-ID-MODE | M42 | - |
| VC-06 | P-ID-LABELS | M43 | - |
| VC-07 | P-OFF-GOOD | - | - |
| VC-07 | P-OFF-SPAN | M37 | - |
| VC-07 | P-OFF-EV | M38 | - |
| VC-08 | P-LINK-GOOD | - | - |
| VC-08 | P-LINK-ASSERT | M39 | - |
| VC-08 | P-LINK-FAV | M40 | - |
| VC-09 | P-AMB-SELECT | M18 | - |
| VC-09 | P-AMB-LOCATIONS | M19 | - |
| VC-10 | P-MONO-GOOD | - | - |
| VC-10 | P-MONO-RAISE | M20 | - |
| VC-10 | P-MONO-GAP | M21 | - |
| VC-10 | P-MONO-SUFF | M22 | - |
| VC-10 | P-MONO-RANK | M23 | - |
| VC-10 | P-MONO-NOPROP | M24 | - |
| VC-11 | P-ROUTE-GOOD | - | - |
| VC-11 | P-ROUTE-MISSING | M26 | - |
| VC-11 | P-ROUTE-FIND | M25 | - |
| VC-11 | P-ROUTE-CONF | M27 | - |
| VC-12 | P-CHRONO | M44 | - |
| VC-13 | P-GV | M45 | - |
| VC-14 | P-CMP-GOOD | - | - |
| VC-14 | P-CMP-STATUS | M46 | - |
| VC-14 | P-CMP-CONFLICT | M47 | - |
| VC-14 | P-CMP-REFUSAL | M48 | - |
| VC-14 | P-CMP-QUOTE | M49 | - |
| VC-14 | P-CMP-ADAPTER | M50 | - |
| VC-15 | P-ERR-GUARD | M28 | - |
| VC-15 | P-ERR-COUNT | M29 | - |
| VC-16 | P-NET-GOOD | - | - |
| VC-16 | P-NET-ENV | M32 | - |
| VC-16 | P-NET-KEY | M30 | - |
| VC-16 | P-NET-VALUE | M31 | - |
| VC-16 | P-NET-ATTEMPTS | M33 | - |
| VC-17 | P-LANG-GOOD | - | - |
| VC-17 | P-LANG | M34, M35 | - |
| VC-17 | P-LANG-RELEASE | M36 | M34, M35 |

Probes named by no mutation are the "good" probes. They confirm that valid inputs raise nothing, which guards against controls that flag everything.

| Control | Probes | Mutations targeting it |
|---|---|---|
| VC-01 | 6 | 5 |
| VC-02 | 3 | 2 |
| VC-03 | 3 | 2 |
| VC-04 | 5 | 5 |
| VC-05 | 3 | 3 |
| VC-06 | 4 | 3 |
| VC-07 | 3 | 2 |
| VC-08 | 3 | 2 |
| VC-09 | 2 | 2 |
| VC-10 | 6 | 5 |
| VC-11 | 4 | 3 |
| VC-12 | 1 | 1 |
| VC-13 | 1 | 1 |
| VC-14 | 6 | 5 |
| VC-15 | 2 | 2 |
| VC-16 | 5 | 4 |
| VC-17 | 3 | 3 |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
