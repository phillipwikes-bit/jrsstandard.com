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
