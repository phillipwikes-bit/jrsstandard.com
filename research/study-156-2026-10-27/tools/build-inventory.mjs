// 156-record study, Phase 2: record inventory, version 1 (identification before any replacement).
// Offline. Reads repository files only. Writes records/original/*.txt and inventory/RECORD_INVENTORY_V1.json.
// Nothing is invented: a field the repository does not establish is written as NOT ESTABLISHED.
// Usage: node tools/build-inventory.mjs
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const rel = (p) => p.slice(ROOT.length + 1);
const OUT = join(PKG, 'inventory', 'RECORD_INVENTORY_V1.json');
if (existsSync(OUT)) { console.error('inventory v1 exists; it is preserved, not rebuilt'); process.exit(2); }

// ---------------------------------------------------------------- sources
const PACKET = join(ROOT, 'research', 'AnswerKey_Verification_Packet.md');
const KEY = join(ROOT, 'research', 'Verified_Key.md');
const PAGE = join(ROOT, 'ai-records-arm-b.html');
const CASES = join(ROOT, 'research', 'JCI_SUBMISSION_2026-08-28', '02_DATA', 'JCI_JRS_32_Case_Master_Dataset.csv');
const INDEX = join(ROOT, 'research', 'JCI_SUBMISSION_2026-08-28', '05_SOURCE_VERIFICATION', 'JCI_JRS_Source_Verification_Index.csv');
const NOTES = join(ROOT, 'research', 'JCI_SUBMISSION_2026-08-28', '02_DATA', 'JCI_JRS_Contemporaneous_Basis_Notes.csv');
const src = (p) => ({ path: rel(p), sha256: sha(readFileSync(p)) });

// Minimal RFC 4180 CSV reader (quoted fields, doubled quotes, CRLF or LF).
function csv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const [h, ...b] = rows.filter((r) => r.length > 1 || r[0] !== '');
  return b.map((r) => Object.fromEntries(h.map((k, i) => [k.replace(/^﻿/, ''), r[i] === undefined ? '' : r[i]])));
}

// ---------------------------------------------------------------- 24 original study records
const packetText = readFileSync(PACKET, 'utf8');
const packetRecords = [...packetText.matchAll(/^\*\*(R\d{2}) \(([^)]+)\)\.\*\* (.+)$/gm)].map((m) => ({ id: m[1], ctx: m[2], text: m[3] }));
const pageText = readFileSync(PAGE, 'utf8');
const pageJson = /var RECORDS=(\[.*?\]);/s.exec(pageText);
const pageRecords = pageJson ? JSON.parse(pageJson[1]) : [];
const keyText = readFileSync(KEY, 'utf8');
const key = Object.fromEntries([...keyText.matchAll(/\| (R\d{2}) \| (GROUNDED|UNGROUNDED) (?=\|)/g)].map((m) => [m[1], m[2]]));

// Scope classes against the handoff exclusion list (employment, housing, lending, insurance, medical,
// legal-outcome) and the Engine's own "other consequential" list (scope.mjs). AMBIGUOUS means the
// repository does not settle the class and the owner must classify it (decision SC-1); it is not resolved here.
const SCOPE = {
  'HR / performance': ['EXCLUDED', 'employment', 'Source label is HR; the handoff profile is non-HR and excludes employment decisions.'],
  'HR / termination': ['EXCLUDED', 'employment', 'Source label is HR; separation of an employee is an employment decision.'],
  'HR / accommodation': ['EXCLUDED', 'employment', 'Source label is HR; an accommodation determination is an employment decision and refers to a provider note.'],
  'Legal / litigation': ['EXCLUDED', 'legal_outcome', 'Litigation assessment or summary-judgment recommendation: legal-outcome decision.'],
  'Due-process / administrative': ['EXCLUDED', 'other_consequential', 'Programme eligibility determination for an individual; the Engine scope gate lists benefits eligibility as an other consequential domain.'],
  'Public records / FOIL': ['AMBIGUOUS', 'legal_outcome?', 'Agency records-access determination under a statute. Whether this is a legal-outcome decision is not settled by the handoff.'],
  'Compliance / AML': ['AMBIGUOUS', 'regulated_decision?', 'Regulated financial-crime alert disposition about a customer. Not lending or insurance; whether it is regulated decision content is not settled.'],
  'Compliance / audit': ['NOT_EXCLUDED', null, 'Control assessment of logical access; no decision about an individual.'],
  'AI-assisted summary': ['NOT_EXCLUDED', null, 'Meeting summary; no decision about an individual.'],
};
const INVESTIGATION = {
  R02: ['EXCLUDED', 'employment', 'Workplace investigation recommending disciplinary action.'],
  R11: ['EXCLUDED', 'employment', 'Workplace investigation recommending disciplinary action.'],
  R14: ['EXCLUDED', 'employment', 'Workplace investigation of shift allocation between employees and a manager.'],
  R06: ['AMBIGUOUS', 'employment?', 'Workplace safety investigation whose finding concerns equipment, with interviews of a complainant and a supervisor.'],
};

