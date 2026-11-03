// Source-anchored, competitor-informed first-use journey.
// Release safety: do not add forms, new endpoints or claims of certified outcomes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const home=read('index.html');
const resources=read('resources.html');
const training=read('training.html');
const guides=read('investigator-guides.html');
const about=read('about.html');
const organization=read('organization.html');
const css=read('assets/jrs-a-pathways.css');
// Expert participants must be identified accurately, separately from the main
// no-purchase message. Constructed-record findings do not certify field use.
const research=read('research.html');
const summary=read('research-summary.html');
assert.match(home,/<p class="jr-expert-evidence"><strong>For practitioners, studied with international experts\.<\/strong>/);
assert.match(home,/16 independent experts across 11 countries and five continents evaluated constructed decision records/);
assert.match(home,/href="research-summary\.html">See the findings and limitations<\/a>/);
assert.match(research,/16 independent experts from 11 countries across five continents/);
assert.match(research,/not certification of JRS or proof of effectiveness in live organizational records/);
assert.match(summary,/16 independent experts across 11 countries and 5 continents/);
assert.match(css,/\.jr-expert-evidence/);
assert.ok(!home.match(/<span class="jrs-header-motto">[^<]*international/i),
 'expert research is supplemental, not inserted into the brand/header');

const vercel=JSON.parse(read('vercel.json'));

const exactPromise='Organizations do not need to purchase or replace a software platform to begin examining whether their decision records preserve sufficient evidence, chronology and reasoning for later independent review.';
for(const [path,markup] of [['homepage',home],['resources',resources],['organizational information',organization]]){
  assert.equal(markup.split(exactPromise).length-1,1,
    path+': exact no-platform-purchase proposition must be preserved once');
}
assert.match(home,/<p class="jr-platform-promise"><strong>Organizations do not need to purchase or replace a software platform/);
assert.match(resources,/<p class="jrs-practitioner-promise"><strong>Organizations do not need to purchase or replace a software platform/);
assert.match(css,/\.jr-platform-promise/);
assert.match(css,/\.jrs-practitioner-promise/);
assert.ok(home.indexOf('id="jrs-main-heading"')<home.indexOf(exactPromise)
 && home.indexOf(exactPromise)<home.indexOf('id="task-chooser"'),
 'primary public-interest promise must appear within the first homepage hero');
assert.ok(home.indexOf('id="task-chooser"')<home.indexOf('id="professional-paths"')
 && home.indexOf('id="professional-paths"')<home.indexOf('id="worked-record"')
 && home.indexOf('id="worked-record"')<home.indexOf('id="evidence-snapshot"'),
 'homepage must carry one coherent progression: action, guidance, example, evidence');
for(const [path,markup] of [['homepage',home],['resources',resources],['training',training],
 ['investigator guides',guides],['about',about],['organization',organization]]){
  assert.ok(markup.includes('Decision Reconstruction Risk'),
   path+': the documentation problem must remain explicit');
}
for(const page of [home,resources,organization]){
  assert.ok(!/request (?:a )?demo|start paid trial|buy a license/i.test(page),
   'practitioner pages must not become commercial funnels');
}
assert.match(training,/Six self-paced modules|six training modules|six modules/i);
assert.match(guides,/Version 1\.1.*July 2026/);
assert.match(resources,/published PDFs have not been certified/i);
assert.match(home,/Field effectiveness not established/);


// Preserve JRS institutional titles and distinct edition labels while making
// the no-new-software practitioner distinction unmistakable in the header.
const motto='<span class="jrs-header-motto">Check the record. <strong>No new software required.</strong></span>';
for(const filename of ['index.html','resources.html','investigator-guides.html',
 'jrsstandard.html','research.html','about.html','codebook.html']){
 const html=read(filename);
 const begin=html.indexOf('<header');
 const end=begin<0?-1:html.indexOf('</header>',begin);
 const header=end<0?'':html.slice(begin,end+9);
 assert.ok(header && header.includes('class="wordmark"'),filename+': retain original JRS identity');
 assert.equal(header.split(motto).length-1,1,filename+': brand distinction should appear exactly once');
}
const headerCSS=read('assets/jrs-institutional-reference.css');
assert.match(headerCSS,/\.site-header-inner > \.jrs-header-motto/);
assert.match(headerCSS,/@media\(max-width:1020px\)/);
assert.ok(home.includes('Can the record explain the decision after its author is gone?'),
 'original JRS governing question must remain unchanged');

const redir=vercel.redirects.find(x=>x.source==='/workflow-fit.html');
assert.ok(redir&&redir.destination==='/resources.html',
 'retired workflow route must retain its current redirect');
