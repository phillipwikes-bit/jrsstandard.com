export const config = { runtime: 'edge' };

// RETIRED 2026-08-04. The named people list moved to an opaque, unlinked URL
// (api/people-9dd1ecdf6f8cdfd4.js) so the owner can open it without entering a
// token, matching api/roster-8c3f1a9e7b2d6045.js and the acquisition page.
//
// This endpoint is kept as a closed door rather than deleted: the guessable
// /api/people path must never serve personal data, and a hard 410 makes that
// explicit to anyone who probes it. It reads nothing and returns nothing.

export default async function handler(){
  return new Response(JSON.stringify({ error: 'gone' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
