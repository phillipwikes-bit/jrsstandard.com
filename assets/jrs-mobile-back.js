/* JRS small mobile return control. Does not modify the page's menu. */
(function(){
  function addBackLink(anchor){
    var path=location.pathname;
    if(path==='/' || path==='/index.html' || !anchor || document.querySelector('.jrs-mobile-back-wrap'))return;
    var sheet=document.createElement('link');
    sheet.rel='stylesheet';
    sheet.href='/assets/jrs-mobile-back.css';
    sheet.setAttribute('data-jrs-back-style','');
    document.head.appendChild(sheet);
    var wrap=document.createElement('div');
    wrap.className='jrs-mobile-back-wrap';
    var back=document.createElement('a');
    back.className='jrs-mobile-back';
    back.href='/';
    back.setAttribute('aria-label','Back to previous JRS page, or JRS homepage');
    back.innerHTML='<span aria-hidden="true">&#8592;</span><span>Back</span>';
    back.addEventListener('click',function(event){
      if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
      try{
        if(!document.referrer || new URL(document.referrer).origin!==location.origin || history.length<=1)return;
      }catch(e){return;}
      event.preventDefault();
      history.back();
    });
    wrap.appendChild(back);
    if(anchor.tagName==='MAIN')anchor.insertAdjacentElement('beforebegin',wrap);
    else anchor.insertAdjacentElement('afterend',wrap);
  }
  function ready(){
    addBackLink(document.querySelector('nav.jrs-sitenav') || document.querySelector('header') || document.querySelector('main'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);
  else ready();
})();