assert.match(home,/<h1 id="jrs-main-heading">Can the record explain the decision after its author is gone\?<\/h1>/);
assert.match(home,/href="resources\.html#jrs-first-use-title"/);
assert.ok(!home.includes('workflow-fit.html#jrs-first-use-title'),
 'homepage must not link to a fragment on a redirected legacy page');
assert.match(home,/href="check\.html\?src=home"/);
assert.match(home,/href="resources\.html#resource-catalog"/);
const main=resources.match(/<section class="jrs-resource-first-use" aria-labelledby="jrs-first-use-title">([\s\S]*?)<\/section>/);
assert.ok(main,'first-use section must be on canonical Resources');
assert.match(main[1],/<h2 id="jrs-first-use-title">Start with a record already on your desk\.<\/h2>/);
const steps=main[1].match(/<ol class="jrs-resource-first-use-steps">([\s\S]*?)<\/ol>/);
assert.ok(steps,'native ordered procedure exists');
assert.equal((steps[1].match(/<li>/g)||[]).length,3,'exactly three reviewer actions');
for(const phrase of [
 'Identify the draft and its sources','Examine the five review conditions',
 'Record the disposition in your system',
 'reconstructability, identifiable basis, chronology, reasoning trace and sufficiency',
 'Do not upload or send case-record content to this website'
]){
  assert.ok(steps[1].includes(phrase),'missing documented reviewer control: '+phrase);
}
assert.match(steps[1],/href="check\.html\?src=resources"/);
assert.match(main[1],/JRS does not certify legal correctness or compliance/);
assert.match(main[1],/local retention and amendment procedures still govern any correction/);
assert.ok(resources.indexOf('id="resource-catalog"')<
          resources.indexOf('id="jrs-first-use-title"'),
 'searchable catalog must remain ahead of new educational section');
assert.ok(resources.indexOf('id="jrs-first-use-title"')<
          resources.indexOf('id="quick-review"'),
 'first-use guidance must precede duplicate detailed cards');
assert.match(css,/jrs-resource-first-use-steps/);
assert.match(css,/@media\(max-width:780px\)/);
assert.match(css,/@media\(forced-colors:active\)/);
assert.equal((resources.match(/class="jrs-resource-entry"/g)||[]).length,16,
 'all 16 free directory entries remain');
assert.match(resources,/href="contact\.html\?category=accessibility"/);
const nav=home.match(/<nav class="jrs-sitenav" aria-label="Site">([\s\S]*?)<\/nav>/);
assert.ok(nav,'canonical navigation must remain');
assert.equal((nav[1].match(/<a href=/g)||[]).length,7,
 'do not add more global navigation while optimizing user journeys');
// Editorial narrative integrity: keep the original question and exact practitioner-first promise.
// These assertions verify copy/route identity, not uptake, persuasive effect or field efficacy.
const centralPromise='Organizations do not need to purchase or replace a software platform to begin examining whether their decision records preserve sufficient evidence, chronology and reasoning for later independent review.';
assert.equal(home.split(centralPromise).length-1,1,
 'homepage must visibly state the full no-purchase/no-replacement proposition once');
assert.equal(organization.split(centralPromise).length-1,1,
 'organizational information should repeat the exact no-purchase proposition without a sales CTA');
assert.ok(home.indexOf('id="jrs-main-heading"')<home.indexOf(centralPromise) &&
          home.indexOf(centralPromise)<home.indexOf('id="task-chooser"'),
 'preserve original headline and make the free practitioner promise visible before task navigation');
assert.ok(home.indexOf('href="check.html?src=home"')<home.indexOf(centralPromise),
 'do not move the first actionable, free record check beneath long editorial copy');
assert.ok(home.includes('href="#worked-record">See the three-step fictional example</a>') &&
          home.includes('href="resources.html">browse all free practitioner resources</a>'),
 'preserve established links to a source-checked demonstration and complete resource library');
assert.match(home,/Decision Reconstruction Risk \(DRR\)/);
assert.match(resources,/Free JRS training and tools for practitioners/);
assert.match(resources,/No platform purchase required/);
assert.match(training,/Free, self-paced training for practitioners confronting Decision Reconstruction Risk \(DRR\)/);
assert.match(guides,/For investigators doing the work/);
assert.match(about,/Decision Reconstruction Risk \(DRR\)/);
assert.match(organization,/does not offer organizational software, licensing, certification or validated operational effectiveness/i,
 'do not convert the public-interest organizational information page into a software offer');
assert.match(css,/jr-platform-promise/);
for(const page of [home,resources,training,guides,organization]){
 assert.ok(!page.includes('Buy Decision Spellchecker') &&
   !page.includes('Get an enterprise quote') &&
   !page.includes('Book a commercial demo'),
   'public practitioner experience cannot become a commercial product funnel');
}

console.log('PASS: canonical first-use JRS procedure, existing tool routes, PDF/version and privacy boundaries preserved.');
