/* JRS public resource directory.
   Search and filters run entirely in this browser. No query or category selection
   is sent to a server, analytics endpoint or third party by this script.
   All directory links remain visible when JavaScript is unavailable. */
(function(){
  function initialize(){
    var form=document.getElementById('jrs-resource-search');
    var grid=document.getElementById('jrs-resource-results');
    var query=document.getElementById('jrs-resource-query');
    var role=document.getElementById('jrs-resource-role');
    var format=document.getElementById('jrs-resource-format');
    var clear=document.getElementById('jrs-resource-reset');
    var count=document.getElementById('jrs-resource-count');
    var empty=document.getElementById('jrs-resource-empty');
    if(!form||!grid||!query||!role||!format||!clear||!count||!empty)return;

    var entries=Array.from(grid.querySelectorAll('.jrs-resource-entry')).map(function(node){
      return {
        node:node,
        text:normalize(node.textContent+' '+(node.dataset.keywords||'')),
        roles:(node.dataset.roles||'').split(/\s+/),
        format:node.dataset.format||''
      };
    });
    function normalize(value){
      return String(value||'').toLocaleLowerCase().normalize('NFKD')
        .replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
    }
    function update(){
      var terms=normalize(query.value).split(' ').filter(Boolean);
      var chosenRole=role.value,chosenFormat=format.value;
      var shown=0;
      entries.forEach(function(item){
        var found=terms.every(function(term){return item.text.includes(term);});
        var inRole=chosenRole==='all'||item.roles.includes(chosenRole);
        var inFormat=chosenFormat==='all'||item.format===chosenFormat;
        var visible=found&&inRole&&inFormat;
        item.node.hidden=!visible;
        if(visible)shown++;
      });
      count.textContent=shown+' of '+entries.length+' resources shown.';
      empty.hidden=shown!==0;
    }
    // Progressive enhancement only after listeners and data are initialized.
    form.addEventListener('submit',function(event){event.preventDefault();update();});
    query.addEventListener('input',update);
    role.addEventListener('change',update);
    format.addEventListener('change',update);
    clear.addEventListener('click',function(){
      query.value='';
      role.value='all';
      format.value='all';
      update();
      query.focus();
    });
    form.hidden=false;
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);
  else initialize();
})();
