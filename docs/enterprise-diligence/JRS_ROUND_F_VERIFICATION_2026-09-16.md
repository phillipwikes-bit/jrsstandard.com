# Round F — Verification Pass: BD-10, BD-11, Projections, Exposure, Integrity

> **HISTORICAL EXECUTION RECORD — STAMPED 2026-09-18.**
> This is evidence of work performed on its date. **It is not current-state authority.**
> An execution report saying a blocker is open does not make it open; `.jrs/state/BLOCKERS.json`
> is the authoritative registry (CLAUDE.md §15) and controls where the two disagree.
> **Nothing under this heading is retained as a statement of what is true now**, and nothing
> is deleted: an execution record's value is that it shows what was believed when it was
> written.

Date: 2026-09-16 · Mode: development remediation · Phase: II (locked) · Gate: 1 (not open)
Authority: Category A delegation

## 0. Why this is a verification pass and not another U-3 cycle

The directive's §2 baseline lists U-3 as OPEN and Round D as the work to do.
That baseline is two cycles behind the repository. **U-3 was decided as BD-12 in
commit `0b3157b`**, Round D ran on it, and **Round E closed V-4 and V-9 in
`43f0788`**. Per CLAUDE.md §36.9 those passes were not re-run.

What the directive contains that had *not* been executed is the verification
work: §13, §14, §15, §20–§27, §30, §34, §39. That is this record. **It found two
real defects, one of them in a decision this Board made yesterday.**

---

## 1. BD-10 IMPLEMENTATION DEFECT — the disclosed number and the enforced number were different numbers

**FACT. The most serious finding of this cycle, and it is ours.**

`lib/retention/policy.js` declared `months: 3` and computed the cutoff with
`cutoffISO`, which steps back three **calendar** months. The BD-12 public
disclosure, drafted and red-teamed last cycle, reads **"It is kept for 90 days
and then removed."**

Three calendar months is not 90 days. Measured back from the 16th:

| Date | Cutoff | Actual window |
|---|---|---|
| 2026-01-16 | 2025-10-16 | **92 days** |
| 2026-03-16 | 2025-12-16 | 90 days |
| 2026-05-16 | 2026-02-16 | 89 days |
| 2026-06-16 | 2026-03-16 | **92 days** |
| **2026-09-16** | 2026-06-16 | **92 days** |
| 2026-12-16 | 2026-09-16 | **91 days** |

**On the date the disclosure was written the true window was 92 days.** The page
promised removal at 90 and the code would have kept the text two days longer. A
privacy disclosure that **understates** retention is wrong in the direction that
matters: the reader is told their content is gone when it is not.

### The guard was hiding it

`check_disclosed_retention_matches_the_policy` was written last cycle to "read
the period from the policy module" so the pages could not drift from the code.
It read `months` and then computed:

```python
days = months * 30  # the policy is expressed in months; the disclosure in days
```

**That is an assumption written into a guard to make two numbers agree.** It is
the precise failure CLAUDE.md §20 names — a check shaped to pass rather than to
test — and it passed every run while the defect was live.

### Decision

**BD-13 — BOARD DECISION — OWNER-DELEGATED. The unit is corrected to days.**

`ENGINE_REVIEW_RETENTION.days = 90`, with a new `cutoffDaysISO`. **BD-10's
decision is unchanged**: field-level expiry, null in place, row survives. Only
the unit changes. This is expressly the case §6 Option E contemplates — "reject
unless new evidence demonstrates that BD-10's implementation is defective" — and
the evidence above demonstrates exactly that.

The calendar-month reasoning recorded in the module is **sound for the 24-month
telemetry rule and does not transfer**. Over 24 months a day count drifts across
leap years, so months are the auditable unit. Over 90 days the reverse holds: the
day count is fixed and the **calendar month** is what moves. The published
commitment is a number a reader can check, so the code now uses that number.

`RETENTION` (interaction_events, 24 months) is **unchanged**.

### Evidence generated

- `lib/retention/policy.js` — `days: 90`, `cutoffDaysISO`, both with the defect
  recorded inline rather than quietly fixed.
- `tests/engine/retention.mjs` — **60 checks, 0 failed** (was 38). A boundary
  suite that counts days explicitly: 89 / exactly 90 / 90+1s / 91 / 92, the
  same-instant-two-zones test, UTC normalisation, leap-year span across 29
  February, and the three fail-closed timestamp cases.
- One assertion **SUPERSEDED, not deleted**: `ENGINE_REVIEW_RETENTION.months === 3`
  pinned the exact value that was wrong. It was holding the defect in place. The
  replacement asserts what survives the correction — separate rules, different
  units, no inheritance of the telemetry clock.
- The corrected guard and the new tests were **demonstrated against the pre-fix
  state**: reverting the policy to calendar months fails the guard and **7 of the
  new tests**. Files restored by byte comparison, not `git checkout`.

**A sixth substring error, caught by the guard itself within a minute.** The
first version of the corrected guard scanned for `months:` with a lazy regex and
matched **the comment explaining that months had been removed**. Rewritten to
take the object literal to its own closing brace and strip line comments before
reading a field.

