export const config = { runtime: 'edge' };

// Consent-capturing registration gate for the Investigator Guides and the initiative
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

// Investigator Guide editions, mirroring /api/dl. Kept deliberately in sync: this is
// the only place a registration can release a guide file.
const FILES = {
  employment:    'JRS_Investigator_Field_Guide_Employment.pdf',
  fairhousing:   'JRS_Investigator_Field_Guide_FairHousing.pdf',
  international: 'JRS_Investigator_Field_Guide_International.pdf'
};

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-store' }
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

// Synthetic verification tags never create registration records.
// Historical cleanup, if needed, is a separately authorized maintenance task.
// Public requests must not trigger deletes of participant data.
const TEST_SRC = ['verify', 'test', 'selftest', 'deploytest'];
function isTestTag(s){
  s = String(s || '');
  if (!s) return false;
  if (TEST_SRC.indexOf(s) !== -1) return true;
  return s.indexOf('deploytest') === 0;
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
    // Public health checks are read-only. Never reveal private service-key
    // configuration or trigger a database read, write or deletion.
    return json({ ok: true });
  }
  if (req.method !== 'POST') return json({ error:'method_not_allowed' }, 405);
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin)
    return json({ error:'origin_not_allowed' }, 403);
  if (!SERVICE) return json({ error:'service_unavailable' }, 503);

  // Named access requests must remain small and must be JSON objects.
  const suppliedLength = Number(req.headers.get('content-length') || '0');
  if (suppliedLength > 8192) return json({ error:'request_too_large' }, 413);
  let b;
  try {
    const raw = await req.text();
    if (raw.length > 8192) return json({ error:'request_too_large' }, 413);
    b = JSON.parse(raw);
    if (!b || typeof b !== 'object' || Array.isArray(b))
      return json({ error:'invalid_json' }, 400);
  } catch(e) { return json({ error:'invalid_json' }, 400); }

  const mode     = (clean(b.mode, 20) === 'support') ? 'support' : 'guide';

  // Gate view ping. Fired when the registration form is opened, before anyone
  // types anything. Without it the only measurable outcome is a completed
  // registration, so a quiet week is indistinguishable from a form nobody
  // finishes, and there is no way to tell whether traffic or conversion is the
  // problem. Writes an event row only: no name, no email, no contact record.
  // User-agent capture. The event log has never carried a device signal, so
  // mobile against desktop was unanswerable from the database even though the
  // traffic is overwhelmingly phone-sourced. Truncated to 300 characters: enough
  // to identify a browser and platform, short enough not to become a fingerprint
  // store. is_mobile is computed server-side so every row is classified the same
  // way regardless of what the client reports.
  const uaRaw = String(req.headers.get('user-agent') || '').slice(0, 300);
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(uaRaw);
  // Same non-browser list as /api/support: a crawler reaching the campaign
  // screen is not a supporter and must not be counted as one.
  const isCrawler = !uaRaw || /googlebot|bingbot|baiduspider|yandexbot|duckduckbot|applebot|GoogleOther|facebookexternalhit|bot|spider|crawl|slurp|preview|headless|curl|wget|python-requests|libwww|okhttp|java\/|go-http/i.test(uaRaw);

  // Deploy-check guard. Without it, any test of the gate telemetry writes rows
  // into the funnel figures the conversion report is computed from, and a view
  // that was a curl becomes an abandonment in the denominator. src=verify, test,
  // selftest, owner or deploytest* validates the whole path and writes nothing.
  const gateSrc = tag(b.src, 40);
  const gateCheck = gateSrc === 'owner' || gateSrc === 'verify' || gateSrc === 'test'
                 || gateSrc === 'selftest' || gateSrc.indexOf('deploytest') === 0;

  // First-focus ping. Fires once per page session when a reader touches any
  // field. Pairs with the view ping above to split an abandonment into "never
  // engaged" and "started and left". Writes an event row only.
  if (String(b.event || '') === 'field_touched') {
    if (gateCheck) return json({ ok: true, field_touched: true, recorded: false, check: true, is_mobile: isMobile });
    try {
      await fetch(SB + '/rest/v1/interaction_events', {
        method: 'POST',
        headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                   'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ source: 'gate-view', type: 'field_touched', payload: {
          field_name: tag(b.field_name, 40) || '',
          mode: mode,
          edition: normEdition(b.edition) || '',
          campaign: b.campaign ? normCampaign(b.campaign) : '',
          src: tag(b.src, 40) || '',
          country: String(req.headers.get('x-vercel-ip-country') || '')
            .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
          user_agent: uaRaw,
          is_mobile: isMobile
        }})
      });
    } catch (e) { /* a telemetry ping must never block the form */ }
    return json({ ok: true, field_touched: true });
  }

  // FALLBACK ENDORSEMENT WRITE, for readers who reach the campaign screen
  // without passing through /api/support.
  //
  // The server-side write in /api/support covers the campaign links as posted.
  // It does NOT cover a reader who arrives with a copied address-bar URL, a
  // forwarded link, a bookmark, or a link a platform expanded on their behalf.
  // Those readers saw a screen saying "Your support is recorded" while nothing
  // was recorded, which is the same false statement the outage produced, just
  // from a different direction.
  //
  // /api/support marks its own redirect with r=1. This fires only when that
  // marker is absent, so the two paths cannot both count the same person, and
  // the page fires it once per session.
  if (String(b.event || '') === 'endorse') {
    const camp = b.campaign ? normCampaign(b.campaign) : '';
    if (!camp) return json({ ok: true, endorse: false, reason: 'no_campaign' });
    if (gateCheck || isCrawler) {
      return json({ ok: true, endorse: true, recorded: false, check: true });
    }
    try {
      await fetch(SB + '/rest/v1/interaction_events', {
        method: 'POST',
        headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                   'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ source: 'support', type: 'endorse', payload: {
          campaign: camp,
          src: tag(b.src, 40) || 'none',
          country: String(req.headers.get('x-vercel-ip-country') || '')
            .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || null
        }})
      });
    } catch (e) { /* never block the page */ }
    return json({ ok: true, endorse: true, recorded: true });
  }

  if (String(b.event || '') === 'view') {
    if (gateCheck) return json({ ok: true, view: true, recorded: false, check: true, is_mobile: isMobile });
    // ADDED 2026-08-11: arrivals on the reviewer landing page and on the
    // training page were recorded NOWHERE. reviewer/index.html made no logging
    // call at all, and training.html recorded only a completed enrolment, so a
    // reader who clicked the link, opened Module 1 in preview and left produced
    // no row anywhere. Both were invisible surfaces: a click could happen and
    // nothing would show up, which is exactly what it looked like.
    //
    // Written under their own source values so gate-stats, which counts
    // source='gate-view' as a campaign form open, is untouched by the change.
    const PAGE_SOURCE = { reviewer: 'reviewer-view', training: 'train-view' };
    const viewSource = PAGE_SOURCE[String(b.page || '')] || 'gate-view';
    try {
      await fetch(SB + '/rest/v1/interaction_events', {
        method: 'POST',
        headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                   'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ source: viewSource, type: 'view', payload: {
          mode: mode,
          edition: normEdition(b.edition) || '',
          campaign: b.campaign ? normCampaign(b.campaign) : '',
          src: tag(b.src, 40) || '',
          country: String(req.headers.get('x-vercel-ip-country') || '')
            .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
          user_agent: uaRaw,
          is_mobile: isMobile
        }})
      });
    } catch (e) { /* a view ping must never block the form */ }
    return json({ ok: true, view: true });
  }

  // Historical listing action accepted an email address alone and then
  // rewrote a private contact's consent flags. Email knowledge is not proof
  // of authorization. Do not read or change an issuer/contact record until
  // a separate, verified-consent workflow exists.
  if (String(b.event || '') === 'listing') {
    return json({ error:'verified_consent_required' }, 403);
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

  // A deploy check never creates a contact row or a counter row, but still
  // resolves normally so the smoke test can confirm the whole path works.
  if (isTestTag(src)) {
    if (mode === 'guide') return json({ ok:true, test:true, file: '/' + FILES[edition] });
    return json({ ok:true, test:true, redirect: '/supported.html?c=' + encodeURIComponent(campaign) });
  }

  // The consented contact record is the point of this endpoint. If it fails the
  // request fails: no file is released and no support is recorded, so a stored
  // aggregate can never exist without the identity behind it.
  try {
    const res = await fetch(SB + '/rest/v1/pilot_contacts', {
      method: 'POST', headers: H, body: JSON.stringify(row)
    });
    if (!res.ok) return json({ error:'registration_unavailable' }, 502);
  } catch (e) {
    // Transport failures are indistinguishable from provider rejections to
    // the caller. Do not release files, count support or expose diagnostics.
    return json({ error:'registration_unavailable' }, 502);
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
            payload:{ edition: edition, src: src, country: country, registered: true,
                      user_agent: uaRaw, is_mobile: isMobile } }) })
      ]);
    } else {
      await fetch(SB + '/rest/v1/interaction_events', { method:'POST', headers:H,
        body: JSON.stringify({ source:'support', type:'endorse',
          payload:{ campaign: campaign, src: src, country: country, registered: true,
                    user_agent: uaRaw, is_mobile: isMobile } }) });
    }
  } catch(e){ /* swallow: the consented record is already stored */ }

  if (mode === 'guide') return json({ ok:true, file: '/' + FILES[edition] });
  return json({ ok:true, redirect: '/supported.html?c=' + encodeURIComponent(campaign) });
}
