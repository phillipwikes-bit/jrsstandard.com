// Candidate output vocabulary, workspace vocabulary, and packet and export language.
// The candidate runs on a SYNTHETIC fixture with its deterministic mock adapter: no provider, no
// real record, no network. Everything is imported from MI_ROOT, so a mutated copy is what runs.
import { t, done, ROOT, read, scan, net } from './_helpers.mjs';

const E = await import(ROOT + 'lib/engine-candidate/explanations.js');
const { runCandidate, PROMPT_VERSION, SYSTEM_PROMPT } = await import(ROOT + 'lib/engine-candidate/review-candidate.js');
const { buildReviewerPacket } = await import(ROOT + 'lib/engine-candidate/reviewer-packet.js');
const { createMockAdapter } = await import(ROOT + 'lib/engine-candidate/mock-adapter.js');
const { explanationIdFor, ADAPTER_CONTRACT } = await import(ROOT + 'lib/engine-candidate/adapter.js');
const C = await import(ROOT + 'tools/local-reviewer-workspace/app/core.js');
const { SYNTHETIC_DEMO_PACKET } = await import(ROOT + 'tools/local-reviewer-workspace/app/demo-packet.js');

const LABELS = scan.CODEBOOK_LABELS;
const strings = (o, out = []) => { if (typeof o === 'string') out.push(o); else if (o && typeof o === 'object') Object.values(o).forEach((v) => strings(v, out)); return out; };
const values = (o, key, out = []) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === key) out.push(v); values(v, key, out); } return out; };
const unsupported = (texts, where) => texts.flatMap((s) => scan.scanText(s, where)).filter((f) => !['ALLOWED', 'HISTORICAL_ONLY'].includes(f.disposition));
const BANNED_EXPORT = /\b(compliant|compliance|approved|defensible|certified|validated)\b/i;

// ---- a synthetic candidate run ---------------------------------------------------------------------
const text = read('tests/engine-candidate/fixtures/SYNTHETIC-SAE-03-GAPS.txt');
const IDS = { model_id: 'mock-vocabulary', model_version: 'synthetic', prompt_version: PROMPT_VERSION };
const keys = Object.keys(E.CONDITION_CATEGORY);
const response = { adapter_contract: ADAPTER_CONTRACT, ...IDS, completion: 'complete',
  conditions: Object.fromEntries(keys.map((k) => [k, { status: 'review', explanation_id: explanationIdFor('condition', k), note: 'The record states this only in part.', uncertain: false }])),
  findings: Object.keys(E.FLAW_CATEGORY).filter((f) => f !== 'truncation').slice(0, 2).map((type) => ({ type, quotation: 'As discussed on the call, the agreement will follow.', explanation_id: explanationIdFor('flaw', type), note: 'The record does not show this.', uncertain: false })),
  revision_needed: null };
const result = await runCandidate({ text, profile: { record_type: 'supplier_access_exception', completion_status: 'completed', hr_related: false }, record_ref: 'SYNTHETIC-MI-VOCAB' },
  { adapter: createMockAdapter({ ...IDS, respond: () => response }), now: () => '2026-10-06T00:00:00Z' });
const packet = buildReviewerPacket(result, text);
const outTexts = strings(result).concat(strings(packet));
t('the synthetic run produced explanations for every candidate key', keys.every((k) => explanationIdFor('condition', k)) && values(result, 'explanation').filter(Boolean).length >= keys.length);

// ---- candidate output vocabulary -----------------------------------------------------------------
const u1 = unsupported(outTexts, 'candidate-output');
t('candidate output: no text presents a key as a JRS condition or maps it to a Codebook term', u1.length === 0, u1.map((f) => f.classification + ' ' + f.phrase).join(' | '));
const u2 = unsupported(E.allExplanationTexts(), 'explanations');
t('candidate explanation set: no unsupported mapping in any label, meaning or question', u2.length === 0, u2.map((f) => f.classification + ' ' + f.phrase).join(' | '));
const corr = values(result, 'codebook_correspondence').concat(values(packet, 'codebook_correspondence'));
t('candidate output: every explanation says codebook_correspondence "not_asserted"', corr.length > 0 && corr.every((v) => v === 'not_asserted'));
const labels = values(result, 'label').concat(values(packet, 'label')).concat(Object.values(E.CATEGORIES).map((c) => c.label));
t('candidate output: no label is a Codebook condition name', labels.every((l) => !LABELS.some((n) => String(l).trim().toLowerCase() === n.toLowerCase())), labels.filter((l) => LABELS.some((n) => String(l).trim().toLowerCase() === n.toLowerCase())).join(','));
t('candidate output: no label pairs a Codebook condition name with a candidate key', labels.every((l) => !(LABELS.some((n) => String(l).includes(n)) && scan.CANDIDATE_KEYS.some((k) => String(l).includes(k)))));
t('candidate: the explicitly unmapped keys have no explanation category', E.EXPLICITLY_UNMAPPED_KEYS.every((k) => E.CONDITION_CATEGORY[k] === null));
t('candidate: cold_reviewer_clarity and accountability_support explanations say they are not JRS conditions', ['cold_reviewer_clarity', 'accountability_support'].every((k) => /not a JRS condition/.test(E.explainCondition(k).meaning)));
t('candidate prompt: the keys are described as candidate review keys, not Codebook conditions', /candidate review keys/.test(SYSTEM_PROMPT) && /not the JRS Codebook conditions/.test(SYSTEM_PROMPT));
const prep = result.extraction_findings.filter((f) => f.origin === 'source_prep');
const prepTexts = prep.flatMap((f) => strings(f));
t('source-prep findings are present in the synthetic run', prep.length > 0);
t('source-prep findings are not presented as JRS findings or determinations', prepTexts.every((s) => !/\bJRS\b/.test(s)) && unsupported(prepTexts, 'source-prep').length === 0);
t('source-prep explanation labels never use the word JRS', ['placeholder', 'referenced_material_not_in_record', 'off_record_reference', 'assertion_without_basis', 'pages_missing', 'ends_mid_sentence', 'unclosed_quotation', 'instruction_like_text'].every((c) => !/\bJRS\b/.test(JSON.stringify(E.explainExtraction(c)))));

