# Decision Spellchecker (DS-N1): feature coverage

Date: 18 November 2026. Every row names the code and the test that exercise it. "Built" means implemented in DS-N1 and covered by an automated test on constructed fictional records. It does **not** mean validated, accepted against the original specification, or production ready.

**Original specification acceptance.** The October 2026 programme's SP-01 to SP-18 checks remain **0 of 18 accepted**. Acceptance is gated on authenticated original DS-A source and exact clause evidence (`tests/incomeos-ds-original-verification.mjs`), which has not been recovered. The DS-N1 equivalents below are new work and carry none of DS-A's history or validation.

## 1. The 18 programme components: DS-N1 equivalents

| ID | Component | DS-N1 equivalent | Status |
|---|---|---|---|
| SP-01 | Justification Underline | Claims marked in the record; each finding carries `record_span` (`ui/app.mjs`, `assess.mjs`) | Built (`ui.browser.mjs`) |
| SP-02 | Reasoning Suggestions | One question per finding, wording observations, 14 lenses (`cognitive-controls.mjs`, `cognitive-observations.mjs`, `cognitive-safeguards.mjs`) | Built |
| SP-03 | Evidence Lookup | Source passage, version and digest per claim (`cognitive-source-trace.mjs`) | Built (`cognitive-source-trace.test.mjs`) |
| SP-04 | Claim-to-Evidence Match | Support, contradiction, irrelevance, missing source, wrong subject, date and event checks (`assess.mjs`) | Built (`ds-n1.test.mjs`, partner and prospect tests) |
| SP-05 | Guided Correction | Revise or qualify, attach citation, add reasoning, request evidence, escalate, leave pending (`session.mjs`) | Built |
| SP-06 | Reasoned Override | Own rationale of 20+ characters; critical overrides must be acknowledged at acceptance (`session.mjs`) | Built |
| SP-07 | Cognitive Controls Panel | Reviewer panel with questions, wording checks, CC-* safeguards and advisory notes (`ui/app.mjs`) | Built (`ui.browser.mjs`) |
| SP-08 | Justification Change History | Every revision kept; superseded findings retained; hash-chained event log (`session.mjs`) | Built |
| SP-09 | Decision Record Report Card | Report part 5 groups findings under five of the tool's own groups (`report.mjs`, renamed 2026-11-19 so no external standard's condition names are used) | Built |
| SP-10 | Pre-finalization Hold | HOLD status; acceptance refused unless READY (`session.mjs`) | Built |
| SP-11 | Source and Record Inventory | Report part 2: source, title, version, SHA-256, citing claims (`report.mjs`). No document extraction step exists | Built, extraction not applicable |
| SP-12 | Reconstruction Trail | Claim, citation, finding, question, action and disposition linked through the log, report and export (`session.mjs`, `report.mjs`, `verify.mjs`) | Built (`incomeos-ds-evidence-export.mjs`) |
| SP-13 | Learning and Calibration Notes | Condition-grounded learning notes; no learning from records (`reflective-guidance.mjs`) | Built (`reflective-guidance.test.mjs`) |
| SP-14 | Restrain, Reframe, Recalibrate, Release | Optional reflection stages per prompt (`reflective-guidance.mjs`) | Built (`ui.browser.mjs`) |
| SP-15 | Evidence-Pack Export | JSON export with internal consistency check; PDF export optional (`report.mjs`, `export-pdf.mjs`, `verify.mjs`) | Built; log unsigned |
| SP-16 | Guided and Professional Modes | Mode switch; same findings in both (`ui/reviewer.html`, `ui/app.mjs`) | Built (`ui.browser.mjs`) |
| SP-17 | Mobile Review | Emulated iPhone layout, overflow and flow checks | Built in emulation only; no real-device test |
| SP-18 | Reviewer Feedback and Calibration | `finding_feedback` (useful, not useful, wrong, with reason); never changes the review (`session.mjs`) | Built; workload capture not built |

## 2. Cognitive lenses (`cognitive-safeguards.mjs`)

Fourteen lenses: observation versus inference; alternative explanations; selective evidence (also "confirmation"); premature closure; unsupported certainty (also "certainty calibration"); negation and qualification (also "language fidelity"); chronology and sequence; source relevance (also "evidence relevance"); authority and rule integrity; missing evidence (also "evidence sufficiency"); reasoning continuity (also "reconstruction"); materiality and escalation; causation; automation reliance. Each is raised only by a recorded finding, an observation, or a quoted word, and asks one neutral question. None infers anyone's state of mind. Tests: `cognitive-safeguards.test.mjs`.

