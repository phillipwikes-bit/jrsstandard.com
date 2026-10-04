export const config = { runtime: 'edge' };

const CLOSED_DETAIL = 'The JRS Review Engine is not accepting record text. Do not submit a record through this endpoint. The current candidate remains local and no-go pending independent evaluation, operator-control evidence, counsel review, and recorded release authorization.';

export function unavailable(req, options = {}) {
  const { error = 'controlled_review_unavailable', detail = CLOSED_DETAIL, apiVersion = false, methods = ['POST'] } = options;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex'
  };
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        'Access-Control-Allow-Methods': [...methods, 'OPTIONS'].join(', '),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  if (!methods.includes(req.method)) {
    const body = { error: 'method_not_allowed', detail: 'Use ' + methods.join(' or ') + '.' };
    if (apiVersion) body.api_version = 'v1';
    return new Response(JSON.stringify(body), { status: 405, headers });
  }
  const body = { error, detail };
  if (apiVersion) body.api_version = 'v1';
  return new Response(JSON.stringify(body), { status: 503, headers });
}
