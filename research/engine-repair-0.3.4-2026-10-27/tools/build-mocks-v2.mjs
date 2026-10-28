// 0.3.4 repair package: mock candidates 2.0 for the scored record runs. NOT MODEL OUTPUT. Written before the freeze so
// that the scored runs read hashed files, not code paths. Offline. The study's generators are used unchanged:
//   ORACLE, OVERCLAIM, UNDERCLAIM  study tools/mock-candidates.mjs (heuristic quotations; imports no Engine code),
//       regenerated with the 0.3.4 research prompt version. Each file's observations are checked equal to the study's
//       stored mock for the same record: the prompt_version label is the only difference.
//   ORACLE-R, OVERCLAIM-R  study tools/mock-aligned.mjs (rule-aligned, circular by design), regenerated on the 0.3.4
//       research profile's own sentence units and markers, read from an isolated copy of the candidate. A ceiling only.
//   ADV  tests/paired-suite.mjs advCandidate: an over-claiming citer that proposes "supported" everywhere and quotes the
//       sentence with the most digits for every condition it can, using the 0.3.4 markers.
//   ORACLE-default  not rebuilt: the default path is unchanged, so A6 and A6c read the study's stored files.
// Only records eligible for research-profile runs get mocks (the 104 with text and scope class NOT_EXCLUDED).
// Usage: node tools/build-mocks-v2.mjs <scratch>   (writes mocks-v2/; refuses if it exists)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { isolate, loadEngine, PKG } from './harness/engines.mjs';
import { substantive, recordText, storedMock, sha } from './lib.mjs';
import { mockCandidate, POLICIES } from '../../study-156-2026-10-27/tools/mock-candidates.mjs';
import { alignedCandidate, ALIGNED_POLICIES } from '../../study-156-2026-10-27/tools/mock-aligned.mjs';
import { advCandidate } from '../tests/paired-suite.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: build-mocks-v2.mjs <scratch>'); process.exit(2); }
const DIR = join(PKG, 'mocks-v2');
if (existsSync(DIR)) { console.error('mocks-v2 exists; it is preserved, not rebuilt'); process.exit(2); }
mkdirSync(SCRATCH, { recursive: true });
const iso = isolate('0.3.4-research-candidate', SCRATCH, { requireManifest: false });
const E = await loadEngine(iso);
const versions = { contractVersion: E.contract.CONTRACT_VERSION, promptVersion: E.research.RESEARCH_PROMPT_VERSION };
const GEN = { heuristic: 'research/study-156-2026-10-27/tools/mock-candidates.mjs', aligned: 'research/study-156-2026-10-27/tools/mock-aligned.mjs (on 0.3.4 units)', ADV: 'tests/paired-suite.mjs advCandidate (0.3.4 markers)' };
const rows = [];
let equal = 0, differ = [];
for (const e of substantive) {
  const id = e.source_id, text = recordText(id);
  const ref = { e1: e.reference_findings[0].value, chronology_conflict: !!(e.links && e.links.type === 'S') };
  for (const label of [...POLICIES, ...ALIGNED_POLICIES, 'ADV']) {
    let c, generator, same = null;
    if (POLICIES.includes(label)) {
      c = mockCandidate(text, ref, label, versions); generator = GEN.heuristic;
      const study = JSON.parse(storedMock(label, id));
      same = JSON.stringify(JSON.parse(c).observations) === JSON.stringify(study.observations);
      if (same) equal++; else differ.push(label + '/' + id);
    } else if (label === 'ADV') { c = advCandidate(text, null, E); generator = GEN.ADV; }
    else { c = alignedCandidate(text, E.research, ref, label, versions); generator = GEN.aligned; }
    const env = { envelope: { status: 'ok', stop_reason: 'end_turn', content: [{ type: 'text', text: c }], model: 'MOCK-POLICY-' + label + '-NOT-A-MODEL', usage: { input_tokens: 0, output_tokens: 0 } },
      provenance: { response_origin: 'mock_policy_fixture', policy: label, generator, reference_used: label === 'ADV' ? null : ref, observations_equal_to_study_mock: same } };
    const body = JSON.stringify(env, null, 2) + '\n';
    mkdirSync(join(DIR, label), { recursive: true });
    writeFileSync(join(DIR, label, id + '.json'), body, { flag: 'wx' });
    rows.push({ id, policy: label, sha256: sha(body), observations: JSON.parse(c).observations.length, observations_equal_to_study_mock: same });
  }
}
const rel = iso.release();
const index = { format: 'jrs-0.3.4-mock-index/2.0.0', built_at_utc: new Date().toISOString(), records: substantive.length, policies: [...POLICIES, ...ALIGNED_POLICIES, 'ADV'], files: rows.length,
  candidate_snapshot_sha256: iso.snapshot_sha256, isolated_copy: rel, network_attempts: attempts.length,
  heuristic_observations_equal_to_study: { equal, compared: equal + differ.length, differing: differ },
  note: 'Scripted mock fixtures, not model output. ORACLE and ORACLE-R are told the reference label; OVERCLAIM, UNDERCLAIM, OVERCLAIM-R and ADV are told nothing but their policy. The -R policies and ADV read the 0.3.4 research rules or markers (circular for -R: a ceiling only). ORACLE-default is the study file, unchanged.',
  rows };
writeFileSync(join(DIR, 'MOCK_INDEX.json'), JSON.stringify(index, null, 2) + '\n', { flag: 'wx' });
console.log('mocks', rows.length, 'for', substantive.length, 'records; heuristic equal to study', equal + '/' + (equal + differ.length), 'network', attempts.length, 'released', JSON.stringify(rel));
