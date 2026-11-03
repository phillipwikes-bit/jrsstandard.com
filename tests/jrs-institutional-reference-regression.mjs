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

// Core positioning is a human-applied review instrument within existing workflows,
// not a platform acquisition. Preserve the approved long-form proposition as well.
const practicalPositioning='JRS is a practical review instrument that practitioners can use within existing workflows, not a software platform they must acquire.';

const freeEntry='Free resources you can use today:';
for(const path of ['index.html','resources.html','about.html','organization.html']){
 const html=read(path);
 assert.ok(html.includes('<strong>'+freeEntry+'</strong>'),
  path+' must visibly identify immediate free practitioner access');
 for(const href of ['investigator-guides.html','training.html#training-modules','simulations.html']){
  assert.ok(html.includes('href="'+href+'"'),path+' missing free practitioner entry '+href);
 }
 const catalogHref=path==='resources.html'?'#resource-catalog':'resources.html#resource-catalog';
 assert.ok(html.includes('href="'+catalogHref+'"'),path+' missing direct searchable reference directory');
 assert.doesNotMatch(html,/for later independent review\.<\/strong>/,
  path+' contains unmatched emphasis after long-form non-purchase statement');
}
for(const path of ['index.html','resources.html','about.html','organization.html']){
 const html=read(path);
 assert.equal(html.split(practicalPositioning).length-1,1,
  path+' must prominently state the approved practitioner-first proposition once');
 assert.ok(html.includes('<strong>'+practicalPositioning+'</strong>'),
  path+' must visibly emphasize the practitioner-first proposition');
}
for(const path of ['index.html','resources.html','organization.html']){
 assert.ok(read(path).includes('Organizations do not need to purchase or replace a software platform'),
  path+' must retain the exact longer non-purchase statement');
}

// Homepage A-target typography: the long nonpurchase explanation must remain
// available, but not compete in the prominent introductory bold statement.
const homeTypography=read('index.html');
const homeDesign=read('assets/jrs-a-pathways.css');
assert.ok(homeTypography.includes('<p class="jr-platform-promise"><strong>'+practicalPositioning+'</strong></p>'),
 'the homepage hero must feature only the concise core instrument proposition');
assert.ok(homeTypography.includes('<p class="jrs-task-context">Organizations do not need to purchase or replace a software platform'),
 'the full no-purchase explanation must survive as normal-weight first-use guidance');
assert.ok(homeDesign.includes('HOME EDITORIAL TYPOGRAPHY REVIEW 2026-11-03'),
 'homepage typography correction must remain scoped and source-reviewable');
for(const s of ['text-wrap:balance','max-width:67ch','font-size:15px!important']){
 assert.ok(homeDesign.includes(s),'homepage readability correction missing: '+s);
}
assert.ok(homeDesign.includes('body.jrs-institutional.jrs-home .jr-fact-row'),
 'reference panel needs compact, readable label hierarchy');

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

