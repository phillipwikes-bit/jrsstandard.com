# Claim Provenance Integrity Report

**Date:** 2026-10-06 · **Branch:** `claude/engine-local-candidate-2026-10-06` · **Status:** internal, not deployed (`*.md` and `tools/` are excluded by `.vercelignore`).

**What this package is.** An internal claim-control system. For each material claim about JRS research or the Engine it records the exact claim, its source, what the source measures, its limitation, whether it may be used in public, whether it transfers methodology evidence to the Engine, and the denominator, scope and date that must stay with it. It then scans public surfaces for figures and status claims and proposes repairs.

**What it is not.** The package does not validate the research, the Engine, privacy controls, commercial readiness or production use. The register is a control over wording, not new evidence. No study was recalculated, no figure was changed, no historical record was altered, and no public file was edited.

Machine records: `tools/claim-provenance/current-claim-evidence-register.json` and `tools/claim-provenance/generated/scan-results.json`. Views:
- `CLAIM_EVIDENCE_REGISTER.md`
- `PUBLIC_CLAIM_LIMITATION_MATRIX.md`
- `claim-cards/`
- `PUBLIC_CLAIM_REPAIR_PROPOSALS_2026-10-06.md`

## Current state, after the repairs were implemented (2026-10-06)

**The repairs are staged on the draft PR #39 branch only. They will not become public unless the owner separately approves a merge and publication.** Sections 1 to 8 below are the record at the proposal stage and are kept unchanged (CLAUDE.md Rule 10).

**What was implemented.** All 17 proposals (PR-01 to PR-17) and the PD-01 supersession notice, plus 12 further repairs found during implementation (PR-18 to PR-29). Three proposals were applied with a variance, recorded in `PUBLIC_CLAIM_REPAIR_PROPOSALS_2026-10-06.md`: PR-07, PR-11 and PR-13. No figure, denominator or date was changed.

**Pages repaired.** `research.html`, `research-summary.html` (body copy, meta, Open Graph, Twitter and structured data), `reviewer/index.html`, `check.html`, `engagement.html`, `decision-reconstruction-risk.html`, `implementation-scenarios.html` and `workflow-fit.html`. One page was added: `methods-paper-notice.html`. The archived `JRS_Reliability_Accuracy.pdf` is unchanged and is reached through the notice.

**Scanner extended.** It now also reads meta, Open Graph and Twitter descriptions, structured-data strings (including `creativeWorkStatus`), and alt, aria-label and title text. That extension found PR-19 to PR-22 and PR-24.

**Claims now.** 33 claims:

| Status | Claims |
|---|---|
| SUPPORTED_WITH_LIMITATION | 16 |
| HISTORICAL_ONLY | 4 |
| SOURCE_REPORTED_NOT_REPRODUCED | 5 |
| NOT_SUPPORTED | 4 |
| NOT_ASSESSED | 2 |
| REQUIRES_WORDING_REPAIR | 0 |
| RETIRED | 2 |

**What changed status:**
- **CL-011, RETIRED:** the circular condition-separation p-values are no longer stated publicly.
- **CL-025, RETIRED:** the "operational validation phase" wording is gone.
- **CL-033, HISTORICAL_ONLY:** the methods PDF now sits behind its supersession notice.
- **CL-013, SOURCE_REPORTED_NOT_REPRODUCED:** the Study 014 reader is now named as an AI reader.

Every repaired claim records its pages and repair IDs in its review history.

**Scan now.** The scan covers 71 public pages and 65 route files:

| Disposition | Findings |
|---|---|
| PERMITTED | 79 |
| HISTORICAL | 4 |
| AMBIGUOUS | 0 |
| UNSUPPORTED | 13 |
| REQUIRES_REPAIR | 7 |

**Public surfaces: no finding needs repair, none is unsupported and none is ambiguous.** The 13 UNSUPPORTED and 7 REQUIRES_REPAIR findings are all report-only: 12 + 7 in repository documentation (chiefly `research/JRS_Validation_Report.md`, superseded) and 1 in an analytics route note. Every implemented repair is a regression check, and `scan.mjs --check` fails if a repaired page brings back the old wording. Restoring the pre-repair pages from `38ca6fb` trips that check for every repair that replaced wording.

**Repository guard.** `scripts/check_zero_drift.py` is unchanged. Two of its existing failures now pass because of the page repairs: "the cross-vendor range carries its own denominator" and "reliability claims preserve E-038 population and criterion status". The result is 164 checks, 37 failed, 1 skipped, with no new failure.

