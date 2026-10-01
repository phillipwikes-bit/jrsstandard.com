// Recomputes track status from GATE-DEFINITIONS.json and GATE-RESULTS.json.
// A PASS counts only if every evidence path exists and matches its recorded sha256.
// It checks documentary structure and hashes; it cannot decide title, authority,
// compliance, or whether an approval is genuine.
//
// Usage: node validate-gates.mjs            (prints computed track statuses; exit 0
//                                            if the stored statuses match the computation)
//        node validate-gates.mjs --selftest (shows a false PASS is caught)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const BASE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

export function evaluate(defs, results, base) {
  const problems = [];
  const byId = Object.fromEntries(results.gates.map((g) => [g.id, g]));
  const tracks = {};
  for (const [t, spec] of Object.entries(defs.tracks)) {
    let ready = true;
    for (const g of defs.gates.filter((x) => x.track === t)) {
      const r = byId[g.id];
      if (!r) { problems.push(g.id + ': no result'); ready = false; continue; }
      if (!defs.statuses.includes(r.status)) { problems.push(g.id + ': unknown status ' + r.status); ready = false; continue; }
      if (r.status === 'PASS') {
        if (!Array.isArray(r.evidence) || r.evidence.length === 0) { problems.push(g.id + ': PASS without evidence'); ready = false; continue; }
        for (const e of r.evidence) {
          const p = path.join(base, e.path);
          if (!fs.existsSync(p)) { problems.push(g.id + ': evidence missing ' + e.path); ready = false; }
          else if (sha(p) !== e.sha256) { problems.push(g.id + ': evidence hash mismatch ' + e.path); ready = false; }
        }
        if (g.requires_owner_decision && !r.owner_decision) { problems.push(g.id + ': PASS without the owner decision it requires'); ready = false; }
      } else if (g.critical) { ready = false; }
    }
    tracks[t] = ready ? spec.ready_status : spec.else;
  }
  return { tracks, problems };
}

function load() {
  return {
    defs: JSON.parse(fs.readFileSync(path.join(BASE, 'gates/GATE-DEFINITIONS.json'), 'utf8')),
    results: JSON.parse(fs.readFileSync(path.join(BASE, 'gates/GATE-RESULTS.json'), 'utf8')),
  };
}

if (process.argv.includes('--selftest')) {
  const { defs, results } = load();
  let ok = 0, bad = 0;
  const t = (name, cond) => { cond ? ok++ : bad++; console.log((cond ? 'PASS  ' : 'FAIL  ') + name); };
  const forge = (mut) => { const r = JSON.parse(JSON.stringify(results)); mut(r); return evaluate(defs, r, BASE); };
  const allPass = (r, track) => r.gates.filter((g) => defs.gates.find((d) => d.id === g.id && d.track === track)).forEach((g) => { g.status = 'PASS'; });
  t('PASS with no evidence is rejected', forge((r) => { allPass(r, 'A'); r.gates.filter((g) => g.id.startsWith('D')).forEach((g) => { g.evidence = []; }); }).tracks.A === 'DEMO_BLOCKED');
  t('PASS citing a missing file is rejected', forge((r) => { allPass(r, 'A'); r.gates.filter((g) => g.id.startsWith('D')).forEach((g) => { g.evidence = [{ path: 'no/such/file.json', sha256: '0'.repeat(64) }]; }); }).tracks.A === 'DEMO_BLOCKED');
  t('PASS citing an altered file is rejected', forge((r) => { allPass(r, 'A'); r.gates.filter((g) => g.id.startsWith('D')).forEach((g) => { g.evidence = [{ path: 'track-a/CAPABILITY-MATRIX.json', sha256: 'f'.repeat(64) }]; }); }).tracks.A === 'DEMO_BLOCKED');
  t('PASS on D5 without an owner decision is rejected', forge((r) => { allPass(r, 'A'); r.gates.filter((g) => g.id.startsWith('D')).forEach((g) => { g.evidence = [{ path: 'track-a/CAPABILITY-MATRIX.json', sha256: sha(path.join(BASE, 'track-a/CAPABILITY-MATRIX.json')) }]; delete g.owner_decision; }); }).problems.some((p) => p.startsWith('D5')));
  t('one critical NOT ASSESSED keeps the track blocked', evaluate(defs, results, BASE).tracks.B === 'BLOCKED');
  t('an unknown status is rejected', forge((r) => { r.gates[0].status = 'LOOKS_FINE'; }).problems.some((p) => /unknown status/.test(p)));
  console.log('\n' + (ok + bad) + ' checks, ' + bad + ' failed');
  process.exit(bad ? 1 : 0);
} else {
  const { defs, results } = load();
  const { tracks, problems } = evaluate(defs, results, BASE);
  console.log(JSON.stringify({ computed: tracks, stored: results.track_status, problems }, null, 2));
  const match = Object.keys(tracks).every((k) => results.track_status[k] === tracks[k]);
  process.exit(match ? 0 : 1);
}
