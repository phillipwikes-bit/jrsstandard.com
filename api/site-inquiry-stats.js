import { ownerAccess } from './_owner-auth.js';
import { fetchAll } from './_sb-fetch.js';

export const config = { runtime: 'edge' };
const SB='https://pjzxkeviouofdseagvpf.supabase.co';
const CATEGORIES=['organization','research','training','commercial','general'];
const SOURCE='site-inquiry';

function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store',
    'X-Robots-Tag':'noindex, nofollow',
    'Referrer-Policy':'no-referrer'
  }});
}

// Owner-only aggregate. Every counted row must originate from the new
// explicitly scoped source. Neither names nor emails nor message text leave
// this endpoint. Historic enterprise and checkout records are not mixed in.
export default async function handler(req){
  if(req.method!=='GET')return json({error:'method_not_allowed'},405);
  const denied=await ownerAccess(req);
  if(denied)return denied;
  const E=(typeof process!=='undefined'&&process.env)||{};
  const service=E.SUPABASE_SERVICE_ROLE_KEY||'';
  if(!service)return json({error:'not_configured'},503);
  const result=await fetchAll(SB,
    'pilot_contacts?select=created_at,message&source=eq.site-inquiry&order=created_at.desc',
    {'apikey':service,'Authorization':'Bearer '+service});
  if(!result.complete)return json({error:'source_incomplete'},502);
  const now=Date.now(),cutoff=now-30*24*60*60*1000;
  const byCategory=Object.fromEntries(CATEGORIES.map(k=>[k,0]));
  let recent=0,unclassified=0,consented=0,malformed=0,last=null;
  const byMonth={};
  for(const r of result.rows){
    if(!r||typeof r!=='object'){malformed++;unclassified++;continue}
    const date=Date.parse(r.created_at||'');
    if(Number.isFinite(date)){
      if(date>=cutoff && date<=now)recent++;
      const month=new Date(date).toISOString().slice(0,7);
      byMonth[month]=(byMonth[month]||0)+1;
      if(!last||date>Date.parse(last))last=new Date(date).toISOString();
    }
    let m;
    try{m=JSON.parse(r.message||'{}');}
    catch{m=null;malformed++}
    const category=m&&typeof m.category==='string'?m.category:'';
    if(Object.hasOwn(byCategory,category))byCategory[category]++;
    else unclassified++;
    if(m&&m.consent_to_contact===true)consented++;
  }
  return json({
    source:SOURCE,
    total:result.rows.length,
    last_30_days:recent,
    by_category:byCategory,
    by_month:byMonth,
    unclassified_count:unclassified,
    malformed_payload_count:malformed,
    contact_consent_count:consented,
    latest_utc:last,
    basis:'Stored pilot_contacts rows with source=site-inquiry only. Historical enterprise, checkout, training and research records are excluded.'
  });
}
