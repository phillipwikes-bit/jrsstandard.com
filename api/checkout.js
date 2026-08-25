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
import { notify, renderAlert } from './_notify.js';

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
    + 'a{color:#BE9447}'
    + 'label{display:block;margin:14px 0 0;font-size:13px;color:#8A8A8A}'
    + 'input{display:block;width:100%;margin-top:5px;padding:10px;background:#121212;'
    + 'color:#F2F2F2;border:1px solid #2A2A2A;font-size:15px;font-family:inherit}'
    + 'button{margin-top:18px;padding:11px 20px;background:#BE9447;color:#050505;'
    + 'border:0;font-size:15px;cursor:pointer;font-family:inherit}'
    + 'button[disabled]{opacity:.55;cursor:default}'
    + '#m{font-size:14px;min-height:1.2em}</style></head><body>' + body + '</body></html>';
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

// Posts the form as JSON and reports the outcome in place. No dependency, no
// redirect, and the button is re-enabled on failure so a network drop does not
// strand a buyer on a dead page.
const FORM_JS = "var f=document.getElementById('f'),m=document.getElementById('m');"
  + "f.addEventListener('submit',function(e){e.preventDefault();"
  + "var b=f.querySelector('button');b.disabled=true;m.style.color='#B3B3B3';"
  + "m.textContent='Sending...';var d={};"
  + "new FormData(f).forEach(function(v,k){d[k]=v;});"
  + "fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},"
  + "body:JSON.stringify(d)}).then(function(r){return r.json();}).then(function(j){"
  + "if(j&&j.ok){f.innerHTML='';m.style.color='#5DBF82';"
  + "m.textContent='Received. You will get the scope, the price and an invoice by email.';}"
  + "else{m.style.color='#E88080';"
  + "m.textContent='That did not save. Email info@jrsstandard.com and it will be handled.';"
  + "b.disabled=false;}}).catch(function(){m.style.color='#E88080';"
  + "m.textContent='Network error. Email info@jrsstandard.com and it will be handled.';"
  + "b.disabled=false;});});";

function jsonRes(o, st) {
  return new Response(JSON.stringify(o), {
    status: st || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function trim(v, n) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, n);
}

async function captureLead(req) {
  let b = {};
  try { b = await req.json(); } catch (e) { return jsonRes({ error: 'bad_json' }, 400); }

  const key = trim(b.o, 32).toLowerCase().replace(/[^a-z]/g, '');
  const offer = offerFor(key);
  const name = trim(b.name, 120);
  const email = trim(b.email, 160);
  const org = trim(b.organization, 160);

  // An email that is not an email is a lost lead that looks captured, so it is
  // rejected here rather than stored and discovered later.
  if (!name || !org || !email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
    return jsonRes({ error: 'name_email_organization_required' }, 400);
  }

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return jsonRes({ error: 'not_configured' }, 503);

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
      source: 'checkout-fallback',
      message: JSON.stringify({
        kind: 'checkout-fallback',
        offer: key,
        offer_name: offer ? offer.name : '',
        price_usd: offer ? offer.price_usd : null,
        record_type: trim(b.record_type, 160),
        volume: trim(b.volume, 60),
        country: String(req.headers.get('x-vercel-ip-country') || '')
          .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2),
        ts: new Date().toISOString()
      })
    })
  }).catch(function () { return null; });

  if (!res || !res.ok) {
    const detail = res ? await res.text().catch(function () { return ''; }) : 'network';
    return jsonRes({ error: 'db_insert_failed',
                    status: res ? res.status : 0,
                    detail: String(detail).slice(0, 200) }, 502);
  }

  // ALERT AFTER THE ROW LANDS, NEVER BEFORE. The lead is already durable at this
  // point. notify() cannot throw, and its result deliberately does not change
  // the response: telling a buyer their submission failed because an email did
  // not go out would be false, and would lose the lead the row already holds.
  const alert = await notify(
    'Lead: ' + (offer ? offer.name : key) + ' from ' + org,
    renderAlert('Checkout fallback lead', [
      ['Offer', offer ? offer.name : key],
      ['Price', offer ? offer.price_label : ''],
      ['Name', name],
      ['Email', email],
      ['Organisation', org],
      ['Record type', trim(b.record_type, 160)],
      ['Volume', trim(b.volume, 60)],
      ['Country', String(req.headers.get('x-vercel-ip-country') || '')],
      ['Source', 'checkout-fallback']
    ]),
    email
  );

  return jsonRes({ ok: true, stored: true, alerted: alert.sent === true });
}

