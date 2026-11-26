import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
// Research harness for published public decisions (see lib/ds-n1/research.mjs).
import { enablePublicRecordResearch, disablePublicRecordResearch } from '../../lib/ds-n1/research.mjs';
import { validateRecord } from '../../lib/ds-n1/record.mjs';
enablePublicRecordResearch();

const text = 'Decision. The request was denied. Call 555-201-4477 for the medical file. The agency therefore concluded the denial was proper.';
test('constructed_fictional still refuses identifier-like and excluded-domain content', () => {
  const { validation } = extractRecord({ record_id: 'P1', title: 'p', record_class: 'discovery_production_rationale', text, sources: [] });
  assert.equal(validation.status, 'REFUSED_SCOPE');
});
test('public_record_test lifts only the domain and identifier screens', () => {
  const { validation } = extractRecord({ record_id: 'P1', title: 'p', record_class: 'discovery_production_rationale', data_classification: 'public_record_test', text, sources: [] });
  assert.notEqual(validation.status, 'REFUSED_SCOPE');
  const bad = extractRecord({ record_id: 'P1', title: 'p', record_class: 'employment', data_classification: 'public_record_test', text, sources: [] });
  assert.equal(bad.validation.status, 'REFUSED_SCOPE');
  const real = extractRecord({ record_id: 'P1', title: 'p', record_class: 'discovery_production_rationale', data_classification: 'real_confidential', text, sources: [] });
  assert.equal(real.validation.status, 'REFUSED_SCOPE');
});

test('public_record_test is refused outside the research harness (2026-11-26 audit)', () => {
  disablePublicRecordResearch();
  try {
    const r = validateRecord({ schema: 'ds-n1.record/1.0', record_id: 'R', record_version: '1', title: 'T', record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text: 'Contact jane.doe@example.com about the matter.', sources: [] });
    assert.match(r.status, /^REFUSED/);
    assert.equal(r.errors[0].code, 'PUBLIC_RECORD_TEST_NOT_ENABLED');
  } finally { enablePublicRecordResearch(); }
});
