/* JRS shared progressive-enhancement navigation, 2026-11-01.
   Static navigation remains usable when JavaScript is unavailable. */
(function(){
  function ready(){
    var nav=document.querySelector('nav.jrs-sitenav');
    if(!nav || document.querySelector('.jrs-global-nav-toggle'))return;
    var button=document.createElement('button');
    button.type='button';
    button.className='jrs-global-nav-toggle';
    button.setAttribute('aria-controls','jrs-global-nav-links');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-label','Open site navigation');
    button.innerHTML='<span aria-hidden="true">&#9776;</span><span>Menu</span>';
    nav.id='jrs-global-nav-links';
    nav.setAttribute('data-open','false');
    nav.insertAdjacentElement('beforebegin',button);
    document.body.classList.add('jrs-nav-ready');
    function setOpen(open){
      nav.setAttribute('data-open',String(open));
      button.setAttribute('aria-expanded',String(open));
      button.setAttribute('aria-label',open?'Close site navigation':'Open site navigation');
      button.innerHTML=open?'<span aria-hidden="true">&#215;</span><span>Close menu</span>':'<span aria-hidden="true">&#9776;</span><span>Menu</span>';
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