// Construction-template cues visible in the text (recorded so dependence and surface-cue confounds are visible).
const CLOSING = /\b(?:rests on|Supported by the itemized|are traceable to|Based on the single)\b/;
const opening = (t) => t.split('. ')[0];

function words(t) { return t.toLowerCase().replace(/[^a-z0-9$ ]/g, ' ').split(/\s+/).filter(Boolean); }
function shingles(t, n = 3) { const w = words(t); const s = new Set(); for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(' ')); return s; }
function jaccard(a, b) { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); }

const originals = packetRecords.map((r) => {
  const file = join(PKG, 'records', 'original', r.id + '.txt');
  writeFileSync(file, r.text);
  const page = pageRecords.find((p) => p.ref === r.id);
  const [cls, dom, why] = INVESTIGATION[r.id] || SCOPE[r.ctx] || ['NOT_ESTABLISHED', null, 'No scope rule for this source label.'];
  return { r, file, page, cls, dom, why };
});

const sameOpening = (o) => originals.filter((x) => x !== o && opening(x.r.text) === opening(o.r.text)).map((x) => x.r.id);
const sameDomain = (o) => originals.filter((x) => x !== o && x.r.ctx === o.r.ctx).map((x) => x.r.id);
const sh = Object.fromEntries(originals.map((o) => [o.r.id, shingles(o.r.text)]));
const nearDup = [];
for (let i = 0; i < originals.length; i++) for (let j = i + 1; j < originals.length; j++) {
  const s = jaccard(sh[originals[i].r.id], sh[originals[j].r.id]);
  if (s >= 0.2) nearDup.push({ a: originals[i].r.id, b: originals[j].r.id, jaccard_3gram: Number(s.toFixed(3)) });
}
const maxSim = Math.max(...originals.flatMap((a) => originals.filter((b) => b !== a).map((b) => jaccard(sh[a.r.id], sh[b.r.id]))));

