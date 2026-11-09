// Public review boundary guard after retirement of the public Engine endpoints.
// Tests source and routing absence. They do not claim that a deleted API
// responds with a particular HTTP status in production.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root=process.cwd();
const read=(name)=>readFileSync(join(root,name),'utf8');
let pass=0, fail=0;
function test(name,ok){
  if(ok){pass++;console.log('PASS  '+name);}
  else{fail++;console.error('FAIL  '+name);}
}

for(const path of [
 'api/review.js','api/review-engine.js','api/v1/review-engine.js',
 'review-engine.html'
]){
 test('retired public record-review entrypoint stays absent: '+path,
  !existsSync(join(root,path)));
}
const vercel=JSON.parse(read('vercel.json'));
const routes=[...(vercel.redirects||[]),...(vercel.rewrites||[])];
const retired=['/api/review','/api/review-engine','/api/v1/review-engine','/review-engine.html'];
test('Vercel does not route requests into retired Engine destinations',
 routes.every(rule=>!retired.includes(String(rule.destination||'').split('?')[0])));
for(const page of ['index.html','resources.html','training.html','jrsstandard.html']){
 const html=read(page).replace(/<!--[\s\S]*?-->/g,'');
 test('no public navigation to retired Engine: '+page,
  !/href=["'][^"']*(?:review-engine\.html|\/api\/review(?:-engine)?(?:\?|["']))/i.test(html));
}
const handoff=read('docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md');
test('public record submission remains expressly prohibited',
 handoff.includes('Public review routes must refuse submissions.'));
for(const phrase of [
 'Independent labeled and adjudicated holdout evaluation.',
 'Actual operator-control evidence',
 'Counsel review of real data flows',
 'Recorded owner release authorization.',
 'Independent production QA'
]){
 test('pending release requirement retained: '+phrase, handoff.includes(phrase));
}
console.log('\n'+(pass+fail)+' checks, '+fail+' failed');
process.exitCode=fail?1:0;
