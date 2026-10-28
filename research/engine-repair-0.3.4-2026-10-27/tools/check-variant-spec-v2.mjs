// 0.3.4 repair package: checks the variant generator 2.0 against 1.0 on every base record.
// V1 to V4 and V6 to V8 must give byte-identical results; V5 differences are listed with their reasons, and every
// 1.0 V5 text is audited with the 2.0 evidence check (the audit HF-05 called for). Pure; reads the study's frozen
// variants file. Usage: node tools/check-variant-spec-v2.mjs   (writes out/variant-spec-v2-check/RESULTS.json)
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as V1 from '../../study-156-2026-10-27/tools/variant-spec.mjs';
import * as V2 from './variant-spec-v2.mjs';
import { variants, recordText, byId, PKG } from './lib.mjs';

const OUT = join(PKG, 'out', 'variant-spec-v2-check');
if (existsSync(OUT)) { console.error('exists: ' + OUT); process.exit(2); }
const bases = [...new Set(variants.map((v) => v.base_id))];
const index = new Map(bases.map((id, i) => [id, i]));
const rows = [], audit = [];
let identical = 0, different = 0;
for (const v of variants) {
  const e = byId.get(v.base_id);
  const base = { text: recordText(v.base_id), e1: v.base_reference, chronology_conflict: !!(v.designed && v.designed.chronology_conflict && v.type !== 'V4') };
  // The frozen file is the reference for 1.0; recompute 1.0 as a check that the copy reads the same inputs.
  const a = V1.buildVariant(v.type, { text: base.text, e1: v.base_reference, chronology_conflict: v.type === 'V4' ? false : (v.designed ? v.designed.chronology_conflict : false) }, index.get(v.base_id));
  const b = V2.buildVariant(v.type, { text: base.text, e1: v.base_reference, chronology_conflict: v.type === 'V4' ? false : (v.designed ? v.designed.chronology_conflict : false) }, index.get(v.base_id));
  const sameAsFrozen = a.constructible === v.constructible && (!a.constructible || a.text === v.text);
  const same = a.constructible === b.constructible && (!a.constructible || a.text === b.text);
  if (v.type !== 'V5') { if (same) identical++; else different++; }
  if (v.type === 'V5') {
    const left = v.constructible ? V2.verifyEvidenceRemoved(v.text.split(/(?<=\.)\s+/).slice(-1)[0]) : null;
    audit.push({ variant_id: v.variant_id, base_reference: v.base_reference, v1_constructible: v.constructible, v1_text: v.text || null, v1_evidence_left: left,
      v2_constructible: b.constructible, v2_text: b.text || null, v2_reason: b.reason || null, changed: !same });
  }
  rows.push({ variant_id: v.variant_id, type: v.type, recomputed_1_0_equals_frozen: sameAsFrozen, v2_equals_v1: same });
}
const v5 = audit;
const out = { results_format: 'jrs-0.3.4-variant-spec-check/1.0.0', spec_v1: V1.VARIANT_SPEC_VERSION, spec_v2: V2.VARIANT_SPEC_VERSION,
  totals: { variants: variants.length, recomputed_1_0_equals_frozen: rows.filter((r) => r.recomputed_1_0_equals_frozen).length,
    non_v5_identical: identical, non_v5_different: different,
    v5: { total: v5.length, v1_constructible: v5.filter((x) => x.v1_constructible).length, v1_texts_with_evidence_left: v5.filter((x) => x.v1_evidence_left && x.v1_evidence_left.length).length,
      v2_constructible: v5.filter((x) => x.v2_constructible).length, v2_changed_text: v5.filter((x) => x.v1_constructible && x.v2_constructible && x.changed).length,
      v2_newly_not_constructible: v5.filter((x) => x.v1_constructible && !x.v2_constructible).length } },
  v5_audit: v5, rows };
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals));
