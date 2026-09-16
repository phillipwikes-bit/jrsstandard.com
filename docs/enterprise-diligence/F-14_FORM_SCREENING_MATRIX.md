# F-14 — Pilot Form Screening Matrix

**STATUS: MAPPED. NOT CHANGED. OWNER DECISION REQUIRED.**

---

| Field | User controlled | Screened | Destination | Failure behaviour | Tested |
|---|---|---|---|---|---|
| `message` (textarea) | yes | **YES**, ahead of both destinations | Supabase `pilot_contacts` **and** Formspree | **Fails open** twice | **12/12 browser cases** |
| `name` (required input) | yes | **NO** | Both | n/a | no |
| `email` (input) | yes | **NO** | Both | n/a | no |
| `organization` (input) | yes | **NO** | Both | n/a | no |

## The two fail-open paths, both deliberate

```js
if (msgVal && typeof jrsSanitizeCheck === 'function' && !jrsSanitizeCheck(msgVal)) { return; }
} catch (scr) { /* a screen that throws must not block a submission */ }
```

1. The `typeof` test **silently skips** the screen if the function is absent.
2. The `catch` lets an unscreened submission proceed **by design**.

**Both were deliberate choices and both are defensible in isolation**: a broken screen should
not break a contact form. **Combined with a published promise that the screen ran, the design
is wrong in one direction or the other** — either the screen must block, or the promise must
not claim it ran.

**As of 2026-09-16 the promise has been narrowed**, so the pairing is no longer false. The
fail-open behaviour remains, now accurately described.

## The three unscreened fields

`name`, `email` and `organization` are **inputs the user fills with their own details**, and
`email` is *expected* to contain an email address. **Running an email-pattern screen on an
email field would prompt on every correct submission**, which is why "screen everything
identically" is the wrong instinct here.

**The minimum necessary correction is not obvious**, which is precisely why it is an owner
decision rather than an engineering default.

## Adversarial tests required if the owner chooses to widen

Blocked identifier in `message` (**done, passing**) · in `name` · in `email` · in
`organization` · sanitizer exception · missing sanitizer · malformed input · clean submission
(**done**) · dismissal (**done, 0 POSTs**) · duplicate submission.

## Owner decisions

1. Screen `name`, `email`, `organization`? (Note the email-field paradox above.)
2. Fail **closed** when the screen cannot run, or keep failing open and say so?

**Neither was decided here.**
