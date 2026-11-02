"use strict";
(function(){
  function init(){
    var input=document.getElementById("project-import-file"),button=document.getElementById("project-import"),
      status=document.getElementById("project-status"),root=document.getElementById("project-results"),
      engine=window.IncomeOSProjectRadar;
    if(!input||!button||!status||!root||!engine)return;
    function line(parent,tag,text){var el=document.createElement(tag);el.textContent=text;parent.appendChild(el);return el;}
    button.addEventListener("click",async function(){
      root.replaceChildren();
      if(window.IncomeOSFinancialReadOnly===true){status.textContent="Import disabled until protected owner storage is approved.";return;}
      var file=input.files&&input.files[0];
      if(!file){status.textContent="Select a reviewed public JSON file.";return;}
      if(file.size>250000){status.textContent="File exceeds 250 KB limit.";return;}
      try{
        var doc=JSON.parse(await file.text()),items=Array.isArray(doc)?doc:doc&&doc.projects;
        if(!Array.isArray(items)||items.length===0||items.length>200)throw Error("Expected 1 to 200 project listings");
        var allowed=["id","title","platform","sourceUrl","applyUrl","reviewed","deadline","remote","eligibility","openingsVerified","paymentVerified","payUsd","workHours","screenHours","feesUsd","paymentModel","requiresUpfrontPayment","requestsCredentials"];
        if(items.some(function(x){return !x||typeof x!=="object"||Array.isArray(x)||Object.keys(x).some(function(k){return !allowed.includes(k);});}))throw Error("Unrecognized or private fields are prohibited");
        var d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
        var result=engine.digest(items,today,{remoteOnly:true,minHourlyUsd:25});
        result.results.forEach(function(row){
          var x=row.listing,a=row.assessment,card=document.createElement("article");card.className="radar-card";
          line(card,"strong",String(x.title||"Untitled project").slice(0,120));
          line(card,"p",String(x.platform||"Unknown platform").slice(0,100)+" · "+a.status+" · estimated effective hourly $"+(a.effectiveHourlyUsd===null?"unavailable":a.effectiveHourlyUsd.toFixed(2)));
          line(card,"p",a.problems.concat(a.warnings).join("; ")||"Review contract and eligibility independently");
          if(a.status!=="HOLD"&&typeof x.applyUrl==="string"&&x.applyUrl.startsWith("https://")){
            var link=line(card,"a","Open application");link.href=x.applyUrl;link.target="_blank";link.rel="noopener noreferrer";link.referrerPolicy="no-referrer";
          }
          root.appendChild(card);
        });
        status.textContent=result.results.length+" sourced project candidates screened locally. No live search, application, or earnings occurred.";
      }catch(err){status.textContent="Import rejected: "+err.message;}
      finally{input.value="";}
    });
    status.textContent="No live project feed connected. Import reviewed public listings to screen opportunities.";
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
