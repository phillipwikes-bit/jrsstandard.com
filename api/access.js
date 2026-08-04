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

// Deploy and smoke-check tags. Registrations carrying one of these are never
// stored, and any that already exist are physically deleted on the next request,
// so the consented-contact counts stay clean with no manual database work. Same
// self-healing pattern already used by /api/dl and /api/support.
const TEST_SRC = ['verify', 'test', 'selftest', 'deploytest'];
function isTestTag(s){
  s = String(s || '');
  if (!s) return false;
  if (TEST_SRC.indexOf(s) !== -1) return true;
  return s.indexOf('deploytest') === 0;
}

async function purgeTestRows(H){
  // Delete any registration rows written by a deploy check.
  //
  // pilot_contacts.message is a TEXT column holding serialized JSON, not jsonb,
  // so a `message->>page_source` filter matches nothing. Match the serialized
  // payload as text instead, one exact tag at a time, so the pattern stays
  // precise and cannot catch a real registration by accident.
  for (let i = 0; i < TEST_SRC.length; i++){
    const pat = '*' + encodeURIComponent('"page_source":"' + TEST_SRC[i]) + '*';
    try {
      await fetch(SB + '/rest/v1/pilot_contacts'
        + '?source=in.(guide-register,support-register)'
        + '&message=like.' + pat,
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
    // A plain GET is the health check, and it also runs the self-healing purge
    // so a deploy-test registration never lingers in the contact counts.
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

  const mode     = (clean(b.mode, 20) === 'support') ? 'support' : 'guide';

  // Gate view ping. Fired when the registration form is opened, before anyone
  // types anything. Without it the only measurable outcome is a completed
  // registration, so a quiet week is indistinguishable from a form nobody
  // finishes, and there is no way to tell whether traffic or conversion is the
  // problem. Writes an event row only: no name, no email, no contact record.
  if (String(b.event || '') === 'view') {
    try {
      await fetch(SB + '/rest/v1/interaction_events', {
        method: 'POST',
        headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                   'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ source: 'gate-view', type: 'view', payload: {
          mode: mode,
          edition: normEdition(b.edition) || '',
          campaign: b.campaign ? normCampaign(b.campaign) : '',
          src: tag(b.src, 40) || '',
          country: String(req.headers.get('x-vercel-ip-country') || '')
            .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || ''
        }})
      });
    } catch (e) { /* a view ping must never block the form */ }
    return json({ ok: true, view: true });
  }

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

  // Country from the edge geo header (ISO 3166-1 alpha-2), best effort. Stored
  // on the contact row so the private people list has a country per person;
  // pilot_contacts has no country column, so it rides in the JSON like the rest.
  const geo = String(req.headers.get('x-vercel-ip-country') || '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '';

  const payload = {
    kind: (mode === 'support') ? 'support-register' : 'guide-register',
    title: title,
    country: geo,
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

  // Self-healing purge of any deploy-test rows already stored.
  await purgeTestRows(H);

  // A deploy check never creates a contact row or a counter row, but still
  // resolves normally so the smoke test can confirm the whole path works.
  if (isTestTag(src)) {
    if (mode === 'guide') return json({ ok:true, test:true, file: '/' + FILES[edition] });
    return json({ ok:true, test:true, redirect: '/supported.html?c=' + encodeURIComponent(campaign) });
  }

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
  const country = geo || null;

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
