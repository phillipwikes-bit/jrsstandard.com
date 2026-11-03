// JRS institutional reference release gate.
// Source-only assertions. Not a substitute for rendered accessibility testing.
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,path),'utf8');
const theme='assets/jrs-institutional-reference.css';
assert.ok(existsSync(join(root,theme)),'institutional stylesheet must exist');
const css=read(theme);
for(const token of [
 'body.jrs-institutional','--jrs-ink:','--jrs-navy:',
 '.jr-hero-grid','.jr-paths','.jr-five','.jr-publications',
 'focus-visible','@media(max-width:650px)','prefers-reduced-motion','@media print'
])assert.ok(css.includes(token),'missing institutional reference system token: '+token);
let braces=0;
for(const c of css){if(c==='{')braces++;if(c==='}')braces--;assert.ok(braces>=0,'unbalanced CSS closing brace');}
assert.equal(braces,0,'unbalanced CSS blocks');

// Guard international expert provenance and remove extraneous product-status copy.
for(const page of ['index.html','about.html','research.html','research-summary.html','investigator-guides.html']){
 assert.match(read(page),/16 independent international experts from 11 countries across five continents/,
  page+' must identify the independent international detection panel');
}
for(const page of ['index.html','about.html','resources.html','research.html','research-summary.html','research-register.html','codebook.html','manifest.html']){
 assert.doesNotMatch(read(page),/JRS Review Engine|controlled Engine|The Engine remains/i,
  page+' must keep the public method narrative independent of software status');
}

/* The selected motto must remain in the visible responsive header.
   A previous <=1020px stylesheet hid it despite correct page source. */
const homeHeader=read('index.html');
assert.match(homeHeader,/<span class="jrs-header-motto">Check the record\.\s*<strong>No new software required\.<\/strong><\/span>/,
  'approved institutional motto must be retained in the homepage header');
assert.ok(css.includes('flex-wrap:wrap!important')&&
  css.includes('.site-header-inner > .jrs-header-motto{')&&
  css.includes('display:block!important'),
  'responsive header must provide visible layout for the selected motto');
