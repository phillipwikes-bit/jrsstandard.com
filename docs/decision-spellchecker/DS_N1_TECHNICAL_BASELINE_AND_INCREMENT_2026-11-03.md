# Decision Spellchecker: Technical Baseline and DS-N1 Increment A to D

**Date:** 2026-11-03 · **Branch:** `claude/decision-spellchecker-ds-n1-2026-11-03` (from `origin/main` at `40989da6`) · **Author:** AI development agent (Claude Code) · **Status labels:** per directive Section 19.

Governing inputs: owner directive "Claude Code Master Development Directive, Decision Spellchecker" (2026-11-03, citing Issue 3.6 of 2026-10-31); `CLAUDE.md`; `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md` (current operative override for Engine work).

## 1. Technical baseline (FACT unless labelled)

| Item | Finding |
|---|---|
| Repository | `phillipwikes-bit/jrsstandard.com`, local clone; session started on detached HEAD `40989da6` = `main`, clean tree |
| Runtime | Node v22.23.4, Python 3.13.18; no build step; one npm dependency (`@vercel/functions`) |
| Deployment | Vercel serves the repository root. `.vercelignore` excludes `lib/`, `tests/`, `*.md`, `.jrs/`. No CI workflow triggers on non-`main` branches except `jrs-method-first-public-site` / `jrs-professional-reference` (inspected: public-site checks, not deployment) |
| Public Review Engine | `api/review.js`, `api/review-engine.js`, `api/v1/review-engine.js` all return the closed 503 from `api/_controlled-review.js`. No record intake. Unchanged by this work |
| Engine candidate source on `main` | NONE. Unmerged candidate code exists on remote branches `claude/engine-local-candidate-2026-10-06` (`lib/engine-candidate/`), `claude/engine-assurance-2026-10-10` and `claude/engine-reliability-phase6-local` (`lib/engine-assurance/`, `lib/engine-change-control/`, ...). These belong to the JRS Review Engine asset, not to DS-A, and were inspected only to classify them |
| Issue 3.6 document | NOT IN REPOSITORY. Only references exist (`programme-status-9872fb93cc94.html` "Issue 3.6 proposed"; `tests/owner-programme-issue36.mjs`). The October 3 source-aligned files named in the handoff were also not supplied this session |
| DS-A status on record | `docs/program-status/INVESTIGATOR_GUIDES_DIRECT_FREE_DELIVERY_CORRECTION_2026-10-31.md`: "original private Decision Spellchecker remains NO_GO_NOT_VERIFIED" |

### 1.1 DS-A recovery search (Priority One)

Searched: the local filesystem (`find / -iname "*spellcheck*"`, `test_workbench.py`), all 201 commits of local history, and the trees of every one of the 40 remote branches for paths matching `spellcheck|workbench|lab-r6|/r6|v0.6|v0.7|test_workbench`, plus content search for `SP-01`, `Justification Underline`, `test_workbench` on the engine branches.

Results:

* No DS-A application source, build, installer, archive, Codebook version or mobile implementation for v0.6.11 or v0.7.0 was found.
* `tests/test_workbench.py` (the LAB-R6 digest discrepancy file) does not exist on disk or on any branch. The 32-component rights schedule and 16 class-G cases are not in this repository.
* Hits on "workbench" are Engine evaluation viewers (`research/engine-evidence-contract-2026-10-10/workbench/`); `P6-SP-01` is an Engine regression scenario ID, not the historical SP-01 contract.
* The SP-01..SP-18 **definitions** were not recovered. Only their names (from the directive) are available.

**Disposition: `AUTHENTIC_SOURCE_NOT_RECOVERED`** (DS-A, within the sources accessible to this session). DS-A remains NO_GO_NOT_VERIFIED; 0 of 18 independently accepted tests is unchanged. LAB-R6 source and its `test_workbench.py` discrepancy: **NOT ACCESSIBLE**, so the discrepancy could not be investigated and nothing about it was altered. Further search requires owner-authorised locations (backups, archives, other repositories) not attached to this session.

## 2. Five-candidate asset map

| ID | Asset | State after this pass |
|---|---|---|
| PORT-01 / DS-A | Original Decision Spellchecker | AUTHENTIC_SOURCE_NOT_RECOVERED. Not touched, not emulated, not claimed |
| PORT-02 | Evidence Integrity Verifier | A bounded **seed** exists inside DS-N1 (`lib/ds-n1/verify.mjs`). Not a separately specified or packaged PORT-02 |
| PORT-03 | Decision Record Report Generator | The eight-part report exists inside DS-N1 (`lib/ds-n1/report.mjs`). Shared-code output; not a separately validated PORT-03 |
| PORT-04 | Training Simulator | Not worked on |
| LAB-R6 / DS-B | R6 laboratory | Source not accessible; nothing done |
| **DS-N1 (new)** | **Decision Spellchecker new experimental candidate 1** | **Created this pass.** Distinct identity in `lib/ds-n1/identity.mjs`; registered in `.jrs/registries/ASSET_REGISTER.json` |
| JRS Review Engine | Separate asset | Unchanged; DS-N1 imports none of its code |

