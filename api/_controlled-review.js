export const config = { runtime: 'edge' };

const CLOSED_DETAIL = 'The JRS Review Engine is not accepting record text. Do not submit a record through this endpoint. The current candidate remains local and no-go pending independent evaluation, operator-control evidence, counsel review, and recorded release authorization.';
const PUBLIC_STATUS = Object.freeze({
  implementation_status: 'controlled_local_development',
  public_access: false,
  record_submission_accepted: false,
  human_review_required: true,
  release_gates: [
    'independent_labeled_and_adjudicated_holdout_evaluation',
    'operator_control_evidence',
    'counsel_review_of_real_data_flows_and_claims',
    'recorded_owner_release_authorization'
  ]
});

export function unavailable(req, options = {}, maybeOptions) {
  const res = options && typeof options.setHeader === "function" ? options : undefined;
  if (res || maybeOptions) options = maybeOptions || {};
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
    if (options.apiVersion) body.api_version = 'v1';
    return respond(res, 405, body, headers);
  }
  const body = { error, detail, ...PUBLIC_STATUS };
  if (options.apiVersion) body.api_version = 'v1';
  return respond(res, 503, body, headers);
}

function respond(res, status, body, headers) {
  if (!res) return new Response(JSON.stringify(body), { status, headers });
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

export { PUBLIC_STATUS };