---

## 2. §15 PROJECTION DRIFT — the two read paths were not enforcing the same boundary

**FACT. Found by running the directed test the directive asks for.**

There are two public read paths over `engine_reviews`:

| Path | Control |
|---|---|
| `api/engine-activity.js` | explicit `const select` list, checked column by column |
| `research-data.html:159` | checked only for literal `select=*` |

`check_record_derived_fields_have_no_export_path` additionally disabled its
column check for any page containing "BD-11" or "BD-02" — and `research-data.html`
contains "BD-11" **in the comment describing its own safe projection**. The
exemption switched the check off for the one page it most needed to cover.

**Directed test, before the fix:** adding `conditions` to the research page's
select list **PASSED**. `conditions` carries `conditions[].note`, the per-condition
text the prompt requires to be grounded in the customer's record. The guard would
have let a record-derived export through.

**Corrected to an allow-list parsed from the query.** Every
`engine_reviews?select=` in every HTML file is split into columns and each must
appear in `PUBLIC_SELECT_ALLOWED`. A column added to the schema tomorrow is
**refused by default** rather than silently exported, which is §14's requirement.

**Four mutations, all now fail:** `conditions`; `finding`; a brand-new
`reviewer_notes`; and `select=*`. Files restored by byte comparison.

---

## 3. §13 BD-10 verification — confirmed against executable code

| Requirement | Status |
|---|---|
| Expiry is field-level | **CONFIRMED** — `selectExpiringFields` nulls in place |
| Rows remain | **CONFIRMED** — `would_redact`, never `would_delete` |
| Research evidence not deleted | **CONFIRMED** — six tables named individually |
| Malformed dates fail safe | **CONFIRMED** — kept, unredacted |
| Missing / null / empty dates fail safe | **CONFIRMED** — three separate tests |
| Future dates safe | **CONFIRMED** |
| Policy module does not delete | **CONFIRMED** — no `DELETE`, no `fetch` |

## 4. §14 BD-11 verification — confirmed

`research-data.html:159` reads
`engine_reviews?select=created_at,determination,runs,overall_consistency,engine_version`.
No `select=*`, no `conditions`, no `finding`, no `input_preview`. **17/17
projection tests pass**, including a row carrying record text and an unexpected
upstream column: neither passes through.

## 5. §24 service-role security — confirmed

- **Zero JWT-shaped strings** in any `.html`, `.js`, `.json` or `.ts` on disk.
  Every service-role reference is a `process.env` read.
- 17 HTML files carry the `sb_publishable_…` key, which is publishable by design.
- Absent credential → `503 {"error":"unavailable"}`. **No configuration disclosed.**
- Explicit projection enforced; unexpected columns dropped.

**This is not a security guarantee.** A bug in this route is now a service-role
bug. The mitigation is that free text is dropped twice and 17 tests hold the
projection.

## 6. §25 public/private exposure — one live production exposure, already tracked

| Probe | Result |
|---|---|
| `/docs/enterprise-diligence/EVIDENCE_LEDGER.md` | 307 → **404.html** (protected) |
| `/lib/retention/policy.js` | **404** |
| `/tests/engine/retention.mjs` | **404** |
| `/supabase-ALL.sql` | **404** |
| **`/supabase-engine-reviews-setup.sql`** | **200** |
| **`/supabase-setup.sql`** | **200** |
| **`/supabase/functions/run-study/index.ts`** | **200** |

The last three are **live now**. They are not a new finding: `.vercelignore`
excludes them, that exclusion landed in `3026575` on the development branch, and
**`origin/main` is still at `0d94ce6`, which predates it**. This is **B-014,
status REMEDIATED IN CONFIGURATION — REQUIRES DEPLOYMENT VERIFICATION**, and the
probe is direct evidence that the remediation has not reached production.

`supabase-engine-reviews-setup.sql` publishes, at a guessable public URL, the
anon SELECT grant that B-013A treats as an open exposure, plus the full column
list. **It closes on deployment, and deployment waits on B-001.**

Nothing created in this cycle or the last is served: the new diligence documents
are under `docs/enterprise-diligence/`, excluded whole, and the `/*.md` redirect
covers them a second time.

## 7. §26 API contract integrity — ANSWERED, FACT ESTABLISHED

`sha256(openapi.json)` = `b89e7fea904cd32db78c05625cd501abb43607c7fa5ddc7dd0fa3134c1e047d3`
— **identical to the previously verified hash, and identical to the production
body.** No modification was made. **B-016 remains open and blocked on
authorization**; this cycle did not touch the contract.

## 8. §27 research integrity — confirmed

`git diff HEAD -- research/` is empty beyond the tracker entries committed this
cycle. No source research record, study run or figure was changed. No 91.1%
headline exists on any public page.

## 9. §21 Manifest consequence review

Verified against `lib/manifest/build.js`: `manifest_version`, `jrs_version`,
`codebook_version`, `engine.version`, `engine.model`, `engine.api_version`,
input hash with truncation metadata, the five condition statuses, `routing`,
`human_review.required: true`, and `integrity`.

