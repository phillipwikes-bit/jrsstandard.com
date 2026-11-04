/* Public engagement signals, additive to preexisting GA4. No custom IDs, storage,
   query strings, personal data, search terms or independent telemetry endpoint. */
(function(){
  'use strict';
  var events=new Set(['tool_open','guide_open','training_entry','training_start','edition_compare','organization_info']);
  var resources=new Set(['record_check','investigator_guides','reviewer_training','module_0','module_1','module_2','module_3','module_4','module_5','edition_guide','organization_path']);
  var surfaces={'/':'home','/index.html':'home','/resources.html':'resources','/training.html':'training','/editions.html':'editions','/organization.html':'organization'};
  var surface=surfaces[location.pathname];
  if(!surface)return;
  // GA4's recommended select_content event: fixed public reference IDs only.
  // No source URL, query string, visitor identifier or case-record content.
  var references={
    '/worked-example-ai-record.html':'worked_example',
    '/institutional-briefing.html':'institutional_briefing',
    '/terminology.html':'jrs_drr_terms'
  };
  function selectPublicReference(pathname){
    if(surface!=='home'&&surface!=='resources')return false;
    var id=references[pathname];
    if(!id)return false;
    if(typeof window.gtag==='function'){
      window.gtag('event','select_content',{
        content_type:'jrs_public_reference',
        item_id:id,
        source_surface:surface
      });
    }
    return true;
  }
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
    if(selectPublicReference(link.pathname))return;
    if(link.pathname==='/check.html')emit('tool_open','record_check');
    else if(link.pathname==='/investigator-guides.html')emit('guide_open','investigator_guides');
    else if(link.pathname==='/training.html')emit('training_entry','reviewer_training');
    else if(link.pathname==='/editions.html')emit('edition_compare','edition_guide');
    else if(link.pathname==='/organization.html')emit('organization_info','organization_path');
  });
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
