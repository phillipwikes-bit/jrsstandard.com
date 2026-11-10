# Decision Spellchecker SP-01 through SP-18: Source-to-candidate reconciliation

**As inspected:** 2026-11-05
**Controlling owner instruction:** IncomeOS Master Directive v2.1
**Source baselines:** Issue 3.6 (30-31 October 2026 operative programme, component inventory pp. 26-29; acceptance inventory); DS-N1 experimental source at PR #119 commit `f8c7a2ad5fa81e7922401b7937530161ec97e61f`; this draft PR #128.
**Scope:** Private engineering, synthetic supplier-access records only. This is not an amended JRS Codebook, a rights clearance, an independent product acceptance, a validation finding, or a production-release record.

## 1. Identity and acceptance controls

- **DS-A:** Original product, versions 0.6.11 / 0.7.0 described historically. Authentic executable source not recovered from previously inspected repository locations. Preserve `AUTHENTIC_SOURCE_NOT_RECOVERED / NO_GO_NOT_VERIFIED`.
- **DS-N1:** New separately identified experimental candidate. Its test evidence is evidence of DS-N1 behavior only. It does not establish historic DS-A equivalence.
- **LAB-R6 / DS-B** and **JRS Review Engine:** Separate asset identities and evidence.
- **All SP-01 through SP-18 original independent acceptance:** `NOT_ACCEPTED`, pending authentic versioned contract, applicable independent primary evidence and owner-specific acceptance. No PR acceptance implied.

The table is a **development gap index**. “Candidate exists” means source is present, not that the original acceptance clause or independent validation has passed.

## 2. Original feature to DS-N1 candidate mapping

| ID | Historical feature | Current DS-N1 implementation locus | Gap or limitation | Original acceptance |
|---|---|---|---|---|
| SP-01 | Justification Underline | `assess.mjs`, `ui/app.mjs` | Similar-word and inaccurate-source-span adverse testing remains scope-sensitive | NOT_ACCEPTED |
| SP-02 | Reasoning Suggestions | `assess.mjs`, `ui/app.mjs` | Rule-bound questions; no demonstrated real-case inference coverage | NOT_ACCEPTED |
| SP-03 | Evidence Lookup | `record.mjs`, `assess.mjs`, `ui/app.mjs` | Supplied-source lookup only; no external source verification | NOT_ACCEPTED |
| SP-04 | Claim-to-Evidence Match | `assess.mjs` | Lexical relevance and limited actor/date/negation logic cannot establish semantic sufficiency | NOT_ACCEPTED |
| SP-05 | Guided Correction | `session.mjs`, `ui/app.mjs` | Reviewer actions exist; original comprehensive adverse acceptance not verified | NOT_ACCEPTED |
| SP-06 | Reasoned Override | `session.mjs`, `ui/app.mjs` | Critical overrides can lead to specially flagged READY; owner disposition of this behavior remains open | NOT_ACCEPTED |
| SP-07 | Cognitive Controls Panel | Draft #128 `cognitive-controls.mjs`, `ui/app.mjs` | Read-only 19-rule mapping and optional panel. Browser test authored but not executed; cognitive workload and original fidelity not independently assessed | NOT_ACCEPTED |
| SP-08 | Justification Change History | `session.mjs`, `report.mjs` | Unsigned hash chain proves internal consistency, not reviewer identity or event authenticity | NOT_ACCEPTED |
| SP-09 | Decision Record Report Card | `report.mjs`, `export-pdf.mjs` | Eight-part report candidate; authentic original correspondence and PDF accessibility unverified | NOT_ACCEPTED |
| SP-10 | Pre-finalization Hold | `session.mjs`, `assess.mjs` | Critical overrides require acknowledgment; false-ready risk persists outside constructed tests | NOT_ACCEPTED |
| SP-11 | Source and Record Inventory | `record.mjs` | Scope-limited input; original hash/parser/offset contract not independently established | NOT_ACCEPTED |
| SP-12 | Reconstruction Trail | `session.mjs`, `report.mjs`, `verify.mjs` | Reproducible reconstruction is not authenticated external provenance | NOT_ACCEPTED |
| SP-13 | Learning or Calibration Note | Draft #128 `reflective-guidance.mjs`, `ui/app.mjs` | Condition-specific optional educational note only; no empirical calibration or accepted original feature | NOT_ACCEPTED |
| SP-14 | Restrain / Reframe / Recalibrate / Release | Draft #128 `reflective-guidance.mjs`, `ui/app.mjs` | Optional descriptive sequence only; no separate status engine or automatic release | NOT_ACCEPTED |
| SP-15 | Evidence-pack Export | `report.mjs`, `export-pdf.mjs`, `verify.mjs` | PDF output, provenance and accessibility require further verification | NOT_ACCEPTED |
| SP-16 | Guided / Professional Modes | `ui/app.mjs`, `ui/reviewer.html` | Same rule engine, but complete input and action parity requires browser verification | NOT_ACCEPTED |
| SP-17 | Mobile Support | `ui/reviewer.html`, `ui.browser.mjs` | Emulated mobile testing only; no physical iPhone Safari / VoiceOver acceptance | NOT_ACCEPTED |
| SP-18 | Reviewer Feedback and Ablation | `session.mjs`, `tests/ds-n1/ablation.mjs` | Bounded feedback does not rewrite frozen labels; original SP-18 equivalence not established | NOT_ACCEPTED |

