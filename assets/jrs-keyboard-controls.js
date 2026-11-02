/* Keyboard-equivalent operation for legacy JRS interactive cards.
 * The six training module rows already have native Open buttons, so their
 * descriptive bodies remain noninteractive. No data or telemetry is sent.
 * This file complements native buttons and existing page click handlers. */
(function(){
  'use strict';
  var controls=[];
  function hasClass(el,name){return !!(el.classList&&el.classList.contains(name));}
  function set(el,key,value){el.setAttribute(key,String(value));}
  function refresh(){
    controls.forEach(function(el){
      if(!el.isConnected)return;
      if(hasClass(el,'worksheet-header')||hasClass(el,'maturity-level-header')){
        var pane=el.nextElementSibling;
        if(pane)set(el,'aria-expanded',hasClass(pane,'open'));
      }
      if(hasClass(el,'role-path-card'))set(el,'aria-pressed',hasClass(el,'role-active'));
    });
  }
  function install(){
    var selectors=[
      '.sim-card[onclick]','.role-path-card[onclick]','.visitor-orient-cell[onclick]',
      '.role-card[onclick]','.worksheet-header[onclick]',
      '.maturity-level-header[onclick]','div[onclick]'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(function(el){
      if(el.hasAttribute('data-jrs-keyboard-enhanced'))return;
      if(hasClass(el,'module-body'))return;
      if(el.matches('button,a,input,select,textarea'))return;
      set(el,'data-jrs-keyboard-enhanced','true');
      set(el,'data-jrs-keyboard-control','true');
      if(!el.hasAttribute('role'))set(el,'role','button');
      if(!el.hasAttribute('tabindex'))set(el,'tabindex','0');
      var preferred=el.querySelector(
        '.role-card-title,.role-path-title,.sim-card-title,.worksheet-title,'+
        '.maturity-level-title,.visitor-orient-title,.visitor-orient-label'
      );
      if(!el.hasAttribute('aria-label')){
        var label=(preferred?preferred.textContent:el.textContent)||'';
        label=label.replace(/\s+/g,' ').trim().slice(0,140);
        if(label)set(el,'aria-label',label);
      }
      if(hasClass(el,'worksheet-header')||hasClass(el,'maturity-level-header')){
        var panel=el.nextElementSibling;
        if(panel){
          if(!panel.id)panel.id='jrs-interaction-panel-'+controls.length;
          set(el,'aria-controls',panel.id);
        }
      }
      if(hasClass(el,'visitor-orient-cell')){
        var match=(el.getAttribute('onclick')||'').match(/showSection\('([a-z-]+)'\)/);
        if(match){
          var target=document.getElementById('section-'+match[1]);
          if(target)set(el,'aria-controls',target.id);
        }
      }
      if(hasClass(el,'sim-card')){
        var sim=document.getElementById('simulator');
        if(sim)set(el,'aria-controls',sim.id);
      }
      el.addEventListener('keydown',function(event){
        if(event.target!==el)return;
        if(event.key!=='Enter'&&event.key!==' '&&event.key!=='Spacebar')return;
        event.preventDefault();
        el.click();
      });
      el.addEventListener('click',refresh);
      controls.push(el);
    });
    // Module content remains clickable for pointer users without duplicating
    // its existing native keyboard-focusable button control.
    document.querySelectorAll('.module-body:not([onclick])').forEach(function(el){
      if(el.hasAttribute('data-jrs-module-pointer'))return;
      set(el,'data-jrs-module-pointer','true');
      el.addEventListener('click',function(){
        var row=el.closest('.module-row');
        var btn=row&&row.querySelector('button.btn-open');
        if(btn)btn.click();
      });
    });
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
