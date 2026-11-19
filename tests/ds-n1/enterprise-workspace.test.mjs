// Enterprise workspace reference implementation (2026-11-19). Fictional records only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createWorkspace, verifyAuditLog, WorkspaceError } from '../../lib/ds-n1/enterprise/workspace.mjs';

const fx = (id) => JSON.parse(readFileSync(new URL(`./fixtures-partner/${id}.json`, import.meta.url), 'utf8'));
let clock = Date.parse('2026-11-19T09:00:00Z');
const now = () => new Date(clock).toISOString();
const code = (fn) => { try { fn(); } catch (e) { return e instanceof WorkspaceError ? e.code : e.code || e.message; } return 'NO_ERROR'; };

function setup() {
  const ws = createWorkspace({ now });
  const a = ws.createOrganisation({ name: 'Org A (fictional)', retention_days: 30, admin_name: 'Admin A' });
  const b = ws.createOrganisation({ name: 'Org B (fictional)', admin_name: 'Admin B' });
  const rev = ws.createUser(a.admin_token, { name: 'Reviewer A', roles: ['reviewer'] });
  const appr = ws.createUser(a.admin_token, { name: 'Approver A', roles: ['approver'] });
  const aud = ws.createUser(a.admin_token, { name: 'Auditor A', roles: ['auditor'] });
  const revB = ws.createUser(b.admin_token, { name: 'Reviewer B', roles: ['reviewer'] });
  const matter = ws.createMatter(a.admin_token, { name: 'Matter 1' });
  return { ws, a, b, rev, appr, aud, revB, matter };
}

test('roles are enforced: reviewers open reviews, only approvers finalise, auditors only read', () => {
  const { ws, a, rev, appr, aud, matter } = setup();
  const { review_id, status } = ws.openReview(rev.token, { matter_id: matter.matter_id, record: fx('AUTH-P01') });
  assert.equal(status, 'READY_FOR_HUMAN_FINALIZATION');
  assert.equal(code(() => ws.act(rev.token, review_id, { type: 'final_disposition', disposition: 'accepted_for_finalization', note: 'Looks complete.' })), 'FORBIDDEN');
  assert.equal(code(() => ws.openReview(aud.token, { matter_id: matter.matter_id, record: fx('AUTH-P01') })), 'FORBIDDEN');
  assert.equal(code(() => ws.createUser(rev.token, { name: 'X', roles: ['admin'] })), 'FORBIDDEN');
  assert.equal(ws.act(appr.token, review_id, { type: 'final_disposition', disposition: 'accepted_for_finalization', note: 'Reviewed and accepted.' }).status, 'READY_FOR_HUMAN_FINALIZATION');
  assert.ok(ws.report(aud.token, review_id));
  assert.equal(code(() => ws.auditLog(rev.token)), 'FORBIDDEN');
  assert.ok(ws.auditLog(a.admin_token).length > 0);
});

test('organisations are separated: another organisation cannot see or act on a review', () => {
  const { ws, b, rev, revB, matter } = setup();
  const { review_id } = ws.openReview(rev.token, { matter_id: matter.matter_id, record: fx('AUTH-D01') });
  assert.equal(code(() => ws.report(revB.token, review_id)), 'NOT_FOUND');
  assert.equal(code(() => ws.act(revB.token, review_id, { type: 'leave_pending', finding_id: 'x' })), 'NOT_FOUND');
  assert.equal(code(() => ws.openReview(revB.token, { matter_id: matter.matter_id, record: fx('AUTH-P01') })), 'NOT_FOUND');
  assert.ok(ws.auditLog(b.admin_token).every((e) => e.org_id === ws.auditLog(b.admin_token)[0].org_id));
});

test('real records are refused, and the refusal is logged', () => {
  const { ws, a, rev, matter } = setup();
  const real = { ...fx('AUTH-P01'), data_classification: 'real' };
  assert.equal(code(() => ws.openReview(rev.token, { matter_id: matter.matter_id, record: real })), 'REAL_RECORDS_NOT_AUTHORISED');
  assert.ok(ws.auditLog(a.admin_token).some((e) => e.action === 'refuse_record'));
});

test('tokens are required, revoked tokens stop working, and tokens are not stored in plain text', () => {
  const { ws, a, rev } = setup();
  assert.equal(code(() => ws.createMatter('wrong', { name: 'M' })), 'UNAUTHENTICATED');
  ws.revokeUser(a.admin_token, rev.user_id);
  assert.equal(code(() => ws.createMatter(rev.token, { name: 'M' })), 'UNAUTHENTICATED');
  assert.ok(!JSON.stringify(ws._fullAuditForVerification()).includes(a.admin_token));
});

test('retention: reviews past the period are purged and leave only a tombstone', () => {
  const { ws, a, rev, matter } = setup();
  const { review_id } = ws.openReview(rev.token, { matter_id: matter.matter_id, record: fx('AUTH-P01') });
  assert.deepEqual(ws.purgeExpired(a.admin_token).purged, [], 'nothing expires early');
  clock += 31 * 86400000;
  assert.deepEqual(ws.purgeExpired(a.admin_token).purged, [review_id]);
  assert.equal(code(() => ws.report(rev.token, review_id)), 'NOT_FOUND');
  const tomb = ws.auditLog(a.admin_token).find((e) => e.action === 'purge_review');
  assert.equal(tomb.target, review_id);
  assert.ok(!JSON.stringify(tomb).includes('Ledgerline'), 'the tombstone holds no record content');
});

