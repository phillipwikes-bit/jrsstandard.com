export const config = { runtime: 'edge' };

// PUBLIC, READ-ONLY OFFER INFORMATION. GET /api/offer-info
//
// WHY THIS EXISTS. Prices were hardcoded into audit-request.html,
// governance-request.html, calibration-request.html and engagement.html, in nine
// places across four files, while api/_offer-config.js called itself the single
// source of truth. That is exactly the drift its own header warned about: a
// figure that reads $250 on one surface and something else on another is taken by
// a buyer as either a mistake or a bait.
//
// The pages now carry no price at all. They carry an empty element and fill it
// from here, so a price exists in one file and is rendered from that file
// everywhere. scripts/check_zero_drift.py fails the build if a price literal
// reappears in any HTML file.
//
// NOTHING SENSITIVE IS EXPOSED. Name, price, scope and whether card checkout is
// live are all already public on the offer pages. The checkout URL itself is
// deliberately NOT returned: it is followed through /api/checkout, which records
// the click, and handing it out here would let a link bypass that record.

import { OFFERS, FREE_TIER, isConfigured } from './_offer-config.js';

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  const offers = {};
  Object.keys(OFFERS).forEach(function (k) {
    const o = OFFERS[k];
    // A RETIRED OFFER EMITS NO PRICE. The figure stays in _offer-config.js so
    // historical rows in checkout-stats, the leads inbox and the owner
    // programme page still resolve a name and an amount, but nothing public
    // renders it: the offer is not for sale, and a price on a page that
    // cannot be bought is worse than no price at all. The consuming pages
    // already guard on an empty price_label and fall back to their own copy.
    const retired = o.retired === true;
    offers[k] = {
      name: o.name,
      price_usd: retired ? null : o.price_usd,
      price_label: retired ? '' : o.price_label,
      scope: o.scope,
      retired: retired,
      checkout_live: retired ? false : isConfigured(o)
    };
  });

  return new Response(JSON.stringify({
    offers: offers,
    free_tier: {
      name: FREE_TIER.name,
      path: FREE_TIER.path,
      price_label: FREE_TIER.price_label
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      // Short cache: a price change should reach the pages quickly, but this is
      // read on every offer-page view and does not need to be uncached.
      'Cache-Control': 'public, max-age=300'
    }
  });
}
