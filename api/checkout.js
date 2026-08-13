export const config = { runtime: 'edge' };

// CHECKOUT REDIRECT. /api/checkout?o=audit sends the buyer to the payment link
// for that offer and records the click.
//
// FAILS SAFE, ON PURPOSE. If the offer has no checkout URL configured, this
// does NOT redirect anywhere and does NOT invent a destination. It returns a
// plain page telling the reader to email for an invoice, and records the click
// as unconfigured so the owner can see that someone tried to pay.
//
// That is the whole design decision here: a payment path that silently 404s, or
// worse redirects to a guessed URL, costs a sale and possibly a customer's
// money. A payment path that says "email me and I will invoice you" costs one
// email. Prices and URLs both come from ./_offer-config.js so no second copy of
// a price can exist.
//
// The click is written to interaction_events as source='checkout-click' and is
// read back by /api/asset-stats, so this is not an orphan writer.

import { offerFor, isConfigured } from './_offer-config.js';
import { isNotAClick } from './_not-a-click.js';

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Same bypass tags the rest of the system uses, so a deploy check never writes
// a row that looks like a real person trying to buy something.
const CHECK_TAGS = /^(owner|verify|test|selftest|deploytest)/;

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function page(title, body, status) {
  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<meta name="robots" content="noindex,nofollow">'
    + '<title>' + esc(title) + ' | JRS</title>'
    + '<style>body{background:#050505;color:#F2F2F2;font-family:system-ui,sans-serif;'
    + 'line-height:1.7;max-width:620px;margin:0 auto;padding:56px 22px}'
    + 'h1{font-size:24px;font-weight:500;margin:0 0 16px}p{color:#B3B3B3;font-size:16px}'
    + 'a{color:#BE9447}</style></head><body>' + body + '</body></html>';
  return new Response(html, {
    status: status || 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

async function record(env, offerKey, state, req, srcTag) {
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return;
  if (CHECK_TAGS.test(srcTag)) return;
  try {
    await fetch(SB + '/rest/v1/interaction_events', {
      method: 'POST',
      headers: {
        'apikey': SERVICE,
        'Authorization': 'Bearer ' + SERVICE,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'checkout-click',
        type: 'click',
        payload: {
          offer: offerKey,
          state: state,               // 'redirected' or 'unconfigured'
          src: srcTag,
          country: req.headers.get('x-vercel-ip-country') || '',
          user_agent: String(req.headers.get('user-agent') || '').slice(0, 300)
        }
      })
    });
  } catch (e) { /* a telemetry failure must never block a purchase */ }
}

export default async function handler(req) {
  if (req.method !== 'GET') {
    return page('Method not allowed', '<h1>Method not allowed</h1>', 405);
  }

  const url = new URL(req.url);
  const key = String(url.searchParams.get('o') || '').toLowerCase().replace(/[^a-z]/g, '');
  const srcTag = String(url.searchParams.get('src') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  const env = (typeof process !== 'undefined' && process.env) || {};

  const offer = offerFor(key);
  if (!offer) {
    return page('Unknown offer',
      '<h1>Unknown offer</h1><p>That link does not match an offer. '
      + 'Email <a href="mailto:info@jrsstandard.com">info@jrsstandard.com</a> and I will send the right one.</p>', 404);
  }

  // A prefetch is not a person deciding to buy. Same guard the endorsement path
  // uses, for the same reason: a browser speculatively fetching this link must
  // not appear in the record as purchase intent.
  const prefetch = isNotAClick(req);

  if (isConfigured(offer)) {
    if (!prefetch) await record(env, key, 'redirected', req, srcTag);
    return new Response(null, {
      status: 302,
      headers: { 'Location': offer.checkout_url, 'Cache-Control': 'no-store' }
    });
  }

  // Not configured. Say so plainly and give the reader a path that works today.
  if (!prefetch) await record(env, key, 'unconfigured', req, srcTag);
  return page('Payment link not live yet',
    '<h1>' + esc(offer.name) + '</h1>'
    + '<p><b>' + esc(offer.price_label) + '.</b> ' + esc(offer.scope) + '.</p>'
    + '<p>Self-serve checkout is not switched on yet, so this is invoiced directly. '
    + 'Email <a href="mailto:info@jrsstandard.com?subject=' + encodeURIComponent(offer.name)
    + '">info@jrsstandard.com</a> and you will get scope, price and an invoice in one reply.</p>'
    + '<p>Nothing was charged and nothing was sent.</p>', 503);
}
