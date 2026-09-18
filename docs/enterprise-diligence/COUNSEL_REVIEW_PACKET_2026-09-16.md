# Counsel Review Packet — 2026-09-16

**Two standing questions and two conditional ones. No legal question is answered here.**

---

## 1 · B-004 — Rights and chain of title

**LEGAL QUESTION.** Do the available instruments support commercial exploitation, licensing or
transfer of the JRS estate?

**FACTUAL RECORD.** 33 people executed structured contributor consents. `consent_use = yes`,
`consent_transfer = yes`, scoped to **study publications and successor transfer**.

**EVIDENCE.** Consent records, contributor matrix, publication records, AI-assistance
provenance, Git chronology.

**UNKNOWN / NOT ESTABLISHED.** **No Level A executed assignment instrument exists anywhere in
the corpus.** The consents are **silent on commercial use**. ~~The Section 2.1 accessibility and study-design contribution is recorded as influencing
international panel design; **whether that creates any interest is not determined here**.~~

> **CHARACTERISATION CORRECTED 2026-09-18 (E-033, E-036).** The approach arose from the
> **owner's own MCCR work and experience**, discussed with his mentee, and was **NOT a formal
> JRS research contribution**. X-15 was raised on the superseded premise and is **CLOSED**;
> an affirmative-evidence search across eight propositions returned **zero**. **This is not a
> counsel matter and must not be presented to counsel as one.** Her separate panel
> participation is preserved.

**POTENTIAL CONSEQUENCE.** A transaction premised on unrestricted commercial rights may rest on
instruments that do not grant them.

**QUESTION FOR COUNSEL.** What, if anything, do these consents convey beyond publication and
successor transfer, and what instrument would be needed for commercial licensing?

**Nothing here asserts ownership.** Authorship is not title; consent is not assignment;
publication is not a commercial licence.

## 2 · B-007 / D-1 — Published licensed API contract

> **B-002 IS THIS MATTER, ADDED 2026-09-18.** The registry routes **B-002 to COUNSEL** because
> `.jrs/reports/GATE_1_REMAINING_ITEMS.md` item 8 records it as **subsumed by B-007** — "two
> OpenAPI documents disagree" is the same fact this section states. **It is named here so a
> reader tracing B-002 is not left looking for a section that does not exist.** No separate
> legal question arises from it.

**LEGAL QUESTION.** `openapi.json` is published, carries a **Commercial licence**, and is linked
from a confidential buyer surface. It describes a response the implementation does not return.
What are the implications of (a) leaving it, (b) amending it, (c) versioning it?

**FACTUAL RECORD.** Three breaking differences, all record-level: `routing` **required** and
**absent** from the implementation; `conditions` required top-level but nested at
`result.conditions`; different routing vocabulary and case. **The condition-level payload agrees
exactly.**

**EVIDENCE.** `openapi.json` v1.0.0; `api/v1/review-engine.js`; served at `/openapi.json`.

**UNKNOWN.** **EXTERNAL RELIANCE NOT ESTABLISHED.** *This is not the same proposition as "no one
relied on it"*, and the stronger statement is not made.

**POTENTIAL CONSEQUENCE.** A consumer built strictly to the contract fails on the first
response.

**QUESTION FOR COUNSEL.** May the published contract be amended, and does the Commercial licence
carry obligations that bear on the choice?

**`openapi.json` has not been modified.**

## 2b · B-016 — the same published contract asserts a data-handling property the code contradicts

**ADDED 2026-09-16. Escalated to counsel by the Master Prompt §XXV**, which states that
`openapi.json` must not be modified "until counsel review has occurred". B-016 was previously
recorded as OPEN — BLOCKED ON AUTHORIZATION; that authorization question is now answered, and
the answer is that this is a **counsel matter, not an owner-authorization matter**.

**LEGAL QUESTION.** The same published, commercially licensed contract asserts that the call is
stateless and that no retention obligation arises. The implementation writes a row. May the
assertion be corrected, and does the licence bear on whether it must be?

**FACTUAL RECORD, established from code and production.**

`https://www.jrsstandard.com/openapi.json` returns 200 with sha256
`b89e7fea904cd32db78c05625cd501abb43607c7fa5ddc7dd0fa3134c1e047d3`, byte-identical to the
repository. It describes one path, `/api/v1/review-engine`, and states:

- `info.summary`: "**Stateless** pre-finalization decision gate for one record."
- `info.description`: "**The call is stateless.** Record text is assessed in memory and
  discarded: **it is not written to any table**, not echoed back, and not logged, so **no
  data-residency or retention obligation transfers to the operator of this API.**"

`api/v1/review-engine.js:272` reads `if (AUTHENTICATED) await logReview(SERVICE, rid, out);`.
`logReview` writes a row to `engine_reviews` carrying `conditions` — which the prompt requires to
hold a per-condition `note` grounded in the record text — and `finding.compliant_version`, a model
rewrite of the passage.

