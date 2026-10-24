// JRS PHASE 9: invariant transforms for rehearsal packets.
// SYNTHETIC AND ENGINEERING-AUTHORED (2026-10-20). Each transform changes presentation only: wording
// that no rule reads, punctuation, layout, an irrelevant line, or the order and spacing of the
// candidate response. None may make the human-review packet more favourable.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CASES = fileURLToPath(new URL('../rehearsal/cases/', import.meta.url));
const once = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('transform target not unique: ' + a.slice(0, 50)); return s.replace(a, b); };
const RISK = 'Residual risk: low, per RA-2026-0311 section 3.';
const CTRL = 'Compensating controls: Access is limited to the LOG-RPT-04 report view; sessions require multi-factor authentication; access logs are reviewed weekly by the Logistics Systems Manager, as set out in RA-2026-0311 section 5.';
const SUPPLIER = 'Supplier: Harrowgate Freight Services Ltd (fictional)';
const swap = (r, a, b) => { const x = r.split('\n'); const i = x.indexOf(a), j = x.indexOf(b); if (i < 0 || j < 0) throw new Error('swap target missing'); [x[i], x[j]] = [x[j], x[i]]; return x.join('\n'); };
const onRecord = (f) => (c) => Object.assign(c, { record_text: f(c.record_text) });
const onResponse = (f) => (c) => Object.assign(c, { candidate_response_text: JSON.stringify(f(JSON.parse(c.candidate_response_text)), null, 2) });

export const KINDS = Object.freeze({
  LTD: { name: 'wording: supplier name spelled out', make: onRecord((r) => once(r, ' Ltd ', ' Limited ')) },
  BLANK: { name: 'layout: blank line after every line', make: onRecord((r) => r.replace(/\n/g, '\n\n')) },
  RTYPE: { name: 'punctuation: hyphen and full stop in the record type', make: onRecord((r) => once(r, 'Record type: Supplier access exception draft', 'Record type: Supplier-access exception draft.')) },
  EID: { name: 'punctuation: full stop after the exception identifier', make: onRecord((r) => once(r, 'Exception ID: SAE-2026-0101', 'Exception ID: SAE-2026-0101.')) },
  BG: { name: 'irrelevant narrative line added', make: onRecord((r) => once(r, SUPPLIER + '\n', SUPPLIER + '\nBackground: The supplier has carried freight for the logistics team for several years.\n')) },
  SWAP: { name: 'section order: risk and controls swapped', make: onRecord((r) => swap(r, RISK, CTRL)) },
  OREV: { name: 'response: observations in reverse order', make: onResponse((o) => Object.assign(o, { observations: [...o.observations].reverse() })) },
  OCOMPACT: { name: 'response: compact JSON spacing', make: (c) => Object.assign(c, { candidate_response_text: JSON.stringify(JSON.parse(c.candidate_response_text)) }) },
});

// [kind, base]. Bases with a review rank below 2 (escalation required, or an Engine status other than
// supported) are the unfavourable or escalation baselines; they are marked in the results.
const PAIRS = [
  ...['R9-QNS-01', 'R9-QNS-03', 'R9-SIN-02', 'R9-NEG-02', 'R9-CHR-04', 'R9-CCP-02', 'R9-CHR-02', 'R9-CHR-05', 'R9-CON-01', 'R9-CON-02', 'R9-CON-06', 'R9-SUF-03', 'R9-NEG-01', 'R9-RGP-06'].flatMap((b) => [['LTD', b], ['BLANK', b]]),
  ['RTYPE', 'R9-CHR-02'], ['RTYPE', 'R9-CON-05'], ['RTYPE', 'R9-SUF-04'], ['RTYPE', 'R9-QNS-09'],
  ['EID', 'R9-CON-04'], ['EID', 'R9-RGP-03'],
  ['BG', 'R9-CON-02'], ['BG', 'R9-QNS-02'], ['BG', 'R9-RGP-04'],
  ['SWAP', 'R9-CHR-05'], ['SWAP', 'R9-QNS-01'],
  ['OREV', 'R9-CON-06'], ['OREV', 'R9-RGP-01'], ['OREV', 'R9-QNS-04'],
  ['OCOMPACT', 'R9-CHR-02'], ['OCOMPACT', 'R9-SIN-01'],
];
export const TRANSFORMS = PAIRS.map(([k, base], i) => ({ id: 'P9-ST-' + String(i + 1).padStart(2, '0'), kind: k, name: KINDS[k].name, base, make: KINDS[k].make }));
export const BASES = Object.fromEntries([...new Set(PAIRS.map((p) => p[1]))].map((id) => [id, JSON.parse(readFileSync(join(CASES, id + '.json'), 'utf8'))]));