**`integrity` is a HASH, not a signature.** `manifest_hash` plus
`canonicalization: jrs-dev-canon-1`. There is no signing key and no
authentication mechanism, so **the Manifest is NOT authenticated**, does not
establish who produced it, does not prove accuracy and does not establish legal
sufficiency.

**A BD-10 consequence worth stating plainly.** A manifest built with
`includeNotes` carries `conditions[].note` — the same text BD-10 expires from
`engine_reviews` — in the **customer's** hands, with no expiry, self-labelled
`content_class: derived_record_content`. So **the 90-day expiry is not a global
erasure.** The BD-12 disclosure remains accurate because it describes what JRS
keeps, and the Round D decision not to name the Manifest in a JRS retention
statement still holds: naming it would imply JRS controls it. **No change.**

## 10. §20 data-flow: the retention distinction

| Stage | Persistence | Retention |
|---|---|---|
| Record text → Anthropic | in memory | **never stored by JRS** |
| `engine_reviews` record-derived fields (`conditions[].note`, `finding.compliant_version`, `input_preview`) | row column | **90 days, nulled in place** |
| `engine_reviews` evaluation metadata (`id`, `created_at`, `request_id`, `determination`, `conditions[].status`, `finding.condition_triggered`, `runs`, `overall_consistency`, `engine_version`) | row column | **retained** |
| `interaction_events` behavioural telemetry | row | **24 months** |
| Research evidence (`bench_outcomes`, `bench_labels`, `study_runs`, `findings_history`) | row | **excluded from deletion** |
| `pilot_contacts` | row | **consent regime, not a schedule** |
| Customer Manifest | customer-held file | **separately controlled; no JRS expiry** |

**These do not collapse into "JRS retains data."** Nothing in this table has ever
executed: `engine_reviews` holds **0 rows**, and the route is closed.

## 11. §30 dependency recalculation

One edge **added**: `BD-13 → BD-12 disclosure accuracy`. The public sentence was
accurate as *drafted* and inaccurate as *implemented*; it is now accurate as
both, and the edge records that the disclosure depends on the unit, not only on
the number.

No edge removed. B-001 remains the single upstream of every production
verification, and the §25 probe added a fourth item to what queues behind it.

## 12. §39 Final Board success test — retention, answered precisely

**What is retained**, distinguished as the directive requires:

- **record-derived fields** — 90 days, nulled in place, row survives;
- **evaluation metadata** — retained, no expiry set;
- **behavioural telemetry** — 24 months;
- **research evidence** — excluded from deletion entirely;
- **customer-controlled Manifest** — outside JRS's control, no JRS expiry.

**None of it has run.** Zero rows, zero expiries executed, production closed.

## 13. Test record (§36)

| Suite | Command | Mode | Result |
|---|---|---|---|
| Guards | `python3 scripts/check_zero_drift.py --offline` | offline | **134 / 0 failed / 2 skipped** |
| Guards | `python3 scripts/check_zero_drift.py` | online | **138 / 0 failed / 1 skipped** |
| Retention | `node tests/engine/retention.mjs` | dev | **60 / 0** (was 38) |
| Projection | `node tests/engine/activity-projection.mjs` | dev | **17 / 0** |
| Auth matrix | `node tests/engine/auth-matrix.mjs` | dev | **18 / 0** |
| Manifest | `node tests/manifest/run.mjs` | dev | **68 / 0** |

**Testing universe:** the policy module, two projections, the auth matrix, the
manifest generator, and the repository guard suite. **It does not include any
production row, any executed expiry, or any deployed page.** Development
evidence is not production evidence.

---

## 14. State

| Item | Status |
|---|---|
| U-3 / BD-12 | ANSWERED — BOARD DECISION — implemented in development, **PRODUCTION VERIFICATION REQUIRED** |
| BD-10 | **VERIFIED, and CORRECTED by BD-13.** Decision intact; unit defective and fixed |
| **BD-13** | **BOARD DECISION — OWNER-DELEGATED — IMPLEMENTED — TESTED** |
| BD-11 | **VERIFIED** |
| §15 projection drift | **DEFECT FOUND AND CLOSED**; both paths now allow-listed |
| B-014 | OPEN — confirmed still live on production — closes on deployment |
| B-016 | OPEN — blocked on authorization |
| B-001 | **OWNER EXTERNAL ACTION REQUIRED** |
| B-004, B-007/D-1, V-4 component 3 | COUNSEL REVIEW REQUIRED |
| B-013B, S-1, S-6, T-6 | OWNER FACTUAL CONFIRMATION REQUIRED |
| D-2 | INTENTIONALLY UNRESOLVED |

**STATE 1 — DEVELOPMENT REMEDIATION. DEPLOYMENT NOT AUTHORIZED.
NOT READY FOR GATE 1 RECONSIDERATION.**

The conclusion is unchanged, and this cycle is a reason it should be: a Board
decision taken yesterday was found to be implemented against a different number
than the one published to readers, and a drift guard was found exempting the page
it existed to cover. Both are closed. Neither would have been found by re-running
the audit that certified them.
