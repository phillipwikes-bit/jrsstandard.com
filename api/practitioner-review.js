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
const RELY = ['', 'Yes', 'Not without more', 'No'];
const YEARS = ['', 'Under 2', '2 to 5', '6 to 10', 'Over 10'];
const ROLES = ['', 'AI governance', 'Investigations or HR', 'Civil rights, EEO or fair housing', 'Public records or government administration', 'Legal or eDiscovery', 'Audit, risk or compliance', 'Fraud examination', 'Organizational psychology or research', 'Other'];

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

  // Pilot or licence interest is asked only AFTER the review answer is in, on
  // the thank-you screen, and stored as its own row so the research answer is
  // never collected alongside a commercial question.
  if (b.kind === 'pilot-interest') return pilotInterest(req, b, record);
  // Question 1 alone (2026-11-21): the one-tap reliance answer is saved the moment
  // it is tapped, so a person who stops after one tap still counts. Stored as its own
  // source and joined to any later full answer by a random per-visit id (rid).
  if (b.kind === 'tap') return tapAnswer(req, b, record);
  const answer = clean(b.answer, 8000);
  // One line is enough (2026-11-21): the page now asks for a short answer.
  if (answer.length < 8) return json({ error: 'answer_too_short' }, 400);
  const rely = clean(b.rely, 30);
  if (RELY.indexOf(rely) === -1) return json({ error: 'unknown_rely' }, 400);
  const role = clean(b.role, 60);
  if (ROLES.indexOf(role) === -1) return json({ error: 'unknown_role' }, 400);
  const years = clean(b.years, 20);
  if (YEARS.indexOf(years) === -1) return json({ error: 'unknown_years' }, 400);
  const name = clean(b.name, 200);
  const email = clean(b.email, 200);
  const wantsResults = b.want_results === true, credit = b.consent_credit === true, pilot = b.pilot_interest === true;
  // Free copy of the prototype when the study closes (owner decision 2026-11-22).
  const wantsCopy = b.want_copy === true;
  if ((wantsResults || credit || pilot || wantsCopy) && !validEmail(email)) return json({ error: 'valid_email_required' }, 400);
  if (email && !validEmail(email)) return json({ error: 'valid_email_required' }, 400);

  const payload = {
    kind: 'practitioner-review', record_id: record, rid: cleanRid(b.rid), src: cleanSrc(b.src), rely: rely, answer: answer, role: role, years: years, consent_quote: b.consent_quote === true,
    want_copy: wantsCopy, want_results: wantsResults, consent_credit: credit, pilot_interest: pilot,
    country: String(req.headers.get('x-vercel-ip-country') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
    ts: new Date().toISOString()
  };
  const row = { name: name, email: email, organization: '', message: JSON.stringify(payload), source: 'practitioner-review' };
  const requests = [];
  if (wantsCopy) requests.push('Free Decision Spellcheck prototype');
  if (wantsResults) requests.push('Research results');
  if (credit) requests.push('Contributor credit opt-in (not endorsement)');
  if (pilot) requests.push('Contact about a pilot or licence');
  return insertRow(row, requests.length ? {requests, country: payload.country, record: record,
    ts: payload.ts, contactNotice: b.contact_relay_notice === true} : null);
}

function validEmail(email) { return email.indexOf('@') > 0 && email.indexOf('.') >= 0; }

function serviceHeaders() {
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return null;
  return { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };
}