**Still unresolved:**
- **Which 15-record cross-vendor window to publish.** The pages now carry 37 runs as of 13 August 2026. The 41-run figure is at the 15 August data lock.
- **The unreconciled 61-run series readings.**
- **The reliability inputs** that differ between sources.
- **Whether "Validation phase" on the Working Paper card, and "the enterprise plan" in its description, should change.** Neither was flagged by a register rule, and both were left as written.
- **Whether the archived PDF should eventually be replaced** by a current version.
- **The CEP acceptance**, which rests only on the author's file.

## 1. Claims registered (proposal stage)

33 claims, each bound to its evidence source at the hash it was reviewed at. 23 evidence records are listed: 22 sources (18 bound to a whole file, 4 to one anchored line of an append-only log or page) and 1 placeholder for "no evidence". Every claim passes the record schema and the thirteen governing rules (G01 to G13 in `tools/claim-provenance/lib/rules.js`).

| Status | Claims |
|---|---|
| SUPPORTED_WITH_LIMITATION | 16 |
| HISTORICAL_ONLY | 3 |
| SOURCE_REPORTED_NOT_REPRODUCED | 4 |
| NOT_SUPPORTED | 4 |
| NOT_ASSESSED | 3 |
| REQUIRES_WORDING_REPAIR | 3 |
| RETIRED | 0 |

By category:

| Category | Claims |
|---|---|
| DETECTION | 4 |
| RELIABILITY | 2 |
| CROSS_MODEL | 3 |
| PARTICIPATION | 3 |
| CONDITION_BEHAVIOUR | 2 |
| DRR_STUDY | 1 |
| ENGINE_SOURCE_GROUNDING | 1 |
| ENGINE_PROVENANCE | 1 |
| ENGINE_LOCAL_EVALUATION | 1 |
| ENGINE_REGRESSION | 1 |
| RELEASE_GATE | 1 |
| ENGINE_ROUTE_STATUS | 1 |
| PRIVACY_SECURITY | 2 |
| PUBLICATION_STATUS | 3 |
| RESEARCH_STATUS | 1 |
| ENGINE_STATUS | 2 |
| METHODOLOGY | 1 |
| COMMERCIAL | 1 |
| MANIFEST | 1 |
| PROCEDURAL_GUIDANCE | 1 |

The four NOT_SUPPORTED records state what must not be said:
- the Engine is production-ready, validated, licensing-ready, sale-ready, compliant, defensible or enterprise-ready;
- JRS research validates the Engine;
- the JRS methodology is validated;
- JRS or the Engine is available for licensing, sale or acquisition.

## 2. Source-reported against reproduced

- **22 source-reported claims.** The figure is taken from a manuscript, a sweep, a reading of study tables that are not in the repository, a project record or an author's file. This package does not recompute any of them.
- **7 claims reproduced in the repository.** These are tests and control records that run or exist here: source grounding, prompt provenance, the local evaluation, the regression set, release gates, route refusal, and Manifest conformance. These reproduce only what they test. None of them validates the Engine.
- **4 claims with no evidence.** The NOT_SUPPORTED records above.

Unreconciled differences between sources are recorded and not resolved (CLAUDE.md section 5):
- **Cross-vendor 61-run series.** The Study 001 resolution reads 2026-06-12 to 2026-08-21, mean 0.8526. The 2026-08-21 sweep reads 2026-06-13 to 2026-08-21, mean 0.849. The manuscript's Appendix A counted 56 cross-vendor runs at its 15 August data lock.
- **The 15-record subset.** 37 runs as read on 13 August 2026 (IP audit). 41 runs from 29 June to 15 August at the data lock, mean 87.2 percent (manuscript). These are one series at two windows, and the 61-run figure is that series without the completeness filter. None of the three counts is used for another.
- **Reliability.** The manuscript reports 0.739 and 0.623 on 104 labels from 22 raters. The sweep notes "0.739 EXPERT / 0.624 TRAINED ON 10 RECORDS, 99 LABELS" and computes a pooled 0.664 on 104 labels. Population labels also vary across public pages: "invited / open enrolment", "experts / trained reviewers" and "experts / regular reviewers".

## 3. Scan of public surfaces (proposal stage)

Scope:
- 70 public pages;
- 65 route files, of which analytics, admin and opaque-slug routes are report-only;
- 7 readable public downloads;
- 4 repository documents, report-only.

Five restricted surfaces (CLAUDE.md 36.3) are excluded and never quoted. One untracked local directory of archived third-party pages is excluded. PDFs and Word files are listed as not text-readable.

| Disposition | Findings |
|---|---|
| PERMITTED | 45 |
| HISTORICAL | 1 |
| AMBIGUOUS | 4 |
| UNSUPPORTED | 9 |
| REQUIRES_REPAIR | 35 |

