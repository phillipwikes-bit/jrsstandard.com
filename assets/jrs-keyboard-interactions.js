/* JRS public interactive semantics.
 * Legacy page templates use div[onclick] for some active cards and accordion
 * headers. Preserve visual design and existing click handlers while making
 * every remaining semantic action focusable and keyboard-operable.
 * This module never reads, sends or stores participant information. */
(function(){
  'use strict';
  var controls=[];
  function hasClass(el,name){return !!(el.classList && el.classList.contains(name));}
  function set(el,name,value){el.setAttribute(name,String(value));}
  function refresh(){
    controls.forEach(function(el){
      if(!el.isConnected)return;
      if(hasClass(el,'worksheet-header')||hasClass(el,'maturity-level-header')){
        var panel=el.nextElementSibling;
        if(panel)set(el,'aria-expanded',hasClass(panel,'open'));
      }
      if(hasClass(el,'role-path-card'))set(el,'aria-pressed',hasClass(el,'role-active'));
    });
  }
  function init(){
    document.querySelectorAll('div[onclick]').forEach(function(el){
      // Training module rows already have an adjacent native expansion button.
      // The body text should remain informative rather than duplicate a tab stop.
      if(hasClass(el,'module-body'))return;
      if(!el.hasAttribute('role'))set(el,'role','button');
      if(!el.hasAttribute('tabindex'))set(el,'tabindex','0');
      set(el,'data-jrs-keyboard-control','true');
      var preferred=el.querySelector('.visitor-orient-title, .sim-card-title, .role-path-title, .role-card-title, .maturity-level-title, .worksheet-title');
      if(preferred&&!el.hasAttribute('aria-label')){
        var name=(preferred.textContent||'').replace(/\\s+/g,' ').trim();
        if(name)set(el,'aria-label',name.slice(0,120));
      }
      if(hasClass(el,'worksheet-header')||hasClass(el,'maturity-level-header')){
        var panel=el.nextElementSibling;
        if(panel){
          if(!panel.id)panel.id='jrs-interaction-panel-'+controls.length;
          set(el,'aria-controls',panel.id);
        }
      }
      if(hasClass(el,'visitor-orient-cell')){
        var onclick=el.getAttribute('onclick')||'';
        var m=onclick.match(/showSection\\('([a-z-]+)'\\)/);
        if(m){
          var target=document.getElementById('section-'+m[1]);
          if(target)set(el,'aria-controls',target.id);
        }
      }
      if(hasClass(el,'sim-card')) {
        var sim=document.getElementById('simulator');
        if(sim)set(el,'aria-controls',sim.id);
      }
      if(!el.hasAttribute('aria-label')){
        var label=(el.textContent||'').replace(/\\s+/g,' ').trim();
        if(label)set(el,'aria-label',label.slice(0,160));
      }
      el.addEventListener('keydown',function(e){
        if(e.target!==el)return;
        if(e.key==='Enter'||e.key===' '||e.key==='Spacebar'){
          e.preventDefault();
          el.click();
          refresh();
        }
      });
      el.addEventListener('click',refresh);
      controls.push(el);
    });
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
