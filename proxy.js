import { next } from '@vercel/functions';
import { ownerAccess } from './api/_owner-auth.js';

// Private owner routes are checked BEFORE static HTML or API execution.
// Public source and obscure route names are not security boundaries.
const PRIVATE_PAGES = new Set([
  '/programme-status-9872fb93cc94.html',
  '/programme--9872fb93cc94.html'
]);
const PRIVATE_APIS = new Set([
  '/api/leads-4b7e2c9af106d385',
  '/api/people-9dd1ecdf6f8cdfd4',
  '/api/roster-8c3f1a9e7b2d6045',
  '/api/geo-4e8b2d7f9a1c3065',
  '/api/recheck-answers-b1a768e88d3e48bd',
  '/api/variance-6b1d90fa2c47e8b3',
  '/api/enroll-admin',
  '/api/support-contacts',
  '/api/coauthor-stats',
  '/api/contributor-stats',
  '/api/checkout-stats',
  '/api/owner-progress',
  '/api/site-inquiry-stats',
  '/api/owner-release-readiness'
]);
export default async function proxy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  const isPage = PRIVATE_PAGES.has(pathname);
  const isAPI = PRIVATE_APIS.has(pathname);
  if (!isPage && !isAPI) return next();
  // Permit no cross-origin or unauthenticated preflight on private readers.
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response(JSON.stringify({error:'method_not_allowed'}), {
      status:405,
      headers:{'Content-Type':'application/json','Cache-Control':'private, no-store',
        'X-Robots-Tag':'noindex, nofollow','Allow':'GET, HEAD'}
    });
  }
  const denied = await ownerAccess(request);
  if (denied) return denied;
  // API readers also enforce their own gate before making any database call.
  return next();
}
