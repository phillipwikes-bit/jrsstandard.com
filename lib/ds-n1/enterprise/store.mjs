// Encrypted persistence for the enterprise workspace (reference implementation).
// AES-256-GCM with a key derived by scrypt from a passphrase the operator
// supplies (for example from an environment variable). The file holds the
// signing key, token hashes and review data, so it is never written in clear.
// On load the signed audit log is verified; a tampered file is refused.
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'node:crypto';
import { createWorkspace, WorkspaceError } from './workspace.mjs';

const FORMAT = 'ds-n1.enterprise-store/1';

export function saveWorkspace(ws, path, passphrase) {
  if (!passphrase || passphrase.length < 16) throw new WorkspaceError('INVALID', 'a passphrase of at least 16 characters is required');
  const salt = randomBytes(16), iv = randomBytes(12);
  const key = scryptSync(passphrase, salt, 32);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([c.update(JSON.stringify(ws.snapshot()), 'utf8'), c.final()]);
  const out = JSON.stringify({ format: FORMAT, salt: salt.toString('base64'), iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: body.toString('base64') });
  writeFileSync(`${path}.tmp`, out, { mode: 0o600 });
  renameSync(`${path}.tmp`, path);
}

export function loadWorkspace(path, passphrase, opts = {}) {
  const f = JSON.parse(readFileSync(path, 'utf8'));
  if (f.format !== FORMAT) throw new WorkspaceError('INVALID', `unknown store format ${f.format}`);
  const key = scryptSync(passphrase || '', Buffer.from(f.salt, 'base64'), 32);
  const d = createDecipheriv('aes-256-gcm', key, Buffer.from(f.iv, 'base64'));
  d.setAuthTag(Buffer.from(f.tag, 'base64'));
  let clear;
  try { clear = Buffer.concat([d.update(Buffer.from(f.data, 'base64')), d.final()]).toString('utf8'); }
  catch { throw new WorkspaceError('UNREADABLE', 'wrong passphrase or the file was altered'); }
  return createWorkspace({ ...opts, restore: JSON.parse(clear) });
}
