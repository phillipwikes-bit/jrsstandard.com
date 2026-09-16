# Sensitive-Identifier Screen — Coverage Matrix

**Finding F-8 / F-14 · 2026-09-16 · Built from the code, not from the promise.**

`privacy.html` §2 states: *"Free-text fields you submit pass a sensitive-identifier screen in
your browser before they are sent…"*

**That is broader than what executes.** 17 pages carry a `<textarea>`. **7 invoke the screen
zero times.** Several of the remaining 10 invoke it once while carrying three or four fields.

---

## Coverage

| Page | Free-text fields | Screen invocations | Screened field(s) | Status |
|---|---|---|---|---|
| `pilot.html` | `message`, plus `name`, `email`, `organization` (inputs) | 2 | `message`, `selected.value` | **PARTIAL.** F-14: three inputs unscreened |
| `index.html` | `note`, `obs-note`, **`review-input`** | 1 | `obs-note` | **PARTIAL.** The record-paste field is **not** screened |
| `training.html` | **`pa-input`**, `poll-comment`, `sq6`, `sq7` | 1 | `cert-name` | **PARTIAL.** The record-paste field is **not** screened |
| `submit-record.html` | `text` | 1 | `t` | **COVERED** |
| `submit-validation.html` | `record`, `notes` | 1 | `record` | **PARTIAL** |
| `coauthor.html` | `note` | 1 | `noteVal` | **COVERED** |
| `finding.html` | `resp-text` | 1 | `val` | **COVERED** |
| `review-engine.html` | `sb-text`, `note` | 1 | sandbox text | **PARTIAL** |
| `ai-records-arm-b.html`, `ai-records-pilot.html` | per-record notes | 1 | note | **COVERED** |
| **`enterprise.html`** | `note` | **0** | — | **NOT COVERED** |
| **`org-pilot.html`** | `sb-text`, `p-text` | **0** | — | **NOT COVERED** |
| **`recheck.html`** | `r-fam`, `why-*` | **0** | — | **NOT COVERED** |
| **`honor.html`** | `h-quote` | **0** | — | **NOT COVERED** |
| **`bench-review.html`** | `rn` | **0** | — | **NOT COVERED** (study closed) |
| **`bench-admin.html`** | `rtext` | **0** | — | **NOT COVERED** (owner surface) |
| **`vp-7c1f9a4e8d2b6035.html`** | `record` | **0** | — | **NOT COVERED** (confidential buyer) |

## The two that matter most

**`index.html` `review-input` and `training.html` `pa-input` are the record-paste fields.** They
POST the pasted record to `/api/review`, and they are precisely where a user is most likely to
paste an identifier. **Neither is screened.** The candidate inserts its new "Validation status"
block directly adjacent to both, which is how the gap was found.

## Can the existing screen be applied?

**Technically yes.** `jrsSanitizeCheck(text)` is a pure boolean function already present on
those pages. **No new detection algorithm would be invented**, which §11 forbids.

**But widening it is a behaviour change on up to 17 live pages**, including a `confirm()`
dialog on every record paste that matches one of four patterns. That is a material change to
how live pages behave, on pages the candidate does not otherwise touch, and three of the
uncovered pages are a research instrument, an owner surface and a confidential buyer surface.

**It is therefore recorded as an owner decision, not taken unilaterally.**

## What was done instead, now

**The public promise was narrowed to match what executes.** A privacy statement that is
broader than its implementation is the defect; making the statement true is the correction that
is unambiguously within authority and does not alter any live behaviour.

## What the screen is, and is not

It matches **four patterns**: email, phone, US SSN shape, card-number shape. It raises a
`confirm()`. **It is a prompt, not a filter** — a user who accepts still sends. **It is not a
PII detection system and must never be described as one.**

## F-14 — the pilot form fails open twice

```js
if (msgVal && typeof jrsSanitizeCheck === 'function' && !jrsSanitizeCheck(msgVal)) { return; }
} catch (scr) { /* a screen that throws must not block a submission */ }
```

The `typeof` test skips the screen silently if the function is absent; the `catch` lets an
unscreened submission proceed **by design**. Both were deliberate — a broken screen should not
break a contact form — **but combined with a promise that the screen ran, the design is wrong
in one direction or the other.**

**OWNER DECISION:** fail closed under a promise, or keep failing open and say so.

## Owner decisions arising

1. **Widen the screen** to the record-paste fields and the seven uncovered pages, accepting a
   `confirm()` on those surfaces? Or leave coverage as it is, now that the promise matches it?
2. **`pilot.html` name, email and organization** — screen them, or state that only the message
   is screened?
3. **Fail-open behaviour** — keep it, or block submission when the screen cannot run?

**None of these was decided here.**
