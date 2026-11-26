// DS-N1 enterprise workspace (2026-11-19): a reference implementation of the
// controls a licensee needs around the review engine.
//
//   - Organisations (tenants) and matters; no data crosses an organisation.
//   - Users with roles: admin, reviewer, approver, auditor. Access tokens are
//     stored only as scrypt hashes.
//   - Role checks on every operation; finalising or overriding needs approver.
//   - Retention and deletion: reviews past an organisation's retention period
//     are purged; a content-free tombstone stays in the audit log.
//   - A hash-chained audit log in which every entry is signed with Ed25519, and
//     an offline verifier that needs only the public key.
//   - Real records are refused. Only data_classification
//     'constructed_fictional' is accepted. Processing real records needs
//     separate legal and security approval and is not switchable from here.
//
// This is a local reference implementation tested on fictional data. It is not
// a hosted service and makes no security certification claim.
import { createHash, generateKeyPairSync, sign, verify, randomBytes, scryptSync, timingSafeEqual, createPublicKey, createPrivateKey } from 'node:crypto';
import { openReview, applyAction, deriveState, buildReport } from '../index.mjs';

export const WORKSPACE_VERSION = 'ds-n1.enterprise-workspace/0.1.0-dev';
export const ROLES = Object.freeze(['admin', 'reviewer', 'approver', 'auditor']);
const APPROVER_ACTIONS = new Set(['final_disposition', 'override']);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const canonical = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((key) => [key, x[key]])) : x));

export class WorkspaceError extends Error {
  constructor(code, detail) { super(`${code}: ${detail}`); this.code = code; this.detail = detail; }
}
const deny = (detail) => { throw new WorkspaceError('FORBIDDEN', detail); };

function hashToken(token, salt) { return scryptSync(token, salt, 32).toString('hex'); }

