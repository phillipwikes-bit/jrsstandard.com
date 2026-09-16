import { RETENTION, cutoffISO, selectExpired } from '../../lib/retention/policy.js';
let pass = 0, fail = 0;
const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const NOW = '2026-09-16T12:00:00.000Z';
t('policy targets interaction_events only', RETENTION.table === 'interaction_events');
t('research tables are excluded', ['bench_outcomes','bench_labels','study_runs','findings_history'].every(x => RETENTION.excluded_tables.includes(x)));
t('pilot_contacts excluded (consent regime, not a schedule)', RETENTION.excluded_tables.includes('pilot_contacts'));
t('engine_reviews excluded (B-013A undecided)', RETENTION.excluded_tables.includes('engine_reviews'));
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

console.log(`\n${pass + fail} checks, ${fail} failed`);
process.exit(fail ? 1 : 0);
