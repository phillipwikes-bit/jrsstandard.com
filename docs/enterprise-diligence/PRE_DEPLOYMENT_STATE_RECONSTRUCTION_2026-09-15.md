# Pre-Deployment State Reconstruction — 2026-09-15

> **HISTORICAL EXECUTION RECORD — STAMPED 2026-09-18.**
> This is evidence of work performed on its date. **It is not current-state authority.**
> An execution report saying a blocker is open does not make it open; `.jrs/state/BLOCKERS.json`
> is the authoritative registry (CLAUDE.md §15) and controls where the two disagree.
> **Nothing under this heading is retained as a statement of what is true now**, and nothing
> is deleted: an execution record's value is that it shows what was believed when it was
> written.

## A. Production state

| | |
|---|---|
| Production commit | **`0d94ce6`** |
| Assets compared | **77, byte-identical, 0 stale, 0 missing** |
| Did production change this cycle? | **NO** |
| Has the candidate been deployed? | **NO** |

## B. Candidate state

Branch `claude/html-pilot-L8rC3`, head `9343124`.

**151 files changed against production. 25 would actually be deployed. 126 are excluded.**

That ratio is the single most useful fact in this document: **five sixths of the work is
evidence and control, not shipped surface.**

### The 25 deployable changes

| Class | Count | What |
|---|---|---|
| **Edge Functions** | **6** | `_model.js` (new) and five consumers |
| Public HTML | 18 | Privacy, security and engine-disclosure corrections; the `pilot.html` sanitize fix |
| Deployment config | 1 | `.vercelignore` exclusions |

### The 126 excluded

`docs/` 47 · `.jrs/` 35 · `.claude/` 25 · `tests/` 7 · `lib/` 3 · `scripts/` 2 · `research/` 2 ·
`schemas/` 1 · `tools/` 1 · `standard/` 1 · `CLAUDE.md` · root `MASTER_TRACKER.md`.

### API change — audited in full

**The only runtime change is the B-005 model-identifier extraction.** Six literal sites became
`jrsModel()`; one new module declares the default.

**Response contract untouched, verified by counting diff hits on every contract key:**

| Key | Hits in the `api/` diff |
|---|---|
| `routing`, `conditions`, `determination`, `disclaimer`, `disclosure`, `result`, `logReview`, `compliant_version` | **0 each** |

**Behaviour preservation proven rather than asserted:** `jrsModel()` with no environment
override returns `claude-haiku-4-5-20251001`, byte-identical to the literal it replaced, and
the override path was exercised.

**CORRECTION 2026-09-15.** This previously read **"zero literals remain outside `_model.js`"**.
**That is false as written.** Two live literals remain in
`supabase/functions/run-study/index.ts` (lines 38 and 75), a **second** Anthropic-calling
engine, and one appears in `review-engine.html:379` as a published example response. **The
six-literal census only ever covered `api/`.** The correct statement is: **zero literals remain
in `api/`**, which is the surface B-005 audited and the surface this candidate deploys.
`supabase/functions/` is a Supabase Edge Function deployed by a different toolchain and is now
excluded from the Vercel deployable set. **B-005 is not remediated as originally described.**

**No database change. No grant change. No new outbound destination. `openapi.json` untouched.**

## C. Test state

| | |
|---|---|
| **DEVELOPMENT PASS** | Guard suite 135, 0 failed, 1 skipped (online); 131, 0 failed, 2 skipped (offline). Manifest 63, 0 failed. 25 guard mutations across four guards. D-14 12/12 browser cases |
| **DEVELOPMENT FAIL** | **None** |
| **PRODUCTION PASS** | **None** |
| **PRODUCTION FAIL** | **None** |
| **PRODUCTION NOT TESTED** | Every public-facing correction; deployment exclusions; D-14 live path; database grants |
| **NOT APPLICABLE** | Offline validator and manifest internals, which are not production components |

**No development PASS has been translated into a production PASS.**

## D. Governance state

**Owner action:** B-001 (dominant) · B-013A, B, C · D-3 · D-12 · D-18 · schema publication ·
`BLOCKERS.json` path conflict.
**Counsel:** B-007/D-1 · B-004/D-6 · data-residency wording.
**Engineering completed:** B-005, B-008, B-009, D-10 to D-17, Manifest layer, deployment
exclusions, outbound inventory.
**Remediated but unverified:** all of the above, pending deployment.
**Intentionally unresolved:** D-2.

## E. Conclusion

# DEPLOYMENT NOT READY

B-001 is unconfirmed, B-006 is blocked behind it, B-013A/B/C are undispositioned, and no
production verification exists for anything.