export default async function handler(req) {
  // POST is the fallback lead capture. It is the only write this endpoint makes
  // that carries a person's details, so it fails LOUD: if the row does not land,
  // the caller is told, rather than being thanked for a lead that was dropped.
  if (req.method === 'POST') return captureLead(req);

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

  // Not configured. Say so plainly, give the reader a path that works today, AND
  // CAPTURE WHO THEY ARE.
  //
  // WHY THE FORM EXISTS. The previous version of this branch rendered a static
  // page with an email address on it. Thirteen people reached this screen
  // between 14 and 21 August 2026, across four countries, and every one of them
  // left no name, no email and no organisation. They are unrecoverable. A buyer
  // who will not send an unprompted cold email is still a buyer, and enterprise
  // purchasers routinely cannot use a card at all. Losing them silently is a
  // worse failure than not having a payment link.
  //
  // The POST goes to /api/checkout itself, which writes source='checkout-fallback'
  // into pilot_contacts. Nothing about the record is asked for beyond type and
  // volume, and the page says plainly that no records are sent at this stage.
  if (!prefetch) {
    await record(env, key, 'unconfigured', req, srcTag);
    // A pay-screen arrival with no payment link is the exact event that went
    // unnoticed thirteen times. It carries no contact detail by definition, so
    // the alert exists to say "somebody just tried to pay and could not",
    // while the form below is what captures who they were.
    await notify(
      'Pay attempt, no payment link: ' + offer.name,
      renderAlert('Checkout arrival, unconfigured', [
        ['Offer', offer.name],
        ['Price', offer.price_label],
        ['Arrived from', srcTag || '(none)'],
        ['Country', String(req.headers.get('x-vercel-ip-country') || '')],
        ['Note', 'No payment link is configured for this offer, so no card could be taken.']
      ])
    );
  }
  const esc_o = esc(offer.name), esc_p = esc(offer.price_label), esc_s = esc(offer.scope);
  return page('Scoping and invoice',
    '<h1>' + esc_o + '</h1>'
    + '<p><b>' + esc_p + ' fixed.</b> ' + esc_s + '.</p>'
    + '<p><b>Engagements at this size are scoped in writing before anything is sent.</b> '
    + 'Tell me your record type and volume and you will get the scope, the fixed price, '
    + 'the turnaround and an invoice in one reply. <b>Purchase orders accepted.</b></p>'
    + '<form id="f" method="post" action="/api/checkout">'
    + '<input type="hidden" name="o" value="' + esc(key) + '">'
    + '<label>Name<input name="name" required maxlength="120" autocomplete="name"></label>'
    + '<label>Email<input name="email" type="email" required maxlength="160" autocomplete="email"></label>'
    + '<label>Organisation<input name="organization" required maxlength="160" autocomplete="organization"></label>'
    + '<label>Record type<input name="record_type" maxlength="160" placeholder="e.g. investigation files, termination records"></label>'
    + '<label>Approximate volume<input name="volume" maxlength="60" placeholder="e.g. 40 per month"></label>'
    + '<button type="submit">Request scope and invoice</button>'
    + '<p id="m" role="status"></p>'
    + '</form>'
    + '<p><b>No records are sent at this stage</b>, and de-identification is agreed '
    + 'before any are. Nothing has been charged.</p>'
    + '<p>Prefer email? <a href="mailto:info@jrsstandard.com?subject='
    + encodeURIComponent(offer.name) + '">info@jrsstandard.com</a></p>'
    + '<script>' + FORM_JS + '</script>', 200);
}
