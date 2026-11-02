"use strict";
(function(){
  var KEY="incomeos.spend.preferences.v1";
  var CATS=["software","internet","equipment","training","professional","supplies","travel","platform","homeoffice","investing","tax","advertising","other"];
  var state={version:1,budgets:{},plans:[]};
  var $=function(id){return document.getElementById(id);};
  function text(parent,tag,content,cls){var x=document.createElement(tag);if(cls)x.className=cls;x.textContent=String(content);parent.appendChild(x);return x;}
  var money=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
  function stamp(){var x=new Date();return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");}
  function load(){
    if(window.IncomeOSFinancialReadOnly===true)return;
    try{
      var x=JSON.parse(localStorage.getItem(KEY)||"{}");
      if(x&&typeof x==="object"&&!Array.isArray(x)){
        var b={};CATS.forEach(function(cat){var n=x.budgets&&x.budgets[cat];if(n!==""&&n!==null&&n!==undefined&&Number.isFinite(Number(n))&&Number(n)>=0&&Number(n)<=1000000)b[cat]=Number(n);});
        state.budgets=b;
        state.plans=Array.isArray(x.plans)?x.plans.filter(function(p){return p&&typeof p.name==="string"&&typeof p.nextDate==="string"&&Number(p.amount)>0&&["monthly","quarterly","annual"].includes(p.cadence);}).slice(0,100):[];
      }
    }catch(e){$("spend-status").textContent="Saved spending preferences are not readable. No previous settings were overwritten.";}
  }
  function save(){if(window.IncomeOSFinancialReadOnly===true){$("spend-status").textContent="Budget and bill tracking is disabled in staging until owner storage is protected.";return false;}try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(e){$("spend-status").textContent="Browser storage unavailable. Changes were not saved.";return false;}}
  function entries(){return window.IncomeOSAccountant&&typeof window.IncomeOSAccountant.entriesForAnalysis==="function"?window.IncomeOSAccountant.entriesForAnalysis():[];}
  function render(){
    if(!window.IncomeOSIntelligence)return;
    var data=window.IncomeOSIntelligence.analyze(entries(),state,stamp());
    $("spend-coverage").textContent=data.coverage.expenses+" expense entries analyzed from locally recorded/imported data. Account connections are not read by this page.";
    var root=$("spend-patterns");root.replaceChildren();
    if(!data.patterns.length)text(root,"p","No sufficiently repeated merchant patterns. This does not mean there are no subscriptions.","muted");
    data.patterns.slice(0,18).forEach(function(p){
      var x=text(root,"div",p.vendor+" · "+p.cadence,"accountant-line"); x.replaceChildren();
      var left=text(x,"span",p.vendor+" · "+p.cadence);
      var right=text(x,"strong",money.format(p.lastAmount)+" · next estimated "+p.nextEstimated+(p.stale?" · stale":"")+(p.spike?" · price change to review":""));
      right.title="Inferred from "+p.observations+" dates. No biller confirmation.";
    });
    var budget=$("spend-budget-results");budget.replaceChildren();
    if(!data.budgets.length)text(budget,"p","Set a monthly category target to compare with recorded spending.","muted");
    data.budgets.forEach(function(b){
      var item=text(budget,"div",b.category,"spend-row");item.replaceChildren();
      text(item,"span",b.category+" · "+money.format(b.actual)+" / "+money.format(b.target)+(b.over?" · over target":""));
      var bar=text(item,"div","","spend-bar");bar.setAttribute("role","img");bar.setAttribute("aria-label",b.category+" "+money.format(b.actual)+" recorded of "+money.format(b.target)+" target");
      var fill=text(bar,"i","");fill.style.width=(b.target===0?(b.actual>0?100:0):Math.min(100,b.actual/b.target*100))+"%";
    });
    var cash=$("spend-cashflow");cash.replaceChildren();
    data.cashflow.forEach(function(row){
      if(!row.receipts&&!row.expenses&&!row.fees)return;
      var x=text(cash,"div","","accountant-line");
      text(x,"span",row.month);
      text(x,"strong","Recorded income "+money.format(row.receipts)+" · expenses "+money.format(row.expenses));
    });
    if(!cash.childNodes.length)text(cash,"p","No recorded receipts or expenses in the last 12 months.","muted");
    var plans=$("spend-plans");plans.replaceChildren();
    if(!data.planned.length)text(plans,"p","No owner-entered upcoming bills.","muted");
    data.planned.slice(0,30).forEach(function(p){
      var x=text(plans,"div","","accountant-line");
      text(x,"span",p.name+" · "+p.nextDate+" · "+p.cadence);
      text(x,"strong",money.format(p.amount));
      var b=text(x,"button","Remove","textbtn");b.type="button";b.setAttribute("aria-label","Remove expected bill "+p.name);
      b.addEventListener("click",function(){
        if(!confirm("Remove this estimated bill from your local plan?"))return;
        state.plans=state.plans.filter(function(v){return v.id!==p.id;});save();render();
      });
    });
    var queue=$("spend-review");queue.replaceChildren();
    $("spend-review-count").textContent=data.reviewCount+" review flags";
    if(!data.reviewCount)text(queue,"p","No review flags on currently recorded expenses. Completeness is not established.","muted");
    data.reviewQueue.slice(0,20).forEach(function(x){
      var row=text(queue,"div","","spend-issue");
      text(row,"strong",x.vendor+" · "+x.date+" · "+money.format(x.amount));
      text(row,"p",x.flags.join("; "));
    });
    $("spend-status").textContent=(window.IncomeOSFinancialReadOnly===true?"Read-only staging. No personal spending preferences or bill plans may be saved. ":"")+"Updated from local records "+stamp()+". Inferred bills and price changes require invoice verification. No cancellation or payment was made.";
  }
  function initialize(){
    if(!$("spend-refresh")||!window.IncomeOSIntelligence)return;
    load();
    if(window.IncomeOSFinancialReadOnly===true){["spend-budget-form","spend-plan-form"].forEach(function(id){$(id).querySelectorAll("input,select,button").forEach(function(el){el.disabled=true;});});$("spend-budget-remove").disabled=true;}
    var category=$("spend-budget-category"),current=$("spend-budget-limit");
    CATS.forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;category.appendChild(o);});
    function fill(){current.value=Object.prototype.hasOwnProperty.call(state.budgets,category.value)?state.budgets[category.value]:"";}
    category.addEventListener("change",fill);fill();
    $("spend-budget-form").addEventListener("submit",function(e){
      e.preventDefault();var value=current.value.trim(),n=Number(value);
      if(value===""||!Number.isFinite(n)||n<0||n>1000000){$("spend-status").textContent="Enter a valid nonnegative monthly category limit.";return;}
      state.budgets[category.value]=n;if(save())render();
    });
    $("spend-budget-remove").addEventListener("click",function(){delete state.budgets[category.value];current.value="";if(save())render();});
    $("spend-plan-form").addEventListener("submit",function(e){
      e.preventDefault();var name=$("spend-plan-name").value.trim(),amount=Number($("spend-plan-amount").value),due=$("spend-plan-date").value,cadence=$("spend-plan-period").value;
      if(!name||name.length>80||!Number.isFinite(amount)||amount<=0||amount>1000000||!window.IncomeOSIntelligence.validDate(due)||!["monthly","quarterly","annual"].includes(cadence)){$("spend-status").textContent="Enter a valid name, amount, next date and cadence.";return;}
      state.plans.push({id:"p"+Date.now()+"-"+Math.random().toString(36).slice(2,9),name:name,amount:amount,nextDate:due,cadence:cadence});
      if(state.plans.length>100){state.plans.pop();$("spend-status").textContent="Local plan limit is 100 bills.";return;}
      if(save()){$("spend-plan-form").reset();render();}
    });
    $("spend-refresh").addEventListener("click",render);
    window.addEventListener("incomeos:ledger-updated",render);
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize);else initialize();
}());