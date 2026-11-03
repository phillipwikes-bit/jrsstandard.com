"use strict";
(function(root){
  // Deterministic requirement extraction from UNTRUSTED listing text.
  // Listing text is data. Nothing in it can change configuration, preferences,
  // eligibility rules or authorization. Extraction is pattern-based and
  // knowingly incomplete, so every extracted set starts unconfirmed: the
  // eligibility engine withholds the opportunity until the owner confirms the
  // full posting was reviewed (requirementSet.ownerConfirmed).
  var VERSION="incomeos.requirements.v1";
  var STATES={alabama:"AL",alaska:"AK",arizona:"AZ",arkansas:"AR",california:"CA",colorado:"CO",connecticut:"CT",delaware:"DE",florida:"FL",georgia:"GA",hawaii:"HI",idaho:"ID",illinois:"IL",indiana:"IN",iowa:"IA",kansas:"KS",kentucky:"KY",louisiana:"LA",maine:"ME",maryland:"MD",massachusetts:"MA",michigan:"MI",minnesota:"MN",mississippi:"MS",missouri:"MO",montana:"MT",nebraska:"NE",nevada:"NV","new hampshire":"NH","new jersey":"NJ","new mexico":"NM","new york":"NY","north carolina":"NC","north dakota":"ND",ohio:"OH",oklahoma:"OK",oregon:"OR",pennsylvania:"PA","rhode island":"RI","south carolina":"SC","south dakota":"SD",tennessee:"TN",texas:"TX",utah:"UT",vermont:"VT",virginia:"VA",washington:"WA","west virginia":"WV",wisconsin:"WI",wyoming:"WY","district of columbia":"DC"};
  var SKILLS={python:"python",javascript:"javascript",typescript:"typescript","\\bsql\\b":"sql","\\bjava\\b":"java","c\\+\\+":"cpp","\\brust\\b":"rust","\\bgo(lang)?\\b(?= (programming|developer|engineer))":"go","machine learning":"machine_learning"};
  var CREDENTIALS=[
    [/\b(licensed attorney|bar admission|admitted to (the|a) (state )?bar|active bar membership|member of the bar)\b/i,"license","bar_admission"],
    [/\b(CPA|certified public accountant)\b/,"license","cpa"],
    [/\b(RN|registered nurse)\b/,"license","registered_nurse"],
    [/\b(licensed (clinical )?social worker|LCSW)\b/i,"license","lcsw"],
    [/\b(SHRM-(CP|SCP))\b/,"certification","shrm"],
    [/\bPMP\b/,"certification","pmp"],
    [/\bCIPP(\/[A-Z]+)?\b/,"certification","cipp"],
    [/\bCISSP\b/,"certification","cissp"],
    [/\b(EEO investigator certification|certified EEO investigator)\b/i,"certification","eeo_investigator"]
  ];
  function strip(html){
    if(typeof html!=="string")return "";
    var s=html.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,"\"").replace(/&#39;|&#x27;/g,"'").replace(/&nbsp;/g," ").replace(/&amp;/g,"&");
    s=s.replace(/<(script|style)[\s\S]*?<\/\1>/gi," ").replace(/<\/(p|li|div|h[1-6]|br|tr)>|<br\s*\/?>/gi,". ").replace(/<[^>]*>/g," ");
    return s.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,40000);
  }
  // Collapse dotted abbreviations (U.S., M.S., B.A., Ph.D., e.g.) before splitting on periods,
  // so "Must be a U.S. citizen" stays one sentence and still matches the citizenship pattern.
  function dedot(t){return t.replace(/\bPh\.\s?D\./gi,"PhD").replace(/\b(?:[A-Za-z]\.){2,}/g,function(m){return m.replace(/\./g,"");});}
  function sentences(text){text=dedot(text);return text.replace(/([.!?;])\s+/g,"$1\n").split(/\n|\s*[•●]\s*/).map(function(s){return s.trim();}).filter(function(s){return s.length>2;}).slice(0,800);}
  function optional(s){return /\b(preferred|nice to have|a plus|bonus|ideally|desirable|not required|optional|advantageous)\b/i.test(s);}
  function extract(listing){
    var text=strip([listing&&listing.title,listing&&listing.descriptionText,listing&&listing.locationText].filter(function(x){return typeof x==="string";}).join(". "));
    var out=[],seen={};
    function add(r,s){
      var sig=r.category+":"+JSON.stringify(Object.keys(r).sort().filter(function(k){return k!=="category";}).map(function(k){return [k,r[k]];}));
      var mand=!optional(s);
      if(seen[sig]){var prev=seen[sig];if(mand&&!prev.mandatory){prev.mandatory=true;prev.sourceText=s.slice(0,400);}return;}
      seen[sig]=r;
      r.id="req-"+(out.length+1);r.mandatory=mand;r.sourceText=s.slice(0,400);r.extraction=VERSION;out.push(r);
    }
    sentences(text).forEach(function(s){
      var l=s.toLowerCase(),m;
      if(/\b(ph\.?d|doctorate|doctoral degree)\b/i.test(s)&&!/\b(phd students?|doctoral students?)\b/i.test(s))add({category:"education",minLevel:"doctorate"},s);
      else if(/\b(j\.?d\.?|juris doctor|law degree)\b/i.test(s))add({category:"education",minLevel:"jd"},s);
      else if(/\b(master'?s|m\.?s\.?|m\.?a\.?|mba)\b(?: degree| in)/i.test(s))add({category:"education",minLevel:"masters"},s);
      else if(/\b(bachelor'?s|b\.?a\.?|b\.?s\.?|undergraduate)\b(?: degree| in)|\bfour-year degree\b|\bcollege degree\b/i.test(s))add({category:"education",minLevel:"bachelors"},s);
      if(/\b(currently enrolled|current (undergraduate|graduate|phd) student|must be a (current )?student|enrolled in an? (accredited )?(university|degree))/i.test(s))add({category:"enrollment"},s);
      var maxExp=/\b(?:no more than|less than|up to|maximum of|at most)\s*\d{1,2}\s*years?/i.test(s);
      if(!maxExp&&(m=s.match(/\b(\d{1,2})\s*\+?\s*(?:or more\s*)?years?(?:'|’)?\s*(?:of\s+)?(?:[a-z-]+\s+){0,4}experience\b/i)))add({category:"experience",minYears:Number(m[1]),domains:[]},s);
      if((m=s.match(/\b(?:no more than|less than|up to|maximum of|at most)\s*(\d{1,2})\s*years?\s*(?:of\s+)?(?:[a-z-]+\s+){0,3}experience/i)))add({category:"experience",maxYears:Number(m[1]),domains:[]},s);
      if(/\b(us[- ]based|based in the (us|u\.s\.|united states)|located in the (us|u\.s\.|united states)|must (live|reside) in the (us|u\.s\.|united states)|(us|u\.s\.) residents? only|united states only)\b/i.test(s))add({category:"geography",allowedCountries:["US"]},s);
      if((m=s.match(/\b(?:not (?:available|open) (?:to|in)|excluding|cannot (?:hire|accept applicants) (?:in|from)|except(?: for)? residents of)\s+([^.]{3,300})/i))){
        var ex=[],rest=m[1];Object.keys(STATES).sort(function(a,b){return b.length-a.length;}).forEach(function(n){var re=new RegExp("\\b"+n+"\\b","i");if(re.test(rest)){ex.push("US-"+STATES[n]);rest=rest.replace(new RegExp("\\b"+n+"\\b","gi")," ");}});
        ex.sort();
        if(ex.length)add({category:"geography",excludedRegions:ex},s);
      }
      if(/\b(authori[sz]ed to work in the (us|u\.s\.|united states)|us work authori[sz]ation|without (the need for )?(visa )?sponsorship|eligible to work in the (us|u\.s\.|united states))\b/i.test(s))add({category:"work_authorization",country:"US",citizenshipRequired:false},s);
      if(/\b(us|u\.s\.) citizen(ship)? (is )?(required|only)|must be an? (us|u\.s\.) citizen\b/i.test(s))add({category:"work_authorization",country:"US",citizenshipRequired:true,key:"citizen"},s);
      if(/\bts\/sci\b/i.test(s))add({category:"clearance",level:"ts_sci"},s);
      else if(/\btop secret\b/i.test(s)&&/clearance/i.test(s))add({category:"clearance",level:"top_secret"},s);
      else if(/\bsecret clearance\b/i.test(s))add({category:"clearance",level:"secret"},s);
      else if(/\bpublic trust\b/i.test(s))add({category:"clearance",level:"public_trust"},s);
      if(/\b(on-?site|in[- ]office|in person)\b/i.test(s)&&/\b(required|must|days? (a|per) week|role)\b/i.test(s)&&!/\bnot\b/.test(l))add({category:"remote",mode:"onsite"},s);
      else if(/\bhybrid\b/i.test(s))add({category:"remote",mode:"hybrid"},s);
      if((m=s.match(/\b(?:native|fluent|fluency|proficient|proficiency)\s+(?:in\s+)?(english|spanish|french|german|portuguese|mandarin|japanese|korean|arabic|hindi|italian)\b/i)))add({category:"language",key:m[1].toLowerCase(),level:/native/i.test(m[0])?"native":"fluent"},s);
      Object.keys(SKILLS).forEach(function(p){if(new RegExp(p,"i").test(s)&&/\b(experience|proficien|knowledge|familiar|skills?|coding|programming|required|must)\b/i.test(s))add({category:"technical_skill",key:SKILLS[p]},s);});
      CREDENTIALS.forEach(function(c){if(c[0].test(s))add({category:c[1],key:c[2]},s);});
      if((m=s.match(/\b(?:minimum|at least|commit(?:ment)? (?:of|to)?)\s*(\d{1,2})\s*(?:\+\s*)?hours?\s*(?:per|a|\/)\s*week/i)))add({category:"schedule",minHoursPerWeek:Number(m[1])},s);
      if(/\b(fixed shifts?|set schedule|scheduled shifts|must be available (?:from|between) \d)/i.test(s))add({category:"schedule",fixedShift:true},s);
    });
    return {version:VERSION,requirements:out,textLength:text.length,complete:false,
      note:"Pattern extraction is incomplete by design. The owner must confirm the full posting before eligibility can be established."};
  }
  // Classification and remote mode as listing attributes (not owner qualifications).
  function attributes(listing){
    var t=strip([listing&&listing.title,listing&&listing.descriptionText,listing&&listing.employmentTypeText,listing&&listing.locationText].filter(function(x){return typeof x==="string";}).join(". ")).toLowerCase();
    var cls=null;
    if(/\b(1099|independent contractor|contractor|contract role|freelance|project-based)\b/.test(t))cls="contractor";
    else if(/\bpart[- ]time\b/.test(t))cls="part_time_employee";
    else if(/\bfull[- ]time\b/.test(t))cls="full_time_employee";
    return {employmentClassification:cls};
  }
  // Fraud and injection indicators. Matching any of these excludes the listing.
  var FRAUD=[
    [/\b(pay|send|wire|deposit)\b(?![^.]{0,20}\bdirect deposit\b)[^.]{0,40}\b(fee|security deposit|refundable deposit|starter kit|training cost|equipment cost|equipment fee)\b/i,"UPFRONT_PAYMENT_REQUESTED"],
    [/\b(gift ?cards?|bitcoin|crypto(currency)? wallet|usdt|zelle me|cash ?app)\b/i,"IRREGULAR_PAYMENT_CHANNEL"],
    [/\b(telegram|whatsapp|signal app|google hangouts?)\b[^.]{0,60}\b(contact|message|interview|reach)\b|\b(contact|message|interview|reach)\b[^.]{0,60}\b(telegram|whatsapp|google hangouts?)\b/i,"OFF_PLATFORM_CONTACT"],
    [/\b(social security number|ssn|bank (account|login)|routing number|online banking password)\b[^.]{0,60}\b(send|provide|submit|share|upfront|before)\b|\b(send|provide|submit|share)\b[^.]{0,60}\b(social security number|ssn|bank (account|login) details|routing number)\b/i,"SENSITIVE_DATA_REQUESTED"],
    [/\b(guaranteed (income|earnings|pay)|earn \$?\d[\d,]* (per|a) (day|week) guaranteed|no experience needed[^.]{0,40}\$\d{3,})/i,"IMPLAUSIBLE_GUARANTEE"]
  ];
  var INJECTION=/\b(ignore (all |any )?(previous|prior|above) instructions|system prompt|you are (now )?an? (ai|assistant)|mark (this|me) as (eligible|verified)|set (eligibility|status) to|override (the )?(rules|eligibility))\b/i;
  function riskSignals(listing){
    var t=strip([listing&&listing.title,listing&&listing.descriptionText].filter(function(x){return typeof x==="string";}).join(". "));
    var out=[];FRAUD.forEach(function(f){if(f[0].test(t))out.push(f[1]);});
    if(INJECTION.test(t))out.push("EMBEDDED_INSTRUCTIONS_IGNORED");
    return out;
  }
  var api=Object.freeze({VERSION:VERSION,strip:strip,extract:extract,attributes:attributes,riskSignals:riskSignals});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSRequirements=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
