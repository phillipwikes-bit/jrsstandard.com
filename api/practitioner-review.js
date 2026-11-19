export const config = { runtime: 'edge' };

// Practitioner blind review of one fictional record (Decision Spellcheck).
//
// One shared link, one answer per visit, no sign-up. The answer is the point:
// it is compared later with the output Decision Spellcheck produced for the
// same record BEFORE anyone saw it (prediction recorded 2026-11-19).
//
// Writes to the EXISTING private pilot_contacts table (RLS on, no anon read)
// via the service-role key, tagged source='practitioner-review'. Fields the
// table has no column for ride along as JSON in the message column, matching
// the /api/contributor and /api/enroll convention. Contact details are stored
// only when the person gives them; every permission is an explicit opt-in.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';
const RECORDS = ['AR-82'];
const ROLES = ['', 'AI governance', 'Investigations or HR', 'Legal or eDiscovery', 'Audit, risk or compliance', 'Fraud examination', 'Other'];

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
}
function clean(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max); }

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let b; try { b = await req.json(); } catch (e) { return json({ error: 'invalid_json' }, 400); }

  // Honeypot: a filled hidden field is an automated submission. Accept quietly
  // so the sender learns nothing, and store nothing.
  if (clean(b.website, 200)) return json({ ok: true });

  const record = clean(b.record_id, 20);
  if (RECORDS.indexOf(record) === -1) return json({ error: 'unknown_record' }, 400);
  const answer = clean(b.answer, 8000);
  if (answer.length < 20) return json({ error: 'answer_too_short' }, 400);
  const role = clean(b.role, 60);
  if (ROLES.indexOf(role) === -1) return json({ error: 'unknown_role' }, 400);
  const name = clean(b.name, 200);
  const email = clean(b.email, 200);
  const wantsResults = b.want_results === true, credit = b.consent_credit === true, pilot = b.pilot_interest === true;
  if ((wantsResults || credit || pilot) && (email.indexOf('@') < 1 || email.indexOf('.') < 0)) return json({ error: 'valid_email_required' }, 400);
  if (email && (email.indexOf('@') < 1 || email.indexOf('.') < 0)) return json({ error: 'valid_email_required' }, 400);

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error: 'service_key_missing' }, 503);
  const H = { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

  const payload = {
    kind: 'practitioner-review', record_id: record, answer: answer, role: role,
    want_results: wantsResults, consent_credit: credit, pilot_interest: pilot,
    country: String(req.headers.get('x-vercel-ip-country') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
    ts: new Date().toISOString()
  };
  const row = { name: name, email: email, organization: '', message: JSON.stringify(payload), source: 'practitioner-review' };
  const res = await fetch(SB + '/rest/v1/pilot_contacts', { method: 'POST', headers: H, body: JSON.stringify(row) });
  if (!res.ok) return json({ error: 'db_insert_failed', status: res.status }, 502);
  return json({ ok: true });
}
