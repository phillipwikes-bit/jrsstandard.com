# D-14 — Sensitive-Identifier Screen: Path Verification

**Date:** 2026-09-15 · **Status: REMEDIATED AND TESTED — NOT VERIFIED IN PRODUCTION, NOT DEPLOYED**

---

## The defect

`privacy.html` §2 tells readers: *"Free-text fields you submit pass a sensitive-identifier
screen in your browser before they are sent."*

**FACT.** The `message` textarea on `pilot.html` was submitted with **no** `jrsSanitizeCheck`
call. The only two occurrences in the file were the definition and a call belonging to a
different widget. **A published privacy promise did not run where a visitor types free text.**
This is also a CLAUDE.md §36.6 breach.

**Worse than first recorded:** that field reaches **two** destinations, Supabase
`pilot_contacts` **and** Formspree.

## Was reuse safe?

**Yes, and it was checked rather than assumed.** `jrsSanitizeCheck(text)` is a pure function
returning a boolean, already defined in the page at top level of its script block, so it is
global and reachable from the later block. It detects email, phone, SSN and card patterns and
raises a `confirm()`. **No new detection algorithm was invented**, which §15 of the directive
forbids.

One latent hazard was checked: the patterns carry the `/g` flag, and `RegExp.test()` with `/g`
is stateful through `lastIndex`. The array is rebuilt inside the function on every call and
each pattern is tested once per call, so no state survives. **Safe as written.**

## Placement, and why it is above the Supabase write

The call sits immediately after `e.preventDefault()`, **before** the Supabase write and
**before** the Formspree POST. Screening only the Formspree call would have left the promise
false for the other half of the submission. A `typeof` guard and a `try/catch` wrap it, so a
screen that failed to load cannot block a submission.

## Tests — real browser, real submission path

Playwright, Chromium, page served over HTTP. Both destinations intercepted and counted.

| Case | Prompt | Decision | POSTs | Result |
|---|---|---|---|---|
| Clean text | no | n/a | 2 (Supabase + Formspree) | PASS |
| Email address | yes | dismiss | **0** | PASS |
| Email address | yes | accept | 2 | PASS |
| Phone number | yes | dismiss | **0** | PASS |
| Phone number | yes | accept | 2 | PASS |
| SSN | yes | dismiss | **0** | PASS |
| SSN | yes | accept | 2 | PASS |
| Card number | yes | dismiss | **0** | PASS |
| Card number | yes | accept | 2 | PASS |
| Two identifiers at once | yes, both labelled | dismiss | **0** | PASS |
| Two identifiers at once | yes | accept | 2 | PASS |
| Empty message | no | n/a | 0 | PASS |

**12 of 12.** The decisive row is **dismiss → 0 POSTs**: neither destination receives
anything, which is what makes the published sentence true.

**A test expectation of mine was wrong and is recorded rather than quietly fixed.** The empty
case first read as a failure. The `message` field carries `required`, so the browser blocks
submission before the handler runs. The code was right; the expectation was not.

## Test classification, per §30

| Type | Done | Note |
|---|---|---|
| Unit | Implicit | `jrsSanitizeCheck` exercised through the real path rather than in isolation |
| Integration | **Yes** | Real form, real handler, both destinations observed |
| Adversarial | **Yes** | Four identifier classes, a combined case, and dismissal |
| Representation | **Yes** | The published §2 sentence is the assertion under test |
| Regression | **Partial** | Clean text still reaches both destinations. Full-suite regression: 132 checks, 0 failed |

## What is NOT established

That the screen catches every sensitive identifier. It detects four pattern classes. **It is a
prompt, not a filter**, and a determined submitter can accept the dialog. The public sentence
claims a screen, which is what exists. It does not claim prevention, and it must not be
widened to.

**Production behaviour is unverified** because nothing is deployed.
