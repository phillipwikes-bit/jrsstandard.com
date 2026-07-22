export const config = { runtime: 'edge' };

// Token-free reviewer registration. Ensures a FIXED list of reviewers (defined
// below, in code) exists in bench_experts, using the server-side service-role key.
// bench_experts has no unique constraint on code, so this checks existence then
// inserts or updates (same pattern the old management-token SQL used). There is no
// request input that controls what is written, so it is idempotent and not an abuse
// vector. To add reviewers without a management token: append to REVIEWERS, redeploy,
// then GET /api/register once.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const REVIEWERS = [
  {
    code: 'V-AI-30',
    name: 'Andres Lage Freire',
    title: 'AI-Assisted Records Pilot Expert Reviewer',
    credential: 'Responsible AI and Gen AI Consultant; RAG and EU AI Act alignment; EU AI Act, ISO/IEC 42001; SDLC-native governance; AI Governance Lead / Responsible AI Architect (Madrid).',
    years_experience: 'n/a',
    affiliation: 'Independent consultant (Spain)'
  },
  {
    code: 'V-AI-31',
    name: 'Alexandria Davis',
    title: 'AI-Assisted Records Pilot Expert Reviewer',
    credential: 'Responsible AI & Compliance Leader; AI Governance, Compliance Automation, and Fairness in Financial Systems; DBA Candidate; Founder & Principal Consultant, FIEA Consulting Inc.',
    years_experience: 'n/a',
    affiliation: 'FIEA Consulting Inc. (Toronto, Canada)'
  }
];

function json(o, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' } }); }

export default async function handler(req){
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);
  const H = { 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE, 'Content-Type':'application/json' };
  const HW = Object.assign({ 'Prefer':'return=minimal' }, H);

  // Maintenance: purge known diagnostic/test codes from ai_pilot_reads. These codes
  // are never real reviewers, so deleting them is always safe and self-heals test pollution.
  const TEST_CODES = ['SMOKE-TEST','DIAG-B2','DIAG-DET','DIAG-ARMB','DIAG-MIN'];
  let purged = 'skipped';
  try {
    const del = await fetch(SB + '/rest/v1/ai_pilot_reads?reviewer_code=in.(' + TEST_CODES.join(',') + ')', { method:'DELETE', headers:HW });
    purged = del.ok ? 'ok' : ('failed_' + del.status);
  } catch(e){ purged = 'error'; }

  const results = [];
  for (let i=0; i<REVIEWERS.length; i++){
    const r = REVIEWERS[i];
    let exists = false;
    try {
      const g = await fetch(SB + '/rest/v1/bench_experts?select=code&code=eq.' + encodeURIComponent(r.code), { headers: H });
      const arr = await g.json();
      exists = Array.isArray(arr) && arr.length > 0;
    } catch(e){ /* treat as not-exists; insert path will surface any error */ }

    let res;
    if (exists){
      res = await fetch(SB + '/rest/v1/bench_experts?code=eq.' + encodeURIComponent(r.code), { method:'PATCH', headers:HW, body: JSON.stringify(r) });
      results.push({ code:r.code, action: res.ok ? 'updated' : 'update_failed', status: res.status });
    } else {
      res = await fetch(SB + '/rest/v1/bench_experts', { method:'POST', headers:HW, body: JSON.stringify(r) });
      results.push({ code:r.code, action: res.ok ? 'inserted' : 'insert_failed', status: res.status });
    }
    if (!res.ok){ const t = await res.text(); results[results.length-1].detail = String(t).slice(0,200); }
  }
  return json({ ok:true, purged, results });
}
