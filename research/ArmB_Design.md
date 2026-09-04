# Arm B — Randomized Standard-vs-Baseline Comparison (build-ready spec)

**Purpose:** isolate the *value of the standard*. Randomly assign comparable fresh participants to judge the same 24 records either with the five JRS conditions (B1) or with a general prompt only (B2). Because assignment is random, any accuracy difference is attributable to the standard, not to expertise. This is the arm that lets you claim JRS *adds value* (Floor 3).

## Assignment
- On first load, each participant is randomly assigned to **B1** or **B2** and the assignment is **written before they judge anything** (recorded with a timestamp and their code). Assignment is fixed for that participant; reloads do not reassign.
- Simple, auditable method: alternate by enrollment order, or hash the participant code to {0,1}. Record the method used.

## The two instruments (identical records, identical order per participant, randomized order across the set)

**B1 — JRS condition.** Same as the current pilot page: for each record the participant gives a JRS determination (Ready / Needs work / Gap) after being shown the five conditions (record self-sufficiency, evidentiary anchoring, chronological integrity, decision-process traceability, evidentiary sufficiency), plus a would-rely judgment (Yes/No).

**B2 — Baseline condition.** For each record the participant answers a single general question with **no** five-condition scaffolding:
> "Is this record adequately supported to rely on in a high-stakes, accountable decision?" — **Yes / No.**
Optionally a one-line reason. No mention of JRS, DRR, or the five conditions anywhere in the B2 flow.

Both conditions produce a binary grounded-vs-ungrounded classification: B1 via (Ready = grounded; Gap = ungrounded; Needs work mapped per pre-registered rule), B2 via the Yes/No relied-upon answer. This is scored against the **verified key**.

## Data capture
Reuse `ai_pilot_reads` with two added distinctions so Arm B is separable from Arm A and B1 from B2:
- `batch` = `armB`
- `condition` = `B1` or `B2` (add column if absent), written at assignment.
- Participant codes namespaced (e.g., `B-###`) and registered like reviewer codes so the write gate accepts them.
Store the assignment row at enrollment even before any read, so dropouts are visible and assignment cannot be back-filled.

## Sample and analysis
- Minimum viable: 5–8 participants per condition; more improves precision.
- Compare B1 vs B2 accuracy against the verified key; report the difference with 95% CI. **Floor 3:** B1 > B2 with the CI of the difference excluding zero.
- Participants completing < 18/24 excluded from accuracy analysis.

## Recruitment (keep caliber comparable across arms)
Draw B1 and B2 from the **same** pool and randomize within it — do not put experts in one and novices in the other. A general professional pool (compliance, HR, audit, legal-adjacent) is appropriate; the point is that B1 and B2 are matched, so randomization does the work.

## Build status
This spec is complete and build-ready. The live B2 page + randomization is not yet built or deployed; building it touches the site and deploying is gated on explicit instruction. On your word I will build the B2 page (a variant of `ai-records-pilot.html`), add the `condition` column and code namespace, and stage it for review before any deploy.

## Confound control (optional second round)
Matched-pair subset: pair a grounded and an ungrounded record matched on length, tone, fluency, and domain, differing only in whether claims are anchored. Sustained detection within matched pairs is discriminant evidence that reviewers detect groundedness, not surface features.
