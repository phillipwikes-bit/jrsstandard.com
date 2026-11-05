#!/usr/bin/env node
// Increment H: ISOLATION (coverage) fixtures. One case per rule that the
// ablation tool classed NEVER_FIRED or REDUNDANT, built so that rule is the
// only finding standing between the record and READY.
//
// These are SPECIFICATION tests of DS-N1's own rule design, not reference
// labels of what a reviewer should conclude, and not evidence of accuracy.
// Developer-authored 2026-11-03; rules frozen at ds-n1.rules/0.2.0.
//
// Construction note: a citation that fails an actor or date check stops
// supporting its claim, which on its own would also raise UNSUPPORTED_CLAIM.
// Where that happens, the claim keeps its original good citation and gains a
// second, flawed one, so only the flawed citation's rule fires.
// Run: node tests/ds-n1/build-isolation.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const here = new URL('./', import.meta.url);
const dir = new URL('./fixtures/isolation/', import.meta.url);
mkdirSync(dir, { recursive: true });
const BASE = JSON.parse(readFileSync(new URL('fixtures/P01.json', here), 'utf8'));
const clone = (x) => JSON.parse(JSON.stringify(x));
const claim = (r, id) => r.claims.find((c) => c.claim_id === id);
const source = (r, id) => r.sources.find((s) => s.source_id === id);
function setClaim(r, id, text) { const c = claim(r, id); r.text = r.text.replace(c.quote, text); c.quote = text; }

const F = {};
const add = (id, rule, construction, fn) => { const r = clone(BASE); r.record_id = `SAX-0417-${id}`; fn(r); F[id] = { rule, construction, record: r }; };

add('I01', 'ACTOR_NOT_ESTABLISHED', 'second citation to a source sentence that names no actor', (r) => {
  r.sources.push({ source_id: 'S4', title: 'Portal status page PS-2', version: 'v1', text: 'Portal status page PS-2. The vendor security assessment was completed on 2026-09-15.', events: [{ role: 'assessment_completed', date: '2026-09-15' }] });
  claim(r, 'C2').citations.push({ source_id: 'S4', quote: 'The vendor security assessment was completed on 2026-09-15.' });
});
add('I02', 'CLAIM_LOCATION_AMBIGUOUS', 'the C4 sentence appears twice in the record', (r) => {
  r.text += ' Access is limited to the reporting warehouse for ninety days.';
});
add('I03', 'DATE_MISMATCH', 'request claimed on 2026-09-03; the source event records 2026-09-02', (r) => {
  setClaim(r, 'C1', 'Northwind Analytics requested read access to the reporting warehouse on 2026-09-03.');
  claim(r, 'C1').event.date = '2026-09-03';
});
add('I04', 'DATE_NOT_ESTABLISHED', 'second citation to an undated source sentence with no structured events', (r) => {
  r.sources.push({ source_id: 'S4', title: 'Supplier attestation SA-4', version: 'v1', text: 'Supplier attestation SA-4. Northwind Analytics completed the vendor security assessment.' });
  claim(r, 'C2').citations.push({ source_id: 'S4', quote: 'completed the vendor security assessment' });
});
add('I05', 'DATE_ROLE_UNVERIFIED', 'second citation to a dated sentence in a source with no structured events', (r) => {
  r.sources.push({ source_id: 'S4', title: 'Supplier attestation SA-4', version: 'v1', text: 'Supplier attestation SA-4. Northwind Analytics completed the vendor security assessment on 2026-09-15.' });
  claim(r, 'C2').citations.push({ source_id: 'S4', quote: 'completed the vendor security assessment' });
});
add('I06', 'EVENT_ROLE_CONFUSION', 'assessment completion claimed on 2026-09-16, the submission-for-approval date', (r) => {
  setClaim(r, 'C2', 'Northwind Analytics completed the vendor security assessment on 2026-09-16.');
  claim(r, 'C2').event.date = '2026-09-16';
});
add('I07', 'NEGATION_CONFLICT', 'source sentence negates completion; only the quote and its clause change', (r) => {
  source(r, 'S2').text = 'Assessment VSA-88. Northwind Analytics did not complete the vendor security assessment on 2026-09-15. The assessment was submitted for approval on 2026-09-16.';
  claim(r, 'C2').citations = [{ source_id: 'S2', quote: 'complete the vendor security assessment' }];
});
add('I08', 'QUOTE_NOT_FOUND', 'second citation whose quote is in no source', (r) => {
  claim(r, 'C4').citations.push({ source_id: 'S3', quote: 'limited to the reporting warehouse for sixty days' });
});
add('I09', 'REASONING_NOT_TRACED', 'conclusion supported by a citation but with no stated reasoning', (r) => {
  r.sources.push({ source_id: 'S5', title: 'Exception review note ER-3', version: 'v1', text: 'Exception review note ER-3. Because the assessment was completed and the exception was approved with a time limit, the exception can proceed to finalisation.' });
  const c = claim(r, 'C5');
  delete c.reasoning;
  c.citations = [{ source_id: 'S5', quote: 'the exception can proceed to finalisation' }];
});
add('I10', 'RELEVANCE_NOT_ESTABLISHED', 'second citation to a passage about a different matter', (r) => {
  claim(r, 'C4').citations.push({ source_id: 'S2', quote: 'submitted for approval on 2026-09-16' });
});
add('I11', 'SOURCE_MISSING', 'second citation to a source that is not in the package', (r) => {
  claim(r, 'C4').citations.push({ source_id: 'S9', quote: 'Access is limited to the reporting warehouse for ninety days.' });
});
add('I12', 'UNTRACEABLE_AUTHORITY', 'approval claim with no citation at all', (r) => {
  claim(r, 'C3').citations = [];
});

const manifest = { fixture_set: 'ds-n1.isolation/0.1.0', created: '2026-11-03', classification: 'SPECIFICATION tests of DS-N1 rule design; developer-authored; not reference labels', fixtures: [] };
for (const [id, { rule, construction, record }] of Object.entries(F)) {
  const body = JSON.stringify(record, null, 2) + '\n';
  writeFileSync(new URL(`${id}.json`, dir), body);
  manifest.fixtures.push({ id, rule, construction, sha256: createHash('sha256').update(body).digest('hex') });
}
const mbody = JSON.stringify(manifest, null, 2) + '\n';
writeFileSync(new URL('MANIFEST.json', dir), mbody);
console.log(`${manifest.fixtures.length} isolation fixtures; manifest sha256 ${createHash('sha256').update(mbody).digest('hex')}`);
