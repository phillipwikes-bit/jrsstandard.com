/* Native sharing and clipboard copy of canonical public URLs. No new tags, storage or requests. On pages with existing GA4, report fixed successful actions only. */
(function(){
'use strict';
function initialize(){
  var el=document.querySelector('link[rel="canonical"]');
  if(!el)return;
  var url=el.href;
  if(!/^https:\/\/www\.jrsstandard\.com\/[a-z0-9-]+\.html$/.test(url))return;
  var isProduction=/^(?:www\.)?jrsstandard\.com$/.test(location.hostname);
  // Fixed page identities prevent arbitrary link text or full URLs entering GA4.
  var items={
    '/resources.html':'practitioner_resources',
    '/worked-example-ai-record.html':'worked_example',
    '/institutional-briefing.html':'institutional_briefing',
    '/terminology.html':'jrs_drr_terms'
  };
  function recordConfirmedAction(eventName,method){
    var item=items[location.pathname];
    if(!item||typeof window.gtag!=='function')return;
    window.gtag('event',eventName,{
      content_type:'jrs_public_reference',
      item_id:item,
      method:method
    });
  }

  document.querySelectorAll('.jrs-share-box').forEach(function(box){
    var status=box.querySelector('[data-jrs-share-status]');
    var buttons=box.querySelectorAll('button[data-jrs-share]');
    if(!status||!buttons.length)return;
    if(!isProduction){status.textContent='Share controls are inactive in the protected draft preview. The permanent link becomes usable after publication.';return}
    buttons.forEach(function(button){
      button.disabled=false;
      button.addEventListener('click',async function(){
        if(button.getAttribute('data-jrs-share')==='native'&&typeof navigator.share==='function'){
          try{
            await navigator.share({title:document.title,url:url});
            recordConfirmedAction('share','native_share_sheet');
            status.textContent='Sharing returned to the browser. JRS does not record who received the link.';
            return;
          }catch(error){
            if(error&&error.name==='AbortError'){status.textContent='Sharing was canceled.';return}
          }
        }
        if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
          try{await navigator.clipboard.writeText(url);recordConfirmedAction('jrs_link_copied','clipboard');status.textContent='Permanent link copied.';return}
          catch(error){}
        }
        status.textContent='Unable to copy automatically. Use the visible permanent reference link.';
      });
    });
    status.textContent='Share the page or copy its permanent link. Nothing is submitted to JRS.';
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);
else initialize();
})();
