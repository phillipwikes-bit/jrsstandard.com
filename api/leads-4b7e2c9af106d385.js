export const config = { runtime: 'edge' };

// OWNER-ONLY COMMERCIAL INBOX. Every lead, in full, newest first.
//
// WHY THIS ENDPOINT EXISTS SEPARATELY FROM /api/checkout-stats.
// checkout-stats deliberately exposes NO personal data: it counts, and it is
// safe to call from anywhere. This one returns the name, the email and the
// organisation, because the owner cannot answer a lead he cannot see. Those are
// two different jobs and they must not share a URL, since widening the safe
// endpoint to carry PII would silently make every existing caller a PII caller.
//
// SECURED BY THIS OPAQUE, UNLINKED, NOINDEX URL. NO TOKEN.
// Same model as api/people-9dd1ecdf6f8cdfd4.js and
// api/roster-8c3f1a9e7b2d6045.js, and the same rotation rule: if this slug ever
// leaks, rename this file and update the one page that calls it.
//
// STREAMS COVERED, all from pilot_contacts:
//   checkout-fallback    buyer who reached the pay screen and left details
//   enterprise-inquiry   GRC platform / legal-tech licensing inquiry
//   org-pilot            organisation that ran its own records
//   pilot                older direct contact rows, kept so nothing is hidden
//
// Pay-screen ARRIVALS are a different thing and come from interaction_events,
// not pilot_contacts: they carry no identity at all, by definition, because the
// person left before giving one. They are returned in a separate array so the
// page can show "somebody tried to pay" beside "somebody told us who they are"
// without ever implying the first has a name attached.
//
// GET only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// The identified streams. Ordered as they appear in the response so the page
// does not have to restate the vocabulary.
const LEAD_SOURCES = [
  'checkout-fallback',
  'enterprise-inquiry',
  'org-pilot',
  'pilot'
];

// Human labels. Kept here rather than in the page so a new stream cannot be
// added to the endpoint and render as a raw slug on screen.
const LABEL = {
  'checkout-fallback': 'Checkout lead',
  'enterprise-inquiry': 'Enterprise inquiry',
  'org-pilot': 'Organisation pilot',
  'pilot': 'Direct contact'
};

function json(o, s) {
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: {
      'Content-Type': 'application/json',
      // Never cached anywhere. This payload carries personal data and a shared
      // cache holding it is a disclosure waiting for a different reader.
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer'
    }
  });
}

function str(v, n) {
  return String(v == null ? '' : v).slice(0, n || 300);
}

// TEST AND OWNER ROWS NEVER APPEAR IN THE INBOX.
//
// Three rows landed in the live inbox on 2026-08-25 from the repository audit's
// end-to-end capture test. They were correctly stored, because the capture path
// worked exactly as designed, and that is the point: this endpoint cannot tell a
// real buyer from a self-test by looking at the write path, so it filters on the
// content the test itself stamps.
//
// Filtering here is deliberate and is NOT a substitute for deleting the rows.
// The dashboard is a queue of people waiting for a reply, and a test row in that
// queue is noise that trains the reader to skim. Deletion needs the service key
// and is the owner's action; this makes the queue correct in the meantime.
const TEST_MARKERS = [
  'audit test',
  'do not contact',
  'safe to delete',
  'selftest',
  'deploytest',
  'test row'
];

function isTestRow(row) {
  const hay = [row.name, row.email, row.organization]
    .map(function (v) { return String(v == null ? '' : v).toLowerCase(); })
    .join(' | ');
  for (let i = 0; i < TEST_MARKERS.length; i++) {
    if (hay.indexOf(TEST_MARKERS[i]) !== -1) return true;
  }
  return false;
}

