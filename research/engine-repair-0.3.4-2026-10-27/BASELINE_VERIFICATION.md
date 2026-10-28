# Baseline Verification (0.3.4 repair assignment)

**2026-10-27, before any source change.** Every line is `FACT` from the command or file named. Nothing below was inferred.

## 1. Repository

| Item | Value | Evidence |
|---|---|---|
| Parent branch | `claude/engine-reliability-phase6-local` (draft PR #42, base `claude/engine-assurance-2026-10-10`) | `git log`; PR #42 metadata |
| Parent commit | `58f3fa6da3d961e24c99db687923d839f4431e89` (2026-10-27T13:56:18Z, "Record owner Decision 1 for the 156-record study and correct the IP tracker") | `git rev-parse HEAD` |
| Study commit | `0c8b98ade9bc7788814ebf7d246cb0fea607a6b3` (2026-10-27T13:48:02Z) | `git log -1 0c8b98ad` |
| Work branch | `claude/engine-repair-0.3.4-local`, created from the parent commit; local only, not pushed | `git checkout -b` |
| Working tree at start | clean except this new, untracked directory | `git status --porcelain` |
| Node | v22.22.0 | `node --version` |

## 2. The frozen study package (`research/study-156-2026-10-27/`)

| Check | Result | Evidence |
|---|---|---|
| Every file listed in `PACKAGE_MANIFEST_SHA256.txt` (2,440 files) | all match | `grep -v '^#' PACKAGE_MANIFEST_SHA256.txt \| sha256sum -c --quiet -`, exit 0 |
| Files in the package | 2,442: the 2,440 listed, the manifest itself and `reports/DECISION_RECORD.md` (added after the manifest by commit `58f3fa6`) | `find . -type f \| wc -l` |
| Corpus seal (131 files) and freeze seal (2,215 files) | both verify | `node tools/verify-seal.mjs`: `{"ok":true}` |
| Uncommitted changes inside the package | none | `git status --porcelain research/study-156-2026-10-27` |
| `PACKAGE_MANIFEST_SHA256.txt` | sha256 `e45a17462319080f1bba1e058d10e56190745db0a6884149a983ffa22598bd41` | `sha256sum` |

Documents read before work: `README.md`, `reports/FINAL_REPORT.md`, `reports/OWNER_DECISION_SHEET.md`, `reports/FAILURE_REGISTER.md`, `reports/DECISION_RECORD.md`, `protocol/ACCEPTANCE_CRITERIA_PROPOSED.json`, the candidate source, the tools, the manifests and the result files under `out/`.

## 3. Candidate versions

| Version | Role | Manifest | Status |
|---|---|---|---|
| 0.3.1-candidate | Engine of record | Phase 7 manifest `815c5d56...25c3` | Unchanged; remains the engine of record |
| 0.3.2-candidate | V0-02 correction candidate | `2276bbc2...0f18` | Not adopted |
| 0.3.3-research-candidate | Study research candidate | `CANDIDATE_0.3.3_MANIFEST_SHA256.txt`, sha256 `fad69b62554a8e8cb6aa97ba9a85b5ee4f80ebfff565a3705dfc91f8dc100477` | Not adopted; frozen; not edited by this work |
| 0.3.4-research-candidate | This repair candidate | written at the freeze of this package | Not adopted; research use only |

The copy in `candidate/` was taken from the frozen 0.3.3 source before any change. `SOURCE_COPY_SHA256_BEFORE_CHANGE.txt` lists its 46 files; every row equals the corresponding row of the 0.3.3 manifest.

## 4. Blockers and release status

| Item | State | Evidence |
|---|---|---|
| B-018 | OPEN (severity MEDIUM, category EVIDENCE; the three source-aligned files are still not supplied) | `.jrs/state/BLOCKERS.json` |
| Release status | `NO_GO_NOT_VERIFIED` | every result file of the study; `contract.mjs` `RELEASE_STATUS` |
| Owner decisions | Decision 1 (preserve the study package) recorded; Decisions 2 to 10 open | `reports/DECISION_RECORD.md` |

## 5. What this assignment does not change

- 0.3.1-candidate stays the engine of record. Neither 0.3.2, 0.3.3 nor 0.3.4 is adopted.
- B-018 stays OPEN. `NO_GO_NOT_VERIFIED` stays in effect.
- No file of `research/study-156-2026-10-27/` is edited. Its tools are imported read-only or copied into this package under new version numbers.
- No provider call, credential read or network attempt is made. Every harness installs the network guard before it loads any Engine code.
