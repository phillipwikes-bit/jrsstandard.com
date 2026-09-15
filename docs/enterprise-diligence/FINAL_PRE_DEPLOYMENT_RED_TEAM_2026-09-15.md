# Final Pre-Deployment Red Team — 2026-09-15

**Eighteen findings. Fifteen against my own work. Two live production exposures found and
closed. One red-team finding was itself partly wrong and my response to it was worse than the
finding.**

---

## LIVE EXPOSURES — confirmed on production, now closed in configuration

### F-1 · Ten root `.sql` files were publicly servable — CONFIRMED, REMEDIATED
`.vercelignore` excluded **only** `supabase-ALL.sql`. Verified on production:
`/supabase-engine-reviews-setup.sql` **200**, `/supabase-setup.sql` **200**,
`/supabase-ALL.sql` **404**.

`supabase-engine-reviews-setup.sql` publishes, at a guessable URL, **the exact anon SELECT
grant that B-013A treats as the open exposure**, the full column list including `input_preview`,
and a now-false retention comment. Seven further files carry `for select to anon using (true)`,
together mapping which tables are anonymously readable.

**This falsified my own audit row** *"Protected implementation excluded — CONFIRMED"*.
**Remediated:** `*.sql` excluded by wildcard, so a schema file added later is internal by
default. Guard requires the rule.

### F-2 · `supabase/functions/run-study/index.ts` was publicly servable — CONFIRMED, REMEDIATED
**200 on production.** Vercel was serving the source of a Supabase Edge Function: the study
record corpus, the model identifier and deploy instructions naming the secret names. **No
literal key** — only `Deno.env.get` and a `sk-ant-...` placeholder in a comment.
**Remediated:** `supabase/` excluded. The nightly cron calls `/api/run-study`, so nothing that
runs was removed.

## GUARD EVASIONS — seven demonstrated, all closed

| Evasion | Was | Now |
|---|---|---|
| Copy to `.svg`, `.css`, `.xml` | PASSED — extension allow-list | **FAILS.** Allow-list replaced with a binary-only deny-list |
| Copy padded past 400 KB | PASSED — size cap | **FAILS.** Cap raised to 8 MB |
| `http://` and protocol-relative `//host` | PASSED — pattern required `https://` | **FAILS** |
| New `api/shadow.mjs` | PASSED — only `.js` walked | **FAILS** |
| Root `app.js` | PASSED — only `api/` walked | **FAILS** |
| `.ts` outside `api/` | PASSED | **FAILS** |

Fixing the first one made the guard match **itself**, because `check_zero_drift.py` contains the
signature strings as literals. The skip set is now **derived from `.vercelignore`** rather than
hardcoded, which fixes both that and the drift between the two lists.

**The widened outbound guard immediately found two real unapproved destinations:** `esm.sh`
(imported by the Supabase function; classified **DORMANT** — no execution path in this
deployment reaches it) and `buy.stripe.com` (a **test assertion string** in excluded
`scripts/`; **REFERENCE_ONLY**, and every `checkout_url` remains empty). Inventory now **23
destinations**.

Tightening the pattern produced a false positive of its own — `//` in a JS comment matched as
host `i.test`. Anchored to require a quote or `=`.

## MY FALSE STATEMENTS — corrected, originals preserved

### F-3 · D-12 "the visitor's note reaches nobody" — **FALSE**
`index.html:5600` writes to `interaction_events` **before** the `verify-drift` call, carrying
`note`. **There is no data loss.** I traced the `.catch()` and the confirmation logic and did
not read the six lines above the `fetch`. **The claim reached a commit message and the
tracker.** Disposition D-12.1 recommended work already done and is **withdrawn, not deleted**.

**What survives:** no DNS record, no implementation, three live pages POSTing to a host that
cannot answer, and a confirmation set **outside the promise chain**.