// ---- workspace vocabulary ------------------------------------------------------------------------
t('workspace: the Codebook notice opens with "No Codebook correspondence asserted."', C.CODEBOOK_NOTICE.startsWith('No Codebook correspondence asserted.') && C.NO_CORRESPONDENCE === 'No Codebook correspondence asserted.');
t('workspace: section titles use neutral wording and never say JRS', Object.values(C.SECTIONS).every((s) => !/\bJRS\b|\bCodebook\b/.test(s)) && C.SECTIONS.candidate_prompts === 'Candidate review prompts and findings');
const findings = C.listFindings(SYNTHETIC_DEMO_PACKET);
t('workspace: every finding in the demo packet resolves to the unmapped notice', findings.length > 0 && findings.every((f) => C.codebookTextFor(f) === 'No Codebook correspondence asserted.'));
t('workspace: every finding resolves through the register term categories', findings.every((f) => ['SOURCE_PREP_CHECK', 'MODEL_OUTPUT_CHECK', 'CANDIDATE_KEY', 'CANDIDATE_FLAW_TYPE'].includes(C.termOf(f)[0]) && C.termOf(f)[1]));
const ws = read('tools/local-reviewer-workspace/app/workspace.js');
const card = ws.slice(ws.indexOf('function findingCard('), ws.indexOf('// ---- human review'));
t('workspace: every finding card renders the Codebook row, outside the explanation branch', /\n  \}\n  row\(dl, 'Codebook', C\.codebookTextFor\(f\)\);\n/.test(card));
t('workspace: every candidate key status line carries the Codebook notice', /C\.codebookCorrespondenceText\(C\.TERM_CATEGORY\.condition, k\)/.test(ws.slice(ws.indexOf('function renderKeyStatus('), ws.indexOf('function quotationRows('))));
t('workspace: no hard-coded Codebook wording outside the generated snapshot', !/No Codebook mapping asserted/.test(ws + read('tools/local-reviewer-workspace/app/core.js')) && !LABELS.some((n) => ws.includes(n)));
t('workspace: the unmapped notice is served by the loopback server', /'\/correspondence\.js': \['correspondence\.js'/.test(read('tools/local-reviewer-workspace/serve.mjs')));
const own = (s) => [...s.matchAll(/'([^'\\]|\\.)*'/g)].map((m) => m[0].slice(1, -1));
const u3 = unsupported(own(ws).concat(own(read('tools/local-reviewer-workspace/app/core.js'))).concat(read('tools/local-reviewer-workspace/app/index.html').replace(/<[^>]+>/g, '\n').split('\n')), 'workspace');
t('workspace: no string or page text presents a key as a JRS condition', u3.length === 0, u3.map((f) => f.phrase).join(' | '));

// ---- packet and export language --------------------------------------------------------------------
// Packet wording written by the candidate, not quoted from the record: quotations and model notes
// carry the record's own words, and "who approved each step" describes the record, not a verdict.
const RECORD_FIELDS = new Set(['quotation', 'note', 'model_note', 'text']);
const ownStrings = (o, out = []) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (typeof v === 'string') { if (!RECORD_FIELDS.has(k)) out.push(v); } else ownStrings(v, out); } return out; };
const own2 = ownStrings(result).concat(ownStrings(packet));
const VERDICT = /(?<!\bnot\s|\bno\s)\b(compliant|compliance|defensible|certified|validated)\b|\b(is|are|as|marked|deemed|been)\s+(approved|compliant|defensible|validated)\b/i;   // a negated use ("Not validated") is a disclaimer, not a verdict
t('packet: the candidate\'s own wording carries no "compliant", "defensible", "certified" or "validated", and no approved verdict', own2.length > 20 && own2.every((s) => !VERDICT.test(s)), own2.filter((s) => VERDICT.test(s)).slice(0, 2).join(' | '));
const session = C.createSession(SYNTHETIC_DEMO_PACKET);
C.setReviewer(session, 'REVIEWER-FIXTURE', '2026-10-06');
for (const f of findings) C.setDisposition(session, { finding_id: f.id, review_id: session.identity.review_id, packet_digest: session.identity.packet_digest, disposition: 'NEEDS_CLARIFICATION', note: '', acknowledged: true });
C.signOff(session, true);
const exported = JSON.stringify(C.buildExport(session));
t('export: no "compliant", "approved", "defensible", "certified" or "validated"', !BANNED_EXPORT.test(exported), (exported.match(BANNED_EXPORT) || [''])[0]);
t('export: no Codebook condition name and no JRS condition wording', !LABELS.some((n) => exported.includes(n)) && !/JRS condition/.test(exported));
t('export: the limitation still disclaims validity, correctness and production use', /does not authenticate the reviewer, establish legal validity, establish semantic correctness, or authorize production use/.test(C.LIMITATION));
t('no network request was attempted', net.calls === 0);
done();
