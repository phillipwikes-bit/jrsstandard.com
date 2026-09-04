# Reviewer System Audit Report

**Target:** `jrsstandard.com` `/reviewer` architecture
**Executed:** 2026-08-10, against live production
**Method:** every check driven against the deployed system. Nothing in this report is read from source and asserted as behaviour, except where the section says it is a source inspection.
**Test hygiene:** all writes tagged `src=verify` or `src=selftest`.

---

## Executive Summary

| Phase | Result |
|---|---|
| 1. Routes and CTA | **PASS**, one gap found and fixed |
| 2. Telemetry and device classification | **PASS**, one defect found and fixed |
| 3. Evaluation and database isolation | **PASS** |
| 4. Certificate and LinkedIn | **PASS** |
| 5. Research baseline integrity | **PASS**, 0 unverified rows |

**7 of 7 routes PASS. 4 of 4 endpoints PASS. Zero leakage between answer rows and contact rows. Research baseline reads 0.**

**Two defects were found by this audit, both in test hygiene rather than in user-facing behaviour, and both are fixed and deployed.** They are described in full below rather than summarised away, because both would have corrupted figures used in acquisition diligence.

---

## Phase 1: Routes and CTA integration

### 1.1 Route availability

| Route | Code | Resolves to |
|---|---|---|
| `/reviewer` | **200** | `/reviewer/index.html` |
| `/reviewer/` | **200** | `/reviewer/index.html` |
| `/reviewer/index.html` | **200** | `/reviewer/index.html` |
| `/reviewer/evaluation.html` | **200** | `/reviewer/evaluation.html` |
| `/reviewer/completion.html` | **200** | `/reviewer/completion.html` |
| `/evaluation` | **200** | `/reviewer/evaluation.html` |
| `/completion` | **200** | `/reviewer/completion.html` |

**7 of 7 PASS.**

### 1.2 CTA tagging and query preservation

| CTA | Target | `access=reviewer` | `focus=1` | source tag |
|---|---|---|---|---|
| Open Module 1 now | `/training.html` | present | present | `src=reviewer-landing` |
| Go straight to the evaluation | `/reviewer/evaluation.html` | n/a | n/a | **was ABSENT** |

**Gap found.** The second CTA carried no source tag, so a visitor who skipped the training and went straight to the instrument was invisible in the funnel. `access=reviewer` and `focus=1` are correctly absent from that link, since both are training-page parameters. Fixed: the evaluation CTA now carries `?src=reviewer-landing`.

### 1.3 Module 1 ungated flow

| Check | Result |
|---|---|
| Training page serves | 200, 279,200 bytes |
| Enrolment overlay default state | `display:none` on load |
| Module 1 markup present without registration | yes |
| Dismissal path present | `dismissEnroll()` |
| Gate copy | "Module 1 is open to read. Register free to unlock all six modules and your certificate." |

**PASS.** Module 1 renders with no email prompt and no account.

---

## Phase 2: Telemetry audit

### 2.1 Field-focus logger, source inspection of `access.html`

| Property | Result |
|---|---|
| Fires `field_touched` | yes |
| `sessionStorage` guard (`jrs-gate-touch`) | yes |
| Second in-memory guard (`if (touched) return`) | yes |
| Sends field **name** | yes (`field_name: id`) |
| Sends any field **value** | **no**, no `.value` read anywhere in the block |
| Fields bound | `f-name`, `f-email`, `f-org`, `f-title`, `c-registry`, `c-contact` |
| Checkboxes bound to `change`, not `focus` | yes |

**PASS.** Two independent guards, and the payload cannot carry user-entered text because the handler never reads an input value.

The checkbox binding matters: a checkbox does not reliably fire `focus` on a touch device, so binding it to `focus` would have silently dropped consent-box interactions from the funnel.

### 2.2 Server-side device classification

Three requests to `/api/access` with distinct User-Agent headers:

| Simulated device | `is_mobile` returned | Expected | Result |
|---|---|---|---|
| iPhone (iOS 18) | `true` | `true` | **PASS** |
| Android (Pixel 8) | `true` | `true` | **PASS** |
| Desktop (macOS Chrome) | `false` | `false` | **PASS** |

