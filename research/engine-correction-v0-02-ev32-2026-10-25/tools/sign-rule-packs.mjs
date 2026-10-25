// Re-binds the six existing rule packs to 0.3.2-candidate (candidate_version only; rule content
// unchanged), adds pack RPK-ECR (RP-CON-02), and re-signs every pack with the candidate's own seal.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'candidate', 'lib', 'engine-evidence-graph-v0.3.2-candidate');
const { contentSeal, validateRulePacks } = await import(pathToFileURL(join(PK, 'rule-packs.mjs')).href);
const DIR = join(PK, 'rule-packs');
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const k = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  k.candidate_version = '0.3.2-candidate';
  k.signature = { method: 'sha256-canonical-content-seal', content_sha256: contentSeal(k) };
  writeFileSync(join(DIR, f), JSON.stringify(k, null, 2) + '\n');
}
const ecr = { candidate_version: '0.3.2-candidate', pack_id: 'RPK-ECR', pack_version: '1.0.0', purpose: 'Cited-evidence conflict scoping by event role (owner decision V0-02, finding U-04 / EV-32).',
  rules: [{ rule_id: 'RP-CON-02', purpose: 'Address V0 finding U-04 (EV-32): two cited dates of different event roles were flagged as a cited-evidence conflict on a consistent record.',
    trigger: 'In detector K6, for stated_date and stated_expiry quotations only: when both quotations overlap an explicitly dated event clause with exactly one role, and the two roles differ, the pair is not compared. An unknown role on either side keeps the comparison. stated_decision is unchanged.',
    expected_safe_outcome: 'conflict_and_review',
    limitation: 'Roles come from the lexical dated-event extraction; a quotation outside any dated clause, or overlapping clauses of two roles, keeps the 0.3.1 behaviour.',
    false_positive_risk: 'Two genuinely conflicting dates mislabelled with different roles by the lexical extractor would no longer be flagged by K6 (record-level detectors K1, K2, RP-CHR-02 still apply).',
    linked_scenarios: ['V0 EV-32', 'RC-01', 'RC-02', 'RC-03', 'RC-04', 'RC-05'],
    owner_decision_for_expansion: 'Any widening beyond date and expiry assertions, or any change to role assignment, requires a recorded owner decision and a new sealed scenario set.' }] };
ecr.signature = { method: 'sha256-canonical-content-seal', content_sha256: contentSeal(ecr) };
writeFileSync(join(DIR, 'RPK-ECR.json'), JSON.stringify(ecr, null, 2) + '\n');
const packs = readdirSync(DIR).filter((x) => x.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')));
const v = validateRulePacks(packs);
console.log('packs', packs.length, 'valid', v.ok, 'active', [...v.active].sort().join(','), v.problems.join('; '));
