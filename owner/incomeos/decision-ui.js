"use strict";
(function () {
  function $(id) { return document.getElementById(id); }
  function today() {
    var d = new Date();
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
  }
  function label(parent,tag,content) { var el=document.createElement(tag);el.textContent=content;parent.appendChild(el);return el; }
  var form=$("decision-review-form"), select=$("decision-asset"), output=$("decision-review-result");
  if(!form||!select||!output||!window.IncomeOSDecisionEngine)return;
  var assets=[];
  function renderReview(event) {
    if(event)event.preventDefault();
    var asset=assets.find(function(v){return v.id===select.value;});
    var names=["specificOffer","eligibility","counterparty","cashflow","fees","liquidity","reserve","ownerDecision"];
    var checks={proposedCapital:$("decision-amount").value,confirmedCapacity:$("decision-capacity").value};
    names.forEach(function(name){var c=form.elements.namedItem(name);checks[name]=!!(c&&c.checked);});
    var result=window.IncomeOSDecisionEngine.review(asset,checks,{today:today(),maxAgeDays:7});
    output.replaceChildren();
    label(output,"strong",result.status==="HOLD"?"HOLD: not ready for investment":"Evidence checklist complete; manual decision only");
    label(output,"p",result.disclaimer);
    if(result.reasons.length){var ul=document.createElement("ul");result.reasons.forEach(function(s){label(ul,"li",s);});output.appendChild(ul);}
    var source=asset&&asset.sourceUrl;
    if(source){var a=label(output,"a","View public source");a.href=source;a.rel="noopener noreferrer";a.referrerPolicy="no-referrer";a.target="_blank";}
    output.hidden=false;
  }
  fetch("./opportunities.json",{cache:"no-store",credentials:"same-origin"}).then(function(response){
    if(!response.ok)throw new Error("Feed unavailable");
    return response.json();
  }).then(function(feed){
    assets=Array.isArray(feed.assets)?feed.assets.filter(function(a){return a&&typeof a.id==="string"&&a.title;}):[];
    select.replaceChildren();
    assets.forEach(function(item){var option=document.createElement("option");option.value=item.id;option.textContent=item.title;select.appendChild(option);});
    if(!assets.length)throw new Error("No reviewable asset records");
    renderReview();
  }).catch(function(){output.hidden=false;output.textContent="The dated opportunity feed is unavailable. No investment review may proceed.";});
  form.addEventListener("submit",renderReview);
  select.addEventListener("change",function(){form.reset();renderReview();});
  var scenario=$("net-scenario-form");
  if(scenario)scenario.addEventListener("submit",function(event){
    event.preventDefault();
    var result=$("net-scenario-result");
    var params={initial:$("net-initial").value,monthly:$("net-monthly").value,years:$("net-years").value,annualReturnPct:$("net-return").value,annualFeePct:$("net-fees").value,taxDragPct:$("net-tax").value,inflationPct:$("net-inflation").value};
    try{
      var data=window.IncomeOSDecisionEngine.scenario(params);
      var usd=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
      result.textContent="Illustrative nominal value: "+usd.format(data.nominal)+"; in today's dollars: "+usd.format(data.realTodayDollars)+"; contributions: "+usd.format(data.contributions)+"; change after assumed fees and tax drag: "+usd.format(data.change)+". No investment executed.";
    }catch(e){result.textContent=e.message;}
    result.hidden=false;
  });
}());