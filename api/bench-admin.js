export const config = { runtime: 'edge' };

// JRS Benchmark Workspace — admin operations (record bank, gold key, AI scoring).
// Auth: ?token=  must equal BENCH_ADMIN_TOKEN or RUN_TOKEN (reuse the one you already set).
// Writes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS). Reuses ANTHROPIC_API_KEY for scoring.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';
const MODEL = 'claude-haiku-4-5-20251001';
const KEYS = ['basis_identification','reasoning_traceability','cold_reviewer_clarity','accountability_support','temporal_reconstructability'];

const SYSTEM_PROMPT = `You are the JRS Review Engine. Examine one organizational record against five documentation review conditions:
1. basis_identification — Does the record identify the basis for its conclusions?
2. reasoning_traceability — Can a later reviewer trace reasoning from evidence to conclusion?
3. cold_reviewer_clarity — Would a reviewer with no prior knowledge understand what occurred from the record alone?
4. accountability_support — Are the decision-makers and reviewers identifiable?
5. temporal_reconstructability — Does it hold up read cold, years later (dates, sequence, sources)?
For each, assign exactly "pass", "review", or "gap". Respond with STRICT JSON only:
{"conditions":{"basis_identification":"pass|review|gap","reasoning_traceability":"...","cold_reviewer_clarity":"...","accountability_support":"...","temporal_reconstructability":"..."}}`;

function json(o, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' } }); }
function norm(s){ s=String(s||'').toLowerCase(); return s==='pass'||s==='review'||s==='gap'?s:'review'; }
function determination(c){ var v=KEYS.map(function(k){return c[k];}); if(v.indexOf('gap')!==-1)return 'gap_identified'; if(v.indexOf('review')!==-1)return 'review_required'; return 'ready'; }

async function scoreOne(text, key){
  const res = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:400,system:SYSTEM_PROMPT,messages:[{role:'user',content:'Examine this record:\n\n'+text}]})});
  const j = await res.json();
  const raw = (j&&j.content&&j.content[0]&&j.content[0].text)||'';
  const m = raw.match(/\{[\s\S]*\}/); if(!m) throw new Error('parse');
  const p = JSON.parse(m[0]); const c={};
  KEYS.forEach(function(k){ c[k]=norm((p.conditions||{})[k]); });
  return { conditions:c, determination:determination(c) };
}

