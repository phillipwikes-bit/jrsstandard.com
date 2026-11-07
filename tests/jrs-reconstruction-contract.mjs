// Narrative and public-boundary regression. It cannot validate comprehension.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const prefix of ['defend','rights']){
 const page=prefix==='defend'?'decisions-you-can-defend.html':'right-to-know-why.html';
 const html=read(page);
 const exercise=html.slice(html.indexOf('<section class="section jrs-reconstruction"'),
  html.indexOf('</section>',html.indexOf('<section class="section jrs-reconstruction"')));
 assert.ok(exercise.length>2000,page+': substantive retained record required');
 // Follow disclosure nesting rather than accepting answer text merely placed
 // later in the source but visible before the reader opens the sources.
 const stack=[];const ancestry=new Map();
 for(const match of exercise.matchAll(/<\/?details\b[^>]*>|<p\b[^>]*class="jrs-reflection"[^>]*>/g)){
  const tag=match[0];
  if(tag.startsWith('</')){assert.ok(stack.pop(),page+': unbalanced disclosure');continue;}
  if(tag.startsWith('<details')){
   const id=tag.match(/\bid="([^"]+)"/)?.[1];
   assert.ok(id,page+': every narrative disclosure has a stable target');
   assert.doesNotMatch(tag,/\bopen(?:\s|>|=)/,page+': interpretation must not default open');
   ancestry.set(id,[...stack]);stack.push(id);
  }else{
   assert.deepEqual(stack,[prefix+'-sources',prefix+'-final-record'],page+': neutral question follows source examination and final record');
  }
 }
 assert.equal(stack.length,0,page+': balanced narrative');
 assert.deepEqual(ancestry.get(prefix+'-interpretation'),[prefix+'-sources',prefix+'-final-record'],page+': interpretation must remain nested after evidence');
 const quotes=[...exercise.matchAll(/data-jrs-approval="(?:initial|returned)">([^<]+)</g)].map(x=>x[1]);
 assert.equal(quotes.length,2,page+': show both initial and returned approval');
 assert.equal(quotes[0],quotes[1],page+': final decision stays unchanged after source examination');
 const beforeInterpretation=exercise.slice(0,exercise.indexOf('id="'+prefix+'-interpretation"'));
 assert.doesNotMatch(beforeInterpretation,/What is absent|What is missing|controlling rationale|which rationale controlled/i,page+': do not supply the interpretation before the neutral prompt');
 assert.equal((exercise.match(/What question does this record leave you with\?/g)||[]).length,1);
 assert.ok(exercise.includes('Audience comprehension of this exercise has not been independently validated.'));
 assert.doesNotMatch(exercise,/<form|<input|<textarea|data-jrs-event/,page+': no answer collection or reveal telemetry');
 assert.ok(html.indexOf('id="constructed-example"')<html.indexOf('The question from the'),page+': exercise before conceptual explanation');
 for(const token of ['/assets/jrs-institutional-reference.css','/assets/jrs-campaign-pages.css','/assets/jrs-mobile-navigation.js'])assert.ok(html.includes(token),page+': preserve responsive public shell');
}
const professional=read('decisions-you-can-defend.html');
for(const token of ['Investigator\'s recommendation','HR cover note','Board minute','The recommendation and the final approval are different decisions.','does not establish which rationale controlled the board\'s approval'])assert.ok(professional.includes(token),'professional exercise missing '+token);
assert.ok(read('right-to-know-why.html').includes("Why wasn't I hired?"));
assert.ok(read('index.html').includes('Try a fictional record reconstruction'));
console.log('PASS: two reader-led reconstructions; unchanged approvals; sources before neutral prompt; deferred interpretation; no answer collection. Comprehension NOT VALIDATED.');
