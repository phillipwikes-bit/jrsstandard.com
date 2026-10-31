// New free-initiative support action. Explicit POST only; no legacy writer edits.
// Records an anonymous-by-design interaction in the existing 'support/endorse'
// event family, not a verified unique person or organizational endorsement.
// Country and a bounded user agent are operational metadata; avoid claiming
// that all network or browser metadata is anonymous under every privacy law.
export const config = { runtime: 'edge' };
const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';
const campaigns = new Set(['rtkw', 'defend']);
const simple = (obj, status, extra = {}) => new Response(JSON.stringify(obj), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8',
                    'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex',
                    ...extra }
});
export default async function handler(req) {
  if (req.method !== 'POST') return simple({ok:false,code:'method_not_allowed'},405,{Allow:'POST'});
  const origin = req.headers.get('origin');
  const target = new URL(req.url);
  if (origin !== target.origin || req.headers.get('sec-fetch-site') === 'cross-site')
    return simple({ok:false,code:'same_origin_required'},403);
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type') || ''))
    return simple({ok:false,code:'json_required'},415);
  let raw;
  try {
    const length = Number(req.headers.get('content-length') || 0);
    if (length > 256) return simple({ok:false,code:'body_too_large'},413);
    raw = await req.text();
    if (raw.length > 256) return simple({ok:false,code:'body_too_large'},413);
  } catch {
    return simple({ok:false,code:'invalid_request'},400);
  }
  let input;
  try { input = JSON.parse(raw); } catch { return simple({ok:false,code:'invalid_json'},400); }
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      !campaigns.has(input.campaign))
    return simple({ok:false,code:'invalid_campaign'},422);
  // Source-isolated preview/local verification. A preview can inherit the
  // production database configuration. No historic support event may be
  // created or acknowledged by a nonproduction deployment.
  const deploymentEnv = (typeof process!=='undefined' && process.env &&
                         process.env.VERCEL_ENV) || '';
  if (deploymentEnv !== 'production')
    return simple({ok:true,recorded:false,preview_only:true},200);

  // Align with the existing historical support cookie. One recorded action per
  // browser/campaign is only a coarse dedupe; it is not a unique-person count.
  const key = 'jrs_e_' + input.campaign;
  const cookies = req.headers.get('cookie') || '';
  if (new RegExp('(?:^|;\\s*)' + key + '=1(?:;|$)').test(cookies))
    return simple({ok:true,recorded:false,already_recorded:true},200);

  const ua = (req.headers.get('user-agent') || '').slice(0,300);
  if (!ua || /bot|spider|crawl|preview|headless|curl|wget|python-requests/i.test(ua))
    return simple({ok:false,code:'automation_not_counted'},403);

  const service = (typeof process !== 'undefined' && process.env &&
                   process.env.SUPABASE_SERVICE_ROLE_KEY) || '';
  if (!service) return simple({ok:false,code:'recording_unavailable'},503);
  const country = (req.headers.get('x-vercel-ip-country') || '')
    .toUpperCase().replace(/[^A-Z]/g,'').slice(0,2) || null;
  let accepted = false;
  try {
    const response = await fetch(SB + '/rest/v1/interaction_events', {
      method:'POST',
      headers: { apikey:service, Authorization:'Bearer ' + service,
                 'Content-Type':'application/json', Prefer:'return=minimal' },
      body: JSON.stringify({source:'support',type:'endorse',
        payload:{campaign:input.campaign,src:'initiative-page',country,user_agent:ua}})
    });
    accepted = response.ok;
  } catch {
    accepted = false;
  }
  // Do not set a deduplication cookie or claim a successful record when the
  // database returned an error, including a non-2xx HTTP response.
  if (!accepted) return simple({ok:false,recorded:false,code:'recording_unavailable'},503);
  const marker = key + '=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly';
  return simple({ok:true,recorded:true,already_recorded:false},200,{'Set-Cookie':marker});
}
