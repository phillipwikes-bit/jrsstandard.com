# Baseline and Authority Status

**Validation Readiness Gate V0. 2026-10-25. Local engineering material only.** This
package grants no live-pilot authority. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Repository baseline (recorded before any file in this package was written)

| Item | Value |
|---|---|
| Branch | `claude/engine-reliability-phase6-local` (PR #42, draft) |
| HEAD | `95373f598c6119ce3ab7b1627cc3b241d414cc7b` |
| Tree | `84e3f31ff6002f4e97d57d0235b33cb90f00e90d` |
| Remote branch head | `95373f598c6119ce3ab7b1627cc3b241d414cc7b` (equal to HEAD) |
| Tracked changes | 0 |
| Tracked-file fingerprint | `e3d84631ea91d037` |
| Untracked content | This package directory only |

## 2. Hashes of the required records

| `research/live-pilot-authorization-2026-10-24/STAGE_A_STOP_RECORD_SR-LP-14.md` | `0d8d906f5f2cfa67de22663dd860bcfe469234640e206d7e644bffcd26c6e7a6` |
| `research/stage-a-recovery-2026-10-25/STAGE_A_CREDENTIAL_EXPOSURE_AND_RESTART_RECORD.md` | `195306d6a8680b9daac1c4700b791138b640f7226621f84ee7884ae7af8bdebc` |
| `research/live-pilot-authorization-2026-10-24/STAGE_A_FINAL_DECISION_PACKAGE_MANIFEST_SHA256.txt` | `8e746c392e177c188bcddedabc0d095d99cc37c11bd0cc7fe452994581b670d1` |
| `research/live-pilot-authorization-2026-10-24/STAGE_A_AUTHORIZATION_MANIFEST_SHA256.txt` | `5ef2b0115fc76572675dc90753c6dd2994c1cc025fd92c8134445c0f7b11ef10` |
| `research/stage-a-recovery-2026-10-25/STAGE_A_RECOVERY_MANIFEST_SHA256.txt` | `523e1b1477013b15e2b9b21747dd92a3ffb36bfc37c6fe4c118a6a91b361c810` |
| `research/stage-a-offline-preparation-2026-10-24/STAGE_A_OFFLINE_PREPARATION_MANIFEST_SHA256.txt` | `2c1e934b7facc22735826eab170b0c9a9fb789dbb032f643970cd482b865cbb8` |
| `research/engine-reliability-phase6-2026-10-17/baseline/PHASE6_BASELINE_MANIFEST.json` | `f71cafeb0367dee3f3e4e409b9f6a67a8d35e49d2af353694695054f34350ccb` |
| `research/engine-governance-phase8-2026-10-19/registry/manifests/phase6-reliability.sha256` | `cdd51355e92e8a62dbdb3f2147115f17f559d92efc12a951f4c45e96c1a38576` |
| `research/engine-governance-phase8-2026-10-19/registry/manifests/phase7-candidate.sha256` | `815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3` |
| `research/engine-governance-phase8-2026-10-19/PHASE8_FILE_MANIFEST_SHA256.txt` | `502302e187b00af550823f233caa1121476faff07e0bf3e657e1c0dc7396dc81` |
| `research/engine-human-review-phase9-2026-10-20/PHASE9_FILE_MANIFEST_SHA256.txt` | `685390e19d7d176ae9953a6b1a21b1c1e9d7881b2576d9abb901d4bc49053a39` |
| `research/engine-live-feasibility-2026-10-24/live-pilot-adapter-2026-10-24/OFFLINE_TEST_RESULTS.json` | `0d99b326dc7188c00e23d2de5fa8a5126e529da1d4f8f373b331373f0c80a7f4` |
| `research/engine-live-feasibility-2026-10-24/feasibility-final-2026-10-24/ADAPTER_V2_OFFLINE_TEST_RESULTS.json` | `db746375fed45db50dc804162c181e9ffacc20f60ae6c2ae15e49781e104a70c` |
| `research/engine-live-feasibility-2026-10-24/feasibility-final-2026-10-24/ADAPTER_V2_MUTATION_RESULTS.json` | `1b2309b3ee4285247459b5f1e0b582020eee49e24f0eaa3813da49b13944fc40` |
| `research/stage-a-offline-preparation-2026-10-24/ANTHROPIC_MAPPING_TEST_RESULTS.json` | `115745d5c0f49f691bdaa10c9249184cc028722173b4cc1f65efed4f4afd3bf2` |
| `research/stage-a-offline-preparation-2026-10-24/ANTHROPIC_MAPPING_MUTATION_RESULTS.json` | `5e48b1e45328edf1f36a84eb2f9df028d82971c394f419febf973bbdeda8fc26` |
| `research/engine-live-feasibility-2026-10-24/feasibility-final-2026-10-24/LIVE_TRANSPORT_OFFLINE_TEST_RESULTS.json` | `a5b157361bb98946885ee98e59e6299a42871d7e23fbe1f6743b624db7ab779a` |
| `research/engine-live-feasibility-2026-10-24/feasibility-final-2026-10-24/LIVE_TRANSPORT_MUTATION_RESULTS.json` | `4d076ce4ab4c4d58f893d8216d0cc83e8c7bf5a418f53a97bdb7e4a2d558a9c7` |
| `research/engine-live-feasibility-2026-10-24/feasibility-final-2026-10-24/COGNITIVE_CONTROLS_TEST_RESULTS.json` | `9e3004a0d1bca9c50b83d53146f3ab41d7ddac8428c5ff12a2683e0ae2eefd44` |
| `research/engine-live-feasibility-2026-10-24/feasibility-final-2026-10-24/COGNITIVE_CONTROLS_MUTATION_RESULTS.json` | `b17bb669607878ab529afc47165b46dd4f767882bdc7db6df602faac3a3a8745` |

Source: `baseline/BASELINE_HASHES_SHA256.txt` (verifiable with `sha256sum -c` from the repository root).

## 3. Manifest verification

| Manifest | Result |
|---|---|
| Stage A offline preparation (175 entries) | Verifies |
| Stage A decision package v3 (21 entries), v2 (4), history rev1 and rev2 | Verify |
| Stage A recovery (1 entry) | Verifies |
| Phase 7 frozen candidate `phase7-candidate.sha256` (147 entries) | Verifies |
| Phase 6 `phase6-reliability.sha256` (139 entries) | Verifies |
| Phase 8 current `PHASE8_FILE_MANIFEST_SHA256.txt` (83 entries, from repository root) | Verifies |
| Phase 9 `PHASE9_FILE_MANIFEST_SHA256.txt` (99 entries, from repository root) | Verifies |
| v1-historical, v0.1, v0.2, v0.3, Phase 4 registry manifests | Verify |
| Phase 8 sub-version manifests 8.1, 8.2 and 8.2c | **Do not verify: 29, 26 and 6 differing files** |

**Finding B0-F1, open (recorded on owner direction of 2026-10-25 to proceed).**

- **FACT:** The three Phase 8 sub-version manifests do not match the current files. The exact list is in `baseline/PHASE8_HISTORICAL_MANIFEST_DIFFERENCES.txt`.
- **FACT:** The Phase 8 change records describe them as manifests of earlier, superseded states (CHANGELOG, `PHASE8_2_ADMISSION_CORRECTION_RECORD.json`).
- **FACT:** All 6 files that differ from 8.2c, 23 of 29 from 8.1 and 17 of 26 from 8.2 are covered by the current Phase 8 or 9 manifest, which verifies.
- **FACT:** 15 files are not covered by any current manifest: 6 from the 8.1 snapshot and 9 from the 8.2 snapshot. They are the Phase 8 manifest file itself and run records later runs regenerated: `WORKTREE_RUN_RECORD.json`, `worktree-output/*.txt`, `LATER_PACKAGE_REGISTRY.json`, `MUTATION_EVIDENCE.json` and `PHASE8_TEST_RESULTS.json`.
- **NOT ESTABLISHED:** whether earlier copies of those run records were preserved elsewhere.
- **Effect here:** none on the frozen candidate used by this package, which verifies in full. **REQUIRES HUMAN REVIEW** for preservation (CLAUDE.md Rule 10).

## 4. Authority status

- The Stage A pilot stopped before live execution, under SR-LP-14 (credential exposure).
- The recorded outcome is zero provider requests and zero spend. **This is a repository record, not provider-console verification**; no provider console was inspected.
- The original authorization `STAGE-A-AUTH-20261025-01` and its Gate 4 direction are spent and **cannot be used to restart**.
- **B-018 remains OPEN.**
- **NO_GO_NOT_VERIFIED remains in effect.**
- **This package creates no live-pilot authority**, no restart authorization, and no release, deployment or validation authority.
- Everything in this package runs offline. Provider calls are prohibited, network attempts are trapped, and no credential is read.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
