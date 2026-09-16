# JRS Board Decision Register — 2026-09-16

**Decisions taken under the owner's express delegation. Each states its evidence, its authority
and where implementation stops.**

---

## BD-01 · B-013B — a correction in the less alarming direction, recorded as carefully as an alarming one

**STATUS OF LAYER 1: SUBSTANTIALLY ESTABLISHED FROM REPOSITORY EVIDENCE. Previously recorded
NOT ESTABLISHED — because I had not searched.**

`submit-validation.html`, the page through which every `bench_outcomes` row was submitted, sets
three qualifying rules and puts this first:

> **"Is it public? A published decision, opinion, ruling, or award that anyone could look up.
> Never an internal company file, even with the names removed."**

and adds:

> *"Your own workplace records do not qualify, no matter how they are edited."*
> *"When in doubt, leave it out."*
> Field label: **"The record (de-identified text)"** · *"This is screened for personal
> identifiers before it is sent."*
> Placeholder: *"the portion quoted in the public decision. No names, no identifying details."*
> *"Remove all names, identifiers, and case numbers that are not part of a public citation."*

**FINDING.** Contributors were instructed to submit **material that is already publicly
available**, de-identified, and were expressly told that internal workplace records did not
qualify **even when edited**.

**CONSEQUENCE FOR THE EXPOSURE.** Anonymous readability of `bench_outcomes` discloses material
that, by the instructions under which it was collected, **was already public before it was
submitted**. That is a materially lower-risk posture than "contributor-supplied record text of
unknown provenance", which is how earlier records described it.

**WHAT IS STILL NOT ESTABLISHED, and it is a narrower question than before.** No page tells
submitters that the stored rows are themselves anonymously readable. Being asked to submit
public material is **not** the same as being told your submission will be publicly served.

**ALSO NOT ESTABLISHED.** `submit-validation.html` states submissions *"arrive as pending
entries for de-identification review"*. **Whether that review was performed on all 54 rows is
not evidenced.** The instruction existing is not proof the review happened.

**BOARD DECISION.** The B-013B risk classification is **downgraded** from "unknown provenance,
possible sensitive content" to **"instructed-public, de-identified material, review status
unverified"**. The residual questions — whether contributors were told about readability, and
whether de-identification review occurred — remain **OWNER FACTUAL CONFIRMATION REQUIRED**, and
they are now narrow enough to answer in two sentences.

**No row was read, altered or deleted.**

## BD-02 · B-013A — revoke anonymous SELECT on `engine_reviews`

**BOARD DECISION: OPTION A now, OPTION B when convenient.**

**Analysis.** *Attack surface:* anyone holding the publishable key, which ships in 22 pages;
no skill required. *Minimum necessary access:* a public activity log needs **counts and
statuses**, not `compliant_version`. *Future partner operation:* the field is a rewrite of a
paying customer's passage, and a partner has not agreed to publish it. *Reversibility:* a
policy change, instantly reversible. *Evidence value:* the log's value is that reviews happen,
which survives Option B. *Maintenance:* one edge function.

**Why not C:** it removes the per-condition telemetry the reproducibility reporting uses — a
research-capability cost, not a security fix. **Why not D:** it requires telling customers a
rewrite of their passage will be publicly readable, a promise nobody has made and which sits
badly beside four pages publishing a data-isolation statement.

**IMPLEMENTATION STOPS AT THE PRODUCTION BOUNDARY.** Revoking a grant is a production database
operation. **Not performed.** The decision is recorded; execution awaits deployment authority.

**STATUS: BOARD DECIDED → IMPLEMENTATION BLOCKED (production authorization).**

## BD-03 · B-013C — accept, disclose, and adopt a retention rule

**BOARD DECISION: Option A (accept and disclose, already accurate) **plus** Option C (adopt a
stated retention rule).**

**Reasoning.** The content is behavioural metadata, not identities, and `privacy.html` already
describes it accurately. **But the current retention position is "indefinitely", and nobody
chose it.** An unchosen default is the weakest possible governance position, and it is the one
thing here that is free to improve.

**RETENTION RULE ADOPTED: `interaction_events` rows older than 24 months are deleted.** Chosen
because the research programme's own study window is measured in months, aggregate counts are
derived and kept separately, and no analysis in the estate reaches back further.

**IMPLEMENTATION STOPS AT THE PRODUCTION BOUNDARY.** Deleting rows is a production operation.
**Not performed.** The rule is recorded as policy; execution awaits authority.

**STATUS: BOARD DECIDED → IMPLEMENTATION BLOCKED (production authorization).**

## BD-04 · D-3 — three of four mappings declared; the fourth is not the Board's to invent

**BOARD DECISION.**

| Codebook condition | Engine key | Declared |
|---|---|---|
| Basis Identification | `basis_identification` | **EXACT** (unchanged) |
| Reconstructability | `reasoning_traceability` | **SEMANTIC / INFERRED — declared as the intended mapping** |
| Chronology | `temporal_reconstructability` | **SEMANTIC / INFERRED — declared as the intended mapping** |
| Decision-Process Traceability | `accountability_support` | **SEMANTIC / INFERRED — declared as the intended mapping** |
| Evidentiary Sufficiency | `cold_reviewer_clarity` | **UNRESOLVED. Not declared** |

**Reasoning.** The first three are design questions: the engine key is a plausible rendering of
the Codebook condition and no competing candidate remains once the other assignments are fixed.
Declaring them is the Board deciding the intended methodology, which is delegated.

