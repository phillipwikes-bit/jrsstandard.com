# Validation Readiness Gate V0: Final Assurance Record

**2026-10-25. Local engineering material only. Offline; no provider, no credential, no network.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Baseline

| Item | Value |
|---|---|
| Branch | `claude/engine-reliability-phase6-local` (PR #42, draft) |
| HEAD and remote head | `95373f598c6119ce3ab7b1627cc3b241d414cc7b` |
| Tree | `84e3f31ff6002f4e97d57d0235b33cb90f00e90d` |
| Tracked changes before and after | 0 |
| Stage A stop record | `0d8d906f5f2cfa67de22663dd860bcfe469234640e206d7e644bffcd26c6e7a6` |
| Stage A recovery record | `195306d6a8680b9daac1c4700b791138b640f7226621f84ee7884ae7af8bdebc` |
| Stage A decision-package manifest | `8e746c392e177c188bcddedabc0d095d99cc37c11bd0cc7fe452994581b670d1` |
| Stage A recovery manifest | `523e1b1477013b15e2b9b21747dd92a3ffb36bfc37c6fe4c118a6a91b361c810` |
| Phase 6 baseline manifest | `f71cafeb0367dee3f3e4e409b9f6a67a8d35e49d2af353694695054f34350ccb` |
| Phase 7 candidate manifest | `815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3` |
| Phase 8 file manifest | `502302e187b00af550823f233caa1121476faff07e0bf3e657e1c0dc7396dc81` |
| Phase 9 file manifest | `685390e19d7d176ae9953a6b1a21b1c1e9d7881b2576d9abb901d4bc49053a39` |

The full list is in `BASELINE_AND_AUTHORITY_STATUS.md` and `baseline/BASELINE_HASHES_SHA256.txt`. Every current manifest verifies. The Phase 8 sub-version manifests do not; this is finding B0-F1, recorded on owner direction.

## 2. Corpus

- **Name:** sealed owner-authored synthetic validation-readiness corpus. Not a holdout, not independent.
- **Size:** 60 records: 40 protected evaluation (EV-01 to EV-40) and 20 adversarial or metamorphic (ADV-01 to ADV-20).
- **Coverage:** all five conditions. Variation covers:
  - missing decision basis;
  - chronology conflicts (five kinds);
  - ambiguous, case-variant, elided and heading-only quotations;
  - unsupported and negated reasoning;
  - incomplete evidence chains;
  - conflicting sources (authority, control, risk, log-review paraphrase, cited evidence);
  - false-reassurance and over-refusal traps;
  - scope triggers (employment, reworded employment, housing, placeholder, size, embedded instruction);
  - human-review routing triggers;
  - eight malformed-response cases;
  - six metamorphic relations;
  - benign records that should not be degraded.
- **Seal:** 2026-10-25T08:45:46.600Z; 243 files; manifest `1103d11d8a37407d3380b8edc3d8ca018345e5c74ccb5955933d0a60b97edfe6`. No Engine run occurred before the seal.

## 3. Totals

| Measure | Result |
|---|---|
| Cases per run | 60 (52 replayed, 8 rejected by the adapter before replay) |
| Check instances per run | 820 |
| Mechanical check failures | 0 in each run |
| Execution errors | 0 |
| Matches with the sealed owner-authored expectation | 60 of 60 in each run |
| Metamorphic relations holding | 6 of 6 |
| Determinism (pre-specified criterion, two clean runs) | 60 of 60 identical; 52 raw-byte graph differences, all timestamp-driven |
| Direct probes on unmutated controls | 60 of 60 pass |
| Mutations | 50 applied, 50 detected by their named probes, 0 survivors |
| Network attempts | 0 (evaluation and mutation runs) |
| Isolated Engine copy | Verified (147 manifest rows), unchanged after use, deleted, in each run |

## 4. Failures, discrepancies and unresolved issues

- **No failure was recorded** in the tests, mutations or determinism comparison.
- **B0-F1:** the Phase 8 sub-version manifests do not verify. It is not established whether earlier copies of the regenerated run records were kept. REQUIRES HUMAN REVIEW.
- **U-01:** the expectations are same-side. Conformance is not accuracy.
- **U-02, U-03, U-05, U-06:** semantic or design questions: authority-only identifiable basis; conclusion-only basis supporting reconstructability; certainty language not lowering status; "tenant parking" refusal.
- **U-04:** possible Engine over-flagging. Detector K6 flags two different stated dates on a consistent record. Candidate for V0-02.
- **U-07:** the Engine's `graph_sha256` carries the run timestamp, so it is not a content hash.
- **U-08 to U-16:** coverage, environment, path-binding, cognitive-control content, adapter-only cases, the conservative VC-10 rank and the pre-run probe corrections, and the absence of provider-console verification for Stage A.
- Full text: `FAILURE_AND_UNCERTAINTY_REGISTER.md`.

## 5. Claim boundary

| Claim | Status |
|---|---|
| The frozen 0.3.1-candidate behaves as its rules predict on this sealed synthetic corpus | Mechanically established for this build and corpus only |
| Quotation offsets, evidence linkage, provenance pairing, monotonicity, routing and graph validity hold on every replayed case | Mechanically established for this build and corpus only |
| Normalized outputs are reproducible across two runs on one machine | Mechanically established; cross-environment not characterized |
| The validation controls detect the 50 faults injected into them | Established for those faults only |
| The Engine's findings are accurate | **Not established** |
| The Engine's reliability, or its behaviour with a live model | **Not established**; no live response has ever been processed |
| The Engine has been independently evaluated | **Not established**; no evaluator, holdout or adjudication exists |
| The Engine is suitable for production, release, commercial use or real records | **Not established** |

## 6. Release boundary

This package changes no release control. NO_GO_NOT_VERIFIED remains in effect, B-018 remains OPEN, and no release, deployment, merge, external use, live pilot or Stage A restart is authorized by anything here. The three owner decisions in `OWNER_DECISION_PACKAGE.md` are open.

## 7. Conclusion

**OFFLINE EVIDENCE STRENGTHENED, NOT VALIDATED**

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
