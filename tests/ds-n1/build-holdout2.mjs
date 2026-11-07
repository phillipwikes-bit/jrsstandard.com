#!/usr/bin/env node
// HOLDOUT-2: a new sealed holdout, written 2026-11-03 after rules 0.2.0 were
// frozen. Different scenario world from every case the rules were tuned on
// (different supplier, approver, documents and access type).
//
// SEALED: the DS-N1 engine has NOT been run on these cases. This builder does
// not import the engine; it checks structure only. The harness refuses to run
// them without a recorded owner authorisation, and only once.
//
// LIMIT: written by the same developer who wrote the engine. This guards
// against tuning to results; it is NOT an independent holdout. See
// docs/decision-spellchecker/DS_N1_INDEPENDENT_REVIEW_PROTOCOL.md.
// Run: node tests/ds-n1/build-holdout2.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = new URL('./fixtures/holdout2/', import.meta.url);
mkdirSync(dir, { recursive: true });
const clone = (x) => JSON.parse(JSON.stringify(x));

const BASE = {
  schema: 'ds-n1.record/1.0', record_id: 'VPN-2207', record_version: '1',
  record_class: 'supplier_access_exception', data_classification: 'constructed_fictional',
  title: 'Remote access exception VPN-2207 (fictional)',
  text: 'Kestrel Freight requested remote VPN access to the dispatch system on 2026-07-14. Ines Moreau approved the remote access exception on 2026-07-21. Access is limited to read-only dispatch screens for thirty days.',
  entities: [
    { entity_id: 'K1', name: 'Kestrel Freight', aliases: ['Kestrel'] },
    { entity_id: 'K2', name: 'Ines Moreau' },
    { entity_id: 'K3', name: 'Tomas Ruiz' },
  ],
  sources: [
    { source_id: 'T1', title: 'Service desk ticket SD-8841', version: 'r2', text: 'Ticket SD-8841. On 2026-07-14 Kestrel Freight requested remote VPN access to the dispatch system for route planning.', events: [{ role: 'request', date: '2026-07-14', actor: 'K1' }] },
    { source_id: 'T2', title: 'Risk acceptance memo RA-31', version: 'r1', text: 'Risk acceptance memo RA-31. On 2026-07-21 Ines Moreau approved the remote access exception for Kestrel Freight. Access is limited to read-only dispatch screens for thirty days.', events: [{ role: 'approval', date: '2026-07-21', actor: 'K2' }] },
    { source_id: 'T3', title: 'VPN configuration log CL-5', version: 'r4', text: 'Configuration log CL-5. A VPN profile for Kestrel Freight was created on 2026-07-22 with read-only dispatch permissions.', events: [{ role: 'provisioned', date: '2026-07-22' }] },
  ],
  claims: [
    { claim_id: 'C1', kind: 'chronology', quote: 'Kestrel Freight requested remote VPN access to the dispatch system on 2026-07-14.', event: { role: 'request', date: '2026-07-14' }, citations: [{ source_id: 'T1', quote: 'requested remote VPN access to the dispatch system' }] },
    { claim_id: 'C2', kind: 'authority', quote: 'Ines Moreau approved the remote access exception on 2026-07-21.', actor: 'K2', event: { role: 'approval', date: '2026-07-21' }, citations: [{ source_id: 'T2', quote: 'approved the remote access exception for Kestrel Freight' }] },
    { claim_id: 'C3', kind: 'fact', quote: 'Access is limited to read-only dispatch screens for thirty days.', citations: [{ source_id: 'T2', quote: 'Access is limited to read-only dispatch screens for thirty days.' }] },
  ],
};
const claim = (r, id) => r.claims.find((c) => c.claim_id === id);
const source = (r, id) => r.sources.find((s) => s.source_id === id);
function setClaim(r, id, text) { const c = claim(r, id); r.text = r.text.replace(c.quote, text); c.quote = text; }

const F = {};
const add = (id, fn) => { const r = clone(BASE); r.record_id = `VPN-2207-${id}`; fn(r); F[id] = r; };
add('H01', () => {});
add('H02', (r) => { setClaim(r, 'C2', 'Ines Moreau gave approval for the remote access exception on 2026-07-21.'); });
add('H03', (r) => { setClaim(r, 'C2', 'Ines Moreau approved the remote access exception on 2026-07-22.'); claim(r, 'C2').event.date = '2026-07-22'; });
add('H04', (r) => { claim(r, 'C2').citations = [{ source_id: 'T3', quote: 'approved the remote access exception for Kestrel Freight' }]; });
add('H05', (r) => { const s = source(r, 'T2'); s.text = s.text.replace('Ines Moreau approved', 'Tomas Ruiz approved'); s.events = [{ role: 'approval', date: '2026-07-21', actor: 'K3' }]; });
add('H06', (r) => { source(r, 'T2').text += ' The approval was withdrawn on 2026-07-25 after the supplier missed the security briefing.'; source(r, 'T2').events.push({ role: 'approval_withdrawn', date: '2026-07-25', actor: 'K2' }); });
add('H07', (r) => {
  r.text += ' Because the request and the time-limited read-only approval are documented, the exception can proceed.';
  r.claims.push({ claim_id: 'C4', kind: 'conclusion', quote: 'Because the request and the time-limited read-only approval are documented, the exception can proceed.', reasoning: 'C1 documents the request; C2 and C3 document the approval and its limits.', citations: [] });
});
add('H08', (r) => { source(r, 'T3').text = 'Configuration log CL-5. A VPN profile for Kestrel Freight was created on 2026-07-22 with full read and write dispatch permissions.'; claim(r, 'C3').citations.push({ source_id: 'T3', quote: 'A VPN profile for Kestrel Freight was created on 2026-07-22' }); });
add('H09', (r) => { r.text += ' The firewall rules were verified by the network team.'; });
add('H10', (r) => { const s = source(r, 'T2'); s.text = s.text.replace('approved the remote access exception for Kestrel Freight.', 'approved the remote access exception for Kestrel Freight, pending a penetration test.'); });

// Structural check only (no engine import): every claim quote is in the record
// text and every citation names a source in the package.
for (const [id, r] of Object.entries(F)) {
  for (const c of r.claims) {
    if (!r.text.includes(c.quote)) throw new Error(`${id}: claim ${c.claim_id} quote not in record text`);
    for (const ct of c.citations) if (!r.sources.some((s) => s.source_id === ct.source_id)) throw new Error(`${id}: unknown source ${ct.source_id}`);
  }
}
const manifest = { fixture_set: 'ds-n1.holdout2/0.1.0', created: '2026-11-03', sealed: true, engine_run_on_these_cases: false, classification: 'Developer-authored sealed holdout; NOT independent', fixtures: [] };
for (const [id, r] of Object.entries(F)) {
  const body = JSON.stringify(r, null, 2) + '\n';
  writeFileSync(new URL(`${id}.json`, dir), body);
  manifest.fixtures.push({ id, sha256: createHash('sha256').update(body).digest('hex') });
}
const mbody = JSON.stringify(manifest, null, 2) + '\n';
writeFileSync(new URL('MANIFEST.json', dir), mbody);
console.log(`${manifest.fixtures.length} sealed holdout-2 cases; manifest sha256 ${createHash('sha256').update(mbody).digest('hex')}`);
