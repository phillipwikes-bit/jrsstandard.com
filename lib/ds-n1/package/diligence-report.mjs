#!/usr/bin/env node
// Buyer and licensee diligence report, generated from live runs.
// Every number is computed when the report is built. It states what is built,
// what it detects on constructed records, what external evidence exists, and
// what is not established. It makes no accuracy, compliance or market claim.
// Usage: node lib/ds-n1/package/diligence-report.mjs out.html [practitioner-totals.json|-] [study-summary.json]
// study-summary.json is the output of research/study/analyze_practitioner_study.mjs (aggregate counts only).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { openReview, deriveState, LIMITATIONS, CANDIDATE, ALLOWED_RECORD_CLASSES } from '../index.mjs';
import { TEMPLATES, TEMPLATE_VERSION, runDetectionTemplates } from '../detection-templates.mjs';
import { SAFEGUARD_VERSION, LENSES, CONTROLS } from '../cognitive-safeguards.mjs';
import { TRIAL_VERSION } from '../practitioner-trial.mjs';
import { createWorkspace, verifyAuditLog, WORKSPACE_VERSION } from '../enterprise/workspace.mjs';
import { escapeHtml as e } from '../text.mjs';
import { runDemo } from '../demo/run-demo.mjs';
import { EXTRACTOR_VERSION } from '../extract.mjs';
import { OMISSION_VERSION } from '../omissions.mjs';
import { EU_LENS_VERSION, EU_CHECKS } from '../eu-ai-act.mjs';

const root = new URL('../../../', import.meta.url);
const AT = '2026-11-19T00:00:00Z';

function realRecordHtml() {
  const row = (k, v) => `<tr><th>${e(k)}</th><td>${v}</td></tr>`;
  const j = (p) => { try { return JSON.parse(readFileSync(new URL(p, root), 'utf8')); } catch { return null; } };
  const h1 = j('tests/ds-n1/REAL_RECORD_HOLDOUT.json'), p1 = j('tests/ds-n1/PARAPHRASE_HOLDOUT.json'), p2 = j('tests/ds-n1/paraphrase-holdout-2/RESULT.json');
  const e1 = j('tests/ds-n1/PUBLIC_RECORD_EVAL.json'), em = j('tests/ds-n1/PUBLIC_RECORD_EVAL_EMPLOYMENT.json'), e2 = j('tests/ds-n1/PUBLIC_RECORD_EVAL_2.json'), e3 = j('tests/ds-n1/PUBLIC_RECORD_EVAL_3.json');
  const rows = [];
  if (h1) rows.push(row('Real-record hold-out 1: fresh EEOC decisions, sealed before any fix (copies, dates removed, speakers removed)', `${h1.n} decisions: identical record reaches READY ${h1.intact_ready} of ${h1.n}; removed dates caught ${h1.dates_flagged} of ${h1.n}; removed speakers caught ${h1.speakers_flagged} of ${h1.n}. <b>Passed.</b>`));
  if (p1) rows.push(row('Paraphrase hold-out 1: AI drafts of 30 public EEOC decisions (second drafter)', `good drafts: ${p1.criterion1_median_P4_findings_per_10} open findings per 10 statements (limit 3, met); lossy summary told apart in ${p1.criterion2_P1_more_dropped} of 30 (needed 24, met); good drafts free of serious flags ${p1.criterion3_P4_ok} of 30 (needed 15, <b>not met</b>)`));
  if (p2) rows.push(row('Paraphrase hold-out 2: same-length AI rewrites of 30 public EEOC decisions', `${p2.criterion1_median_findings_per_10} open findings per 10 statements (limit 3, met); drafts free of serious flags ${p2.criterion2_clean_drafts} of 30 (needed 15, <b>not met</b>)`));
  if (e1) rows.push(row('Outcome test: 14 published records-access decisions and audits (key sealed first)', `every scored document held, so the status does not separate outcomes; practitioner-gap findings matched the outcome on ${e1.secondary.correct} of ${e1.secondary.n} (not significant); ${e1.rows.filter((r) => r.errors).length} too long at the time (limit since raised)`));
  if (em) rows.push(row('Outcome test: 7 published employment decisions read from PDF (key sealed first)', `all ${em.primary.n} held; ${em.primary.correct} of ${em.primary.n} match the outcome: <b>no separation</b>`));
  if (e2) rows.push(row('Study 014 drafts, first sealed run (before the real-record fixes)', `sealed rule not met: lossy summary scored higher in ${e2.primary.P1_higher} of ${e2.primary.pairs} pairs (p ${e2.primary.sign_test_p})`));
  if (e3) rows.push(row('Study 014 reserved decisions, before the real-record fixes', `removed dates or speakers noticed in ${e3.primary.removal_higher} of ${e3.primary.comparisons}; identical records held in ${e3.rows.filter((r) => r.intact.status !== 'READY_FOR_HUMAN_FINALIZATION').length} of ${e3.rows.length} (the failure that led to the fixes)`));
  return `<table>${rows.join('')}</table><p>All texts are published public decisions (EEOC, FLRA, UK Employment Tribunal, New York records-access determinations and audits). Every key and rule was written by the developer and sealed before the run it scores; earlier failed runs are kept, not replaced. Full index: tests/ds-n1/EVIDENCE_INDEX.md.</p>`;
}

