# Pre-Deployment Verification Matrix — 2026-09-15

**None of these is VERIFIED. Development evidence is development evidence.**

| Control | Development evidence | Production evidence required | Current state |
|---|---|---|---|
| **B-005** model configuration | `jrsModel()` returns the prior literal byte-identically with no override; override path exercised; **0 literals remain**; six call sites; all files parse | A live engine response whose `model` field reads `claude-haiku-4-5-20251001`, confirming the deployed default is unchanged | **REMEDIATED — NOT VERIFIED** |
| **B-008** validation disclosure | Four propositions present on all three pages that call `/api/review`; guard with 6 mutations | The three pages served from production carrying the text; byte comparison against the commit | **REMEDIATED — NOT VERIFIED** |
| **B-009** processor disclosure | Every active, dormant, closed and unreachable destination named on `privacy.html`; fail-closed inventory guard over 21 hosts | `privacy.html` served from production carrying the disclosure | **REMEDIATED — NOT VERIFIED** |
| **D-11 / D-15** engine and security representation | Corrected across `review-engine.html` and `security.html`; Anthropic named; retention stated | Both pages served from production with the corrected text | **REMEDIATED — NOT VERIFIED** |
| **D-13** free check | `terms.html` and `engagement.html` aligned to `check.html`'s own accurate wording | Both pages served | **REMEDIATED — NOT VERIFIED** |
| **D-14** sanitize screen | **12/12 browser cases; dismissal produces 0 POSTs to either destination** | The live form: prompt fires, dismissal writes no `pilot_contacts` row and delivers no Formspree message | **REMEDIATED — NOT VERIFIED** |
| **Deployment exclusions** | Five paths excluded; guard with 10 evasion routes | **`/lib/manifest/build.js`, `/tools/validate-manifest.js`, `/schemas/...json` return 404**, and `/api/...` still responds | **REMEDIATED IN CONFIGURATION — NOT VERIFIED** |
| **Outbound inventory** | 21 destinations; fail-closed guard; 5 mutations | No new destination observable in live page loads | **REMEDIATED — NOT VERIFIED** |

## What cannot be verified before deployment, and why

**Every row above.** Each concerns what production serves or does, and production currently
serves `0d94ce6`, which predates all of it.

**The deployment-exclusion row is the sharpest case.** `.vercelignore` is a **build-time upload
rule, not an access-control system**. The rule is evidence of intent. Only a 404 from a live
URL is evidence of effect, and that 404 cannot exist until a deployment has happened.

## The circularity, stated plainly

**Verification requires deployment. Deployment requires owner authorization. Authorization
should follow evidence.** The evidence that is obtainable before deployment is now obtained;
the rest is obtainable only after.

**That is not an argument for deploying to get the evidence.** It is the reason the readiness
determination turns on B-001, B-013 and counsel matters rather than on test counts.
