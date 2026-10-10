// The separated review workspaces (verifier section E).
import { t, done, M, has } from './_helpers.mjs';
const W = M.ws, P = M.probes;
const mk = (freezes) => W.createEvaluationWorkspace({ mode: 'synthetic_probe', freezes }).workspace;
const ws0 = mk();
t('four workspaces exist and are separate lists', W.WORKSPACES.join() === 'extraction,interpretation,comparison,adjudication' && W.WORKSPACES.every((w) => Array.isArray(ws0[w])));
t('a real evaluation workspace needs an admitted intake, which this package never produces', has(W.createEvaluationWorkspace({ mode: 'evaluation', intakeDecision: M.intake.validateIntake(P.BASE_INTAKE) }), 'intake_not_admitted', 'WS-00')
  && has(W.createEvaluationWorkspace({ mode: 'evaluation' }), 'intake_not_admitted', 'WS-00'));
t('an unknown mode is refused', !W.createEvaluationWorkspace({ mode: 'demo' }).ok);
t('a freeze without an owner freeze record is refused', has(W.createEvaluationWorkspace({ mode: 'synthetic_probe', freezes: { codebook: { frozen: true, freeze_record_ref: null } } }), 'freeze_without_record', 'WS-00'));
t('a probe cannot use a real-looking freeze reference', has(W.createEvaluationWorkspace({ mode: 'synthetic_probe', freezes: { codebook: { frozen: true, freeze_record_ref: 'OWNER-FREEZE-1' } } }), 'probe_freeze_not_synthetic', 'WS-00'));
// Each kind belongs in exactly one workspace.
const items = { RECORD_SUPPORTED_FACT: P.fact('F-1'), HUMAN_INTERPRETATION: P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC1', 'INFORMATION_MISSING'), CANDIDATE_ENGINE_OUTPUT: P.candidate('K-1', 'basis_identification') };
for (const [kind, item] of Object.entries(items)) for (const w of W.WORKSPACES) {
  const r = W.addItem(ws0, w, item), home = W.KIND_WORKSPACE[kind];
  t(kind + ' in ' + w + (w === home ? ' is accepted' : ' is refused (workspaces never collapse)'), w === home ? r.ok : has(r, 'wrong_workspace', 'WS-01'), JSON.stringify(r.codes));
}
t('a gate conclusion is refused in every workspace', W.WORKSPACES.every((w) => has(W.addItem(ws0, w, { kind: 'GATE_CONCLUSION', item_id: 'G', author: { kind: 'human', role: 'owner', token: 'SYNTHETIC-O' } }), 'gate_conclusion_outside_authority', 'WS-01')));
t('the seven distinctions each have their own representation', ['RECORD_SUPPORTED_FACT', 'EXTRACTION_ARTIFACT', 'HUMAN_INTERPRETATION', 'CANDIDATE_ENGINE_OUTPUT', 'REVIEWER_DISAGREEMENT', 'ADJUDICATED_CONCLUSION'].every((k) => W.KIND_WORKSPACE[k]) && !W.KIND_WORKSPACE.GATE_CONCLUSION);
// Condition mapping.
for (const id of ['RC1', 'RC2', 'RC3', 'RC4', 'RC5']) t('an interpretation of ' + id + ' is accepted', W.addItem(ws0, 'interpretation', P.interp('I-' + id, 'SYNTHETIC-REVIEWER-A', id, 'INFORMATION_MISSING')).ok);
for (const bad of ['Reconstructability', 'Identifiable basis', 'RC6', '', 'Evidentiary Sufficiency']) t('condition "' + bad + '" stored in place of an ID is refused', has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-REVIEWER-A', bad, 'INFORMATION_MISSING')), 'unmapped_condition', 'WS-04'));
for (const k of ['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity', 'accountability_support', 'temporal_reconstructability']) {
  t('candidate key ' + k + ' is refused as a condition', has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-REVIEWER-A', k, 'INFORMATION_MISSING')), 'candidate_key_as_condition', 'WS-04'));
  t('candidate output for ' + k + ' is accepted only without a condition', W.addItem(ws0, 'comparison', P.candidate('K-x', k)).ok && has(W.addItem(ws0, 'comparison', P.candidate('K-x', k, { condition_id: 'RC1' })), 'candidate_key_mapped_to_condition', 'WS-05'));
}
t('an interpretation not made blind to candidate output is refused', has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-REVIEWER-A', 'RC1', 'INFORMATION_MISSING', { blind_to_candidate_output: false })), 'not_blind_to_candidate_output', 'WS-05'));
// Determinations, uncertainty and absence.
for (const d of M.voc.DETERMINATIONS) t('determination ' + d + ' is accepted in its complete form', W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-REVIEWER-A', 'RC3', d)).ok);
t('an affirmative defect and a no-defect observation each need a location', ['AFFIRMATIVE_DEFECT', 'NO_DEFECT_OBSERVED'].every((d) => has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-REVIEWER-A', 'RC3', d, { location_refs: [] })), 'determination_without_location', 'WS-06')));
t('missing information must name what is missing (absence is not a defect)', has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-REVIEWER-A', 'RC3', 'INFORMATION_MISSING', { missing_element: null })), 'missing_element_not_named', 'WS-06'));
t('insufficient basis to assess needs a reason', has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-REVIEWER-A', 'RC3', 'INSUFFICIENT_BASIS_TO_ASSESS', { reason: '' })), 'insufficient_basis_without_reason', 'WS-06'));
t('an unknown determination or uncertainty is refused', has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-REVIEWER-A', 'RC3', 'PASS')), 'determination_invalid', 'WS-06') && has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-REVIEWER-A', 'RC3', 'INFORMATION_MISSING', { uncertainty: 'certain' })), 'uncertainty_invalid', 'WS-06'));
t('a record-supported fact needs a location', has(W.addItem(ws0, 'extraction', P.fact('F-x', { location_refs: [] })), 'fact_without_location', 'WS-06'));
t('a location reference carrying text is refused', has(W.addItem(ws0, 'extraction', P.fact('F-x', { location_refs: [{ source_ref: 'SYNTHETIC', locator: 'p1', excerpt: 'x' }] })), 'record_text_in_workspace', 'WS-02'));
for (const f of ['text', 'quote', 'quotation', 'excerpt', 'record_text']) t('record text in field "' + f + '" is refused', has(W.addItem(ws0, 'extraction', P.fact('F-x', { [f]: 'SYNTHETIC' })), 'record_text_in_workspace', 'WS-02'));
// Inference screen.
for (const [g, s] of [['emotion', 'the approver was frustrated'], ['intent', 'the lead acted deliberately'], ['motive', 'motivated by a hidden agenda'], ['payoff', 'stood to gain personally'], ['credibility', 'the requester is not credible'], ['clinical', 'signs of a mental health issue'], ['legal_conclusion', 'the supplier is liable'], ['compliance_conclusion', 'the exception is not compliant']])
  t('a ' + g + ' inference in a note is refused', has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-REVIEWER-A', 'RC4', 'INFORMATION_MISSING', { note: s })), 'prohibited_inference', 'WS-07'));
// Authorship.
t('an interpretation generated by code is refused', has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'SYNTHETIC-R', 'RC4', 'INFORMATION_MISSING', { author: { kind: 'code', role: 'independent_reviewer', token: 'SYNTHETIC-CODE' } })), 'author_not_permitted', 'WS-03'));
t('a probe workspace refuses a non-synthetic token', has(W.addItem(ws0, 'interpretation', P.interp('I-x', 'UNMARKED-TOKEN', 'RC4', 'INFORMATION_MISSING')), 'probe_token_not_synthetic', 'WS-03'));
t('a duplicate item ID is refused', (() => { const a = W.addItem(ws0, 'extraction', P.fact('F-1')); return a.ok && has(W.addItem(a.workspace, 'extraction', P.fact('F-1')), 'item_id_missing_or_duplicate', 'WS-01'); })());
t('adding an item never changes the workspace it is given', (() => { const before = JSON.stringify(ws0); W.addItem(ws0, 'extraction', P.fact('F-9')); return JSON.stringify(ws0) === before; })());
// Disagreement, adjudication, agreement and DRR.
const F = mk(P.SYNTHETIC_FREEZES);
const one = W.addItem(F, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'INFORMATION_MISSING')).workspace;
t('one reviewer cannot produce an agreement result, even with every freeze recorded', has(W.computeAgreement(one), 'single_reviewer_agreement', 'WS-10'));
const sameReviewer = W.addItem(one, 'interpretation', P.interp('I-2', 'SYNTHETIC-REVIEWER-A', 'RC2', 'NO_DEFECT_OBSERVED')).workspace;
t('two interpretations by the same reviewer still count as one reviewer', has(W.computeAgreement(sameReviewer), 'single_reviewer_agreement', 'WS-10'));
const two = W.addItem(one, 'interpretation', P.interp('I-3', 'SYNTHETIC-REVIEWER-B', 'RC2', 'NO_DEFECT_OBSERVED')).workspace;
t('with two reviewers and every freeze, agreement is still not computed (no protocol implemented)', has(W.computeAgreement(two), 'agreement_not_implemented', 'WS-10') && !W.computeAgreement(two).ok);
const twoOpen = W.addItem(W.addItem(ws0, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'INFORMATION_MISSING')).workspace, 'interpretation', P.interp('I-3', 'SYNTHETIC-REVIEWER-B', 'RC2', 'NO_DEFECT_OBSERVED')).workspace;
t('with two reviewers and no freezes, agreement is refused before freeze', has(W.computeAgreement(twoOpen), 'agreement_before_freeze', 'WS-10'));
t('a DRR score is refused before freeze, naming every open freeze', has(W.computeDrrScore(twoOpen), 'drr_score_before_freeze', 'WS-11') && /codebook, interpretation, calibration, adjudication_protocol/.test(W.computeDrrScore(twoOpen).codes[0].message));
t('a DRR score is not computed even after every freeze', has(W.computeDrrScore(two), 'drr_score_not_implemented', 'WS-11') && !W.computeDrrScore(two).ok);
const dis = W.addItem(two, 'comparison', { kind: 'REVIEWER_DISAGREEMENT', item_id: 'D-1', author: { kind: 'code', role: 'comparison_tool', token: 'SYNTHETIC-TOOL' }, interpretation_ids: ['I-1', 'I-3'], location_refs: [] });
t('a disagreement between two reviewers on one condition is recorded in comparison', dis.ok);
t('a disagreement naming one reviewer, or the same determination, is refused', has(W.addItem(sameReviewer, 'comparison', { kind: 'REVIEWER_DISAGREEMENT', item_id: 'D-2', author: { kind: 'code', role: 'comparison_tool', token: 'SYNTHETIC-TOOL' }, interpretation_ids: ['I-1', 'I-2'], location_refs: [] }), 'disagreement_needs_two_reviewers', 'WS-08'));
const adj = (ws, token, over = {}) => W.addItem(ws, 'adjudication', { kind: 'ADJUDICATED_CONCLUSION', item_id: 'A-1', author: { kind: 'human', role: 'adjudicator', token }, disagreement_id: 'D-1', condition_id: 'RC2', adjudication_protocol_version: 'SYNTHETIC-ADJ-0', location_refs: [], ...over });
t('an adjudicator distinct from the reviewers may adjudicate under a frozen protocol (synthetic probe)', adj(dis.workspace, 'SYNTHETIC-ADJUDICATOR').ok);
t('a reviewer cannot adjudicate their own disagreement', has(adj(dis.workspace, 'SYNTHETIC-REVIEWER-B'), 'adjudicator_is_a_reviewer', 'WS-09'));
t('adjudication is refused without a frozen adjudication protocol', has(adj({ ...dis.workspace, freezes: { ...dis.workspace.freezes, adjudication_protocol: { frozen: false, freeze_record_ref: null } } }, 'SYNTHETIC-ADJUDICATOR'), 'adjudication_protocol_not_frozen', 'WS-09'));
t('adjudication by code is refused', has(W.addItem(dis.workspace, 'adjudication', { kind: 'ADJUDICATED_CONCLUSION', item_id: 'A-2', author: { kind: 'code', role: 'adjudicator', token: 'SYNTHETIC-CODE' }, disagreement_id: 'D-1', condition_id: 'RC2', adjudication_protocol_version: 'x', location_refs: [] }), 'author_not_permitted', 'WS-03'));
done();
