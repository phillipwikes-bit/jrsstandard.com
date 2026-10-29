# Continuation assessment: run RUN-LIVE-AUTH-20261028-01 after SR-10

Dated 2026-10-28. PROPOSAL for the owner's decision; nothing here is applied. Live dispatch stays off; SR-10 is not overridden; no provider request has been sent since the run stopped. 0.3.1 remains the engine of record; B-018 OPEN; NO_GO_NOT_VERIFIED.

Evidence: `reports/FAILURE_DIAGNOSIS_2026-10-28.md`, `reports/LIVE_RESULTS_CORRECTION_2026-10-28.md`, `out/SYNTHETIC_REPRO.json`.

## Conclusion

Continuing needs a **technical correction**, not only a documented plan amendment.

1. **INFERENCE.** If the run resumes with the frozen prompt and validator, the failure rate is likely to stay near the observed rate: 16 of 66 full-run responses (24%) failed on identifier length alone. SR-10 fires above 25% once 10 failures exist, so it would likely fire again. Resuming with only a raised SR-10 threshold would discard about a quarter of responses. The discards are not random: 13 of 40 records with an AI-proposed GROUNDED reference failed, against 4 of 26 with UNGROUNDED. That would bias every descriptive result.
2. **FACT.** The cause is a mismatch inside the frozen candidate. The prompt (Q2) asks for an identifier that is "short and unique". The validator accepts at most 24 characters from `[A-Za-z0-9_-]`. The prompt never states that limit. Fixing it changes the prompt or the validator, both of which are frozen and bound to the signed plan and authorization (prompt SHA-256 `94429a14...`, candidate manifest `b454d4b8...`).
3. **FACT.** The scorer defect D2 (fenced responses counted as 0 quotations) is in `tools/live/score-live.mjs`, a plan-bound file. It does not change E1, but it would corrupt the TGT stated-irrelevant-basis measure. It must be fixed before any TGT capture is scored.

## Options (PROPOSAL; owner decides)

| Option | What changes | New freeze, plan and authorization | Comment |
|---|---|---|---|
| A. Prompt states the rule | Prompt Q2 adds: at most 24 characters, letters, digits, hyphen and underscore only. Validator unchanged | Yes: new prompt version, new plan hash, new authorization | Keeps the strict validator. Smallest change to evidence handling. Recommended |
| B. Validator allows longer identifiers | Validator limit raised (for example to 64) | Yes: new candidate version | Identifiers carry no evidence (synthetic case R3), but this changes a frozen security control |
| C. Plan amendment only | SR-10 threshold or override | Authorization amendment | Not recommended: likely 25% discards, skewed toward GROUNDED references (point 1) |

Every option is a new study arm. The 69 captures of this run stay as recorded, and their classification does not change. A rerun under options A or B would be a separate run, reported beside this one. The C2 failure (an unlisted condition identifier) is model noncompliance with an explicit instruction. It stays a contract failure under every option.

## Independent of the live run

Human agreement is unmeasured: no human label exists. The 44 Part 1 records await the owner's blinded review (four batches of 11, `human-review/batches/`). That work needs no provider request and no decision on the options above.
