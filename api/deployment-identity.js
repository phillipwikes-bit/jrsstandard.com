// Preview-only non-sensitive source identity for release acceptance.
// This is not an authorization to publish, process real records, or sell software.
// If Vercel's system environment fields are not exposed, the route fails closed.
export const config = { runtime:'edge' };

function json(payload,status=200) {
  return new Response(JSON.stringify(payload),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store, max-age=0',
    'X-Robots-Tag':'noindex, nofollow',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer'
  }});
}
export default async function handler(req) {
  if (req.method!=='GET') return json({error:'method_not_allowed'},405);
  const env=(typeof process!=='undefined'&&process.env)||{};
  if (env.VERCEL_ENV!=='preview' || !/^[a-f0-9]{40}$/.test(env.VERCEL_GIT_COMMIT_SHA||'')) {
    return json({error:'preview_build_identity_unavailable'},503);
  }
  return json({
    channel:'preview',
    commit_sha:env.VERCEL_GIT_COMMIT_SHA,
    assessment:'source_identity_only_not_release_authorization',
    engine_release:'NO_GO_NOT_VERIFIED'
  });
}
