// Boundary test for browser record-check view analytics.
// These are synthetic requests with a mocked database write; no external calls,
// real visitor records, credential values, or production writes occur.
import assert from 'node:assert/strict';
import handler from '../api/telemetry.js';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const client = read('check.html');
const allowlist = client.match(/src\s*=\s*\/\^\(([^)]+)\)\$\/\.test\(sourceCandidate\)/);
assert.ok(allowlist, 'Check-page client must keep a fixed attribution allowlist');
const accepted = new RegExp('^(?:' + allowlist[1] + ')$');
const rows = [];
const previousFetch = globalThis.fetch;
const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
globalThis.fetch = async (url, options) => {
  assert.equal(new URL(url).pathname, '/rest/v1/interaction_events');
  assert.equal(options.method, 'POST');
  rows.push(JSON.parse(options.body));
  return new Response('', { status: 201 });
};
process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-test-fixture';
async function submit(event = 'check-view', src = 'home', origin = '/check.html',
                      target = '/resources.html?private=never-store',
                      label = 'untrusted case identifier') {
  const request = new Request('https://www.jrsstandard.com/api/telemetry', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 JRS Browser Fixture' },
    body: JSON.stringify({
      timestamp: '2026-11-03T00:00:00.000Z',
      origin_url: origin, target_url: target,
      meta: { event, src, label, record_text: 'NOT_A_STORED_RECORD' }
    })
  });
  const response = await handler(request);
  assert.equal(response.status, 200);
  return response.json();
}
try {
  for (const category of allowlist[1].split('|')) {
    const result = await submit('check-view', category);
    assert.equal(result.recorded, true, 'valid check source should be accepted: ' + category);
    const row = rows.at(-1);
    assert.equal(row.source, 'page-view');
    assert.equal(row.type, 'view');
    assert.equal(row.payload.src, category);
    assert.equal(row.payload.origin, '/check.html');
    assert.equal(row.payload.target, 'check-view');
    assert.equal(row.payload.label, '');
    assert.equal(JSON.stringify(row).includes('NOT_A_STORED_RECORD'), false);
  }
  for (const source of ['private@example.org', 'case-123', 'manual source', 'source?person=a', '']) {
    assert.equal(accepted.test(source), false);
    const result = await submit('check-view', source);
    assert.equal(result.recorded, true);
    assert.equal(rows.at(-1).payload.src, 'other', 'unknown view sources must be grouped, not stored');
  }
  let count = rows.length;
  let result = await submit('check-view', 'home', '/confidential/record');
  assert.equal(result.recorded, false);
  assert.equal(result.reason, 'invalid_view_origin');
  assert.equal(rows.length, count, 'unrecognized origin must not generate a database write');
  result = await submit('check-view', 'verify');
  assert.equal(result.recorded, false);
  assert.equal(rows.length, count, 'verification request must not pollute view counts');
  result = await submit('link-click', 'legacy-link-source', '/check.html',
                        '/resources.html?secret=not-stored', 'reviewer reference');
  assert.equal(result.recorded, true);
  const click = rows.at(-1);
  assert.equal(click.source, 'link-click');
  assert.equal(click.payload.src, 'legacy-link-source', 'existing link-click categories must be preserved');
  assert.equal(click.payload.target, '/resources.html', 'click URL queries must remain excluded');
  assert.equal(click.payload.label, 'reviewer reference', 'existing click label semantics must remain');
  assert.equal(JSON.stringify(click).includes('not-stored'), false);
  console.log('PASS: browser view telemetry retains fixed categories, discards arbitrary metadata, refuses other paths and preserves established link-click behavior.');
} finally {
  globalThis.fetch = previousFetch;
  if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
}
