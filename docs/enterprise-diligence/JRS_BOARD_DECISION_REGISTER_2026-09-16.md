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
not evidenced.**

> **SUPERSEDED AS TO THE FACT, 2026-09-18 (E-031).** The owner attests that Stacyann Young
> and Tanvi Pokhriyal entered the records through the submission link and that **he personally
> reviewed them for de-identification** before use. **The BD-01 reasoning above is preserved
> unchanged** — it was correct on the evidence then held, and a Board decision is not rewritten
> because a later fact arrived. **Attestation, not row-level evidence**: no per-row artifact
> exists and none was manufactured. **S-1 is CLOSED.** The instruction existing is not proof the review happened.

**BOARD DECISION.** The B-013B risk classification is **downgraded** from "unknown provenance,
possible sensitive content" to **"instructed-public, de-identified material, review status
unverified"**. ~~The residual questions — whether contributors were told about readability, and
whether de-identification review occurred — remain **OWNER FACTUAL CONFIRMATION REQUIRED**, and
they are now narrow enough to answer in two sentences.~~

> **CORRECTED 2026-09-18, ONE LIMB ONLY.** Of the two residual questions, **the
> de-identification limb is CLOSED** by E-031 above. **The readability-disclosure limb is
> NOT closed and is not treated as closed**: E-031 addresses whether the owner reviewed the
> records, not whether submitters were told their rows would be anonymously readable. No
> attestation reaches that question. **One limb answered is not the question answered.**

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

~~**STATUS: BOARD DECIDED → presentation update prepared.**~~

> **THE ADOPTED SENTENCE CARRIED A FACTUAL ERROR. FOUND 2026-09-20; THE DECISION ITSELF IS
> UNAFFECTED.** *"on 15 constructed records"* attaches the **full-15-record denominator** to
> the **61-run** figure, and those belong to different counts of the same series.
> `findings_history` gives 61 runs with no completeness filter; `study_runs` filtered to
> `mode == cross_vendor`, **exactly 15 non-null `per_record` values** and the 2026-08-15 lock
> gives **41 runs at 82.2 to 93.3**; `IP_COMMERCIALIZATION_AUDIT.md` reports the same range
> across **37 runs** and states the rule as *"on the 15-record set"*.
> `scripts/verify_manuscript_figures.py` had already classified the wider range as a
> **"mixed-denominator cross-vendor range"** on its `SUPERSEDED` list — **but that list guards
> the manuscript body only, so it never reached this decision.** The Board could not have
> known on 2026-09-16.
>
> **WHAT THE BOARD DECIDED STANDS IN FULL.** Publish the distribution, not a single run; do not
> publish 91.1% as a headline. The correction changes none of that.
>
> **CORRECTED WORDING NOW IN THE TREE, ON ALL FIVE SURFACES:** *"Across 61 recorded runs
> between 12 June and 21 August 2026, agreement across three models ranged from 66.7 to 93.3
> percent, mean 85.3 percent. Restricted to the runs that returned every record, the range is
> 82.2 to 93.3 percent across 37 runs at the full 15-record set. The study closed on 21 August
> 2026."*
>
> **STATUS: BOARD DECIDED → wording corrected 2026-09-20 → RATIFICATION OPEN.** Nothing is
> deployed. Enforced by
> `check_zero_drift.py::check_the_cross_vendor_range_carries_its_denominator`.

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

---

## BD-13 · BD-10 implementation defect — express the retention period in the unit the public page states

**Question.** `ENGINE_REVIEW_RETENTION` declared `months: 3` and the BD-12 public
disclosure promises "kept for 90 days and then removed". Are those the same number?

**Prior status.** BD-10 DECIDED → IMPLEMENTED → TESTED, 2026-09-16. BD-12 DECIDED
→ IMPLEMENTED → TESTED, 2026-09-16. Both certified by their own suites.

**Evidence.** `lib/retention/policy.js` used `cutoffISO(now, 3)`, which steps back
three **calendar** months. Computed across the year, the real window is 92 days in
January, June and September, 91 in December, 90 in March and 89 in May.
`scripts/check_zero_drift.py::check_disclosed_retention_matches_the_policy`
reconciled the two with `days = months * 30`.