export default async function handler(req) {
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error: 'not_configured' }, 503);
  const H = {
    'apikey': SERVICE,
    'Authorization': 'Bearer ' + SERVICE,
    'Content-Type': 'application/json'
  };

  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1), 500);

  // ---- identified leads ----------------------------------------------------
  const inList = LEAD_SOURCES.map(function (s) { return '"' + s + '"'; }).join(',');
  let rows = [];
  try {
    const r = await fetch(SB + '/rest/v1/pilot_contacts'
      + '?select=created_at,name,email,organization,source,message'
      + '&source=in.(' + inList + ')'
      + '&order=created_at.desc&limit=' + limit, { headers: H });
    if (!r.ok) {
      const t = await r.text();
      return json({ error: 'db_read_failed', status: r.status,
                    detail: String(t).slice(0, 300) }, 502);
    }
    rows = await r.json();
  } catch (e) {
    return json({ error: 'db_unreachable' }, 502);
  }
  if (!Array.isArray(rows)) rows = [];

  const leads = [];
  let suppressed = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {};
    if (isTestRow(r)) { suppressed++; continue; }
    let p = {};
    try { p = JSON.parse(r.message || '{}') || {}; } catch (e) { p = {}; }
    const src = str(r.source, 40);

    // The detail line differs per stream. Building it here keeps the page from
    // having to know the shape of four different payloads.
    const detail = [];
    if (p.offer_name) detail.push(p.offer_name);
    if (typeof p.price_usd === 'number' && p.price_usd > 0) detail.push('$' + p.price_usd);
    if (p.record_type) detail.push(str(p.record_type, 160));
    if (p.volume) detail.push(str(p.volume, 60));
    if (p.role) detail.push(str(p.role, 120));
    if (p.interest) detail.push(str(p.interest, 40));
    if (p.platform) detail.push(str(p.platform, 160));
    if (p.scale) detail.push(str(p.scale, 40) + '/yr');
    if (p.timeline) detail.push(str(p.timeline, 40));
    if (p.sector) detail.push(str(p.sector, 120));
    if (typeof p.records === 'number') detail.push(p.records + ' records run');

    leads.push({
      at: r.created_at || null,
      source: src,
      label: LABEL[src] || src,
      name: str(r.name, 120),
      email: str(r.email, 160),
      organization: str(r.organization, 160),
      country: str(p.country, 2),
      detail: detail.join(' · '),
      note: str(p.note, 1200)
    });
  }

  // ---- anonymous pay-screen arrivals --------------------------------------
  // Kept apart from leads on purpose. These have no identity and must never be
  // shown in a way that suggests one is attached.
  let arrivals = [];
  try {
    const r = await fetch(SB + '/rest/v1/interaction_events'
      + '?select=created_at,payload&source=eq.checkout-click'
      + '&order=created_at.desc&limit=' + limit, { headers: H });
    arrivals = r.ok ? await r.json() : [];
  } catch (e) {
    arrivals = [];
  }
  if (!Array.isArray(arrivals)) arrivals = [];

  const attempts = arrivals.map(function (a) {
    const p = (a || {}).payload || {};
    return {
      at: a.created_at || null,
      offer: str(p.offer, 40),
      state: str(p.state, 40),
      from: str(p.src, 60),
      country: str(p.country, 2)
    };
  });

  const unconfigured = attempts.filter(function (a) { return a.state === 'unconfigured'; }).length;

  return json({
    generated_at: new Date().toISOString(),
    leads: leads,
    lead_count: leads.length,
    // Reported rather than hidden. A count that silently drops rows is the same
    // defect this programme measures, so the number of suppressed rows is shown
    // and the owner can see that suppression is happening at all.
    suppressed_test_rows: suppressed,
    attempts: attempts,
    attempt_count: attempts.length,
    attempts_unconfigured: unconfigured,
    note: 'Owner-only. Carries names, emails and organisations. Secured by an '
        + 'opaque unlinked URL with no token, matching the other owner surfaces. '
        + 'Pay-screen attempts are anonymous by definition and are listed '
        + 'separately from identified leads.'
  });
}
