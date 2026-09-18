# B-006 — Diagnostic Procedure

~~**STATUS: OPEN.** Not `DIAGNOSTIC READY` — that status requires B-001 confirmation first~~ **STATUS UPDATED 2026-09-18: `DIAGNOSTIC READY — NOT EXECUTED`.** B-001 is OWNER-CONFIRMED (E-030), so the stated prerequisite is satisfied. The procedure has still **not been run**, and running it is an owner action in the owner's own shell.
because the procedure cannot run without a rotated credential.

**The diagnostic has NOT been executed. The existence of `scripts/vercel_f4_diagnose.sh` is not
evidence that it ran.**

---

## What is unresolved

On 13 September 2026 a merge to `main` reported green, every route returned 200, and **the
deployment never ran**. The failure mode is now **prevented** (`vercel.json` declares
`"ignoreCommand": "exit 1"`) and **detected** (`.github/workflows/deploy-verify.yml`
byte-compares production on every push).

**Prevention and detection are not root cause.** B-006 is the root-cause question and it
remains **NOT ESTABLISHED**.

## Prerequisite

**B-001 confirmed.** A rotated `VERCEL_TOKEN` exported in Phillip's own shell. The exposed
token must not be used, and the replacement must never enter this repository or any chat.

## Exact command

```
export VERCEL_TOKEN=<the rotated token, in your shell only>
bash scripts/vercel_f4_diagnose.sh
```

The script reads the credential from the environment, **contains no secret and prints none**.

## What it reports

`commandForIgnoringBuildStep`, `paused` and `live` on the project; every production deployment
around 12 to 14 September with state, sha and branch; **whether any deployment record exists
for `c08b48a` at all**; and the build events for the newest production deployment.

## What constitutes evidence

| Observation | Conclusion |
|---|---|
| **No deployment record exists for `c08b48a`** | The build was never triggered. **Root cause: trigger, not build** |
| A deployment record exists with state `CANCELED` and an ignore-step reason | **Root cause: a dashboard Ignored Build Step**, which `ignoreCommand` now overrides |
| A deployment record exists with state `ERROR` | **Root cause: build failure**, and the green check was reporting the wrong thing |
| `paused: true` at the relevant time | **Root cause: project paused** |

## What constitutes INCONCLUSIVE evidence

Retention having aged out the 13 September records; a deployment record with no state reason;
or any result that distinguishes none of the four rows above.

**If the result is inconclusive, the correct status is `NOT ESTABLISHED — FAILURE MODE
CONTROLLED`.** Do not select the most plausible row. The failure is prevented and detected
regardless of cause, which is why this is LOW severity and not urgent.

## Status transitions

`OPEN` → `DIAGNOSTIC READY` (B-001 confirmed) → `DIAGNOSTIC EXECUTED` (output exists) →
`RESOLVED` (one row above is evidenced) **or** `NOT ESTABLISHED — FAILURE MODE CONTROLLED`.

**B-006 does not become RESOLVED because this procedure exists.**