Classification is computed server-side from the request header, not accepted from the client, so every row is classified by one rule.

### DEFECT 1, found by this phase and fixed

`/api/access` had **no deploy-check guard**. The first three device tests wrote live rows into gate telemetry. That matters beyond tidiness: `gate-view` rows are the denominator of the conversion figures in `CONVERSION_DIAGNOSTIC_REPORT.md`, so a test view becomes a real visitor who abandoned, and the conversion rate a buyer reads is understated by exactly that much.

Fixed in three parts:

1. Both the `view` and `field_touched` writes now honour `src=verify|test|selftest|owner|deploytest*`.
2. The guarded path still returns a complete valid response **including the computed `is_mobile`**, so the classification remains testable without writing. Re-run under the guard: `{"ok":true,"field_touched":true,"recorded":false,"check":true,"is_mobile":true}` for iPhone and Android, `false` for desktop.
3. The shared purge in `api/contributor.js` clears any test-tagged `gate-view` row. Verified after: **0 test-tagged rows remain** across 101 `gate-view` rows.

### 2.3 Outbound link-open loggers

Source inspection of `/api/contributor` and `/api/honor` GET handlers:

| Property | contributor | honor |
|---|---|---|
| Writes a `view` event before returning the payload | yes | yes |
| Records the participant/honor **code** | yes | yes |
| Key present anywhere in the payload | **no** | **no** |
| Wrapped in `try/catch`, cannot break the page | yes | yes |
| Deploy-check guard | yes | yes |
| Owner-preview suppression (`?owner=1`) | yes | yes |

**PASS on both.** The key never enters the event log, so the telemetry table cannot be reversed into a set of working links.

---

## Phase 3: Evaluation and database isolation

### 3.1 Submission validation

| Test | Response | HTTP |
|---|---|---|
| Complete 9-answer submission with certificate | `answered: 9, total: 9, certificate: true, code: JRS-R-9JM3WJ5T` | **200** |
| Consent omitted | `{"error":"consent_required"}` | **400** |
| No answers | `{"error":"no_answers"}` | **400** |

### 3.2 Injection and malformed payload rejection

Submitted a payload containing `<script>alert(1)</script>`, `DROP TABLE users;`, an out-of-range scale value (`99`), a fabricated sector, a fabricated org size and a fabricated role, alongside **one** valid answer.

```
{"ok":true,"recorded":false,"check":true,"answered":1,"total":9}
```

**`answered: 1`.** Every injected string was dropped and only the single valid answer counted. Answer options are validated server-side against the question set in `api/reviewer-eval.js`, so a hand-crafted POST cannot place free text in the research record. The invalid sector, size and role were likewise dropped to empty.

### 3.3 Table isolation

| | Row 1: `interaction_events` / `reviewer-eval` | Row 2: `pilot_contacts` / `reviewer-cert` |
|---|---|---|
| answers | **carries** | **does not carry** |
| sector, org size, role | carries | does not carry |
| country (2-letter) | carries | carries |
| modules completed | carries | carries |
| name | **does not carry** | carries |
| email | **does not carry** | carries (as the contact column) |
| organization | **does not carry** | carries |
| printed title | **does not carry** | carries |
| completion code | **does not carry** | carries |
| IP address | **not stored** | **not stored** |

**Zero leakage in both directions.** The two rows share no field that links them beyond a coarse timestamp.

On IP: the only network-derived value stored anywhere in the endpoint is the two-letter country code from the Vercel edge header `x-vercel-ip-country`. A naive grep for `ip` matches inside that header name; there is no IP address in any payload.

This separation is the design decision the instrument rests on. Question 2 asks a compliance officer whether their own employer has a formal second reader. Attaching a name to that answer converts a truthful answer into a careful one.

### 3.4 Test guard purge

| Table | Test-tagged rows after this audit |
|---|---|
| `interaction_events` / `reviewer-eval` | **0** |
| `interaction_events` / `reviewer-cert-render` | **0** |
| `interaction_events` / `gate-view` | **0** of 101 |
| `interaction_events` / `field_touched` | **0** |
| `pilot_contacts` | no anonymous read; RLS enforced |

---

## Phase 4: Certificate and LinkedIn

### 4.1 Code validation

