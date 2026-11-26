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

// Second round (2026-11-25): wrong dates in labels, impossible and near-miss
// dates, reversed roles, readings that are not denials, writer's notes, splits.
import { impossibleDates, nearShift, yearlessDates, polarityText } from '../../lib/ds-n1/assess.mjs';
import { sentences } from '../../lib/ds-n1/text.mjs';
const SRC2 = 'On June 19, 2021, the Manager reassigned the complex cases of a retired coworker to Complainant. Complainant’s first level supervisor was the Nurse Manager for the surgical unit. Complainant stated that she was harassed by a coworker in the break room. The Agency dismissed the claim pursuant to 29 C.F.R. § 1614.107(a)(1) for failure to state a claim.';
const run2 = (t) => run(t, SRC2);
test('a wrong date in a bold label is a date mismatch; the right one is not', () => {
  assert.ok(codes(run2('1. **June 20, 2021**: The Manager reassigned the complex cases of a retired coworker to Complainant.')).includes('DATE_MISMATCH'));
  assert.ok(!codes(run2('1. **June 19, 2021**: The Manager reassigned the complex cases of a retired coworker to Complainant.')).includes('DATE_MISMATCH'));
});
test('a date that cannot exist is serious', () => {
  assert.deepEqual(impossibleDates('on May 32, 2018 and February 30, 2021 but not March 3, 2021'), ['may 32, 2018', 'february 30, 2021']);
  assert.ok(codes(run2('On May 32, 2021, the Manager reassigned the complex cases of a retired coworker to Complainant.')).includes('DATE_IMPOSSIBLE'));
});
test('a date a day off from the cited sentence is a mismatch, with or without a year', () => {
  assert.equal(nearShift('2021-06-20', ['2021-06-19']), '2021-06-19');
  assert.equal(nearShift('2021-06-29', ['2021-06-19']), null);
  assert.deepEqual(yearlessDates('On June 22, the AJ dismissed it; on 3 March 2021 it closed'), ['--06-22']);
  assert.ok(codes(run2('On June 20, 2021, the Manager reassigned the complex cases of a retired coworker to Complainant.')).includes('DATE_MISMATCH'));
  assert.ok(codes(run2('On June 21, the Manager reassigned the complex cases of a retired coworker to Complainant.')).includes('DATE_MISMATCH'));
});
test('"was not the" role the source says she was is a contradiction', () => {
  assert.ok(codes(run2('Complainant’s first level supervisor was not the Nurse Manager for the surgical unit.')).some((c) => c === 'NEGATION_CONFLICT'));
  assert.ok(!codes(run2('Complainant’s first level supervisor was the Nurse Manager for the surgical unit.')).includes('NEGATION_CONFLICT'));
});
test('wording that reads negative but is not a denial', () => {
  assert.equal(polarityText('she did not request an audit until August 5'), 'she request an audit on august 5');
  assert.equal(polarityText('S1 said no and left'), 's1 said and left');
  assert.ok(!/fail|not/.test(polarityText('dismissed for failure to state a claim')));
  assert.ok(/not sure/.test(polarityText('she was unsure')) && /not disputed/.test(polarityText('these facts were undisputed')));
  assert.ok(!codes(run2('The Agency dismissed the claim pursuant to 29 C.F.R. § 1614.107(a)(1).')).includes('NEGATION_CONFLICT'));
});
test('"29 C.F.R. § 1614.107" does not end a sentence', () => {
  assert.equal(sentences('It was dismissed under 29 C.F.R. § 1614.107(a)(1). It closed.').length, 2);
});
test('a heading phrased as a question cannot contradict the source', () => {
  assert.ok(!codes(run2('Whether Complainant’s first level supervisor was the Nurse Manager for the surgical unit.')).includes('NEGATION_CONFLICT'));
});
test('notes about the summary itself and citation lines are not claims', () => {
  const st = run2('This summary uses only what the record contains. Source: Affidavit A, at 3, Bates No. 92. The Manager reassigned the complex cases of a retired coworker to Complainant on June 19, 2021.');
  assert.ok(!codes(st).includes('UNSUPPORTED_CLAIM'), codes(st).join(','));
});

