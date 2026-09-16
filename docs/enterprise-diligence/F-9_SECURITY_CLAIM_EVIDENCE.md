# F-9 — Security Claim Evidence

**Claim under test, `security.html:292` as written before 2026-09-16:**

> "A stored row **cannot** quote your record verbatim, and it is not intended to."

**STATUS: CORRECTED. The claim was not supported.**

---

## The full path, traced

| Stage | What exists | Enforces "cannot"? |
|---|---|---|
| Prompt | `api/review-engine.js:48` instructs a note "grounded in the record text"; `:65` requests a `compliant_version` | **No.** An instruction to a model is not a control |
| Model behaviour | Produces a rewrite of the passage | **No.** Non-deterministic and not constrained |
| Truncation | `.slice(0, 600)` at `:147` | **No.** A length cap, not a content check |
| Storage | Written verbatim as returned, into `engine_reviews` | **No** |
| Retrieval | `engine-activity.html` renders `compliant_version` publicly | **No** |

**Repository-wide search for a verbatim, overlap or similarity check in the engine: zero
occurrences.**

## Why "cannot" was the wrong word

"Cannot" asserts a capability of the system. **Nothing implements it.** A 600-character
"suggested rewrite of the passage" will routinely retain clauses from the passage it rewrites,
because that is what rewriting is. The same paragraph then correctly told the reader to *"treat
that as retained record-derived content"* — so the two halves of the paragraph contradicted
each other.

## Corrected wording, now live in the candidate

> "A stored row is not designed to reproduce your record, and no row holds it. But **nothing in
> the implementation prevents a suggested rewrite from retaining phrasing from the passage it
> rewrites**: the only controls are an instruction to the model and a 600-character limit.
> There is no verbatim check."

**This describes behaviour, not aspiration**, and it does not replace one unsupported absolute
with another: it states what exists and names what does not.

## What was NOT done

No verbatim filter was built. Building one to make a sentence true would be the wrong order,
and a reliable one is not a small piece of work. **If the owner wants the stronger property,
that is a feature decision with a real cost, not a wording fix.**

**STATUS: REMEDIATED (development) — PRODUCTION NOT TESTED.**
