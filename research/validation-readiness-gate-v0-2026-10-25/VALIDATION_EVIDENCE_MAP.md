# Validation Evidence Map

**2026-10-25. Local engineering material only.** Local synthetic evidence cannot establish model reliability, real-world accuracy, independent validation or production readiness. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

Provenance classes: `offline_engineering_synthetic` (local code tested on synthetic material); `owner_authored_expectation` (behaviour checked against expectations the owner's side wrote); `no_evidence`.

Suitability: **S** suitable, **P** partial support only, **N** not suitable. Columns: offline engineering evidence / owner-led feasibility evidence / independent validation / production qualification.

| Claim area | Category | Provenance | OE | OF | IV | PQ |
|---|---|---|---|---|---|---|
| deterministic compiler behavior | Determinism | offline_engineering_synthetic | S | P | N | N |
| quote and provenance pairing | Evidence integrity | offline_engineering_synthetic | S | S | P | N |
| chronology handling | Condition logic | owner_authored_expectation | S | P | N | N |
| contradiction handling | Condition logic | owner_authored_expectation | S | P | N | N |
| scope refusal behavior | Boundary | owner_authored_expectation | S | P | N | N |
| human review routing | Boundary | offline_engineering_synthetic | S | S | P | N |
| mapping integrity | Adapter | offline_engineering_synthetic | S | P | N | N |
| transport boundary controls | Adapter | offline_engineering_synthetic | S | P | N | N |
| cognitive controls | Review layer | offline_engineering_synthetic | S | P | N | N |
| mutation resistance | Test strength | offline_engineering_synthetic | S | P | N | N |
| reproducibility | Determinism | offline_engineering_synthetic | S | P | N | N |
| model behavior | Model | no_evidence | N | N | N | N |
| diagnostic accuracy | Accuracy | no_evidence | N | N | N | N |
| false reassurance | Accuracy | owner_authored_expectation | P | P | N | N |
| independent evaluation | Process | no_evidence | N | N | N | N |
| operator controls | Operations | owner_authored_expectation | P | P | N | N |
| release readiness | Release | no_evidence | N | N | N | N |

No claim area is suitable for independent validation or production qualification on present evidence.

## Detail

### Deterministic compiler behavior

- **Evidence available:** Phase 6 and 7 determinism and stability records; this package's two clean-run comparison over 60 new cases.
- **Evidence quality:** Local, repeatable, hash-compared.
- **Provenance class:** offline_engineering_synthetic
- **Known limitations:** Same machine class and runtime only; identical inputs only; no cross-platform or cross-runtime run.
- **Missing evidence:** Cross-environment reproducibility; characterization under a live model, where inputs vary.
- **Required decision authority:** Engineering owner

### Quote and provenance pairing

- **Evidence available:** Quote resolution in the frozen compiler (offsets computed locally); nine-field binding and pair check in adapter 0.2.0; mapping MT-28 to MT-32; this package's pairing probes.
- **Evidence quality:** Directly tested with mutations.
- **Provenance class:** offline_engineering_synthetic
- **Known limitations:** Pairing proves byte integrity of stored artifacts, not that a quotation is relevant or correct.
- **Missing evidence:** Pairing under live capture; custody across real storage.
- **Required decision authority:** Engineering owner

### Chronology handling

- **Evidence available:** RPK-CHR rule packs (Phase 7); dated-event extraction; this corpus's chronology-conflict cases.
- **Evidence quality:** Lexical rules over explicit ISO dates; owner-authored cases.
- **Provenance class:** owner_authored_expectation
- **Known limitations:** Only explicit YYYY-MM-DD dates and fixed role words; undated or narrative chronology is not inferred.
- **Missing evidence:** Real-record chronology variety; independent adjudication of what counts as a conflict.
- **Required decision authority:** Owner; future independent adjudicator

### Contradiction handling

- **Evidence available:** K1 to K6 conflict detectors and RP-CON-01; this corpus's conflicting-source cases.
- **Evidence quality:** Bounded lexical detectors; owner-authored cases.
- **Provenance class:** owner_authored_expectation
- **Known limitations:** Paraphrased contradictions outside the listed nouns and phrases are not detected; the Engine never resolves a conflict.
- **Missing evidence:** Recall on paraphrased real contradictions; independent labelling.
- **Required decision authority:** Owner; future independent adjudicator

### Scope refusal behavior

- **Evidence available:** Intake gate (excluded-domain lexicons, RP-SCO-01), size, scope and version checks; this corpus's scope-boundary cases.
- **Evidence quality:** Lexical; tested on owner-authored triggers.
- **Provenance class:** owner_authored_expectation
- **Known limitations:** Reworded or novel excluded-domain language may pass; over-refusal on benign homonyms is possible.
- **Missing evidence:** Measured false-acceptance and over-refusal on independent material.
- **Required decision authority:** Owner; counsel where a real-data scope question arises

### Human review routing

- **Evidence available:** Every graph carries the fixed documentation_quality_reviewer route; findings, conflicts and refusals carry ROUTES_TO_REVIEW edges.
- **Evidence quality:** Structural and always on; directly checked.
- **Provenance class:** offline_engineering_synthetic
- **Known limitations:** Routing is unconditional by design, so it shows a route exists, not that a reviewer acts.
- **Missing evidence:** Evidence that human reviewers act on the route; operator records.
- **Required decision authority:** Owner

### Mapping integrity

- **Evidence available:** Anthropic mapping 0.1.0-offline: 33 tests, 12 mutations, all with synthetic captures.
- **Evidence quality:** Offline only; the response shape is assumed from documentation, never observed live.
- **Provenance class:** offline_engineering_synthetic
- **Known limitations:** Never exercised on a real provider response.
- **Missing evidence:** A controlled live capture under a valid authorization.
- **Required decision authority:** Owner under a new restart authorization

### Transport boundary controls

- **Evidence available:** Live-transport boundary with dispatch lock (LT tests, B mutations); network guard in every harness.
- **Evidence quality:** Directly tested offline; the lock has never been released.
- **Provenance class:** offline_engineering_synthetic
- **Known limitations:** The live path has never run, so its behaviour under real transport is untested.
- **Missing evidence:** A supervised live run; incident and stop-procedure evidence.
- **Required decision authority:** Owner under a new restart authorization

### Cognitive controls

- **Evidence available:** Cognitive-controls validator and graph defect templates; their test and mutation results.
- **Evidence quality:** Offline, synthetic.
- **Provenance class:** offline_engineering_synthetic
- **Known limitations:** Neutrality is checked lexically; no reviewer has used the controls.
- **Missing evidence:** Use by independent reviewers; effect on review quality.
- **Required decision authority:** Owner; future independent evaluator

### Mutation resistance

- **Evidence available:** Phase 6 to 9 mutation records; adapter, mapping, boundary and cognitive-control mutations; 30 or more new mutations in this package.
- **Evidence quality:** Each mutation has a named direct probe.
- **Provenance class:** offline_engineering_synthetic
- **Known limitations:** Mutations show that the probes detect the faults they target; they do not show the absence of other faults.
- **Missing evidence:** Independent review of mutation coverage.
- **Required decision authority:** Engineering owner

### Reproducibility

- **Evidence available:** Graph hashes exclude run id and timestamp; identity records compiler, package and prompt hashes.
- **Evidence quality:** Characterized offline only.
- **Provenance class:** offline_engineering_synthetic
- **Known limitations:** Live-model output variability is uncharacterized (CLAUDE.md section 21).
- **Missing evidence:** Repeated live runs and an empirical variability study.
- **Required decision authority:** Owner; future independent evaluator

### Model behavior

- **Evidence available:** None. No live model response has ever been processed by this Engine path.
- **Evidence quality:** None.
- **Provenance class:** no_evidence
- **Known limitations:** Mocked responses are authored to test the compiler, not to represent any model.
- **Missing evidence:** The Stage A feasibility pilot (stopped) and any later controlled study.
- **Required decision authority:** Owner under a new restart authorization

### Diagnostic accuracy

- **Evidence available:** None. Owner-authored expectations are not ground truth.
- **Evidence quality:** None.
- **Provenance class:** no_evidence
- **Known limitations:** Agreement with owner-authored expectations measures conformance to the owner's specification, not accuracy.
- **Missing evidence:** Independent adjudicated reference labels; pre-specified accuracy measures; adequate sample.
- **Required decision authority:** Independent evaluator; owner

### False reassurance

- **Evidence available:** This corpus's false-reassurance trap cases test that mechanically unsupported support is lowered.
- **Evidence quality:** Mechanical, owner-authored.
- **Provenance class:** owner_authored_expectation
- **Known limitations:** Covers only the trap forms authored here; a missed real gap would not be detected by this method.
- **Missing evidence:** Independent measurement of the false-reassurance rate on independent material.
- **Required decision authority:** Independent evaluator

### Independent evaluation

- **Evidence available:** None conducted. Phase 8 evaluation-handoff freeze and this package's handoff drafts describe what would be needed.
- **Evidence quality:** Planning documents only.
- **Provenance class:** no_evidence
- **Known limitations:** No evaluator, no independent corpus, no adjudication exists.
- **Missing evidence:** All conditions in INDEPENDENT_EVALUATION_PROTOCOL_DRAFT.md.
- **Required decision authority:** Owner; independent evaluator; counsel where applicable

### Operator controls

- **Evidence available:** Stage A authorization, readiness checklist and stop records; dispatch lock; retention terms.
- **Evidence quality:** Documented, not exercised; the only exercise was a stop.
- **Provenance class:** owner_authored_expectation
- **Known limitations:** Access, logging, recovery and incident procedures have not been demonstrated in operation.
- **Missing evidence:** A demonstrated operating record: access, retention, recovery, logging and stop drills.
- **Required decision authority:** Owner

### Release readiness

- **Evidence available:** None. NO_GO_NOT_VERIFIED in effect; B-018 OPEN.
- **Evidence quality:** None.
- **Provenance class:** no_evidence
- **Known limitations:** No release criterion is met.
- **Missing evidence:** Every item above, plus a separate release decision.
- **Required decision authority:** Owner (separate release decision)

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