export function createWorkspace({ now = () => new Date().toISOString(), privateKey, restore, expectHead } = {}) {
  if (restore) privateKey = createPrivateKey(restore.private_key_pem);
  const keys = privateKey
    ? { privateKey, publicKey: createPublicKey(privateKey) }
    : generateKeyPairSync('ed25519');
  const publicKeyPem = keys.publicKey.export({ type: 'spki', format: 'pem' });
  const orgs = new Map(); // org_id -> { org_id, name, retention_days, matters: Map }
  const users = new Map(); // user_id -> { user_id, org_id, name, roles, salt, token_hash }
  const reviews = new Map(); // review_id -> { review_id, org_id, matter_id, created_at, session }
  const audit = [];
  let seqId = 0;
  if (restore) {
    const check = verifyAuditLog(restore.audit, publicKeyPem, { full: true, expectHead: expectHead || null });
    if (!check.ok) throw new WorkspaceError('TAMPERED', `saved audit log failed verification: ${check.problems[0]}`);
    for (const o of restore.orgs) orgs.set(o.org_id, { ...o, matters: new Map(o.matters.map((m) => [m.matter_id, m])) });
    for (const u of restore.users) users.set(u.user_id, { ...u });
    for (const r of restore.reviews) reviews.set(r.review_id, { ...r });
    audit.push(...restore.audit);
    seqId = restore.seq_id;
  }
  const newId = (p) => `${p}-${(++seqId).toString().padStart(4, '0')}-${randomBytes(3).toString('hex')}`;

  function log(actor, org_id, action, target, detail = {}) {
    const prev = audit.length ? audit[audit.length - 1].hash : null;
    const body = { seq: audit.length, at: now(), actor, org_id, action, target, detail, prev_hash: prev };
    const hash = sha(canonical(body));
    const signature = sign(null, Buffer.from(hash, 'hex'), keys.privateKey).toString('base64');
    audit.push({ ...body, hash, signature });
  }

  function issueToken(user) {
    const token = randomBytes(24).toString('base64url');
    user.salt = randomBytes(16).toString('hex');
    user.token_hash = hashToken(token, user.salt);
    return token;
  }

  // Bootstrap: an organisation and its first admin. Returns the admin token once.
  function createOrganisation({ name, retention_days = 365, admin_name }) {
    if (!name || !admin_name) throw new WorkspaceError('INVALID', 'organisation name and admin name are required');
    if (!Number.isInteger(retention_days) || retention_days < 1) throw new WorkspaceError('INVALID', 'retention_days must be a positive whole number');
    const org = { org_id: newId('org'), name, retention_days, matters: new Map() };
    orgs.set(org.org_id, org);
    const admin = { user_id: newId('usr'), org_id: org.org_id, name: admin_name, roles: ['admin'] };
    const token = issueToken(admin);
    users.set(admin.user_id, admin);
    log('system', org.org_id, 'create_organisation', org.org_id, { retention_days });
    log('system', org.org_id, 'create_user', admin.user_id, { roles: admin.roles });
    return { org_id: org.org_id, admin_user_id: admin.user_id, admin_token: token };
  }

  function authenticate(token) {
    if (typeof token !== 'string' || !token) throw new WorkspaceError('UNAUTHENTICATED', 'a token is required');
    for (const u of users.values()) {
      if (!u.token_hash) continue;
      const a = Buffer.from(hashToken(token, u.salt), 'hex'), b = Buffer.from(u.token_hash, 'hex');
      if (a.length === b.length && timingSafeEqual(a, b)) return u;
    }
    throw new WorkspaceError('UNAUTHENTICATED', 'token not recognised');
  }
  const need = (u, role) => { if (!u.roles.includes(role)) deny(`${role} role required`); };
  const ownReview = (u, review_id) => {
    const r = reviews.get(review_id);
    if (!r || r.org_id !== u.org_id) throw new WorkspaceError('NOT_FOUND', 'no such review in your organisation');
    return r;
  };

  function createUser(token, { name, roles }) {
    const u = authenticate(token); need(u, 'admin');
    if (!name || !Array.isArray(roles) || !roles.length || roles.some((r) => !ROLES.includes(r))) throw new WorkspaceError('INVALID', `roles must be drawn from ${ROLES.join(', ')}`);
    const user = { user_id: newId('usr'), org_id: u.org_id, name, roles: [...new Set(roles)] };
    const t = issueToken(user);
    users.set(user.user_id, user);
    log(u.user_id, u.org_id, 'create_user', user.user_id, { roles: user.roles });
    return { user_id: user.user_id, token: t };
  }

  function revokeUser(token, user_id) {
    const u = authenticate(token); need(u, 'admin');
    const target = users.get(user_id);
    if (!target || target.org_id !== u.org_id) throw new WorkspaceError('NOT_FOUND', 'no such user in your organisation');
    target.token_hash = null;
    log(u.user_id, u.org_id, 'revoke_user', user_id);
  }

  function createMatter(token, { name }) {
    const u = authenticate(token); need(u, 'admin');
    if (!name) throw new WorkspaceError('INVALID', 'matter name is required');
    const m = { matter_id: newId('mat'), name };
    orgs.get(u.org_id).matters.set(m.matter_id, m);
    log(u.user_id, u.org_id, 'create_matter', m.matter_id);
    return m;
  }

  function openReviewFor(token, { matter_id, record }) {
    const u = authenticate(token); need(u, 'reviewer');
    if (!orgs.get(u.org_id).matters.has(matter_id)) throw new WorkspaceError('NOT_FOUND', 'no such matter in your organisation');
    if (!record || record.data_classification !== 'constructed_fictional') {
      log(u.user_id, u.org_id, 'refuse_record', matter_id, { reason: 'not constructed_fictional' });
      throw new WorkspaceError('REAL_RECORDS_NOT_AUTHORISED', 'only constructed fictional records are accepted; real records need separate legal and security approval');
    }
    const session = openReview(record, { at: now() });
    const r = { review_id: newId('rev'), org_id: u.org_id, matter_id, created_at: now(), session };
    reviews.set(r.review_id, r);
    log(u.user_id, u.org_id, 'open_review', r.review_id, { matter_id, record_sha256: sha(JSON.stringify(record)) });
    return { review_id: r.review_id, status: deriveState(session).status };
  }

  function act(token, review_id, action) {
    const u = authenticate(token);
    if (!u.roles.includes('reviewer') && !u.roles.includes('approver')) deny('reviewer or approver role required');
    if (APPROVER_ACTIONS.has(action.type)) need(u, 'approver');
    const r = ownReview(u, review_id);
    r.session = applyAction(r.session, { ...action, at: now(), reviewer: { reviewer_id: u.user_id, name: u.name } });
    const status = deriveState(r.session).status;
    log(u.user_id, u.org_id, 'review_action', review_id, { type: action.type, status });
    return { status };
  }

  function report(token, review_id) {
    const u = authenticate(token);
    if (!u.roles.some((x) => ['reviewer', 'approver', 'auditor'].includes(x))) deny('reviewer, approver or auditor role required');
    const r = ownReview(u, review_id);
    log(u.user_id, u.org_id, 'read_report', review_id);
    return buildReport(r.session, { generated_at: now() });
  }

  // Delete reviews older than the organisation's retention period. Only a
  // tombstone (review id, matter, dates) is kept, in the signed log.
  function purgeExpired(token) {
    const u = authenticate(token); need(u, 'admin');
    const days = orgs.get(u.org_id).retention_days;
    const cutoff = Date.parse(now()) - days * 86400000;
    const purged = [];
    for (const r of [...reviews.values()]) {
      if (r.org_id === u.org_id && Date.parse(r.created_at) < cutoff) {
        reviews.delete(r.review_id);
        purged.push(r.review_id);
        log(u.user_id, u.org_id, 'purge_review', r.review_id, { matter_id: r.matter_id, created_at: r.created_at, retention_days: days });
      }
    }
    return { purged };
  }

  function auditLog(token) {
    const u = authenticate(token);
    if (!u.roles.includes('auditor') && !u.roles.includes('admin')) deny('auditor or admin role required');
    log(u.user_id, u.org_id, 'read_audit', u.org_id);
    return audit.filter((e) => e.org_id === u.org_id).map((e) => ({ ...e }));
  }

  // Full state for an encrypted save (see store.mjs). Contains the signing key
  // and token hashes, so it must never be written unencrypted.
  function snapshot() {
    return {
      version: WORKSPACE_VERSION, seq_id: seqId,
      private_key_pem: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }),
      orgs: [...orgs.values()].map((o) => ({ ...o, matters: [...o.matters.values()] })),
      users: [...users.values()].map((u) => ({ ...u })),
      reviews: [...reviews.values()].map((r) => ({ ...r })),
      audit: audit.map((e) => ({ ...e })),
    };
  }

  return {
    version: WORKSPACE_VERSION, publicKeyPem, snapshot,
    // The last entry's sequence and hash, to keep outside the saved file (for
    // example printed, emailed to an auditor, or stored elsewhere) and give back
    // as expectHead on restore.
    auditHead: () => (audit.length ? { seq: audit[audit.length - 1].seq, hash: audit[audit.length - 1].hash } : null),
    createOrganisation, createUser, revokeUser, createMatter,
    openReview: openReviewFor, act, report, purgeExpired, auditLog,
    _fullAuditForVerification: () => audit.map((e) => ({ ...e })),
  };
}

