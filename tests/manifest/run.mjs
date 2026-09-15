// JRS MANIFEST TEST HARNESS — development only.
// Synthetic data throughout. No production personal data is used anywhere here.
import { buildManifest, ENGINE_CONDITION_KEYS } from '../../lib/manifest/build.js';
import { validateManifest } from '../../tools/validate-manifest.js';
import { canonicalizeForHashing } from '../../lib/manifest/canonicalize.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SCHEMA = JSON.parse(readFileSync(new URL('../../schemas/jrs-decision-reconstruction-manifest.schema.json', import.meta.url), 'utf8'));
let pass = 0, fail = 0;
const t = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

const ENGINE = { name: 'JRS Review Engine', version: '0.1.0-validation', model: 'claude-haiku-4-5-20251001', api_version: 'v1' };
const BASE = { jrsVersion: '1.0', codebookVersion: '1.0', engine: ENGINE };

// A synthetic record carrying synthetic identifiers. None of these are real.
const SENSITIVE = [
  'Dana Okonkwo', 'dana.okonkwo@example.invalid', '555-0123-4567',
  '900-55-0001', '4111111111111111', '14 Fictional Road, Nowhere',
];
const SYNTHETIC_RECORD = `Following review, ${SENSITIVE[0]} (${SENSITIVE[1]}, ${SENSITIVE[2]}, SSN ${SENSITIVE[3]}, card ${SENSITIVE[4]}, of ${SENSITIVE[5]}) received a final written warning.`;

const engineResult = (opts = {}) => ({
  runs: opts.runs || 1,
  variance: opts.variance,
  result: {
    determination: opts.determination || 'review_required',
    conditions: Object.fromEntries(ENGINE_CONDITION_KEYS.map((k) => [k,
      opts.notes === false ? { status: 'review' }
        : { status: 'review', note: 'The stated basis is not traceable to a source in the file.' }])),
  },
});