**Facts.** On 2026-09-16, the date the disclosure was written, the enforced window
was **92 days** against a published **90**. The guard written to prevent exactly
this drift was passing, because the unit conversion was an assumption written into
it rather than a fact read from anywhere.

**Unknowns.** None material. No row has ever been expired; `engine_reviews` holds
zero rows, so **no reader was ever actually affected**. That limits the harm; it
does not change the finding.

**Options.** (a) change the code to days; (b) change the page to "three months";
(c) change the page to "up to 92 days"; (d) leave both and document the variance.

**Risk analysis.** (b) and (c) weaken a disclosure that was drafted, red-teamed
against ten misreadings and approved in the shape it has. (d) publishes a number
the system does not honour. (a) makes the published commitment exactly checkable
and removes an assumption from a guard.

**DECISION — BOARD DECISION — OWNER-DELEGATED.** Option (a). The policy declares
`days: 90` and computes with a new `cutoffDaysISO`. **BD-10's decision is
unchanged** — field-level expiry, null in place, row survives. Only the unit is
corrected. `RETENTION` (interaction_events, 24 months) is untouched: the
calendar-month reasoning is sound over 24 months, where a day count drifts across
leap years, and unsound over 90 days, where the calendar month is what moves.

**Authority.** Category A: implementation correctness and privacy-representation
consistency. §6 Option E permits reopening BD-10's implementation where new
evidence shows it defective; the table above is that evidence.

**Implementation consequence.** The guard now reads `days` from the object literal
with **no conversion**, matching structurally after stripping comments — the first
attempt matched the comment explaining that months had been removed.

**Testing requirement and evidence generated.** `tests/engine/retention.mjs`
60/0 (was 38). Boundary tests count days explicitly at 89, exactly 90, 90+1s, 91
and 92; same-instant-two-zones; UTC normalisation; leap-year span across 29
February; missing, null and empty timestamps. Reverting the policy to calendar
months fails the guard and 7 of the new tests.

**Resulting status.** BD-13 DECIDED → IMPLEMENTED → TESTED. **PRODUCTION
VERIFICATION REQUIRED** — nothing has expired anywhere.

**Dependencies.** Adds `BD-13 → BD-12 disclosure accuracy`. The disclosure was
accurate as drafted and inaccurate as implemented.

**Reversibility.** Fully reversible: a constant and a cutoff function, with the
prior state recorded inline.

**Historical references.** One test assertion, `ENGINE_REVIEW_RETENTION.months === 3`,
is **SUPERSEDED, not deleted**: it pinned the defective value and was holding it in
place. BD-10 and BD-12 are preserved unchanged; the fact that the unit was wrong
is itself part of the governance history.

---

## BD-14 · B-017 — a privacy promise made at collection is not overridden by a data-room convenience

**Question.** `finding.html` tells respondents their free text "is not displayed publicly".
The schema grants anon SELECT on `finding_responses` and `research-data.html` published a
`select=*` export of it. Which controls?

**Prior status.** Not previously recorded. Found 2026-09-16 while extending the
`engine_reviews` allow-list to the other anonymously readable tables.

**Evidence.** `finding.html:230` POSTs up to 4,000 characters of free text to
`public.finding_responses`, under the on-page promise "Your response is recorded privately
for the research program. **It is not displayed publicly.**" and the confirmation "Recorded
privately." `supabase-ALL.sql` declares the table under the comment "(no select / update /
delete policy for anon: responses stay private)" and then, **further down the same file**,
grants `for select to anon using (true)` "for the data room". `research-data.html` offered
`/rest/v1/finding_responses?select=*` and labelled it, in the same row, "private
discussion/debate responses".

**Facts.** The promise, the grant and the export link all exist and contradict one another.

**Unknowns.** **NOT ESTABLISHED: whether any rows exist or are retrievable by an anonymous
caller.** A direct production read was attempted and **correctly denied** by the execution
environment's production-read control. The live count is **PRODUCTION VERIFICATION
REQUIRED** and is not inferred. The remediation does not depend on it: a promise contradicted
by a grant is a defect whether or not anyone has yet typed into the box.

**Options.** (a) narrow the projection; (b) remove the export; (c) correct the promise to
match the grant; (d) leave it and disclose.

