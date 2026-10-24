# Execution Record

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Phase 8, 2026-10-19. Local working tree on branch `claude/engine-reliability-phase6-local` at `428c307` (PR #40 head, frozen). local, synthetic, offline. Every command ran with `ANTHROPIC_BASE_URL` unset; every suite refuses provider configuration and traps network APIs.

## Sequence

1. **Stop before writing.** The new Phase 8 files would trip two Phase 7 checks and extend the two known conditions. Reported before any file was created; the owner chose to proceed and declare four conditions.
2. **Compatibility manifest first.** `governance/COMPATIBILITY_MANIFEST.json` was written before any Phase 8 code.
3. **Registry.** `registry/build-registry.mjs` recorded manifests for the seven earlier packages (Phase 7: 147 files), verified reproducibility within the run and again with `--verify`, verified the Phase 7 seal, and confirmed the Phase 6 manifest equals the Phase 7 start snapshot.
4. **Governance, records, protocol, change model, decisions.** Modules in `lib/engine-governance-phase8/`; records written by `build-records.mjs`.
5. **Whole-worktree runs.** `tools/engine-governance-phase8-replay.mjs --record` ran the six earlier suites unchanged, twice: once while Phase 8 was partly built, and finally after every Phase 8 location existed (2026-10-20T06:03:58.487Z). Both showed exactly CPC-01 to CPC-04.
6. **Mutation stop and repair.** See `MUTATION_TEST_RECORD.md` and `execution-record/POST_STOP_REPAIR_RECORD.json`.
7. **Documents and manifest.** `build-documents.mjs` and `build-manifest.mjs`.
8. **Final suite.** `node tests/engine-governance-phase8/run.mjs --record`: 474 of 474 checks passed (246 direct, 130 negative or adversarial, 98 mutation).

## Corrections before the mutation stop (disclosed)

| Change | Why |
|---|---|
| Qualification field guard narrowed to whole key segments | The first pattern matched "degraded" inside a recorded Phase 7 field name; caught when the records were first built. |
| Change-model evidence path pattern narrowed | It matched "evidence" in the candidate directory name, so a rule-pack path escalated past the rule-pack class; caught by a probe in a trial run. |
| Claim guard treats negation inside the matched phrase | "Local tests do not establish" was flagged; caught by a probe in a trial run. |

These were made before the first mutation run. None touched an earlier package.

## Correction after the authorized probe repair (disclosed)

The first full suite run after the mutation group passed reported 195 of 197. Both failures were false positives in two suite checks, not implementation defects: the provider-identifier check matched its own pattern text in the suite file, and the no-execution check matched ordinary regular-expression `.exec(` calls. Both checks were corrected in `tests/engine-governance-phase8/run.mjs` only (`execution-record/HARNESS_CORRECTION_RECORD.json`). The Phase 8 modules, probes and mutations did not change. This record then stated that the corrected checks "still forbid the same things". **That statement was inaccurate.**

## Audit finding and remediation (disclosed)

A later read-only audit found that the corrected process-execution check no longer detected `cp.exec(...)` or `child_process.exec(...)`, which the original check had detected: excluding regular-expression `.exec(` calls also excluded every method-call form of `exec`. The audit also found that neither check named the violating file or rule, that the process check never detected `execFile`, `execFileSync`, `fork` or a destructured alias, and that the provider check never detected provider environment access, provider key names or a provider SDK import.

On owner authorization both checks were rebuilt as static scanners in `tests/engine-governance-phase8/harness-scan.mjs`. The process scanner applies to `lib/engine-governance-phase8/` and permits only a named `execFileSync` import used with the literal `git`; it detects child_process imports (namespace, default, named, aliased, dynamic, require), member and bare calls of exec, execSync, execFile, execFileSync, spawn, spawnSync and fork, destructuring from a child_process binding, fetch and URLs, and still permits regular-expression `.exec(`. The provider scanner applies to every Phase 8 script and detects model identifiers, keys, key names, endpoints, environment access, SDK imports and string-concatenated forms. Every finding names the file and rule. Twenty-four direct probes and twelve mutations were added (`execution-record/AUDIT_REMEDIATION_RECORD.json`). The Phase 8 modules did not change.

## What did not happen

No commit, push, merge, pull-request action, deployment, provider call, network request, B-018 action, tracker or ledger update, public change or branch change. No real record, sealed evaluation material, source file or credential was used. No earlier package or earlier test was modified.
