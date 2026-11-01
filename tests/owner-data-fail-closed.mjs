import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const privateReaders=[
  "leads-4b7e2c9af106d385",
  "people-9dd1ecdf6f8cdfd4",
  "roster-8c3f1a9e7b2d6045",
  "geo-4e8b2d7f9a1c3065",
  "recheck-answers-b1a768e88d3e48bd",
  "variance-6b1d90fa2c47e8b3",
  "enroll-admin",
  "support-contacts",
  "coauthor-stats",
  "contributor-stats",
  "checkout-stats"
];
const proxy=readFileSync(new URL('../proxy.js',import.meta.url),'utf8');
const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
const dashboardPaths=['/programme-status-9872fb93cc94.html','/programme--9872fb93cc94.html'];
const dashboard=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
assert.ok(dashboard.includes('Owner dashboard temporarily restricted'));
assert.ok(!dashboard.includes('pilot_contacts') && !dashboard.includes('SUPABASE_SERVICE_ROLE_KEY'));
assert.ok(!dashboard.includes('/api/people-') && !dashboard.includes('/api/leads-'));

for(const p of dashboardPaths){
 assert.ok(proxy.includes("'"+p+"'"),'dashboard missing proxy protection: '+p);
 assert.ok(config.headers.some(entry=>entry.source===p &&
  entry.headers.some(h=>h.key.toLowerCase()==='cache-control' && h.value.includes('no-store'))),
 'dashboard missing private no-store header: '+p);
}
for(const reader of privateReaders){
 assert.ok(proxy.includes("'/api/"+reader+"'"),'missing proxy gate: '+reader);
 const src=readFileSync(new URL('../api/'+reader+'.js',import.meta.url),'utf8');
 assert.ok(src.includes("import { ownerAccess } from './_owner-auth.js';"),'missing read-auth import: '+reader);
 const start=src.slice(src.search(/export default async function handler\s*\(/),src.search(/export default async function handler\s*\(/)+230);
 assert.match(start,/const denied = await ownerAccess\(req\);\s*if \(denied\) return denied;/,'reader must fail closed before storage access: '+reader);
}
const previous=process.env.OWNER_DASHBOARD_TOKEN;
delete process.env.OWNER_DASHBOARD_TOKEN;
const savedFetch=globalThis.fetch;
let called=0;
globalThis.fetch=async()=>{called++;throw new Error('private reader attempted unauthorized network access');};
try{
 for(const reader of privateReaders){
  const mod=await import('../api/'+reader+'.js');
  const result=await mod.default(new Request('https://www.jrsstandard.com/api/'+reader,{method:'GET'}));
  assert.equal(result.status,503,reader+' should fail closed with no production secret');
  assert.match(result.headers.get('cache-control')||'',/no-store/,reader);
 }
 assert.equal(called,0,'no Supabase calls can precede authorization');
}finally{
 globalThis.fetch=savedFetch;
 if(previous===undefined)delete process.env.OWNER_DASHBOARD_TOKEN;
 else process.env.OWNER_DASHBOARD_TOKEN=previous;
}
for(const item of ['index.html','resources.html','research.html','contact.html']){
 const src=readFileSync(new URL('../'+item,import.meta.url),'utf8');
 assert.ok(src.includes('<main'),item+' public experience should remain available');
}
assert.match(readFileSync(new URL('../contact.html',import.meta.url),'utf8'),/formspree\.io\/f\/mreddwdg/);
console.log('PASS: '+privateReaders.length+' owner readers fail closed without key, zero storage calls, both dashboard paths private, public flows preserved.');