assert.doesNotMatch(css,/\.jrs-header-motto\s*\{\s*display:\s*none\s*!important/,
  'responsive stylesheet must not hide the selected header on phones or tablets');

const pages=[
 'index.html','resources.html','research.html','investigator-guides.html',
 'manifest.html','about.html','contact.html','jrsstandard.html','training.html',
 'check.html','simulations.html','decision-reconstruction-risk.html',
 'research-summary.html','methodology.html','evidence-ledger.html','questions.html',
 'research-register.html','privacy.html','terms.html','codebook.html'
];
for(const p of pages){
 const h=read(p);
 assert.ok(h.includes('<body class="jrs-institutional'),p+' missing opt-in publication theme');
 assert.ok(h.includes('<link rel="stylesheet" href="/assets/jrs-institutional-reference.css">'),
   p+' missing theme link');
 assert.ok(h.includes('viewport'),p+' missing mobile viewport');
 assert.doesNotMatch(h,/id="pa-input"|fetch\(['"]\/api\/review['"]/i,
   p+' must not expose retired public assessor');
}

// Complete the system across the public sitemap and reference corpus.
const additionalPages=[
 'implementation-scenarios.html',
 'operational-boundaries.html',
 'reference/index.html',
 'reference/ai-assisted-record-failure-modes/index.html',
 'reference/ai-verification-controls/index.html',
 'reference/decision-context-loss/index.html',
 'reference/deployment-models/index.html',
 'reference/documentation-risk-tiers/index.html',
 'reference/escalation-triggers/index.html',
 'reference/field-conditions/index.html',
 'reference/implementation-maturity-levels/index.html',
 'reference/later-review-failure-cascades/index.html',
 'reference/missing-chronology/index.html',
 'reference/record-survivability/index.html',
 'reference/reviewer-responsibility-boundaries/index.html',
 'reference/reviewer-worksheet/index.html',
 'reference/second-line-review-model/index.html',
 'reference/traveler-test/index.html',
 'reference/unsupported-generalization/index.html',
 'reviewer/index.html',
 'ai-governance-record.html',
 'compliance.html',
 'datasets.html',
 'finding.html',
 'results.html',
 'why-good-decisions-fail.html',
 'privacy-notice.html',
];
for(const p of additionalPages){
 const h=read(p);
 assert.ok(h.includes('<body class="jrs-institutional'),p+' missing institutional body opt-in');
 assert.ok(h.includes('<link rel="stylesheet" href="/assets/jrs-institutional-reference.css">'),p+' missing shared theme');
 assert.ok(h.includes('viewport'),p+' missing responsive viewport');
}

// A stray build/tool warning before DOCTYPE forces the Standard into quirks mode.
for(const page of [...pages,...additionalPages]){
 const source=read(page).trimStart();
 assert.ok(/^<!doctype html>/i.test(source),
   page+' must begin with a real HTML doctype, without generated tool output or diagnostic banners');
 assert.ok(!source.includes('Warning: truncated output'),
   page+' must not contain connector output truncation markers');
}

// Standard source restoration and semantic worked-example coverage.
// The online document previously contained a literal middle-truncation
// placeholder that removed 28,935 characters and one complete tab group.
{
  // Check the actual HTML publication surface, not only the 47 core pages.
  // Include root-level and preserved reference/reviewer routes. Exclude test
  // fixtures and nonpublished working documents from this source guard.
  const publicHtml=[];
  function collectHtml(dir){
    for(const entry of readdirSync(join(root,dir),{withFileTypes:true})){
      const path=dir?dir+'/'+entry.name:entry.name;
      if(entry.isFile()&&entry.name.endsWith('.html'))publicHtml.push(path);
      if(entry.isDirectory()&&
        ((dir===''&&['reference','reviewer'].includes(entry.name))||
          dir==='reference'||dir==='reviewer'))collectHtml(path);
    }
  }
  collectHtml('');
  assert.ok(publicHtml.length>=58,
    'source truncation audit must cover all documented public and retained HTML routes');
  for(const page of publicHtml){
    assert.doesNotMatch(read(page), /\u2026\d+ tokens truncated\u2026|Warning: truncated output/i,
      page+' contains an accidentally committed source truncation');
  }
  const standard=read('jrsstandard.html');
  const groups=(standard.match(/class="scenario-tabs"/g)||[]).length;
  const paneIds=[...standard.matchAll(/id="([^"]+)" class="scenario-pane(?: active)?"/g)]
    .map(match=>match[1]);
  const tabDestinations=[...standard.matchAll(/onclick="showScenarioPane\(this,'([^']+)'\)"/g)]
    .map(match=>match[1]);
  assert.equal(groups,5,'five worked-example tab groups must remain available');
  assert.equal(paneIds.length,15,'all 15 worked-example panes must exist');
  assert.equal(tabDestinations.length,15,'each worked-example pane needs a navigation button');
  assert.equal(new Set(paneIds).size,15,'worked-example pane IDs must be unique');
  assert.deepEqual(new Set(tabDestinations),new Set(paneIds),
    'every panel must have exactly one corresponding navigation tab');
  const enhancement=read('assets/jrs-keyboard-controls.js');
  for(const token of [
    "function enhanceScenarioTabs()", "setAttribute('role','tablist')",
    "setAttribute('role','tab')", "setAttribute('role','tabpanel')",
    "setAttribute('aria-selected'", "setAttribute('aria-controls'",
    "setAttribute('aria-labelledby'", "'ArrowLeft','ArrowRight','Home','End'",
    "pairs[next].button.click()"
  ])assert.ok(enhancement.includes(token),'worked-example tabs missing '+token);
  console.log('PASS: restored Standard examples retain 5 tab groups, 15 panels and accessible keyboard interaction.');
}

const main=read('index.html');
for(const token of [
 '01 · Start here','02 · Use the method','03 · Examine the evidence','04 · Learn and practice',
 'Can the record explain the decision after its author is gone?',
 'Evidence must remain distinguishable from assurance.',
 'href="jrsstandard.html"','href="resources.html"','href="training.html"','href="research.html"',
 'href="investigator-guides.html"','href="manifest.html"'
])assert.ok(main.includes(token),'homepage missing core reference route/copy '+token);
for(const p of ['resources.html','investigator-guides.html','training.html']){
 const h=read(p);
 assert.ok(h.includes('investigator-guides.html'),p+' must link guide library');
}
assert.ok(read('training.html').includes('id="practice-guidance"'),
 'training must retain manual, non-submission practice guidance');
// Mobile Standard navigation must be collapsible, not a permanent 14-item list.
assert.ok(css.includes('JRS mobile navigation corrections, 2026-11-01') &&
 css.includes('.primary-nav-inner.nav-open') &&
 css.includes('jrs-nav-ready'),
 'mobile publication style must retain compact site nav and collapsible Standard sections');
const standard=read('jrsstandard.html');
assert.ok(standard.includes('toggleMobileNav()') &&
 standard.includes('id="primary-nav-items"') &&
 standard.includes('aria-expanded="false"'),
 'Standard mobile menu control and expanded state must remain wired');
assert.ok(standard.includes('showSection('),'Standard section interactions must remain intact');

const standardMainOpen='<main id="main-content" tabindex="-1" aria-label="JRS online methodology">';
assert.ok(standard.includes(standardMainOpen),'Standard must contain a stable main landmark');
assert.equal((standard.match(/<main\b/g)||[]).length,1,'Standard must have exactly one main landmark');
assert.equal((standard.match(/<\/main>/g)||[]).length,1,'Standard main landmark must close');
assert.ok(standard.indexOf(standardMainOpen)<standard.indexOf('id="section-home"'),
  'Main landmark must wrap all document sections, not only the overview');
assert.ok(standard.indexOf('</main>')>standard.indexOf('id="section-kit"') &&
  standard.indexOf('</main>')<standard.indexOf('<footer class="site-footer"'),
  'Main landmark must enclose last document section and exclude footer');
assert.ok(!standard.includes('role="main"'),'No second or hidden main landmark is allowed');

// Access landing page must have a valid document/landmark boundary. Earlier
// markup closed main inside the footer and browsers repaired the DOM implicitly.
const accessMarkup=read('access.html');
assert.equal((accessMarkup.match(/<main\b/g)||[]).length,1,'Access route must have one main landmark');
assert.equal((accessMarkup.match(/<\/main>/g)||[]).length,1,'Access route must close the main landmark');
assert.ok(accessMarkup.indexOf('</main>')<accessMarkup.indexOf('<footer>'),
  'Access route footer must be a sibling of main, never nested inside main');
assert.ok(accessMarkup.indexOf('<footer>')<accessMarkup.indexOf('</footer>'),
  'Access route footer must close after it opens');


assert.ok(standard.includes('<details>')&&standard.includes('jrs-publication-note-detail')&&
 standard.includes('Publication versions:')&&standard.includes('Archived implementation-kit inventory:'),
 'Version and retired-kit disclosures must remain available in accessible details');
assert.ok(!standard.includes('Available on the Operational References page.'),
 'Standard may not advertise unavailable retired implementation-kit assets');
for(const p of ['index.html','resources.html','research.html','investigator-guides.html',
 'jrsstandard.html','training.html']){
 assert.ok(read(p).includes('<!-- JRS SITE NAV v1 :: CANONICAL BLOCK.'),
   p+' missing canonical reference navigation');
}
for(const path of [
 'api/_owner-auth.js','programme-status-9872fb93cc94.html',
 'JRS_Investigator_Field_Guide_Employment.pdf',
 'JRS_Investigator_Field_Guide_FairHousing.pdf',
 'JRS_Investigator_Field_Guide_International.pdf'
])assert.ok(existsSync(join(root,path)),'preserve protected access or document '+path);
console.log('PASS: institutional reference system present on '+(pages.length+additionalPages.length)+
 ' pages, core paths and privacy boundaries preserved.');


// First-use guide hierarchy: clear edition warning, technical detail only on request.
const guideMarkup=read('investigator-guides.html');
assert.ok(guideMarkup.includes('class="boundary jrs-guide-version-boundary"') &&
 guideMarkup.includes('class="jrs-guide-version-summary"') &&
 guideMarkup.includes('<details class="jrs-guide-version-details">') &&
 guideMarkup.includes('<summary>Review condition terminology and edition limitations</summary>'),
 'guide edition detail must be progressively disclosed with a visible caution');
assert.ok(guideMarkup.includes('Record Self-Sufficiency, Evidentiary Anchoring') &&
 guideMarkup.includes('Reconstructability, Basis Identification, Chronology') &&
 guideMarkup.includes('Terminology and assessment logic are not certified as identical'),
 'complete published edition distinctions must be preserved');

// Structural remediation, 2026-11-01: no wrapped site nav with JS, prompt first actions, preserved editions.
const mobileNav=read('assets/jrs-mobile-navigation.js');
for(const token of ['aria-controls','aria-expanded','jrs-nav-ready','Escape','data-open','jrs-global-nav-toggle'])
 assert.ok(mobileNav.includes(token),'accessible global nav missing '+token);
for(const p of [...pages,...additionalPages]){
 assert.ok(read(p).includes('/assets/jrs-mobile-navigation.js'),p+' missing shared mobile navigation');
}
assert.ok(css.includes('nav.jrs-sitenav:not([data-open="true"])')&&
 css.includes('jrs-standard-entry-actions')&&css.includes('jrs-resource-primary-actions'),
 'responsive navigation and first-action CSS missing');
assert.ok(read('index.html').indexOf('class="jr-actions"')<
 read('index.html').indexOf('class="jr-intro"'),'homepage action should precede long intro');
assert.ok(read('resources.html').indexOf('jrs-resource-primary-actions')<
 read('resources.html').indexOf('class="access-note"'),'resources must expose tool before disclosures');
assert.ok(read('jrsstandard.html').includes('jrs-standard-entry-actions')&&
 read('jrsstandard.html').includes('jrs-standard-orientation')&&
 read('jrsstandard.html').includes('jrs-standard-page'),
 'Standard must show content and actions before optional orientation');
assert.ok(read('training.html').indexOf('jrs-training-lead')<
 read('training.html').indexOf('class="hero-sub"'),
 'training modules must be accessible ahead of long explanation');

assert.ok(css.includes('jrs-standard-page .util-bar{display:none!important}'),
 'Standard must not show a third competing navigation toolbar');
assert.ok(read('training.html').includes('jrs-training-context') &&
 read('training.html').includes('aria-label="JRS home"'),
 'training must retain explanation while enabling a compact header and home link');


assert.ok(mobileNav.includes("addEventListener('focusin'"),
 'expanded mobile menu must close when keyboard focus leaves it');
const simulations=read('simulations.html');
assert.ok(!simulations.includes('id="nav-toggle"') &&
 !simulations.includes('id="nav-links"') &&
 simulations.includes('class="jrs-simulation-related"'),
 'Simulations must have one global navigation and accessible contextual links');
for(const href of ['workflow-fit.html','implementation-scenarios.html','resources.html']){
 assert.ok(simulations.includes('href="'+href+'"'),'simulation context link missing '+href);
}

assert.ok(read('investigator-guides.html').includes('jrs-guide-quick-actions') &&
 read('investigator-guides.html').includes('Edition and terminology notice'),
 'guide PDFs need early access and edition provenance');
for(const anchor of ['rc1','rc2','rc3','rc4','rc5'])
 assert.ok(read('codebook.html').includes('id="'+anchor+'"'),
 'codebook condition cross-reference missing '+anchor);
assert.ok(read('research.html').includes('jrs-research-primary-links') &&
 read('research.html').includes('Read this first.'),
 'research quick paths must preserve evidence limitations');


// Historical reviewer access must not leak a name or receipt code through
// link-click telemetry or cross-origin referrer information. These source
// checks supplement, but cannot replace, browser/network verification.
{
  const receipt = read('reviewer/completion.html');
  assert.ok(receipt.includes('<meta name="referrer" content="no-referrer">'),
    'historical receipt must suppress referer headers');
  assert.ok(receipt.includes("params.delete('code')") &&
    receipt.includes("params.delete('name')") &&
    receipt.includes("history.replaceState("),
    'legacy GET parameters must be cleared from the browser URL');
  assert.ok(receipt.indexOf("history.replaceState(") <
    receipt.indexOf('<link rel="preconnect" href="https://fonts.googleapis.com">'),
    'legacy parameters must be stripped before third-party assets load');
  assert.doesNotMatch(receipt, /\/api\/telemetry|trackClickAndNavigate|googletagmanager/i,
    'receipt must not broadcast full navigation URLs or use analytics');
  assert.ok(receipt.includes('method="post"'),
    'new historical verification submissions must not use GET');
  assert.ok(receipt.includes('name="code"') && receipt.includes('name="name"'),
    'issuer record verification requires both historical code and recorded name');
  console.log('PASS: historic reviewer receipt minimizes legacy-link exposure and prevents click telemetry leakage.');
}

// Regression: a Standard section nested inside an inactive predecessor remains
// invisible even when the section navigation adds .active to the child.
// Track actual source div nesting, excluding scripts, styles and comments.
// This deliberately fails on unmatched containers and hidden nested sections.
{
  const standardMarkup=read('jrsstandard.html')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')
    .replace(/<!--[\s\S]*?-->/g,'');
  const stack=[],found=new Set(),nested=[],underflow=[];
  let footerAncestors=null;
  for(const match of standardMarkup.matchAll(/<\/?div\b[^>]*>|<footer\b[^>]*>/gi)){
    const tag=match[0];
    if(/^<\/div/i.test(tag)){
      if(!stack.length)underflow.push(match.index);
      else stack.pop();
    }else if(/^<footer/i.test(tag)){
      footerAncestors=stack.map(x=>x.id||x.className||'div');
    }else{
      const id=tag.match(/\bid=["']([^"']+)["']/i)?.[1]||null;
      const className=tag.match(/\bclass=["']([^"']+)["']/i)?.[1]||'';
      if(className.split(/\s+/).includes('page-section')){
        found.add(id);
        const prior=stack.filter(x=>x.className.split(/\s+/).includes('page-section'));
        if(prior.length)nested.push({id,parents:prior.map(x=>x.id)});
      }
      stack.push({id,className});
    }
  }
  assert.deepEqual(underflow,[],'Standard has orphan </div> closings');
  assert.deepEqual(stack,[],'Standard has unclosed HTML div containers');
  assert.deepEqual(nested,[],'Standard document sections must be siblings, never nested under another section');
  assert.deepEqual(footerAncestors,[],'Standard footer must remain outside hidden document sections');
  for(const id of ['section-home','section-doccond','section-tools','section-guidance',
     'section-roles','section-maturity','section-ai','section-usecases',
     'section-training','section-library']){
    assert.ok(found.has(id),'Standard section unavailable: '+id);
  }
  // Every document navigation destination must resolve. The historical
  // Review Examples control intentionally opens the existing Use Cases view.
  const aliases={scenarios:'usecases'};
  const targets=[...read('jrsstandard.html').matchAll(/onclick=["']showSection\('([a-z-]+)'\)/g)]
    .map(match=>match[1]);
  assert.ok(targets.length>=13,'Standard section-navigation regression check must exercise real actions');
  for(const target of targets){
    assert.ok(found.has('section-'+(aliases[target]||target)),
      'Standard navigation has no visible section: '+target);
  }
  assert.ok(read('jrsstandard.html').includes("const contentId=id==='scenarios'?'usecases':id;"),
    'Review Examples must resolve to the existing use-cases section');
  assert.ok(read('jrsstandard.html').includes('if(!sec)return;'),
    'Unknown section navigation must never blank the Standard');
  console.log('PASS: Standard sections are independently addressable; no hidden nesting, orphan containers or footer containment.');
}
