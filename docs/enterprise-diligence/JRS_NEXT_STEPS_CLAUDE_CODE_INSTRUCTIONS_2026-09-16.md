# JRS — Claude Code Instructions for the Next Execution Cycle

> **HISTORICAL EXECUTION RECORD — STAMPED 2026-09-18.**
> Evidence of work performed on its date. **Not current-state authority.**
> `.jrs/state/BLOCKERS.json` is the authoritative registry (CLAUDE.md §15) and controls
> where the two disagree. Retained in full; nothing here states what is true now.

Written 2026-09-16, after Round F and the Master Governance Prompt.
Authoritative state at time of writing: **STATE 1 — DEVELOPMENT REMEDIATION ·
DEPLOYMENT NOT AUTHORIZED · GATE 1 NOT READY · PHASE II LOCKED.**
Branch `claude/html-pilot-L8rC3` at `b0a3fd1`. Production `origin/main` at `0d94ce6`.

---

## 0. Read this part first, because it is the part that is usually got wrong

**Most of the work in this project is now blocked, and the blockage is real.**
Eleven remediations sit in development waiting for one credential rotation that
only Phillip can perform. The failure mode this document exists to prevent is a
cycle that *looks* productive by re-running audits that are already recorded,
producing a fourth revision of a readiness document whose conclusion cannot
change, and calling that progress.

**Before starting any cycle:**

1. `git log -1 --oneline` and `git status --short --branch`.
2. Read `.jrs/state/BLOCKERS.json` — **the authoritative registry**. Do not create
   `docs/enterprise-diligence/BLOCKERS.json`.
3. Read the **last revision** of `FINAL_PRE_GATE_1_READINESS_AUDIT_2026-09-16.md`.
   Earlier revisions are historical; the latest controls.
4. Read `JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md` **to its end**, including
   the Round E/F additions (V-4, V-9, V-10, V-11, B-016, W-1…W-5).

**If a pasted directive describes a state older than the repository — and the last
three have — say so in one line, per CLAUDE.md §36.9, and execute only the delta.**
Do not re-run a recorded pass. Round D, U-3/BD-12, and Round E are recorded.

---

## 1. WORK THAT IS UNBLOCKED AND SHOULD BE DONE NEXT

These need no owner, no counsel and no deployment. Ranked by value.

### 1.1 Sweep the estate for the class of defect Round F found twice — HIGH

Round F found two defects of the **same shape**: a check that agreed with itself
rather than with reality. A `months * 30` conversion written into a guard to make
two numbers agree, and a guard exemption keyed on a page mentioning its own
decision id. Both passed every run.

**Instruction.** Audit `scripts/check_zero_drift.py` for every guard that:

- converts a unit, scales, rounds, or multiplies before comparing;
- exempts a file, path or page by name, decision id, or comment content;
- asserts a **hardcoded literal** that also appears in the code it checks;
- tests containment (`in`) where the thing being guarded is **structural**;
- reads a value from documentation rather than from executable code.

For each hit, write the **directed mutation that would defeat it**, run it, and
record pass or fail. Where it passes the mutation, rebuild the guard to match on
structure and re-demonstrate.

**Do not weaken or delete any guard.** Restore mutated files by **explicit byte
comparison against a saved copy** — `git checkout -- .` has produced false passes
twice on this project.

**Expected output.** `docs/enterprise-diligence/JRS_GUARD_INTEGRITY_AUDIT_2026-09-XX.md`,
one row per guard: name, weakness class, mutation applied, result, disposition.

### 1.2 Extend the allow-list pattern to the other anon-readable tables — MEDIUM

`engine_reviews` now has a parsed allow-list on every HTML `select=`. **No other
table does.** `research-data.html` exposes several tables and the guard checks
only this one.

**Instruction.** Enumerate every `rest/v1/<table>?select=` in every HTML file.
For each table, establish from the SQL whether it grants anon SELECT and whether
any column can hold free text or contributor-supplied content. Then decide, per
table, whether an allow-list is warranted — **and record the tables where it is
not, with the reason**. Do not blanket-apply; §XLI forbids architecture by
enthusiasm.

**Note before starting:** B-013B concerns **54 contributor-supplied record texts
that are anonymously readable**. That is the same exposure class and it is already
open on an owner factual question. Do not close it by engineering; establish what
is technically true and leave the owner question alone.

### 1.3 Resolve D-3 codebook/API correspondence as far as evidence allows — MEDIUM

**Instruction.** Treat `docs/enterprise-diligence/METHODOLOGY_TO_API_MAPPING.md`
as authoritative. For each condition, classify **EXACT / SEMANTIC-INFERRED /
UNRESOLVED** against the executable vocabulary in `api/v1/review-engine.js` and
`lib/manifest/build.js` (`ENGINE_CONDITION_KEYS`).

**Hard constraints.** `cold_reviewer_clarity` stays **UNRESOLVED** unless evidence
establishes its intended role — do not resolve it by reasoning about what it
probably means. **Do not introduce a fourth production vocabulary.** **Do not
modify `openapi.json`** (see §2.1 below).

