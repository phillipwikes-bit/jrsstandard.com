#!/usr/bin/env node
// JRS controlled independent-evaluation readiness: offline intake check. INTERNAL.
//   node tools/evaluation-readiness/validate-intake.mjs <declaration.json>
// Reads one intake DECLARATION (metadata and a digest, never a record) and prints the decision.
// Intake is closed, so the best possible outcome is WELL_FORMED_NOT_ADMITTED. Nothing is stored,
// sent or admitted, and a file large enough to hold a record is refused unread.
import { readFileSync, statSync } from 'node:fs';
import { validateIntake } from './lib/intake.js';

const path = process.argv[2];
if (!path) { console.log('usage: validate-intake.mjs <declaration.json>'); process.exit(2); }
if (!/\.json$/.test(path) || statSync(path).size > 32768) { console.log('REFUSED  INT-02 raw_record_text: only a small JSON declaration is accepted; record content is never read.'); process.exit(1); }
let decl; try { decl = JSON.parse(readFileSync(path, 'utf8')); } catch (e) { console.log('REFUSED  INT-01 not_an_intake_declaration: not JSON'); process.exit(1); }
const r = validateIntake(decl);
for (const c of r.codes) console.log((r.decision === 'REFUSED' ? 'REFUSED  ' : 'NOTE     ') + c.control + ' ' + c.code + (c.message ? ': ' + c.message : ''));
console.log(r.decision);
process.exit(r.decision === 'REFUSED' ? 1 : 0);
