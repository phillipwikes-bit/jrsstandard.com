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
//   - pilot_contacts: personal data under a separate consent regime.
// Extending this rule to any of those requires a separate decision.
//
// engine_reviews IS covered, but by a DIFFERENT rule (BD-10, below). It was
// excluded here while B-013A was undecided; that reason expired when B-013A was
// decided, and Round B flagged the resulting gap as T-4. The rule was NOT
// extended by inference: page-view telemetry and a model rewrite of someone's
// disciplinary record are not the same risk and do not get the same clock.
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
    'pilot_contacts',
  ],
};

// BD-10 (T-4), 2026-09-16. engine_reviews is a MIXED table: metadata and
// evaluation results alongside model output derived from the customer's record.
// A single rule for the whole table would either keep the sensitive text too
// long or delete the reproducibility evidence to remove it. So the rule is
// field-level, and the row survives.
//
// EXPIRE means NULL IN PLACE, not delete the row. The statuses, the
// determination and overall_consistency are the reproducibility evidence;
// destroying them to remove text that can be removed on its own would be
// maximum deletion, not minimum necessary.
export const ENGINE_REVIEW_RETENTION = {
  version: '1.0',
  decided: '2026-09-16',
  decision: 'BD-10',
  table: 'engine_reviews',
  months: 3,
  // Dotted paths into the row. Each is model output ABOUT the record, or in the
  // case of input_preview a raw excerpt of it. input_preview stopped being
  // written on 2026-08-14; the COLUMN still exists, so it is named here.
  expiring_fields: [
    'conditions.*.note',
    'finding.compliant_version',
    'input_preview',
  ],
  retained_fields: [
    'id', 'created_at', 'request_id', 'determination', 'conditions.*.status',
    'finding.condition_triggered', 'runs', 'overall_consistency', 'engine_version',
  ],
};

// Returns the rows that WOULD have fields expired, and the redacted form each
// would take. It computes; it does not write. Same safety pattern as
// selectExpired: a caller cannot use this module to delete anything.
export function selectExpiringFields(rows, now) {
  const cutoffMs = Date.parse(cutoffISO(now, ENGINE_REVIEW_RETENTION.months));
  const affected = [];
  const untouched = [];
  for (const r of rows || []) {
    const ts = r && r.created_at ? Date.parse(r.created_at) : NaN;
    // Same fail-closed rule: an unreadable date is never a reason to redact.
    if (!Number.isFinite(ts) || ts >= cutoffMs) { untouched.push(r); continue; }
    const redacted = JSON.parse(JSON.stringify(r));
    let changed = false;
    if (redacted.conditions && typeof redacted.conditions === 'object') {
      for (const k of Object.keys(redacted.conditions)) {
        const c = redacted.conditions[k];
        if (c && typeof c === 'object' && c.note != null) { c.note = null; changed = true; }
      }
    }
    if (redacted.finding && typeof redacted.finding === 'object'
        && redacted.finding.compliant_version != null) {
      redacted.finding.compliant_version = null; changed = true;
    }
    if (redacted.input_preview != null) { redacted.input_preview = null; changed = true; }
    (changed ? affected : untouched).push(changed ? redacted : r);
  }
  return {
    cutoff: cutoffISO(now, ENGINE_REVIEW_RETENTION.months),
    affected, untouched,
    would_redact: affected.length,
    would_leave: untouched.length,
  };
}

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