// Owner-authorized transactional alert through the existing public-contact
// Formspree relay. This is separate from the disabled legacy email module.
// No research answers, review choices, participant IDs or unselected consent
// fields leave the private research store. Older clients without the notice
// receive a metadata-only alert. An unsuccessful relay must never lose a row
// or cause a visitor to resubmit; the hourly owner check is the backstop.
async function relayOwnerAlert(row, alert) {
  const pilot = row.source === 'practitioner-pilot-interest';
  const subject = (pilot ? 'JRS website pilot request' : 'JRS website practitioner request') + ' | ' + alert.ts;
  const permitted = alert.contactNotice === true;
  const message = [
    'Request: ' + alert.requests.join('; '),
    'Received (UTC): ' + alert.ts,
    'Recorded country: ' + (alert.country || 'Not supplied'),
    'Record: ' + alert.record,
    pilot ? 'Expression of interest only; not a confirmed pilot or sale.' : 'A request or permission, not a sale.',
    permitted ? 'Contact details below are provided for this request only.' : 'Contact details are available in the private JRS register (older form version).',
    'No research response is included.'
  ].join('\n');
  const fields = new URLSearchParams({
    name: permitted && row.name ? row.name : 'Not supplied',
    email: permitted && row.email ? row.email : 'phillipwikes@gmail.com',
    organization: '',
    category: pilot ? 'organization' : 'general',
    message,
    source: 'jrs-owner-request-alert',
    form_type: 'jrs-transactional-owner-alert-2026-11-26',
    consent_to_contact: 'true', consent_to_transfer: 'false',
    contact_details_included: permitted ? 'true' : 'false',
    _subject: subject, _gotcha: ''
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch('https://formspree.io/f/mreddwdg', {
      method: 'POST',
      headers: {'Accept':'application/json','Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',
        'Origin':'https://www.jrsstandard.com'},
      body: fields.toString(), signal: controller.signal
    });
    if (!response.ok) {
      console.error('jrs_owner_alert_relay_failed', row.source, alert.ts, response.status);
      return false;
    }
    return true;
  } catch (_) {
    console.error('jrs_owner_alert_relay_failed', row.source, alert.ts, 'network_or_timeout');
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function insertRow(row, alert) {
  const H = serviceHeaders();
  if (!H) return json({ error: 'service_key_missing' }, 503);
  const res = await fetch(SB + '/rest/v1/pilot_contacts', { method: 'POST', headers: H, body: JSON.stringify(row) });
  if (!res.ok) return json({ error: 'db_insert_failed', status: res.status }, 502);
  // Await bounded delivery attempt after durable capture; provider acceptance
  // is not mailbox delivery. Never expose delivery status to public visitors.
  if (alert) await relayOwnerAlert(row, alert);
  return json({ ok: true });
}

function cleanRid(v) { const s = clean(v, 40); return /^[a-z0-9]{8,40}$/.test(s) ? s : ''; }
function cleanSrc(v) { return clean(v, 40).toLowerCase().replace(/[^a-z0-9_.-]/g, ''); }

async function tapAnswer(req, b, record) {
  const rely = clean(b.rely, 30);
  if (!rely || RELY.indexOf(rely) === -1) return json({ error: 'unknown_rely' }, 400);
  const rid = cleanRid(b.rid);
  if (!rid) return json({ error: 'unknown_rid' }, 400);
  const payload = {
    kind: 'practitioner-review-tap', record_id: record, rid: rid, rely: rely, src: cleanSrc(b.src),
    country: String(req.headers.get('x-vercel-ip-country') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
    ts: new Date().toISOString()
  };
  return insertRow({ name: '', email: '', organization: '', message: JSON.stringify(payload), source: 'practitioner-review-tap' });
}

async function pilotInterest(req, b, record) {
  const name = clean(b.name, 200);
  const email = clean(b.email, 200);
  if (!validEmail(email)) return json({ error: 'valid_email_required' }, 400);
  const payload = {
    kind: 'pilot-interest', record_id: record,
    country: String(req.headers.get('x-vercel-ip-country') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
    ts: new Date().toISOString()
  };
  return insertRow({ name: name, email: email, organization: '', message: JSON.stringify(payload), source: 'practitioner-pilot-interest' },
    {requests: ['Contact about a pilot or licence'], country: payload.country, record: record,
      ts: payload.ts, contactNotice: b.contact_relay_notice === true});
}
