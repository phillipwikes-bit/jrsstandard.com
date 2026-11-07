/* JRS shared progressive-enhancement navigation, 2026-11-01.
   Static navigation remains usable when JavaScript is unavailable. */
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
    var nav=document.querySelector('nav.jrs-sitenav');
    addBackLink(nav || document.querySelector('header') || document.querySelector('main'));
    if(!nav)return;
    if(document.querySelector('.jrs-global-nav-toggle'))return;
    var button=document.createElement('button');
    button.type='button';
    button.className='jrs-global-nav-toggle';
    button.setAttribute('aria-controls','jrs-global-nav-links');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-label','Open site navigation');
    button.innerHTML='<span aria-hidden="true">&#9776;</span><span>Site menu</span>';
    nav.id='jrs-global-nav-links';
    nav.setAttribute('data-open','false');
    nav.insertAdjacentElement('beforebegin',button);
    document.body.classList.add('jrs-nav-ready');
    function setOpen(open){
      nav.setAttribute('data-open',String(open));
      button.setAttribute('aria-expanded',String(open));
      button.setAttribute('aria-label',open?'Close site navigation':'Open site navigation');
      button.innerHTML=open?'<span aria-hidden="true">&#215;</span><span>Close site menu</span>':'<span aria-hidden="true">&#9776;</span><span>Site menu</span>';
    }
    button.addEventListener('click',function(){
      setOpen(nav.getAttribute('data-open')!=='true');
    });
    nav.addEventListener('click',function(e){if(e.target.closest('a'))setOpen(false)});
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape' && nav.getAttribute('data-open')==='true'){
        setOpen(false);button.focus();
      }
    });
    document.addEventListener('click',function(e){
      if(nav.getAttribute('data-open')==='true' && !nav.contains(e.target) && !button.contains(e.target))setOpen(false);
    });
    // Close the disclosure when keyboard focus leaves it. This prevents a
    // long, expanded navigation list remaining open during page interaction.
    document.addEventListener('focusin',function(e){
      if(nav.getAttribute('data-open')==='true' && !nav.contains(e.target) && !button.contains(e.target))setOpen(false);
    });
    var here=location.pathname.replace(/\/$/,'/index.html').replace(/^\//,'');
    nav.querySelectorAll('a').forEach(function(a){
      try{
        var dest=new URL(a.href,location.href);
        if(dest.origin===location.origin && dest.pathname.replace(/^\//,'')===here)a.setAttribute('aria-current','page');
      }catch(e){}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);
  else ready();
})();
