// The intake validator (verifier section D) and its command-line wrapper.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { t, done, PKG, M, has, clone } from './_helpers.mjs';
import { DEVELOPMENT_MATERIAL, materialHash } from '../../lib/engine-candidate/dev-material.js';
import { loadDevelopmentTexts } from '../engine-candidate/shared/dev-index.mjs';

const V = M.intake.validateIntake, B = M.probes.BASE_INTAKE;
t('intake is closed: INTAKE_OPEN is false', M.intake.INTAKE_OPEN === false);
const base = V(B);
t('a well-formed synthetic declaration is WELL_FORMED_NOT_ADMITTED, never admitted', base.decision === 'WELL_FORMED_NOT_ADMITTED' && has(base, 'intake_closed', 'INT-00'), JSON.stringify(base));
t('even with a registry that claims intake is open, nothing is admitted', V(B, { registry: { intake: { state: 'INTAKE_OPEN', opening_record_ref: 'SYNTHETIC-OPEN' } } }).decision !== 'ADMITTED');
for (const [id, what, decl, code, control] of M.probes.INTAKE_PROBES) {
  const r = V(decl);
  t(id + ' refuses: ' + what + ' (' + control + ' ' + code + ')', r.decision === 'REFUSED' && has(r, code, control), JSON.stringify(r.codes.map((c) => c.control + ':' + c.code)));
}
for (const d of M.voc.REFUSED_DOMAINS) t('the excluded domain ' + d + ' is refused', has(V({ ...clone(B), record_category: d }), 'out_of_scope_record_category', 'INT-04'));
t('a category merely absent from the allow-list is refused', has(V({ ...clone(B), record_category: 'vendor_contract_renewal' }), 'out_of_scope_record_category', 'INT-04'));
t('every refusal message names its control and gives a reason', M.probes.INTAKE_PROBES.every(([, , d]) => V(d).codes.every((c) => /^INT-\d\d$/.test(c.control) && typeof c.message === 'string' && c.message.length > 10)));
t('a long string anywhere in a declaration is treated as record content', has(V({ ...clone(B), source_reference: 'x'.repeat(401) }), 'raw_record_text', 'INT-02'));
for (const f of M.voc.RECORD_TEXT_FIELDS) t('the field "' + f + '" is refused as record content', has(V({ ...clone(B), notes: { [f]: 'SYNTHETIC' } }), 'raw_record_text', 'INT-02'));
// Contamination: every registered development text and every frozen demo record is refused by digest.
const texts = loadDevelopmentTexts();
t('every one of the 94 development texts is refused by its digest', texts.length === 94 && texts.every((d) => { const x = clone(B); x.input.input_digest = materialHash(d.text); const r = V(x); return r.decision === 'REFUSED' && (has(r, 'development_material', 'INT-09') || has(r, 'frozen_demo_material', 'INT-09')); }));
t('the five frozen demo records are refused specifically as frozen-demo material', texts.filter((d) => d.name.startsWith('frozen-demo/')).every((d) => { const x = clone(B); x.input.input_digest = materialHash(d.text); return has(V(x), 'frozen_demo_material', 'INT-09'); }));
t('a whitespace-only reformatting of a development text has the same digest and is refused', (() => { const x = clone(B); x.input.input_digest = materialHash('  ' + texts[5].text.replace(/\s+/g, '\n\n') + ' '); return has(V(x), 'development_material', 'INT-09'); })());
t('an edited copy is NOT caught by digest matching (documented limit, not independence)', (() => { const x = clone(B); x.input.input_digest = materialHash(texts[5].text + ' edited'); return !has(V(x), 'development_material'); })());
t('the registry list and the validator agree on every development digest', DEVELOPMENT_MATERIAL.every(([h]) => M.intake.developmentMatch(h) !== null));
t('an uppercase or wrong-algorithm digest is refused', (() => { const x = clone(B); x.input.digest_algorithm = 'md5'; const y = clone(B); y.input.input_digest = y.input.input_digest.toUpperCase(); return has(V(x), 'input_digest_missing') && has(V(y), 'input_digest_missing'); })());
t('a declaration that requests agreement or carries a drr_score field is refused', has(V({ ...clone(B), drr_score: null }), 'score_before_freeze', 'INT-11') && has(V({ ...clone(B), requested_actions: ['agreement_statistic'] }), 'score_before_freeze', 'INT-11'));
t('a non-object is refused', V(null).decision === 'REFUSED' && V([]).decision === 'REFUSED' && V('text').decision === 'REFUSED');
t('the validator never changes the declaration it is given', (() => { const x = clone(B); V(x); return JSON.stringify(x) === JSON.stringify(B); })());

// The command-line wrapper.
const tmp = mkdtempSync(join(tmpdir(), 'jrs-er-intake-'));
const cli = (o, name = 'd.json') => { const p = join(tmp, name); writeFileSync(p, typeof o === 'string' ? o : JSON.stringify(o)); try { return { code: 0, out: execFileSync(process.execPath, [PKG + 'validate-intake.mjs', p], { encoding: 'utf8' }) }; } catch (e) { return { code: e.status, out: String(e.stdout) }; } };
t('CLI: a well-formed synthetic declaration exits 0 with WELL_FORMED_NOT_ADMITTED', (() => { const r = cli(B); return r.code === 0 && /WELL_FORMED_NOT_ADMITTED/.test(r.out) && /INT-00 intake_closed/.test(r.out); })());
t('CLI: an out-of-scope declaration exits 1 and names INT-04', (() => { const r = cli({ ...clone(B), record_category: 'medical' }); return r.code === 1 && /REFUSED  INT-04 out_of_scope_record_category/.test(r.out); })());
t('CLI: a file large enough to hold a record is refused unread', (() => { const r = cli('{"x":"' + 'a'.repeat(40000) + '"}'); return r.code === 1 && /record content is never read/.test(r.out); })());
t('CLI: a non-JSON file (for example a record) is refused unread', (() => { const r = cli('SYNTHETIC', 'record.txt'); return r.code === 1 && /INT-02/.test(r.out); })());
rmSync(tmp, { recursive: true, force: true });
done();
