import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const protectedRoutes=[
 'api/leads-4b7e2c9af106d385.js',
 'api/people-9dd1ecdf6f8cdfd4.js',
 'api/roster-8c3f1a9e7b2d6045.js',
 'api/geo-4e8b2d7f9a1c3065.js',
 'api/recheck-answers-b1a768e88d3e48bd.js',
 'api/variance-6b1d90fa2c47e8b3.js',
 'api/owner-progress.js',
 'api/site-inquiry-stats.js',
 'api/enroll-admin.js',
 'api/support-contacts.js',
 'api/coauthor-stats.js',
 'api/contributor-stats.js',
 'api/checkout-stats.js'
];
const originalToken=process.env.OWNER_DASHBOARD_TOKEN;
const originalFetch=globalThis.fetch;
delete process.env.OWNER_DASHBOARD_TOKEN;
let fetchCount=0,passed=0;
globalThis.fetch=async()=>{fetchCount++;throw Error('No unauthorized database calls expected');};
try {
 for(const path of protectedRoutes){
   const src=readFileSync(new URL('../'+path,import.meta.url),'utf8');
   assert.ok(src.includes('ownerAccess(req)'),path+' must require signed owner access');
   assert.ok(!/Access-Control-Allow-Origin['"]\s*:\s*['"]\*/.test(src),
     path+' must not offer wildcard CORS to owner data');
   const module=await import('../'+path);
   assert.equal(typeof module.default,'function',path);
   const url='https://www.jrsstandard.com/'+path.slice(0,-3)+'?token=legacy-query-token';
   const result=await module.default(new Request(url));
   assert.equal(result.status,503,path+' must fail closed with owner secret absent');
   passed++;
 }
 assert.equal(fetchCount,0,'Private endpoints must not reach database before owner auth');

 const sql=readFileSync(new URL(
   '../docs/security/JRS_DECISION_SPELLCHECKER_READONLY_RLS_INVENTORY_2026-10-30.sql',import.meta.url
 ),'utf8');
 const statements=sql.split('\n').filter(line=>!line.trim().startsWith('--')).join('\n');
 assert.match(statements,/BEGIN READ ONLY;/);
 assert.match(statements,/ROLLBACK;/);
 assert.match(statements,/pg_policies/);
 assert.match(statements,/pg_class/);
 assert.match(statements,/has_table_privilege/);
 assert.match(statements,/has_function_privilege/);
 assert.match(statements,/pilot_contacts/);
 assert.match(statements,/ai_pilot_reads/);
 assert.match(statements,/engine_reviews/);
 assert.doesNotMatch(statements,/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE|GRANT|REVOKE)\s+(?:TABLE|POLICY|ON|INTO|FROM|ROLE|FUNCTION|VIEW|SCHEMA)\b/i);
 passed++;
 console.log('PASS '+passed+' owner route access and read-only SQL controls');
}finally{
 globalThis.fetch=originalFetch;
 if(originalToken===undefined)delete process.env.OWNER_DASHBOARD_TOKEN;
 else process.env.OWNER_DASHBOARD_TOKEN=originalToken;
}
