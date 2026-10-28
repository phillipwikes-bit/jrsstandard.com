# Pre-freeze development results (kept, not used for the scored analysis)

These outputs were produced on 2026-10-27 while 0.3.4 was being repaired, before `CANDIDATE_0.3.4_MANIFEST_SHA256.txt`
and `seals/freeze` existed. The 0.3.4 isolated copies were therefore not checked against a manifest
(`manifest_sha256: null` in the files). They are development evidence of how the repairs behaved during work.
Every suite was rerun after the freeze into `out/`; the scored analysis reads only `out/`.

| Directory | What it is |
|---|---|
| `out/reproduction-0.3.3` | Reproduction of documented 0.3.3 failures (study tools, frozen 0.3.3) |
| `out/dev-study-suites-1` | Study suites 1.0 run unchanged on the development build of 0.3.4 |
| `out/regression-probes-v2-0.3.4-research-candidate` | Regression probes 2.0 before Part 4 (MV-25) was added |
| `out/paired-*`, `out/injection-*`, `out/wording-*`, `out/controls-*` | Repair suites on 0.3.3 and the development build of 0.3.4 (wording before WD-41) |
| `out/differential-0.3.4-research-candidate` | Default-path differential on the development build |
| `out/transport` | Offline transport tests |
| `out/variant-spec-v2-check` | Variant generator 2.0 check against 1.0 |

The two runs of mutation tests 2.0 are in `history/mutations-v2-run-1` and `history/mutations-v2-run-2`.
