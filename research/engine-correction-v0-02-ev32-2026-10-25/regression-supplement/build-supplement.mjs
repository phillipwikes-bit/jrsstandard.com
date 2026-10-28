// Supplementary sealed case RC-06 (owner direction 2026-10-25 on survivor X13). Written and sealed
// before any rerun; no code change. Authorship: Claude Code under owner direction; AI-assisted.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
if (existsSync(join(HERE, 'SEAL.json'))) { console.error('sealed'); process.exit(2); }
const sha = (b) => createHash('sha256').update(b).digest('hex');
const V0 = join(HERE, '..', '..', 'validation-readiness-gate-v0-2026-10-25', 'corpus');
const base = readFileSync(join(V0, 'cases', 'EV-01.record.txt'), 'utf8');
const record = base
  .replace('Requested by: Facilities operations team; request received 2026-03-02.', 'Requested by: Facilities operations team; request received 2026-03-02 and an earlier request was denied 2026-02-20.')
  .replace('Decision: Exception granted for read-only access to the dock scheduling portal.', 'Decision: Exception granted on 2026-03-09 for read-only access to the dock scheduling portal.');
if (record === base || record.split('2026-02-20').length !== 2) throw new Error('record construction failed');
const obs = JSON.parse(JSON.parse(readFileSync(join(V0, 'cases', 'EV-01.candidate.json'), 'utf8')).envelope.content[0].text).observations;
obs[0].quote = 'Exception granted on 2026-03-09 for read-only access to the dock scheduling portal';
obs.push({ observation_id: 'O7', condition_id: 'reconstructability', proposed_status: 'supported', quote: 'an earlier request was denied 2026-02-20', assertion_type: 'stated_decision' });
const C = ['reconstructability', 'identifiable_basis', 'chronology_integrity', 'reasoning_traceability', 'sufficiency'];
const st = (a) => Object.fromEntries(C.map((c, i) => [c, a[i]]));
const e = { intake_decision: 'proceed', statuses: st(['review_required', 'supported', 'supported', 'supported', 'review_required']), conflict_kinds: ['cited_evidence_conflict'] };
writeFileSync(join(HERE, 'cases', 'RC-06.record.txt'), record);
writeFileSync(join(HERE, 'cases', 'RC-06.candidate.json'), JSON.stringify({ envelope: { status: 'ok', stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ contract_version: 'jrs-engine-local-0.3.0-evidence-graph', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', observations: obs }, null, 2) }], usage: { input_tokens: 0, output_tokens: 0 } } }, null, 2) + '\n');
writeFileSync(join(HERE, 'cases', 'RC-06.spec.json'), JSON.stringify({ case_id: 'RC-06', purpose: 'Two conflicting decision quotations (granted, denied) with known, different event roles (decision, request): decisions stay excluded from RP-CON-02, so the conflict persists. Targets survivor X13.',
  record_source: 'regression-supplement cases/RC-06.record.txt', record_sha256: sha(record), expected: { '0.3.1-candidate': e, '0.3.2-candidate': e },
  expectation_authority: 'owner direction 2026-10-25 (X13); AI-assisted drafting; not ground truth' }, null, 2) + '\n');
console.log('RC-06 written');