const entries = [];
for (const o of originals) {
  const t = o.r.text;
  entries.push({
    study_id: 'S156-O-' + o.r.id, cohort: 'original_study_record', source_id: o.r.id,
    original_source: Object.assign(src(PACKET), { locator: '**' + o.r.id + ' (' + o.r.ctx + ').**' }),
    cross_source: o.page ? Object.assign(src(PAGE), { locator: 'var RECORDS[ref=' + o.r.id + ']', text_identical: o.page.text === t, context_label_identical: o.page.ctx === o.r.ctx }) : { path: rel(PAGE), located: false },
    full_text_available: true,
    extracted_text_path: rel(o.file), extracted_text_sha256: sha(Buffer.from(t, 'utf8')),
    document_type: opening(t), source_domain_label: o.r.ctx, language: 'en',
    length: { utf16_chars: t.length, utf8_bytes: Buffer.byteLength(t, 'utf8'), words: words(t).length, sentences: t.split(/(?<=\.)\s+(?=[A-Z])/).length },
    extraction_limits: 'Single-paragraph constructed vignette extracted verbatim from a markdown packet. No underlying original document, attachment, exhibit or file exists; references such as "on file" point to nothing that can be inspected.',
    permission_and_confidentiality: {
      classification: 'Public: the same text is served on the deployed page ai-records-arm-b.html and is in tracked repository files.',
      rights: 'NOT ESTABLISHED. The corpus construction log is NOT ESTABLISHED for all 24 records (research/CORPUS_CONSTRUCTION_LOG_VERIFICATION_2026-08-18.md); no rights instrument covers the vignettes.',
      personal_data: 'None identified. Constructed vignettes with no named person.',
    },
    reference_findings: [{
      kind: 'binary_study_label', value: key[o.r.id] || 'NOT ESTABLISHED', source: src(KEY),
      provenance: 'Three large-language-model instances applying the packet rule, blind to the intended labels; 24 of 24 agreement with the intended construction key. Not human raters.',
      human_review: 'NOT ESTABLISHED: no human rating or adjudication of this key is recorded.',
    }],
    prior_exposure: {
      public_web: true,
      study_participants: 'Shown to Arm A and Arm B reviewers in the earlier detection study (research/PROJECT_STATE.md roster).',
      llm_raters: 'Read by the three LLM raters that produced the verified key.',
      developer: 'Read in full by the developer (this Claude Code session) during planning on 2026-10-26 and 2026-10-27, before any study code was written.',
      engine_or_model_runs: 'NOT ESTABLISHED for earlier sessions; none in this package before the freeze.',
    },
    links: {
      duplicates: [], near_duplicates: nearDup.filter((d) => d.a === o.r.id || d.b === o.r.id),
      matched_opening_pair: sameOpening(o), same_domain: sameDomain(o),
      template_family: CLOSING.test(t) ? 'TPL-O-CLOSING-BASIS (closing sentence names the basis: "rests on", "Supported by", "traceable to", "Based on")' : 'TPL-O-GENERIC (no closing basis sentence)',
      related_public_cases: o.r.ctx === 'Public records / FOIL' ? 'Same document domain as PR-01 to PR-32 (FOIL); not the same matters.' : null,
    },
    scope_class: o.cls, scope_domain: o.dom, scope_reason: o.why,
    eligibility: {
      default_profile_refusal_test: 'ELIGIBLE: the Engine of record is expected to refuse; running it tests the refusal.',
      research_profile_substantive: o.cls === 'NOT_EXCLUDED' ? 'ELIGIBLE (development partition only: exposed record)'
        : 'NOT ELIGIBLE pending owner scope decision SC-1: ' + (o.cls === 'EXCLUDED' ? 'excluded domain (' + o.dom + ').' : 'scope class not settled (' + o.dom + ').'),
      evaluation_partition: 'NOT ELIGIBLE: publicly exposed, shown to earlier study participants and LLM raters, and read by the developer.',
    },
    missing_materials: ['Human reference label (Phillip Wikes, development reviewer) on the blinded form', 'Condition-level reference findings (none exist; AI proposals only)', 'Corpus construction log (NOT ESTABLISHED)'],
    remediation: ['Phillip completes the blinded reference form', 'Owner decision SC-1 for EXCLUDED or AMBIGUOUS classes before any substantive research-profile run'],
  });
}