**The fourth is different in kind and the Board does not decide it.** The Codebook calls
Evidentiary Sufficiency the **aggregate**; the engine weights `cold_reviewer_clarity` as a
**peer**. That is not a naming question, it is a question about what the engine computes, and
the directive expressly forbids inventing it. **It remains D-2, INTENTIONALLY UNRESOLVED.**

**These are declared as SEMANTIC / INFERRED. They are NOT upgraded to EXACT**, and the public
statement that the engine restates the Codebook's five conditions remains prohibited.

**STATUS: BOARD DECIDED → to be reflected in the mapping control document.**

## BD-05 · D-10 — restricted surfaces: accept and disclose, matching the public decision

**BOARD DECISION: accept and disclose. Do not self-host. Do not alter the access architecture.**

**Reasoning.** The owner's Fonts decision was taken on the substance — the disclosure is worth
more than the hardening — and nothing about the restricted surfaces changes that substance. The
three pages already carry `noindex`, are absent from `sitemap.xml`, and are linked only from
each other. Self-hosting remains available as deferred hardening.

**This resolves the *decision* half of CONTRADICTION_002.** The contradiction record itself is
**preserved, not deleted**, because the divergence is evidence of how a status drifted.

**STATUS: BOARD DECIDED → CONTRADICTION_002 dispositioned, record retained.**

## BD-06 · D-12 — remove the dead `verify-drift` calls

**BOARD DECISION: remove the calls. Do not implement the endpoint. Do not delete the CLAUDE.md
architecture entry.**

**Reasoning.** *Actual usage:* none — no DNS record, no implementation, every call fails.
*Existing behaviour:* all three pages write to Supabase first, so **removing the call loses no
data** — the corrected premise, not the withdrawn one. *Maintenance:* three dead calls invite
exactly the misreading that produced the false data-loss finding. *Security and privacy:* a
failing POST still transmits a payload to DNS resolution; removing it is strictly better.
*Reversibility:* trivial. *Future value:* if the endpoint is ever built, wiring three pages to
it is a small job, and the architecture entry preserves the intent.

**IMPLEMENTED**, because it is a development change that removes a call to a host that cannot
answer. **The unconditional confirmation is also fixed**: it now reflects the Supabase write,
which is the transmission that actually succeeds.

**STATUS: BOARD DECIDED → IMPLEMENTED → TESTED.**

## BD-07 · D-18 — publish the distribution, not a single run

**BOARD DECISION: replace every stale single-figure claim with the distribution, its n and its
dates. Do not publish 91.1% as a headline.**

**Reasoning.** 61 runs, 66.7 to 93.3, mean 85.3, final run 91.1, closed 2026-08-21. A single
"latest" from a closed 61-run study is indefensible whichever run is chosen, and **91.1% sits
near the top of the range, so selecting it would be cherry-picking in the flattering
direction.** The distribution lets an independent reviewer see the dispersion, which is the
actual finding.

**Wording adopted:** *"Across 61 recorded runs between 12 June and 21 August 2026, agreement
across three models on 15 constructed records ranged from 66.7% to 93.3%, mean 85.3%. The study
closed on 21 August 2026."*

**Research source records are NOT touched.** This changes presentation only, and the superseded
figures are recorded as history in `STUDY_001_PUBLIC_CLAIM_AUDIT_2026-09-16.md`.

**STATUS: BOARD DECIDED → presentation update prepared.**

## BD-08 · F-8 / F-14 — screening coverage

**Question A — widen the screen to the record-paste fields? BOARD DECISION: YES for the two
record-paste fields (`index.html` `review-input`, `training.html` `pa-input`). NO as a blanket
rollout to all seventeen pages.**
Those two fields accept a pasted *record*, which is the single most likely place for an
identifier to arrive, and both POST it to a third-party model. The other surfaces take notes,
quotes and short answers, where a `confirm()` on every match is friction without a matching
risk. **Narrowest defensible decision, not the broadest.**

**Question B — screen pilot `name`, `email`, `organization`? BOARD DECISION: NO.**
They are the submitter's own details, deliberately provided, and `email` is *expected* to
contain an email address — screening it would prompt on every correct submission. Screening a
field for the data it exists to collect is theatre.

**Question C — fail closed or fail open? BOARD DECISION: keep failing open, and say so.**
A contact form that breaks when a helper function fails to load is a worse outcome than an
unscreened submission, and the promise has already been narrowed to describe a prompt rather
than a guarantee. **The pairing is now honest, which was the actual defect.**

**STATUS: BOARD DECIDED → Question A implemented; B and C recorded as deliberate.**

## BD-09 · B-005 — scope declared as the API runtime

**BOARD DECISION: B-005's scope is the Review Engine API runtime. It does not extend to the
dormant Supabase study function or to published documentation examples.**

**Reasoning.** The blocker's stated concern is that a model identifier "is pinned in the Review
Engine as if permanent", and its remedy is a configurable default with a review date. **The
Vercel API routes are the Review Engine.** `supabase/functions/run-study/index.ts` is a dormant
second implementation the nightly cron does not call, for studies that are closed, deployed by
a different toolchain. `review-engine.html:379` is a published example response, where showing
the real identifier is more useful and more honest than a placeholder.

**Extending the remediation to those would be tidying, not remediation**, and one of them is a
research artifact.

**STATUS: BOARD DECIDED → B-005 REMEDIATED FOR ITS DECLARED SCOPE → production verification
still required.**
