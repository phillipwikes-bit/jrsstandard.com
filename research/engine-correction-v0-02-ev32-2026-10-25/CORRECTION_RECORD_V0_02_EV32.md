# Correction Record: V0-02, EV-32 Scope (0.3.2-candidate)

**2026-10-25. Local engineering material only. Offline; no provider, credential or network.** This is a separately versioned candidate; the frozen 0.3.1-candidate, its manifests and the sealed V0 expectations are unchanged. Not adopted, not validated. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Authority and scope

- **Authority:** owner decision V0-02 (2026-10-25), "Authorize EV-32 scope".
- **Defect addressed:** V0 finding U-04. In detector K6, two cited quotations of the same assertion type with different dates were always flagged as a `cited_evidence_conflict`, even when they are dates of different events (for example a request date and an expiry date). That lowered chronology on an internally consistent record.
- **Out of scope, unchanged:** U-03, U-05, U-06 and U-07, and every other rule.

## 2. Change (complete diff in `CORRECTION_DIFF.patch`)

| File | Change |
|---|---|
| `contradictions.mjs` | New `eventRoleOf`: the role of the explicitly dated event clause or clauses that overlap a quotation; null when there are none, or more than one role. In K6, with RP-CON-02 active, a pair of `stated_date` or `stated_expiry` quotations is skipped only when both roles are known and differ. An unknown role keeps the 0.3.1 comparison. `stated_decision` is unchanged. |
| `compiler.mjs` | Passes the dated events and the active rules to K6 (one call site); header line |
| `rule-packs.mjs` | `RP-CON-02` added to the implemented rules; header line |
| `contract.mjs` | `COMPILER_VERSION` is `0.3.2-candidate`; header line |
| `rule-packs/RPK-ECR.json` | New signed pack holding RP-CON-02 |
| Six existing packs | `candidate_version` re-bound to 0.3.2 and re-signed. Rule content was checked to be identical |
| `engine-evidence-contract/`, `engine-assurance/`, prompt | Byte-identical copies, unchanged |

Candidate manifest: `CANDIDATE_0.3.2_MANIFEST_SHA256.txt` (43 files). The pre-change copy's hashes are in `SOURCE_COPY_SHA256_BEFORE_CHANGE.txt`.

## 3. Order of work

1. Copied the frozen candidate and verified the copy was byte-identical.
2. Wrote the regression cases RC-01 to RC-05, with expected outcomes for both versions, and the pre-declared V0 delta (EV-32 only).
3. **Sealed them at 2026-10-25T09:09:33.698Z, with the code still unchanged.**
4. Made the code change, re-signed the packs and recorded the manifest.
5. Recorded pre-run hashes (`PRE_RUN_RECORD.json`).
6. Ran two clean evaluation runs (1 and 2), then the mutations. One survivor, X13, stopped the work.
7. On owner direction, added supplementary case RC-06 and **sealed it at 2026-10-25T09:14:31.075Z with no code change**. The evaluator and mutation runner were extended, additively, to read it. Then fresh runs 3 and 4 and a mutation rerun. Earlier results are kept: `out/run-1`, `out/run-2`, `DETERMINISM_COMPARISON_RUNS_1_2.json`, `MUTATION_RESULTS_BEFORE_RC06.json`.

## 4. Results (current: `out/run-3`, `out/run-4`, `DETERMINISM_COMPARISON.json`, `MUTATION_RESULTS.json`)

| Measure | Result |
|---|---|
| Failure reproduced on 0.3.1 | RC-01 and RC-02: chronology review_required with `cited_evidence_conflict` (as sealed) |
| Same cases on 0.3.2 | Chronology supported, no conflict (as sealed) |
| Conflicts that must persist on 0.3.2 | RC-03 (two decision dates), RC-04 (two expiry dates), RC-05 (unknown role), RC-06 (granted against denied decisions with different roles): unchanged, as sealed |
| Sealed V0 corpus under 0.3.2 | 60 of 60 match the sealed V0 expectations, with only the pre-declared EV-32 delta applied |
| Differential, 0.3.1 against 0.3.2, all 60 V0 cases | EV-32 is the only behaviour change |
| Mechanical checks (V0 controls VC-04 to VC-13) | 0 failures under both versions |
| Determinism, two clean runs | Runs 1 and 2: 70 of 70; runs 3 and 4: 72 of 72 identical under the V0 criterion |
| Network attempts | 0 |
| Isolated copies | 0.3.1 and 0.3.2 both unchanged after use, then deleted |
| Mutations against the correction | Before RC-06: 13 applied, 12 detected, 1 survivor (X13). After RC-06: 13 applied, **13 detected, 0 survivors**; baseline 8 of 8 probes pass |

## 5. Survivor X13: stop condition, resolved on owner direction by an added sealed case

- **Mutation:** extend the event-role skip to `stated_decision` assertions.
- **Result:** no probe changed. No sealed case cites two `stated_decision` quotations with known, different event roles, so the probe set cannot tell whether decisions are excluded.
- **Classification:** a test-coverage gap. The shipped code does exclude decisions (FACT, from the diff); whether that exclusion is ever needed in practice is NOT ESTABLISHED.
- **Owner direction (2026-10-25):** add a sealed case. RC-06 cites a granted decision in a dated decision clause and a denied earlier request in a dated request clause. Its expectation, that the conflict persists, was sealed before the rerun. X13 is now detected by RC-06. No code was changed.

## 6. Limitations

- Event roles come from the lexical dated-event extraction. A quotation outside any dated clause, or overlapping clauses of two roles, keeps the 0.3.1 behaviour.
- A genuine conflict between two dates that the extractor assigns different roles would no longer be flagged by K6. The record-level detectors K1, K2 and RP-CHR-02 still apply.
- Evidence covers this corpus, these five cases and one runtime (Node v22). Phase 6 to 9 scenario suites were not rerun against 0.3.2.
- Adopting 0.3.2 in place of 0.3.1 is a separate owner decision. Nothing in `lib/` changed.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
