export const config = { runtime: 'edge' };

// Only the public Turnstile site key is returned, never its secret.
export default async function handler(req) {
  if(req.method!=='GET')return new Response('Method not allowed',{status:405});
  const E=(typeof process!=='undefined' && process.env)||{};
  const enabled=!!(E.TURNSTILE_SITE_KEY && E.TURNSTILE_SECRET_KEY && E.SUPABASE_SERVICE_ROLE_KEY);
  return new Response(JSON.stringify({enabled,site_key:enabled?E.TURNSTILE_SITE_KEY:null}),{
    headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
  });
}
