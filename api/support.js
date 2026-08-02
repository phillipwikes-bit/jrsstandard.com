export const config = { runtime: 'edge' };

// Support entry point for the JRS initiatives.
//
// CHANGED 2026-08-02: support is no longer recorded anonymously. This endpoint
// used to write an endorsement row on a bare GET and redirect straight to the
// thank-you page, which produced a count nobody could verify, contact, or
// convey. It now forwards to the registration page, where the supporter gives
// name, organization, email, and explicit consent before anything is recorded.
// /api/access performs the write and then sends them to the thank-you page.
//
// Every existing link keeps working. The support URLs already distributed in
// emails, email signatures, LinkedIn posts, and 22 site pages all point here,
// so they now land on the registration form instead of completing silently.
// Campaign and src are preserved through the redirect so attribution survives.
//
// Internal smoke-test tags are still honored: they skip the form entirely and
// resolve straight to the thank-you page, so deploy checks never create rows.

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

  // Deploy/smoke checks bypass the form and record nothing.
  if (src && TEST_SRC.indexOf(src) !== -1) {
    return Response.redirect(url.origin + '/supported.html?c=' + encodeURIComponent(campaign), 302);
  }

  const q = '?c=' + encodeURIComponent(campaign) + (src ? '&src=' + encodeURIComponent(src) : '');
  return Response.redirect(url.origin + '/access.html' + q, 302);
}
