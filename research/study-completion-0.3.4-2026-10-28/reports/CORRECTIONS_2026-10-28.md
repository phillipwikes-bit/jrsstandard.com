# Dated corrections, 2026-10-28

Each entry follows OLD FINDING, NEW EVIDENCE, CORRECTED STATUS, EXPLANATION. The original files are unchanged; they are frozen and keep their seals. Figures come from `reconciliation/RECONCILIATION.md`, `results/OFFLINE_SCRIPTED_RESULTS.md` and `protocol/PROVIDER_VERIFICATION.json`, all generated or recorded in this directory.

## C-01. AC-15 development value

- **Old finding.** `engine-repair-0.3.4-2026-10-27/protocol/ACCEPTANCE_CRITERIA_V2_PROPOSED.json` (AC-15 `review`) and `protocol/CRITERIA_REVIEW.md` (AC-15 row): "10 of 60 grounded records flagged (16.7%)".
- **New evidence.** Raw rows of 0.3.4 run-1, arm A3R: 10 of 62 GROUNDED eligible records flagged (16.1%), the value in `reports/ANALYSIS_V2.json`; 9 of 60 synthetic only (15.0%); 1 of 2 originals. No scored run exists before the freeze (`history/pre-freeze-dev/out` holds none).
- **Corrected status.** 10 of 62 (16.1%) for all eligible records; 9 of 60 (15.0%) for synthetic records only.
- **Explanation.** The prose combined the all-record numerator with the synthetic-only denominator. The conclusion is unchanged: the threshold (at most 10%) is missed on either denominator, and AC-15 remains not evaluable because it applies to fresh evaluation material only.

## C-02. Token estimate described as conservative

- **Old finding.** Frozen `tools/transport/sender.mjs`: `ceil(length / 3)` is "conservative for English with the newer tokenizer". Study `protocol/PROVIDER_COMPATIBILITY_RECORD.md`, PC-13: "1 token per 3 characters, which is above the expected count for English prose".
- **New evidence.** Official models overview, 2026-10-28: "1M tokens is roughly 555k words or 2.5M Unicode characters on the current tokenizer" (PV-11).
- **Corrected status.** About 2.5 characters per token is the documented average, so `length / 3` is below the typical count, not above it.
- **Explanation.** The worst-case estimate decides whether the sender refuses an attempt before the spend cap. The bound sender uses one token per UTF-8 byte, an assumed upper bound (B4), and a reported input above the estimate stops the run (SR-13). No live request was ever sent, so no spend was affected.

## C-03. Provider facts not re-verified

- **Old finding.** Frozen sender and preflight proposal: provider facts "cached 2026-10-06 ... not re-fetched; re-verify at authorization".
- **New evidence.** Official documentation fetched 2026-10-28 (`PROVIDER_VERIFICATION.json`, PV-01 to PV-19): model identifier, prices, API version, sampling-parameter removal, effort, thinking, errors, stop reasons, prefill, size limits, retention.
- **Corrected status.** Every request-shape fact the frozen sender relies on is confirmed. The provider also lists 402, 409 and 504, which the frozen classifier did not name; the bound copy treats them as final, and 504 as possibly billed (B3).
- **Explanation.** The account-level facts (model access, retention arrangement) and network reachability remain NOT ESTABLISHED; they cannot be checked without contacting the provider.

## C-04. "Post-freeze runs complete" read as success

- **Old finding.** `engine-repair-0.3.4-2026-10-27/tools/post-freeze-runs.sh` ends with "post-freeze runs complete"; the reports read the run as passing.
- **New evidence.** Run from a mirror whose `out/` is scratch, the frozen `regression-probes-v2.mjs` exits 0 with 37 failing probes, and `run-study-suites.mjs` exits 0 with RG-23 failing (RECONCILIATION R6). Only the transport test sets a failing exit code.
- **Corrected status.** The script's completion message says the tools ran, not that they passed. The frozen outputs do meet their recorded expectations: `tools/check-results.mjs` checks 18 outputs against explicit expectations and their totals against their own rows, and exits 1 on any difference.
- **Explanation.** The reported results stand; the assurance that they were checked now comes from a fail-closed verifier, not from the pipeline's exit status.

## C-05. Research-probe counts 89 and 90

- **Old finding.** The study reports 89 of 89 research probes (0.3.3); the 0.3.4 report 90 of 90 (study suites 1.0 on 0.3.4). The two counts were reported without explanation.
- **New evidence.** `research-probes.mjs` emits one probe per entry of the engine's research defect templates; 0.3.4 has 31 templates (0.3.3: 30), adding `instruction_text_in_record` (RECONCILIATION R3).
- **Corrected status.** Both counts are right for their engines. Probe identifiers are positional, so identifiers after the template loop differ by one between the two runs.
- **Explanation.** Comparisons of research probes across versions are by content, not by identifier.

## C-06. Stated-irrelevant-basis weakness: its nature

- **Old finding.** The 0.3.4 report describes the weakness as an irrelevant item that the record states as the basis giving CLEAR to over-claiming candidates (64 of 126 such cases).
- **New evidence.** Row by row, on all 210 UNGROUNDED rows (five arms), inserting a relevant, linked basis at the same position gives the same E1 as inserting the irrelevant one (210 of 210). The flag is lost in 132 of 210 rows, including 53 rows of the two correct-candidate arms, where E1 becomes unresolved rather than CLEAR (`results/OFFLINE_SCRIPTED_RESULTS.md`).
- **Corrected status.** The figure of 64 CLEAR results stands. The weakness is wider than the CLEAR count: the rules respond to a basis being stated, not to its relevance, and the flaw signal is lost even with correct candidates.
- **Explanation.** This is a structural limit of lexical rules. It is reported, not repaired: the assignment excludes a rebuild.

