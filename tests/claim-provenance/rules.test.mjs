// Governing claim rules and register integrity. Each "refused" check takes a valid committed
// claim, makes the one change named, and requires the validator to reject it.
import { mkdtempSync, mkdirSync, copyFileSync, appendFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { t, done, ROOT, FRESH, REGISTER, ctx, build, rules, claim, problems, read, exists } from './_helpers.mjs';

t('a fresh build has no problems', FRESH.problems.length === 0, FRESH.problems.slice(0, 3).join(' | '));
const stale = Object.entries(FRESH.out).filter(([p, text]) => !exists(p) || read(p) !== text).map(([p]) => p);
t('documentation drift: committed register, Markdown, matrix and claim cards equal a fresh build', stale.length === 0, stale.join(', '));
t('every committed claim passes every governing rule', REGISTER.claims.every((c) => problems(c).length === 0), REGISTER.claims.filter((c) => problems(c).length).map((c) => problems(c)[0]).join(' | '));
t('the status summary counts the claims', JSON.stringify(REGISTER.status_summary) === JSON.stringify(rules.statusSummary(REGISTER.claims)) && REGISTER.claim_count === REGISTER.claims.length);
t('claim ids are unique and sequential', REGISTER.claims.every((c, i) => c.claim_id === 'CL-' + String(i + 1).padStart(3, '0')));

const has = (c, re) => problems(c).some((p) => re.test(p));
const mut = (id, f) => { const c = claim(id); f(c); return c; };
// ---- the rejections the package requires --------------------------------------------------------------
t('refused: a claim with no evidence source', has(mut('CL-001', (c) => { c.evidence_id = 'EV-NONE'; c.source_path = null; c.source_hash = null; c.evidence_class = 'NONE'; }), /no evidence source|differs|hash|NONE|not an allowed/));
t('refused: a required denominator dropped even when every other qualifier is kept', has(mut('CL-012', (c) => { c.permitted_wording = c.permitted_wording.replace('108 determinations', 'the determinations'); }), /G09 the permitted wording omits the required denominator/) && problems(mut('CL-012', (c) => { c.permitted_wording = c.permitted_wording.replace('108 determinations', 'the determinations'); })).length === 1);
t('refused: a claim with no evidence source that is not marked NOT_SUPPORTED, NOT_ASSESSED or RETIRED', problems(mut('CL-031', (c) => { c.status = 'SOURCE_REPORTED_NOT_REPRODUCED'; })).some((p) => /no evidence source/.test(p)));
t('refused: a claim naming an unknown evidence source', has(mut('CL-001', (c) => { c.evidence_id = 'EV-INVENTED'; }), /unknown evidence source/));
t('refused: a numerical claim with no denominator where one is required', has(mut('CL-005', (c) => { c.permitted_wording = c.permitted_wording.replace(/61 recorded runs/, 'recorded runs'); }), /denominator|61-run/));
t('refused: a detection claim labelled reliability', has(mut('CL-001', (c) => { c.permitted_wording = 'On a constructed 24-record corpus, 16 reviewers showed 83.9 percent reliability.'; }), /G01/));
t('refused: a cross-model agreement claim labelled accuracy', has(mut('CL-005', (c) => { c.permitted_wording = 'Across 61 recorded runs, the models were 85.3 percent accurate; raw agreement ranged from 66.7 to 93.3 percent.'; }), /G03/));
t('refused: a constructed-corpus result presented as real-world', has(mut('CL-001', (c) => { c.permitted_wording = 'On a constructed 24-record corpus, 16 reviewers reached 83.9 percent, which is the accuracy to expect on real records.'; }), /G04/));
t('refused: an Engine-validation claim supported only by JRS research', has(mut('CL-001', (c) => { c.claim_text = 'The Review Engine is validated at 83.9 percent accuracy.'; }), /G07/));
t('refused: a research claim that infers anything about the Engine', has(mut('CL-004', (c) => { c.engine_relationship = 'ENGINE_EVIDENCE_SEPARATE'; }), /G07/));
t('refused: a local mock or fixture presented as production evidence', has(mut('CL-016', (c) => { c.permitted_wording = 'A local run with a mock adapter over 15 constructed records shows production behaviour.'; }), /G05/));
t('refused: a source-grounding test presented as semantic validation', has(mut('CL-014', (c) => { c.permitted_wording = 'Each candidate quotation occurs exactly in the record, which proves the finding is semantically correct; this is not semantic support.'; }), /G06/) && has(mut('CL-014', (c) => { c.limitation = 'Quotations are checked against the record text.'; }), /G06/));
t('refused: a status claim of licensing-ready or sale-ready', has(mut('CL-029', (c) => { c.permitted_wording = 'JRS is licensing-ready and sale-ready; no licensing pathway is closed.'; }), /G11/) && has(mut('CL-018', (c) => { c.claim_text = 'The Engine is licensing-ready.'; }), /G11|G07/));
t('refused: a claim that omits its recorded limitation', has(mut('CL-001', (c) => { c.permitted_wording = '16 reviewers reached 83.9 percent accuracy (24 records).'; }), /G12/));
t('refused: a changed source hash with an unreconciled claim', has(claim('CL-001'), /x^/) === false && rules.validateClaim(claim('CL-001'), { ...ctx, evidence: ctx.evidence.map((e) => e.id === 'EV-DETECTION-ARTICLE' ? { ...e, current_hash: 'f'.repeat(64) } : e) }).some((p) => /unreconciled/.test(p)));
t('refused: a source hash that is not the reviewed hash', has(mut('CL-001', (c) => { c.source_hash = 'FILE:' + 'a'.repeat(64); }), /reviewed hash/));
t('refused: a policy or website statement used to support a control claim', has(mut('CL-021', (c) => { c.status = 'SUPPORTED_WITH_LIMITATION'; c.limitation_key = 'operator'; }), /G08/));
t('refused: a historical claim presented without a historical marker', has(mut('CL-007', (c) => { c.permitted_wording = 'Single runs read 84 percent and 86.7 percent; the series closed on 21 August 2026.'; c.limitation_key = null; }), /G10/));
t('refused: a permitted wording that repeats a prohibited overstatement', has(mut('CL-004', (c) => { c.permitted_wording += ' In short, substantial agreement.'; }), /prohibited overstatement/));
t('refused: reviewer agreement presented as correctness', has(mut('CL-004', (c) => { c.permitted_wording = 'In a separate reliability sample of 10 records, AC1 of 0.739 shows the reviewers were correct; the criterion was not met.'; }), /G02/));
t('refused: a NOT_SUPPORTED claim marked for public statement', has(mut('CL-026', (c) => { c.public_use = 'MAY_STATE_WITH_LIMITATION'; }), /must not be stated/));

// ---- denominators and windows are never interchangeable ---------------------------------------------------
const c6 = claim('CL-006');
t('the 37-, 41- and 61-run figures stay distinct: CL-006 prohibits the 82.2 range with a 61-run denominator', c6.scan.prohibited.some(([, p]) => new RegExp(p, 'i').test('82.2 to 93.3 percent across 61 recorded runs')));
t('CL-005 requires its own 61-run denominator, and CL-006 its 37- or 41-run window in the same sentence', claim('CL-005').scan.qualifiers.some(([n]) => /61-run/.test(n)) && c6.scan.qualifiers.filter(([, , s]) => s === 'sentence').length === 2);
t('the claim records keep each run count with its own window', /37 runs[^.]*13 August 2026/.test(c6.claim_text) && /41 nightly runs \(29 June to 15 August\)/.test(c6.claim_text) && /61 recorded runs between 12 June and 21 August 2026/.test(claim('CL-005').claim_text));
t('the unreconciled series dates are recorded as a limitation, not resolved', /2026-06-13/.test(claim('CL-005').limitation) && /not reconciled/.test(claim('CL-005').limitation));
t('source-reported figures are marked as such, not as reproduced', REGISTER.claims.filter((c) => ['MANUSCRIPT_REPORTED', 'AUTHORITATIVE_TABLE_READ_REPORTED', 'STRUCTURED_SECONDARY_ANALYSIS'].includes(c.evidence_class)).every((c) => c.reproduction === 'SOURCE_REPORTED'));
t('no claim describes the Engine as ready, validated or compliant except the NOT_SUPPORTED records that forbid it', REGISTER.claims.filter((c) => rules.asserts(c.claim_text, rules.READINESS)).every((c) => c.status === 'NOT_SUPPORTED'));

// ---- the builder refuses a changed source -----------------------------------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), 'jrs-cp-src-'));
for (const e of FRESH.evidence.filter((x) => x.path)) { mkdirSync(dirname(join(tmp, e.path)), { recursive: true }); copyFileSync(join(ROOT, e.path), join(tmp, e.path)); }
t('the builder accepts every evidence source exactly as reviewed', build.currentEvidence(tmp).every((e) => !e.problem), build.currentEvidence(tmp).filter((e) => e.problem).map((e) => e.problem).join(' | '));
appendFileSync(join(tmp, 'research/deliverables_2026-08-29/Detection_Article_2026-08-29.md'), '\nedited\n');
t('the builder refuses a FILE-bound source that changed since review', build.currentEvidence(tmp).some((e) => e.id === 'EV-DETECTION-ARTICLE' && /changed since it was reviewed/.test(e.problem)));
appendFileSync(join(tmp, 'research/MASTER_TRACKER.md'), '\n- unrelated new log line\n');
t('a LINE-bound source ignores unrelated new lines in an append-only log', !build.currentEvidence(tmp).find((e) => e.id === 'EV-TRACKER-COUNTRIES').problem);
rmSync(tmp, { recursive: true, force: true });
done();