function developerFixtureRun() {
  const exp = JSON.parse(readFileSync(new URL('tests/ds-n1/expectations.json', root), 'utf8')).fixtures;
  let agree = 0, falseReady = 0;
  const ids = Object.keys(exp);
  for (const id of ids) {
    const rec = JSON.parse(readFileSync(new URL(`tests/ds-n1/fixtures/${id}.json`, root), 'utf8'));
    const st = deriveState(openReview(rec, { at: AT })).status;
    if (st === exp[id].expected_status) agree++;
    if (exp[id].must_not_be_ready && st === 'READY_FOR_HUMAN_FINALIZATION') falseReady++;
  }
  return { cases: ids.length, agree, falseReady };
}

function partnerRun() {
  const dir = new URL('tests/ds-n1/fixtures-partner/', root);
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const rec = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    const st = deriveState(openReview(rec, { at: AT }));
    const hits = runDetectionTemplates(st);
    return { id: rec.record_id, cls: rec.record_class, status: st.status, findings: st.findings.length, advisories: hits.filter((h) => h.mode === 'advisory').length };
  });
}

function enterpriseSelfCheck() {
  const ws = createWorkspace({ now: () => AT });
  const o = ws.createOrganisation({ name: 'Self-check (fictional)', admin_name: 'Admin' });
  ws.createMatter(o.admin_token, { name: 'M' });
  const log = ws._fullAuditForVerification();
  const ok = verifyAuditLog(log, ws.publicKeyPem).ok;
  const tampered = structuredClone(log); tampered[1].detail = { roles: ['approver'] };
  return { signedLogVerifies: ok, tamperDetected: !verifyAuditLog(tampered, ws.publicKeyPem).ok };
}

function readingRun() {
  const ev = JSON.parse(readFileSync(new URL('tests/ds-n1/EXTRACT_EVAL.json', root), 'utf8'));
  const om = JSON.parse(readFileSync(new URL('tests/ds-n1/OMISSION_EVAL.json', root), 'utf8'));
  const demo = runDemo(new URL('lib/ds-n1/demo/case-harbourline', root).pathname, AT);
  const eu1 = JSON.parse(readFileSync(new URL('tests/ds-n1/EU_AI_ACT_EVAL.json', root), 'utf8'));
  const eu2 = JSON.parse(readFileSync(new URL('tests/ds-n1/EU_AI_ACT_EVAL_2.json', root), 'utf8'));
  return { ev, om, demo, eu1, eu2 };
}
const pctRange = (w) => (w ? `${Math.round(w[0] * 100)} to ${Math.round(w[1] * 100)}%` : 'not computable');

