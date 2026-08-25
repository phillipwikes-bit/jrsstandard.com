export const config = { runtime: 'edge' };

// Aggregate commercial-funnel stats for the private status dashboard, token-free.
//
// WHY THIS EXISTS. api/checkout.js writes two things: a 'checkout-click' event
// for every arrival at the pay screen, and a 'checkout-fallback' contact row for
// every buyer who fills the capture form instead of paying by card. The first
// had a reader; the second did not, and an unread write is exactly how thirteen
// purchase attempts sat unnoticed in interaction_events between 14 and 21 August
// 2026 while the owner had no surface showing them.
//
// NO PERSONAL DATA LEAVES THIS ENDPOINT. Name, email and organisation are read
// into the function to compute counts and are then discarded. Same posture as
// /api/enroll-stats and /api/coauthor-stats. The offer key and the country code
// ARE returned, because an offer identifies nobody and a two-letter country is
// the coarsest geography there is, and without them the endpoint cannot answer
// the one question it exists to answer: which offer is drawing buyers, from where.
//
// GET only.

import { OFFERS, isConfigured } from './_offer-config.js';

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// The two event sources this endpoint consumes, named rather than inlined into
// the query strings. Naming them is what makes this file findable as the READER
// of those sources: scripts/check_zero_drift.py fails the build when a source
// written anywhere in api/ has no endpoint consuming it, and a source buried in
// a URL literal is invisible to that check and to anyone grepping for it.
const SOURCES = {
  'checkout-click': { table: 'interaction_events', select: 'created_at,payload' },
  'checkout-fallback': { table: 'pilot_contacts', select: 'created_at,message' }
};

function feed(src) {
  const s = SOURCES[src];
  return '/rest/v1/' + s.table + '?select=' + s.select
       + '&source=eq.' + src + '&limit=5000';
}

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

function bump(map, k) {
  const key = k || 'unknown';
  map[key] = (map[key] || 0) + 1;
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

  // ---- arrivals at the pay screen -----------------------------------------
  let clicks = [];
  try {
    const r = await fetch(SB + feed('checkout-click'), { headers: H });
    if (!r.ok) {
      const t = await r.text();
      return json({ error: 'db_read_failed', status: r.status,
                    detail: String(t).slice(0, 300) }, 502);
    }
    clicks = await r.json();
  } catch (e) {
    return json({ error: 'db_unreachable' }, 502);
  }
  if (!Array.isArray(clicks)) clicks = [];

  const byOffer = {}, byCountry = {}, byState = {};
  let intentUsd = 0;
  for (let i = 0; i < clicks.length; i++) {
    const p = (clicks[i] || {}).payload || {};
    const offer = String(p.offer || '');
    bump(byOffer, offer);
    bump(byCountry, String(p.country || ''));
    bump(byState, String(p.state || ''));
    // Stated intent is only meaningful for clicks that could NOT complete. A
    // redirected click may or may not have converted, and counting it here would
    // overstate lost revenue as if every redirect had also failed.
    if (p.state === 'unconfigured' && OFFERS[offer]) intentUsd += OFFERS[offer].price_usd;
  }

  // ---- leads captured on the fallback form ---------------------------------
  let leads = [];
  try {
    const r = await fetch(SB + feed('checkout-fallback'), { headers: H });
    leads = r.ok ? await r.json() : [];
  } catch (e) {
    leads = [];
  }
  if (!Array.isArray(leads)) leads = [];

  const leadsByOffer = {}, leadsByCountry = {};
  let leadValueUsd = 0, withVolume = 0;
  for (let i = 0; i < leads.length; i++) {
    let p = {};
    try { p = JSON.parse((leads[i] || {}).message || '{}') || {}; } catch (e) { p = {}; }
    const offer = String(p.offer || '');
    bump(leadsByOffer, offer);
    bump(leadsByCountry, String(p.country || ''));
    if (typeof p.price_usd === 'number') leadValueUsd += p.price_usd;
    if (p.volume) withVolume++;
  }

  // Which offers can actually take a card right now. A funnel report that does
  // not say this invites the reader to blame the copy for a missing payment link.
  const configured = {};
  Object.keys(OFFERS).forEach(function (k) { configured[k] = isConfigured(OFFERS[k]); });

  return json({
    generated_at: new Date().toISOString(),
    pay_screen_arrivals: clicks.length,
    arrivals_by_offer: byOffer,
    arrivals_by_country: byCountry,
    arrivals_by_state: byState,
    unconfigured_intent_usd: intentUsd,
    fallback_leads: leads.length,
    leads_by_offer: leadsByOffer,
    leads_by_country: leadsByCountry,
    leads_with_volume: withVolume,
    lead_value_usd: leadValueUsd,
    checkout_configured: configured,
    note: 'Aggregate only. No name, email or organisation is exposed by this '
        + 'endpoint. unconfigured_intent_usd counts only arrivals that could not '
        + 'complete, so it is lost intent rather than lost revenue.'
  });
}
