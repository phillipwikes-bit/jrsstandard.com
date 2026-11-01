import { next } from '@vercel/functions';
import { ownerAccess } from './api/_owner-auth.js';

// This is a server-side routing gate, applied BEFORE the static HTML response.
// Client-side overlays and noindex headers do not protect participant PII.
// Never log a cookie, bearer token, or request headers.
const OWNER_PATHS = new Set(['/programme-status-9872fb93cc94.html', '/programme--9872fb93cc94.html']);
export default async function proxy(request) {
  const { pathname } = new URL(request.url);
  if (!OWNER_PATHS.has(pathname)) return next();
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { 'Cache-Control':'private, no-store', 'Allow':'GET, HEAD' }
    });
  }
  const denied = await ownerAccess(request);
  if (denied) {
    if (denied.status === 401) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location':'/owner-login.html',
          'Cache-Control':'private, no-store',
          'X-Robots-Tag':'noindex, nofollow',
          'Referrer-Policy':'no-referrer'
        }
      });
    }
    // Unconfigured or failed authorization is a closed door, not the HTML.
    return denied;
  }
  return next();
}
