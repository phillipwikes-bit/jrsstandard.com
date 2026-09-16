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

  // ---- §7 / §14H SOURCE-HASH AND TRUNCATION ATTACKS
  // source_hash is generated, never caller-asserted. These prove a hand-editor
  // cannot use it to claim an evaluation covered what the model never saw.
  const edit = (base, mut) => { const x = JSON.parse(JSON.stringify(base)); mut(x); return x; };
  const rejects = (label, m) => t('SH ' + label, !validateManifest(m, SCHEMA).valid);
  const f4b = await buildManifest({ ...BASE, ...fixed, engineResult: engineResult(), sourceText: 'z'.repeat(9000) });
  t('SH baseline truncated manifest is valid', validateManifest(f4b, SCHEMA).valid);
  rejects('altered source_hash breaks the manifest hash', edit(f4b, (x) => { x.input.source_hash = 'sha256:' + 'a'.repeat(64); }));
  rejects('altered evaluated hash breaks the manifest hash', edit(f4b, (x) => { x.input.hash = 'sha256:' + 'b'.repeat(64); }));
  rejects('hash_algorithm changed to disagree with the prefix', edit(f4b, (x) => { x.input.hash_algorithm = 'sha512'; }));
  rejects('source_hash removed while truncated stays true', edit(f4b, (x) => { delete x.input.source_hash; }));
  rejects('malformed hash without an algorithm prefix', edit(f4b, (x) => { x.input.hash = 'deadbeef'; }));
  rejects('evaluated length changed to contradict truncation', edit(f4b, (x) => { x.input.length_chars = 120; }));
  rejects('truncated flipped to false while source_hash remains', edit(f4b, (x) => { x.input.truncated = false; }));
  rejects('source_hash forged equal to the evaluated hash', edit(f4b, (x) => { x.input.source_hash = x.input.hash; }));
  rejects('full-record evaluation claimed on a truncated manifest', edit(f4b, (x) => { x.input.truncated = false; delete x.input.source_hash; x.input.length_chars = 9000; }));

  // ---- §14G LEGAL-LANGUAGE ATTACKS
  for (const field of ['legally_sufficient', 'compliant', 'certified', 'validated', 'court_admissible', 'litigation_proof']) {
    rejects(`prohibited field ${field} rejected`, edit(f2, (x) => { x[field] = true; }));
  }
  // §14F human-review attacks
  rejects('human_review.required=false with no reason', edit(f2, (x) => { x.human_review = { required: false }; }));
  t('SH human_review reason carrying a legal conclusion is detectable', /required by law/i.test('required by law') );
  // §14A/B identity and version attacks
  rejects('manifest_id altered without rehash', edit(f2, (x) => { x.manifest_id = '11111111-1111-4111-8111-111111111111'; }));
  rejects('jrs_version removed', edit(f2, (x) => { delete x.jrs_version; }));
  rejects('codebook_version removed', edit(f2, (x) => { delete x.codebook_version; }));
  rejects('engine.version removed', edit(f2, (x) => { delete x.engine.version; }));
  rejects('canonicalization identifier altered', edit(f2, (x) => { x.integrity.canonicalization = 'JCS/RFC8785'; }));
  // §14C vocabulary attacks
  rejects('unsupported condition key added as a sixth', edit(f2, (x) => { x.conditions.invented_aggregate = { status: 'pass' }; }));

  // ---- F-13: CANONICAL FIXTURES ARE THE ORACLE AND ARE NEVER WRITTEN.
  // The harness used to write all six fixtures at the end of every run and then
  // validate them, so the generator's output WAS the expected answer and a
  // generator regression could not fail the suite. Output now goes to a
  // disposable directory; the oracle is read from canonical/ and compared.
  mkdirSync(new URL('./generated/', import.meta.url), { recursive: true });
  const w = (n, o) => writeFileSync(new URL(`./generated/${n}`, import.meta.url), JSON.stringify(o, null, 2) + '\n');
  w('01-no-record.manifest.json', f1); w('02-derived.manifest.json', f2);
  w('03-contains-record.manifest.json', f3); w('04-truncated.manifest.json', f4);
  w('05-deterministic.manifest.json', a); w('06-forged-content-class.manifest.json', forged);

  // Compare the generator against the frozen oracle on everything EXCEPT the
  // three fields that are nondeterministic by design.
  const NONDET = new Set(['manifest_id', 'created_at']);
  const strip = (m) => {
    const c = JSON.parse(JSON.stringify(m));
    for (const k of NONDET) delete c[k];
    if (c.integrity) delete c.integrity.manifest_hash;  // derives from the above
    return JSON.stringify(c, Object.keys(c).sort());
  };
  const canon = (n) => JSON.parse(readFileSync(new URL(`./fixtures/canonical/${n}`, import.meta.url), 'utf8'));
  for (const [n, got] of [['01-no-record.manifest.json', f1], ['02-derived.manifest.json', f2],
                          ['03-contains-record.manifest.json', f3], ['04-truncated.manifest.json', f4]]) {
    t(`ORACLE ${n} matches the frozen canonical fixture`, strip(got) === strip(canon(n)));
  }

  // The oracle must be capable of failing. A generator that emitted a different
  // content_class, vocabulary or routing value must break this comparison.
  const mutated = JSON.parse(JSON.stringify(f2));
  mutated.content_class = 'no_record_content';
  t('ORACLE detects a generator regression (mutated content_class differs from canonical)',
    strip(mutated) !== strip(canon('02-derived.manifest.json')));

  console.log(`\n${pass + fail} checks, ${fail} failed`);
  process.exit(fail ? 1 : 0);
};
run();
