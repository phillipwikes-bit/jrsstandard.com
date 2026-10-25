// EV-32 correction: regression cases and pre-declared expectations, written and sealed BEFORE any
// change to the 0.3.2-candidate code. Records are read (never modified) from the sealed V0 corpus.
// Authorship: Claude Code under owner decision V0-02 (2026-10-25); AI-assisted.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
if (existsSync(join(HERE, 'SEAL.json'))) { console.error('sealed; post-seal modification prohibited'); process.exit(2); }
const V0 = join(HERE, '..', '..', 'validation-readiness-gate-v0-2026-10-25', 'corpus');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const C = ['reconstructability', 'identifiable_basis', 'chronology_integrity', 'reasoning_traceability', 'sufficiency'];
const S = 'supported', RR = 'review_required';
const st = (a) => Object.fromEntries(C.map((c, i) => [c, a[i]]));
const obsOf = (id) => JSON.parse(JSON.parse(readFileSync(join(V0, 'cases', id + '.candidate.json'), 'utf8')).envelope.content[0].text).observations;
const ob = (id, c, s, quote, type) => ({ observation_id: id, condition_id: c, proposed_status: s, quote, assertion_type: type });

const cases = [
  { id: 'RC-01', record: 'EV-04', purpose: 'EV-32 replica: request date and expiry date cited as stated_date for chronology (different event roles).',
    extra: [ob('O7', C[2], S, 'Access expires 2026-09-30', 'stated_date')],
    v031: { statuses: [S, S, RR, S, RR], conflicts: ['cited_evidence_conflict'] }, v032: { statuses: [S, S, S, S, RR], conflicts: [] } },
  { id: 'RC-02', record: 'EV-01', purpose: 'Request date and authority (decision) date cited as stated_date (different event roles).',
    extra: [ob('O7', C[2], S, 'Approved by the Exception Review Board, minutes ERB-2026-07, item 4, on 2026-03-09', 'stated_date')],
    v031: { statuses: [S, S, RR, S, RR], conflicts: ['cited_evidence_conflict'] }, v032: { statuses: [S, S, S, S, RR], conflicts: [] } },
  { id: 'RC-03', record: 'EV-12', purpose: 'Two different decision dates cited as stated_date (same event role): the conflict must persist.',
    extra: [ob('O7', C[2], S, 'decision recorded 2026-07-15', 'stated_date'), ob('O8', C[2], S, 'Approved by the Exception Review Board, minutes ERB-2026-23, item 4, on 2026-07-13', 'stated_date')],
    v031: { statuses: [RR, S, RR, S, RR], conflicts: ['cited_evidence_conflict', 'decision_date_conflict'] }, v032: { statuses: [RR, S, RR, S, RR], conflicts: ['cited_evidence_conflict', 'decision_date_conflict'] } },
  { id: 'RC-04', record: 'EV-14', purpose: 'Two different expiry dates cited as stated_expiry (same event role): the conflict must persist.',
    extra: [ob('O7', C[2], S, 'Access expires 2026-07-31', 'stated_expiry'), ob('O8', C[2], S, 'Valid until: 2026-08-31', 'stated_expiry')],
    v031: { statuses: [S, S, RR, S, RR], conflicts: ['cited_evidence_conflict', 'expiry_date_conflict'] }, v032: { statuses: [S, S, RR, S, RR], conflicts: ['cited_evidence_conflict', 'expiry_date_conflict'] } },
  { id: 'RC-05', record: 'EV-01', purpose: 'A date in the basis section (no event role) and the request date: an unknown role keeps the conflict (conservative).',
    extra: [ob('O7', C[2], S, 'based on assessment RA-2026-14 completed 2026-03-05', 'stated_date')],
    v031: { statuses: [S, S, RR, S, RR], conflicts: ['cited_evidence_conflict'] }, v032: { statuses: [S, S, RR, S, RR], conflicts: ['cited_evidence_conflict'] } },
];
mkdirSync(join(HERE, 'cases'), { recursive: true });
const index = [];
for (const c of cases) {
  const recordPath = 'cases/' + c.record + '.record.txt';
  const recordText = readFileSync(join(V0, recordPath), 'utf8');
  const observations = [...obsOf(c.record), ...c.extra];
  const behaviour = { envelope: { status: 'ok', stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ contract_version: 'jrs-engine-local-0.3.0-evidence-graph', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', observations }, null, 2) }], usage: { input_tokens: 0, output_tokens: 0 } } };
  const exp = (e) => ({ intake_decision: 'proceed', statuses: st(e.statuses), conflict_kinds: [...e.conflicts].sort() });
  const spec = { case_id: c.id, purpose: c.purpose, record_source: 'V0 sealed corpus ' + recordPath, record_sha256: sha(recordText), expected: { '0.3.1-candidate': exp(c.v031), '0.3.2-candidate': exp(c.v032) },
    expectation_authority: 'owner-authorized correction scope (V0-02); AI-assisted drafting; not ground truth' };
  writeFileSync(join(HERE, 'cases', c.id + '.candidate.json'), JSON.stringify(behaviour, null, 2) + '\n');
  writeFileSync(join(HERE, 'cases', c.id + '.spec.json'), JSON.stringify(spec, null, 2) + '\n');
  index.push(c.id);
}
writeFileSync(join(HERE, 'V0_EXPECTED_DELTA.json'), JSON.stringify({
  statement: 'Pre-declared change to the sealed V0 corpus expectations under 0.3.2-candidate. Every other V0 case must match its sealed V0 expectation exactly.',
  deltas: { 'EV-32': { statuses: { chronology_integrity: 'supported' }, conflict_kinds: [] } } }, null, 2) + '\n');
console.log('wrote', index.length, 'regression cases');
