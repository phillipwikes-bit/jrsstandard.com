/* Public GA4 interaction signals. Only fixed resource and page-category values
   leave the browser. Never send record answers, query strings, search terms,
   document contents, personal identifiers or independent telemetry requests. */
(function(){
  'use strict';
  var events=new Set(['tool_open','guide_open','training_entry','training_start','edition_compare','organization_info','campaign_entry','campaign_example_open','campaign_drr_open','campaign_resource_open','pdf_open','check_summary_copy','check_summary_print']);
  var resources=new Set(['record_check','investigator_guides','reviewer_training','module_0','module_1','module_2','module_3','module_4','module_5','edition_guide','organization_path','rights_initiative','professional_initiative','constructed_example','drr_explainer','resource_library','research_summary','reference_library','standard_pdf','rapid_review_card','employment_guide_pdf','fair_housing_guide_pdf','international_guide_pdf','reviewer_reference_pdf']);
  var surfaces={'/':'home','/index.html':'home','/resources.html':'resources','/training.html':'training','/editions.html':'editions','/organization.html':'organization','/right-to-know-why.html':'campaign_rights','/decisions-you-can-defend.html':'campaign_professional','/investigator-guides.html':'guides','/check.html':'record_check'};
  var pdfIds={'JRS-Standard.pdf':'standard_pdf','JRS_Rapid_Review_Card.pdf':'rapid_review_card','JRS_Investigator_Field_Guide_Employment.pdf':'employment_guide_pdf','JRS_Investigator_Field_Guide_FairHousing.pdf':'fair_housing_guide_pdf','JRS_Investigator_Field_Guide_International.pdf':'international_guide_pdf','JRS-Reference-9d4f2a7c.pdf':'reviewer_reference_pdf'};
  var editionIds={standard:'standard_pdf',card:'rapid_review_card',employment:'employment_guide_pdf',fairhousing:'fair_housing_guide_pdf',international:'international_guide_pdf'};
  var campaignTargets={'/resources.html':'resource_library','/investigator-guides.html':'investigator_guides','/check.html':'record_check','/training.html':'reviewer_training','/decision-reconstruction-risk.html':'drr_explainer','/research.html':'research_summary','/research-summary.html':'research_summary','/reference/':'reference_library'};
  var surface=surfaces[location.pathname];
  if(!surface)return;
  function emit(name,id){
    if(!events.has(name)||!resources.has(id)||typeof window.gtag!=='function')return;
    window.gtag('event','jrs_'+name,{resource_id:id,source_surface:surface});
  }
  document.addEventListener('click',function(e){
    if(!e.target||typeof e.target.closest!=='function')return;
    var a=e.target.closest('a[href]');if(!a)return;
    var link;try{link=new URL(a.getAttribute('href'),location.href)}catch{return}
    if(link.origin!==location.origin)return;
    if(a.dataset.jrsEvent){emit(a.dataset.jrsEvent,a.dataset.jrsResource);return}
    var pdfId;
    if(link.pathname==='/api/dl')pdfId=editionIds[link.searchParams.get('e')]||pdfIds[link.searchParams.get('f')];
    else if(link.pathname.toLowerCase().endsWith('.pdf'))pdfId=pdfIds[link.pathname.split('/').pop()];
    if(pdfId){emit('pdf_open',pdfId);return}
    if(surface==='campaign_rights'||surface==='campaign_professional'){
      var campaignId=campaignTargets[link.pathname];
      if(campaignId){emit('campaign_resource_open',campaignId);return}
    }
    if(link.pathname==='/check.html')emit('tool_open','record_check');
    else if(link.pathname==='/investigator-guides.html')emit('guide_open','investigator_guides');
    else if(link.pathname==='/training.html')emit('training_entry','reviewer_training');
    else if(link.pathname==='/editions.html')emit('edition_compare','edition_guide');
    else if(link.pathname==='/organization.html')emit('organization_info','organization_path');
    else if((surface==='campaign_rights'||surface==='campaign_professional')&&link.pathname==='/decision-reconstruction-risk.html')emit('campaign_drr_open','drr_explainer');
  });
  if(surface==='record_check'){
    document.addEventListener('click',function(e){
      if(!e.target||typeof e.target.closest!=='function')return;
      if(e.target.closest('#sa-copy'))emit('check_summary_copy','record_check');
      else if(e.target.closest('#sa-print'))emit('check_summary_print','record_check');
    });
  }
  if(surface==='training'){
    var started=false;
    document.addEventListener('click',function(e){
      if(started||!e.target||typeof e.target.closest!=='function')return;
      var b=e.target.closest('button[id^="module-btn-"]');
      if(!b||!/^module-btn-[0-5]$/.test(b.id)||b.getAttribute('aria-expanded')!=='true')return;
      started=true;emit('training_start','module_'+b.id.slice(-1));
    });
  }
})();