**Risk analysis.** (a) is the tempting one and it is wrong: **`response` IS the sensitive
column** and the row existed to carry it, so a narrower projection is a projection of
nothing. (c) inverts the governing principle — a promise made at the point of collection is
the one the respondent relied on, and rewriting it afterwards to match what the system does
is the failure this framework exists to prevent. (d) publishes text people were told was not
published.

**DECISION — BOARD DECISION — OWNER-DELEGATED.** Option (b). The promise controls. The
export row is removed; the table has **no public projection at all**, not a narrower one.

**Authority.** Category A: privacy posture and documentation, reversible.

**Implementation.** Export row removed from `research-data.html`. The stale SQL comment
asserting a control that does not exist is **corrected in place with its prior text
preserved**, because a stale comment claiming protection is how a reader concludes data is
protected when it is not.

**Testing and evidence.** `check_a_privacy_promise_is_not_contradicted_by_an_export` fails on
any read of the table from any page on any projection, **and** fails if the promise is edited
off `finding.html` — because an export ban protecting a promise that no longer exists is
protecting nothing. Three mutations fail: export restored, projection narrowed, promise
removed. **Read paths only**: the first version banned every mention and immediately failed on
`finding.html`, which is the INSERT path. **A seventh substring miss, self-inflicted**: the
narrowed version then fired on the BD-14 comment quoting the path it had removed, so the guard
now strips commentary before scanning.

**Resulting status.** **REMEDIATED IN REPOSITORY — GRANT NOT REVOKED — PRODUCTION
VERIFICATION REQUIRED.** B-017 open.

**Dependencies.** The anon SELECT revocation is a production operation. ~~queued behind
**B-001**, alongside the B-013A revocation.~~ **DEPENDENCY CORRECTED 2026-09-18.** B-001 is
**CLOSED** (E-030, owner attestation, 2026-09-18), so this revocation is **no longer queued
behind it**. It is now an **unperformed owner action in the production control plane**, to be
taken together with the B-013 limb A revocation. Nothing in the repository can perform or
verify it.

**Reversibility.** Fully reversible.

**Scope note, so this is not over-read.** `interaction_events` was examined in the same pass
and is a **weaker** case, not this one. Its collecting pages promise "No free text and no
identifying information are collected" and "aggregated without individual attribution", so
`select=*` over a `payload` jsonb is consistent with what respondents were told. The
enforcement of "no free text" lives in the client code that builds the payload rather than in
the schema. Recorded as **X-1**, not folded in here.

---

## BD-15 · V-11 — the two 401 branches are made indistinguishable

**Question.** The engine routes returned different 401 detail strings depending on whether a
token was provisioned. Is that disclosure acceptable?

**Prior status.** OPEN — LOW, recorded twice and deliberately not remediated.

**Evidence.** "Send Authorization: Bearer <token>." was returned when `REVIEW_API_TOKEN` is set
and the bearer is wrong; "A token is required." when it is unset and sandbox mode is off. On
2026-09-16 a verification pass **used exactly that difference** to establish the deployment's
configuration state from outside, which is how the fact that JRS is licensed to nobody was
independently confirmed.

**Facts.** Same class as the defect already fixed on these lines, where the 401 named the
governing environment variables. Weaker in degree — configuration **state**, not variable
**names** — which is why it was recorded rather than fixed in passing.

**Options.** (a) merge the strings; (b) keep the distinction as an operator signal.

**Risk analysis.** The operator-signal argument does not survive contact with the facts: the
operator has the deployment dashboard and the instruction in the file header. They do not need
to read configuration state out of an unauthenticated 401. The caller learns what they need
either way — send a valid token.

**DECISION — BOARD DECISION — OWNER-DELEGATED.** Option (a). Both branches now return
`A valid token is required. Contact info@jrsstandard.com`.

**Authority.** Category A: security posture, reversible.

**Testing.** `tests/engine/auth-matrix.mjs` 18 → **26 checks, 0 failed**. Four new assertions
per route: both branches present, details identical, no environment variable named, no
provisioning state disclosed. **They assert on the source, not by issuing requests**, because
the distinguishing signal is the literal and two live calls would prove only that two
configurations behaved alike on one run. Restoring the old string fails the suite.

**Resulting status.** **BOARD DECIDED → IMPLEMENTED → TESTED. PRODUCTION VERIFICATION
REQUIRED.** V-11 closed as a question.
