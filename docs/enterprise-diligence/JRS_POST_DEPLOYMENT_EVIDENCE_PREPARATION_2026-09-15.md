# Pre-Deployment Evidence Preparation — 2026-09-15

**Purpose: make the evidence sufficient for an informed owner decision about whether deployment
should occur. Not to deploy.**

---

## §9 Independent Review Package — final audit

The package contains **six files and nothing else**: `README.md`, `EXPECTED.md`, `schema.json`,
`validate-manifest.js`, `example.manifest.json`, `source.txt`.

**Searched for and NOT found:** generator source, internal test harness, private fixtures,
secrets, credentials, buyer information, deployment configuration, confidential research
material, internal table names, opaque owner or buyer slugs.

The validator is in the package **by design** — a reviewer cannot verify anything without it,
and it is the offline validator rather than the generator. The generator, which contains the
refusal logic and the internal structure, is **not** included.

**STATUS: package contents are as intended.** No STOP condition arose.

## §13 Build-artifact inspection — a definite answer

**FACT: there is no build step.** `vercel.json` declares no `buildCommand`, no `builds` and no
`framework`, and there is **no `package.json`**. The site is static with Edge Functions under
`api/`.

**Therefore the deployable artifact is the repository contents minus `.vercelignore`.** There
is no build output to inspect, and no bundler that could pull an excluded file into an output
directory.

**This makes the exclusion model simpler and the duplication risk sharper.** With no build
step, nothing is transformed, so a file is either excluded or it is served as-is. That is why
the guard now matches on content signature: the only realistic evasion is a copy.

**BUILD ARTIFACT EVIDENCE ≠ PRODUCTION VERIFICATION.** Neither is claimed.

## §12 Deployment-surface guard — six conditions

| Condition | Detected |
|---|---|
| Protected directory removed from `.vercelignore` | **Yes** — 5 mutations |
| Protected file copied elsewhere | **Yes** |
| Protected filename in a public directory | **Yes** |
| Protected implementation in build output | **N/A — no build output.** Recorded rather than left blank |
| `api/` accidentally excluded | **Yes** — would silently stop the Edge Functions deploying |
| New protected implementation not in the exclusion model | **Partially.** Content signatures catch copies of the five known files. **A genuinely new implementation file under a new directory is NOT automatically detected** |

**That last row is an honest limitation, not a passing grade.** The guard defends the files
that exist. A new `lib/something-else/` would need adding to the model.

## §33 Outbound destination control

`.jrs/registries/OUTBOUND_DESTINATIONS.json` holds **21 classified destinations**: 6 ACTIVE,
2 CLOSED_RESEARCH, 2 DORMANT, 10 REFERENCE_ONLY, 1 ATTEMPTED_UNREACHABLE.

The guard **fails closed** on any host not in the inventory, and asserts the two code flags the
classifications depend on: `STUDIES_CLOSED = true` and `ALERTS_ENABLED = false`. **Five
mutations fail correctly**, including silently reactivating OpenAI by flipping
`STUDIES_CLOSED`.

**OpenAI and Google Generative Language remain CLOSED_RESEARCH, not ACTIVE.** A live cron and
a present credential are not evidence of an active processor.

## §18 Prohibited-term guard — deliberately NOT built

A naive substring scan flagged `validated` in the example manifest. Both hits are innocent: the
version string `0.1.0-validation`, and *"is **not** established as validated"*, **a negation**.

**This is the second time a substring check of mine has flagged a disclaimer as a claim.** The
first was `legally defensible` inside "does not determine whether ... legally defensible".

**No automated claim-detection guard was built**, because it cannot reliably distinguish
assertion from negation, historical reference, technical identifier, quotation and disclaimer.
**Keeping it as a human-review scan is the correct outcome, and false-positive governance is
worse than none.**
