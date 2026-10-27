// 156-record study: research-profile DEVELOPMENT inspector. Development partition only.
// Refuses any evaluation-partition record (S-041 to S-100) and any original outside the NOT_EXCLUDED scope class.
// Prints what the lexical research rules see in each record, against the record's designed or LLM-reproduced label.
// Usage: node tools/dev-inspect.mjs <scratch> [id...]     (writes nothing into the package)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolate, loadEngine } from './harness/engines.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const [scratch, ...ids] = process.argv.slice(2);
const dev = inv.entries.filter((e) => (e.cohort === 'synthetic_record' && e.partition === 'development') || (e.cohort === 'original_study_record' && e.scope_class === 'NOT_EXCLUDED'));
const pick = ids.length ? ids : dev.map((e) => e.source_id);
for (const id of pick) if (!dev.some((e) => e.source_id === id)) { console.error('refused: ' + id + ' is not in the development partition'); process.exit(3); }
const iso = isolate('0.3.3-research-candidate', scratch, { requireManifest: false });
const E = await loadEngine(iso);
const R = E.research;
const rules = new Set(R.RESEARCH_RULES);
for (const id of pick) {
  const e = inv.entries.find((x) => x.source_id === id);
  const text = readFileSync(join(PKG, '..', '..', e.extracted_text_path), 'utf8');
  const units = R.sentenceUnits(text), events = R.researchEvents(text, units);
  const sections = E.record.sectionsOf(text);
  const conf = R.detectResearchConflicts(text, units, events, rules).map((k) => k.kind + ': ' + k.summary);
  const c = R.evaluateResearchConditions(text, sections, units, events, {}, rules);
  const label = e.reference_findings[0].value + (e.links && e.links.type ? ' [' + e.links.type + ']' : '');
  console.log('\n=== ' + id + ' ' + label);
  for (const u of units) console.log('  U' + u.index + (u.decision ? ' D' : '') + (u.basis_cue ? ' B(' + u.basis_cue + ')' : '') + (u.authority_reference ? ' A' : '') + (u.added_conclusion ? ' +C' : '') + (u.outcome ? ' ' + u.outcome : '') + (u.subject_refs.length ? ' S' + JSON.stringify(u.subject_refs) : '')
    + ' anchors=' + JSON.stringify(u.basis_anchors.map((a) => a.text)) + (u.anchors.length > u.basis_anchors.length ? ' excluded=' + JSON.stringify(u.anchors.filter((a) => a.excluded).map((a) => a.text + ':' + a.excluded)) : '') + '\n     ' + u.text.slice(0, 150));
  console.log('  events: ' + events.map((x) => x.key + '@' + x.date + (x.ids.length ? x.ids.join('/') : '')).join(' | '));
  console.log('  conflicts: ' + (conf.join(' | ') || 'none'));
  for (const k of Object.keys(c)) console.log('  ' + k + ': gaps=' + c[k].visible_gaps.join(',') + ' review=' + c[k].review_reasons.join(','));
}
console.log('\nrelease', JSON.stringify(iso.release()), 'network', attempts.length);
