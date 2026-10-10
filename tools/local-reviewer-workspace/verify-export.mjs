#!/usr/bin/env node
// Verifies an exported local disposition record against the reviewer packet it names.
//   node tools/local-reviewer-workspace/verify-export.mjs <disposition-record.json> <packet.json>
// Reads only the two files named. No network. Exit 0 if the record is bound to this packet and
// unaltered; 1 otherwise. A pass shows binding and integrity only: it does not authenticate the
// reviewer, establish legal validity, or establish that any disposition is correct.
import { readFileSync } from 'node:fs';
import { verifyExport, LIMITATION } from './app/core.js';

const [recordPath, packetPath] = process.argv.slice(2);
if (!recordPath || !packetPath) { console.error('usage: verify-export.mjs <disposition-record.json> <packet.json>'); process.exit(1); }
let record, packet;
try { record = JSON.parse(readFileSync(recordPath, 'utf8')); } catch { console.error('FAIL  the disposition record is not readable JSON'); process.exit(1); }
try { packet = JSON.parse(readFileSync(packetPath, 'utf8')); } catch { console.error('FAIL  the packet is not readable JSON'); process.exit(1); }
const v = verifyExport(record, packet);
if (!v.ok) { console.log('FAIL  ' + v.problems.length + ' problem(s)'); for (const p of v.problems) console.log('  ' + p); process.exit(1); }
console.log('PASS  the disposition record is bound to this packet (review ' + record.packet.review_id + ') and unaltered.');
console.log('      ' + LIMITATION);
