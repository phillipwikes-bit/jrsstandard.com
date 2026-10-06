// JRS internal release-gate package: the validator.
// INTERNAL ONLY. Deterministic. No network, no provider, no environment variable, no secret,
// and no file read: it judges the record object it is given and nothing else.
//
// It FAILS CLOSED. An unknown status, gate, evidence class, provenance, artifact kind, schema
// version or field is an error, never a pass. A record that is structurally valid but has open
// gates is VALID and INCOMPLETE: absent evidence is recorded, not treated as an error.
//
// What it refuses, in order of importance:
//   - PASS on any gate or sub-control without every required field, hash, date, criterion,
//     result, limitation and (where required) independent reviewer;
//   - PASS supported only by constructed, mocked, local or source-reported evidence;
//   - an evidence class used with a provenance or artifact kind it cannot have (a written
//     policy presented as operator-control execution, a smoke test presented as live-operation
//     verification, a mocked test presented as live);
//   - evidence of one class offered for a control only another class can satisfy (an owner
//     authorization offered as counsel review or independent QA);
//   - owner release authorization while any prerequisite gate has not passed;
//   - a record whose gates or engine-specific evidence name a different Engine version or source
//     commit from the record's own (a record copied from one version to another).
import { schemaErrors } from './schema-check.js';
import { GATES, GATE_IDS, gateDef, EVIDENCE_CLASSES, SUPPORTED_SCHEMA_VERSIONS, STATUSES, PROVENANCES, ARTIFACT_KINDS } from './vocabulary.js';

const OPEN = ['NOT_ASSESSED', 'PENDING', 'BLOCKED'];
const blank = (v) => typeof v !== 'string' || !v.trim();
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const realDate = (s) => { const m = DATE.exec(s || ''); if (!m) return false; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]; };

