import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const page=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const sites=['index.html','resources.html','research.html'];
const cci="https://www.corporatecomplianceinsights.com/that-ai-drafted-termination-memo-could-become-evidence/";
const scce="https://www.corporatecompliance.org/news-and-insights/cep-magazine/when-record-cannot-speak-itself";
for(const file of sites){
 const text=page(file);
 assert.ok(text.includes(cci),file+' must link original CCI article');
 assert.ok(text.includes(scce),file+' must link original SCCE publication');
 assert.ok(text.includes('professional-publications.css'),file+' must use shared editorial treatment');
 assert.ok(/(?:not independent|distinct from the empirical research|not establish JRS operational effectiveness)/i.test(text),file+' must distinguish commentary from research or independent validation');
 assert.equal(text.split(cci).length-1,1,file+' CCI must appear exactly once');
 assert.equal(text.split(scce).length-1,1,file+' SCCE must appear exactly once');
}
const resources=page('resources.html');
assert.equal((resources.match(/<article class="jrs-resource-entry"/g)||[]).length,16,'ungated practitioner directory must stay at 16');
assert.ok(resources.includes('id="jrs-professional-publications"'),'articles must have discoverable anchor');
assert.ok(page('index.html').includes('id="professional-commentary"'),'homepage references must be discoverable');
assert.ok(page('research.html').includes('id="professional-articles"'),'research references must have distinct label');
for(const file of sites){
 const text=page(file);
 assert.match(text,/<a[^>]+target="_blank"[^>]+rel="noopener noreferrer"/,'external publisher links must have tab isolation');
}
console.log('PASS: both attributed publisher links, safe external navigation, research boundary and 16-item practitioner directory.');

const publicHtmlFiles=readdirSync(new URL('../',import.meta.url)).filter(name=>name.endsWith('.html'));
for(const name of publicHtmlFiles){
 const text=page(name);
 assert.doesNotMatch(text,/<a\b[^>]*href="(?:pilot|org-pilot|enterprise)\.html"/i,
  name+' should not offer obsolete pilot / enterprise navigation');
}
const summary=page('research-summary.html');
assert.ok(summary.includes('Operational Validation'),'research summary must identify validation status');
assert.ok(summary.includes('Review validation status'),'validation call to action must not promise an unavailable pilot signup');
console.log('PASS: public top-level pages contain no obsolete pilot or enterprise destinations.');
