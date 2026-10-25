# Failure and Uncertainty Register

**Gate V0, 2026-10-25.** Each item is recorded, not explained away. Labels follow CLAUDE.md Rule 2: FACT, INFERENCE, UNVERIFIED, NOT ESTABLISHED, REQUIRES HUMAN REVIEW. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Failures

| ID | Item | Status |
|---|---|---|
| F-00 | Mechanical check failures, execution errors, expectation differences, determinism failures, network attempts | **None recorded.** FACT: run 1 and run 2 each report 0 mechanical failures, 0 errors, 60 of 60 expectation matches, 0 network attempts; all 60 cases are identical under the pre-specified criterion. |
| F-01 | Mutation survivors (Phase 4) | **None.** FACT: 50 of 50 mutations were applied and each was detected by its named direct probe; 60 of 60 probes pass on the unmutated controls; 0 load errors; 0 network attempts (`MUTATION_RESULTS.json`). |

The absence of recorded failures is a statement about this corpus, this build and these checks. It is not evidence that no defect exists (see U-01 and U-09).

## 2. Uncertainties and limitations

| ID | Item | Classification | Authority |
|---|---|---|---|
| U-01 | The corpus, the Layer 1 facts and the expectations were all written by the same side (Claude Code under owner direction), from a reading of the frozen rules. Agreement of 60 of 60 shows conformance to that reading, not that the behaviour is correct or useful. | FACT (method); INFERENCE (meaning) | Owner; future independent evaluator |
| U-02 | EV-08: identifiable basis is **supported** with no basis section, because an identified authority alone satisfies the rule. | Unresolved semantic question. REQUIRES HUMAN REVIEW | Future independent adjudicator |
| U-03 | EV-23: reconstructability is **supported** although the basis only restates the conclusion. The rule checks structure (a decision and a cited basis section), not content. A possible false-reassurance path. | Unresolved semantic question. REQUIRES HUMAN REVIEW | Future independent adjudicator; owner (V0-02 if judged a defect) |
| U-04 | EV-32: two stated_date quotations with different dates (a request and an expiry date) produce a cited_evidence_conflict on an internally consistent record, and chronology is lowered. Likely over-flagging. | INFERENCE: candidate Engine defect (detector K6 keys on assertion type, not event role). REQUIRES HUMAN REVIEW | Owner decision V0-02 |
| U-05 | EV-33: certainty language ("No risk", "fully secure") is surfaced as a cognitive control but lowers no status. | Design question. REQUIRES HUMAN REVIEW | Owner |
| U-06 | EV-38: "tenant parking" for a depot is refused as housing content. Possible over-refusal from a lexical gate. | INFERENCE. REQUIRES HUMAN REVIEW | Owner; counsel only if real-data scope is ever considered |
| U-07 | The Engine's `identity.graph_sha256` is computed over the `run_identity` node, which carries the run timestamp, so it is not a timestamp-independent content hash. Raw graph bytes differ between runs; only the normalized digest is stable. | FACT (observed in both runs). Reproducibility limitation (CLAUDE.md section 21) | Owner (V0-02 scope question) |
| U-08 | Finding B0-F1: Phase 8 sub-version manifests 8.1, 8.2 and 8.2c do not verify against current files (61 differing entries). 15 files, all regenerated run records, are not covered by any current manifest, and it is NOT ESTABLISHED whether earlier copies were preserved. | FACT; NOT ESTABLISHED (preservation). REQUIRES HUMAN REVIEW | Owner (Rule 10) |
| U-09 | Coverage is of rule paths, not real-world variety: one record type (supplier access exception), English only, ISO dates only, lexical detectors, about 70 to 140 words per record (ADV-10 aside). | FACT | Future corpus construction role |
| U-10 | Candidate responses are mocked and authored to exercise the compiler. They say nothing about any model's behaviour. | FACT | n/a |
| U-11 | One runtime (Node v22 in a Linux container), one machine class. Cross-environment reproducibility is not characterized. | FACT | Future evaluation environment owner |
| U-12 | The isolated copy and the evaluator assume the repository path `/home/user/jrsstandard.com` (inherited unchanged from the frozen isolate). Running elsewhere needs that path or a reviewed change. | FACT | Engineering owner |
| U-13 | Cognitive-control content (detect, reflect, correct, learn) is checked only for neutrality by the frozen validator, and for the presence of certain span origins. It is not compared with expectations. | FACT | Future evaluator |
| U-14 | Adapter rejections stop before the Engine, so the eight malformed-response cases test the adapter, not the compiler. | FACT | n/a |
| U-16 | VC-10 ranks `not_assessed` below `review_required`, so it would flag the Engine's documented change from a proposed `not_assessed` with a quotation to `review_required` as a rank increase. This is a conservative over-flag, not a miss, and it never fired on this corpus. The control was not changed after the runs. Before the first mutation run, two probe inputs were corrected: the altered-manifest fixture had used a malformed line that made the seal reader throw, and the rank probe was moved to a gap-to-supported increase. No evaluated code was changed. | FACT | Engineering owner |
| U-15 | A provider-console record of zero spend for the stopped Stage A pilot does not exist in this package; zero requests and zero spend are repository records only. | FACT | Owner |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
