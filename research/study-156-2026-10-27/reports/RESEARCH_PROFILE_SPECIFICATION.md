# Research Profile Specification: 0.3.3-research-candidate

**Describes the frozen candidate (`CANDIDATE_0.3.3_MANIFEST_SHA256.txt`, `fad69b62...0477`, 46 files). Written after the freeze; it changes nothing.**
- The candidate is **not adopted**.
- The engine of record remains the frozen 0.3.1-candidate (Phase 7 manifest `815c5d56...25c3`).
- 0.3.2-candidate (`2276bbc2...0f18`) also remains unadopted.

## 1. Where it lives and what it can reach

| Property | Value |
|---|---|
| Location | `research/study-156-2026-10-27/candidate/` (untracked study package). Nothing under `lib/`, `api/` or any public page was changed |
| Public routes | None. The candidate is loaded only by the study tools, from an isolated, manifest-checked copy |
| Production defaults | Unchanged. With the profile off, 0.3.3 equals 0.3.2: 310 of 310 full-graph differential inputs, 343 of 343 feature probes |
| Activation | Only when `compileEvidenceGraph()` receives `researchProfile = { profile_id: 'jrs-study-research-profile/1', enabled: true, authorization_ref: <non-empty> }` **and** the separately signed pack `rule-packs-research/RPK-SRP.json` validates. No environment variable, default or fallback enables it |
| Fail closed | Any other profile value, an undeclared field, a tampered pack or a missing rule: every record is refused (research probes RP-003 to RP-012; regression RG-18) |
| Authorized scope | `record_type: study_decision_record`, `record_state: completed_record`, `content_origin` constructed study vignette or synthetic study record, no HR content, no regulated-decision content |
| Prompt | `candidate/prompt/PROMPT_research-1.txt`, version `jrs-engine-local-0.3.3-research/prompt-1`. Specification only; never sent to a model |

## 2. Files changed from the 0.3.2 copy

- **Changed:** compiler, contract, scope, response, assertions, controls, rule-packs and graph-validate. The seven default rule packs were also changed: they were re-signed with the new version label, and their content is otherwise the same.
- **Added:** `research-profile.mjs`, `rule-packs-research/RPK-SRP.json`, `prompt/PROMPT_research-1.txt`.
- **Reference copy:** `SOURCE_COPY_SHA256_BEFORE_CHANGE.txt` holds the 43 hashes of the copy taken before any change.

## 3. Rules (RP-SRP-01 to RP-SRP-08)

| Rule | What it does | Study need it answers |
|---|---|---|
| RP-SRP-01 | Sentence units with lexical roles: decision, basis cue, authority reference, added conclusion | Records are prose, without "Label:" headings |
| RP-SRP-02 | Evidence anchors: dates (words or ISO), identifiers, quantities, on-file documents, stated absences. Excluded: the decided item's identifier, the decision's own date, figures inside an authority citation, decision details before the basis cue | Identifiable basis without section roles |
| RP-SRP-03 | An event key per date; a conflict only when one event has two dates | Question 3 (same or different events) |
| RP-SRP-04 | Opposite cited outcomes for different decision units are not compared | Question 4 (separate requests) |
| RP-SRP-05 | Opposite outcomes for the same subject raise a decision-outcome conflict | Contradiction about one item |
| RP-SRP-06 | An authority reference with no evidence anchor outside it routes identifiable basis to review | Question 1 (authority alone) |
| RP-SRP-07 | With no evidence anchor, a reason that restates the decision, or a decision with no reason, is a visible gap | Question 2 (restated conclusion) |
| RP-SRP-08 | Expiry, compensating-control and labelled-section rules are not applied; an added conclusion, or one of several decisions, needs its own evidence | Supplier-access assumptions removed; multiple decisions |

## 4. Assumptions of the default profile, and how they are handled

| Default assumption (0.3.1, 0.3.2) | Research profile |
|---|---|
| The record is a supplier-access exception draft | The scope is study decision records only |
| An exception has an expiry date and compensating controls | Not applied (RP-SRP-08) |
| Sections are introduced by "Label:" headings | Sentence units (RP-SRP-01) |
| One decision per record | Several decision units, each needing its own evidence (RP-SRP-08 with RP-SRP-04) |
| Dates are ISO strings | Dates in words, day and month only when no year is given (KL-04) |

## 5. Guarantees that hold whatever the rules find

- **No status raised.** The compiler keeps or lowers the candidate's proposal and never raises it.
- **No supported sufficiency.** `sufficiency` is never `supported`.
- **No verdicts.** No overall result, readiness verdict, legal or compliance conclusion, and no assessment of a person.
- **Human review.** Every finding is routed to human review.
- **No silent cuts.** No truncation and no segmentation: a record above 8,000 characters is refused explicitly, as in 0.3.2.
- **Evidence.** 0 guard violations across every research graph in this study (`reports/ANALYSIS.json`, `safety`).

## 6. Known limitations (all lexical)

- **Recorded before the freeze:** KL-01 to KL-08 in `DEVELOPMENT_LOG.md`.
- **Found after the freeze:** EF-01 to EF-08 and VF-01 to VF-06 in `reports/FAILURE_REGISTER.md`.
- **The most serious:** any date or identifier counts as evidence. An over-claiming candidate that cites an irrelevant anchor can therefore reach CLEAR on an ungrounded record (VF-01, VF-02).
