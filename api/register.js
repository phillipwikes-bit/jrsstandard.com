export const config = { runtime: 'edge' };

// Token-free reviewer registration. Upserts a FIXED list of reviewers (defined
// below, in code) into bench_experts using the server-side service-role key.
// There is no request input that controls what is written, so this is idempotent
// and not an abuse vector: calling it only re-upserts these known reviewers.
// To add reviewers without a management token: append to REVIEWERS, redeploy this
// file, then GET /api/register once.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const REVIEWERS = [
  {
    code: 'V-AI-30',
    name: 'Andres Lage Freire',
    title: 'AI-Assisted Records Pilot Expert Reviewer',
    credential: 'Responsible AI and Gen AI Consultant; RAG and EU AI Act alignment; EU AI Act, ISO/IEC 42001; SDLC-native governance; AI Governance Lead / Responsible AI Architect (Madrid).',
    years_experience: 'n/a',
    affiliation: 'Independent consultant (Spain)'
  }
];

function json(o, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' } }); }

export default async function handler(req){
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  const res = await fetch(SB + '/rest/v1/bench_experts?on_conflict=code', {
    method:'POST',
    headers:{ 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE, 'Content-Type':'application/json', 'Prefer':'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(REVIEWERS)
  });
  if (!res.ok){ const t = await res.text(); return json({ error:'db_upsert_failed', status:res.status, detail:String(t).slice(0,400) }, 502); }
  return json({ ok:true, upserted: REVIEWERS.map(function(r){ return r.code; }) });
}
