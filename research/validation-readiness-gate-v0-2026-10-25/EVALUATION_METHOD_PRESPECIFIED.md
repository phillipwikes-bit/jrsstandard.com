# Evaluation Method (pre-specified)

**Written 2026-10-25 after the corpus seal (2026-10-25T08:45:46.600Z) and before any Engine run.** It may not be changed after the first run. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. System under test

- Engine: frozen `0.3.1-candidate`, loaded only from an isolated temporary copy verified against `phase7-candidate.sha256` (package `815c5d56...25c3`) and the prompt hash `0ceda888...eec2`. The copy is re-verified after use, then deleted.
- Adapter: `tools/harness/`, byte-identical copies of adapter 0.2.0 (`aa2b9779...1fb6`), the isolate, the mock transport, the network guard and the live boundary. The dispatch lock is engaged.
- Transport: mock only. The model identifier is `MOCK-MODEL-NOT-A-PROVIDER`.

## 2. What is counted, per case

| Check | Kind |
|---|---|
| VC-02 Layer 1 facts present and declared synthetic | Set-up |
| VC-03 Expectation is the sealed version | Set-up |
| VC-04 Provenance pair, recomputed independently; VC-04b adapter pair check | Mechanical |
| VC-05 Model identity in record and captured envelope | Mechanical |
| VC-06 Identity and provenance labels (graph `local_mocked`, 0 provider and network calls); no graph after a rejection | Mechanical |
| VC-07 Quotation offsets equal record text, UTF-16 and UTF-8 | Mechanical |
| VC-08 Evidence-to-assertion linkage | Mechanical |
| VC-09 Ambiguous quotations never selected | Mechanical |
| VC-10 Status monotonicity (keep or lower, never raise; sufficiency never supported) | Mechanical |
| VC-11 Human-review routing of every finding, conflict and refusal | Mechanical |
| VC-12 Chronology conflicts lower chronology | Mechanical |
| VC-13 Graph validity under the frozen validator | Mechanical |
| VC-14 Agreement with the sealed owner-authored expectation (adapter outcome, intake, five statuses, conflict kinds, refusal codes, quotation statuses, instruction risk, required span origins) | Owner-authored expectation |
| VC-15 Execution errors counted as failures | Mechanical |
| Metamorphic relation: observed behaviour equals the source case's | Mechanical relation |
| Network attempts (must be 0); forbidden environment and network markers (must be none) | Run-level |

## 3. Determinism criterion (fixed before the first run)

The corpus is run twice, from clean output directories, in separate processes. For every case the following must be identical:

- adapter outcome;
- the normalized graph digest (canonical JSON with `identity.run_id`, `identity.run_timestamp`, `identity.graph_sha256` and the `run_identity` node's id and timestamp set to null);
- the observed behaviour summary;
- the case digest built from those three items.

Raw graph bytes, execution records, binding digests and the Engine's own `identity.graph_sha256` are expected to differ between runs. The adapter supplies the capture time as the compiler clock, and the Engine's `graph_sha256` is computed over the `run_identity` node, which carries that time. Each raw difference is recorded. The comparison also checks mechanically that the raw differences disappear under the normalization above. Any other difference is a determinism failure.

## 4. Rules

- Every mismatch with an expectation is recorded as a failure, with its detail. Expectations, the corpus and the Engine are not changed after the first run.
- A failure is not repaired in this package. A genuine Engine defect goes to owner decision V0-02.
- Agreement with owner-authored expectations is conformance to a specification written by the same side. It is not accuracy.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
