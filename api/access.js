export const config = { runtime: 'edge' };

// Consent-capturing registration gate for the field guides and the initiative
// support action. Both flows previously completed anonymously: guide downloads
// recorded only an edition and a country code, and support clicks recorded only
// a campaign. Neither produced a contactable, verifiable, or transferable
// record. This endpoint replaces both front doors with one registration that
// captures name, organization, title, email, and explicit consent, writing to
// the EXISTING private pilot_contacts table (RLS enabled, no anon read policy)
// via the service-role key, exactly as /api/enroll does for training.
//
// Rows are tagged source='guide-register' or source='support-register' so they
// never collide with training enrollments (source='training-enroll') or real
// pilot contacts (source='pilot'). Fields pilot_contacts has no column for
// (title, consent flags, edition, campaign) ride along losslessly as JSON in the
// message column, matching the /api/enroll convention.
//
// The aggregate counters the public dashboard reads are still written, so
// geo-stats and support-stats keep working unchanged and no history is lost.
// This endpoint only inserts; nothing reads personal data back through it.
//
// NOTE: named api/access.js, not api/register.js. The latter already exists and
// registers bench reviewers; it is unrelated and must not be disturbed.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Field guide editions, mirroring /api/dl. Kept deliberately in sync: this is
// the only place a registration can release a guide file.
const FILES = {
  employment:    'JRS_Investigator_Field_Guide_Employment.pdf',
  fairhousing:   'JRS_Investigator_Field_Guide_FairHousing.pdf',
  international: 'JRS_Investigator_Field_Guide_International.pdf'
};

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }
  });
}
function clean(v, n){ return (v == null ? '' : String(v)).trim().slice(0, n || 200); }
function tag(v, n){ return String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, n || 40); }

function normEdition(e){
  e = String(e || '').toLowerCase().replace(/[^a-z]/g, '');
  if (e === 'eeo' || e === 'employment') return 'employment';
  if (e === 'fairhousing' || e === 'housing' || e === 'fh') return 'fairhousing';
  if (e === 'international' || e === 'intl' || e === 'int') return 'international';
  return '';
}

function normCampaign(c){
  c = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
  if (c === 'rtkw' || c === 'rights' || c === 'righttoknowwhy') return 'rtkw';
  if (c === 'defend' || c === 'decisions' || c === 'decisionsyoucandefend') return 'defend';
  return 'general';
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

  if (req.method === 'GET') return json({ ok:true, serviceKey: !!SERVICE });
  if (req.method !== 'POST') return json({ error:'method_not_allowed' }, 405);
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  let b; try { b = await req.json(); } catch(e){ return json({ error:'invalid_json' }, 400); }

  const mode     = (clean(b.mode, 20) === 'support') ? 'support' : 'guide';
  const name     = clean(b.name, 200);
  const email    = clean(b.email, 200);
  const org      = clean(b.organization, 200);
  const title    = clean(b.title, 200);
  const src      = tag(b.src, 40) || null;
  const edition  = normEdition(b.edition);
  const campaign = normCampaign(b.campaign);

  if (!name) return json({ error:'name_required' }, 400);
  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) return json({ error:'valid_email_required' }, 400);
  if (b.consent_contact !== true) return json({ error:'consent_required' }, 400);
  if (mode === 'guide' && !edition) return json({ error:'edition_required' }, 400);

  const payload = {
    kind: (mode === 'support') ? 'support-register' : 'guide-register',
    title: title,
    page_source: src || '',
    consent_contact: true,
    consent_transfer: b.consent_transfer === true,
    consent_named: b.consent_named === true,
    ts: new Date().toISOString()
  };
  if (mode === 'guide') payload.edition = edition; else payload.campaign = campaign;

  const row = {
    name: name,
    email: email,
    organization: org,
    message: JSON.stringify(payload),
    source: (mode === 'support') ? 'support-register' : 'guide-register'
  };

  const H = {
    'apikey': SERVICE,
    'Authorization': 'Bearer ' + SERVICE,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  // The consented contact record is the point of this endpoint. If it fails the
  // request fails: no file is released and no support is recorded, so a stored
  // aggregate can never exist without the identity behind it.
  const res = await fetch(SB + '/rest/v1/pilot_contacts', {
    method: 'POST', headers: H, body: JSON.stringify(row)
  });
  if (!res.ok) {
    const t = await res.text();
    return json({ error:'db_insert_failed', status:res.status, detail:String(t).slice(0,300) }, 502);
  }

  // Keep the existing public aggregate counters populated so the dashboard,
  // geo-stats, and support-stats continue to work exactly as before. Best-effort
  // only: the registration above is already durable and must not be undone by a
  // counter write failing.
  const country = String(req.headers.get('x-vercel-ip-country') || '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || null;

  try {
    if (mode === 'guide') {
      await Promise.all([
        fetch(SB + '/rest/v1/guide_downloads', { method:'POST', headers:H,
          body: JSON.stringify({ edition: edition, src: src }) }),
        fetch(SB + '/rest/v1/interaction_events', { method:'POST', headers:H,
          body: JSON.stringify({ source:'guide-dl', type:'download',
            payload:{ edition: edition, src: src, country: country, registered: true } }) })
      ]);
    } else {
      await fetch(SB + '/rest/v1/interaction_events', { method:'POST', headers:H,
        body: JSON.stringify({ source:'support', type:'endorse',
          payload:{ campaign: campaign, src: src, country: country, registered: true } }) });
    }
  } catch(e){ /* swallow: the consented record is already stored */ }

  if (mode === 'guide') return json({ ok:true, file: '/' + FILES[edition] });
  return json({ ok:true, redirect: '/supported.html?c=' + encodeURIComponent(campaign) });
}
