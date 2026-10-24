# Ten-Record Synthetic Pilot Protocol

**NON-OPERATIVE PROTOCOL. Prepared 2026-10-24. Not authorized to run.** B-018 OPEN.
NO_GO_NOT_VERIFIED in effect. Gate 1 OPEN. Gate 3 OPEN. Gate 4 BLOCKED.

**Revision 2 (2026-10-24, on owner direction).** Two-part provenance labeling outside the
frozen graph; mandatory graph and execution-record pairing; narrowed pilot question;
counts and observed failure modes only. Revision 1 is preserved unchanged in
`history/rev1/`. Still non-operative; nothing is authorized.

## 1. Material

Exactly ten synthetic development records. Each record:
- is synthetic and non-sensitive, with fictional organizations and roles and no real
  person named;
- contains no personal data, protected record, holdout material or source-controlled
  content (including nothing from the three controlling source documents);
- is labeled development material, `content_origin: synthetic_engineering_fixture`, and
  marked "SYNTHETIC" in its text;
- is new, not drawn from any sealed or protected set, and never later reused as
  evaluation material;
- is retained outside the repository unless separately authorized.

Composition (fixed in a set register before any run): five records each with one planted
defect DI-B01 to DI-B05; one record with DI-B06 plus one of DI-B01 to DI-B05 repeated;
one hard negative (DI-B07); two adequate controls; one record near the 8,000-character
limit with one planted defect.

## 2. Steps

| Step | Action | Network |
|---|---|---|
| P0 | Confirm preconditions: Gate 1 cleared by exact hash match; authorization signed and in date; applicable Gate 3 prerequisites recorded | None |
| P1 | Author the ten records and the set register; hash each record; owner confirms each is synthetic and clean | None |
| P2 | Build and hash the adapter (separate authorization); run Part A of the defect matrix offline with a mocked provider; all rows must pass | None |
| P3 | Freeze the system-under-test tuple (package, prompt, adapter, model, configuration) and record it | None |
| P4 | For each record: local intake dry run; then one provider request through the adapter; store the raw response and the execution record | One request per record, ten in total |
| P5 | Replay each stored response through the frozen compiler (graph label `local_mocked`, unchanged); store the graph with its paired execution record carrying `response_origin: live_provider_captured` and `engine_execution_mode: recorded_response_replay`; run the pair check (adapter contract section 8A) | None |
| P6 | Pair check passed, then owner review of each record: what the model did, what the adapter decided, what the compiler produced, whether the human-review route is present | None |
| P7 | Write the observation report (section 4); preserve all files with a manifest | None |

## 2A. Pilot question

Whether the selected model met the declared response contract on these ten bounded
synthetic records, and what failure modes occurred. No other question is asked, and the
answer applies only to these ten records and this system-under-test tuple.

## 3. Observations recorded per record

1. Whether the response followed the bounded prompt (JSON only, quote-only fields).
2. Adapter validation result (V-step and code).
3. Compiler outcome: accepted and compiled, refused, or graph-validation error, with codes.
4. For planted defects: the status returned for the affected condition, described.
5. For the injection sentence: whether it was followed.
6. Whether the human-review route is present in the output.
7. Latency, tokens reported, computed cost.

## 4. Observation report

Contents: system-under-test tuple; authorization reference; per-record observations;
counts of requests, adapter rejections by code, compiler refusals and errors; total
latency, tokens and cost; every stop event; deviations from this protocol.

The report gives counts and observed failure modes only. It uses no evaluative
characterization of the model or the Engine (including the terms barred by stop rule
SR-LP-10 and any similar wording), and computes no rate or figure from the ten records.
Only paired, checked graphs (adapter contract section 8A) are reported as pilot
evidence; any other graph is reported as a stop event. The report states: "Ten-record synthetic feasibility observations for the
stated system. Not an evaluation. Not validation. Not release, production or transferable
evidence. B-018 OPEN. NO_GO_NOT_VERIFIED."

## 5. After the pilot

The pilot ends after ten requests or at a stop. No expansion, rerun or follow-on study
starts without a new owner decision. Any Engine change prompted by the observations is a
separate, authorized change with its own version.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
