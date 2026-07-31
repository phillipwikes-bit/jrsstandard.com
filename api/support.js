export const config = { runtime: 'edge' };

// One-click support / endorsement counter for the JRS initiatives.
// GET /api/support?c=<campaign>&src=<channel> records one append-only endorsement
// in public.interaction_events (source 'support', payload {campaign, src, country})
// via the service role, then 302-redirects to the thank-you page. The write is
// best-effort and never blocks the redirect. No PII: country is the edge ISO code
// only. Writes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS), same as /api/dl.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function normCampaign(c){
  c = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
  if (c === 'rtkw' || c === 'rights' || c === 'righttoknowwhy') return 'rtkw';
  if (c === 'defend' || c === 'decisions' || c === 'decisionsyoucandefend') return 'defend';
  return 'general';
}

export default async function handler(req){
  const url = new URL(req.url);
  const campaign = normCampaign(url.searchParams.get('c'));
  const src = String(url.searchParams.get('src') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || null;

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (SERVICE) {
    const H = { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };
    const country = String(req.headers.get('x-vercel-ip-country') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || null;
    try {
      await fetch(SB + '/rest/v1/interaction_events', { method: 'POST', headers: H,
        body: JSON.stringify({ source: 'support', type: 'endorse', payload: { campaign: campaign, src: src, country: country } }) });
    } catch (e) { /* swallow: the thank-you page must still load */ }
  }

  return Response.redirect(url.origin + '/supported.html?c=' + encodeURIComponent(campaign), 302);
}
