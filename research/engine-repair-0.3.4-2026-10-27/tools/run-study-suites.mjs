// 0.3.4 repair package: runs the study's own frozen suites (research probes 1.0, regression probes 1.0, feature
// probes 1.0) UNCHANGED against a named engine version. The suites encode 0.3.3 behaviour, so a failure on 0.3.4 is
// either an intended change (recorded in reports/SUITE_CHANGES.md with its reason) or a regression.
// Offline only. Usage: node tools/run-study-suites.mjs <engine-version> <scratch> <label>
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { isolate, loadEngine, PKG } from './harness/engines.mjs';
import { runResearchProbes } from '../../study-156-2026-10-27/tools/research-probes.mjs';
import { runRegressionProbes } from '../../study-156-2026-10-27/tools/regression-probes.mjs';
import { runFeatureProbes } from '../../study-156-2026-10-27/tools/feature-probes.mjs';

const [VERSION, SCRATCH, LABEL] = process.argv.slice(2);
if (!VERSION || !SCRATCH || !/^[\w.-]+$/.test(LABEL || '')) { console.error('usage: run-study-suites.mjs <engine-version> <scratch> <label>'); process.exit(2); }
const OUT = join(PKG, 'out', LABEL);
if (existsSync(OUT)) { console.error('output exists; runs start clean: ' + OUT); process.exit(2); }
const pre = V.checkNetworkMarkers(process.env, {});
if (pre.length) { console.error('stopped:', pre.join('; ')); process.exit(3); }
const iso = isolate(VERSION, SCRATCH, { requireManifest: existsSync(join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')) || VERSION !== '0.3.4-research-candidate' });
const E = await loadEngine(iso);
const suites = {};
if (E.research) {
  suites.research_probes_1_0 = await runResearchProbes(E);
  suites.regression_probes_1_0 = await runRegressionProbes(E);
}
suites.feature_probes_1_0 = await runFeatureProbes(E, { scratch: SCRATCH });
const rel = iso.release();
const out = { results_format: 'jrs-0.3.4-study-suites/1.0.0', engine: { version: VERSION, manifest_sha256: iso.manifest_sha256, snapshot_sha256: iso.snapshot_sha256, released: rel },
  statement: 'The study suites run unchanged. They encode 0.3.3 behaviour; failures on 0.3.4 are classified in reports/SUITE_CHANGES.md.', network_attempts: attempts.length,
  totals: Object.fromEntries(Object.entries(suites).map(([k, r]) => [k, { probes: r.length, passed: r.filter((x) => x.ok).length, failed: r.filter((x) => !x.ok).map((x) => x.id) }])), suites };
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals), 'network', attempts.length);
for (const [k, r] of Object.entries(suites)) for (const x of r.filter((y) => !y.ok)) console.log(k, x.id, x.area || x.defect || '', (x.feature || x.expect || '').slice(0, 110), '=>', JSON.stringify(x.observed).slice(0, 260));
