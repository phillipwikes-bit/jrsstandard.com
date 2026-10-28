// 0.3.4 repair package: regression check for compile-row 2.0 (tool correction TC-04). On the frozen 0.3.3 candidate
// and on 0.3.4, every eligible record is compiled under every research arm by compile-row 1.0 (the study's, which
// passes the study's research profile) and by 2.0 (which passes this package's); the scored fields must be identical.
// Only the graph digests may differ, because the profile's authorization reference is part of the graph identity.
// Offline. Usage: node tools/check-compile-row-v2.mjs <scratch>   (writes out/compile-row-v2-check/RESULTS.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { isolate, loadEngine, PKG } from './harness/engines.mjs';
import { compileRow as compileRow1, ARMS } from '../../study-156-2026-10-27/tools/compile-row.mjs';
import { compileRow as compileRow2, PROFILE } from './compile-row-v2.mjs';
import { substantive, recordText, designedOf, declare, storedMock, relabel, MOCK_OF_ARM, CLOCK } from './lib.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: check-compile-row-v2.mjs <scratch>'); process.exit(2); }
const OUT = join(PKG, 'out', 'compile-row-v2-check');
if (existsSync(OUT)) { console.error('exists: ' + OUT); process.exit(2); }
mkdirSync(SCRATCH, { recursive: true });
const DIGESTS = ['graph_digest', 'behaviour_digest', 'default_normalized_sha256', 'error_normalized', 'ms'];
const strip = (r) => JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !DIGESTS.includes(k))));
const result = {};
for (const version of ['0.3.3-research-candidate', '0.3.4-research-candidate']) {
  const iso = isolate(version, SCRATCH, { requireManifest: version !== '0.3.4-research-candidate' || existsSync(join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')) });
  const E = await loadEngine(iso);
  const arms = ARMS.filter((a) => a.profile).map((a) => Object.assign({}, a, { engine: version }));
  let compared = 0, identical = 0, digestsDiffer = 0; const differing = [];
  for (const e of substantive) {
    const id = e.source_id, text = recordText(id);
    for (const a of arms) {
      const cand = a.mock ? relabel(storedMock(MOCK_OF_ARM[a.id], id), E.research.RESEARCH_PROMPT_VERSION) : null;
      const x = { text, declaration: declare(e), cand, designed: designedOf(id), eligible: true, clock: CLOCK, fixtureId: id, rpv: E.research.RESEARCH_PROMPT_VERSION };
      const r1 = compileRow1(E, a, x), r2 = compileRow2(E, a, Object.assign({}, x, { profile: PROFILE }));
      compared++; if (strip(r1) === strip(r2)) identical++; else differing.push(a.id + '/' + id); if (r1.graph_digest !== r2.graph_digest) digestsDiffer++;
    }
  }
  result[version] = { compared, scored_fields_identical: identical, differing: differing.slice(0, 20), graph_digests_differ: digestsDiffer, manifest_sha256: iso.manifest_sha256, released: iso.release() };
}
const out = { results_format: 'jrs-0.3.4-compile-row-check/1.0.0', correction: 'TC-04 (registers/TOOL_CORRECTIONS.json)', profiles: { '1.0': 'study research profile (156-record study authorization reference)', '2.0': PROFILE },
  statement: 'Scored fields compared exclude only the graph digests, timings and the normalized default-path hash. Mocks are the study\'s stored mocks, relabelled for 0.3.4.', network_attempts: attempts.length, result };
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result), 'network', attempts.length);
