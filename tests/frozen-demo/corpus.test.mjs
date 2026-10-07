// The frozen corpus: hashes, synthetic markers, allowed scope, fictional entities, development-material
// registration, separation from every other development text, and the separate corpus commit.
import { execFileSync } from 'node:child_process';
import { t, done, ROOT, IN_REPO, IDS, read, json, record, V } from './_helpers.mjs';
import { sha256 } from '../../lib/engine-candidate/source-prep.js';
import { EXCLUDED_DOMAINS } from '../../lib/engine-candidate/review-candidate.js';
import { isDevelopmentMaterial } from '../../lib/engine-candidate/dev-material.js';
import { buildIndex, screen } from '../../lib/engine-candidate/contamination.js';
import { loadDevelopmentTexts } from '../engine-candidate/shared/dev-index.mjs';

const manifest = json('tools/frozen-demo/demo-manifest.json');
const index = json('tools/frozen-demo/corpus/v0.1.0/INDEX.json');
t('the corpus holds exactly five records, FD-01 to FD-05', index.records.map((r) => r.record_id).join() === IDS.join());
t('the corpus index is bound by hash in the manifest', sha256(read('tools/frozen-demo/corpus/v0.1.0/INDEX.json')) === manifest.corpus.index_sha256);
const DEMONSTRATES = ['complete_reconstructable_record', 'missing_identifiable_basis', 'chronology_gap', 'missing_logical_bridge', 'partial_record_refused_before_model_review'];
for (const [i, id] of IDS.entries()) {
  const raw = read('tools/frozen-demo/corpus/v0.1.0/' + id + '.json'), r = JSON.parse(raw), m = manifest.records[i];
  t(id + ': record file hash equals the manifest', sha256(raw) === m.file_sha256);
  t(id + ': source hash is the hash of the text, in the record, index and manifest', sha256(r.text) === r.source_sha256 && r.source_sha256 === m.source_sha256 && index.records[i].source_sha256 === m.source_sha256);
  t(id + ': frozen ID, version 1 and creation date 2026-10-07', r.record_id === id && r.record_version === '1' && r.created === '2026-10-07');
  t(id + ': demonstrates ' + DEMONSTRATES[i], r.demonstrates === DEMONSTRATES[i] && m.demonstrates === DEMONSTRATES[i]);
  t(id + ': marked SYNTHETIC in its flag, label, record reference and the first words of its text', r.synthetic === true && /^SYNTHETIC DEMONSTRATION RECORD\./.test(r.synthetic_label) && r.record_ref === 'SYNTHETIC-' + id && r.text.startsWith('SYNTHETIC DEMONSTRATION RECORD ' + id + '. Fictional organisations, people, dates and facts. Not a real record.'));
  t(id + ': a completed, non-HR supplier-access exception draft', JSON.stringify(r.scope.profile) === JSON.stringify(V.PROFILE) && /Supplier-access exception, completed draft\./.test(r.text));
  t(id + ': no employment, housing, lending, insurance, medical or legal-outcome content', EXCLUDED_DOMAINS.every(([, re]) => !re.test(r.text)));
  t(id + ': classified as a frozen synthetic demonstration record, not a holdout', r.classification === 'frozen_synthetic_demonstration_record' && r.holdout === false && r.development_material === true);
  t(id + ': registered as development material, so a holdout builder refuses it', isDevelopmentMaterial(r.text) === 'frozen-demo/v0.1.0/' + id);
  t(id + ': carries expected input findings, expected candidate behaviour and limitations', r.expected.input_preparation && r.expected.candidate && r.limitations.length >= 5 && r.limitations.some((l) => /^SYNTHETIC\./.test(l)));
  t(id + ': dates are fictional (2031) and the text carries no contact detail', (r.text.match(/\b(19|20)\d\d\b/g) || []).every((y) => y === '2031') && !/@|https?:|www\./.test(r.text));
}
t('only FD-05 has no scripted mock response, and it is the refusal case', IDS.filter((id) => record(id).expected.mock_response === null).join() === 'FD-05' && record('FD-05').expected.candidate.adapter_called === false);
t('FD-01 carries the three scope probes', record('FD-01').expected.scope_probes.map((p) => p.expected.reason).join() === 'hr_status_not_declared_false,out_of_scope_record_type,draft_not_completed');

// Separation: no demonstration text reuses or closely copies any other development text.
const others = loadDevelopmentTexts().filter((d) => !d.name.startsWith('frozen-demo/'));
t('the other development texts number 89', others.length === 89);
const idx = buildIndex(others.map((d) => ({ name: d.name, text: d.text })));
for (const id of IDS) t(id + ': no exact or possible match with the 89 other development texts', screen(record(id).text, idx).status === 'no_match_found');
t('no demonstration text quotes a registered fixture, regression or corpus sentence', IDS.every((id) => others.every((d) => !d.text.includes(record(id).text.split('\n')[2].slice(0, 60)))));

// Fictional entities: closed-world, every capitalised word accounted for.
for (const id of IDS) {
  const r = record(id), words = new Set([...r.fictional_entities.organisations, ...r.fictional_entities.people].flatMap((n) => n.split(/\s+/)));
  const allowed = new Set([...manifest.corpus.allowed_capitalised_words, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);
  const stray = [...r.text.matchAll(/\b[A-Z][A-Za-z]*\b/g)].map((m) => m[0]).filter((w) => !words.has(w) && !allowed.has(w));
  t(id + ': every capitalised word is a month, a listed word or a declared fictional entity', stray.length === 0, stray.join(', '));
  t(id + ': no real-organisation, real-person or contact marker', V.REAL_MARKERS.every((re) => !re.test(r.text)));
}

if (IN_REPO) {
  const files = execFileSync('git', ['show', '--name-only', '--format=', manifest.corpus_commit], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n');
  t('the corpus was committed alone, before the runner, verifier and viewer', files.length === 6 && files.every((f) => f.startsWith('tools/frozen-demo/corpus/v0.1.0/')), files.join(', '));
  const at = (p) => execFileSync('git', ['show', manifest.corpus_commit + ':' + p], { cwd: ROOT, encoding: 'utf8' });
  t('the committed corpus is unchanged since its own commit', IDS.every((id) => at('tools/frozen-demo/corpus/v0.1.0/' + id + '.json') === read('tools/frozen-demo/corpus/v0.1.0/' + id + '.json')) && at('tools/frozen-demo/corpus/v0.1.0/INDEX.json') === read('tools/frozen-demo/corpus/v0.1.0/INDEX.json'));
}
done();
