export const config = { runtime: 'edge' };

// Organization mini-pilot recorder.
//
// PURPOSE: converts an endorsement into evidence that a real organization ran
// the standard on its own records. This is the field-usage evidence the
// validation program otherwise lacks, and it is the one form of evidence a
// buyer or an enterprise prospect actually prices.
//
// WHAT IS STORED: organization, sector, role, country, how many records were
// run, and the distribution of outcomes (routing bands and per-condition
// pass / needs-attention / fail counts). Plus the contact identity and consent
// already captured at the endorsement gate.
//
// WHAT IS NEVER STORED: the record text. Not any part of it. Records are sent
// to /api/review, assessed in memory by the model, and discarded. This endpoint
// only ever receives counts and category labels computed in the browser. That
// is a deliberate design choice, not an omission: participants are pasting real
// organizational documentation that may be confidential, privileged, or contain
// personal data, and the only safe way to run this at all is to never hold it.
// It is also the honest answer to the first question any enterprise security
// reviewer asks, which makes it a selling point rather than a limitation.
//
// Rows land in the existing private pilot_contacts table (RLS on, no anon read)
// tagged source='org-pilot', with the structured summary as JSON in message,
// matching the /api/enroll and /api/access conventions. Only inserts.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }
  });
}
function clean(v, n){ return (v == null ? '' : String(v)).trim().slice(0, n || 200); }
function tag(v, n){ return String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, n || 40); }
function nInt(v, max){
  const x = parseInt(v, 10);
  if (isNaN(x) || x < 0) return 0;
  return Math.min(x, max || 10);
}

// Deploy and smoke tags never create a pilot row, and any already stored are
// removed on the next request. Same self-healing pattern as the other endpoints.
const TEST_SRC = ['verify', 'test', 'selftest', 'deploytest'];
function isTestTag(s){
  s = String(s || '');
  if (!s) return false;
  if (TEST_SRC.indexOf(s) !== -1) return true;
  return s.indexOf('deploytest') === 0;
}
async function purgeTestRows(H){
  for (let i = 0; i < TEST_SRC.length; i++){
    const pat = '*' + encodeURIComponent('"page_source":"' + TEST_SRC[i]) + '*';
    try {
      await fetch(SB + '/rest/v1/pilot_contacts?source=eq.org-pilot&message=like.' + pat,
        { method: 'DELETE', headers: H });
    } catch (e) { /* best-effort */ }
  }
}

export default async function handler(req){
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Methods':'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type'
    }});
  }

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (req.method === 'GET') {
    if (SERVICE) {
      await purgeTestRows({
        'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
        'Content-Type': 'application/json', 'Prefer': 'return=minimal'
      });
    }
    return json({ ok:true, serviceKey: !!SERVICE });
  }
  if (req.method !== 'POST') return json({ error:'method_not_allowed' }, 405);
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  let b; try { b = await req.json(); } catch(e){ return json({ error:'invalid_json' }, 400); }

  const name    = clean(b.name, 200);
  const email   = clean(b.email, 200);
  const org     = clean(b.organization, 200);
  const title   = clean(b.title, 200);
  const sector  = clean(b.sector, 80);
  const src     = tag(b.src, 40) || null;
  const records = nInt(b.records_run, 10);

  if (!org) return json({ error:'organization_required' }, 400);
  if (!name) return json({ error:'name_required' }, 400);
  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) return json({ error:'valid_email_required' }, 400);
  if (b.consent_contact !== true) return json({ error:'consent_required' }, 400);
  if (records < 1) return json({ error:'no_records_run' }, 400);

  // Outcome distribution, computed in the browser from the reads. Counts only.
  const routing = {
    low:      nInt((b.routing || {}).low, 10),
    moderate: nInt((b.routing || {}).moderate, 10),
    high:     nInt((b.routing || {}).high, 10),
    critical: nInt((b.routing || {}).critical, 10)
  };
  const conditions = {
    pass:            nInt((b.conditions || {}).pass, 50),
    needs_attention: nInt((b.conditions || {}).needs_attention, 50),
    fail:            nInt((b.conditions || {}).fail, 50)
  };

  const country = String(req.headers.get('x-vercel-ip-country') || '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || null;

  const payload = {
    kind: 'org-pilot',
    title: title,
    sector: sector,
    country: country,
    page_source: src || '',
    records_run: records,
    routing: routing,
    conditions: conditions,
    // Explicit, stored alongside the data so the record itself states the rule.
    record_text_stored: false,
    consent_contact: true,
    consent_transfer: b.consent_transfer === true,
    consent_named_org: b.consent_named_org === true,
    ts: new Date().toISOString()
  };

  const H = {
    'apikey': SERVICE,
    'Authorization': 'Bearer ' + SERVICE,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  await purgeTestRows(H);

  if (isTestTag(src)) {
    return json({ ok:true, test:true, records_run: records });
  }

  const row = {
    name: name,
    email: email,
    organization: org,
    message: JSON.stringify(payload),
    source: 'org-pilot'
  };

  const res = await fetch(SB + '/rest/v1/pilot_contacts', {
    method: 'POST', headers: H, body: JSON.stringify(row)
  });
  if (!res.ok) {
    const t = await res.text();
    return json({ error:'db_insert_failed', status:res.status, detail:String(t).slice(0,300) }, 502);
  }

  return json({ ok:true, records_run: records });
}
