import { RETENTION, ENGINE_REVIEW_RETENTION, cutoffISO, cutoffDaysISO, selectExpired, selectExpiringFields } from '../../lib/retention/policy.js';
let pass = 0, fail = 0;
const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const NOW = '2026-09-16T12:00:00.000Z';
t('policy targets interaction_events only', RETENTION.table === 'interaction_events');
t('research tables are excluded', ['bench_outcomes','bench_labels','study_runs','findings_history'].every(x => RETENTION.excluded_tables.includes(x)));
t('pilot_contacts excluded (consent regime, not a schedule)', RETENTION.excluded_tables.includes('pilot_contacts'));
// SUPERSEDED 2026-09-16 by BD-10. This previously asserted that engine_reviews
// was excluded from retention "(B-013A undecided)". That exclusion's stated
// reason expired when B-013A was decided, and Round B raised the resulting gap
// as T-4. The assertion is REPLACED, not deleted, and the replacement captures
// the invariant that now matters: engine_reviews is covered, but by its OWN
// rule, and must never silently inherit the telemetry clock.
t('engine_reviews is covered by its own rule, not the telemetry rule',
  !RETENTION.excluded_tables.includes('engine_reviews')
  && ENGINE_REVIEW_RETENTION.table === 'engine_reviews'
  && ENGINE_REVIEW_RETENTION.months !== RETENTION.months);
t('cutoff is 24 months back', cutoffISO(NOW).startsWith('2024-09-16'), cutoffISO(NOW));

// Boundary conditions
const rows = [
  { id: 'a', created_at: '2024-09-16T11:59:59.000Z' }, // 1s older than cutoff
  { id: 'b', created_at: '2024-09-16T12:00:00.000Z' }, // exactly on it
  { id: 'c', created_at: '2024-09-16T12:00:01.000Z' }, // 1s newer
  { id: 'd', created_at: '2026-06-01T00:00:00.000Z' }, // the real earliest data
  { id: 'e' },                                          // no timestamp
  { id: 'f', created_at: 'not-a-date' },                // unparseable
];
const r = selectExpired(rows, NOW);
t('strictly older is expired', r.expired.some(x => x.id === 'a'));
t('exactly on the boundary is KEPT', r.kept.some(x => x.id === 'b'));
t('newer is kept', r.kept.some(x => x.id === 'c'));
t('missing timestamp is KEPT, not deleted', r.kept.some(x => x.id === 'e'));
t('unparseable timestamp is KEPT, not deleted', r.kept.some(x => x.id === 'f'));
t('would_delete counts only the expired', r.would_delete === 1, String(r.would_delete));

// The real-data no-op claim, tested rather than asserted.
const real = selectExpired([{ id: 'x', created_at: '2026-06-03T00:00:00.000Z' }], NOW);
t('first application against the real earliest row is a NO-OP', real.would_delete === 0);

// Leap-year / month-end behaviour
t('31 March minus 24 months stays in March', cutoffISO('2026-03-31T00:00:00Z').startsWith('2024-03-31'));
t('29 Feb source clamps to a valid day', /^2024-02-2[89]/.test(cutoffISO('2026-02-28T00:00:00Z')) || cutoffISO('2026-02-28T00:00:00Z').startsWith('2024-02-28'), cutoffISO('2026-02-28T00:00:00Z'));

