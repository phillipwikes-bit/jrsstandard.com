# Rung 2 — Reference-Distribution Methodology (Design Note)

> Internal design/methodology note. **Not user-facing product copy.** This file
> records *why* the Rung 2 (accuracy) validation works the way it does, and
> credits the external contribution behind it. Do not copy phrasings from this
> note into UI strings, variable names, or the published JRS vocabulary.

## Attribution

The reference-distribution framing of Rung 2 — the idea that for judgment-heavy
records there is often no single correct score, only a distribution of
defensible expert judgments; that inter-rater agreement among experts is itself
a primary validation metric rather than noise to average away; and the four
diagnostic questions (range coverage, comparable agreement rate, defensible
divergence, systematic divergence by background) — was contributed by an
**external model-validation professional**. The framing is used with permission
and is credited here. Per the contributor's request and our own discipline, the
contributor's specific coined phrasings are **not** propagated into the system's
own labels, variable names, or the standard's published vocabulary; only the
method is implemented, and the credit lives in this note.

## What changed (and why)

The previous Rung 2 model was an **answer-key** frame: experts were collapsed
into one consensus verdict per record (`keyFromExperts`), and the engine was
scored by how often it matched that key. That discards the spread, which for
judgment-heavy records *is the data*.

Per the study owner's decision (2026-06-14), the answer-key logic was **not
removed**; it was **reframed and kept only at high agreement**:

- The full **expert distribution** per record is preserved and shown; it is no
  longer collapsed to a single "correct" value.
- Inter-rater **agreement** is a first-class, displayed metric, reported with a
  chance-corrected statistic (Fleiss generalisation for a variable number of
  raters per item) alongside raw percent agreement, always with its N.
- A single-verdict comparison may still be described as a **benchmark**, but
  only when expert-to-expert agreement clears the configured threshold.
  Otherwise the surface downgrades to **reference panel** and states that the
  figures characterise alignment with informed professional judgment, not
  correctness against one truth. Default-when-unset is the conservative
  "reference panel".

## The four diagnostic questions (implementation map)

Computed per record and in aggregate, each gated and N-stamped:

- **(a) Range coverage** — does the engine's verdict fall within the *observed*
  set of expert verdicts for that record? Computed from real scores only; the
  range is never widened or padded to capture the engine.
- **(b) Comparable agreement rate** — engine-vs-expert agreement vs the
  expert-vs-expert agreement (the reference rate computed in 3.2, not a
  hardcoded target).
- **(c) Defensible divergence** — out-of-range engine verdicts are **flagged for
  human review**, never auto-classified right or wrong.
- **(d) Systematic divergence by background** — engine agreement broken down by
  each expert's `role` (background) tag. If no expert carries a background tag,
  this renders **"background missing,"** never a pass.

## Provenance and lane separation

- Expert vs bench-lane is determined by `isExpert(code)` (code starts with `E`).
  Anonymous/uncoded reviewers are structurally excluded from every expert
  statistic; they only contribute to the separate reviewer-reliability figure.
- The background tag is `bench_labels.role` (self-reported at intake). Every
  aggregate can render its per-background breakdown; pooling mixed backgrounds
  without the breakdown available is treated as a defect.

## Anti-fabrication gates (must stay true)

- `MIN_EXPERTS` gates **every** distribution statistic. If it is unset/invalid,
  `MIN_EXPERTS_EFF` becomes `Infinity` and the gate **fails closed** (nothing
  computes). Below the minimum, figures render **"insufficient expert data,"**
  not a number, a zero, or a blank.
- No expert opinion is ever synthesized, interpolated, defaulted, or
  mean-substituted to fill a sparse distribution.
- Range coverage is computed from real scores only.
- Every displayed figure carries its **N** and the **cohort version**.
- An empty or under-powered distribution renders loudly as insufficient.

## Cohort versioning

Lightweight, live: the cohort version is derived from the current distinct
expert set (`v{count}·{hash of sorted codes}`) and is stamped on every Rung 2
figure and export. Adding an expert visibly changes the version; a result is
always read against the cohort it was computed for. (A heavier stored-snapshot
cohort system was considered and deferred by the study owner.)

## Configuration (placeholders — study owner to set)

| Constant | Meaning | Default | Status |
|---|---|---|---|
| `MIN_EXPERTS` | min distinct experts before any distribution stat computes | 3 | **PLACEHOLDER** — fails closed if unset |
| `BENCHMARK_KAPPA_THRESHOLD` | **chance-corrected** expert agreement (Fleiss kappa) at/above which "benchmark" is allowed | 0.6 | **PLACEHOLDER** — defaults to "reference panel" if unset |

> Reliability note: the benchmark/reference-panel label is governed by the
> **chance-corrected** kappa, never by raw percent agreement. Raw percent
> agreement is displayed for context only. (Audit fix, 2026-06-14.)

Surfaces implementing this: `bench-results.html`, `research-data.html`
(Rung 2 block). Both compute live client-side from the `bench_*` tables.
