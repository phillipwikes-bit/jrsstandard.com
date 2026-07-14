export const config = { runtime: 'edge' };

// Admin read of training enrollments and completion. Returns PII (name, title,
// email, organization), so it is TOKEN-GATED: ?token= must equal BENCH_ADMIN_TOKEN
// or RUN_TOKEN (reuse the one already set in Vercel). Reads pilot_contacts with the
// server-side service-role key. Fails safe: if no admin token is configured, or no
// valid token is supplied, it returns 401 and never returns data. GET only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){ return new Response(JSON.stringify(o, null, 2), { status: s||200, headers: { 'Content-Type':'application/json', 'Cache-Control':'no-store' } }); }

export default async function handler(req){
  if (req.method !== 'GET') return json({ error:'method_not_allowed' }, 405);
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const ADMIN = env.BENCH_ADMIN_TOKEN || '';
  const RUN = env.RUN_TOKEN || '';
  const tok = new URL(req.url).searchParams.get('token') || '';

  if (!SERVICE) return json({ error:'service_key_missing' }, 503);
  if (!ADMIN && !RUN) return json({ error:'no_admin_token_configured' }, 401);
  if (!tok || (tok !== ADMIN && tok !== RUN)) return json({ error:'unauthorized' }, 401);

  const H = { 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE };
  let enroll, done;
  try {
    const er = await fetch(SB + "/rest/v1/pilot_contacts?select=name,email,organization,message,created_at&source=eq.training-enroll&order=created_at.asc&limit=10000", { headers:H });
    if (!er.ok) return json({ error:'db_read_failed', status:er.status }, 502);
    enroll = await er.json();
    const cr = await fetch(SB + "/rest/v1/pilot_contacts?select=email,created_at&source=eq.training-complete&limit=10000", { headers:H });
    done = cr.ok ? await cr.json() : [];
  } catch(e){ return json({ error:'db_unreachable' }, 502); }
  if (!Array.isArray(enroll)) enroll = [];
  if (!Array.isArray(done)) done = [];

  // Earliest completion timestamp per lowercased email.
  const doneMap = {};
  done.forEach(function(d){
    const e = (d.email==null?'':String(d.email)).trim().toLowerCase();
    if (e && (!doneMap[e] || d.created_at < doneMap[e])) doneMap[e] = d.created_at;
  });

  const people = enroll.map(function(r){
    let p = {}; try { p = JSON.parse(r.message||'{}') || {}; } catch(e){ p = {}; }
    const email = (r.email==null?'':String(r.email)).trim();
    const key = email.toLowerCase();
    return {
      name: r.name || '',
      title: p.title || '',
      email: email,
      organization: r.organization || '',
      channel: p.page_source || '',
      consent_contact: p.consent_contact === true,
      consent_transfer: p.consent_transfer === true,
      enrolled_at: r.created_at || '',
      completed: !!doneMap[key],
      completed_at: doneMap[key] || ''
    };
  });

  return json({
    ok: true,
    count: people.length,
    completed: people.filter(function(x){ return x.completed; }).length,
    people: people
  });
}
