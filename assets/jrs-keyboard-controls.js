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
  // Worked examples use native buttons. Enhance them with an actual tablist,
  // roving keyboard focus, panel ownership and accessible selected state.
  // The HTML remains usable with pointer clicks if this enhancement fails.
  function enhanceScenarioTabs(){
    document.querySelectorAll('.scenario-block .scenario-tabs').forEach(function(tabs){
      if(tabs.hasAttribute('data-jrs-tabs-enhanced'))return;
      var block=tabs.closest('.scenario-block');
      var buttons=Array.from(tabs.querySelectorAll('button.scenario-tab'));
      if(!block||buttons.length<2)return;
      var pairs=buttons.map(function(button){
        var match=(button.getAttribute('onclick')||'').match(/showScenarioPane\(this,\s*'([^']+)'\)/);
        var panel=match&&document.getElementById(match[1]);
        return panel&&block.contains(panel)?{button:button,panel:panel}:null;
      });
      if(pairs.some(function(pair){return !pair;}))return;
      var title=block.querySelector('.scenario-title');
      tabs.setAttribute('role','tablist');
      tabs.setAttribute('aria-label',title?
        'Review panels: '+title.textContent.trim():'Worked example review panels');
      pairs.forEach(function(pair){
        var button=pair.button,panel=pair.panel;
        button.type='button';
        button.id=button.id||'jrs-tab-'+panel.id;
        button.setAttribute('role','tab');
        button.setAttribute('aria-controls',panel.id);
        panel.setAttribute('role','tabpanel');
        panel.setAttribute('aria-labelledby',button.id);
        if(!panel.hasAttribute('tabindex'))panel.setAttribute('tabindex','0');
      });
      function sync(){
        pairs.forEach(function(pair){
          var selected=pair.button.classList.contains('active');
          pair.button.setAttribute('aria-selected',String(selected));
          pair.button.tabIndex=selected?0:-1;
          pair.panel.hidden=!selected;
        });
      }
      tabs.addEventListener('click',sync);
      tabs.addEventListener('keydown',function(event){
        var key=event.key;
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(key))return;
        var current=pairs.findIndex(function(pair){return pair.button===event.target;});
        if(current<0)return;
        event.preventDefault();
        var next=key==='Home'?0:key==='End'?pairs.length-1:
          (current+(key==='ArrowRight'?1:-1)+pairs.length)%pairs.length;
        pairs[next].button.focus();
        pairs[next].button.click();
      });
      tabs.setAttribute('data-jrs-tabs-enhanced','true');
      sync();
    });
  }
  function install(){
    enhanceScenarioTabs();
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
      if(!el.hasAttribute('role'))el.setAttribute('role','button');
      if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','0');
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