**WHAT IS TRUE AND WHAT IS NOT, stated precisely rather than collapsed.** On a strict reading one
clause survives: the grammatical subject of "it is not written to any table" is **record text**,
and record text genuinely is not written (`input_preview` stopped being written on 2026-08-14 and
the column is now unwritten). **"The call is stateless" is a separate, unqualified sentence and it
is false of the code**, as is the `summary` line.

**THE THIRD CLAUSE IS A LEGAL CONCLUSION AND WE DO NOT OFFER ONE.** "No data-residency or
retention obligation transfers to the operator of this API" is a statement of legal effect resting
on the false premise. It is the **same proposition** that §4 of this packet records as removed
from the HTML surfaces. It was **not** removed here. §4 is corrected accordingly.

**PRODUCTION IS NOT CURRENTLY EXPOSED, AND WE DO NOT OFFER THAT AS A DEFENCE.** `AUTHENTICATED`
is only true when `REVIEW_API_TOKEN` is provisioned. A probe on 2026-09-16 returned 401 with
detail "A token is required" — the branch taken when the variable is **unset** and sandbox mode is
**not** open. No caller can reach the model, no row can be written, and `engine_reviews` holds
**0 rows**. Production is accurate today **by configuration, not by design**.

**THE COMMERCIAL TIMING, which is why this is on counsel's desk rather than in a backlog.**
Provisioning a token to a licensee is the single act that turns on the write path the contract
denies. **The first licensee is the only person who can make this document untrue, and they are
the person it was written for.** A buyer's security reviewer reads the OpenAPI spec, not the
source.

**UNKNOWN. EXTERNAL RELIANCE NOT ESTABLISHED.** As in §2, that is *not* the same proposition as
"no one relied on it", and the stronger statement is not made. **Separately established: JRS is
licensed to nobody and no licence draft exists** — a search of `research/` for contractual form
returns plans, not an instrument; every `checkout_url` is empty; revenue is $0.

**A SECOND PUBLISHED SURFACE NOW DISAGREES WITH IT.** The BD-12 privacy disclosure, implemented in
development and not yet deployed, states that model output about the record is kept for 90 days.
**The privacy page is the accurate one.**

**QUESTION FOR COUNSEL.**
1. May the statelessness and no-retention assertions be corrected in a document version-stamped
   `1.0.0`, and does the Commercial licence bear on whether correction is permitted or required?
2. Does correcting a **data-handling representation** differ, under that licence, from correcting
   a **response shape** (§2)? They are being asked separately on purpose.
3. Should the correction carry a version increment, and does a version increment itself have
   licence consequences?
4. Is there any obligation arising from the period during which the assertion was published while
   the write path existed in code but was unreachable in configuration?

**DRAFTED CORRECTION, NOT APPLIED.** Drop "Stateless" from `info.summary`. In `info.description`
keep the accurate clause that record text is never written to any table or echoed back; replace
"The call is stateless" with what is actually recorded — the engine's own output about the record,
with the record-derived fields removed after 90 days per BD-10/BD-13; and **delete the
data-residency conclusion rather than restate it**, because Rule 8 forbids us reaching it.

**`openapi.json` HAS NOT BEEN MODIFIED.** sha256 verified identical on 2026-09-16 after this
cycle.

## 3 · CONDITIONAL — B-013B, if contributors were not told

~~**Triggered only if the owner answers B-013B "not told" or "not recorded".**~~
**QUESTION.** 54 contributor-supplied record texts are anonymously readable. What obligations
follow if participants were not informed?
**NOT ESTABLISHED:** what participants were told. **No privacy conclusion is offered.**

> **TRIGGER NARROWED 2026-09-18, AND ONE LIMB OF IT IS NOW CLOSED.** B-013B had two residual
> factual questions. **E-031 closes one**: the owner attests that Stacyann Young and Tanvi
> Pokhriyal entered the records and that **he personally reviewed them for de-identification**
> before use. **E-031 does NOT reach the other**, which is whether submitters were told their
> rows would be **anonymously readable** — no attestation addresses that, and it is the limb
> that triggers this section.
>
> **One limb answered is not the question answered.** The trigger is therefore narrower than
> written above and is **not removed**: it fires on the readability-disclosure limb alone.

## 4 · data-residency wording — CORRECTED 2026-09-16, and it is no longer conditional

**PRIOR TEXT, preserved:** "Statements that 'no data-residency obligation transfers to us' were
**removed, not reworded**. Any republication of a residency statement is a counsel matter."

**CORRECTION.** That was true of the **HTML surfaces** and was written as though it were true of
the estate. It was not. A residency statement **survives in `openapi.json`**, in the form "no
data-residency **or retention** obligation transfers to the operator of this API" — the inserted
words are why the claims sweep that removed the others did not find it, and why the guard banning
the phrase did not fire.

This section is therefore **no longer conditional**. A residency statement is live on production
now. It is carried as **§2b, B-016**, and it is a counsel matter by §XXV.

---

## What counsel is NOT being asked

To approve engineering. To bless a deployment. To ratify a status. **The repository states
NOT ESTABLISHED wherever evidence is absent, and those statements are the record, not gaps to
be filled in.**