// The module must not be able to delete anything.
const src = await import('node:fs').then(fs => fs.readFileSync(new URL('../../lib/retention/policy.js', import.meta.url), 'utf8'));
t('module contains no DELETE and no fetch', !/\bDELETE\b/i.test(src.replace(/\/\/.*/g,'')) && !/fetch\s*\(/.test(src));

// ---- BD-10 (T-4): engine_reviews field-level expiry, 90 days, null in place.
t('BD-10 targets engine_reviews', ENGINE_REVIEW_RETENTION.table === 'engine_reviews');
// SUPERSEDED 2026-09-16, same day, by the Round F verification pass. This
// previously read `ENGINE_REVIEW_RETENTION.months === 3 && RETENTION.months === 24`.
// It pinned the exact value that was WRONG: three calendar months is 89 to 92
// days and the public disclosure promises 90, so the assertion was holding the
// defect in place rather than catching it. REPLACED, not deleted. The
// replacement asserts the invariant that survives the correction: the two rules
// are separate, in different units, and BD-10 must never inherit the telemetry
// clock by inference.
t('BD-10 period differs from the telemetry rule, and in a different unit',
  ENGINE_REVIEW_RETENTION.days === 90 && RETENTION.months === 24
  && ENGINE_REVIEW_RETENTION.days !== RETENTION.months);
t('BD-10 was NOT extended by inference from interaction_events',
  ENGINE_REVIEW_RETENTION.table !== RETENTION.table
  && ENGINE_REVIEW_RETENTION.decision === 'BD-10');
t('engine_reviews no longer excluded from retention entirely', !RETENTION.excluded_tables.includes('engine_reviews'));
t('research tables still excluded from deletion', ['bench_outcomes','study_runs','findings_history'].every(x => RETENTION.excluded_tables.includes(x)));

const SENS = 'Dana Okonkwo was dismissed on 14 March following the incident report.';
const mk = (created_at) => ({
  id: 'r', created_at, determination: 'review_required', runs: 3,
  overall_consistency: 0.87, engine_version: '0.1.0-validation', request_id: 'req-1',
  conditions: { basis_identification: { status: 'gap', note: 'Grounded: ' + SENS } },
  finding: { condition_triggered: 'basis_identification', compliant_version: 'Rewrite: ' + SENS },
  input_preview: SENS,
});

const old = selectExpiringFields([mk('2026-01-01T00:00:00.000Z')], NOW);
t('BD-10 old row IS affected', old.would_redact === 1);
const red = old.affected[0];
t('BD-10 note nulled', red.conditions.basis_identification.note === null);
t('BD-10 compliant_version nulled', red.finding.compliant_version === null);
t('BD-10 input_preview nulled', red.input_preview === null);
t('BD-10 NO sensitive text survives redaction', !JSON.stringify(red).includes(SENS));
t('BD-10 status RETAINED', red.conditions.basis_identification.status === 'gap');
t('BD-10 determination RETAINED', red.determination === 'review_required');
t('BD-10 overall_consistency RETAINED', red.overall_consistency === 0.87);
t('BD-10 engine_version RETAINED', red.engine_version === '0.1.0-validation');
t('BD-10 condition_triggered RETAINED', red.finding.condition_triggered === 'basis_identification');
t('BD-10 row is NOT deleted, only redacted', red.id === 'r' && red.created_at === '2026-01-01T00:00:00.000Z');

const fresh = selectExpiringFields([mk('2026-09-01T00:00:00.000Z')], NOW);
t('BD-10 recent row untouched', fresh.would_redact === 0 && JSON.stringify(fresh.untouched[0]).includes(SENS));
const edge = selectExpiringFields([mk(cutoffDaysISO(NOW, 90))], NOW);
t('BD-10 row exactly on the cutoff is NOT redacted', edge.would_redact === 0);
const bad = selectExpiringFields([{ id: 'x', created_at: 'not-a-date', input_preview: SENS }], NOW);
t('BD-10 unparseable timestamp is NOT redacted', bad.would_redact === 0);
const none = selectExpiringFields([{ id: 'y', created_at: '2026-01-01T00:00:00.000Z' }], NOW);
t('BD-10 metadata-only row needs no redaction', none.would_redact === 0);
t('BD-10 empty dataset is safe', selectExpiringFields([], NOW).would_redact === 0 && selectExpiringFields(null, NOW).would_redact === 0);
const future = selectExpiringFields([mk('2027-01-01T00:00:00.000Z')], NOW);
t('BD-10 future-dated row untouched', future.would_redact === 0);
t('BD-10 policy carries version, decision id and date',
  !!ENGINE_REVIEW_RETENTION.version && ENGINE_REVIEW_RETENTION.decision === 'BD-10' && !!ENGINE_REVIEW_RETENTION.decided);

// ---------------------------------------------------------------------------
// BD-10 BOUNDARY SUITE, added 2026-09-16 by the Round F verification pass.
//
// WHY THESE EXIST. The suite tested "old is redacted, recent is not" and the
// exact cutoff, and passed while the policy expired at THREE CALENDAR MONTHS
// (89 to 92 days depending on the month) against a public disclosure promising
// 90. A boundary suite that never counts days cannot catch a unit error. Each
// test below states the day offset explicitly.
// ---------------------------------------------------------------------------
const atDay = (n) => new Date(Date.parse(NOW) - n * 86400000).toISOString();

t('BD-10 policy is expressed in DAYS, not calendar months',
  ENGINE_REVIEW_RETENTION.days === 90 && ENGINE_REVIEW_RETENTION.months === undefined);
t('BD-10 the disclosed number and the enforced number are the SAME number',
  ENGINE_REVIEW_RETENTION.days === 90);

t('BD-10 89 days old is NOT redacted', selectExpiringFields([mk(atDay(89))], NOW).would_redact === 0);
t('BD-10 exactly 90 days old is NOT redacted (boundary retains)',
  selectExpiringFields([mk(atDay(90))], NOW).would_redact === 0);
t('BD-10 90 days plus one second IS redacted',
  selectExpiringFields([mk(new Date(Date.parse(atDay(90)) - 1000).toISOString())], NOW).would_redact === 1);
t('BD-10 91 days old IS redacted', selectExpiringFields([mk(atDay(91))], NOW).would_redact === 1);
t('BD-10 92 days old IS redacted (the old calendar rule KEPT this row)',
  selectExpiringFields([mk(atDay(92))], NOW).would_redact === 1);

// The unit error, stated as a regression test rather than as a comment.
t('BD-10 REGRESSION: a row 91 days old is redacted in EVERY month of the year',
  ['2026-01-16','2026-03-16','2026-05-16','2026-06-16','2026-09-16','2026-12-16'].every((d) => {
    const now = d + 'T12:00:00.000Z';
    const row = mk(new Date(Date.parse(now) - 91 * 86400000).toISOString());
    return selectExpiringFields([row], now).would_redact === 1;
  }));

// UTC and zone stability. The cutoff must be a function of the instant, not of
// how the instant was spelled.
t('BD-10 cutoff is identical for the same instant written in two zones',
  cutoffDaysISO('2026-09-16T12:00:00.000Z', 90) === cutoffDaysISO('2026-09-16T08:00:00.000-04:00', 90));
t('BD-10 cutoff is UTC-normalised', cutoffDaysISO(NOW, 90).endsWith('Z'));
t('BD-10 a row 90 days old in a non-UTC spelling is still on the boundary',
  selectExpiringFields([mk(new Date(Date.parse(atDay(90))).toISOString())], '2026-09-16T08:00:00.000-04:00').would_redact === 0);

// Leap year, for the 90-day rule specifically. 29 Feb 2024 is inside a leap
// year; a day-count rule must simply count days across it.
t('BD-10 leap-year span counts real days, not calendar months',
  cutoffDaysISO('2024-05-29T00:00:00.000Z', 90).startsWith('2024-02-29'));
t('BD-10 a row 91 days old across 29 February IS redacted',
  selectExpiringFields([mk('2024-02-28T00:00:00.000Z')], '2024-05-29T00:00:00.000Z').would_redact === 1);

// Fail-closed, restated for the day rule.
t('BD-10 missing created_at is KEPT unredacted',
  selectExpiringFields([{ id: 'n', input_preview: SENS }], NOW).would_redact === 0);
t('BD-10 null created_at is KEPT unredacted',
  selectExpiringFields([{ id: 'n2', created_at: null, input_preview: SENS }], NOW).would_redact === 0);
t('BD-10 empty-string created_at is KEPT unredacted',
  selectExpiringFields([{ id: 'n3', created_at: '', input_preview: SENS }], NOW).would_redact === 0);

// The tables the rule must NOT reach, named individually per the directive.
for (const tbl of ['interaction_events','pilot_contacts','findings_history','study_runs','bench_outcomes','bench_labels']) {
  t(`BD-10 does not target ${tbl}`, ENGINE_REVIEW_RETENTION.table !== tbl);
}

// WHAT THIS SUITE DOES NOT TEST. It exercises the policy module only. No
// production row has been read, no expiry has been executed anywhere, and
// nothing here establishes that the rule has ever run. Production retention
// remains PRODUCTION VERIFICATION REQUIRED.

console.log(`\n${pass + fail} checks, ${fail} failed`);
process.exit(fail ? 1 : 0);