### 1.4 Close the V-11 residual deliberately — LOW

The two 401 branches in both engine routes return different detail strings, so an
unauthenticated caller can read whether a token is provisioned. Round F recorded
it and deliberately did not fix it, because merging the strings removes a real
operator signal.

**Instruction.** Decide it. Either merge them and move the operator-facing
distinction into a server log, or record a `BOARD DECISION — OWNER-DELEGATED` that
the signal is worth the disclosure. **Either outcome is acceptable; leaving it
recorded-but-undecided a third cycle is not.**

### 1.5 Second-order audit, Round G — MEDIUM

Only **after** 1.1–1.4. Start from the consequences of BD-13, the allow-list, and
the B-016 reclassification. Do not repeat Round F's categories mechanically.
Register new questions as **X-1, X-2, …** in the Question Resolution Matrix.

---

## 2. WORK THAT IS BLOCKED — do not attempt it, and do not simulate it

### 2.1 B-016 — the published API contract. NOW A COUNSEL MATTER.

**This changed with the Master Prompt.** §XXV states `openapi.json` must not be
modified **until counsel review has occurred**: no schema change, no enum change,
no field change, no response-shape correction, no version change, no deletion.

B-016 was previously *OPEN — BLOCKED ON AUTHORIZATION*. It is now
**OPEN — COUNSEL REVIEW REQUIRED**, and **it does not close on the owner saying
yes.** The counsel-ready package is `COUNSEL_REVIEW_PACKET_2026-09-16.md §2b`,
with the drafted correction carried **unapplied**.

**Instruction: do not edit `openapi.json` for any reason.** Verify its sha256 each
cycle (`b89e7fea904cd32db78c05625cd501abb43607c7fa5ddc7dd0fa3134c1e047d3`) and
record **ANSWERED — FACT ESTABLISHED** if unchanged. If it has changed, **STOP**,
do not repair, do not normalize, do not version — open a contract-integrity
finding and preserve the artifact.

A compatibility shim **may be prepared for analysis** under §XXV. It **may not be
deployed**. If you build one, put it under `tools/` or `tests/`, both excluded by
`.vercelignore`, and say in the file's first line that it is analysis only.

### 2.2 B-001 — credential rotation. OWNER EXTERNAL ACTION.

**Never** request, store, log, hash, commit, reproduce or test the credential.
Never search for the replacement. The only permitted actions are to prepare the
exact owner action — already prepared at
`B-001_EXTERNAL_CREDENTIAL_ACTION_CHECKLIST_2026-09-15.md` — and to record
confirmation afterwards.

**When Phillip confirms rotation, the queue opens in this order:**

1. Investigate **B-006** and complete its verification (`B-006_DIAGNOSTIC_PROCEDURE.md`).
2. Deploy. **Verify by bytes, never by status code** —
   `scripts/preflight_deploy_check.py`. On a byte mismatch the correct response is
   to **RE-TRIGGER, never to revert**: production stays healthy on the previous
   build during a skip, so there is nothing to roll back.
3. Verify **B-014**: `/supabase-engine-reviews-setup.sql`, `/supabase-setup.sql`
   and `/supabase/functions/run-study/index.ts` must return **404**. All three
   return **200 right now**.
4. Verify the BD-12/BD-13 disclosure is live on `privacy.html` and `security.html`.
5. Revoke the `engine_reviews` anon SELECT grant (B-013A) **and** confirm
   `api/engine-activity.js` still serves — the service-role read exists so that
   revocation does not break the page.
6. Verify the eleven remaining **REMEDIATED — PRODUCTION VERIFICATION REQUIRED**
   controls: B-005, B-008, B-009, B-015, D-11, D-13, D-14, D-15, D-16, D-17.

**Nothing in that list may be marked verified before it is observed on production.**

### 2.3 Owner factual questions — do not answer them by inference

**B-013B residual, S-1, S-6, T-6.** Search first: consent records, protocols,
participant instructions, communications, publications, archives. **If evidence
establishes the answer, use the evidence** — that search has already paid off once,
when `submit-validation.html` was found telling contributors "Never an internal
company file, even with the names removed", which downgraded B-013B's risk.

If evidence does not establish it, mark **OWNER FACTUAL CONFIRMATION REQUIRED**
and stop. **Do not invent participant disclosure.**

### 2.4 Counsel matters — prepare, never manufacture

**B-004** (rights and chain of title), **B-007/D-1** (response shape), **B-016**
(data-handling representation), and **V-4 component 3** — one sentence: whether a
`request_id` returned to the caller and held only by them makes an otherwise
non-personal row identifiable.

Keep them **separate**. §2b asks explicitly whether the licence treats a
response-shape correction and a data-handling correction alike; bundling them
destroys the question.

### 2.5 D-2 — INTENTIONALLY UNRESOLVED. Leave it.

---

## 3. STANDING RULES FOR EVERY CYCLE