// The logo and two deliberate text lines occupy the same header row.
assert.match(css,/\.site-header-inner > \.jrs-header-motto strong\s*\{[\s\S]*?display:block!important/,
 'second slogan phrase must start its own line beside the JRS wordmark');
assert.match(css,/@media\(max-width:1020px\)\{[\s\S]*?\.site-header-inner:has\(> \.jrs-header-motto\)\s*\{\s*flex-wrap:nowrap!important/,
 'standard phone and tablet widths must keep slogan next to JRS');
assert.match(css,/@media\(max-width:650px\)\{[\s\S]*?\.site-header-inner > \.header-meta\s*\{\s*display:none!important/,
 'mobile header must give the slogan space instead of clipping it behind metadata');
assert.match(css,/@media\(max-width:280px\)\{[\s\S]*?flex-wrap:wrap!important/,
 'extreme zoom must allow both slogan lines to wrap without clipping');


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


// Seven-point review aid: retain evidence discipline at the actual reader output.
// Checked boxes may indicate uncertainty, not an adjudicated documentation failure.
// The constructed-record studies did not validate a two-item legal-outcome cutoff.
const sevenPointAid = read('check.html');
for (const required of [
  'Each checked question identifies a matter for source verification, not a measured failure or a score.',
  'The number of checked items does not predict legal defensibility or establish a JRS finding.',
  'One checked question warrants review:',
  'checked questions warrant review:',
  'A single item may be material; do not dismiss it because of the count.',
  'A larger count does not establish a diagnostic category or predict the outcome of a challenge.',
  'Separately, a different reliability sample did not meet the pre-registered two-part criterion.'
]) assert.ok(sevenPointAid.includes(required), 'seven-point aid lost evidenced human-review framing: ' + required);
assert.doesNotMatch(sevenPointAid, /two or more modes in one file is the pattern that matters|if two or more modes show up|likely to struggle to explain its own decision|probably cannot explain its own decision/i,
  'unsupported two-item decision-prediction threshold returned');
assert.match(sevenPointAid, /out\.innerHTML = summary \+ bench \+ actions/,
  'review summary and separate on-screen research benchmark must remain');
const checkLocalScript = sevenPointAid.match(/<script>\s*\(function\(\)\{\s*\/\/ Runs entirely in the browser\.[\s\S]*?<\/script>/);
assert.ok(checkLocalScript, 'local-only record check is missing');
assert.doesNotMatch(checkLocalScript[0], /\b(?:fetch|sendBeacon)\s*\(|\blocalStorage\s*\./,
  'selected record-check answers must remain browser-local');
console.log('PASS: seven-point aid has no invented two-item threshold, distinguishes detection from reliability, and preserves local-only review output.');

// PR #117: ensure screen-reader result changes and analytics data minimization
// survive later SEO, navigation and instrumentation edits.
{
  const check=read('check.html');
  assert.match(check, /id="sa-announcement"[^>]*role="status"[^>]*aria-live="polite"/,
    'seven-point check must provide an independent concise live status');
  assert.match(check, /One question selected for source verification/,
    'one selected question must have explicit accessible feedback');
  assert.match(check, /The count is not a score/,
    'multiple question feedback must not imply a validated diagnostic score');
  assert.match(check, /page_location:window.location.origin\+window.location.pathname/,
    'GA page location may not contain unchecked URL query parameters');
  assert.doesNotMatch(check, /function trackClickAndNavigate|window.location.href = targetUrl/,
    'telemetry must not hijack or delay native link navigation');
  const tracking=check.split('Best-effort path-only click telemetry:')[1]?.split('</script>')[0];
  assert.ok(tracking,'path-only click telemetry block absent');
  assert.match(tracking, /origin_url:window.location.pathname/,
    'click events should use origin path rather than full URL');
  assert.doesNotMatch(tracking, /origin_url:window.location.href|event.preventDefault\(/,
    'analytics must never include a full referer or block navigation');
  assert.match(tracking, /link.pathname/,
    'target analytics must strip both query string and fragment');
  assert.match(check, /sourceCandidate.*toLowerCase\(\)/,
    'referral categorization must be bounded');
  assert.match(check, /These questions are not validated diagnostic tests/,
    'SEO and public review claims must respect research limitations');
  console.log('PASS: check result announcements, no navigation hijack and path-only analytics.');
}

// Print and copy contract: printing only the current reading-aid result, never
// dumping unrelated web navigation or silently claiming clipboard success.
{
  const page=read('check.html');
  assert.match(page, /body\.jrs-institutional > :not\(main\)\{display:none!important\}/,
    'print must exclude top-level site chrome');
  assert.match(page, /#main-content > article > :not\(#sa-out\)/,
    'print must exclude seven question prompts and research page furniture');
  assert.match(page, /#sa-out \.sa-actions\{display:none!important\}/,
    'action buttons and policy links must not be printed');
  assert.match(page, /#sa-out::before\{/,
    'printed one-record summary must identify itself');
  assert.match(page, /id="sa-summary"/,
    'copy must isolate the review summary from its UI action buttons');
  assert.match(page, /out\.querySelector\('#sa-summary'\)/,
    'copy source must target only the written summary');
  assert.match(page, /document\.execCommand\('copy'\) !== true/,
    'clipboard fallback must check actual copy return value before reporting success');
  assert.match(page, /if \(ta\.parentNode\) ta\.parentNode\.removeChild\(ta\)/,
    'temporary clipboard focus target must always be removed');
  assert.match(page, /if \(prior && typeof prior\.focus === 'function'\) prior\.focus\(\)/,
    'keyboard focus must return after clipboard fallback');
  console.log('PASS: print scope and truthful clipboard fallback with keyboard focus restoration.');
}

// Specificity regression: the mobile navigation script inserts a sibling button
// whose later shared stylesheet declares !important display:flex. A generic
// body > :not(main) print rule is insufficient to suppress that control.
{
  const page=read('check.html');
  assert.match(page, /body\.jrs-institutional\.jrs-nav-ready > button\.jrs-global-nav-toggle/,
    'mobile disclosure button must be suppressed at print-specific specificity');
  assert.match(page, /body\.jrs-institutional\.jrs-nav-ready > nav\.jrs-sitenav\[data-open\]/,
    'expanded mobile navigation must also be absent from review printouts');
  const witness=read('tests/jrs-check-print-evidence.py');
  assert.ok(witness.includes('"Site menu", "Close site menu"'),
    'printed text verification must explicitly reject mobile navigation labels');
  console.log('PASS: mobile menu and expanded disclosure cannot be printed alongside a review summary.');
}

// Validate the selected-state print witness remains wired into exact-head CI.
{
 const script=read('tests/jrs-check-selected-print.mjs');
 const workflow=read('.github/workflows/jrs-accessibility-evidence.yml');
 assert.match(script,/Page.printToPDF/,'selected-state output must use actual Chromium PDF rendering');
 assert.match(script,/boxes\[0\]\.checked=true/,'first synthetic review selection must execute');
 assert.match(script,/boxes\[2\]\.checked=true/,'second distinct selection must execute');
 assert.match(script,/The count is not a score/,'selected review must state that count is not diagnostic');
 assert.ok(workflow.includes('jrs-check-selected-print.mjs')&&
    workflow.includes('jrs-check-selected-preflight.pdf')&&
    workflow.includes('jrs-check-selected-text.txt'),
   'selected PDF witness must run and archive output');
 assert.ok(read('tests/jrs-check-a11y-browser.html').includes('failed clipboard command never reports success'),
   'browser must fail when copy fallback claims success without confirmation');
 console.log('PASS: synthetic populated print and clipboard denial witnesses remain in CI.');
}

// Research evidence must not be copied or printed as though measured on the
// particular record. Preserve source research on screen, but export only
// the review note, its limitations and provenance.
{
 const check=read('check.html');
 assert.match(check, /\+ head \+ tail \+ stamp \+ '<\/section>'/,
    'record-specific summary must exclude constructed-corpus accuracy evidence');
 assert.match(check, /out\.innerHTML = summary \+ bench \+ actions/,
    'the benchmark must remain visible in the page as separate research context');
 assert.match(check, /#sa-out > \.sa-bench\{display:none!important\}/,
    'print must exclude the group-level benchmark independently of the record summary');
 const fixture=read('tests/jrs-check-a11y-browser.html');
 assert.match(fixture, /portable note does not incorporate group-level research benchmarks/,
    'copy test must reject unrelated group-level research figures');
 console.log('PASS: record-specific exports separate findings from constructed-corpus evidence.');
}

// Mixed yes/no and either/or questions require explicit review-selection rules.
// The grouped instructions must be reachable by assistive technologies, without
// changing the seven mode names, benchmark, telemetry, or local-only answers.
{
 const check=read('check.html');
 const required=[
   'id="sa-group-heading"','id="sa-instructions"',
   'id="sa-question-group" role="group" aria-labelledby="sa-group-heading" aria-describedby="sa-instructions"',
   'if reasoning is assumed or the evidence supports only a weaker conclusion',
   'A tick identifies a question for source verification, not a finding or score.'
 ];
 for(const token of required)assert.ok(check.includes(token),'seven-question review instruction missing: '+token);
 assert.doesNotMatch(check,/Tick a box only where the answer is no or you are unsure\./,
   'misleading binary-only guidance has returned');
 const types=[...check.matchAll(/<label class="chk"><input type="checkbox" class="sa" data-mode="([^"]+)"/g)]
   .map(match=>match[1]);
 assert.deepEqual(types,[
   'Fluent groundlessness','Basis substitution','Chronology collapse',
   'Reasoning elision','Confident underspecification','Evidentiary overreach',
   'Untraceable authority'
 ],'all seven source review modes must remain present in order');
 assert.match(read('tests/jrs-check-a11y-browser.html'),
   /seven questions expose a named assistive-technology group/,
   'automated browser witness must exercise the accessible question group');
 console.log('PASS: mixed-format question selection and labelled group have explicit release regression coverage.');
}

// The review is the primary practitioner task. Research figures and explanatory
// patterns remain on the page, but must not block access to the actual tool.
{
 const html=read('check.html');
 const action=html.indexOf('id="sa-group-heading"');
 const evidence=html.indexOf('class="evidence-strip"');
 const patterns=html.indexOf('>Seven documentation-risk patterns</h2>');
 const conditions=html.indexOf('>The five conditions behind the check</h2>');
 assert.ok(action>0 && evidence>action && patterns>evidence && conditions>patterns,
   'interactive review must precede group-level research evidence and explanations');
 assert.equal((html.match(/id="sa-out"/g)||[]).length,1,
   'moving the tool must not duplicate the record-specific summary');
 assert.equal((html.match(/class="evidence-strip"/g)||[]).length,1,
   'moving the tool must preserve the separately scoped research statistics');
 assert.match(html,/id="sa-question-group" role="group"/,
   'primary interaction must keep its accessible group');
 console.log('PASS: record-first review journey retains separate research and all reference content.');
}