export function validateRecord(record, options = {}) {
  const errors = [];
  const err = (where, msg) => errors.push(where + ': ' + msg);

  if (!record || typeof record !== 'object' || Array.isArray(record)) return result(['$: record must be an object'], record);
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(record.schema_version)) return result(['$.schema_version: unsupported version ' + JSON.stringify(record.schema_version) + '; supported: ' + SUPPORTED_SCHEMA_VERSIONS.join(', ')], record);
  const structural = schemaErrors(record);
  if (structural.length) return result(structural, record);

  // ---- identity -----------------------------------------------------------------------------
  const engine = record.engine;
  if (options.expectEngineVersion && engine.engine_version !== options.expectEngineVersion) err('$.engine.engine_version', 'record names ' + engine.engine_version + ' but the expected Engine version is ' + options.expectEngineVersion);
  if (options.expectPromptSha256 && engine.prompt_sha256 !== options.expectPromptSha256) err('$.engine.prompt_sha256', 'record prompt hash does not match the expected prompt hash');
  if (!realDate(record.as_of)) err('$.as_of', 'not a real calendar date');

  // ---- evidence register ------------------------------------------------------------------------
  const evidence = new Map();
  record.evidence.forEach((e, i) => {
    const w = '$.evidence[' + i + '] ' + e.evidence_id;
    if (evidence.has(e.evidence_id)) err(w, 'duplicate evidence_id');
    evidence.set(e.evidence_id, e);
    const cls = EVIDENCE_CLASSES[e.evidence_class];
    if (!cls) { err(w, 'undocumented evidence class ' + e.evidence_class); return; }
    if (!PROVENANCES.includes(e.provenance) || cls.provenance !== e.provenance) err(w, e.evidence_class + ' must have provenance ' + cls.provenance + ', not ' + e.provenance);
    if (!ARTIFACT_KINDS.includes(e.artifact_kind) || !cls.kinds.includes(e.artifact_kind)) err(w, e.evidence_class + ' cannot be a ' + e.artifact_kind + (e.artifact_kind === 'policy_document' || e.artifact_kind === 'documentation_statement' ? ': a written policy or documentation statement is not evidence that a control executed' : ''));
    if (!realDate(e.evidence_date)) err(w, 'evidence_date is not a real calendar date');
    else if (realDate(record.as_of) && e.evidence_date > record.as_of) err(w, 'evidence_date ' + e.evidence_date + ' is after the record date ' + record.as_of);
    if (/^0{64}$|^(.)\1{63}$/.test(e.sha256)) err(w, 'sha256 is a placeholder, not a hash');
  });

  // ---- gates ------------------------------------------------------------------------------------
  const byId = new Map();
  record.gates.forEach((g, i) => {
    if (byId.has(g.gate_id)) err('$.gates[' + i + ']', 'duplicate gate ' + g.gate_id);
    byId.set(g.gate_id, g);
  });
  for (const id of GATE_IDS) if (!byId.has(id)) err('$.gates', 'required gate ' + id + ' is missing');

  for (const g of record.gates) {
    const def = gateDef(g.gate_id);
    const w = '$.gates.' + g.gate_id;
    if (!def) { err(w, 'unrecognized gate'); continue; }
    if (!STATUSES.includes(g.status)) err(w, 'status ' + g.status + ' is outside the controlled vocabulary');
    if (g.gate_name !== def.name) err(w, 'gate_name must be "' + def.name + '"');
    if (g.engine_version !== engine.engine_version) err(w, 'names Engine ' + g.engine_version + ' but the record is for ' + engine.engine_version + ' (a gate record cannot be copied between versions)');
    if (g.candidate_source_commit !== engine.candidate_source_commit) err(w, 'names source commit ' + g.candidate_source_commit + ' but the record is for ' + engine.candidate_source_commit);
    if (def.prompt_applicable) {
      if (!g.prompt_identity) err(w, 'prompt_identity is required for this gate');
      else if (g.prompt_identity.prompt_version !== engine.prompt_version || g.prompt_identity.prompt_sha256 !== engine.prompt_sha256) err(w, 'prompt_identity does not match the record Engine prompt');
    } else if (g.prompt_identity !== null) err(w, 'prompt_identity must be null for a gate it does not apply to');
    if (g.status === 'NOT_APPLICABLE') err(w, 'every release gate is required; NOT_APPLICABLE is not permitted for a gate');
    if (g.evidence_date !== null && !realDate(g.evidence_date)) err(w, 'evidence_date is not a real calendar date');
    if (!def.per_condition_results_required && g.per_condition_results !== null) err(w, 'per_condition_results only belong to RG-1');

    for (const ref of g.evidence_refs) if (!evidence.has(ref)) err(w, 'evidence_refs names unknown evidence ' + ref);

    // Sub-controls: exactly the defined set, in any order.
    const scIds = g.sub_controls.map((s) => s.control_id);
    for (const d of def.sub_controls) if (!scIds.includes(d.id)) err(w, 'sub-control ' + d.id + ' (' + d.name + ') is missing');
    for (const s of g.sub_controls) {
      const sd = def.sub_controls.find((d) => d.id === s.control_id);
      const sw = w + '.' + s.control_id;
      if (!sd) { err(sw, 'unrecognized sub-control'); continue; }
      if (scIds.filter((x) => x === s.control_id).length > 1) err(sw, 'duplicate sub-control');
      if (s.name !== sd.name) err(sw, 'name must be "' + sd.name + '"');
      for (const ref of s.evidence_refs) {
        if (!evidence.has(ref)) err(sw, 'names unknown evidence ' + ref);
        else if (!g.evidence_refs.includes(ref)) err(sw, 'evidence ' + ref + ' is not listed in the gate evidence_refs');
      }
      if (s.status === 'PASS') checkSatisfied(sw, sd, s.evidence_refs, def, g, engine, evidence, err);
      else if (s.status === 'NOT_APPLICABLE') { if (blank(s.not_applicable_reason)) err(sw, 'NOT_APPLICABLE needs not_applicable_reason'); }
      else if (s.not_applicable_reason !== null) err(sw, 'not_applicable_reason is only for NOT_APPLICABLE');
      if (OPEN.includes(s.status) && !s.missing_dependencies.length) err(sw, s.status + ' must list what is missing in missing_dependencies');
      if (s.status === 'PASS' && s.missing_dependencies.length) err(sw, 'PASS with missing dependencies listed');
    }

    // Gate-level status rules.
    if (OPEN.includes(g.status) && !g.missing_dependencies.length) err(w, g.status + ' must list what is missing in missing_dependencies');
    if (g.status === 'FAIL') {
      if (blank(g.actual_result)) err(w, 'FAIL needs actual_result');
      if (!g.evidence_date) err(w, 'FAIL needs evidence_date');
      if (!g.evidence_refs.length) err(w, 'FAIL needs evidence');
    }
    if (g.status === 'PASS') {
      if (blank(g.actual_result)) err(w, 'PASS needs actual_result');
      if (!g.evidence_date) err(w, 'PASS needs evidence_date');
      if (!g.evidence_refs.length) err(w, 'PASS needs evidence_refs');
      if (g.missing_dependencies.length) err(w, 'PASS with missing dependencies listed');
      const scs = g.sub_controls.filter((s) => def.sub_controls.some((d) => d.id === s.control_id));
      if (!scs.some((s) => s.status === 'PASS')) err(w, 'PASS needs at least one sub-control that passed');
      for (const s of scs) if (s.status !== 'PASS' && s.status !== 'NOT_APPLICABLE') err(w, 'PASS while sub-control ' + s.control_id + ' is ' + s.status);
      if (def.independent_reviewer_required) {
        if (!g.independent_reviewer) err(w, 'PASS needs an independent_reviewer');
        else {
          const who = g.independent_reviewer.identity.trim().toLowerCase();
          if (who === record.record_author.trim().toLowerCase()) err(w, 'the independent reviewer cannot be the record author');
          if (g.owner_decision && who === g.owner_decision.decided_by.trim().toLowerCase()) err(w, 'the independent reviewer cannot be the owner who decided');
        }
      }
      if (g.evidence_date) for (const ref of g.evidence_refs) { const e = evidence.get(ref); if (e && e.evidence_date > g.evidence_date) err(w, 'evidence ' + ref + ' is dated after the gate evidence_date'); }
      if (def.per_condition_results_required) {
        if (!Array.isArray(g.per_condition_results) || !g.per_condition_results.length) err(w, 'PASS needs per_condition_results with uncertainty');
        else g.per_condition_results.forEach((p, i) => {
          const e = evidence.get(p.evidence_id);
          if (!e || !g.evidence_refs.includes(p.evidence_id)) err(w + '.per_condition_results[' + i + ']', 'names evidence not listed for this gate');
          else if (e.evidence_class !== 'INDEPENDENT_LABELING') err(w + '.per_condition_results[' + i + ']', 'a per-condition result must rest on independent labeling, not ' + e.evidence_class);
        });
      }
    }

    // Owner decisions.
    if (g.owner_decision) {
      const d = g.owner_decision;
      const e = evidence.get(d.evidence_id);
      if (!realDate(d.decision_date)) err(w, 'owner decision_date is not a real calendar date');
      if (!e) err(w, 'owner decision names unknown evidence ' + d.evidence_id);
      else if (e.evidence_class !== 'OWNER_AUTHORIZATION') err(w, 'an owner decision must rest on OWNER_AUTHORIZATION evidence, not ' + e.evidence_class);
      if (d.decision === 'release_authorized' && g.gate_id !== 'RG-4') err(w, 'release_authorized is only recorded on RG-4');
    }
    if (def.owner_decision_required && g.status === 'PASS' && (!g.owner_decision || g.owner_decision.decision !== 'release_authorized')) err(w, 'PASS needs an owner_decision of release_authorized');
  }

  // Prerequisites: a gate cannot pass, and the owner cannot authorize release, ahead of them.
  for (const def of GATES) {
    const g = byId.get(def.id);
    if (!g) continue;
    const unmet = def.prerequisites.filter((p) => !byId.get(p) || byId.get(p).status !== 'PASS' || errors.some((x) => x.startsWith('$.gates.' + p + ':') || x.startsWith('$.gates.' + p + '.')));
    if (!unmet.length) continue;
    if (g.status === 'PASS') err('$.gates.' + def.id, 'PASS while prerequisite ' + unmet.join(', ') + ' has not passed with valid evidence');
    if (g.owner_decision && g.owner_decision.decision === 'release_authorized') err('$.gates.' + def.id, 'owner release authorization refused: prerequisite ' + unmet.join(', ') + ' has not passed with valid evidence');
  }

  return result(errors, record);
}