## 3. This increment: exact provenance

**PR #128 branch:** `chatgpt/ds-n1-sp07-contained-20261105`, based on DS-N1 PR #119 head.

- SP-07: prompt generation is a read-only projection of existing findings. It neither creates findings nor changes state, and does not infer psychological bias or AI authorship.
- SP-13: optional condition-specific explanation is paired with the source-ID context already present on the finding. A cited identifier is not proof of support.
- SP-14: four-stage reflection is presentation guidance. Release directs the reviewer to the existing event-logged action system; it does not change status or grant authorization.
- Existing proprietary source identities and the five JRS review conditions remain unchanged.
- No live record processing, external model calls, financial transactions, public publication, customer outreach, or commercial releases.

**Observed local verification:** Three isolated cognitive, reflective and source-trace Node test files yield 21 passed / 0 failed; syntax checks of the modified local modules and test files passed. This is not a clean checkout or full DS-N1 regression result. The initial trace-test run found 1 failure caused by an inconsistent synthetic quote fixture; the fixture was corrected and the 21-case suite then passed. Do not omit that repair when assessing test provenance.

**Not executed:** Full DS-N1 regression, Playwright browser checks, independent holdout, real iPhone Safari, assistive technology, authentication/security negative paths and release testing.

**Additional source trace:** The candidate projects the inventory entry, version, digest, source span and located excerpt from existing assessed citations. For exact quotes, the candidate checks that the literal quoted text matches the indicated source span and that the source identity agrees. A missing or mismatched version is not shown as a verified quote. Normalised matches still rely on the existing DS-N1 assessment and are not independently reclassified as supporting evidence. A citation being present or a quote matching is not proof of relevance or sufficiency.

**Browser assertions newly authored:** Candidate UI guidance and navigation, preserved status/summary, existing action controls without opening optional guidance, and parity between Guided/Professional modes, exercised by the existing test harness on desktop and iPhone 13 emulation **when that harness is next executed**.

## 4. Next controlled actions

1. Fetch and verify the exact PR #128 head; run `node --test tests/ds-n1/` and existing DS-N1 evaluation commands from a fresh checkout.
2. Run `node tests/ds-n1/ui.browser.mjs` and `node tests/ds-n1/author.browser.mjs`, preserving every failure. Check visible cognitive-panel layout and keyboard behavior at 320, 375 and 430 pixels.
3. Assess whether each of the original SP-07/13/14 positive and adverse conditions in Issue 3.6 is specifically covered. Record uncovered cases and direct remedy, not a blanket pass.
4. Inspect the existing `session.mjs` readiness semantics, especially reasoned critical overrides, against the authentic original acceptance criteria without changing the engine until a separately tested decision is documented.
5. Continue DS-A source recovery through authorized sources. Mark absent files unknown, not permanently lost.
6. Coordinate code ownership with the ChatGPT scheduled Decision Spellchecker task and Claude Code before integration.
7. Keep this PR draft, unmerged and unshipped. The secure IncomeOS accounting editor remains the first production milestone once the first restoration increment is reviewable.

**No original DS-A SP condition is accepted by this document.**

## 5. Claude Code increment, 2026-11-10 (appended; sections 1 to 4 are preserved as written)

