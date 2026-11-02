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
// Verify each named publisher link, not merely that a different external
// anchor on the same page happens to have safe new-tab attributes.
for(const file of sites){
 const html=page(file);
 const links=[
  [cci,/Corporate Compliance Insights/i,'That AI-Drafted Termination Memo Could Become Evidence','Hekim Colpan and Phillip Wikes','September 29, 2026'],
  [scce,/SCCE|Society of Corporate Compliance and Ethics/i,'When the record cannot speak for itself','Phillip Wikes','November 1, 2026']
 ];
 for(const [url,publisher,title,author,date] of links){
  const matches=Array.from(html.matchAll(/<a\\b[^>]*>[\\s\\S]*?<\\/a>/gi))
   .filter(match=>match[0].includes('href="'+url+'"'));
  assert.equal(matches.length,1,file+' must have one anchor to '+url);
  const tag=matches[0][0].slice(0,matches[0][0].indexOf('>')+1);
  assert.match(tag,/\\btarget="_blank"/,file+' publisher link must announce a new tab');
  const rel=tag.match(/\\brel="([^"]+)"/)?.[1]?.split(/\\s+/)||[];
  assert.ok(rel.includes('noopener')&&rel.includes('noreferrer'),
   file+' publisher link must isolate the new tab: '+url);
  const label=tag.match(/\\baria-label="([^"]+)"/)?.[1]||'';
  assert.match(label,/opens in a new tab/i,file+' must disclose new-tab behavior');
  assert.match(label,publisher,file+' must identify the publisher in the accessible name');
  const lead=html.slice(Math.max(0,matches[0].index-700),matches[0].index);
  assert.ok(lead.includes(title)&&lead.includes(author)&&lead.includes(date),
   file+' publisher link must retain the verified article title, authorship and date');
 }
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