### F-4 · "Zero literals remain outside `_model.js`" — **FALSE as written**
Two live literals in `supabase/functions/run-study/index.ts` (38, 75) and one published example
in `review-engine.html:379`. **The census only ever covered `api/`.** Correct statement: zero
remain **in `api/`**. **B-005 is not remediated as originally described.**

### F-5 · "Zero token-shaped strings on disk" — **FALSE as a blanket claim**
The **publishable** Supabase key appears in 17 HTML files by design and is deliberately not
matched by the secrets guard. The supported proposition — **zero credential-shaped additions
across all 151 changed files** — is correct and independently confirmed.

### F-6 · A blind substitution corrupted a comment in a deployable file
The "Data Isolation Guarantee" rename hit a JS comment in `engine-activity.html`, producing
ungrammatical text that also asserted a promise the same deployment retracts. **Direct evidence
that the 18-page sweep ran by substitution rather than page-by-page review** — the risk my own
candidate audit raised about itself. Repaired.

## A RED-TEAM FINDING THAT WAS PARTLY WRONG — and my response was worse

The pass reported the guard figure as unreproducible: **131 checks, 2 skipped**, not 135/1, and
inferred *"131 is the ceiling in any mode"*.

**Online is 135/0/1. Offline is 131/0/2.** Three checks are online-only. The pass ran only
`--offline`.

**On receiving it I rewrote 135 to 131 across four documents before verifying the online
figure**, replacing a correct number with an incorrect one — while responding to a report about
exactly that failure mode. Reverted; every figure now states its mode.

**Unresolved and recorded:** one online run reported **136 checks, 1 failed**; two immediate
re-runs reported 135/0/1 and the failing check was not captured. **NOT ESTABLISHED** whether
that was a flaky live probe. A figure that moves between runs is itself an evidence defect.

## FINDINGS ACCEPTED AND NOT YET ACTED ON

| # | Finding | Status |
|---|---|---|
| F-7 | `check_public_engine_endpoints_carry_no_record_text` PASSES with the message *"no record text reaches logReview"*, which is **false**: the note is grounded in the record text and `compliant_version` is a rewrite of it. **A guard whose PASS string states a false proposition.** | **OPEN — guard defect** |
| F-8 | `privacy.html` §2 promises a sensitive-identifier screen; `index.html` `submitReview()` and `training.html` record-paste call `/api/review` **without** `jrsSanitizeCheck`. Six pages carry textareas with zero calls. **CLAUDE.md §36.6 breach.** | **OPEN — owner decision: widen the screen, or narrow the promise** |
| F-9 | `security.html:292` *"A stored row cannot quote your record verbatim"* — **no mechanism enforces it**; only a prompt instruction and a 600-char slice. | **OPEN — unsupported capability claim** |
| F-10 | B-013A's token gate has an env bypass: `JRS_SANDBOX_OPEN=true` with `REVIEW_API_TOKEN` unset makes the **writing** route public. | **OPEN — strengthens the B-013A case** |
| F-11 | `vp-7c1f9a4e8d2b6035.htm` (`.htm`) is invisible to **every** HTML guard. Benign today, at a CONFIDENTIAL BUYER slug. | **OPEN — permanent blind spot** |
| F-12 | Three same-level records disagree on D-10 status; `BLOCKERS.json` says **OPEN**, the Board register says **decided**. My reconstruction listed B-009/D-10 under "engineering completed". **An owner action converted into engineering closure.** | **OPEN — contradiction record required** |
| F-13 | Manifest fixtures are overwritten on every test run, so the suite validates its own last output. Cannot detect a **generator** regression. | **OPEN — evidence-quality defect** |
| F-14 | Pilot screen fails open twice (`typeof` guard, `catch`) and covers `message` only; `name`, `email`, `organization` are unscreened. | **OPEN** |

**None of these was closed by this cycle, and none is claimed as closed.**

## VERDICT

**DEPLOYMENT NOT READY** — unchanged, and now for reasons the earlier documents did not give.