**Branch:** `claude/decision-spellchecker-ds-n1-2026-11-03` (PR #119). The PR #128 branch `chatgpt/ds-n1-sp07-contained-20261105` (head `e345475c`) was merged in with all 24 of its commits preserved; nothing in it was rewritten. Ownership check before writing: the DS-N1 branch had no commits since 2026-11-03 and the #128 branch none since 2026-11-05 07:31; no other branch changes `lib/ds-n1/`.

### 5.1 Section 4 actions 1 and 2, now executed from the merged tree

| Check | Result |
|---|---|
| `node --test` on all five `tests/ds-n1/*.test.mjs` files | 62 passed, 0 failed (35 base, 6 cognitive controls, 6 cognitive observations, 9 source trace, 6 reflective guidance) |
| `eval.mjs` (24 base records) | PASS (developer fixtures only) |
| `eval-stress.mjs --split dev` | 0 critical false-ready |
| `eval-isolation.mjs` | 12 of 12 |
| `ui.browser.mjs` (desktop and iPhone 13 emulation) | 24 of 24, including the SP-07/13/14 assertions authored in #128 and not run until now |
| `author.browser.mjs` | 18 of 18 |
| `reproduce.mjs` (52 report hashes against `REPRO_BASELINE.json`) | identical; no review outcome changed |

Not executed: sealed HOLDOUT-2 (needs owner authorisation), real iPhone Safari, assistive technology, independent review.

### 5.2 Source recovery, repeated

* All 168 remote branches searched by path and content for DS-A material (versions 0.6.11 or 0.7.0, "Cognitive Controls Panel", "Restrain, Reframe, Recalibrate"). Hits are DS-N1, the #128 branch, IncomeOS programme-management code and JRS Review Engine research files (`lib/engine-assurance/cognitive-controls.mjs`, a separate asset). No DS-A source.
* The owner's connected Google Drive was searched for "Decision Spellchecker", "Spellchecker", "Master Programme", "Issue 3.6", "SP-07" and "Cognitive Controls". No match; the JRS files found there are unrelated.
* Issue 3.6 itself is not in the repository on any branch, only references to it. Section 1 cites its pages 26 to 29; that text was not available to this session.
* Status unchanged: **DS-A AUTHENTIC_SOURCE_NOT_RECOVERED.** Not recorded as lost.

### 5.3 SP-07 extension: wording checks for directive sections 8.4 and 8.5

New `lib/ds-n1/cognitive-observations.mjs` (`ds-n1.cognitive-observations/0.1.0-dev`), shown in the existing panel under "Wording checks". It is a **reconstruction against the directive's working definitions**, not the original SP-07 contract.

* **Premature closure (8.4):** the record states closure ("can proceed", "finalised", "no further action", "is closed" and similar) while a critical or blocking finding is unresolved. Shows the exact sentence with its record span, the open finding IDs and the question "What information remains necessary before this conclusion can be finalized?"
* **Unsupported certainty (8.5):** a claim uses categorical wording ("clearly", "undoubtedly", "conclusively", "proves" and similar) while it has an unresolved finding or cites no source. Question: "Does the evidence support the certainty expressed in this statement?"
* Negated wording ("not clearly", "cannot be finalised") does not fire. Resolved or superseded findings do not count. Review-severity findings alone do not make closure premature.
* It never changes a finding, status, event, report or export (`changes_review_status: false`), adds no JRS condition, names no reviewer state of mind and supplies no fact. Reviewer dispositions stay on the existing event-logged finding actions, reached by a "Review related finding" button.
* On the fixtures: premature closure fires on 11 base and 6 stress records, every one in HOLD or INCOMPLETE; it fires on no READY record. No fixture uses categorical wording, so unsupported certainty is exercised by unit cases only.
* Tests: 6 unit cases (fires, must not fire, no diagnosis wording, fail-closed input, determinism and exact spans across all fixtures) and a browser assertion on D06 that the check appears and the status is unchanged. Two deliberate mutations (removing the negation guard; counting review-severity findings) each made the suite fail.

### 5.4 Directive section 8 coverage after this increment

| Section | Coverage | Gap |
|---|---|---|
| 8.1 Observation vs inference | #128 prompts on UNSUPPORTED_CLAIM, UNTRACEABLE_AUTHORITY, REASONING_NOT_TRACED, UNMAPPED_ASSERTION | Lexical rules only |
| 8.2 Alternative explanation | #128 prompts on QUALIFICATION_OMITTED and CONTRARY_CLAUSE_OMITTED | No check for competing explanations the record makes identifiable; not built, to avoid generating case facts |
| 8.3 Selective evidence | #128 CONTRARY_CLAUSE_OMITTED prompt | Only contrary clauses inside cited sources |
| 8.4 Premature closure | This increment | Lexical closure phrases; English only |
| 8.5 Unsupported certainty | This increment | Lexical certainty markers; not proof that wording is wrong |
| 8.6 AI-assisted reasoning | #128 UNTRACEABLE_AUTHORITY and UNMAPPED_ASSERTION prompts | No separate check; AI authorship is deliberately not inferred |
| 8.7 Interface elements | Passage, concern, linked finding and condition, one question, existing reviewer actions, status, version | Prompt and observation views are not written to the event log or report; dispositions are recorded only through the finding actions |
| 8.8 Acceptance list | No fabricated evidence, no diagnosis, unresolved state kept, outcomes unchanged and mode parity are tested | Original-fidelity and real-reviewer effectiveness untested |

**SP-07, SP-13, SP-14 status for DS-N1:** IMPLEMENTED, DEVELOPER VERIFIED (read-only candidates). **Original acceptance: NOT_ACCEPTED**, as in section 2.

### 5.5 Next

1. If the owner can supply Issue 3.6 pages 26 to 29 (or the SP-07/13/14 definitions), compare this reconstruction with them clause by clause.
2. Decide whether cognitive prompts and wording checks should appear in the report and export. That would change report hashes and need a rule or report version bump and a new reproduction baseline.
3. Per directive v2.1 sequencing, move to the secure accounting editor, coordinating with the other branches now extending IncomeOS (#176, #179, #180).