// ---------------------------------------------------------------- 32 public cases
const cases = csv(readFileSync(CASES, 'utf8'));
const index = Object.fromEntries(csv(readFileSync(INDEX, 'utf8')).map((r) => [r['Case ID'], r]));
const notes = csv(readFileSync(NOTES, 'utf8'));
const notesBy = Object.fromEntries(notes.map((r) => [r['Case ID'] || r[Object.keys(r)[0]], r]));
function caseScope(t) {
  if (/Court of Appeals|Appellate Division|trial-level/.test(t)) return ['EXCLUDED', 'legal_outcome', 'Court decision: legal-outcome decision.'];
  if (/Freedom of Information Commission/.test(t)) return ['AMBIGUOUS', 'legal_outcome?', 'Administrative adjudication of a records-access appeal.'];
  if (/advisory opinion/.test(t)) return ['AMBIGUOUS', 'legal_outcome?', 'Advisory opinion on records access; not itself a decision.'];
  if (/Comptroller audit/.test(t)) return ['AMBIGUOUS', 'programme_audit', 'Programme-level audit of a records programme; not a single decision and not a supplier-access draft.'];
  return ['NOT_ESTABLISHED', null, 'No scope rule for this source type.'];
}
for (const c of cases) {
  const id = c['Case ID'];
  const [cls, dom, why] = caseScope(c['Source type']);
  const ix = index[id] || {};
  const rowCanon = JSON.stringify(Object.keys(c).sort().map((k) => [k, c[k]]));
  entries.push({
    study_id: 'S156-P-' + id.replace('-', ''), cohort: 'public_case', source_id: id,
    original_source: { citation: c['Citation'], public_url: c['Public URL'], decision_year: c['Decision/source year'], body: c['Source type'], jurisdiction: c['Jurisdiction'],
      metadata_file: src(CASES), metadata_row_sha256: sha(rowCanon), url_tested: ix['URL tested on'] || 'NOT ESTABLISHED', publicly_accessible: ix['Publicly accessible?'] || 'NOT ESTABLISHED' },
    full_text_available: false,
    extracted_text_path: null, extracted_text_sha256: null, source_document_sha256: 'NOT AVAILABLE: no copy of the source document is held in the repository',
    document_type: c['Source type'] + ' (' + c['Document class'] + ')', language: 'NOT ESTABLISHED (English expected for New York and Connecticut public bodies; not verified because the text is not held)',
    length: 'NOT ESTABLISHED', extraction_limits: 'Text not held. The source index records that nycourts.gov refuses automated requests from this network for some URLs. Court decisions commonly exceed the Engine local size limit of 8,000 characters; NOT ESTABLISHED for these cases.',
    permission_and_confidentiality: { classification: 'Public government document (per the citation); local copy: none.', rights: 'NOT ESTABLISHED for reuse in an Engine study.', personal_data: 'NOT ESTABLISHED. Court and commission decisions can name individuals; a privacy review is required before use.' },
    reference_findings: [
      { kind: 'jrs_read', value: c['JRS Read'], provenance: 'Primary reviewer S.Y. (human), recorded before the documented outcome was consulted (data dictionary).', source: src(CASES) },
      { kind: 'contemporaneous_basis_note', value: c['Contemporaneous Note Available'] === 'Yes' ? c['Contemporaneous Basis Note'] : 'none recorded', provenance: 'Primary reviewer S.Y.', source: src(NOTES) },
      { kind: 'documented_outcome', value: c['Documented Outcome'] + ' / ' + c['Outcome Category'], provenance: 'Recorded from the cited public source after the read.', source: src(CASES) },
      { kind: 'second_reader', value: c['Included in blind second read?'].startsWith('Yes') ? c['Second-reader classification'] + ' (' + c['Included in blind second read?'] + ', ' + c['Agreement'] + ')' : 'not in the blind second read', provenance: 'Independent second reader (human), blind recheck 2026-08-28.', source: src(CASES) },
    ],
    note_on_reference: 'These are documentation-quality reads of public decisions on a Ready / Needs work / Gap scale, not GROUNDED / UNGROUNDED labels and not Engine condition findings. Any mapping needs a versioned correspondence record.',
    prior_exposure: { public_web: true, study_participants: 'Read by the primary reviewer and, for ten cases, the blind second reader; analysed in the JCI manuscript.', developer: 'Metadata, notes and citations read by the developer; the decision texts were not read (not held).', engine_or_model_runs: 'NOT ESTABLISHED' },
    links: { duplicates: [], related_cases: cases.filter((x) => x !== c && x['Citation'] === c['Citation']).map((x) => x['Case ID']), same_body: cases.filter((x) => x !== c && x['Source type'] === c['Source type']).length, verification_note: ix['Citation note'] || null },
    scope_class: cls, scope_domain: dom, scope_reason: why,
    eligibility: { default_profile_refusal_test: 'NOT RUNNABLE: text not held', research_profile_substantive: 'NOT RUNNABLE: text not held; also ' + (cls === 'EXCLUDED' ? 'excluded domain (' + dom + ')' : 'scope class not settled (' + dom + ')') + '; rights and privacy NOT ESTABLISHED', evaluation_partition: 'NOT ELIGIBLE: read by the study reviewers and published in the manuscript analysis' },
    missing_materials: ['Source decision text', 'Source and extracted-text hashes', 'Rights and privacy review', 'Owner scope decision SC-1', 'Engine-compatible reference findings'],
    remediation: ['Owner authorizes retrieval by a person from the public URL (automated requests are refused by some hosts)', 'Rights and privacy review before use', 'Owner decision SC-1', 'Size handling: explicit refusal above 8,000 characters, or a segmentation candidate (deferred)'],
  });
}