function checkSatisfied(sw, sd, refs, def, g, engine, evidence, err) {
  const usable = refs.map((r) => evidence.get(r)).filter(Boolean);
  if (!usable.length) { err(sw, 'PASS needs evidence'); return; }
  const satisfying = usable.filter((e) => sd.satisfied_by.includes(e.evidence_class) && sd.kinds.includes(e.artifact_kind));
  for (const e of usable) {
    if (!sd.satisfied_by.includes(e.evidence_class)) err(sw, e.evidence_id + ' is ' + e.evidence_class + ', which cannot satisfy "' + sd.name + '" (needs ' + sd.satisfied_by.join(' or ') + ')');
    else if (!sd.kinds.includes(e.artifact_kind)) err(sw, e.evidence_id + ' is a ' + e.artifact_kind + ', which cannot satisfy "' + sd.name + '" (needs ' + sd.kinds.join(' or ') + ')' + (e.artifact_kind === 'smoke_test_response' ? ': a smoke test is not evidence of production operation' : ''));
    if (!EVIDENCE_CLASSES[e.evidence_class] || !EVIDENCE_CLASSES[e.evidence_class].production_evidence) err(sw, e.evidence_id + ' is ' + e.evidence_class + ' evidence, which can never pass a release gate');
    if (def.engine_specific && e.applies_to_engine_version !== engine.engine_version) err(sw, e.evidence_id + ' applies to Engine ' + e.applies_to_engine_version + ', not ' + engine.engine_version);
    if (blank(e.limitation)) err(sw, e.evidence_id + ' has no limitation statement');
  }
  if (!satisfying.length) err(sw, 'PASS without any evidence that can satisfy it');
}

// Package conclusion. Deliberately two values only, and neither is a readiness word.
export function conclusion(record) {
  const all = GATE_IDS.every((id) => (record.gates || []).some((g) => g.gate_id === id && g.status === 'PASS'));
  return all ? 'ALL_GATES_RECORDED_PASS' : 'INCOMPLETE_GATES_OPEN';
}

function result(errors, record) {
  const valid = errors.length === 0;
  const missing = [];
  if (valid) for (const g of record.gates) {
    for (const d of g.missing_dependencies) missing.push(g.gate_id + ': ' + d);
    for (const s of g.sub_controls) for (const d of s.missing_dependencies) missing.push(s.control_id + ': ' + d);
  }
  return { valid, errors, conclusion: valid ? conclusion(record) : null, missing_evidence: missing,
           gate_status: valid ? Object.fromEntries(record.gates.map((g) => [g.gate_id, g.status])) : null };
}
