// JRS RETENTION POLICY — BOARD DECISION BD-03 (B-013C), 2026-09-16.
//
// WHY THIS EXISTS. interaction_events had NO stated retention. "Indefinitely"
// was therefore the position, and nobody chose it. An unchosen default is the
// weakest governance posture available, and it was the one thing in B-013C that
// was free to improve.
//
// THE RULE. interaction_events rows older than 24 months are deleted.
//
// WHY 24 MONTHS. The research programme's study windows are measured in months;
// the longest recorded study ran 12 June to 21 August 2026. Aggregate counts are
// derived and stored separately, so deleting raw rows does not disturb a
// published figure. No analysis in the estate reaches back further than a year.
//
// WHAT IS DELIBERATELY NOT COVERED. This policy applies to interaction_events
// ONLY. It does NOT cover:
//   - bench_outcomes, bench_labels, study_runs, findings_history: RESEARCH
//     EVIDENCE. Deleting research records to satisfy a retention rule would be
//     destroying evidence, which the governance framework prohibits outright.
//   - pilot_contacts: personal data under a separate consent regime, where
//     deletion is a data-subject right rather than a schedule.
//   - engine_reviews: subject to B-013A, undecided as to persistence.
// Extending this rule to any of those requires a separate decision.
//
// THIS MODULE COMPUTES. IT DOES NOT DELETE. Applying it to production is a
// production data operation and is not authorized here. selectExpired() returns
// what WOULD be removed so the boundary conditions can be tested against real
// timestamps without touching a row.

export const RETENTION = {
  version: '1.0',
  decided: '2026-09-16',
  decision: 'BD-03',
  table: 'interaction_events',
  months: 24,
  excluded_tables: [
    'bench_outcomes', 'bench_labels', 'study_runs', 'findings_history',
    'pilot_contacts', 'engine_reviews',
  ],
};

// Cutoff by calendar month, not by 730 days: a month-based rule expressed in
// days drifts across leap years and February, and a retention boundary that
// moves is a retention boundary nobody can audit.
export function cutoffISO(now, months) {
  const m = months == null ? RETENTION.months : months;
  const d = new Date(now instanceof Date ? now.getTime() : Date.parse(now));
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - m, 1,
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
  // Clamp to the last valid day of the target month, so 31 March minus 24
  // months does not silently roll into a different month.
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString();
}

// Strictly older than the cutoff. A row exactly on the boundary is KEPT: when a
// rule is ambiguous at its edge, retaining is the reversible choice.
export function selectExpired(rows, now, months) {
  const cutoff = cutoffISO(now, months);
  const cutoffMs = Date.parse(cutoff);
  const expired = [];
  const kept = [];
  for (const r of rows || []) {
    const ts = r && r.created_at ? Date.parse(r.created_at) : NaN;
    // A row with no parseable timestamp is KEPT and reported. Deleting a row
    // because its date could not be read is exactly the wrong failure direction.
    if (!Number.isFinite(ts)) { kept.push(r); continue; }
    (ts < cutoffMs ? expired : kept).push(r);
  }
  return { cutoff, expired, kept, would_delete: expired.length, would_keep: kept.length };
}
