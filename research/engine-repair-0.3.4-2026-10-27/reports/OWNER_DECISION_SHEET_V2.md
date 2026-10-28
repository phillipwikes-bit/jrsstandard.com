# Owner Decision Sheet 2.0 (0.3.4 repair)

**For Phillip Wikes. 2026-10-28.** Nothing below has been decided, and no approval is recorded anywhere in this package. B-018 OPEN. `NO_GO_NOT_VERIFIED` in effect. The study's sheet (`research/study-156-2026-10-27/reports/OWNER_DECISION_SHEET.md`) stays as written; its Decision 1 was recorded there, and its Decision 9 (build a repair candidate) is what this package did. Decisions are ordered smallest first.

## Decision 1 (smallest, and urgent): preserve this package

| Fact | Evidence |
|---|---|
| The package exists only in this session's container and is committed locally on `claude/engine-repair-0.3.4-local`; it has not been pushed | `git log`, `git status` |
| The repository is public: a push to any branch publishes the package | GitHub repository metadata |
| `research/` is excluded from deployment | `.vercelignore` |
| No credential, capture or personal data is in the package | Diff inspected before the commit (`reports/OFFLINE_EVALUATION_REPORT.md` section 7) |
| It repeats material already published with the study: synthetic records, variant texts, the AI-proposed labels and the blind key (`registers/LABEL_STATUS_REGISTER.json`) | The study package, pushed on your approval on 2026-10-27 |

| Option | Effect |
|---|---|
| A. Push to the development branch (not `main`) | Preserved; public on GitHub; not deployed |
| B. Keep it private: I send you an archive | Preserved outside git; you hold the only copy |
| C. Neither | Lost when the container is reclaimed |

**Recommendation: A**, as for the study package. Choose B if you consider the repaired rules or the test suites sensitive.

## Decision 2: the proposed criteria S156-AC-2.0

- **What:** `protocol/ACCEPTANCE_CRITERIA_V2_PROPOSED.json` (37 criteria) and the review that produced them, `protocol/CRITERIA_REVIEW.md`.
- **Development values:** 23 mechanical criteria met; 12 apply to fresh material only and are not evaluable; AC-37 not met (no fresh records exist). Two development values would miss their thresholds: AC-15 (false alarm 16.1% against 10%) and AC-17 (83.3% against 90%).
- **Options:** approve / amend / reject. Approval changes no result; it fixes the criteria before fresh material exists, which is the point.

## Decision 3 (new): may the Engine support a basis that the record merely states?

- **The finding:** when a record itself says the decision "rests on" an irrelevant item, the rules count the stated link, and an over-claiming candidate gets a clean result (64 of 126 over-claiming cases in the adversarial pool). Lexical rules cannot judge relevance.
- **Options:**
  - a. accept it as a recorded limit of a research instrument (every finding is already routed to human review; a clean result is never a determination);
  - b. commission a 0.3.5 in which no basis condition is ever "supported" on lexical linkage alone. A clean result would then be unreachable, so E1 could only flag or abstain;
  - c. add a semantic relevance check (needs a model, so a live authorization, and its own evaluation).
- **Recommendation:** a for now, with the limitation stated wherever results are shown; reconsider b or c only with fresh records to measure the effect.

## Decision 4 (new): is the rise in false alarms acceptable?

- **The finding:** clean records whose evidence is stated but not linked in words are now flagged: 10 of 62 under the rule-aligned arm (0.3.3: 2), and Q1 fails on two records whose authority conditions are met in words, not measurements.
- **Options:** accept for a research instrument / ask for a different balance in a later candidate. Either way, the balance can only be judged on records the rule author has not seen.
- **Recommendation:** accept for now; decide again on fresh records.

## Decision 5: your blinded reference review

- **What:** `forms/HUMAN_REFERENCE_FORM_V2.md` (or `.csv`), 124 records; Part 1 (44 development records) first.
- **How:** save the completed copy under a new folder `reviews/` with its date. Your labels become **human-reviewed**; where they differ from the AI-proposed label, both are kept as **disputed** until you, or a person you name, settles them (**adjudicated**). Nothing has been filled in on your behalf.

## Decision 6: who writes the fresh evaluation records

- **What:** `protocol/FRESH_RECORD_AUTHORING_SPEC.md` and `protocol/PROTECTED_EVALUATION_PROCEDURE.md`: at least 60 records in at least 6 new families, at least 20 instruction texts and 10 benign passages, labelled by the author, sealed before 0.3.4 sees them, handed over privately (not through this public repository).
- **Needs from you:** the choice of a person who is not the rule author and has not read the rules or results. No one has been contacted.

## Decision 7: the live preflight

- **What:** `protocol/LIVE_PREFLIGHT_PROPOSAL.md` and the unsigned `authorization/LIVE_PREFLIGHT_AUTHORIZATION_DRAFT.json`: 3 requests, at most 9 attempts; worst case $0.019 (Haiku 5.5) or $0.76 (Opus 5.5). Refused as written.
- **To proceed you would:** choose the model; set the spend cap; name the credential variable (the credential itself goes into approved session secrets, never into a conversation); confirm provider-side retention; authorize the transport to be rebound to the 0.3.4 prompt (it is disabled and unchanged in this package); decide DEC-T1 (hand-built sender against the official SDK); and run it in a separate session.
- **What it would show:** provider compatibility only. Not Engine quality.
- **Recommendation:** optional. It does not unblock anything else, and its result would not change any decision above.

## Decision 8: adoption

- **Recommendation:** adopt none of 0.3.2, 0.3.3 or 0.3.4. Keep 0.3.1 as the engine of record.

## Decisions carried over from the study, unchanged

- **SC-1** (research use of the 20 excluded or ambiguous originals): recommendation unchanged, keep them excluded. They were run here only to confirm refusal.
- **The 32 public cases:** recommendation unchanged, defer.
- **Reviewer-benefit sessions:** defer until fresh records exist; any session you run alone would be a case study.
- **B-018:** remains OPEN. This package does not clear it and cannot.
