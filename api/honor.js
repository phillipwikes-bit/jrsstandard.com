export const config = { runtime: 'edge' };

// Global Governance and Transparency Honor: per-person acceptance endpoint.
//
// One unguessable link per honoree. The link does four jobs the email round
// cannot do reliably:
//
//   1. Captures how the honoree wants their NAME and TITLE printed on the
//      certificate and in any article byline or contributor list, confirmed by
//      the person rather than transcribed from a registration form.
//   2. Captures a short QUOTE in their own words about documentation quality in
//      public records, which is the thing an article, a press note, and a data
//      room all need and none of them can invent.
//   3. Records permissions in writing, in one required tick: contact, secure
//      storage, and transfer with the project if it is ever acquired. Public
//      listing of the honoree's name is a SEPARATE optional choice, matching
//      the split-consent model used across the rest of the site.
//   4. Issues the honor itself: the citation text is returned on submission so
//      the honoree sees exactly what the certificate will say.
//
// Writes to the EXISTING private pilot_contacts table (RLS on, no anon read)
// via the service-role key, tagged source='honor-accept' so it never collides
// with training-enroll, guide-register, support-register, contributor-confirm
// or pilot rows. Fields the table has no column for ride along as JSON in the
// message column, matching the /api/enroll, /api/access and /api/contributor
// convention.
//
// NOTE ON SCOPE: honorees are named for public-records and governance work.
// Comparison-arm reviewers (RR-### codes) are NOT eligible and must not be
// added, because that arm is blind and a page naming the standard would break
// it for anyone still reviewing.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const HONOR_NAME = 'Global Governance and Transparency Honor';
const HONOR_YEAR = '2026';

// Roster. Keys are unguessable per person so one honoree's link never exposes
// another's details. Titles are the ones on file and are shown back as editable
// defaults, not asserted. `citation` is the sentence that goes on the
// certificate; it states what the person actually did.
const ROSTER = {
  'q7m2vd9xk4': {
    code: 'H-2026-01',
    first: 'Stacy',
    name: 'Stacy Young',
    title: 'Deputy Records Access Officer, New York City Department of Housing Preservation and Development',
    org: 'NYC Department of Housing Preservation and Development',
    order: 'first honoree named under this designation',
    citation: 'For designing and completing the public-records documentation study: '
            + '32 real determinations, advisory opinions and compliance audits, drawn from four '
            + 'document classes and two states and spanning twenty-one years of decisions, each '
            + 'assessed from the source alone and each accompanied by a written record of the '
            + 'basis for that assessment. That discipline is what allowed the study to show what '
            + 'its readings were measuring, and it is the standard this Honor exists to recognize.'
  }
};

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
function clean(v, n){ return (v == null ? '' : String(v)).trim().slice(0, n || 200); }

export default async function handler(req){
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';

  const url = new URL(req.url);
  const key = clean(url.searchParams.get('k'), 40);
  const person = ROSTER[key];

  // GET returns only this person's own defaults. An unknown key returns nothing
  // about anyone, so a guessed link is a dead end rather than a directory.
  if (req.method === 'GET') {
    if (!person) return json({ ok: false, found: false }, 404);
    return json({
      ok: true, found: true,
      honor: HONOR_NAME, year: HONOR_YEAR,
      code: person.code, first: person.first, name: person.name,
      title: person.title, org: person.org, order: person.order,
      citation: person.citation
    });
  }

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!person) return json({ error: 'unknown_link' }, 404);
  if (!SERVICE) return json({ error: 'service_key_missing' }, 503);

  let b; try { b = await req.json(); } catch(e){ return json({ error: 'invalid_json' }, 400); }

  const name  = clean(b.name, 200) || person.name;
  const title = clean(b.title, 300) || person.title;
  const email = clean(b.email, 200);
  const org   = clean(b.organization, 200) || person.org;
  const quote = clean(b.quote, 1200);

  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
    return json({ error: 'valid_email_required' }, 400);
  }
  if (b.consent_core !== true) return json({ error: 'consent_required' }, 400);

  const geo = String(req.headers.get('x-vercel-ip-country') || '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '';

  const payload = {
    kind: 'honor-accept',
    honor: HONOR_NAME,
    year: HONOR_YEAR,
    honor_code: person.code,
    printed_name: name,
    printed_title: title,
    organization: org,
    country: geo,
    quote: quote,
    quote_clearance: b.quote_clearance === true,
    byline_ok: b.byline_ok === true,
    consent_contact: true,
    consent_transfer: true,
    consent_public_list: b.consent_public_list === true,
    ts: new Date().toISOString()
  };

  const H = {
    'apikey': SERVICE,
    'Authorization': 'Bearer ' + SERVICE,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  const res = await fetch(SB + '/rest/v1/pilot_contacts', {
    method: 'POST', headers: H,
    body: JSON.stringify({
      name: name, email: email, organization: org,
      message: JSON.stringify(payload), source: 'honor-accept'
    })
  });
  if (!res.ok) {
    const t = await res.text();
    return json({ error: 'db_insert_failed', status: res.status, detail: String(t).slice(0, 300) }, 502);
  }

  return json({
    ok: true,
    honor: HONOR_NAME, year: HONOR_YEAR,
    code: person.code,
    printed_name: name,
    printed_title: title,
    citation: person.citation
  });
}
