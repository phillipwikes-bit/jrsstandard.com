# B-006 — Execution Record

**STATUS: NOT EXECUTED.** This template is empty by design. **The existence of the procedure is
not evidence that it ran.**

---

| Field | Value |
|---|---|
| Execution date | *(unfilled)* |
| Operator | *(unfilled)* |
| Environment | *(unfilled — the owner's own shell, with a rotated `VERCEL_TOKEN` exported)* |
| Command | `bash scripts/vercel_f4_diagnose.sh` |
| Prerequisite | **B-001 confirmed.** The exposed token must not be used |
| Expected result | One of the four outcomes below |
| **Actual result** | *(unfilled)* |
| Evidence | *(paste the script output, which carries no credentials)* |
| Interpretation | *(unfilled)* |
| Limitations | *(unfilled)* |
| **Resulting status** | *(unfilled)* |

## The four outcomes

| Observation | Root cause | Status |
|---|---|---|
| **No deployment record exists for `c08b48a`** | Trigger, not build | **RESOLVED** |
| Record exists, state `CANCELED`, ignore-step reason | A dashboard Ignored Build Step, now overridden by `ignoreCommand: exit 1` | **RESOLVED** |
| Record exists, state `ERROR` | Build failure, and the green check reported the wrong thing | **RESOLVED** |
| `paused: true` at the relevant time | Project paused | **RESOLVED** |
| **Retention aged out the records, or no state reason is given** | — | **NOT ESTABLISHED — FAILURE MODE CONTROLLED** |

**If the output distinguishes none of the first four rows, the answer is the fifth.** Do not
select the most plausible cause. The failure is already prevented and detected regardless of
cause, which is why B-006 is LOW severity.

## What must not be recorded here

The token, any fragment of it, or any hash of it. **The script reads the credential from the
environment, contains no secret and prints none**, so its output is safe to paste.
