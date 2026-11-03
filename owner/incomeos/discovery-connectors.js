"use strict";
(function(root){
  // IncomeOS discovery connectors. Each connector reads ONE documented public
  // interface that the provider publishes for embedding job boards:
  //   greenhouse  https://boards-api.greenhouse.io/v1/boards/{token}/jobs (Job Board API, public GET)
  //   ashby       https://api.ashbyhq.com/posting-api/job-board/{name}    (Public Job Posting API)
  //   lever       https://api.lever.co/v0/postings/{site}?mode=json      (Postings API, public GET)
  //   usajobs     https://data.usajobs.gov/api/search                     (requires owner API key; disabled without it)
  //   manual      owner-imported, verifiable listings
  // No authentication bypass, scraping of logged-in pages, CAPTCHA handling or
  // rate-limit evasion. A failed connector reports status "error" with a
  // reason; it never reports success with an empty list.
  var CONNECTORS={
    greenhouse:{hosts:["boards-api.greenhouse.io"],applyHosts:["boards.greenhouse.io","job-boards.greenhouse.io"],sourceType:"primary_ats",
      url:function(s){return "https://boards-api.greenhouse.io/v1/boards/"+encodeURIComponent(s.token)+"/jobs?content=true&pay_transparency=true";},
      parse:function(body,s){
        if(!body||!Array.isArray(body.jobs))throw Error("UNEXPECTED_SCHEMA");
        return body.jobs.map(function(j){
          var pay=Array.isArray(j.pay_input_ranges)&&j.pay_input_ranges[0];
          return {postingId:j.id,title:j.title,employer:s.employer,platform:s.platform||s.employer,sourceUrl:j.absolute_url,applyUrl:j.absolute_url,
            locationText:j.location&&j.location.name,descriptionText:j.content,updatedAt:j.updated_at,publishedAt:j.first_published||null,
            compensation:pay&&Number.isFinite(pay.min_cents)?{min:pay.min_cents/100,max:Number.isFinite(pay.max_cents)?pay.max_cents/100:null,currency:pay.currency_type||"UNKNOWN",period:/hour/i.test(String(pay.title||pay.blurb||""))?"hour":"year",basis:"structured",sourceText:String(pay.title||"pay_input_ranges").slice(0,200)}:null};
        });
      }},
    ashby:{hosts:["api.ashbyhq.com"],applyHosts:["jobs.ashbyhq.com"],sourceType:"primary_ats",
      url:function(s){return "https://api.ashbyhq.com/posting-api/job-board/"+encodeURIComponent(s.token)+"?includeCompensation=true";},
      parse:function(body,s){
        if(!body||!Array.isArray(body.jobs))throw Error("UNEXPECTED_SCHEMA");
        return body.jobs.filter(function(j){return j.isListed!==false;}).map(function(j){
          var comp=j.compensation&&Array.isArray(j.compensation.summaryComponents)&&j.compensation.summaryComponents.filter(function(c){return c.compensationType==="Salary"||c.compensationType==="Hourly";})[0];
          var wp=String(j.workplaceType||"").toLowerCase();
          return {postingId:j.id||j.jobUrl,title:j.title,employer:s.employer,platform:s.platform||s.employer,sourceUrl:j.jobUrl,applyUrl:j.applyUrl||j.jobUrl,
            locationText:j.location,descriptionText:j.descriptionPlain||j.descriptionHtml,publishedAt:j.publishedAt,updatedAt:j.publishedAt,
            remoteMode:j.isRemote===true||wp==="remote"?"remote":wp==="hybrid"?"hybrid":wp==="onsite"?"onsite":undefined,employmentTypeText:j.employmentType,
            employmentClassification:/contract|temporary/i.test(String(j.employmentType))?"contractor":/parttime/i.test(String(j.employmentType))?"part_time_employee":/fulltime/i.test(String(j.employmentType))?"full_time_employee":null,
            compensation:comp&&Number.isFinite(comp.minValue)?{min:comp.minValue,max:Number.isFinite(comp.maxValue)?comp.maxValue:null,currency:comp.currencyCode||"UNKNOWN",period:/hour/i.test(String(comp.interval))?"hour":/year/i.test(String(comp.interval))?"year":"other",basis:"structured",sourceText:String(j.compensation.compensationTierSummary||"").slice(0,200)}:null};
        });
      }},
    lever:{hosts:["api.lever.co"],applyHosts:["jobs.lever.co"],sourceType:"primary_ats",
      url:function(s){return "https://api.lever.co/v0/postings/"+encodeURIComponent(s.token)+"?mode=json";},
      parse:function(body,s){
        if(!Array.isArray(body))throw Error("UNEXPECTED_SCHEMA");
        return body.map(function(j){
          var cat=j.categories||{},sal=j.salaryRange,wp=String(j.workplaceType||"").toLowerCase();
          var lists=Array.isArray(j.lists)?j.lists.map(function(l){return (l.text||"")+": "+(l.content||"");}).join(". "):"";
          return {postingId:j.id,title:j.text,employer:s.employer,platform:s.platform||s.employer,sourceUrl:j.hostedUrl,applyUrl:j.applyUrl||j.hostedUrl,
            locationText:cat.location,descriptionText:[j.descriptionPlain,lists,j.additionalPlain].filter(Boolean).join(". "),
            publishedAt:j.createdAt,updatedAt:j.createdAt,remoteMode:wp==="remote"?"remote":wp==="hybrid"?"hybrid":wp==="onsite"?"onsite":undefined,employmentTypeText:cat.commitment,
            compensation:sal&&Number.isFinite(sal.min)?{min:sal.min,max:Number.isFinite(sal.max)?sal.max:null,currency:sal.currency||"UNKNOWN",period:/hour/i.test(String(sal.interval))?"hour":/year/i.test(String(sal.interval))?"year":"other",basis:"structured",sourceText:String(sal.interval||"salaryRange")}:null};
        });
      }},
    usajobs:{hosts:["data.usajobs.gov"],applyHosts:["www.usajobs.gov","usajobs.gov"],sourceType:"official_api",requiresCredentials:true,
      url:function(s){var q=new URLSearchParams({Keyword:s.keyword||"",RemoteIndicator:"True",ResultsPerPage:String(Math.min(Number(s.resultsPerPage)||100,250))});return "https://data.usajobs.gov/api/search?"+q.toString();},
      parse:function(body,s){
        var items=body&&body.SearchResult&&body.SearchResult.SearchResultItems;
        if(!Array.isArray(items))throw Error("UNEXPECTED_SCHEMA");
        return items.map(function(it){
          var d=it.MatchedObjectDescriptor||{},rem=Array.isArray(d.PositionRemuneration)&&d.PositionRemuneration[0],det=d.UserArea&&d.UserArea.Details||{};
          return {postingId:it.MatchedObjectId||d.PositionID,title:d.PositionTitle,employer:d.OrganizationName||d.DepartmentName,platform:"USAJOBS",
            sourceUrl:d.PositionURI,applyUrl:Array.isArray(d.ApplyURI)?d.ApplyURI[0]:d.PositionURI,locationText:d.PositionLocationDisplay,
            descriptionText:[d.QualificationSummary,det.MajorDuties&&[].concat(det.MajorDuties).join(" "),det.Requirements,det.Education,det.WhoMayApply&&det.WhoMayApply.Name].filter(Boolean).join(". "),
            publishedAt:d.PublicationStartDate,updatedAt:d.PublicationStartDate,deadline:d.ApplicationCloseDate,remoteMode:"remote",
            compensation:rem&&Number(rem.MinimumRange)>0?{min:Number(rem.MinimumRange),max:Number(rem.MaximumRange)||null,currency:"USD",period:/PH/i.test(rem.RateIntervalCode)?"hour":/PA/i.test(rem.RateIntervalCode)?"year":"other",basis:"structured",sourceText:"USAJOBS PositionRemuneration "+rem.RateIntervalCode}:null};
        });
      }}
  };

  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
  // fetchJson(url, {headers, timeoutMs}) -> {status, json, bytes}
  async function runSource(source,deps){
    var started=new Date().toISOString(),c=CONNECTORS[source.connector];
    var receipt={sourceId:source.id,connector:source.connector,employer:source.employer,mode:"live",status:"error",httpStatus:null,attempts:0,startedAt:started,finishedAt:null,listingCount:0,error:null};
    if(source.enabled===false){receipt.mode="disabled";receipt.status="disabled";receipt.error="DISABLED_IN_REGISTRY";receipt.finishedAt=new Date().toISOString();return {receipt:receipt,listings:[]};}
    if(!c){receipt.error="UNKNOWN_CONNECTOR";receipt.finishedAt=new Date().toISOString();return {receipt:receipt,listings:[]};}
    var headers={"Accept":"application/json","User-Agent":"IncomeOS-discovery/1.0 (owner research tool)"};
    if(c.requiresCredentials){
      var cred=deps.credentials&&deps.credentials[source.connector];
      if(!cred||!cred.apiKey||!cred.userAgent){receipt.mode="disabled";receipt.status="disabled";receipt.error="CREDENTIALS_NOT_CONFIGURED";receipt.finishedAt=new Date().toISOString();return {receipt:receipt,listings:[]};}
      headers["Authorization-Key"]=cred.apiKey;headers["User-Agent"]=cred.userAgent;
    }
    var url=c.url(source),maxAttempts=deps.maxAttempts||3,backoff=deps.backoffMs||2000;
    try{var h=new URL(url).hostname;if(c.hosts.indexOf(h)<0)throw Error("HOST_NOT_ALLOWED");}catch(e){receipt.error="HOST_NOT_ALLOWED";receipt.finishedAt=new Date().toISOString();return {receipt:receipt,listings:[]};}
    for(var attempt=1;attempt<=maxAttempts;attempt++){
      receipt.attempts=attempt;
      try{
        var res=await deps.fetchJson(url,{headers:headers,timeoutMs:deps.timeoutMs||20000});
        receipt.httpStatus=res.status;
        if(res.status===429||res.status>=500){receipt.error="HTTP_"+res.status;if(attempt<maxAttempts){await (deps.sleep||sleep)(backoff*Math.pow(2,attempt-1));continue;}break;}
        if(res.status!==200){receipt.error=res.status===404?"BOARD_NOT_FOUND":"HTTP_"+res.status;break;}
        var parsed=c.parse(res.json,source).slice(0,deps.maxListingsPerSource||1000);
        receipt.status="ok";receipt.error=null;receipt.listingCount=parsed.length;receipt.bytes=res.bytes||null;
        receipt.finishedAt=new Date().toISOString();
        return {receipt:receipt,listings:parsed};
      }catch(e){
        receipt.error=String(e&&e.message||e).replace(/[^A-Za-z0-9_ :.-]/g,"").slice(0,120)||"FETCH_FAILED";
        if(receipt.error==="UNEXPECTED_SCHEMA")break;
        if(attempt<maxAttempts)await (deps.sleep||sleep)(backoff*Math.pow(2,attempt-1));
      }
    }
    receipt.status="error";receipt.finishedAt=new Date().toISOString();
    return {receipt:receipt,listings:[]};
  }

  // Run every registry source sequentially with a per-host minimum interval.
  async function discover(registry,deps){
    var Opp=deps.normalizer,results=[],records=[],lastHit={};
    var minGap=deps.minIntervalMs==null?1500:deps.minIntervalMs;
    for(var i=0;i<registry.sources.length;i++){
      var s=registry.sources[i],c=CONNECTORS[s.connector];
      var h=c&&c.hosts[0];
      if(h&&lastHit[h]){var wait=minGap-(Date.now()-lastHit[h]);if(wait>0)await (deps.sleep||sleep)(wait);}
      var out=await runSource(s,deps);
      if(h)lastHit[h]=Date.now();
      results.push(out.receipt);
      if(out.receipt.status==="ok"){
        var src={connector:s.connector,sourceId:s.id,sourceType:c.sourceType,allowedHosts:c.applyHosts.concat(Array.isArray(s.employerDomains)?s.employerDomains:[]),reliability:s.reliability||"primary_public_board",mode:"live"};
        out.listings.forEach(function(l){records.push(Opp.normalize(l,src,out.receipt.finishedAt));});
      }
    }
    var ok=results.filter(function(r){return r.status==="ok";}).length,failed=results.filter(function(r){return r.status==="error";}).length;
    return {records:records,connectors:results,summary:{sources:results.length,ok:ok,failed:failed,disabled:results.length-ok-failed,
      degraded:failed>0,allFailed:ok===0&&failed>0}};
  }
  var api=Object.freeze({CONNECTORS:Object.keys(CONNECTORS),meta:function(n){var c=CONNECTORS[n];return c?{hosts:c.hosts.slice(),applyHosts:c.applyHosts.slice(),sourceType:c.sourceType,requiresCredentials:!!c.requiresCredentials}:null;},
    parse:function(n,body,s){return CONNECTORS[n].parse(body,s);},runSource:runSource,discover:discover});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSDiscovery=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
