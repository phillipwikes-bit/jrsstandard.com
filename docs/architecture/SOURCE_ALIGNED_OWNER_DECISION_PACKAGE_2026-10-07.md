# Source-aligned owner decision package, 2026-10-07 (internal)

**For the owner.** This lists only genuine decisions and human actions arising from comparing PR #39 with the three 3 October sources. This package does not advance any release gate, and no further internal tooling changes the legal, privacy or release position.

## Current implementation, target and absent evidence
- **Current implementation:** the reconciliation of 55 source controls (`SOURCE_CONTROL_EXTRACTION_MATRIX.md`, `SOURCE_ALIGNED_RECONCILIATION_REPORT_2026-10-07.md`).
- **Target:** the position the October 3 sources describe.
- **Absent:** independent evaluation, operator evidence, counsel disposition, an owner release authorization and independent production QA.

## 1. What is now verified through source alignment
- The three October 3 files you supplied match the hashes recorded in the 5 October handoff, byte for byte. They are kept local, and only hashes and locators are committed.
- 55 controls were compared with the repository: 23 aligned, 16 partly aligned, 6 in conflict, 2 not implemented, 1 not assessed, 7 needing a person's action.
- Scope, production status, version binding, the quotation limit, extraction and omission reporting, the inference screen, the absence of scoring and the open gates agree with the sources.

"Verified" here means consistent with the cited source and the repository. It does not mean the Engine works on real records or is ready for any use.

## 2. What remains unverified
- How the Engine behaves on real records or with a live model. No live run exists.
- Every release gate: RG-1, RG-2, RG-4 and RG-5 are BLOCKED, and RG-3 is NOT_ASSESSED. None changed.
- Earlier run evidence, which needs the redacted raw run bundle (SAC-26).

## 3. Conflicts requiring an owner decision
| ID | Decision needed |
|---|---|
| CF-SA-01 | The release-gate record reuses evidence numbers E-001 to E-009 from the canonical ledger for different items. Choose a separate namespace for gate evidence, or a controlled ledger update. |
| CF-SA-02 | The sources make you the only required human reviewer for the evaluation package, and the decider of disputes. The readiness package assumes independent reviewers and a separate adjudicator. Choose which model the evaluation package follows. Independent labeling for production is unaffected. |
| CF-SA-03 | The sources state commercial-preparation objectives; the 5 October handoff prohibits licensing and acquisition work without a new instruction from you. Say which governs. |
| CF-SA-04 | The sources use pass, fail or not assessed, with missing professional evidence recorded as not assessed. The record uses BLOCKED for four gates and has no numeric thresholds. Choose the status vocabulary. |
| CF-SA-05 | The sources list creator review of the development package as a requirement and do not list owner release authorization as a gate; the record follows the handoff. Choose the gate set. |
| CF-SA-06 | The repository is public on GitHub, so material excluded from the website is still readable there. Decide whether to commission the exposure review the sources require before anything is described as protected. |

Also for you:
- the wording of the "operational validation" and "validation phase" phrasing (PPA-03);
- the one-to-five training rating (PPA-06);
- whether the non-HR scope governs the public methodology (PPA-08);
- whether the repository Evidence Ledger is brought to the canonical sequence (SAC-06);
- confirming the credential rotation the Evidence Ledger requires (SAC-47).

## 4. Items requiring counsel or another external human
- **Counsel:** RG-3, and the retention disclosure on the security and privacy pages (PPA-09), which no longer states the 90-day period the policy code sets. Also the exposure review in CF-SA-06.
- **Independent labelers and adjudicators:** RG-1, on an unused sealed holdout.
- **You, as operator:** RG-2 records from the environment the Engine would run in.
- **An independent QA reviewer:** RG-5, only after an authorized deployment.

## 5. Items that need no action now
- The Engine candidate, methodology-integrity, claim-provenance, frozen-demo and reviewer-workspace packages can stay as they are while the decisions above are open.
- The October 3 files need nothing further. A future session that must re-verify will need the archive again.

## 6. Recommended status of PR #39
**Keep it as a draft.** This package does not recommend merging.
- **Internal-only work, safe to merge whenever you choose:** everything under `tools/`, `tests/` and `lib/`, and the Markdown under `docs/` and `research/`. All of it is excluded from the website by `.vercelignore`, though it is readable on GitHub (CF-SA-06).
- **Branch changes that would publish content:** 22 served public pages (21 edited and the new `methods-paper-notice.html`). Merging publishes them; that is your separate publication decision.
- **Should stay in draft until resolved:** the public pages touched by PPA-03, PPA-08 and PPA-09, and any change that depends on CF-SA-02, CF-SA-03 or CF-SA-05.
