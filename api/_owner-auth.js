// Owner data access must not depend on an unlisted URL. Set this token only in
// the deployment environment and transmit it in an Authorization header.
export async function ownerAccess(req) {
  const token = (typeof process !== 'undefined' && process.env && process.env.OWNER_DASHBOARD_TOKEN) || '';
  const headers = {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Type': 'application/json; charset=utf-8'
  };
  if (!token) return new Response(JSON.stringify({ error: 'owner_access_unavailable' }), { status: 503, headers });
  const authorization = req.headers.get('authorization') || '';
  const presented = /^Bearer [^\s]+$/i.test(authorization) ? authorization.slice(7) : '';
  if (!presented || presented.length !== token.length) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }
  const a = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(presented));
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const aa = new Uint8Array(a), bb = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0 ? null : new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
}