test('the audit log is signed and any change is detected offline', () => {
  const { ws, rev, matter } = setup();
  ws.openReview(rev.token, { matter_id: matter.matter_id, record: fx('AUTH-P01') });
  const log = ws._fullAuditForVerification();
  assert.deepEqual(verifyAuditLog(log, ws.publicKeyPem), { ok: true, entries: log.length, problems: [] });
  const edited = structuredClone(log); edited[2].detail = { roles: ['admin'] };
  assert.equal(verifyAuditLog(edited, ws.publicKeyPem).ok, false);
  const reordered = structuredClone(log); [reordered[3], reordered[4]] = [reordered[4], reordered[3]];
  assert.equal(verifyAuditLog(reordered, ws.publicKeyPem).ok, false);
  const other = createWorkspace({ now });
  assert.equal(verifyAuditLog(log, other.publicKeyPem).ok, false, 'a different key does not verify');
});

test('the local server enforces the same rules over HTTP', async () => {
  const { startServer } = await import('../../lib/ds-n1/enterprise/server.mjs');
  const ws = createWorkspace({ now });
  const a = ws.createOrganisation({ name: 'Org A (fictional)', admin_name: 'Admin A' });
  const { server, port } = await startServer(ws);
  const call = async (method, path, token, body) => {
    const r = await fetch(`http://127.0.0.1:${port}${path}`, { method, headers: { authorization: `Bearer ${token || ''}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json() };
  };
  try {
    assert.equal((await call('POST', '/matters', 'nope', { name: 'M' })).status, 401);
    const m = await call('POST', '/matters', a.admin_token, { name: 'M' });
    assert.equal(m.status, 201);
    const rev = (await call('POST', '/users', a.admin_token, { name: 'R', roles: ['reviewer'] })).body;
    const real = { ...fx('AUTH-P01'), data_classification: 'real' };
    assert.equal((await call('POST', '/reviews', rev.token, { matter_id: m.body.matter_id, record: real })).status, 422);
    const opened = await call('POST', '/reviews', rev.token, { matter_id: m.body.matter_id, record: fx('AUTH-P01') });
    assert.equal(opened.status, 201);
    assert.equal((await call('POST', `/reviews/${opened.body.review_id}/actions`, rev.token, { type: 'final_disposition', disposition: 'accepted_for_finalization', note: 'x' })).status, 403);
    assert.equal((await call('GET', `/reviews/${opened.body.review_id}/report`, rev.token)).status, 200);
    const audit = await call('GET', '/audit', a.admin_token);
    const key = (await call('GET', '/public-key')).body.public_key_pem;
    assert.equal(verifyAuditLog(audit.body.entries, key).ok, true);
  } finally { server.close(); }
});

test('state saves encrypted, reloads intact, and a wrong passphrase or altered file is refused', async () => {
  const { saveWorkspace, loadWorkspace } = await import('../../lib/ds-n1/enterprise/store.mjs');
  const { mkdtempSync, readFileSync: rd, writeFileSync: w } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { ws, a, rev, matter } = setup();
  const { review_id } = ws.openReview(rev.token, { matter_id: matter.matter_id, record: fx('AUTH-P01') });
  const path = join(mkdtempSync(join(tmpdir(), 'ws-')), 'store.json');
  const pass = 'correct horse battery staple';
  saveWorkspace(ws, path, pass);
  const raw = rd(path, 'utf8');
  assert.ok(!raw.includes('Ledgerline') && !raw.includes('PRIVATE KEY') && !raw.includes('Admin A'), 'nothing readable on disk');
  const back = loadWorkspace(path, pass, { now });
  assert.equal(back.publicKeyPem, ws.publicKeyPem, 'same signing key');
  assert.ok(back.report(rev.token, review_id), 'tokens and reviews survive');
  assert.ok(back.auditLog(a.admin_token).length >= ws.auditLog(a.admin_token).length - 1);
  assert.equal(code(() => loadWorkspace(path, 'wrong passphrase entirely')), 'UNREADABLE');
  const f = JSON.parse(raw); const b = Buffer.from(f.data, 'base64'); b[10] ^= 1; f.data = b.toString('base64'); w(path, JSON.stringify(f));
  assert.equal(code(() => loadWorkspace(path, pass)), 'UNREADABLE');
  assert.equal(code(() => saveWorkspace(ws, path, 'short')), 'INVALID');
});

test('a restored workspace refuses a snapshot whose audit log was edited', () => {
  const { ws } = setup();
  const snap = ws.snapshot();
  snap.audit[1].detail = { roles: ['admin', 'approver'] };
  assert.equal(code(() => createWorkspace({ restore: snap })), 'TAMPERED');
});