## 3. What DS-N1 is

A deterministic, offline, zero-model-call pre-finalisation review instrument for **constructed fictional supplier-access exception records only** (the handoff's permitted scope). Real, confidential or regulated records and the excluded classes (employment, housing, lending, insurance, medical, legal outcome) are refused before analysis (`REFUSED_SCOPE`).

Flow: **Detect** (rule findings on claims, citations and unmapped sentences) → **Reflect** (one neutral, record-specific question per finding) → **Correct** (human actions) → **Connect** (hash-chained event log and an eight-part report that an independent party can regenerate).

| File | Role |
|---|---|
| `lib/ds-n1/identity.mjs` | Candidate identity, schemas, scope, limits, status vocabulary, READY meaning |
| `lib/ds-n1/text.mjs` | NFC, code-point offsets, quote folding, sentence segmentation, canonical JSON, sync SHA-256, HTML escaping |
| `lib/ds-n1/record.mjs` | `ds-n1.record/1.0` validation and scope gate |
| `lib/ds-n1/assess.mjs` | 18 rules; citation and claim assessment |
| `lib/ds-n1/session.mjs` | Event log, action validation, state derivation, chain verification |
| `lib/ds-n1/report.mjs` | Eight-part report, export bundle, escaped HTML |
| `lib/ds-n1/verify.mjs` | Export consistency verifier (PORT-02 seed) |
| `lib/ds-n1/ui/` + `serve.mjs` | Reviewer interface; 127.0.0.1-only GET server with strict CSP |

### 3.1 Evidence grounding: the three separate judgments

1. **Present**: the quoted words exist in the cited source (exact, or after folding curly quotes, dashes, whitespace and case). Offsets are Unicode code points in NFC text. A quote absent from the cited source but present in another is reported as possible misattribution, naming the other source.
2. **Supports** (relevance): the passage must also agree on polarity (negation in the clause up to the quote), actor (entities named in the claim against those named in the source sentence), date and event role (against structured source events), and must share at least half the claim's proposition terms. Omitted qualifications (`subject to`, `pending`, `unless`, ...) are raised separately.
3. **Sufficient**: never decided. Supported claims are `HUMAN_JUDGMENT_REQUIRED`; others `NOT_ESTABLISHED`.

### 3.2 Status contract

| Status | Produced when |
|---|---|
| `REFUSED_SCOPE` | Excluded or unsupported record class, or non-constructed data classification |
| `ERROR` | Schema invalid, unsupported schema version, duplicate IDs, malformed input, or any event-chain defect (tampered event, broken link, wrong record bound to the log, empty log) |
| `INCOMPLETE` | No claims, or a claim not locatable in the record |
| `HOLD` | Any unresolved critical finding, or any finding awaiting evidence or escalated |
| `REVIEW_REQUIRED` | Unresolved non-critical findings |
| `READY_FOR_HUMAN_FINALIZATION` | No unresolved finding. Explicitly **not** approval, sufficiency, legal defensibility or authorisation |

Human actions: `attach_citation`, `revise_claim` (revise or qualify), `add_reasoning`, `request_evidence`, `record_limitation` (refused for critical findings), `escalate`, `override` (reviewer's own rationale, at least 20 characters, stored verbatim), `leave_pending`, `final_disposition` (acceptance refused unless READY; marked stale if any action follows). Every action requires a reviewer ID, a name and a timestamp; nothing is synthesised. Revisions never overwrite the original claim; findings that no longer apply are kept as `SUPERSEDED`.

There is no timeout or cancellation path because DS-N1 makes no network or provider call; inputs are size-bounded (`LIMITS`).

## 4. SP-01..SP-18 matrix (DS-N1 only; NOT DS-A acceptance)

The historical SP definitions were not recovered, so each row maps the **directive's SP name** to DS-N1 behaviour. No row is evidence about DS-A, and this table must not be read as a replacement SP specification.

| SP | Name | DS-N1 implementation | DS-N1 status |
|---|---|---|---|
| SP-01 | Justification Underline | Claim spans underlined in record view; severity styling; keyboard selectable | IMPLEMENTED, DEVELOPER VERIFIED (browser) |
| SP-02 | Reasoning Suggestions | Neutral question per finding; **no generated wording** | PARTIAL: questions only, by design |
| SP-03 | Evidence Lookup | Evidence view with source sentence and quote highlighted | IMPLEMENTED, DEVELOPER VERIFIED |
| SP-04 | Claim-to-Evidence Match | `assessCitation` | IMPLEMENTED, DEVELOPER VERIFIED |
| SP-05 | Guided Correction | Attach, revise, qualify, add reasoning | IMPLEMENTED, DEVELOPER VERIFIED |
| SP-06 | Reasoned Override | `override` with verbatim rationale | IMPLEMENTED, DEVELOPER VERIFIED |
| SP-07 | Cognitive Controls Panel | Not implemented (definition not recovered) | NOT IMPLEMENTED |
| SP-08 | Justification Change History | Revision list and hash-chained events | IMPLEMENTED, DEVELOPER VERIFIED |
| SP-09 | Decision Record Report Card | Review summary panel and report part 7 | IMPLEMENTED, DEVELOPER VERIFIED |
| SP-10 | Pre-finalization Hold | `HOLD` status; acceptance refused unless READY | IMPLEMENTED, DEVELOPER VERIFIED |
| SP-11 | Source and Record Inventory | Report part 2 with digests and versions | IMPLEMENTED, DEVELOPER VERIFIED |
| SP-12 | Reconstruction Trail | Event log plus regenerable report | IMPLEMENTED, DEVELOPER VERIFIED |
| SP-13 | Learn/Calibration | Not implemented | NOT IMPLEMENTED |
| SP-14 | Restrain/Reframe/Recalibrate/Release | Not implemented (definition not recovered) | NOT IMPLEMENTED |
| SP-15 | Evidence-Pack Export | JSON export with checksums plus HTML report | IMPLEMENTED, DEVELOPER VERIFIED. PDF not implemented |
| SP-16 | Manual and Professional Modes | Guided / Professional toggle; identical findings | IMPLEMENTED, DEVELOPER VERIFIED (browser) |
| SP-17 | Mobile Support | Responsive single column | DEVELOPER VERIFIED in **Chromium iPhone 13 emulation only**. Real iPhone Safari: NOT VERIFIED |
| SP-18 | Reviewer Feedback and Ablation | Not implemented | NOT IMPLEMENTED |

## 5. Verification

Reproduce from a clean checkout (no install step, no network):

```bash
node tests/ds-n1/build-fixtures.mjs        # regenerates fixtures; manifest sha256 015acdd4...
node --test tests/ds-n1/ds-n1.test.mjs     # 20 unit, transition and adversarial tests
node tests/ds-n1/eval.mjs --no-write       # pre-registered harness, 24 records x 3 executions
node tests/ds-n1/ui.browser.mjs            # 18 Chromium checks, desktop + iPhone 13 emulation
node lib/ds-n1/serve.mjs                   # then open http://127.0.0.1:4317/
```

| Suite | Result |
|---|---|
| `node --test tests/ds-n1/ds-n1.test.mjs` | 20/20 pass |
| `tests/ds-n1/eval.mjs` | RUN-001 **FAIL** (preserved); RUN-002 and later PASS: 0 critical false-ready, 24/24 status, 24/24 required codes, 5/5 clean controls, 24/24 byte-repeatable |
| `tests/ds-n1/ui.browser.mjs` | 18/18 after corrections (first run 12/16, preserved below) |
| Handoff minimum commands (`auth-matrix`, `test_review_incomplete`, `public-route-alignment`, `git diff --check`) | all exit 0 |
| `scripts/check_zero_drift.py` | 164 checks, 51 failed, 5 skipped. **The identical 51-failure set occurs on `origin/main` without this branch** (diffed); none is introduced here. Not remediated in this pass |

Expectations (`tests/ds-n1/expectations.json`, sha256 `268e3474...`) were committed in `faf6b801` **before** the harness first ran. Fixtures and expectations are developer-authored, so passing establishes DEVELOPER VERIFIED behaviour on this fixture set only.

**Guards demonstrated to fire** (CLAUDE.md Section 20), each mutation applied then restored byte-identically:

| Mutation | Caught by |
|---|---|
| M1 negation check disabled | eval (D05) |
| M2 event hash recomputation disabled | unit |
| M3 relevance always true | eval (D01) |
| M4 limitation allowed on critical findings | unit |
| M5 export reconstruction check disabled | unit |
| M6 curly-quote folding removed | unit and eval (P02 to HOLD) |

A first M6 attempt was invalid (it left a syntax error, so it "passed" by crashing) and was redone. M1 and M3 are caught only by the harness, not by the unit suite.

## 6. Defects found and corrected (first observation preserved)

| # | First observed | Cause | Correction | Retest |
|---|---|---|---|---|
| 1 | RUN-001: control P02 got `REVIEW_REQUIRED` from `UNMAPPED_ASSERTION` on "Reviewer note 📎 attached." | Assertion rule `review\w*` matched the noun "Reviewer" | Rule narrowed to the verb form `reviewed` in `assess.mjs`; expectations unchanged | RUN-002 PASS |
| 2 | Design review before fixtures: "no" in a trailing clause ("with no high-risk findings") would flag a supported claim as negated | Polarity compared against the whole source sentence | Polarity now uses the clause leading up to and including the quote; a trimmed preceding "not" is still caught (D05) | P01, D05 |
| 3 | Design review: a fact citing only irrelevant passages produced only review-level findings | No claim-level rule for "cited but unsupported" | `UNSUPPORTED_CLAIM` (critical) when no citation establishes support | D01 HOLD |
| 4 | Browser: source selector overflowed the evidence panel (914 px against a 901 px edge) | No `max-width` on form controls | `select,input,textarea{max-width:100%}`; new overflow check added | 18/18 |
| 5 | Browser: label read "vv2" | Version prefixed twice | Label now "version v2" | visual |
| 6 | Browser test defects (not product): `text=Attach` matched a label; a wait raced on a stale status | Test selectors | Exact button selectors; wait on the record-specific finding | 18/18 |

Note: RUN-001 and RUN-002 record `working_tree_dirty_in_scope: true` because the harness files themselves were not yet committed, and RUN-002 also ran with the uncommitted defect-1 fix. A clean-tree run is recorded after commit (see `tests/ds-n1/results/`).

## 7. Adverse findings and limitations (NOT ESTABLISHED / open)

* **No independent verification of anything.** No qualified separate reviewer has examined DS-N1.
* Rules are lexical. Paraphrased support is reported as not established; implied conditions, double negatives and a negation **after** the quote ("completed, but not accepted") are not detected. A passage can pass every check and still not support a claim.
* The RC1 to RC5 grouping is provisional and is not a versioned Codebook correspondence (handoff prohibition respected).
* Claims must be supplied as structured input (quote plus citations). DS-N1 does not extract claims from free text; sentences with no assertion marker are listed as unassessed rather than silently passed.
* Each defect fixture isolates one mutation. Human burden and cold-reviewer reconstructability are **not measured**. The H0 to H3 / 156-parent design remains a future protocol; nothing was executed.
* PDF export, SP-07, SP-13, SP-14 and SP-18 are not implemented.
* Real-device iPhone Safari and assistive-technology testing were **not performed**.

## 8. Security and privacy

No change to any deployed route, credential, private owner surface or external service. DS-N1 code contains no `fetch` to external hosts, no `process.env` and no provider SDK (a unit test enforces this). The UI makes same-origin GETs only, uses no browser storage and no analytics, and renders all record text through `textContent` (an XSS probe confirms this). The local server binds 127.0.0.1, is GET-only with path containment, and sends a strict CSP. All DS-N1 files sit under `lib/`, `tests/` or `*.md`, which `.vercelignore` excludes from upload.

## 9. Release position

Production: **HOLD**, nothing deployed. DS-A: **NO_GO_NOT_VERIFIED, AUTHENTIC_SOURCE_NOT_RECOVERED**. Demo, evaluation access, listing and transfer: **NOT AUTHORISED**.

B-record for DS-N1: B-0 distinct identity **ESTABLISHED (developer record)**; B-1 custody: branch history only, **NOT VERIFIED** as independent custody; B-2 rights separation: **NOT VERIFIED**, since DS-N1 is AI-assisted work in the owner's repository and no rights analysis was made (Rule 7); B-3 runnable: **DEVELOPER VERIFIED**; B-4 to B-9 (including B-9L and B-9T): **UNKNOWN / NOT VERIFIED**.

## 10. Next increment

**Increment E-1: paraphrase and combined-defect stress set, plus a creator-review packet.** Build about 20 paired fixtures in which support is paraphrased, or several defects co-occur, and record the false-hold rate honestly (expected to be non-zero). Produce a blinded labelling packet so the owner or a nominated reviewer can label the fixtures independently of the developer.

Acceptance: expectations committed before the first run; 0 critical false-ready retained; every false hold logged rather than tuned away; labels from a person other than the developer stored separately from developer expectations.

Owner decisions that would unblock more: point the session at any owner-authorised DS-A or LAB-R6 source location; supply the Issue 3.6 document and the October 3 source-aligned files.
