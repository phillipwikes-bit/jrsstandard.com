# Study State (working file)

**2026-10-27, end of the offline study.**
- **Repository:** branch `claude/engine-reliability-phase6-local`, HEAD `b41e2043`, unchanged. This package is untracked; nothing is committed.
- **Status:** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.
- **Offline only:** no network, no provider, no credential used.

## Done

1. **Inventory and corpus.** 156 records inventoried. 100 disclosed synthetic replacements were sealed before any profile code (`seals/corpus`, 131 files).
2. **Research candidate 0.3.3.** Inert unless enabled; with the profile off it is identical to 0.3.2 (310 of 310, 343 of 343).
   - Development defects D1 to D18 fixed.
   - Mock fixes M1 to M5.
   - Limitations KL-01 to KL-08 recorded before the freeze.
3. **Protocol.** Codebook, blinded forms, sealed keys, label and contamination registers, proposed criteria (owner approval NOT GIVEN), request and cost plan, provider record, reviewer-benefit protocol.
4. **Freeze.** `seals/freeze`, 2,215 files, manifest `0d1230d0...fe20`, 2026-10-27T13:16:24Z. Candidate manifest `fad69b62...0477`.
5. **Scored offline runs.**
   - run-1, run-2 and run-3 (cross-environment): 1,120 of 1,120 identical.
   - vrun-1 and vrun-2: 4,045 of 4,045 identical.
   - Post-freeze suites: research 89, regression 32, feature 343 (x3), differential 310, transport 49, mutation 30 of 32, recovery 9 of 10 (1.0) and 10 of 10 (1.1).
6. **Analysis** (`reports/ANALYSIS.json`): 23 of 27 proposed criteria met.
7. **Reports.** Final report, failure register, capability matrix, controls assessment, stability and performance, research profile specification, baseline register, handoff, owner decision sheet, reproduction.
8. **Unsigned live authorization draft.** The offline gate refuses it.

## Open (owner)

- Decision 1: preserve the package. Either commit (the repository is public, `research/` is not deployed) or take an archive.
- Decisions 2 to 10 in `reports/OWNER_DECISION_SHEET.md`.

## Not to be done without authorization

- Live calls.
- Recruiting or contacting reviewers.
- Retrieving public cases.
- Research use of the excluded-domain originals.
- Commit or push.
- Adoption of any candidate.
- Any change to B-018.
