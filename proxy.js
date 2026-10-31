import { next } from '@vercel/functions';
import { ownerAccess } from './api/_owner-auth.js';

// This is a server-side routing gate, applied BEFORE the static HTML response.
// Client-side overlays and noindex headers do not protect participant PII.
// Never log a cookie, bearer token, or request headers.
// The first-party dashboard renders these six service-role-backed reporting
// endpoints. Their historical handler bodies are frozen in the 24-file source
// baseline, so this draft adds a boundary gate without changing source data,
// event grain or the existing controlled source exceptions.
export const OWNER_HTML_PATHS = Object.freeze([
  '/programme-status-9872fb93cc94.html',
  '/programme--9872fb93cc94.html'
]);
export const OWNER_METRIC_PATHS = Object.freeze([
  '/api/access-stats',
  '/api/enroll-stats',
  '/api/orgpilot-stats',
  '/api/gate-stats',
  '/api/geo-stats',
  '/api/asset-stats'
]);
const HTML_PATHS = new Set(OWNER_HTML_PATHS);
const OWNER_PATHS = new Set([...OWNER_HTML_PATHS, ...OWNER_METRIC_PATHS]);
export default async function proxy(request) {
  const { pathname } = new URL(request.url);
  if (!OWNER_PATHS.has(pathname)) return next();
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { 'Cache-Control':'private, no-store', 'Allow':'GET, HEAD',
        'X-Robots-Tag':'noindex, nofollow', 'Referrer-Policy':'no-referrer' }
    });
  }
  const denied = await ownerAccess(request);
  if (denied) {
    if (denied.status === 401 && HTML_PATHS.has(pathname)) {
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
