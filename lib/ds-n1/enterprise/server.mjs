// Local HTTP interface to the enterprise workspace (reference implementation).
// Binds to 127.0.0.1 only. Bearer-token authentication. JSON in and out.
// State is in memory; there is no persistence, TLS or hosting here.
//
//   POST /users            {name, roles}          admin
//   POST /users/:id/revoke                        admin
//   POST /matters          {name}                 admin
//   POST /reviews          {matter_id, record}    reviewer
//   POST /reviews/:id/actions  {type, ...}        reviewer / approver
//   GET  /reviews/:id/report                      reviewer, approver, auditor
//   POST /retention/purge                         admin
//   GET  /audit                                   auditor, admin
//   GET  /public-key                              anyone (to verify the log)
import { createServer } from 'node:http';
import { WorkspaceError } from './workspace.mjs';

const STATUS = { UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, INVALID: 400, REAL_RECORDS_NOT_AUTHORISED: 422 };
const MAX_BODY = 1_000_000;

export function startServer(ws, { port = 0 } = {}) {
  const server = createServer(async (req, res) => {
    const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      let body = {};
      if (req.method === 'POST') {
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (raw.length > MAX_BODY) return send(413, { error: 'TOO_LARGE' }); }
        body = raw ? JSON.parse(raw) : {};
      }
      const p = url.pathname.split('/').filter(Boolean);
      const route = `${req.method} /${p.map((s, i) => (i === 1 && p.length > 1 && p[0] !== 'retention' ? ':id' : s)).join('/')}`;
      switch (route) {
        case 'GET /public-key': return send(200, { public_key_pem: ws.publicKeyPem });
        case 'POST /users': return send(201, ws.createUser(token, body));
        case 'POST /users/:id/revoke': ws.revokeUser(token, p[1]); return send(200, { revoked: p[1] });
        case 'POST /matters': return send(201, ws.createMatter(token, body));
        case 'POST /reviews': return send(201, ws.openReview(token, body));
        case 'POST /reviews/:id/actions': return send(200, ws.act(token, p[1], body));
        case 'GET /reviews/:id/report': return send(200, ws.report(token, p[1]));
        case 'POST /retention/purge': return send(200, ws.purgeExpired(token));
        case 'GET /audit': return send(200, { entries: ws.auditLog(token) });
        default: return send(404, { error: 'NO_ROUTE' });
      }
    } catch (e) {
      if (e instanceof WorkspaceError) return send(STATUS[e.code] || 400, { error: e.code, detail: e.detail });
      if (e instanceof SyntaxError) return send(400, { error: 'INVALID_JSON' });
      if (e && e.code && e.detail) return send(400, { error: e.code, detail: e.detail });
      return send(500, { error: 'INTERNAL' });
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}
