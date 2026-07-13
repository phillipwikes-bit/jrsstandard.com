export const config = { runtime: 'edge' };

// JRS submission relay. The reviewer study pages POST their reads here, and this
// function inserts them into ai_pilot_reads using the server-side service-role key.
// This makes submissions work regardless of the anon row-level-security policy on
// ai_pilot_reads. It is INSERT-only: it never reads or returns anyone's answers,
// and it never exposes the service key to the client.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' } }); }

export default async function handler(req){
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST, GET, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } });
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';

  // Health check: reports only whether the service key is present, never its value.
  if (req.method === 'GET') return json({ ok:true, serviceKey: !!SERVICE });

  if (req.method !== 'POST') return json({ error:'method_not_allowed' }, 405);
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  let body; try { body = await req.json(); } catch(e){ return json({ error:'invalid_json' }, 400); }
  const rows = body && Array.isArray(body.rows) ? body.rows : null;
  if (!rows || !rows.length) return json({ error:'no_rows' }, 400);
  if (rows.length > 500) return json({ error:'too_many_rows' }, 400);

  // Whitelist and coerce fields; ignore anything else. Only ai_pilot_reads is written.
  const clean = [];
  for (let i=0; i<rows.length; i++){
    const r = rows[i] || {};
    if (!r.record_ref || !r.reviewer_code) return json({ error:'missing_fields', at:i }, 400);
    clean.push({
      record_ref: String(r.record_ref).slice(0,64),
      jrs_read: (r.jrs_read==null?'':String(r.jrs_read)).slice(0,32),
      rely: (r.rely==null?'':String(r.rely)).slice(0,16),
      note: (r.note==null?'':String(r.note)).slice(0,4000),
      reviewer_code: String(r.reviewer_code).slice(0,40),
      batch: (r.batch==null?'':String(r.batch)).slice(0,40)
    });
  }

  const res = await fetch(SB + '/rest/v1/ai_pilot_reads', {
    method:'POST',
    headers:{ 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE, 'Content-Type':'application/json', 'Prefer':'return=minimal' },
    body: JSON.stringify(clean)
  });
  if (!res.ok){ const t = await res.text(); return json({ error:'db_insert_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }
  return json({ ok:true, inserted: clean.length });
}
