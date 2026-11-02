// JRS download routes must not modify historical data on a verification GET.
// All calls are synthetic; no network credentials, service requests or records.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../api/dl.js';

const source = readFileSync(new URL('../api/dl.js', import.meta.url), 'utf8');
assert.doesNotMatch(source, /method\s*:\s*['"]DELETE['"]/i,
  'Download handler must never perform a database DELETE');

const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const oldFetch = globalThis.fetch;
let calls = [];
process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-key-not-an-actual-secret';
globalThis.fetch = async function(url, options={}) {
  calls.push({url:String(url), method:String(options.method || 'GET').toUpperCase()});
  return new Response(null, {status:201});
};
const host='https://www.jrsstandard.com';
const cases=[
  ['?e=standard&src=verify','JRS-Standard.pdf'],
  ['?e=card&src=verify','JRS_Rapid_Review_Card.pdf'],
  ['?e=employment&src=verify','JRS_Investigator_Field_Guide_Employment.pdf'],
  ['?e=fairhousing&src=verify','JRS_Investigator_Field_Guide_FairHousing.pdf'],
  ['?e=international&src=verify','JRS_Investigator_Field_Guide_International.pdf'],
  ['?f=JRS-Reference-9d4f2a7c.pdf&src=verify','JRS-Reference-9d4f2a7c.pdf']
];
async function exercise(query, headers) {
  calls=[];
  return handler(new Request(host+'/api/dl'+query, {headers:headers||{}}));
}
try {
  for(const [query,filename] of cases) {
    const r=await exercise(query);
    assert.equal(r.status,302, query+' must redirect');
    assert.equal(r.headers.get('location'),host+'/'+filename);
    assert.deepEqual(calls,[], query+' must not touch database in verification mode');
  }
  for(const [query,filename] of cases) {
    const r=await exercise(query.replace('src=verify','src=resources'),{'sec-purpose':'prefetch'});
    assert.equal(r.status,302, query+' prefetch must still deliver the file');
    assert.equal(r.headers.get('location'),host+'/'+filename);
    assert.deepEqual(calls,[], query+' prefetch must not write or delete data');
  }
  const card=await exercise('?e=card&src=resources');
  assert.equal(card.status,302);
  assert.equal(calls.length,1,'ordinary card download gets exactly one event write');
  assert.ok(calls.every(c=>c.method==='POST'),'ordinary downloads may only POST events');
  const guide=await exercise('?e=employment&src=resources');
  assert.equal(guide.status,302);
  assert.equal(calls.length,2,'ordinary guide download gets two known event writes');
  assert.ok(calls.every(c=>c.method==='POST'),'ordinary guides may only POST events');
  const reference=await exercise('?f=JRS-Reference-9d4f2a7c.pdf&src=resources');
  assert.equal(reference.status,302);
  assert.equal(calls.length,1,'ordinary reference download gets one event write');
  assert.ok(calls.every(c=>c.method==='POST'),'ordinary references may only POST events');
  const unknown=await exercise('?e=notreal&src=resources');
  assert.equal(unknown.status,302);
  assert.equal(unknown.headers.get('location'),host+'/investigator-guides.html');
  assert.deepEqual(calls,[],'unknown item must not touch database');
  console.log('PASS: six verification routes, six prefetch routes, three legitimate events and unknown fallback; no destructive GET side effects.');
} finally {
  globalThis.fetch=oldFetch;
  if(oldKey===undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;
}
