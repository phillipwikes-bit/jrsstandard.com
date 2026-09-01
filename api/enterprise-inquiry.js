export const config = { runtime: 'edge' };

// ENTERPRISE LICENSING INQUIRY. POST /api/enterprise-inquiry
//
// The private channel for GRC platform and legal-tech evaluation. Routes to
// pilot_contacts under source='enterprise-inquiry', read back by
// /api/checkout-stats, so it is not an orphan writer.
//
// WHY IT IS A FORM AND NOT A mailto: LINK. Thirteen buyers reached the pay
// screen between 14 and 21 August 2026 and every one left no name, because the
// only thing offered was an email address. An enterprise evaluator who has to
// compose a cold email from scratch is an evaluator you find out about only if
// they bother. The fields below are the ones that actually qualify a licensing
// conversation: platform, seat scale, deployment posture and timeline.
//
// FAILS LOUD. If the row does not land, the caller is told. A capture form that
// silently drops a licensing lead is worse than no form, because it reports
// success while losing the thing it exists to keep.

import { notify, renderAlert } from './_notify.js';

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Named rather than inlined so this file is findable as the writer, and so
// scripts/check_zero_drift.py can pair it with its reader.
const SOURCE = 'enterprise-inquiry';

// Closed vocabularies. A free-text deployment answer cannot be counted, and an
// uncountable field on a qualification form is decoration.
// 'acquisition' and 'not-sure' added 2026-08-29 for the Commercial Inquiries
// pathway. The allowlist is the reason this file changes at all: oneOf() drops
// any value not listed, so a new <option> added to the form alone would be
// stored as an empty string and reach the dashboard as "unspecified", which is
// precisely the inquiry type the change exists to capture. The five existing
// values are unchanged.
const INTEREST = ['engine-licence', 'oem-embed', 'framework-licence',
                  'evaluation', 'acquisition', 'not-sure', 'other'];
const SCALE = ['under-1k', '1k-10k', '10k-100k', 'over-100k', 'unknown'];
const TIMELINE = ['immediate', 'this-quarter', 'this-year', 'exploratory'];

function json(o, s) {
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  });
}

function clean(v, n) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, n);
}

// An answer outside the vocabulary becomes '' rather than being coerced to the
// first option. A qualification field guessed from bad input is worse than an
// empty one, because it looks answered.
function oneOf(v, list) {
  const s = clean(v, 40).toLowerCase();
  return list.indexOf(s) === -1 ? '' : s;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let b = {};
  try { b = await req.json(); } catch (e) { return json({ error: 'bad_json' }, 400); }

  const name = clean(b.name, 120);
  const email = clean(b.email, 160);
  const org = clean(b.organization, 160);
  const role = clean(b.role, 120);

  if (!name || !org || !email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
    return json({ error: 'name_email_organization_required',
                  detail: 'Name, work email and organisation are required.' }, 400);
  }

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error: 'not_configured' }, 503);

  const res = await fetch(SB + '/rest/v1/pilot_contacts', {
    method: 'POST',
    headers: {
      'apikey': SERVICE,
      'Authorization': 'Bearer ' + SERVICE,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      name: name,
      email: email,
      organization: org,
      source: SOURCE,
      message: JSON.stringify({
        kind: SOURCE,
        role: role,
        interest: oneOf(b.interest, INTEREST),
        scale: oneOf(b.scale, SCALE),
        timeline: oneOf(b.timeline, TIMELINE),
        platform: clean(b.platform, 160),
        note: clean(b.note, 1200),
        country: String(req.headers.get('x-vercel-ip-country') || '')
          .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2),
        ts: new Date().toISOString()
      })
    })
  }).catch(function () { return null; });

  if (!res || !res.ok) {
    const detail = res ? await res.text().catch(function () { return ''; }) : 'network';
    return json({ error: 'db_insert_failed',
                  status: res ? res.status : 0,
                  detail: String(detail).slice(0, 200) }, 502);
  }
  // Alert only after the row is durable. See api/_notify.js for why this order
  // is not negotiable.
  const alert = await notify(
    'Enterprise inquiry: ' + org + ' (' + (oneOf(b.interest, INTEREST) || 'unspecified') + ')',
    renderAlert('Enterprise licensing inquiry', [
      ['Name', name],
      ['Email', email],
      ['Organisation', org],
      ['Role', role],
      ['Interest', oneOf(b.interest, INTEREST)],
      ['Platform', clean(b.platform, 160)],
      ['Records per year', oneOf(b.scale, SCALE)],
      ['Timeline', oneOf(b.timeline, TIMELINE)],
      ['Country', String(req.headers.get('x-vercel-ip-country') || '')],
      ['Note', clean(b.note, 1200)],
      ['Source', SOURCE]
    ]),
    email
  );

  return json({ ok: true, stored: true, alerted: alert.sent === true });
}
