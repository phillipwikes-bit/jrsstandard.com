import { fetchAllUrl } from './_sb-fetch.js';
import { ownerAccess } from './_owner-auth.js';
export const config = { runtime: 'edge' };

// Owner-only training enrollment and completion reader. Returns named contact
// data and cannot be authorized by a URL query token. Requires the same signed
// owner session or owner bearer credential as the private Programme Status page.
// Legacy ?token= tokens must NOT bypass the owner gate.
const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){ return new Response(JSON.stringify(o, null, 2), { status: s||200, headers: { 'Content-Type':'application/json', 'Cache-Control':'no-store, private', 'X-Robots-Tag':'noindex, nofollow', 'Referrer-Policy':'no-referrer' } }); }

export default async function handler(req){
  if (req.method !== 'GET') return json({ error:'method_not_allowed' }, 405);
  const gate = await ownerAccess(req);
  if (gate) return gate;
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  const H = { 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE };
  let enroll, done;
  try {
    const enrollRows = await fetchAllUrl(SB + "/rest/v1/pilot_contacts?select=name,email,organization,message,created_at&source=eq.training-enroll&order=created_at.asc", H);
    enroll = enrollRows;
    const doneRows = await fetchAllUrl(SB + "/rest/v1/pilot_contacts?select=email,created_at&source=eq.training-complete", H);
    done = doneRows;
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
