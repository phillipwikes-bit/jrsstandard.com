// Regression for aggregate public engagement. Tests do not transmit analytics.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('assets/jrs-engagement.js');
assert.doesNotMatch(source,/fetch\(|sendBeacon\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie/);
new vm.Script(source,{filename:'jrs-engagement.js'});

for(const path of ['check.html','investigator-guides.html','resources.html','training.html','right-to-know-why.html','decisions-you-can-defend.html']){
  assert.ok(read(path).includes('src="/assets/jrs-engagement.js"'),path+' missing engagement script');
}
assert.match(read('training.html'),/not a requirement of the published JRS Standard/);
assert.match(read('training.html'),/Historical pilot reference: optional rating scale/);
assert.match(read('privacy-notice.html'),/content of the copied summary/);

function harness(path){
  const handlers={},events=[];
  const document={addEventListener:(name,handler)=>(handlers[name]??=[]).push(handler)};
  const location={pathname:path,origin:'https://www.jrsstandard.com',href:'https://www.jrsstandard.com'+path};
  vm.runInNewContext(source,{document,location,URL,Set,window:{gtag:(...args)=>events.push(args)}});
  function link(href){
    const anchor={dataset:{},getAttribute:()=>href};
    for(const fn of handlers.click||[])fn({target:{closest:q=>q==='a[href]'?anchor:null}});
  }
  function control(selector){
    for(const fn of handlers.click||[])fn({target:{closest:q=>q===selector?{}:null}});
  }
  return {events,link,control};
}

const catalog=harness('/resources.html');
catalog.link('/api/dl?e=standard&src=resources&personal_email=never_send');
assert.equal(catalog.events[0][1],'jrs_pdf_open');
assert.equal(catalog.events[0][2].resource_id,'standard_pdf');
assert.equal(catalog.events[0][2].source_surface,'resources');
assert.deepEqual(Object.keys(catalog.events[0][2]).sort(),['resource_id','source_surface']);
catalog.link('/api/dl?f=unknown.pdf');
catalog.link('https://other.example/path.pdf');
assert.equal(catalog.events.length,1,'unapproved or cross-origin PDFs must not be emitted');

const guides=harness('/investigator-guides.html');
guides.link('/JRS_Investigator_Field_Guide_FairHousing.pdf');
assert.equal(guides.events[0][2].resource_id,'fair_housing_guide_pdf');

const publicCampaign=harness('/right-to-know-why.html');
publicCampaign.link('/resources.html#resource-catalog');
publicCampaign.link('/decision-reconstruction-risk.html');
assert.deepEqual(publicCampaign.events.map(e=>e[1]),['jrs_campaign_resource_open','jrs_campaign_resource_open']);
assert.ok(publicCampaign.events.every(e=>e[2].source_surface==='campaign_rights'));

const professionalCampaign=harness('/decisions-you-can-defend.html');
professionalCampaign.link('/training.html#training-modules');
assert.equal(professionalCampaign.events[0][2].resource_id,'reviewer_training');
assert.equal(professionalCampaign.events[0][2].source_surface,'campaign_professional');

const check=harness('/check.html');
check.control('#sa-copy');
check.control('#sa-print');
assert.deepEqual(check.events.map(e=>e[1]),['jrs_check_summary_copy','jrs_check_summary_print']);
assert.ok(check.events.every(e=>Object.keys(e[2]).length===2));

console.log('PASS fixed public engagement taxonomy, two campaigns, PDF clicks, privacy boundaries and historical-method disclosures');