**Gated public findings.**
- 28 REQUIRES_REPAIR, all on public pages, and every one is covered by a proposal.
- No UNSUPPORTED finding on a public page or public route.
- The 9 UNSUPPORTED findings and the remaining 7 REQUIRES_REPAIR are report-only: 8 + 7 in repository documentation (mostly `research/JRS_Validation_Report.md`, whose reliability wording the 2026-08-29 manuscript superseded) and 1 in an analytics route note.

## 4. Unsupported or ambiguous public claims found

| Finding | Where | Why |
|---|---|---|
| Condition-separation p-values presented as evidence | `research.html` line 148 (PR-05) | Circular: the determination is built from the conditions. The manuscript moved this analysis to Appendix B with the inferential language removed, and "Section 5.4" no longer locates it. |
| Detection figure without the constructed-corpus qualifier | `research.html` (PR-01, PR-03, PR-06), `research-summary.html` (PR-08, PR-09, PR-10), `engagement.html` (PR-11), `reviewer/index.html` (PR-14) | Constructed-record findings are not real-world performance; the register requires "constructed" beside the figure. |
| AC1 without the ten-record sample or the failed criterion | `research.html` (PR-02), `check.html` (PR-12) | Agreement is reported as interim on 10 records with the two-part criterion not met. |
| 37-run range without its window date | `research.html` (PR-04, PR-07), `reviewer/index.html` (PR-16) | Placed beside the 21 August closure it reads as the closing series; it is the series as read on 13 August 2026. |
| Cross-vendor range without "raw agreement" | `reviewer/index.html` (PR-15, PR-16) | Cross-model agreement is not accuracy. |
| Crossed-model figures without "exploratory" nearby | `research-summary.html` (PR-17) | The model was added after pre-registration. |
| Study 014 reader described as "a reader" | `decision-reconstruction-risk.html` (PR-13) | The reader was a model, and only one model's summaries were tested. |
| **Methods paper PDF with superseded claims** | `JRS_Reliability_Accuracy.pdf`, served from `research.html` (PD-01) | Says "substantial agreement", that cross-vendor agreement "averaged 84%", and that the findings "support reproducible application and substantial inter-rater reliability". All are superseded by the 2026-08-29 manuscript. Found by a one-off text extraction, because the scanner cannot read PDFs. |
| Guidance quantities that read as findings | `implementation-scenarios.html` ("First gaps visible in 1-3 records", "1-5 reviewers"), `workflow-fit.html` ("3-5 records"), `jrsstandard.html` ("10 records per record type per quarter") | AMBIGUOUS, registered as NOT_ASSESSED (CL-031). No study in the repository measured them. |

## 5. Claims needing future public repair

17 proposals (PR-01 to PR-17), plus the PD-01 notice for the methods PDF. Each one adds a missing qualifier or corrects a scope; none changes a figure, a denominator or a date. The tests apply every proposal in memory, re-scan, and confirm that its findings clear. Exact file references and wording are in `PUBLIC_CLAIM_REPAIR_PROPOSALS_2026-10-06.md`. They are recorded as proposals; nothing was applied.

## 6. Claims retained as historical

- **CL-007:** the 84 percent and 86.7 percent single-run figures. Real values on their dates, and superseded.
- **CL-020:** the earlier data flow. Record text was sent to a model provider, truncated to 8,000 characters and stored for 90 days. It is no longer active, and whether stored output remains is NOT ESTABLISHED.
- **CL-023:** the tracker line "PUBLICATION CONFIRMED = Journal of Business Ethics". It names a target venue and is not an acceptance.
- **The "substantial band" sentence on `research-summary.html`.** It reports a characterisation that has been withdrawn, as history, and is permitted as such.

## 7. Limitations of this package

- **Repository evidence only.** The study tables, the per-read dataset and the Study 014 results file are not on this branch, so most research figures are source-reported.
- **The scanner is a heuristic.** It works sentence by sentence with a three-sentence window and recognises claims only through the register's patterns. A figure no claim owns is flagged, not passed. It can still miss a claim phrased in other words, and it can ask for a qualifier that a reader would find nearby.
- **PDFs are not scanned.** PD-01 came from a one-off inspection and is bound to the file hash.
- **Proposals are drafting controls.** Whether to apply one, and whether to publish the 37-run or the 41-run window, are owner decisions.
- **No legal, compliance or validation conclusion** is drawn, and none should be read into the register.

## 8. Verification

| Command | Result |
|---|---|
| `node tools/claim-provenance/build.mjs --check` | committed register, Markdown, matrix and claim cards equal a fresh build |
| `node tools/claim-provenance/scan.mjs --check` | every unsupported or repair-needed public finding has a proposal; outputs current |
| `node tests/claim-provenance/run-all.mjs` | all suites and the mutation run |