## C-07. Live transport design (disabled; never used)

- **Old finding.** The frozen sender's design: network errors counted as free; a refused redirect retried as a network error; the journal persisted by the caller after each request; an interrupted request refused but not costed; no attempt cap across a run.
- **New evidence.** Tests TL-11 to TL-25 and the enabling rehearsal (`out/LIVE_MACHINERY_TESTS.json`, `out/ENABLE_REHEARSAL.json`).
- **Corrected status.** Defects of a design that was never enabled. Repaired in the bound copy only (B5 to B10, R1 to R6); the frozen sender is unchanged.
- **Explanation.** No request was ever sent, so no result or spend was affected.

## C-08. Conflicts between the two existing live plans

- **Old finding.** The study's request plan (thinking disabled, `max_tokens` 4,096, preflight on S-001, S-003, S-008) and the 0.3.4 preflight proposal (thinking not sent, `max_tokens` 4,000, third preflight request S-004 with injection IN-01) disagreed; the frozen sender's defaults matched neither on `max_tokens` (8,192).
- **New evidence.** Both documents and the sender, read side by side.
- **Corrected status.** One protocol: thinking disabled, `max_tokens` 4,096, preflight on S-001, S-003, S-008, injections measured in the TGT phase (amendments AM-2 to AM-4 in `protocol/LIVE_STUDY_PROTOCOL.md`). Thinking remains an owner judgment call (J2).

## C-09. Input size of a preflight request

- **Old finding.** 0.3.4 preflight proposal: "about 1,200 tokens (prompt about 900, record up to 300)".
- **New evidence.** The frozen PRE bodies measure up to 3,973 bytes; at the documented 2.5 characters per token the typical input is about 1,590 tokens (`protocol/LIVE_RUN_PLAN.md`).
- **Corrected status.** Typical input about 1,600 tokens per request; the upper estimate is the byte count. Costs remain small (the plan's typical estimate for PRE is about $0.0014).

## C-10. A rehearsal output committed as a live result

- **Old finding.** Commit `3f118f76` included `results/LIVE_RESULTS.json`, labelled "live captures", which shows request PRE-01 as sent and failed with a network error after three attempts, at a worst-case cost of $0.0073359. The package manifest sealed it. The README says that file appears only after an authorized live run, and the reports say no request was sent.
- **New evidence.** The file was written at 07:16:58 UTC on 2026-10-28 by an early run of `tools/live/rehearse-enable.mjs`, in which a frozen import replaced the mock fetch with its network guard (the ER-01 failure, fixed by R1 and R2). The rehearsal's requests were therefore stopped inside the process and left no capture. Step ER-02 then scored the run as real to confirm that the scorer refuses mock captures; with no capture there was nothing to refuse, and the scorer wrote to `results/`, which in the rehearsal's mirror was a link to the repository folder. Repeating that path on the unfixed mirror (rehearsal ER-09, with a fetch that always fails) wrote a byte-identical file (SHA-256 `ccb8e5b8…`). The rehearsal's only credential was the test sentinel, and `JRS_STUDY_ANTHROPIC_KEY` was absent from this session throughout.
- **Corrected status.** Not a live result: no request reached the provider and nothing was spent. The statements that no request was sent stand. The file is removed from `results/`; its bytes remain in commit `3f118f76` (SHA-256 `ccb8e5b80433962d9360ad822d3e5637fffb5c93ea10aaac83b964a0f00b9419`).
- **Explanation.** The mirror now creates `results/` as a fresh folder, as it already did for `out/`. Rehearsal ER-09 repeats the incident and checks that the repository's `results/` is unchanged; on the unfixed mirror it fails. `tools/summarize-verification.mjs` now fails if a live results file exists while dispatch has never been enabled in the branch history; it failed on the committed state. Found by the publication check before the first push.

## C-11. Where the study's API key goes, and when a session sees it

- **Old finding.** `reports/EXECUTION_CHECKPOINT.md`, owner input 4, and later chat replies said to add the key under Network secrets if that section is offered, otherwise as an environment variable, and that only a new session picks it up.
- **New evidence.** The cloud-environment documentation (code.claude.com, "Configure cloud environments", read 2026-10-28) says a network secret is attached by Anthropic's agent proxy to requests after they leave the session's VM, so the key never enters the VM, and that an existing session reads changed environment variables the next time its paused VM is restored. The runner reads the key from the process environment (`tools/live/runner.mjs`, `credentialResolver`), and `api.anthropic.com` is on this session's no-proxy list, so its requests do not pass through the agent proxy.
- **Corrected status.** The key must be added under **Environment variables** as `JRS_STUDY_ANTHROPIC_KEY`. Stored as a network secret, it would be absent from the environment and the run would stop at SR-01 with no request sent. A new session is not required: an existing session in the environment reads the variable after its VM is next restored.
- **Explanation.** A documentation error found while helping the owner configure the key from a phone. No request was affected, and no tool or plan file changes.
