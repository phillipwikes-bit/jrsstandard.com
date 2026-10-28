#!/usr/bin/env node
// JRS PHASE 8: writes the structured Phase 8 records from the Phase 8 modules and recorded Phase 7 artifacts.
//   node research/engine-governance-phase8-2026-10-19/build-records.mjs
// Writes qualification/CANDIDATE_QUALIFICATION_RECORD.json, evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json,
// change-model/CHANGE_IMPACT_MODEL.json and decisions/OWNER_DECISIONS.json. Reads earlier packages only.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATUS_LINES } from '../../lib/engine-governance-phase8/registry.mjs';
import { buildQualificationRecord, validateQualificationRecord } from '../../lib/engine-governance-phase8/qualification.mjs';
import { PROTOCOL, sealProtocol, validateProtocol } from '../../lib/engine-governance-phase8/evaluation-protocol.mjs';
import { CHANGE_CLASSES, CONSERVATIVE_RULE, SENSITIVE_SURFACES } from '../../lib/engine-governance-phase8/change-impact.mjs';
import { PHASE8_DECISIONS, OWNER_AUTHORIZATIONS, validateDecisionRegister } from '../../lib/engine-governance-phase8/decisions.mjs';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const P8 = fileURLToPath(new URL('./', import.meta.url));
const { DECISIONS: P7D } = await import('../engine-remediation-phase7-2026-10-19/workbench/decisions.mjs');
export const phase7Decisions = () => P7D;
export const phase7Manifest = () => readFileSync(join(P8, 'registry/manifests/phase7-candidate.sha256'), 'utf8');

const w = (rel, obj) => { mkdirSync(join(P8, rel, '..'), { recursive: true }); writeFileSync(join(P8, rel), JSON.stringify(obj, null, 2) + '\n'); };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const q = buildQualificationRecord(REPO, phase7Manifest(), P7D);
  const problems = [...validateQualificationRecord(q).map((x) => 'qualification: ' + x), ...validateProtocol(PROTOCOL).map((x) => 'protocol: ' + x), ...validateDecisionRegister(PHASE8_DECISIONS).map((x) => 'decisions: ' + x)];
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  w('qualification/CANDIDATE_QUALIFICATION_RECORD.json', q);
  w('evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json', sealProtocol(PROTOCOL));
  w('change-model/CHANGE_IMPACT_MODEL.json', { model_type: 'jrs-phase8-change-impact-model/1.0.0', status_lines: STATUS_LINES, conservative_rule: CONSERVATIVE_RULE, sensitive_surfaces: SENSITIVE_SURFACES, classes: CHANGE_CLASSES });
  w('decisions/OWNER_DECISIONS.json', { register_type: 'jrs-phase8-owner-decisions/1.0.0', status_lines: STATUS_LINES, statement: 'Open decisions are questions only. The recorded owner authorizations are decided and limited to their stated scope. Nothing here is recommended.', decisions: PHASE8_DECISIONS, owner_authorizations: OWNER_AUTHORIZATIONS, phase7_decisions_carried: P7D.map((d) => ({ id: d.id, question: d.question, status: 'open' })) });
  const { buildHandoffFreeze, validateHandoffFreeze } = await import('../../lib/engine-governance-phase8/handoff-freeze.mjs');
  const R = (rel) => JSON.parse(readFileSync(join(P8, rel), 'utf8'));
  const fz = buildHandoffFreeze({ versionRegistry: R('registry/VERSION_REGISTRY.json'), laterRegistry: R('governance/LATER_PACKAGE_REGISTRY.json'), qualification: q, protocol: R('evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json'),
    changeModel: R('change-model/CHANGE_IMPACT_MODEL.json'), decisions: R('decisions/OWNER_DECISIONS.json'), phase7Seal: JSON.parse(readFileSync(join(REPO, 'research/engine-remediation-phase7-2026-10-19/SEAL.json'), 'utf8')) });
  const fp = validateHandoffFreeze(fz);
  if (fp.length) { console.error('freeze: ' + fp.join('; ')); process.exit(1); }
  w('evaluation/INDEPENDENT_EVALUATION_HANDOFF_FREEZE.json', fz);
  console.log('wrote 5 records');
}