export default async function handler(req){
  if (req.method==='OPTIONS') return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
  if (req.method!=='POST') return json({error:'method_not_allowed'},405);
  const env = (typeof process!=='undefined'&&process.env)||{};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY||'';
  const ANTHROPIC = env.ANTHROPIC_API_KEY||'';
  const ADMIN = env.BENCH_ADMIN_TOKEN||'';
  const RUN_TOKEN = env.RUN_TOKEN||'';
  if (!SERVICE) return json({error:'SUPABASE_SERVICE_ROLE_KEY not set'},503);

  var body; try{ body=await req.json(); }catch(e){ return json({error:'invalid_json'},400); }
  var token=(body&&body.token)||'';
  if (!((ADMIN&&token===ADMIN)||(RUN_TOKEN&&token===RUN_TOKEN))) return json({error:'unauthorized'},401);

  var H={'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,'Content-Type':'application/json','Prefer':'return=minimal'};
  var action=(body&&body.action)||'';

  try {
    if (action==='list'){
      var lr=await fetch(SB+'/rest/v1/bench_records?select=id,text,record_type,ai_function,kind,active,created_at&order=created_at.desc',{headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE}});
      var all=await lr.json();
      return json({ok:true, records:Array.isArray(all)?all:[]});
    }
    if (action==='add_record'){
      await fetch(SB+'/rest/v1/bench_records',{method:'POST',headers:H,body:JSON.stringify({text:String(body.text||'').slice(0,8000),record_type:body.record_type||null,ai_function:body.ai_function||null,kind:body.kind||'constructed',active:body.active!==false})});
      return json({ok:true});
    }
    if (action==='activate'){
      await fetch(SB+'/rest/v1/bench_records?id=eq.'+encodeURIComponent(body.record_id),{method:'PATCH',headers:H,body:JSON.stringify({active:!!body.active})});
      return json({ok:true});
    }
    if (action==='set_gold'){
      var c={}; KEYS.forEach(function(k){ c[k]=norm((body.conditions||{})[k]); });
      var det=body.determination||determination(c);
      // upsert by record_id (unique)
      await fetch(SB+'/rest/v1/bench_gold?record_id=eq.'+encodeURIComponent(body.record_id),{method:'DELETE',headers:H});
      await fetch(SB+'/rest/v1/bench_gold',{method:'POST',headers:H,body:JSON.stringify({record_id:body.record_id,conditions:c,determination:det})});
      return json({ok:true});
    }
    if (action==='score_all'){
      if (!ANTHROPIC) return json({error:'ANTHROPIC_API_KEY not set'},503);
      var rr=await fetch(SB+'/rest/v1/bench_records?select=id,text&active=eq.true',{headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE}});
      var recs=await rr.json(); if(!Array.isArray(recs)) recs=[];
      var limit=Math.min(recs.length, Math.max(parseInt(body.limit||recs.length,10)||recs.length,1));
      recs=recs.slice(0,limit);
      var done=0;
      await Promise.all(recs.map(async function(r){
        try{
          var v=await scoreOne(r.text, ANTHROPIC);
          await fetch(SB+'/rest/v1/bench_ai_verdicts?record_id=eq.'+encodeURIComponent(r.id),{method:'DELETE',headers:H});
          await fetch(SB+'/rest/v1/bench_ai_verdicts',{method:'POST',headers:H,body:JSON.stringify({record_id:r.id,conditions:v.conditions,determination:v.determination,model:MODEL})});
          done++;
        }catch(e){}
      }));
      return json({ok:true, scored:done, of:recs.length});
    }
    if (action==='export_armb'){
      // Token-gated export of Arm B judgments for accuracy scoring (score_armb.py).
      // Uses the service role to read the RLS-locked table. Excludes the free-text
      // `note` column so no reviewer PII leaves the DB; returns only scorer fields.
      var amap={};
      try {
        var pr=await fetch(SB+'/rest/v1/armb_progress?select=code,arm_code',{headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE}});
        var pj=await pr.json();
        if(Array.isArray(pj)) pj.forEach(function(r){ if(r&&r.code) amap[r.code]=r.arm_code||null; });
      } catch(e){}
      var rows=[], from=0, page=1000;
      for(;;){
        var rr2=await fetch(SB+"/rest/v1/ai_pilot_reads?select=reviewer_code,record_ref,jrs_read,rely,batch,created_at&batch=like.armB*&order=created_at.asc",{headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,'Range-Unit':'items','Range':from+'-'+(from+page-1)}});
        var chunk=await rr2.json(); if(!Array.isArray(chunk)||!chunk.length) break;
        chunk.forEach(function(r){
          var code=r.reviewer_code||'';
          var cond=amap[code]||null;
          if(!cond){ var mb=String(r.batch||'').match(/B[12]/); cond=mb?mb[0]:null; }
          var det=(cond==='B2')?r.rely:r.jrs_read;
          rows.push({code:code, condition:cond, record:r.record_ref||null, determination:det, jrs_read:r.jrs_read||null, rely:r.rely||null, batch:r.batch||null});
        });
        if(chunk.length<page) break; from+=page;
      }
      return json({ok:true, count:rows.length, rows:rows});
    }
    if (action==='score_armb'){
      // Server-side Arm B scoring so the private dashboard can display B1 vs B2
      // with no manual export. Reads locked rows via the service role, scores
      // against the verified key, and NEVER fabricates: rows whose record or
      // answer it cannot map are counted as 'unmapped' and reported, not guessed.
      var VKEY={R01:'G',R02:'U',R03:'U',R04:'G',R05:'U',R06:'G',R07:'U',R08:'G',R09:'U',R10:'G',R11:'U',R12:'G',R13:'U',R14:'G',R15:'U',R16:'G',R17:'U',R18:'G',R19:'U',R20:'G',R21:'U',R22:'G',R23:'U',R24:'G'};
      var GROK={ready:1,yes:1,grounded:1,rely:1,'true':1,'1':1,adequate:1,supported:1};
      var UNGROK={review_required:1,needs_work:1,'needs work':1,gap:1,gap_identified:1,no:1,ungrounded:1,'false':1,'0':1,not_rely:1,inadequate:1,unsupported:1};
      var amap2={};
      try { var pr2=await fetch(SB+'/rest/v1/armb_progress?select=code,arm_code',{headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE}}); var pj2=await pr2.json(); if(Array.isArray(pj2)) pj2.forEach(function(r){ if(r&&r.code) amap2[r.code]=r.arm_code||null; }); } catch(e){}
      var per={}, unmapRec={}, unmapAns=0, total=0, from2=0, page2=1000;
      for(;;){
        var rr3=await fetch(SB+"/rest/v1/ai_pilot_reads?select=reviewer_code,record_ref,jrs_read,rely,batch&batch=like.armB*",{headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,'Range-Unit':'items','Range':from2+'-'+(from2+page2-1)}});
        var ch=await rr3.json(); if(!Array.isArray(ch)||!ch.length) break;
        ch.forEach(function(r){
          total++;
          var code=r.reviewer_code||''; var cond=amap2[code]; if(!cond){ var mb=String(r.batch||'').match(/B[12]/); cond=mb?mb[0]:null; }
          var rec=String(r.record_ref||'').trim().toUpperCase();
          var det=String((cond==='B2'?r.rely:r.jrs_read)||'').trim().toLowerCase();
          var pred=GROK[det]?'G':(UNGROK[det]?'U':null);
          if(!per[code]) per[code]={cond:cond,correct:0,scored:0};
          if(!VKEY[rec]){ unmapRec[rec]=1; return; }
          if(pred===null){ unmapAns++; return; }
          per[code].scored++; if(pred===VKEY[rec]) per[code].correct++;
        });
        if(ch.length<page2) break; from2+=page2;
      }
      var parts=Object.keys(per).map(function(c){ var p=per[c]; return {code:c,cond:p.cond,correct:p.correct,scored:p.scored,accuracy:p.scored?p.correct/p.scored:null,included:p.scored>=18}; });
      var b1=parts.filter(function(p){return p.included&&p.cond==='B1';}).map(function(p){return p.accuracy;});
      var b2=parts.filter(function(p){return p.included&&p.cond==='B2';}).map(function(p){return p.accuracy;});
      var mean=function(a){return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:null;};
      return json({ok:true, total_rows:total, participants:parts,
        included:{B1:b1.length,B2:b2.length}, B1_mean:mean(b1), B2_mean:mean(b2),
        difference:(b1.length&&b2.length)?mean(b1)-mean(b2):null,
        unmapped_records:Object.keys(unmapRec).filter(Boolean), unmapped_answers:unmapAns,
        note:'preliminary if either arm <5 (design floor 5-8/arm); verify unmapped_* are empty before trusting'});
    }
    return json({error:'unknown_action'},400);
  } catch(e){ return json({error:String(e&&e.message||e)},500); }
}
