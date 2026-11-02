import { ownerAccess } from './_owner-auth.js';
import { fetchAll } from './_sb-fetch.js';
export const config = { runtime: 'edge' };

// Historical aggregate checkout activity for the authenticated owner dashboard.
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
  'checkout-fallback': { table: 'pilot_contacts', select: 'created_at,message' },
  'enterprise-inquiry': { table: 'pilot_contacts', select: 'created_at,message' }
};

function feed(src, asOf) {
  const s = SOURCES[src];
  // All sources share one time boundary. New events cannot shift the numbered
  // pages while the three independent reads are in progress. The result is not
  // a cross-table transaction snapshot, so the boundary is reported plainly.
  return '/rest/v1/' + s.table + '?select=' + s.select
       + '&source=eq.' + src
       + '&created_at=lte.' + encodeURIComponent(asOf)
       + '&order=created_at.asc';
}

function json(o, s) {
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function bump(map, k) {
  const key = k || 'unknown';
  // Payloads can contain arbitrary strings, including inherited Object keys.
  // Counter maps must have no prototype to avoid corrupting or losing totals.
  map[key] = (map[key] || 0) + 1;
}

export default async function handler(req) {
  const denied = await ownerAccess(req);
  if (denied) return denied;
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error: 'not_configured' }, 503);
  const asOf = new Date().toISOString();
  const H = {
    'apikey': SERVICE,
    'Authorization': 'Bearer ' + SERVICE,
    'Content-Type': 'application/json'
  };

  // ---- arrivals at the pay screen -----------------------------------------
  // Require complete pagination, never partial historical populations.
  const clickResult=await fetchAll(SB,feed('checkout-click',asOf).slice('/rest/v1/'.length),H);
  if(!clickResult.complete || !Array.isArray(clickResult.rows))
    return json({error:'checkout_source_incomplete',source:'checkout-click',complete:false},502);
  const clicks=clickResult.rows;

  const byOffer = Object.create(null), byCountry = Object.create(null), byState = Object.create(null);
  let intentUsd = 0;
  for (let i = 0; i < clicks.length; i++) {
    const p = (clicks[i] || {}).payload || {};
    const offer = String(p.offer || '');
    bump(byOffer, offer);
    bump(byCountry, String(p.country || ''));
    bump(byState, String(p.state || ''));
    // Legacy offer-price exposure for events labeled unconfigured.
    // Clicks do not establish a payment, purchaser commitment, or lost revenue.
    if (p.state === 'unconfigured' && Object.hasOwn(OFFERS, offer)) {
      const face = OFFERS[offer].price_usd;
      if (typeof face === 'number' && Number.isFinite(face) && face >= 0) intentUsd += face;
    }
  }

  // ---- leads captured on the fallback form ---------------------------------
  const leadResult=await fetchAll(SB,feed('checkout-fallback',asOf).slice('/rest/v1/'.length),H);
  if(!leadResult.complete || !Array.isArray(leadResult.rows))
    return json({error:'checkout_source_incomplete',source:'checkout-fallback',complete:false},502);
  const leads=leadResult.rows;

  const leadsByOffer = Object.create(null), leadsByCountry = Object.create(null);
  let leadValueUsd = 0, withVolume = 0;
  for (let i = 0; i < leads.length; i++) {
    let p = {};
    try { p = JSON.parse((leads[i] || {}).message || '{}') || {}; } catch (e) { p = {}; }
    const offer = String(p.offer || '');
    bump(leadsByOffer, offer);
    bump(leadsByCountry, String(p.country || ''));
    if (typeof p.price_usd === 'number' && Number.isFinite(p.price_usd) && p.price_usd >= 0)
      leadValueUsd += p.price_usd;
    if (p.volume) withVolume++;
  }

  // ---- enterprise and licensing inquiries ---------------------------------
  const inquiryResult=await fetchAll(SB,feed('enterprise-inquiry',asOf).slice('/rest/v1/'.length),H);
  if(!inquiryResult.complete || !Array.isArray(inquiryResult.rows))
    return json({error:'checkout_source_incomplete',source:'enterprise-inquiry',complete:false},502);
  const inq=inquiryResult.rows;

  const inqByInterest = Object.create(null), inqByScale = Object.create(null),
        inqByTimeline = Object.create(null), inqByCountry = Object.create(null);
  let namedPlatform = 0;
  for (let i = 0; i < inq.length; i++) {
    let p = {};
    try { p = JSON.parse((inq[i] || {}).message || '{}') || {}; } catch (e) { p = {}; }
    bump(inqByInterest, String(p.interest || ''));
    bump(inqByScale, String(p.scale || ''));
    bump(inqByTimeline, String(p.timeline || ''));
    bump(inqByCountry, String(p.country || ''));
    if (p.platform) namedPlatform++;
  }

  // Which offers can actually take a card right now. A funnel report that does
  // not say this invites the reader to blame the copy for a missing payment link.
  const configured = {};
  Object.keys(OFFERS).forEach(function (k) { configured[k] = isConfigured(OFFERS[k]); });

  return json({
    generated_at: asOf,
    complete: true,
    coverage_through_utc: asOf,
    pagination_basis: 'Created-at ascending with a fixed UTC upper bound, not a transactional snapshot across sources',
    source_coverage: ['checkout-click','checkout-fallback','enterprise-inquiry'],
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
    enterprise_inquiries: inq.length,
    inquiries_by_interest: inqByInterest,
    inquiries_by_scale: inqByScale,
    inquiries_by_timeline: inqByTimeline,
    inquiries_by_country: inqByCountry,
    inquiries_naming_a_platform: namedPlatform,
    checkout_configured: configured,
    note: 'Aggregate only, sourced from three complete historical populations. No names, emails or organizations are returned. The legacy unconfigured_intent_usd field sums the listed historical offer prices attached to unconfigured click events. It is neither confirmed purchase intent, lost revenue nor evidence of completed payments. These offers are retired.'
  });
}
