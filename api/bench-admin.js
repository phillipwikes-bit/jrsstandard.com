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
    return json({error:'unknown_action'},400);
  } catch(e){ return json({error:String(e&&e.message||e)},500); }
}