// Third round (2026-11-26).
test('figures written out in words, including hundreds, are read as one number', () => {
  assert.deepEqual(extractFigures('four hundred eighty hours and four hundred twenty-one hours').map((f) => f.value), [480, 421]);
});
test('a one-letter source title does not make every sentence name that source', () => {
  const mk = (title) => extractRecord({ record_id: 'T', title: 'T', record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text: 'Complainant said the station was busy that week.', sources: [{ source_id: 'S1', title, text: 'The station manager reported a staffing shortfall in March.', version: 'v1' }] }).report.claims[0].citation;
  const strip = (c) => c && { basis: c.basis, score: c.score };
  assert.deepEqual(strip(mk('S')), strip(mk('Source 1')));
  assert.equal(mk('S').basis, 'inferred');
});
test('"was not employed as" the role the source says she worked in is a contradiction', () => {
  const src = 'At the time of events, Complainant worked as a Rural Carrier at the Agency’s Acton Station in Granbury, Texas.';
  const r = (t) => run(t, src);
  assert.ok(codes(r('The complainant was not employed as a Rural Carrier at the Agency’s Acton Station in Granbury, Texas.')).includes('NEGATION_CONFLICT'));
  assert.ok(!codes(r('The complainant was employed as a Rural Carrier at the Agency’s Acton Station in Granbury, Texas.')).includes('NEGATION_CONFLICT'));
});
test('a near word-for-word copy made mostly of names and roles is supported', () => {
  const src = 'At the time of events, Complainant worked as a City Carrier Technician, A-02/Q, at the Agency’s Village Station in New York, New York.';
  const st = run('Complainant worked as a City Carrier Technician, A-02/Q, at the Agency’s Village Station in New York, New York.', src);
  assert.ok(!codes(st).includes('UNSUPPORTED_CLAIM') && !codes(st).includes('RELEVANCE_NOT_ESTABLISHED'), codes(st).join(','));
});
test('a long list lead-in is not a claim', () => {
  const st = run('The complaint encompasses four primary allegations spanning a three-month period from November through December 2020:', SRC);
  assert.ok(!codes(st).includes('UNSUPPORTED_CLAIM'));
});

// Fourth round (2026-11-26).
test('"was not appointed" against "appointed" stays serious even on a loose match', () => {
  const src = 'On January 5, 2021, the Director appointed another individual, a Transportation Security Inspector, to continue the investigation into the incident at the checkpoint.';
  const st = run('On January 5, 2021, a Transportation Security Inspector was not appointed to continue the investigation.', src);
  assert.ok(codes(st).includes('NEGATION_CONFLICT'), codes(st).join(','));
});
test('"not insufficient" reads as sufficient', () => {
  assert.ok(!/not/.test(polarityText('the course was not insufficient for certification')));
});
test('a figure changed in the neighbouring sentence the statement restates is a mismatch', () => {
  const src = 'On April 5, 2022, the Agency transmitted the report to Complainant by email. The email stated that the copy would be available for download for 30 days. Separately, Complainant had 60 days to request a hearing.';
  const st = run('The email stated that the copy would be available for download for 60 days.', src);
  assert.ok(codes(st).includes('NUMBER_MISMATCH'), codes(st).join(','));
});

// Fifth round (2026-11-26).
import { monthDates } from '../../lib/ds-n1/assess.mjs';
test('"... and the request was not granted" against "... and the request was granted" is a contradiction', () => {
  const src = 'On March 26, 2019, Complainant requested light duty, and the request was granted. She returned to work the next week.';
  assert.ok(codes(run('On March 26, 2019, Complainant requested light duty, and the request was not granted.', src)).includes('NEGATION_CONFLICT'));
});
test('a date one day off from the sentence the statement copies is a mismatch even when that date appears nearby', () => {
  const src = 'On August 12, 2019, PM went up to Hallway A and gave Complainant ugly stares. On August 13, 2019, PM sent an email to the team.';
  assert.ok(codes(run('On August 13, 2019, PM went up to Hallway A and gave Complainant ugly stares.', src)).includes('DATE_MISMATCH'));
});
test('month-and-year dates are read for dropped-date questions only', () => {
  assert.deepEqual(monthDates('In February 2020 she complained; on 3 March 2021 she left; by Sept. 2019 it was closed.'), ['2020-02', '2019-09']);
});
test('a changed figure in a short list item is a mismatch; the right figure is not', () => {
  const src = 'The physician limited Complainant to sitting for 3 hours a day and walking for 30 minutes. She could stand for 10 minutes at a time.';
  const rec = (n) => `Her medical restrictions include significant limitations:\n- Sitting: ${n} hours maximum\n- Walking: limited to 30 minutes\n`;
  assert.ok(codes(run(rec(6), src)).includes('NUMBER_MISMATCH'));
  assert.ok(!codes(run(rec(3), src)).includes('NUMBER_MISMATCH'));
});
test('a speaker replaced by "an individual" is dropped even when the role is mentioned elsewhere in the sentence', () => {
  const src = 'The Agency noted that reprisal only applied to claim 2 as the Agency’s records showed no prior activity before that date.';
  assert.ok(codes(run('An individual noted that reprisal only applied to claim 2 as the Agency’s records showed no prior activity before that date.', src)).includes('SPEAKER_OMITTED'));
});
