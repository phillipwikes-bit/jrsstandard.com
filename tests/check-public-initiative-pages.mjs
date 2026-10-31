import assert from 'node:assert/strict';
import fs from 'node:fs';
let n=0;
function check(name,fn){fn();n++;console.log('PASS '+name);}
const read=p=>fs.readFileSync(p,'utf8');
const config=JSON.parse(read('vercel.json'));
const routes=['drr.html','right-to-know-why.html','decisions-you-can-defend.html'];
for (const path of routes) {
  check('free page and links '+path,()=>{
    const src=read(path);
    assert(src.includes('href="resources.html"'));
    assert(src.includes('href="research.html"'));
    assert(!/checkout|buy now|purchase license|paywall/i.test(src));
    assert(!src.includes('href="/api/support?'));
  });
}
check('homepage reaches both free initiatives',()=>{
 const home=read('index.html');
 assert(home.includes('id="public-initiatives"'));
 for(const p of routes)assert(home.includes('href="'+p+'"'));
});
check('support actions are explicitly submitted, not automatic navigation',()=>{
 for(const [path,campaign] of [['right-to-know-why.html','rtkw'],['decisions-you-can-defend.html','defend']]){
  const src=read(path);
  assert(src.includes('data-support-campaign="'+campaign+'"'));
  assert(src.includes('public-initiative-support.js'));
  assert(src.includes('type="submit"'));
  assert(src.includes('role="status"'));
  assert(!src.includes('href="/api/support?'));
 }
 const js=read('public-initiative-support.js');
 assert(js.includes("form.addEventListener('submit'"));
 assert(js.includes("method:'POST'"));
 assert(js.includes("result.recorded === true"));
 assert(js.includes("result.already_recorded === true"));
});
check('legacy support redirections retained without mutation',()=>{
 const redirects=config.redirects;
 for(const [path,target] of [['/right-to-know-why','/api/support?c=rtkw'],['/decisions-you-can-defend','/api/support?c=defend']])
  assert(redirects.some(r=>r.source===path&&r.destination===target));
});
console.log('PASS: '+n+' public-initiative static checks. No production or live database claims.');
