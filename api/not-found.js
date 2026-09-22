export const config = { runtime: 'edge' };

export default function handler() {
  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Page Not Found | JRS</title><style>body{margin:0;background:#050505;color:#f2f2f2;font:16px/1.6 Arial,sans-serif}main{max-width:680px;margin:12vh auto;padding:24px}h1{font:42px Georgia,serif;margin:0 0 12px}p{color:#b3b3b3}a{color:#be9447}</style></head><body><main><h1>Page not found</h1><p>The requested page is not available.</p><p><a href="/">Return to JRS</a></p></main></body></html>`;
  return new Response(body, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}
