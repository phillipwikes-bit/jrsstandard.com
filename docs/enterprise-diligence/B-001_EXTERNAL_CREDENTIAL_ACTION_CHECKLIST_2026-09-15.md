# B-001 — External Credential Action Checklist

**For Phillip Wikes. This is the single highest-value action available, because it gates ten
completed remediations.**

**STATUS: OPEN / OWNER ACTION REQUIRED. It is not resolved, and this document does not
resolve it.**

---

## What happened

On 2026-09-14 a live Vercel API token was pasted into conversation, twice. **A credential in a
transcript is exposed by that act**, regardless of whether anyone used it. It is in the
transcript, in session logs, and in any shell history that captured it.

**What was NOT done, deliberately:** the token was never run, never tested, never reconstructed,
never written to disk and never committed. A pattern scan across the whole tree returns **zero**
token-shaped strings. No replacement was ever requested, and none should be pasted anywhere.

## What you need to do, outside this repository

1. Vercel → **Settings → Tokens**. Revoke the exposed token.
2. Issue a replacement **with the narrowest scope that works**.
3. Put it in your own shell only: `export VERCEL_TOKEN=...`. **Never in a chat window, never
   in a file, never in a commit.**
4. Optional but useful: set the repository secret `VERCEL_DEPLOY_HOOK_URL` so a skipped
   deployment re-triggers itself instead of only failing loudly.

## What evidence to record, and what not to record

**Record:** the date of revocation, the date of reissue, and the scope of the new token.

**Do NOT record anywhere:** the old token, the new token, any fragment of either, or a hash of
either. **A hash of a credential is still a credential artifact.**

Reply with words to this effect, and nothing more:

> "Vercel token revoked and reissued on <date>. Scope: <scope>."

## What changes when you confirm

| Item | Now | After your confirmation |
|---|---|---|
| **B-001** | OPEN / OWNER ACTION REQUIRED | **REMEDIATED** on owner confirmation. Not VERIFIED: the repository cannot see Vercel |
| **B-006** | BLOCKED | **UNBLOCKED.** `scripts/vercel_f4_diagnose.sh` can then run from your shell and answer the 13 September silent-skip question |
| **B-005** | REMEDIATED — DEPLOYMENT BLOCKED | Deployment condition 1 satisfied |
| **B-008, B-009, D-10 to D-17** | REMEDIATED — NOT DEPLOYED | Become deployable, subject to your separate deployment authorization |

**Confirmation alone does not authorize deployment.** It satisfies one prerequisite.

## Why the repository cannot close this itself

**FACT: no repository evidence can establish that an external credential was rotated.** The
rotation happens in Vercel's account system. Nothing in git, no test and no guard can observe
it. **That is why this stays OWNER ACTION and why it has not been quietly downgraded.**