// Offline verification: chain order, hashes and Ed25519 signatures. Needs only
// the public key. A filtered (single-organisation) view is verified for
// signatures and hashes; chain links are checked where entries are adjacent.
// Two kinds of check (2026-11-26, after an external audit showed a log with a
// deleted entry still verified):
//   - an extract (one organisation's entries, the default): each entry is
//     signed and, where two entries are consecutive, linked;
//   - a full log ({ full: true }, used on restore): must start at entry 0 and
//     run without a gap, every entry linked to the one before.
// A deleted final entry, or a whole older file put back, cannot be seen from
// inside the file (whoever can decrypt it also holds the signing key). Keep
// auditHead() somewhere else and pass it as expectHead to catch that.
export function verifyAuditLog(entries, publicKeyPem, { full = false, expectHead = null } = {}) {
  const key = createPublicKey(publicKeyPem);
  const problems = [];
  if (full) {
    entries.forEach((e, i) => { if (e.seq !== i) problems.push(`entry at position ${i} has sequence ${e.seq}: the log has a gap or is out of order`); });
    entries.forEach((e, i) => { if (i > 0 && e.prev_hash !== entries[i - 1].hash) problems.push(`entry ${e.seq}: not linked to entry ${entries[i - 1].seq}`); });
  }
  if (expectHead) {
    const last = entries[entries.length - 1];
    if (!last || last.seq !== expectHead.seq || last.hash !== expectHead.hash) problems.push(`the log ends at entry ${last ? last.seq : 'none'}, but the separately kept head is entry ${expectHead.seq}: entries are missing or an older log was restored`);
  }
  entries.forEach((e, i) => {
    const { hash, signature, ...body } = e;
    if (sha(canonical(body)) !== hash) problems.push(`entry ${e.seq}: content does not match its hash`);
    if (!verify(null, Buffer.from(hash, 'hex'), key, Buffer.from(signature, 'base64'))) problems.push(`entry ${e.seq}: signature invalid`);
    const prev = entries[i - 1];
    if (prev && e.seq <= prev.seq) problems.push(`entry ${e.seq}: out of order after entry ${prev.seq}`);
    if (prev && prev.seq === e.seq - 1 && e.prev_hash !== prev.hash) problems.push(`entry ${e.seq}: chain broken`);
    if (!prev && e.seq === 0 && e.prev_hash !== null) problems.push('entry 0: must start the chain');
  });
  return { ok: problems.length === 0, entries: entries.length, problems };
}
