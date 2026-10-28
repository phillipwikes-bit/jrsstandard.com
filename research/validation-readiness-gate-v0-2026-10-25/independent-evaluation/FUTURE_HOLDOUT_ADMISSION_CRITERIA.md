# Future Holdout Admission Criteria (draft)

**Gate V0, 2026-10-25. Draft. No holdout exists.** The V0 corpus is not a holdout and is not independent. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

A protected holdout must meet all of these:

1. **Independence.** Constructed by the corpus-constructor role, never by a builder, and never seen by a builder before the frozen run.
2. **Admission.** Every record passed `DATA_AND_RIGHTS_ADMISSION_GATE.md`.
3. **Pre-registration.** Size, composition and the sample-size rationale were written and deposited before construction (`MEASUREMENT_PLAN.md`).
4. **Composition.** It includes benign records, records with visible gaps, conflicts, scope triggers and adversarial records, in proportions fixed in advance. Composition is not tuned to Engine behaviour.
5. **Custody.** Held by the custodian, hashed on admission, with access logged. It is released to the run once.
6. **Labels.** Adjudicated blind by at least two independent adjudicators; locked and hashed before any Engine output exists.
7. **Single use.** It is used for one frozen evaluation. Afterwards it is engineering material and cannot serve as a holdout again.
8. **Exclusions.** No V0, Phase 6 to 9 or Stage A material; no material from the three controlling source files.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
