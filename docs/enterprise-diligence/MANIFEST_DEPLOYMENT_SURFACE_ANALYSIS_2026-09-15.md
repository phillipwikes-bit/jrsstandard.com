# Manifest Deployment Surface Analysis

**Date:** 2026-09-15 · **Method:** static configuration analysis plus a live read-only probe
of an **existing** served file. **Nothing was deployed to answer this question.**

---

## The question

The previous red-team pass flagged that `lib/manifest/`, `tools/` and `tests/manifest/` sit in
a repository that deploys to a public host, and that **nobody had checked whether they would
be served**. It recorded this as unverified rather than assuming it was safe.

## The answer: they would have been served

**FACT, from `.vercelignore` as it stood at commit `5e4c01a`:** `lib/`, `tools/`, `tests/` and
`schemas/` appeared **nowhere** in it. The file excludes `*.md`, `research/`,
`docs/enterprise-diligence/`, `cep-article-prep/`, `scripts/`, `build/`, `*.docx`, `*.csv`,
`templates/`, `standard/`, `.jrs/`, `.claude/` and `__pycache__/`. **A `.js` under `lib/` or
`tools/` matched none of those rules.**

**FACT, verified on production 2026-09-15 rather than inferred from documentation:**

| Path | Result | What it establishes |
|---|---|---|
| `/openapi.json` | **200**, `application/json` | A root `.json` not in `.vercelignore` **is served** |
| `/openapi-review-engine.json` | **200**, `application/json` | Same, confirmed twice |
| `/CLAUDE.md` | 307 | The `*.md` rule plus the redirect works |
| `/scripts/check_zero_drift.py` | 307 | An excluded directory is not served |
| `/.jrs/state/BLOCKERS.json` | 404 | An excluded directory is not served, including `.json` |
| `/standard/jrs-conditions.json` | 404 | An excluded directory is not served |

**The mechanism is demonstrated on a file that already exists.** `openapi.json` proves that a
non-excluded static file at a path is fetchable. `lib/manifest/build.js` would therefore have
been fetchable at `/lib/manifest/build.js` on the next deployment.

## Classification

| Path | Before this cycle | After |
|---|---|---|
| `lib/manifest/` | **PUBLICLY SERVABLE** on next deploy | **EXCLUDED BY CONFIGURATION** |
| `tools/` | **PUBLICLY SERVABLE** on next deploy | **EXCLUDED BY CONFIGURATION** |
| `tests/manifest/` | **PUBLICLY SERVABLE** on next deploy | **EXCLUDED BY CONFIGURATION** |
| `schemas/` | **PUBLICLY SERVABLE** on next deploy | **EXCLUDED BY CONFIGURATION**, pending a publication decision |
| `api/` | Executed as Edge Functions, not served | unchanged, and **must stay unexcluded** |

**REQUIRES DEPLOYMENT VERIFICATION:** that the new exclusions take effect. A `.vercelignore`
rule is evidence of intent; the 404 is evidence of effect, and that cannot exist before a
deployment. **No production verification is claimed.**

## Why `schemas/` is excluded too, and why that is not over-protection

The schema is a **good publication candidate**. *Publicize the standard, protect the
implementation* points toward publishing it.

But publishing is a Section 23 act requiring human approval, and this repository already
applies exactly that reasoning to `standard/jrs-conditions.json`, which is excluded with the
note that the rule should be *removed deliberately rather than by accident*. The same rule is
applied here for the same reason. **Removing the `schemas/` line IS the act of publishing**,
and should be a recorded decision.

**This is not a decision to keep the schema secret.** It is a decision not to publish it by
side effect. **OWNER ACTION: decide whether to publish the schema.**

## Residual risk

The exclusions are a **build-time upload rule**, not an access control. They stop the files
being uploaded at all, which is stronger than a redirect. But they protect **only what is
listed**: a future directory added outside the list is public by default. The new guard
`check_manifest_implementation_is_not_deployable` fires if any of the four lines is removed,
and also if `api/` is ever added, which would silently stop the Edge Functions deploying.

**STATUS: REMEDIATED (configuration) — REQUIRES DEPLOYMENT VERIFICATION.**
