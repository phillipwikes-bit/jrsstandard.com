// Public-interest free Investigator Guides: offline source and asset assurance.
// Delivery must also be tested against an exact deployed environment.
// No database requests, telemetry, guide download counter or personal data.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('investigator-guides.html',root),'utf8');
const editions={
  employment:'JRS_Investigator_Field_Guide_Employment.pdf',
  fairhousing:'JRS_Investigator_Field_Guide_FairHousing.pdf',
  international:'JRS_Investigator_Field_Guide_International.pdf'
};

test('01 three distinct published PDF editions are linked directly from guide buttons',()=>{
  for(const [edition,file] of Object.entries(editions)){
    assert.match(html,new RegExp(
      'class="dl dl-direct" data-ed="'+edition+'" href="/'+file.replaceAll('.','\\.')+'" download="'+file.replaceAll('.','\\.')+'"'
    ),edition);
  }
  assert.equal((html.match(/class="dl dl-direct"/g)||[]).length,3);
  assert.doesNotMatch(html,/\/api\/dl\?e=/);
});

test('02 each PDF has a separate browser-view fallback without a form or redirect',()=>{
  for(const file of Object.values(editions)){
    assert(html.includes('href="/'+file+'" target="_blank" rel="noopener"'));
  }
  assert.equal((html.match(/View PDF in new tab<\/a>/g)||[]).length,3);
});

test('03 original published PDFs are present, complete and nine pages each',()=>{
  for(const file of Object.values(editions)){
    const bytes=readFileSync(new URL(file,root));
    assert(bytes.length>=15000,file+' is too short');
    const pdf=bytes.toString('latin1');
    assert(pdf.startsWith('%PDF-'),file+' does not begin with PDF signature');
    assert(pdf.trimEnd().endsWith('%%EOF'),file+' is truncated');
    assert.match(pdf,/\/Count\s+9\b/,file+' does not report nine pages');
  }
});

test('04 public guide page contains no unsupported automated integration offer',()=>{
  for(const phrase of [
    'same review runs as one call',
    'The text is transmitted to the model provider',
    'Enterprise inquiry',
    'enterprise.html#enterprise-inquiry',
    'Building software',
    'Your download has started',
    'Nothing was recorded about you'
  ])assert(!html.includes(phrase),phrase);
  assert(html.includes('No automated software integration or public record-processing API is available'));
});

test('05 no signup, payment or enrollment becomes prerequisite',()=>{
  assert(html.includes('No account, payment or registration'));
  assert(html.includes('Neither requires a name, email address, account or payment'));
  assert(html.includes('not requirements for obtaining a guide'));
  assert(html.includes('Ordinary site traffic information may be processed'));
});

test('06 historical download telemetry remains segregated from direct PDF delivery',()=>{
  const api=readFileSync(new URL('api/dl.js',root),'utf8');
  assert.match(api,/const FILES = \{/);
  for(const file of Object.values(editions))assert(api.includes(file));
  // Existing historical links are preserved, but the new page bypasses the
  // event-producing /api/dl route and no longer emits its 'guide-dl' events.
  assert.doesNotMatch(html,/href="\/api\/dl/);
});

test('07 the site-wide canonical navigation is preserved unaltered for this scoped repair',()=>{
  assert(html.includes('<!-- JRS SITE NAV v1 :: CANONICAL BLOCK.'));
  assert(html.includes('<nav class="jrs-sitenav" aria-label="Site">'));
});

test('08 ordinary reading links and accurate research limitations remain',()=>{
  for(const url of ['check.html','training.html','resources.html','review-engine.html'])
    assert(html.includes('href="'+url+'"'),url);
  assert(html.includes('They do not constitute legal advice'));
});
