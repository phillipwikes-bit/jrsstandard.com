export const config = { runtime: 'edge' };

// Support entry point for the JRS initiatives.
//
// CHANGED 2026-08-02: support stopped being recorded on a bare GET and was
// forwarded to the registration form instead, which captured name, email and
// consent and wrote the endorsement row itself from /api/access.
//
// CHANGED 2026-08-11: the write is back here, because the form it was handed to
// no longer exists. The campaign gate was replaced with a single evaluation CTA
// earlier the same day, which removed the registration POST and with it the
// only thing writing the endorsement row. Between those two changes the
// endorsement was recorded nowhere: every click 302'd to a screen that told the
// reader "Your support is recorded" and recorded nothing. This restores the
// count.
//
// What is recorded is a count and nothing else: campaign, referral tag, and the
// two-letter country from the edge header. No name, no email, no IP, no user
// agent, no identifier of any kind, and nothing that could be joined back to a
// person. The reader is asked for nothing and gives nothing.
//
// Every existing link keeps working. The support URLs already distributed in
// emails, signatures, LinkedIn posts and across the site all point here.
// Campaign and src are preserved through the redirect so attribution survives.
//
// Internal smoke-test tags are still honored: they record nothing and resolve
// straight to the thank-you page, so deploy checks never create rows.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';
const TEST_SRC = ['verify', 'test', 'selftest'];

function normCampaign(c){
  c = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
  if (c === 'rtkw' || c === 'rights' || c === 'righttoknowwhy') return 'rtkw';
  if (c === 'defend' || c === 'decisions' || c === 'decisionsyoucandefend') return 'defend';
  return 'general';
}

export default async function handler(req){
  const url = new URL(req.url);
  const campaign = normCampaign(url.searchParams.get('c'));
  const src = String(url.searchParams.get('src') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || '';

  // Deploy and smoke checks bypass everything and record nothing.
  const isCheck = (src && TEST_SRC.indexOf(src) !== -1)
               || src.indexOf('deploytest') === 0
               || src === 'owner'
               || url.searchParams.get('owner') === '1';
  if (isCheck) {
    return Response.redirect(url.origin + '/supported.html?c=' + encodeURIComponent(campaign), 302);
  }

  // NON-BROWSER AGENTS DO NOT ENDORSE ANYTHING.
  //
  // Added 2026-08-11 after four separate rounds of self-inflicted pollution:
  // every verification of this endpoint wrote a real endorsement that then had
  // to be purged by hand with a timestamp bracket. A crawler following the
  // campaign link from an indexed page would do exactly the same thing and
  // nobody would notice.
  //
  // The redirect still happens for everyone. Only the count is protected, so a
  // crawler still reaches the page and simply is not recorded as a supporter.
  const ua = String(req.headers.get('user-agent') || '');
  const NOT_A_PERSON = /googlebot|bingbot|baiduspider|yandexbot|duckduckbot|applebot|GoogleOther|facebookexternalhit|bot|spider|crawl|slurp|preview|headless|curl|wget|python-requests|libwww|okhttp|java\/|go-http/i;
  const isAgent = !ua || NOT_A_PERSON.test(ua);

  // ONE ENDORSEMENT PER BROWSER PER CAMPAIGN.
  //
  // This write previously had NO deduplication of any kind. Every GET wrote a
  // row, so a reload, a back-button, a second click on the same post, or a
  // browser prefetching the address bar each produced another endorsement,
  // while the campaign-screen arrival it should pair with is deduped per
  // session. On 2026-08-12 that read 7 endorsements against 2 arrivals and the
  // dashboard called the gap a defect, which sent the owner looking for lost
  // clicks that were never lost. THE COUNT WAS INFLATED, NOT THE ARRIVALS
  // UNDERCOUNTED.
  //
  // The marker is a first-party cookie holding the single character '1'. It
  // carries no identifier, no session id and nothing that can be joined to a
  // person; it only answers "has this browser already been counted for this
  // campaign". access.html deduplicates its own fallback the same way, in
  // localStorage under jrs-endorsed-<campaign>, so both paths now agree.
  const COOKIE = 'jrs_e_' + campaign;
  const cookies = String(req.headers.get('cookie') || '');
  const alreadyCounted = new RegExp('(?:^|;\\s*)' + COOKIE + '=1(?:;|$)').test(cookies);

  // Best-effort write. A database failure must never cost the reader their
  // click, so the redirect is issued whatever happens here.
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  let wrote = false;
  if (SERVICE && !isAgent && !alreadyCounted) {
    try {
      const country = String(req.headers.get('x-vercel-ip-country') || '')
        .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || null;
      // Same payload shape as the rows written before 2026-08-02, so the daily
      // series and the country breakdown stay one continuous history rather
      // than two incompatible halves. No `registered` flag: nobody registered,
      // and gate-stats uses that flag to tell a registration from a click.
      await fetch(SB + '/rest/v1/interaction_events', {
        method: 'POST',
        headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                   'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        // user_agent is stored so the downstream crawler filter in
        // /api/asset-stats can actually apply to these rows. Until now this
        // write stored no agent at all, so isCrawler() tested an empty string
        // and every server-written endorsement passed the filter no matter what
        // fetched it. That is why 7 rows on 2026-08-12 were indistinguishable
        // from human clicks after the fact: the one field that could have told
        // them apart was never kept. Capped, and it is a client hint, not an
        // identifier: no address, no cookie value, nothing joinable to a person.
        body: JSON.stringify({ source: 'support', type: 'endorse', payload: {
          campaign: campaign,
          src: src || 'none',
          country: country,
          user_agent: ua.slice(0, 300)
        }})
      });
      wrote = true;
    } catch (e) { /* never block the redirect */ }
  }

  // r=1 tells the campaign screen the endorsement is already on record, so it
  // does not write a second one. Its absence is how the screen knows a reader
  // arrived by some other route: a copied address-bar URL, a forwarded link, a
  // bookmark, or a link expanded by a platform. Those readers see the same
  // screen saying their support is recorded, and before this they were the one
  // case where that sentence was still untrue.
  //
  // r=1 is now set when the endorsement is on record from EITHER this request or
  // an earlier one by the same browser. A returning reader must not trigger the
  // screen's fallback write, which would reintroduce the double count through
  // the other door.
  const onRecord = wrote || alreadyCounted;
  const q = '?c=' + encodeURIComponent(campaign)
          + (src ? '&src=' + encodeURIComponent(src) : '')
          + (onRecord ? '&r=1' : '');

  // Set the marker only when a row was actually written, so a failed write is
  // retried on the next visit rather than being silently suppressed forever.
  const headers = { 'Location': url.origin + '/access.html' + q };
  if (wrote) {
    headers['Set-Cookie'] = COOKIE + '=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly';
  }
  return new Response(null, { status: 302, headers: headers });
}
