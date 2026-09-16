# B-005 — Scope Reconciliation

**STATUS: REOPENED as REMEDIATED FOR THE API RUNTIME ONLY — scope corrected, not closed.**

---

## What B-005 actually required

Original: *"`claude-haiku-4-5-20251001` is pinned in the Review Engine as if permanent. Make the
identifier configurable with a documented default and a recorded review date."*

**The blocker names "the Review Engine".** It does not say "every occurrence of the string in
the repository". The scope question is which of those was meant.

## Every occurrence, classified

| Location | Kind | In scope? |
|---|---|---|
| `api/_model.js` | **Runtime configuration.** Default + override + review date + change record | **Yes — this is the remediation** |
| `api/review.js`, `api/review-engine.js`, `api/v1/review-engine.js`, `api/sandbox.js` ×2, `api/bench-admin.js` | Six call sites, now `jrsModel()` | **Yes — remediated** |
| **`supabase/functions/run-study/index.ts:38, :75`** | **Live hard-coded literals in a second Anthropic-calling engine** | **YES — and NOT remediated** |
| `review-engine.html:379` | **Published example response** in API documentation | **No.** An example showing what the API returns should show a real value |
| `api/_model.js` comments, `MODEL_CHANGE_RECORD` | Documentation of the default | **No.** That is the point of the file |

## The correction

**OLD FINDING:** "Six literals across five files reduced to zero outside that module."
**NEW EVIDENCE:** two live literals in `supabase/functions/run-study/index.ts`.
**CORRECTED STATUS:** **zero literals remain in `api/`**. B-005 is remediated **for the API
runtime** and **not** for the research route.
**EXPLANATION:** the census was written as a repository-wide claim and executed as an `api/`
scan. Found by an adversarial pass 2026-09-15.

## Why the research route was not "fixed"

`supabase/functions/run-study/index.ts` is a **Supabase Edge Function deployed by a different
toolchain**, and the nightly cron in `vercel.json` calls `/api/run-study` instead, so **this
implementation is not the one that runs**. The studies are also closed
(`STUDIES_CLOSED = true` since 2026-08-21).

Editing a dormant second engine to remove a literal would be tidying, not remediation, and it
would touch a **research artifact**. The file has instead been **excluded from the Vercel
deployable set** (B-014), which addresses the exposure its source presented.

**OWNER DECISION:** whether B-005's scope includes the dormant research route. If it does, the
literals need extracting there too. If it does not, **B-005 is remediated as scoped and should
say "in the API runtime" wherever it is stated.**

## What was NOT done

**No research reference was deleted to make the repository look clean.** The published example
in `review-engine.html` was left alone: an API example that showed a placeholder instead of the
real model identifier would be less useful and arguably less honest.
