// Public-only source checks. External editorial publication must not be
// presented as empirical validation or an operational JRS software capability.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const articles=[
  {
    url:'https://www.corporatecomplianceinsights.com/that-ai-drafted-termination-memo-could-become-evidence/',
    title:'That AI-Drafted Termination Memo Could Become Evidence',
    publisher:'Corporate Compliance Insights',
    author:'Hekim Colpan and Phillip Wikes',
    date:'September 29, 2026'
  },
  {
    url:'https://www.corporatecompliance.org/news-and-insights/cep-magazine/when-record-cannot-speak-itself',
    title:'When the record cannot speak for itself',
    publisher:'SCCE',
    author:'Phillip Wikes',
    date:'November 1, 2026'
  }
];
for(const path of ['index.html','research.html','resources.html']){
  const html=read(path);
  for(const article of articles){
    assert.equal(html.split('href="'+article.url+'"').length-1,1,
      path+': article should have exactly one publisher-hosted link');
    assert.ok(html.includes(article.title),path+': missing exact article title');
    assert.ok(html.includes(article.publisher),path+': missing publisher attribution');
    assert.ok(html.includes(article.author),path+': missing author attribution');
    assert.ok(html.includes(article.date),path+': missing date');
  }
  assert.match(html,/(?:not independent validation|not components of the empirical validation dataset|does not independently verify)/i,
    path+': external commentary must be separated from validation evidence');
}
const home=read('index.html');
assert.match(home,/From a conclusion to a reviewable record\./);
assert.match(home,/A fictional illustration of a pre-finalization documentation check/);
assert.match(home,/No personal records are submitted or analyzed/);
assert.match(home,/href="check\.html\?src=home"/);
const resources=read('resources.html');
assert.match(resources,/Browse 16 public resources/);
assert.match(resources,/<section class="jrs-publication-resources" aria-labelledby="jrs-published-articles-title">/);
assert.match(resources,/<h2 class="section-label" id="jrs-published-articles-title">External professional publications<\/h2>/);
assert.equal((resources.match(/class="jrs-resource-entry"/g)||[]).length,16,
  'Existing 16-resource directory must not be inflated by two external articles');
const summary=read('research-summary.html');
assert.ok(!summary.includes('href="org-pilot.html"'));
assert.match(summary,/does not offer a public pilot-submission portal/);
const linked=[
  'about.html','ai-governance-record.html','ai-records-arm-b.html','codebook.html',
  'compliance.html','datasets.html','decision-reconstruction-risk.html',
  'evidence-ledger.html','finding.html','implementation-scenarios.html',
  'investigator-guides.html','jrsstandard.html','manifest.html',
  'operational-boundaries.html','questions.html','results.html',
  'security.html','simulations.html','training.html','research-summary.html'
];
for(const path of linked){
  const html=read(path);
  assert.doesNotMatch(html,/href="(?:pilot|enterprise|org-pilot)\.html"/i,
    path+': retained action to a retired public route');
}
assert.match(read('assets/jrs-institutional-reference.css'),
  /@media\(max-width:760px\)\{\s*body\.jrs-institutional\.jrs-home \.jr-example-grid/);
console.log('PASS: 2 external articles x 3 public pages, attribution, editorial/validation boundary,');
console.log('PASS: fictional walkthrough, directory count, 20 route corrections and mobile layout rules.');
