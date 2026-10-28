// Local deterministic intake dry run of the ten synthetic records on an isolated Engine
// copy. No model, no provider, no network (guard installed first).
import { attempts, installNetGuard } from '../harness-v2-src/net-guard.mjs';
installNetGuard();
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createIsolatedCopy, verifyAndDelete } from '../harness-v2-src/isolate.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)); const PKG = join(HERE, '..');
const iso = createIsolatedCopy(join(PKG, '..'));
const { compileEvidenceGraph } = await import(join(iso.root, 'lib/engine-evidence-graph-v0.3.1-candidate/compiler.mjs'));
const out = [];
for (const f of readdirSync(join(PKG, 'synthetic-records')).filter((x) => x.endsWith('.record.txt')).sort()) {
  const text = readFileSync(join(PKG, 'synthetic-records', f), 'utf8');
  const id = f.replace('.record.txt', '');
  const g = compileEvidenceGraph({ submission: { submission_metadata: { submission_id: id }, scope_declaration: { record_type: 'supplier_access_exception_draft', record_state: 'completed_draft', content_origin: 'synthetic_engineering_fixture', hr_content: false, regulated_decision_content: false }, declared_versions: { contract_version: 'jrs-engine-local-0.3.0-evidence-graph', compiler_version: '0.3.1-candidate', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0' }, requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: text }, candidateResponseText: null, executionMode: 'local_deterministic', clock: '2026-10-24T00:00:00Z', fixtureId: id });
  out.push({ synthetic_record_id: id, sha256: createHash('sha256').update(text).digest('hex'), chars: text.length, labeled: text.startsWith('SYNTHETIC DEVELOPMENT MATERIAL. NOT VALIDATION MATERIAL.'), intake: g.intake.decision, triggers: g.intake.triggers.map((t) => t.code), graph_execution_mode: g.identity.execution_mode });
}
const iv = verifyAndDelete(iso);
writeFileSync(process.argv[2], JSON.stringify({ records: out, network_attempts: attempts.length, isolation: iv }, null, 2));
for (const r of out) console.log(r.synthetic_record_id, r.intake, r.labeled, r.chars, r.triggers.join(','));
console.log('network', attempts.length, 'iso unchanged', iv.unchanged, 'deleted', iv.deleted);
