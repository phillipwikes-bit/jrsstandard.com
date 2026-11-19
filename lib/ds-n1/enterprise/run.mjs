#!/usr/bin/env node
// Start the enterprise reference server with an encrypted store.
//   DS_STORE_PASSPHRASE='...' node lib/ds-n1/enterprise/run.mjs store.json [port] [org name] [admin name]
// First run creates the organisation and prints the admin token ONCE.
// Later runs load and verify the store. Binds to 127.0.0.1 only.
import { existsSync } from 'node:fs';
import { createWorkspace } from './workspace.mjs';
import { saveWorkspace, loadWorkspace } from './store.mjs';
import { startServer } from './server.mjs';

const [path, port = '8787', orgName = 'Evaluation organisation (fictional data only)', adminName = 'Administrator'] = process.argv.slice(2);
const pass = process.env.DS_STORE_PASSPHRASE;
if (!path || !pass) { console.error('Usage: DS_STORE_PASSPHRASE=... run.mjs store.json [port] [org name] [admin name]'); process.exit(2); }
let ws;
if (existsSync(path)) {
  ws = loadWorkspace(path, pass);
  console.log(`Loaded ${path}; audit log verified.`);
} else {
  ws = createWorkspace();
  const o = ws.createOrganisation({ name: orgName, admin_name: adminName });
  saveWorkspace(ws, path, pass);
  console.log(`Created ${path}.\nAdmin token (shown once, store it safely): ${o.admin_token}`);
}
const { port: p } = await startServer(ws, { port: Number(port), onChange: () => saveWorkspace(ws, path, pass) });
console.log(`Decision Spellcheck enterprise reference server on http://127.0.0.1:${p}`);
