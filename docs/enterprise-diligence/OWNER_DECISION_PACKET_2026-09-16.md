# Owner Decision Packet — 2026-09-16

**Eight decisions. Only Phillip Wikes can make them. None has been made here.**

Detailed forms exist for each; this is the consolidated view.

---

## 1 · B-001 — Rotate the exposed Vercel credential · **HIGHEST PRIORITY**

**QUESTION.** Rotate and confirm?
**FACTS.** A live token was pasted into conversation twice on 2026-09-14. Never run, tested or
stored; **zero token-shaped strings on disk**. **No repository evidence can establish rotation.**
**CONSEQUENCE.** Gates **ten** completed remediations, unblocks B-006, and now gates **B-014**,
whose two exposures are live on the production build until a deployment occurs.
**ACTION.** Revoke and reissue at Vercel → Settings → Tokens. Reply: *"Vercel token revoked and
reissued on <date>. Scope: <scope>."* **Never record the token or a hash of it.**

## 2 · B-013A — `engine_reviews` anonymous read

**QUESTION.** A, B, C or D?
**FACTS.** Zero rows. Anon SELECT granted. Both writing routes token-gated; the free public
route writes nothing. **As of 2026-09-16 an unauthenticated request cannot persist at all**
(F-10 fixed in code).
**CONSEQUENCE.** Free to fix now; not free once a partner call lands.
**RECOMMENDATION (engineering, not a decision).** **A now, B when convenient.**

## 3 · B-013B — What were contributors told?

**QUESTION.** Were participants told raw submitted records could be publicly readable?
**FACTS.** 54 rows of contributor record text, anon-readable, **0 email and 0 SSN hits**.
**NOT ESTABLISHED from repository evidence.**
**CONSEQUENCE.** The right disposition depends entirely on the answer.
**RECOMMENDATION.** None. This is a fact only you hold.

## 4 · B-013C — Telemetry read posture

**QUESTION.** Accept, restrict, shorten retention, or aggregate?
**FACTS.** 2,280 rows: paths, country, truncated user-agent. **No visitor email stored.**
**RECOMMENDATION.** Disclosure is already accurate; **shortening retention is worth doing
regardless**, because "indefinitely" is the current position and nobody chose it.

## 5 · D-3 — Codebook ↔ API correspondence

**QUESTION.** Declare the intended mapping for the four non-exact pairs, in particular whether
`cold_reviewer_clarity` is the aggregate or a distinct dimension.
**FACTS.** Five conditions, five keys, **exactly one name in both**. Three UNRESOLVED.
**CONSEQUENCE.** Blocks the API reconciliation's recommended option, which would otherwise put
a **fourth** record-level vocabulary into production.

## 6 · D-12 — `verify-drift`

**QUESTION.** Remove the calls, implement the endpoint, or retain as future architecture?
**FACTS.** No DNS record, no implementation, three live pages POST to it. **CORRECTED: there is
no data loss** — all three write to Supabase first. The homepage confirmation is unconditional
because it sits outside the promise chain.
**RECOMMENDATION.** No urgency now the data-loss premise is withdrawn.

## 7 · D-18 — STUDY-001 presentation

**QUESTION.** Which presentation?
**FACTS.** 61 runs, 66.7–93.3, mean 85.3, final run 91.1. **All five published figures are
stale; none is the final run.** The undated 84% sits on the **buyer** surface.
**RECOMMENDATION.** Publish the **distribution** with n and dates. **Do not substitute 91.1%
because it is higher** — it is near the top of the range and that would be cherry-picking.

## 8 · Arising from F-8 / F-14 — screening coverage

**QUESTIONS.** (a) Widen the screen to the record-paste fields and seven uncovered pages,
accepting a `confirm()` on those surfaces? (b) Screen `name`/`email`/`organization` on the
pilot form, noting that an email-pattern screen on an email field prompts on every correct
submission? (c) Fail closed when the screen cannot run, or keep failing open and say so?
**FACTS.** 17 pages carry textareas; **7 invoke the screen zero times**. The promise has been
narrowed to match execution, so nothing is currently false.

---

## And separately: deployment authorization

**Not requested.** **DEPLOYMENT NOT READY.** It becomes a question only after B-001, B-013A/B/C
and the counsel matters are dispositioned.