## 3. Cognitive safeguards CC-INTENT to CC-ESCALATE (`cognitive-safeguards.mjs`)

| Control | Triggers |
|---|---|
| CC-INTENT | (a) purpose wording ("in order to", "deliberately") not found in the cited source; (b) subject mismatch or event confusion: the finding may concern a different request. The two programme documents define CC-INTENT differently; both are implemented and reported separately (`facet`). |
| CC-PLAUSIBLE | Plausibility wording ("probably", "presumably", "must have") on an unsupported claim |
| CC-NEGATION | Negation conflict, dropped qualification, dropped contrary clause |
| CC-DATES | Date mismatch, date not established, date role unverified |
| CC-WORDS | A hedged source term restated as a firm one ("recommended" as "required"); certainty wording |
| CC-MISSING | Source missing, quote not found, actor not established |
| CC-BASIS | Unsupported claim, untraceable authority, reasoning not traced, relevance not established |
| CC-ESCALATE | Closure stated while critical findings are open; critical warnings overridden. Routes to an authorised reviewer |

Each control lists the existing reviewer actions that fit and never changes status by itself.

## 4. The 37 detection templates (`detection-templates.mjs`)

The 23 named templates of the October 2026 programme, plus three added on 2026-11-19 from a practitioner's blind review of a constructed record (marked †) and five added the same day after a second blind review (marked ‡).

- **11 finding-based:** detected by existing DS-N1 rules, so they affect status: `authority_source_not_identified`, `authority_state_conflict`, `control_state_conflict`, `risk_state_conflict`, `conclusion_without_traceable_basis`, `conclusion_without_basis`, `basis_states_no_reason_or_source`, `decision_date_conflict`, `expiry_date_conflict`, `cited_evidence_conflict`, `absent_quotation`.
- **1 observation-based:** `certainty_language`.
- **25 advisory:** new checks that are reported but do not change status until validated: `no_authority_section`, `no_compensating_control_stated`, `no_locatable_conclusion`, `basis_without_conclusion`, `no_stated_expiry_date`, `no_explicit_dates`, `impossible_sequence`, `assessment_after_decision`, `duration_date_conflict`, `no_dated_decision`, `ambiguous_quotation`, `approver_role_not_stated` †, `conclusory_evidence_summary` †, `no_stop_or_redress_path` †, `no_authority_basis_cited` ‡, `human_oversight_removed` ‡, `amount_limit_without_volume_cap` ‡, `no_post_expiry_terms` ‡, `date_not_in_sources` ‡, `hedged_source_stated_firmly` §, `cited_version_mismatch` ¶, `version_mismatch_between_sources` ¶, `collective_approver_unnamed` ¶, `action_before_authorization` ¶, `broad_access_without_scope` ¶.

§ Added 2026-11-19 with wider result, end-date and limit wording, after the developer's own pre-check of records prepared for practitioner review. Those records' predictions were recorded first and are unchanged, so the reviews still measure the earlier engine. Tested on constructed record AR-63.

¶ Added 2026-11-19 (round four): a cited document version that differs from the one supplied; different system versions across documents (tested versus approved); a committee or board approving with no members, chair or quorum named; activity that started before its authorization; broad supplier access with no stated scope. Tested on constructed records AR-64 and AR-65, positive and negative.

The three † templates were written after the practitioner's review of record AR-52, so AR-52 is not evidence that they work. They are tested on a separate constructed record (AR-61) in positive and negative form. Attribution wording is pending the practitioner's approval.

The ‡ templates, and a broadened word list for `conclusory_evidence_summary`, followed the second review (record AR-73), so AR-73 is not evidence for them either. They are tested on constructed record AR-62. Not addressed: whether a stated limit applies to the order or to the action (needs semantic reading), and `no_stated_expiry_date` treating "thirty days overdue" as an expiry phrase (a known false negative, recorded, not fixed).

Tests: `detection-templates.test.mjs`. Positive and negative cases exist for each advisory template; false-warning rates have not been measured.

## 5. Enterprise requirements

