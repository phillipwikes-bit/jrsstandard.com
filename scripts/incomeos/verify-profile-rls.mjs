#!/usr/bin/env node
// Verifies the IncomeOS application-profile access rules against the REAL private
// Supabase project. Run only after OWNER-PRIVATE-SCHEMA.sql and OWNER-PROFILE-SCHEMA.sql
// are applied, the owner is enrolled and sign-ups are disabled.
// Credentials come from the environment, never from the command line or chat:
//   INCOMEOS_SUPABASE_URL, INCOMEOS_SUPABASE_PUBLISHABLE_KEY,
//   INCOMEOS_OWNER_TOKEN (owner access token), INCOMEOS_OTHER_TOKEN (a second, non-enrolled user)
// It writes and then deletes one synthetic test row in the owner's profile.
const env=k=>{const v=process.env[k];if(!v){console.error("Missing "+k);process.exit(2);}return v;};
const base=env("INCOMEOS_SUPABASE_URL").replace(/\/+$/,""),key=env("INCOMEOS_SUPABASE_PUBLISHABLE_KEY"),owner=env("INCOMEOS_OWNER_TOKEN"),other=env("INCOMEOS_OTHER_TOKEN");
const T="/rest/v1/application_profile";const P={"Accept-Profile":"incomeos_private","Content-Profile":"incomeos_private"};
async function req(method,path,token,body,extra={}){const h={apikey:key,"Content-Type":"application/json",...P,...extra};if(token)h.Authorization="Bearer "+token;
  const r=await fetch(base+path,{method,headers:h,body:body?JSON.stringify(body):undefined});const t=await r.text();let j=null;try{j=JSON.parse(t);}catch{}return {status:r.status,json:j};}
function uid(t){return JSON.parse(Buffer.from(t.split(".")[1],"base64url").toString()).sub;}
const results=[];function check(name,ok,detail){results.push({name,ok});console.log((ok?"PASS ":"FAIL ")+name+(detail?" ("+detail+")":""));}
const row={owner_id:uid(owner),full_name:"RLS VERIFICATION ROW",application_email:"verify@example.org",qualifications:["synthetic"],linkedin_url:null};
let r=await req("GET",T+"?select=owner_id",null);check("1a anonymous cannot read",r.status>=400||(Array.isArray(r.json)&&r.json.length===0),"HTTP "+r.status);
r=await req("POST",T,null,row);check("1b anonymous cannot write",r.status>=400,"HTTP "+r.status);
r=await req("POST",T+"?on_conflict=owner_id",owner,row,{Prefer:"resolution=merge-duplicates,return=representation"});check("3a owner can save",r.status>=200&&r.status<300&&Array.isArray(r.json)&&r.json.length===1,"HTTP "+r.status);
r=await req("GET",T+"?select=owner_id",other);check("2a other user cannot read owner row",Array.isArray(r.json)&&r.json.length===0,"HTTP "+r.status);
r=await req("POST",T,other,{...row,owner_id:uid(other)});check("2b other user cannot create a row",r.status>=400,"HTTP "+r.status);
r=await req("PATCH",T+"?owner_id=eq."+row.owner_id,other,{full_name:"tampered"},{Prefer:"return=representation"});check("2c other user cannot modify owner row",r.status>=400||(Array.isArray(r.json)&&r.json.length===0),"HTTP "+r.status);
r=await req("GET",T+"?select=full_name",owner);check("3b owner reads own row unchanged",Array.isArray(r.json)&&r.json[0]&&r.json[0].full_name==="RLS VERIFICATION ROW");
r=await req("DELETE",T+"?owner_id=eq."+row.owner_id,owner,null,{Prefer:"return=representation"});
const after=await req("GET",T+"?select=owner_id",owner);check("6 delete removes the row",Array.isArray(after.json)&&after.json.length===0);
const failed=results.filter(x=>!x.ok).length;console.log(failed?failed+" check(s) FAILED: do not enable the secure profile.":"All checks passed. Items 4 and 5 (no exposure in logs/analytics/exports; enforcement after refresh) still need the manual checks in the release notes.");
process.exit(failed?1:0);