**Trackers.** Update `research/MASTER_TRACKER.md` **every turn** and attach it in
the same turn, including short and advice-only turns. `research/IP_SALE_TRACKER.md`
is revised and attached on every turn touching the sale, IP, buyers, outreach,
trademarks, publications or asset value. Neither is deployed; a chat attachment is
the only way they reach the owner.

**Git.** Stage explicitly named files. **Never `git add -A`.** No force push, no
`reset --hard`, no branch deletion, no history rewrite. `[skip ci]` on **line 3**
of the commit message — this clone has **no hooks installed**, so write it yourself.
Push with `git push -u origin claude/html-pilot-L8rC3`, retrying 2/4/8/16s on
network failure only.

**Tests.** Report **mode and count**, never "all tests passed". Current baseline:

| Suite | Command | Baseline |
|---|---|---|
| Guards, offline | `python3 scripts/check_zero_drift.py --offline` | 134 / 0 / 2 skipped |
| Guards, online | `python3 scripts/check_zero_drift.py` | 138 / 0 / 1 skipped |
| Retention | `node tests/engine/retention.mjs` | 60 / 0 |
| Projection | `node tests/engine/activity-projection.mjs` | 17 / 0 |
| Auth matrix | `node tests/engine/auth-matrix.mjs` | 18 / 0 |
| Manifest | `node tests/manifest/run.mjs` | 68 / 0 |

Three checks are online-only; that is why the two modes differ. **Always state
which mode a figure came from.**

**New guards** must be demonstrated failing against the pre-fix state before being
trusted, with files restored by byte comparison.

**Language.** No em-dash in body prose or in the trackers. Never "Designed for
[audience]" as a sentence opener, never "frequently" as filler, never "no policy
change required". Never *guaranteed*, *eliminates*, *prevents*, *legally
required*, *compliant*, *court-proof*, *legally defensible*, *industry standard*.

**Never say:** the Engine is validated; the Manifest proves accuracy, authenticity
or legal sufficiency; a control is verified when only development evidence exists;
JRS is certified. **Integrity is not authenticity. Metadata is not correctness.**

**Never write `ANTHROPIC_API_KEY` or any credential into frontend code, HTML, or
any committed file.** Refuse the change and explain why.

**Restricted surfaces, two distinct categories, do not collapse them.**
`programme-status-9872fb93cc94.html` is the **only** owner page, with
`api/people-9dd1ecdf6f8cdfd4.js` and `api/leads-4b7e2c9af106d385.js`: never an
analytics tag, never a link from a public page, never a token control; rotate both
endpoint slugs together if one leaks. `acquisition-9f3c2a7d4b.html` and
`vp-7c1f9a4e8d2b6035.html` are **CONFIDENTIAL BUYER**, not owner pages and not
public resources.

---

## 4. THE FOUR THINGS THAT MUST NOT BE FAKED

1. **Production verification.** Development evidence never becomes production
   evidence by assertion. **Production-verified controls: currently NONE.**
2. **Owner action.** Prepare it; never pretend it happened.
3. **Legal conclusions.** Prepare the counsel question; never manufacture the answer.
4. **Research evidence.** No figure, run, date, distribution, limitation or
   qualification may be altered to improve any presentation. Corrections preserve
   the original artifact, version, date and reason.

---

## 5. WHAT WOULD ACTUALLY MOVE GATE 1

Recorded plainly so no cycle mistakes motion for progress. Gate 1 is blocked by
**five** things, and **four of them cannot be touched from inside this repository**:

| Blocker | Who |
|---|---|
| ~~B-001 credential rotation~~ | **DONE 2026-09-18 (E-030) — OWNER-CONFIRMED** |
| Production verification of eleven controls | **downstream of B-001** |
| B-016, B-007/D-1, B-004 | **counsel** |
| ~~B-013B, S-1, S-6, T-6~~ | **S-1, S-6 and T-6 CLOSED 2026-09-18 (E-031, E-032). B-013B residual remains owner-factual** |
| Guard-integrity sweep, D-3, V-11 | **Board — this is the only unblocked column** |

**Do not produce a "READY FOR GATE 1 RECONSIDERATION" conclusion while any row
above the last is open.** The conclusion is `NOT READY` and will stay `NOT READY`
until the first four move.

---

## 6. THE NEXT AUTHORIZED ACTION

> **UPDATED 2026-09-18.** The prior text read *"Phillip rotates the Vercel credential
> externally and confirms in one line."* **He did, on 2026-09-18.** B-001 is
> **OWNER-CONFIRMED / EXTERNAL ACTION COMPLETED** and must not be asked for again.

**The next action is the B-006 diagnostic**, one command in Phillip's own shell:
`export VERCEL_TOKEN=<rotated token>; bash scripts/vercel_f4_diagnose.sh`, output only.
The token must never enter this repository or any chat. **Deployment remains
unauthorized; B-001 closing does not authorize it.**

Six production operations queue behind it, and one of them — B-014 — is a file
that is publicly readable **right now** and publishes the anon SELECT grant that
B-013A treats as an open exposure.

Everything in §1 may proceed in parallel. **Nothing in §2 may.**
