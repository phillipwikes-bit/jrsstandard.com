// Blind-spot checks added 2026-11-25: figures, international date forms,
// all-number dates that read two ways, double negatives, language.
import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
import { extractDates, extractFigures, ambiguousDates, englishShare, stripDoubleNegatives } from '../../lib/ds-n1/assess.mjs';

// Constructed text (no real case).
const SRC = 'On 3 March 2021, Complainant filed a formal complaint. The Agency awarded Complainant $5,000 in compensatory damages and 30 days of restored leave. The Agency found that 45% of the staff had completed the training. S1 stated that the decision was not unreasonable given the staffing shortfall.';
function run(text, src = SRC) {
  const { record, validation } = extractRecord({ record_id: 'BS-1', title: 'BS-1', record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text, sources: [{ source_id: 'SRC', title: 'Decision', text: src, version: 'v1' }] });
  assert.ok(!validation.status, JSON.stringify(validation.errors));
  return deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' }));
}
const codes = (st) => st.findings.filter((f) => f.status === 'OPEN').map((f) => f.code);

test('the unchanged source reaches READY', () => {
  const st = run(SRC);
  assert.deepEqual(codes(st), []);
  assert.equal(st.status, 'READY_FOR_HUMAN_FINALIZATION');
});
test('a changed amount is a NUMBER_MISMATCH that blocks READY', () => {
  const st = run(SRC.replace('$5,000', '$50,000'));
  assert.ok(codes(st).includes('NUMBER_MISMATCH'));
  assert.notEqual(st.status, 'READY_FOR_HUMAN_FINALIZATION');
});
test('a changed duration and a changed percentage are caught', () => {
  assert.ok(codes(run(SRC.replace('30 days', '60 days'))).includes('NUMBER_MISMATCH'));
  assert.ok(codes(run(SRC.replace('45% of', '54% of'))).includes('NUMBER_MISMATCH'));
});
test('the same figure written differently is not a mismatch', () => {
  const st = run(SRC.replace('$5,000', '5,000 dollars').replace('30 days', 'thirty days').replace('45%', '45 percent'));
  assert.ok(!codes(st).some((c) => c.startsWith('NUMBER_')), codes(st).join(','));
});
test('an amount the source never gives is asked about, and does not reach READY', () => {
  const st = run(SRC.replace('The Agency found that 45% of the staff had completed the training.', 'The Agency found that the staff training cost €12,000 in total.'));
  assert.ok(codes(st).some((c) => c === 'NUMBER_NOT_ESTABLISHED' || c === 'NUMBER_MISMATCH'), codes(st).join(','));
  assert.notEqual(st.status, 'READY_FOR_HUMAN_FINALIZATION');
});
test('labels, sections, case numbers and years are not read as figures', () => {
  assert.deepEqual(extractFigures('S1 relied on section 4 of 29 C.F.R. 1614.110 in Appeal No. 0120181234 in 2019, and RMO2 agreed.'), []);
});
test('international date forms are read', () => {
  assert.deepEqual(extractDates('3rd March 2024; Sept. 5, 2023; the 7th of June, 2022; 25/03/2024; 2024/01/09'),
    ['2022-06-07', '2023-09-05', '2024-01-09', '2024-03-03', '2024-03-25']);
});
test('an all-number date that reads two ways is not guessed, and is reported', () => {
  assert.deepEqual(extractDates('on 03/04/2021'), []);
  assert.deepEqual(ambiguousDates('on 03/04/2021')[0].readings, ['2021-04-03', '2021-03-04']);
  const st = run(SRC.replace('On 3 March 2021,', 'On 03/03/2021,').replace('3 March', '3 March'));
  assert.ok(!codes(st).includes('DATE_FORMAT_AMBIGUOUS'), '03/03 reads the same everywhere');
  const st2 = run(SRC.replace('On 3 March 2021,', 'On 3/4/2021,'), SRC.replace('3 March 2021', '4 March 2021'));
  assert.ok(codes(st2).includes('DATE_FORMAT_AMBIGUOUS'));
  assert.ok(!codes(st2).includes('DATE_OMITTED'), 'an ambiguous date is still a date');
});
test('a double negative is affirmative', () => {
  assert.equal(stripDoubleNegatives('it was not unreasonable'), 'it was reasonable');
  const st = run(SRC.replace('was not unreasonable', 'was reasonable'));
  assert.ok(!codes(st).includes('NEGATION_CONFLICT') && !codes(st).includes('POSSIBLE_CONTRADICTION'), codes(st).join(','));
});
test('a record mostly in another language is reported, terse English notes are not', () => {
  const es = 'La empresa no aprobó la solicitud del trabajador porque el informe de la evaluación no estaba completo y el director dijo que se debía revisar de nuevo en la próxima reunión. ';
  assert.ok(englishShare(es.repeat(3)) < 0.15);
  assert.equal(englishShare('Complainant filed formal complaint 2019; S1 denied request; Agency issued FAD; no hearing requested; telework denied; LWOP granted six weeks. '.repeat(3)), 1);
  assert.equal(englishShare('申请未获批准，因为评估报告不完整，主任说必须在下次委员会会议上与单位代表一起重新审查。'.repeat(3)), 0);
  const st = run(es.repeat(2), SRC);
  assert.ok(codes(st).includes('LANGUAGE_NOT_SUPPORTED'));
  assert.notEqual(st.status, 'READY_FOR_HUMAN_FINALIZATION');
});