const run = async () => {
  mkdirSync(new URL('./fixtures/', import.meta.url), { recursive: true });

  // ---- FIXTURE 1: clean, no record content
  const f1 = await buildManifest({ ...BASE, engineResult: engineResult({ notes: false }), sourceText: 'short record', includeNotes: false });
  t('F1 no-record manifest is valid', validateManifest(f1, SCHEMA).valid);
  t('F1 content_class = no_record_content', f1.content_class === 'no_record_content', f1.content_class);

  // ---- FIXTURE 2: derived content
  const f2 = await buildManifest({ ...BASE, engineResult: engineResult(), sourceText: SYNTHETIC_RECORD });
  t('F2 derived manifest is valid', validateManifest(f2, SCHEMA).valid);
  t('F2 content_class = derived_record_content', f2.content_class === 'derived_record_content', f2.content_class);

  // ---- FIXTURE 3: record-containing
  const f3 = await buildManifest({ ...BASE, engineResult: engineResult(), sourceText: SYNTHETIC_RECORD, rawRecord: SYNTHETIC_RECORD });
  t('F3 content_class = contains_record', f3.content_class === 'contains_record', f3.content_class);

  // ---- FIXTURE 4: truncation
  const f4 = await buildManifest({ ...BASE, engineResult: engineResult(), sourceText: 'y'.repeat(9000) });
  t('F4 input.truncated = true', f4.input.truncated === true);
  t('F4 length_chars pinned at the 8,000 limit', f4.input.length_chars === 8000, String(f4.input.length_chars));
  t('F4 carries source_hash for the full record', !!f4.input.source_hash);
  t('F4 evaluated hash differs from source hash', f4.input.hash !== f4.input.source_hash);

  // ---- FIXTURE 5: unresolved vocabulary is the default
  t('F5 condition_vocabulary defaults to review_engine_keys', f2.condition_vocabulary === 'review_engine_keys');
  t('F5 routing vocabulary declared', f2.routing.vocabulary === 'engine_determination');

  // ---- FIXTURE 6: silent relabeling must FAIL
  let threw = false, msg = '';
  try { await buildManifest({ ...BASE, engineResult: engineResult(), sourceText: 'x', conditionVocabulary: 'jrs_codebook_1.0' }); }
  catch (e) { threw = true; msg = e.message; }
  t('F6 relabeling to Codebook without a declared mapping THROWS', threw && /owner-declared mapping/.test(msg));

  // ---- §50 RED TEAM
  const rt = async (name, fn, expect) => { let e = null; try { await fn(); } catch (x) { e = x; } t('RT ' + name, expect ? !!e : !e, e ? '(threw: ' + e.message.slice(0, 70) + ')' : ''); };
  await rt('silent routing conversion refused (no openapi value present)', () => buildManifest({ ...BASE, engineResult: engineResult(), sourceText: 'x', routingVocabulary: 'openapi_1.0_routing' }), true);
  await rt('unknown routing vocabulary refused', () => buildManifest({ ...BASE, engineResult: engineResult(), sourceText: 'x', routingVocabulary: 'invented' }), true);
  await rt('unknown condition vocabulary refused', () => buildManifest({ ...BASE, engineResult: engineResult(), sourceText: 'x', conditionVocabulary: 'invented' }), true);
  await rt('invented condition status refused, not coerced', () => buildManifest({ ...BASE, sourceText: 'x', engineResult: { result: { determination: 'ready', conditions: Object.fromEntries(ENGINE_CONDITION_KEYS.map((k, i) => [k, { status: i === 0 ? 'excellent' : 'pass' }])) } } }), true);
  await rt('missing jrs_version refused', () => buildManifest({ ...BASE, jrsVersion: undefined, engineResult: engineResult(), sourceText: 'x' }), true);
  await rt('missing codebook_version refused', () => buildManifest({ ...BASE, codebookVersion: undefined, engineResult: engineResult(), sourceText: 'x' }), true);
  await rt('missing engine version refused', () => buildManifest({ ...BASE, engine: { ...ENGINE, version: undefined }, engineResult: engineResult(), sourceText: 'x' }), true);
  await rt('four conditions refused', () => buildManifest({ ...BASE, sourceText: 'x', engineResult: { result: { determination: 'ready', conditions: Object.fromEntries(ENGINE_CONDITION_KEYS.slice(0, 4).map((k) => [k, { status: 'pass' }])) } } }), true);

  // human-review default cannot be bypassed through the builder
  t('RT human_review.required is true and carries a reason', f2.human_review.required === true && !!f2.human_review.reason);
  t('RT human_review reason avoids a legal claim', !/required by law|legally/i.test(f2.human_review.reason));

  // content-class misclassification caught by the validator even if hand-forged
  const forged = JSON.parse(JSON.stringify(f2)); forged.content_class = 'no_record_content';
  t('RT forged no_record_content with notes is REJECTED', !validateManifest(forged, SCHEMA).valid);
  const relabelled = JSON.parse(JSON.stringify(f2)); relabelled.condition_vocabulary = 'jrs_codebook_1.0';
  t('RT hand-set jrs_codebook_1.0 is REJECTED by the validator', !validateManifest(relabelled, SCHEMA).valid);

  // ---- §51/§52 PRIVACY AND SECURITY
  const json1 = JSON.stringify(f1), json2 = JSON.stringify(f2);
  t('PRIV F1 contains no synthetic identifier', !SENSITIVE.some((s) => json1.includes(s)));
  t('PRIV F2 (derived) contains no synthetic identifier verbatim', !SENSITIVE.some((s) => json2.includes(s)));
  t('PRIV no raw record text in F2', !json2.includes(SYNTHETIC_RECORD));
  for (const bad of ['sk-ant-', 'ANTHROPIC_API_KEY', 'supabase.co', 'process.env', 'You are a', 'Bearer ', 'sb_publishable']) {
    t(`SEC no ${bad.trim()} in output`, !json2.includes(bad));
  }

  // ---- §24/§25 REPRODUCIBILITY, and the distinction that matters
  const fixed = { manifestId: '00000000-0000-4000-8000-000000000000', createdAt: '2026-09-15T00:00:00.000Z' };
  const a = await buildManifest({ ...BASE, ...fixed, engineResult: engineResult(), sourceText: SYNTHETIC_RECORD });
  const b = await buildManifest({ ...BASE, ...fixed, engineResult: engineResult(), sourceText: SYNTHETIC_RECORD });
  t('REPRO identical inputs give an identical canonical form', canonicalizeForHashing(a) === canonicalizeForHashing(b));
  t('REPRO identical inputs give an identical manifest hash', a.integrity.manifest_hash === b.integrity.manifest_hash);
  const c = await buildManifest({ ...BASE, engineResult: engineResult(), sourceText: SYNTHETIC_RECORD });
  t('REPRO manifest_id and created_at are the nondeterministic fields', c.integrity.manifest_hash !== a.integrity.manifest_hash);
  const tampered = JSON.parse(JSON.stringify(a)); tampered.routing.value = 'ready';
  t('INTEGRITY tampering with routing breaks the hash', !validateManifest(tampered, SCHEMA).valid);
  t('INTEGRITY unsigned manifest reports self-consistent, never authentic', /SELF-CONSISTENT \(not authenticated/.test(validateManifest(a, SCHEMA).integrity));

  // ---- write fixtures for the portability test
  const w = (n, o) => writeFileSync(new URL(`./fixtures/${n}`, import.meta.url), JSON.stringify(o, null, 2) + '\n');
  w('01-no-record.manifest.json', f1); w('02-derived.manifest.json', f2);
  w('03-contains-record.manifest.json', f3); w('04-truncated.manifest.json', f4);
  w('05-deterministic.manifest.json', a); w('06-forged-content-class.manifest.json', forged);

  console.log(`\n${pass + fail} checks, ${fail} failed`);
  process.exit(fail ? 1 : 0);
};
run();
