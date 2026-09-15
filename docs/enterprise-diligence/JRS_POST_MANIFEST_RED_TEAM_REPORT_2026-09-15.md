# Post-Manifest Red-Team Report — 2026-09-15

Every §49 attack surface was exercised. **Three findings against my own work are listed
first, because they are the ones that matter.**

---

## PMRT-1 — `lib/`, `tools/`, `tests/` and `schemas/` were publicly servable

**Severity: HIGH. CONFIRMED. REMEDIATED (configuration) — REQUIRES DEPLOYMENT VERIFICATION.**

**Expected:** implementation directories excluded from the deployable set.
**Actual:** none of the four appeared in `.vercelignore`. They would have been served as
static files on the next deployment.

**Evidence, from production rather than inference:** `/openapi.json` and
`/openapi-review-engine.json` both return **200**, while `/scripts/check_zero_drift.py`
returns 307 and `/.jrs/state/BLOCKERS.json` returns 404. A root `.json` not excluded **is**
served, so `/lib/manifest/build.js` would have been too. **Nothing was deployed to establish
this**; an existing served file answered it.

**Remediation:** four exclusion rules added. Guard
`check_manifest_implementation_is_not_deployable` added; **five mutations fail correctly**,
including the reverse case of `api/` being excluded, which would silently stop the Edge
Functions deploying.

**Owner dependency:** none for the rule. **Verification dependency:** the 404 cannot exist
before a deployment, so effect is unverified and is not claimed.

## PMRT-2 — building the review package re-opened PMRT-1

**Severity: HIGH. CONFIRMED. REMEDIATED. Found and fixed in the same cycle.**

Assembling `docs/manifest-independent-review/package/` **copied
`tools/validate-manifest.js` and the schema into `docs/`**, which `.vercelignore` did not
cover. The exclusion was defeated by a copy rather than by an edit, minutes after being added.

**Remediation:** the package directory excluded, **and the guard extended to walk the tree for
protected filenames appearing outside every exclusion rule**. Verified by copying
`validate-manifest.js` to the repository root: the guard fires.

**This is the more instructive of the two.** A path-based exclusion protects a path, not a
file, and the failure mode is duplication.

## PMRT-3 — a relabelled canonicalization PASSED validation

**Severity: MEDIUM. CONFIRMED. REMEDIATED.**

Setting `integrity.canonicalization` to `JCS/RFC8785` caused the validator to skip the
integrity check and report the manifest **valid**. A compliance claim was passing **because**
it could not be verified.

**Remediation:** fail closed. An unimplemented canonicalization is now a validation error:
*unverifiable is not valid.*

## PMRT-4 — my own prohibited-term scan produced a false positive

**Severity: LOW. NOT A DEFECT IN THE ARTIFACT. Recorded because the pattern repeats.**

A naive substring scan of the example manifest reported the term `validated`. Both occurrences
are innocent: the engine version string `0.1.0-validation`, and the human-review reason *"is
**not** established as validated"*, which is a negation.

**This is the same defect a previous red-team pass caught in a guard of mine that flagged
"legally defensible" inside a disclaimer.** A substring cannot distinguish a claim from its
denial. The scan was not turned into a guard, for that reason.

---

## §49 attack results

| # | Attack | Result |
|---|---|---|
| 1 | Manifest integrity | **REFUSED.** Field change without rehash fails; canonicalization relabel now fails (PMRT-3) |
| 2 | Source correspondence | **REFUSED.** Nine source-hash and truncation attacks all rejected |
| 3 | Version separation | **REFUSED.** Removing `jrs_version`, `codebook_version` or `engine.version` fails |
| 4 | Codebook mapping | **REFUSED.** Builder throws; validator rejects a hand-set `jrs_codebook_1.0` |
| 5 | Routing mapping | **REFUSED.** No translation table exists |
| 6 | Content classification | **REFUSED.** Derived, not caller-asserted |
| 7 | Human-review bypass | **REFUSED.** `false` without a reason rejected |
| 8 | Legal-language insertion | **REFUSED.** Six prohibited fields rejected by a sealed root |
| 9 | Authentication implication | **NOT REPRODUCED.** Unsigned reports self-consistent, never authentic |
| 10 | Validation implication | **NOT REPRODUCED** (see PMRT-4 for the false positive) |
| 11 | Public/private leakage | **CONFIRMED twice** — PMRT-1, PMRT-2. Both remediated |
| 12 | Deployment packaging | **CONFIRMED** — PMRT-1 |
| 13 | Data-minimization claims | **HOLDS.** Six synthetic identifiers absent from every fixture |
| 14–16 | Privacy, security, API claims | **UNCHANGED.** `openapi.json` untouched |
| 17 | Historical preservation | **HOLDS.** No prior report overwritten |
| 18 | Register integrity | **HOLDS.** No competing registry created |
| 19 | Blocker closure logic | **HOLDS.** No blocker moved to CLOSED |
| 20 | Production authorization logic | **HOLDS.** NOT AUTHORIZED throughout |

## Test totals

Manifest suite **63 checks, 0 failed** (was 39). Guard suite **134 checks, 0 failed, 1
skipped**. **Sixteen guard mutations across three guards, all fail correctly.**

---

# ADDENDUM 2026-09-15 — a red-team finding that was itself partly wrong

**Nothing above is edited.**

A later adversarial pass raised finding #7: that the guard figure "135, 0 failed, 1 skipped"
was unreproducible, that the suite prints **131 checks, 0 failed, 2 skipped**, and that *"131 is
the ceiling in any mode"* because `len(results)` includes skips and only three `if offline`
branches exist.

**The observation was right and the inference was wrong.**

| Mode | Result |
|---|---|
| `python3 scripts/check_zero_drift.py` | **135 checks, 0 failed, 1 skipped** |
| `python3 scripts/check_zero_drift.py --offline` | **131 checks, 0 failed, 2 skipped** |

**Three checks are online-only** and are not registered at all in offline mode: *countries
belong to completers, not all reviewers*; *live /api/asset-stats exposes link_clicks*; *live
panel geo fully resolved*. The pass ran only `--offline`, so 131 was the only figure it could
see.

**MY OWN HANDLING WAS WORSE THAN THE FINDING.** On receiving it I rewrote 135 to 131 across
four documents **before verifying the online figure**, which replaced a correct number with an
incorrect one. That is the failure mode this project exists to catch, committed while
responding to a report about exactly that failure mode. Reverted, and every figure now **states
its mode**, which neither version did.

**One further observation, recorded because it is unresolved:** a single online run during this
work reported **136 checks, 1 failed**. Two immediate re-runs reported 135/0/1. The failing
check was not captured. **NOT ESTABLISHED** whether that was a flaky live probe or something
real. A figure that moves between runs is itself a defect in the evidence, and it is recorded
rather than averaged away.