// ---------------------------------------------------------------- 100 synthetic slots
// No set of 100 study-type synthetic records exists in the repository (searched 2026-10-27:
// "100 synthetic", "156 record", "SYN-0nn"). Existing synthetic pools are listed so the
// reconciliation is checkable; none is of the study document types.
const pools = [
  ['v0.3 fixtures, Phase 4 corpus and stability, Phase 6 library and stability, Phase 7 scenarios', 244, 'research/engine-correction-v0-02-differential-2026-10-25/DIFFERENTIAL_RESULTS.json'],
  ['V0 sealed corpus (EV-01 to EV-40, ADV-01 to ADV-20)', 60, 'research/validation-readiness-gate-v0-2026-10-25/corpus/'],
  ['Correction regression cases RC-01 to RC-06', 6, 'research/engine-correction-v0-02-ev32-2026-10-25/regression*/'],
  ['Phase 9 rehearsal packets', readdirSync(join(ROOT, 'research', 'engine-human-review-phase9-2026-10-20', 'rehearsal', 'cases')).length, 'research/engine-human-review-phase9-2026-10-20/rehearsal/cases/'],
  ['Stage A synthetic drafts SDR-01 to SDR-10', 10, 'research/stage-a-offline-preparation-2026-10-24/synthetic-records/'],
  ['0.1 assurance fixtures', 31, 'research/engine-assurance-2026-10-10/fixtures/'],
].map(([name, count, path]) => ({ name, count, path,
  why_not_used: 'Supplier-access exception drafts (or scope-trigger variants of them) authored by the developer, heavily templated; not of the study document types, and every one was seen by the developer while building the Engine.' }));
for (let i = 1; i <= 100; i++) {
  const n = String(i).padStart(3, '0');
  entries.push({
    study_id: 'S156-S-' + n, cohort: 'synthetic_record', source_id: 'S-' + n,
    status: 'MISSING', original_source: null, full_text_available: false,
    reconciliation: 'No pre-existing study-type synthetic record fills this slot. A replacement may be created only with disclosure and before the freeze (assignment rule); see RECORD_INVENTORY_V2.json if one was created.',
    eligibility: { default_profile_refusal_test: 'NOT RUNNABLE: record missing', research_profile_substantive: 'NOT RUNNABLE: record missing', evaluation_partition: 'NOT RUNNABLE: record missing' },
    missing_materials: ['Record text', 'Construction log', 'Reference findings'], remediation: ['Disclosed replacement before the freeze, or an independent author'],
  });
}

const counts = (cohort) => entries.filter((e) => e.cohort === cohort);
const cls = (list) => Object.fromEntries(['NOT_EXCLUDED', 'AMBIGUOUS', 'EXCLUDED'].map((k) => [k, list.filter((e) => e.scope_class === k).map((e) => e.source_id)]));
const inv = {
  inventory_format: 'jrs-study-156-inventory/1.0.0', version: 1, built_at_utc: new Date().toISOString(),
  purpose: 'Identification of all 156 study slots before any replacement, any study code, and any Engine run.',
  totals: { slots: entries.length, original_study_records: counts('original_study_record').length, public_cases: counts('public_case').length, synthetic_slots: counts('synthetic_record').length,
    full_text_held: entries.filter((e) => e.full_text_available).length, missing_text: entries.filter((e) => !e.full_text_available).length },
  cross_source_check: { compared: originals.length, identical_text: originals.filter((o) => o.page && o.page.text === o.r.text).length, identical_context_label: originals.filter((o) => o.page && o.page.ctx === o.r.ctx).length },
  originals_scope: cls(counts('original_study_record')), public_cases_scope: cls(counts('public_case')),
  originals_reference_balance: { GROUNDED: originals.filter((o) => key[o.r.id] === 'GROUNDED').length, UNGROUNDED: originals.filter((o) => key[o.r.id] === 'UNGROUNDED').length },
  originals_similarity: { max_pairwise_jaccard_3gram: Number(maxSim.toFixed(3)), pairs_at_or_above_0_2: nearDup, exact_duplicates: 0 },
  originals_template_cue: { closing_basis_sentence_in_grounded: originals.filter((o) => key[o.r.id] === 'GROUNDED' && CLOSING.test(o.r.text)).length, closing_basis_sentence_in_ungrounded: originals.filter((o) => key[o.r.id] === 'UNGROUNDED' && CLOSING.test(o.r.text)).length },
  existing_synthetic_pools_considered: pools,
  sources: { packet: src(PACKET), key: src(KEY), page: src(PAGE), cases: src(CASES), index: src(INDEX), notes: src(NOTES) },
  entries,
};
writeFileSync(OUT, JSON.stringify(inv, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ totals: inv.totals, cross: inv.cross_source_check, scope: Object.fromEntries(Object.entries(inv.originals_scope).map(([k, v]) => [k, v.length])), pcs: Object.fromEntries(Object.entries(inv.public_cases_scope).map(([k, v]) => [k, v.length])), sim: inv.originals_similarity.max_pairwise_jaccard_3gram, near: nearDup.length, cue: inv.originals_template_cue }));
