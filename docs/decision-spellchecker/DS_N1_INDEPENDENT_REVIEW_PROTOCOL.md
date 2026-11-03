# DS-N1 Independent Review Protocol (proposed)

**Status:** PROPOSED, 2026-11-03. Prepared by the AI development agent. **Not adopted.** No step that involves another person may start until the owner records a decision to adopt it, wholly or in part.

**Purpose:** obtain evidence about DS-N1 that does not depend on the developer's own labels and test cases. It tests the claim "DS-N1 does not mark materially defective constructed records as ready, and does not hold sound ones without reason". It does **not** test usefulness in practice, real records, or the original Decision Spellchecker (DS-A).

## 1. What exists now, and why it is not enough

| Evidence | Status | Why it is not independent |
|---|---|---|
| 24 base, 16 stress and 10 holdout-2 cases | Developer-authored | Same person wrote the engine, the cases and the labels |
| STRESS-HOLDOUT-001 | Spent (run once) | Developer-authored |
| HOLDOUT-2 | Sealed, never run | Developer-authored; a sequencing control only |
| 40/40 fresh-clone reproduction | Deterministic reconstruction | Shows repeatability, not correctness |
| Blinded labelling packet (35 cases) | Prepared, unlabelled | Cases are developer-authored; only the labels would be independent |

## 2. Roles

| Role | Who | Independence requirement |
|---|---|---|
| Owner | Phillip Wikes | Adopts the protocol; selects and authorises the others; holds the keys |
| Labeller (1 or 2) | Owner's choice | Has not seen DS-N1 output, fixture IDs, developer labels or the rule code. Records any prior contact with the project |
| Case author (optional, stronger) | Owner's choice, different from the labeller | Writes new constructed cases without seeing DS-N1's rules or output |
| Developer | AI development agent | Runs the harness and scorer; does not see new cases or labels before they are committed |

Recruiting or contacting any of these people is an external communication the owner must decide. The developer does not contact anyone.

## 3. Materials and custody

* **Give to the labeller:** `tests/ds-n1/labelling/PACKET.html` and `LABEL_SHEET_TEMPLATE.json`. Both contain fictional content only.
* **Do not give:** `tests/ds-n1/labelling/KEY_DO_NOT_SHARE.json`, anything under `tests/ds-n1/results/`, or the expectation files.
* The repository is currently **public on GitHub**, so a labeller could find the key and the developer labels there. **Independence cannot be assured while that is true.** Before labelling starts, the owner should do one of the following:
  * make the repository private;
  * give the labeller only the packet and require a signed statement that they did not consult the repository.

  Either way, record which.
* **Optional case author:**
  * The author receives the record schema (`ds-n1.record/1.0`), the scope rules (supplier access exceptions; constructed fictional content only; no identifiers; no employment, housing, lending, insurance, medical or legal-outcome content), and the label definitions from the packet's instructions.
  * The author returns each case together with their own label.
  * Commit the cases unseen by the developer, then compute their SHA-256 before any run.

## 4. Procedure

1. **Owner adopts the protocol.** Record the decision on PR #119 or in the decision log. That reference is the authorisation.
2. **Pre-registration.** Before any labels or new cases are seen, commit:
   * this protocol;
   * the metrics in section 5;
   * the engine commit to be evaluated (engine frozen; no rule change until step 7).
3. **Labelling.** The labeller completes the sheet independently, signs the attestation in the sheet, and returns it to the owner. The owner commits it unchanged under `tests/ds-n1/labelling/returned/`, with its SHA-256 in the commit message.
4. **Scoring.** `node tests/ds-n1/score-labels.mjs <sheet>`. The output is committed as returned.
5. **Optional new cases.** Commit the author's cases and labels as a new sealed set. Run them once with the frozen engine through a harness built like `eval-holdout2.mjs`.
6. **HOLDOUT-2.** With the owner's authorisation: `node tests/ds-n1/eval-holdout2.mjs --owner-authorisation "<reference>"`. It runs once.
7. **Disagreement review.** Each case where the labeller, the developer label and DS-N1 disagree is listed. Only the owner, or an adjudicator the owner names, may resolve it, and the record keeps all three positions. Developer labels are never edited to agree.
8. **Report.** A dated section appended to the engineering record, stating exactly what was measured and its limits.

## 5. Pre-declared metrics (no thresholds are tuned after the fact)

* **Critical false-ready.** DS-N1 says READY where the independent label says HOLD, REVIEW_REQUIRED or INCOMPLETE. The **target is 0.** Any occurrence is a release blocker for the tested scope.
* **False hold.** The independent label says READY and DS-N1 does not. This is reported as a count.
* **Agreement of DS-N1 with the independent label**, and of the developer label with the independent label, each as raw counts out of the number labelled.
* **Claim-level support agreement.** Count only; no coefficient is computed with a single labeller.
* With two labellers, report inter-labeller agreement as raw agreement. A chance-corrected coefficient may be added and named, but no reliability claim is made from fewer than an owner-agreed number of cases.

## 6. What may be said afterwards

| Result | Permitted statement |
|---|---|
| 0 critical false-ready on independently labelled cases | "On N constructed fictional cases labelled by an independent reviewer, DS-N1 marked none of the defective cases ready." State N, the labeller's relationship to the project and the commit |
| Any critical false-ready | Report it, block release for the tested scope, and fix only through a new increment with a new sealed set |
| Anything | **Not** accuracy on real records, not validation, not compliance, not equivalence to DS-A |

## 7. Out of scope

Real or confidential records, human-subject research, recruitment, payment, publication of results and any commercial use all need separate owner authorisation. This protocol is a technical evaluation plan only.