| Code | Shape | HTTP |
|---|---|---|
| `JRS-R-9JM3WJ5T` | valid | **200** |
| `JRS-R-ABC123` | valid, minimum length | **200** |
| `NOPE` | malformed | **400** |
| `JRS-R-!!!` | invalid characters | **400** |
| *(empty)* | missing | **400** |
| `JRS-R-TOOLONGTOOLONGXX` | over length | **400** |
| valid code, name omitted | missing required field | **400** |

**7 of 7 PASS.**

### 4.2 Rendering accuracy

| Field | Rendered |
|---|---|
| Kind | Certificate of Completion |
| Name | Audit Tester |
| Title | Compliance Lead |
| Body | "completed the six-module JRS Reviewer Training and submitted the reviewer evaluation, applying the five review conditions…" |
| Completion code | Completion code JRS-R-9JM3WJ5T |
| Date | August 10, 2026 |
| Signature | Phillip Wikes |
| Print stylesheet | present, letter landscape |
| `noindex, nofollow` | present |

### 4.3 LinkedIn Add to Profile

| Parameter | Value | Present |
|---|---|---|
| `startTask` | `CERTIFICATION_NAME` | yes |
| `name` | JRS Reviewer Training and Certificate | yes |
| `organizationName` | Justification Review Standard (JRS) | yes |
| `issueYear` | current year | yes |
| `issueMonth` | current month | yes |
| `certId` | completion code | yes |
| `certUrl` | `https://jrsstandard.com/reviewer` | yes |

All text parameters pass through `encodeURIComponent`.

**Claim accuracy.** The page states: *"LinkedIn does not let a third party endorse a skill on your behalf, so these are simply the skills this training covers, for you to add yourself if they fit."* No verification or endorsement is claimed anywhere, because LinkedIn exposes no interface for either. What is implemented is the documented Add to Profile flow, which creates a Licenses and Certifications entry.

---

## API endpoint status

| Endpoint | Bare GET | Interpretation |
|---|---|---|
| `/api/reviewer-eval` | **200** | Serves the instrument. Correct |
| `/api/reviewer-cert` | **400** | Correct: no code supplied |
| `/api/asset-stats` | **200** | Correct |
| `/api/honor-cert` | **404** | Correct: no key supplied |

**4 of 4 PASS.** The 400 and 404 are the specified behaviour for a bare call, not failures.

---

## Layout and CSS integrity

Diff across the window shows **1,145 insertions, 1 deletion** in HTML. The single deletion is the `honor.html` line replaced by the certificate button. Every other change is a new file. No existing stylesheet, design token or layout rule was modified. No production record was overwritten.

---

## Defects found, and their disposition

| # | Defect | Severity | Status |
|---|---|---|---|
| 1 | `/api/access` had no deploy-check guard; testing gate telemetry wrote rows into the conversion denominator | **High**, corrupts a diligence figure | Fixed, deployed, rows purged, verified 0 remaining |
| 2 | Evaluation CTA on the landing page carried no source tag | Medium, funnel blind spot | Fixed |

Both are hygiene defects in the measurement layer rather than faults a user would encounter. Both would have produced numbers a buyer reads as fact.

### A related fix from earlier the same day, recorded for completeness

The purge that cleared these rows failed twice before working, both times because **PostgREST requires the JSON arrow operator URL-encoded inside a filter path**. `payload->>src` matched nothing and returned success rather than erroring. Encoded as `payload-%3E%3Esrc` it cleared. The same latent bug was present in two earlier curl-user-agent filters and was fixed in the same pass, which means the link-open purge that appeared to work had in fact only been working through its second rule.

The general lesson, recorded because it will recur: **verifying telemetry against production writes to production.** Every logging path in this system now honours `src=verify|test|selftest|owner|deploytest*` and returns a complete valid response while writing nothing.

---

## Research baseline integrity

**The production research baseline holds 0 unverified rows.**

`interaction_events` where `source='reviewer-eval'`: **0 rows.** The instrument shipped on 2026-08-09 and no genuine reviewer has submitted yet, so 0 is the correct and expected state. Every row this audit could have created was either suppressed at write time by a test tag or purged.

---

*All checks executed against live production on 2026-08-10. No figure in this report is transcribed from a prior document.*