export function buildDiligenceReport({ practitioner, study } = {}) {
  const groups = {}, modes = {};
  for (const t of Object.values(TEMPLATES)) { groups[t.group] = (groups[t.group] || 0) + 1; modes[t.mode] = (modes[t.mode] || 0) + 1; }
  const dev = developerFixtureRun();
  const partner = partnerRun();
  const ent = enterpriseSelfCheck();
  const row = (k, v) => `<tr><th>${e(k)}</th><td>${v}</td></tr>`;
  const rd = readingRun();
  const of = (o) => `${o.matched} of ${o.of}`;
  const st = study && study.reliance && study.reliance.completed;
  const studyHtml = st
    ? `<table>
${row('Record reviewed', e(study.record))}
${row('People who answered at least question 1', `${study.people} (${study.completed} completed all three questions, ${study.question_1_only} answered question 1 only); ${study.countries.n} countries; ${study.excluded_test_rows || 0} developer test submissions excluded`)}
${row('Completed reviewers who would not rely on the record as it stands', `${st.would_not_rely_as_it_stands.k} of ${st.would_not_rely_as_it_stands.n} (${st.would_not_rely_as_it_stands.pct}%; 95% Wilson ${st.would_not_rely_as_it_stands.wilson95_pct.join(' to ')}%); ${st.not_answered} early answer(s) given before the question was asked are not counted`)}
${row('Everyone who answered question 1', `${study.reliance.everyone_who_answered_question_1.would_not_rely_as_it_stands.k} of ${study.reliance.everyone_who_answered_question_1.would_not_rely_as_it_stands.n} would not rely (95% Wilson ${study.reliance.everyone_who_answered_question_1.would_not_rely_as_it_stands.wilson95_pct.join(' to ')}%)`)}
${study.record === 'AR-82' ? row('The tool\'s answer for this record, recorded before any review', 'READY (it would have passed the record)') : row('The tool\'s answer for this record', 'see its locked prediction file')}
</table>
${study.record === 'AR-82' ? '' : '<!--'}<p>This is the finding a buyer most needs to see: most practitioners would not rely on a record the prototype passed. The checks added since target the gaps they raised and are being tested on fresh records, never on this one. Volunteers from professional networks, not a random sample.</p>${study.record === 'AR-82' ? '' : '-->'}`
    : '<p>No study summary was supplied to this build.</p>';
  const prac = practitioner
    ? `<p>${e(String(practitioner.raised))} practitioner-raised issues across ${e(String(practitioner.records))} record(s) and ${e(String(practitioner.reviewers))} reviewer(s): ${e(String(practitioner.matched))} matched, ${e(String(practitioner.partial))} partly matched, ${e(String(practitioner.missed))} missed. Full-match rate ${practitioner.full_match_rate && practitioner.full_match_rate.rate !== null ? `${(practitioner.full_match_rate.rate * 100).toFixed(0)}% (95% Wilson ${(practitioner.full_match_rate.low * 100).toFixed(0)} to ${(practitioner.full_match_rate.high * 100).toFixed(0)}%)` : 'not computable'}. ${e(practitioner.caveat || '')}</p>`
    : '<p>No scored practitioner comparison was supplied to this build. Practitioner evidence, where it exists, is recorded with the output DS-N1 produced before each review.</p>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Decision Spellcheck diligence report</title>
<style>body{font-family:Georgia,serif;max-width:48rem;margin:2rem auto;padding:0 1rem;line-height:1.55;color:#1a1a1a;background:#fff}
table{border-collapse:collapse;width:100%;margin:.5rem 0 1.5rem}th,td{border:1px solid #ccc;padding:.35rem .5rem;text-align:left;vertical-align:top}
th{width:40%;background:#f6f4ef}h2{margin-top:2rem;font-size:1.15rem}.warn{border-left:3px solid #8b2020;padding-left:.8rem}</style></head><body>
<h1>Decision Spellcheck (${e(CANDIDATE.candidate_id)} ${e(CANDIDATE.version)}): diligence report</h1>
<p>Generated from live runs of the engine. Constructed fictional records only. No figure here is an accuracy, validation or compliance result.</p>
<h2>1. What it is</h2>
<table>
${row('Engine', 'Deterministic, rule-based review of decision records against their cited sources. No model or network calls.')}
${row('Provenance', e(CANDIDATE.provenance))}
${row('Record classes', e(ALLOWED_RECORD_CLASSES.join(', ')))}
${row('Detection templates', `${Object.keys(TEMPLATES).length} (${Object.entries(modes).map(([m, n]) => `${n} ${m}`).join(', ')}); groups: ${Object.entries(groups).map(([g, n]) => `${e(g)} ${n}`).join(', ')}`)}
${row('Cognitive safeguards', `${Object.keys(LENSES).length} lenses, ${Object.keys(CONTROLS).length} CC-* controls`)}
${row('Versions', e([TEMPLATE_VERSION, SAFEGUARD_VERSION, TRIAL_VERSION, WORKSPACE_VERSION].join('; ')))}
</table>
<h2>2. Developer test records (not independent)</h2>
<table>
${row('Status agreement with pre-registered developer expectations', `${dev.agree} of ${dev.cases}`)}
${row('Defective records wrongly marked READY', `${dev.falseReady} of ${dev.cases}`)}
</table>
<table><tr><th>Partner-segment record</th><td>Class / status / findings / advisory notes</td></tr>
${partner.map((p) => `<tr><th>${e(p.id)}</th><td>${e(p.cls)} / ${e(p.status)} / ${p.findings} / ${p.advisories}</td></tr>`).join('\n')}
</table>
<p>These records were written by the developer. Agreement with the developer's own expectations shows the rules behave as designed; it does not show they find what a practitioner would find.</p>
<h2>3. EU AI Act lens</h2>
<table>
${row('Lens', `${e(EU_LENS_VERSION)}: ${EU_CHECKS.length} deployer-side points (${e([...new Set(EU_CHECKS.map((c) => c.article))].join('; '))})`)}
${row('Sealed set 1 (answer key sealed before the code existed)', `${rd.eu1.agreement.k} of ${rd.eu1.agreement.n} points agree (lens ${e(rd.eu1.lens)}); wrongly credited as backed: ${rd.eu1.wrongly_credited_as_shown_and_supported.k}`)}
${row('Sealed set 2 (sealed before the fixes were run)', `${rd.eu2.agreement.k} of ${rd.eu2.agreement.n} points agree (95% Wilson ${pctRange(rd.eu2.agreement.wilson95)}); wrongly credited as backed: ${rd.eu2.wrongly_credited_as_shown_and_supported.k}; refused by the scope gate in normal use: ${rd.eu2.refused_by_scope_gate_in_normal_use.length}`)}
</table>
<p>A documentation check, not a legal assessment; it never states that anyone complies. Both sets were written by the developer.</p>
<h2>3a. Reading plain documents</h2>
<table>
${row('Extractor', e(EXTRACTOR_VERSION))}
${row('Claims found, against hand-identified claims (26 developer records)', of(rd.ev.claim_segmentation))}
${row('Same review outcome as the hand-built record', `${of(rd.ev.status_agreement)}; sound records wrongly held: ${rd.ev.status_agreement.hand_ready_extracted_hold}; unexplained differences: ${rd.ev.unexplained_disagreements.length}`)}
${row('Supporting document chosen as the hand-built record did', of(rd.ev.citation_source_agreement))}
${row('Input formats', 'Plain text, Word (.docx) body text and PDF with a text layer (no third-party code); scanned PDFs are refused')}
${row('Demo case (fictional), run at build time', `${e(rd.demo.state.status)}; ${rd.demo.state.findings.length} findings, ${rd.demo.omissions.length} left-out point(s) asked about`)}
${row(`Omission check (${e(OMISSION_VERSION)}, advisory)`, `sealed set of ${rd.om.caught.n + rd.om.false_flags_on_sound_records.n} new developer-written records: caught ${rd.om.caught.k} of ${rd.om.caught.n} omissions (95% Wilson ${pctRange(rd.om.caught.wilson95)}), flagged ${rd.om.false_flags_on_sound_records.k} of ${rd.om.false_flags_on_sound_records.n} sound records (${pctRange(rd.om.false_flags_on_sound_records.wilson95)})`)}
</table>
<p>All of these records were written by the developer. They show the reader behaves as designed, not how it performs on records written by others.</p>
<h2>3b. Published public decisions (real records)</h2>
${realRecordHtml()}
<h2>4. Practitioner study</h2>
${studyHtml}
<h2>5. Point-by-point comparison with practitioners</h2>
${prac}
<h2>6. Enterprise controls (local reference implementation)</h2>
<table>
${row('Roles and organisation separation', 'Built and tested (admin, reviewer, approver, auditor)')}
${row('Signed audit log verifies', ent.signedLogVerifies ? 'Yes' : '<b>No</b>')}
${row('Edited log entry detected', ent.tamperDetected ? 'Yes' : '<b>No</b>')}
${row('Encrypted persistence, retention and deletion', 'Built and tested')}
${row('Real records', 'Refused by design in normal use; a test-only setting reads published public decisions for evaluation. Confidential records need legal and security approval')}
${row('Hosting, TLS, single sign-on, key management, backups', 'Not built')}
</table>
<h2>7. Stated limitations</h2>
<ul class="warn">${LIMITATIONS.map((l) => `<li>${e(typeof l === 'string' ? l : JSON.stringify(l))}</li>`).join('')}</ul>
<h2>8. Not established</h2>
<p class="warn">Detection accuracy on real organisations' records (only published public decisions have been tested); separating decisions that later failed from those that held up (not achieved, see 3b); clearing a long reworded draft without serious flags (not achieved, see 3b); false-warning burden in practice; reviewer time saved; incremental value over ordinary review or a general AI assistant. These need independent reviewers and, for real records, a licensee-run pilot.</p>
</body></html>
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [out, pracPath, studyPath] = process.argv.slice(2);
  if (!out) { console.error('Usage: diligence-report.mjs out.html [practitioner-totals.json|-] [study-summary.json]'); process.exit(2); }
  const practitioner = pracPath && pracPath !== '-' ? JSON.parse(readFileSync(pracPath, 'utf8')) : undefined;
  const study = studyPath ? JSON.parse(readFileSync(studyPath, 'utf8')) : undefined;
  writeFileSync(out, buildDiligenceReport({ practitioner, study }));
  console.log(out);
}
