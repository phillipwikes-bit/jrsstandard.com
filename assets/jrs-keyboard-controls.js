/* Add native-keyboard-equivalent operation to legacy clickable panels.
   No content, result, score, telemetry or reviewer state is changed by this file. */
(function(){
 'use strict';
 function install(){
  const selectors=[
   '.sim-card[onclick]','.role-path-card[onclick]','.visitor-orient-cell[onclick]',
   '.role-card[onclick]','.worksheet-header[onclick]',
   '.maturity-level-header[onclick]'
  ];
  document.querySelectorAll(selectors.join(',')).forEach(function(el){
   if(el.hasAttribute('data-jrs-keyboard-enhanced'))return;
   if(el.matches('button,a,input,select,textarea'))return;
   el.setAttribute('data-jrs-keyboard-enhanced','true');
   el.setAttribute('role','button');
   el.setAttribute('tabindex','0');
   const label=el.querySelector('.role-card-title,.role-path-title,.sim-card-title,.worksheet-title,.maturity-level-title')
     ||el.querySelector('.visitor-orient-title,.visitor-orient-label')||el;
   const text=(label.textContent||'').replace(/\s+/g,' ').trim().slice(0,140);
   if(text&&!el.hasAttribute('aria-label'))el.setAttribute('aria-label',text);
   el.addEventListener('keydown',function(event){
    if(event.target!==el || (event.key!=='Enter'&&event.key!==' '))return;
    event.preventDefault();el.click();
   });
  });
  // Existing module rows have their own focusable Open buttons. Keep that
  // single clear focus target instead of adding a redundant panel target.
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
 else install();
})();
