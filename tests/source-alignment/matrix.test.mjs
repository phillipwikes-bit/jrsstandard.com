// The control extraction matrix (work package B).
import { t, done, ROOT, read, json, M } from './_helpers.mjs';

const X = json('tools/source-alignment/CONTROL_EXTRACTION_MATRIX.json');
const S = M.sources.openSources(ROOT);
const STAT = ['ALIGNED', 'PARTIALLY_ALIGNED', 'CONFLICT', 'NOT_IMPLEMENTED', 'NOT_ASSESSED', 'REQUIRES_HUMAN_ACTION'];
t('the matrix holds 55 controls, built from the committed control data', X.control_count === 55 && X.controls.length === M.controls.CONTROLS.length);
t('totals: 23 aligned, 16 partial, 6 conflict, 2 not implemented, 1 not assessed, 7 human action', JSON.stringify(X.totals) === JSON.stringify({ ALIGNED: 23, PARTIALLY_ALIGNED: 16, CONFLICT: 6, NOT_IMPLEMENTED: 2, NOT_ASSESSED: 1, REQUIRES_HUMAN_ACTION: 7 }), JSON.stringify(X.totals));
t('control IDs are unique and stable', new Set(X.controls.map((c) => c.control_id)).size === X.controls.length && X.controls.every((c) => /^(SAC|RAC)-\d\d$/.test(c.control_id)));
const fields = ['control_id', 'source_id', 'source_sha256', 'locator', 'control_type', 'required_interpretation', 'current_repository_status', 'evidence', 'status', 'limitation', 'requirement_paraphrase'];
t('every control has every required field', X.controls.every((c) => fields.every((f) => f in c)));
t('every status is one of the six classifications', X.controls.every((c) => STAT.includes(c.status)));
for (const c of X.controls) {
  const s = S[c.source_id];
  const ok = c.locator.line_sha256.every((h, i) => h === M.sources.lineHash(s, c.locator.lines[0] + i)) && (c.also_at || []).every((a) => a.line_sha256.every((h, i) => h === M.sources.lineHash(S[a.source_id], a.lines[0] + i)));
  t(c.control_id + ': locator ' + c.source_id + ' ' + c.locator.lines.join('-') + ' reproduces against the source by line hash, and the source hash matches', ok && c.source_sha256 === s.sha256);
}
t('47 controls come from the October 3 sources, 8 from the handoff or preserved owner decisions', X.controls.filter((c) => ['S01', 'S02', 'S03'].includes(c.source_id)).length === 47 && X.controls.filter((c) => ['H05', 'D3'].includes(c.source_id)).length === 8);
t('controls with no October 3 source say so', X.controls.filter((c) => c.no_october_3_control).every((c) => c.tier === 'REPOSITORY_SOURCE') && X.controls.filter((c) => c.no_october_3_control).length === 4);
t('historical-context controls cite only the retained historical ranges', X.controls.filter((c) => c.tier === 'HISTORICAL_CONTEXT').every((c) => { const r = json('tools/source-alignment/SOURCE_INTEGRITY_RECEIPT.json').sources.find((x) => x.source_id === c.source_id); return c.locator.lines[0] >= r.historical_lines[0]; }));
t('supplement controls cite only the controlling ranges', X.controls.filter((c) => c.tier === 'SUPPLEMENT').every((c) => { const r = json('tools/source-alignment/SOURCE_INTEGRITY_RECEIPT.json').sources.find((x) => x.source_id === c.source_id); return c.locator.lines[1] <= r.controlling_lines[1]; }));
for (const topic of M.verify.REQUIRED_TOPICS) t('the brief topic "' + topic + '" has at least one control', X.controls.some((c) => c.topic === topic));
t('the five release-gate requirements each have a control (SAC-08, -09, -10, -12 and RAC-07)', ['SAC-08', 'SAC-09', 'SAC-10', 'SAC-12', 'RAC-07'].every((id) => X.controls.find((c) => c.control_id === id && c.topic === 'release_gates')));
t('every control marked CONFLICT names a recorded conflict', X.controls.filter((c) => c.status === 'CONFLICT').every((c) => c.conflict_ids.length && c.conflict_ids.every((k) => X.conflicts.some((x) => x.id === k))));
t('six conflicts are recorded and none is resolved', X.conflicts.length === 6 && X.conflicts.every((x) => x.resolution === null && x.classification === 'NEEDS_RECONCILIATION'));
t('every REQUIRES_HUMAN_ACTION control names the person and the act, not completed', X.controls.filter((c) => c.status === 'REQUIRES_HUMAN_ACTION').every((c) => c.human_action && c.human_action.role && c.human_action.completed === false));
t('no human action anywhere is marked completed', X.controls.every((c) => !c.human_action || (c.human_action.completed === false && c.human_action.evidence_ref === null)));
t('no evidence item is classed as independent evidence', X.controls.every((c) => c.evidence.every((e) => M.verify.EVIDENCE_CLASSES.includes(e.class))));
t('every ALIGNED or PARTIALLY_ALIGNED control names evidence that exists and contains its cited text', X.controls.filter((c) => ['ALIGNED', 'PARTIALLY_ALIGNED'].includes(c.status)).every((c) => c.evidence.length && c.evidence.every((e) => read(e.path).includes(e.contains))));
t('no approved candidate-key mapping is created (D-2 and D-3 preserved)', /No approved mapping between Engine candidate keys and Codebook conditions is created or implied/.test(X.mapping_statement) && X.controls.find((c) => c.control_id === 'RAC-05').status === 'ALIGNED');
t('the matrix states its quotation policy', /No source text is reproduced/.test(X.quotation_policy));
t('the readable matrix carries every control and conflict', (() => { const md = read('docs/architecture/SOURCE_CONTROL_EXTRACTION_MATRIX.md'); return X.controls.every((c) => md.includes('| ' + c.control_id + ' |')) && X.conflicts.every((x) => md.includes('| ' + x.id + ' |')); })());
done();