| Requirement | Status |
|---|---|
| Fail-closed handling | Built: out-of-scope, malformed, identifier-bearing and tampered input is refused or set to ERROR, never READY |
| Rule and model versioning | Built: rule, schema, contract and module versions in every output; no model is used |
| Source version control | Built: version and SHA-256 per source in every report |
| Export and continuity | Built: export, verification, resume from export |
| Data-use restrictions | Built for the engine: no network or model calls; fictional records only |
| Defined review authority | Built: only a named human can finalize |
| Quality assurance | Built: automated suites and a reproducibility baseline. Rollback of a released version: not built |
| Accessibility | Partial: labelled sections, keyboard focus and overflow checks; no formal accessibility audit |
| Integration interface | Built as a local library and contract (`INTEGRATION_CONTRACT.md`). No network API, by design |
| Authentication and role-based access | Built as a local reference implementation (`enterprise/workspace.mjs`, `enterprise/server.mjs`): admin, reviewer, approver and auditor roles; hashed access tokens; revocation; only approvers finalise or override. Not hosted; no single sign-on |
| Matter or tenant separation | Built in the reference implementation: organisations and matters; no review, report or log entry crosses an organisation |
| Secure processing of real records | **Not built and not authorized.** Real records are refused |
| Configurable retention and deletion | Built in the reference implementation: retention period per organisation; purge leaves a content-free tombstone in the signed log. State persists to an AES-256-GCM encrypted file (`enterprise/store.mjs`); a wrongly keyed or altered file is refused and the signed log is verified on every load. Start with `enterprise/run.mjs` |
| Independent logging | Partly built: the workspace audit log is hash-chained and every entry is signed with Ed25519; an offline verifier needs only the public key. The per-review event log remains unsigned. Key custody and external log storage are not built |

## 6. Evaluation measures

Tooling exists for developer evaluation, stress and isolation sets, a sealed holdout, blind labelling packets, label scoring and an ablation arm (`tests/ds-n1/`). **Results that would establish value are NOT ESTABLISHED:** material defect detection against a baseline reviewer, false-ready rate, false-warning burden, reviewer usefulness, end-to-end time, and incremental value over ordinary review, the free JRS method or a general AI assistant. These need independent labelled records and human reviewers.

## 7. Competitive position

Not established. Public product descriptions do not show whether competitors already perform equivalent checks, and no comparative test has been run.

## 9. Diligence report (`package/diligence-report.mjs`)

Generates a buyer and licensee report from live runs: what the engine is, template and safeguard counts, developer-record results (labelled as not independent), practitioner evidence where supplied, enterprise self-checks, stated limitations and what is not established. Tested to contain no accuracy, compliance or marketing claims.

## 8. Practitioner trial kit (`practitioner-trial.mjs`)

Records DS-N1's output on a constructed record before an independent practitioner sees it, then scores the practitioner's coded points against it: MATCH, PARTIAL or MISS per issue category, the categories only DS-N1 reported, and totals with a Wilson interval. Protocol: `tests/ds-n1/practitioner/PROTOCOL.md`. `build-review-packet.mjs` produces what the practitioner receives (printable page and plain text) with no DS-N1 output. Records and answers are kept out of this repository. Results so far: NOT ESTABLISHED as an accuracy measure; two single-practitioner reviews exist, both on records the developer constructed.

## 10. Document extraction (`extract.mjs`, added 2026-11-24)

Plain-text decision records and source documents become a record package without hand-building claims or citations. Deterministic and offline, like the engine. Every claim quote is exact record text and every citation is an exact source passage; citations chosen by similarity are marked "inferred" in an extraction report, which lists every field a reviewer should confirm. A document named in a claim (by identifier or title) is the only one searched.

Measured on 26 developer fixtures given only their plain text (`tests/ds-n1/eval-extract.mjs`, results in `tests/ds-n1/EXTRACT_EVAL.json`): 127 of 128 hand-identified claims found; event dates 59 of 63; citation source 94 of 100; same review outcome 19 of 26, with every difference explained and none turning a sound record to HOLD. Developer fixtures only, so this shows the extractor works on the tool's own test material, not that it works on real-world documents. Tests: `tests/ds-n1/extract.test.mjs` (12), `tests/ds-n1/demo.test.mjs` (1). Demo: `lib/ds-n1/demo/`.

Word (.docx) input added 24 November 2026 (`docx.mjs`, no third-party packages; body text only; tested on files from LibreOffice, pandoc and python-docx). Compound sentences added 24 November 2026: two complete statements joined by "; " or ", and " become two claims, each checked against its own passage, unless one source sentence supports both (four tests on new records; the 26-record evaluation is unchanged). Not yet done: PDF input; other compound forms ("and" without a comma, "but"); checking what a record leaves out of its sources.
