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

  // Best-effort write. A database failure must never cost the reader their
  // click, so the redirect is issued whatever happens here.
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (SERVICE) {
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
        body: JSON.stringify({ source: 'support', type: 'endorse', payload: {
          campaign: campaign,
          src: src || 'none',
          country: country
        }})
      });
    } catch (e) { /* never block the redirect */ }
  }

  const q = '?c=' + encodeURIComponent(campaign) + (src ? '&src=' + encodeURIComponent(src) : '');
  return Response.redirect(url.origin + '/access.html' + q, 302);
}
