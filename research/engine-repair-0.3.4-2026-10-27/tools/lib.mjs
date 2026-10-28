// 0.3.4 repair package: shared helpers. Reads the study package (never writes it). No I/O beyond reading files.
//
// Stored mock candidates: the study's scripted mocks (not model output) were written with the 0.3.3 research prompt
// version. To replay the SAME observations against 0.3.4, relabel() rewrites only the prompt_version field and
// leaves every observation unchanged; the replay is recorded as relabelled in every result that uses it.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STUDY, PKG } from './harness/engines.mjs';
import { ARMS as STUDY_ARMS } from '../../study-156-2026-10-27/tools/compile-row.mjs';
import { declare, compileRow, conflictKinds, behaviourDigest, PROFILE } from './compile-row-v2.mjs';
import { classifyE1, e2, guards, controlMechanics, isFlawReason, BASIS_CONDITIONS } from '../../study-156-2026-10-27/tools/scoring.mjs';

export { STUDY, PKG, declare, compileRow, conflictKinds, behaviourDigest, classifyE1, e2, guards, controlMechanics, isFlawReason, BASIS_CONDITIONS, PROFILE };
export const sha = (s) => createHash('sha256').update(s).digest('hex');
export const CLOCK = '2026-10-27T12:00:00.000Z';
export const STUDY_SCOPE = Object.freeze({ record_type: 'study_decision_record', record_state: 'completed_record', content_origin: 'synthetic_study_record', hr_content: false, regulated_decision_content: false });

// The research arms of the study, bound to a named engine version. Arm definitions are otherwise the study's own.
export const armsFor = (engine) => STUDY_ARMS.filter((a) => a.profile).map((a) => Object.assign({}, a, { engine }));
export const MOCK_OF_ARM = Object.freeze({ A3: 'ORACLE', A4: 'OVERCLAIM', A5: 'UNDERCLAIM', A3R: 'ORACLE-R', A4R: 'OVERCLAIM-R' });

export const inventory = JSON.parse(readFileSync(join(STUDY, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
export const byId = new Map(inventory.entries.map((e) => [e.source_id, e]));
const register = JSON.parse(readFileSync(join(STUDY, 'records', 'synthetic', 'CONSTRUCTION_REGISTER.json'), 'utf8'));
export const designedOf = (id) => { const r = register.records.find((x) => x.id === id); return r ? r.designed : null; };
export const constructionOf = (id) => register.records.find((x) => x.id === id) || null;
export const recordText = (id) => { const e = byId.get(id); const t = readFileSync(join(STUDY, '..', '..', e.extracted_text_path), 'utf8'); if (sha(t) !== e.extracted_text_sha256) throw new Error('record_hash_mismatch:' + id); return t; };
// The 104 records with text in scope (100 synthetic, 4 originals), in inventory order.
export const substantive = inventory.entries.filter((e) => e.full_text_available && e.scope_class === 'NOT_EXCLUDED');
export const referenceOf = (id) => byId.get(id).reference_findings[0].value;

const mockIndex = JSON.parse(readFileSync(join(STUDY, 'mocks', 'MOCK_INDEX.json'), 'utf8'));
const mockSha = Object.fromEntries(mockIndex.rows.map((r) => [r.policy + '/' + r.id, r.sha256]));
export function storedMock(policy, id) {
  const body = readFileSync(join(STUDY, 'mocks', policy, id + '.json'), 'utf8');
  if (sha(body) !== mockSha[policy + '/' + id]) throw new Error('mock_hash_mismatch:' + policy + '/' + id);
  return JSON.parse(body).envelope.content[0].text;
}
const vIndex = JSON.parse(readFileSync(join(STUDY, 'variants', 'VARIANT_INDEX.json'), 'utf8'));
const vfile = readFileSync(join(STUDY, 'variants', 'VARIANTS.jsonl'), 'utf8');
if (sha(vfile) !== vIndex.variants_file.sha256) throw new Error('variants_file_hash_mismatch');
export const variants = vfile.split('\n').filter(Boolean).map((l) => JSON.parse(l));
const vmCache = {};
export function storedVariantMock(policy, variantId) {
  if (!vmCache[policy]) {
    const b = readFileSync(join(STUDY, 'mocks-variants', policy + '.jsonl'), 'utf8');
    if (sha(b) !== vIndex.mock_files[policy].sha256) throw new Error('variant_mock_file_hash_mismatch:' + policy);
    vmCache[policy] = new Map(b.split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); if (sha(o.body) !== o.sha256) throw new Error('variant_mock_altered:' + o.variant_id); return [o.variant_id, JSON.parse(o.body).envelope.content[0].text]; }));
  }
  return vmCache[policy].get(variantId) || null;
}
// Rewrites only prompt_version; observations are unchanged.
export function relabel(candidateText, promptVersion) {
  if (candidateText === null) return null;
  const o = JSON.parse(candidateText);
  o.prompt_version = promptVersion;
  return JSON.stringify(o, null, 2);
}
// One compile through the study's own scoring (compile-row 2.0: this package's research profile), for engine E under arm a.
export function score(E, a, { text, id, cand, designed = null, fixtureId }) {
  return compileRow(E, a, { text, declaration: declare(byId.get(id) || { cohort: 'synthetic_record' }), cand, designed, eligible: true, clock: CLOCK, fixtureId: fixtureId || id, rpv: E.research.RESEARCH_PROMPT_VERSION, profile: PROFILE });
}
export function graph(E, { text, id, cand = null, scope }) {
  const dv = Object.assign({}, E.declaredVersions, { prompt_version: E.research.RESEARCH_PROMPT_VERSION });
  return E.compiler.compileEvidenceGraph({ submission: { submission_metadata: { submission_id: id }, scope_declaration: scope || declare(byId.get(id) || { cohort: 'synthetic_record' }), declared_versions: dv,
    requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: text }, candidateResponseText: cand, executionMode: cand ? 'local_mocked' : 'local_deterministic', clock: CLOCK, fixtureId: id, researchProfile: PROFILE });
}
