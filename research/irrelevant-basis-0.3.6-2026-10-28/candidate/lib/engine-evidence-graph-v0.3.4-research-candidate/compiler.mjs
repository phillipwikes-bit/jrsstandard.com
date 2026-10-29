// JRS EVIDENCE GRAPH 0.3.6-research-candidate (0.3.4 compiler plus RP-SRP-14 human relevance assessments; see
// research-profile.mjs): the compiler (0.3.2 plus an inert, flag-gated study research profile,
// repaired after the 156-record study; see research-profile.mjs for what 0.3.4 changes).
// Without a researchProfile argument every step is the 0.3.2 step. With one, research-profile.mjs supplies the intake
// scope, prose units, dated events, conflicts, condition rules, linkage, markers and control templates; the status
// combination (keep or lower, never raise), refusals and graph validation are unchanged.
// Phase 7 rules are active only through validated rule packs (rule-packs.mjs); an invalid pack set refuses every record.
//
// record text -> exact span -> evidence item -> bounded assertion -> condition
// finding -> limitation -> human-review route, as a deterministic graph.
//
// Order: identity -> intake gate -> instruction quarantine -> section map, dated
// events, record conflicts -> candidate response (quote-only) -> quote
// resolution (offsets computed here) -> assertion compiler -> cited-evidence
// conflicts -> timeline -> condition rules -> status combination (keep or lower,
// never raise) -> anchors and refusals -> graph Cognitive Controls -> independent
// graph validation. A graph that fails validation is an error, never an output.
//
// No I/O except reading this package's own files to compute the compiler hash.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CONTRACT_VERSION, COMPILER_VERSION, PROMPT_VERSION, CODEBOOK_VERSION, GRAPH_FORMAT_VERSION, RELEASE_STATUS, HISTORICAL_REFERENCE_ID,
  CONDITION_IDS, EDGE_MEANINGS, USABLE_QUOTE_STATUSES, LIMITATIONS, HUMAN_REVIEW_ROUTE,
} from './contract.mjs';
import { sectionsOf, utf8Offset, roleOf } from './record.mjs';
import { loadRulePacks, validateRulePacks } from './rule-packs.mjs';

// RP-EVL-01: section roles a cited quotation must sit in for a supported status.
export const LINKED_SECTION_ROLES = Object.freeze({ identifiable_basis: ['authority', 'basis'], chronology_integrity: ['chronology', 'request', 'authority', 'decision', 'expiry'], reasoning_traceability: ['basis'] });
import { resolveQuote } from './quote-resolution.mjs';
import { compileAssertion } from './assertions.mjs';
import { detectRecordConflicts, detectEvidenceConflicts } from './contradictions.mjs';
import { evaluateConditions } from './conditions.mjs';
import { buildControls, certaintySpans } from './controls.mjs';
import { runIntake, detectInstructionRisk } from './scope.mjs';
import { validateCandidate } from './response.mjs';
import { validateGraph, canonical } from './graph-validate.mjs';
import { checkResearchProfile, RESEARCH_PROMPT_VERSION, RESEARCH_AUTHORIZED_SCOPE, RESEARCH_MARKERS, RESEARCH_DEFECT_TEMPLATES, RESEARCH_DEFECT_REVIEW_REASONS,
  sentenceUnits, researchEvents, detectResearchConflicts, detectResearchEvidenceConflicts, evaluateResearchConditions, researchLinked,
  researchInstructionSpans, buildResearchControls, applyRelevanceAssessments } from './research-profile.mjs';

const sha = (s) => 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');
const HERE = fileURLToPath(new URL('./', import.meta.url));
let compilerHashCache = null;
export function compilerHash() {
  if (!compilerHashCache) compilerHashCache = sha(readdirSync(HERE).filter((f) => f.endsWith('.mjs')).sort().map((f) => f + '\n' + readFileSync(HERE + f, 'utf8')).join('\n'));
  return compilerHashCache;
}
export function fixtureHash(record, responseText) {
  return sha(canonical({ record: typeof record === 'string' ? sha(record) : null, candidate_response: typeof responseText === 'string' ? sha(responseText) : null }));
}
export const EXECUTION_MODES = Object.freeze(['local_mocked', 'local_deterministic']);
const ORDER = { request: 0, assessment: 1, decision: 2, expiry: 3 };

export function compileEvidenceGraph({ submission, candidateResponseText = null, executionMode, clock, fixtureId = 'UNSPECIFIED', rulePacks, researchProfile }) {
  const research = researchProfile === undefined ? null : checkResearchProfile(researchProfile);
  const rp = validateRulePacks(rulePacks === undefined ? loadRulePacks() : rulePacks);
  const rules = rp.active;
  const runTimestamp = clock || new Date().toISOString();
  const record = submission && typeof submission.record_text === 'string' ? submission.record_text : null;
  const fxHash = fixtureHash(record, candidateResponseText);
  const identity = {
    fixture_id: fixtureId, fixture_hash: fxHash, record_sha256: record === null ? null : sha(record),
    candidate_response_sha256: typeof candidateResponseText === 'string' ? sha(candidateResponseText) : null,
    compiler_sha256: compilerHash(), run_id: 'egr_' + sha([fixtureId, fxHash, COMPILER_VERSION, runTimestamp].join('|')).slice(7, 31),
    run_timestamp: runTimestamp, execution_mode: EXECUTION_MODES.includes(executionMode) ? executionMode : 'not_authorized',
    provider_calls: 0, network_calls: 0,
  };
  const nodes = new Map(), edges = new Map();
  const node = (n) => { if (!nodes.has(n.id)) nodes.set(n.id, n); else if (n.origins) { const o = nodes.get(n.id); o.origins = [...new Set([...(o.origins || []), ...n.origins])].sort(); } return nodes.get(n.id); };
  const edge = (type, from, to) => { const id = type + ':' + from + '->' + to; if (!edges.has(id)) edges.set(id, { id, type, from, to, meaning: EDGE_MEANINGS[type] }); };
  const spanNode = (s, e, origin) => node({ id: 'span:' + s + '-' + e, type: 'record_span', start: s, end: e, utf8_start: utf8Offset(record, s), utf8_end: utf8Offset(record, e), text: record.slice(s, e), origins: [origin] }).id;
  const refusals = []; let refN = 0;
  const refusal = (code, disposition, boundary, targets) => {
    const id = 'ref:' + String(++refN).padStart(2, '0') + ':' + code;
    node({ id, type: 'refusal', code, disposition, boundary });
    for (const t of targets) edge('REFUSES', id, t);
    edge('ROUTES_TO_REVIEW', id, 'review');
    refusals.push({ id, code, disposition, boundary });
    return id;
  };

  node({ id: 'run', type: 'run_identity', run_id: identity.run_id, run_timestamp: runTimestamp, fixture_id: fixtureId });
  node({ id: 'review', type: 'human_review_route', route: HUMAN_REVIEW_ROUTE.route, statement: HUMAN_REVIEW_ROUTE.statement });
  for (const c of CONDITION_IDS) node({ id: 'cond:' + c, type: 'condition', condition_id: c });
  if (record !== null) { node({ id: 'record', type: 'record', sha256: identity.record_sha256, length_utf16: record.length, length_utf8: Buffer.byteLength(record, 'utf8') }); edge('RELATES_TO', 'run', 'record'); }

  let intake = { decision: 'refuse', triggers: [] };
  if (!EXECUTION_MODES.includes(executionMode)) intake.triggers.push({ code: 'execution_mode_not_authorized', disposition: 'refuse', category: 'execution', boundary: 'Execution mode ' + JSON.stringify(executionMode) + ' is not authorized. ' + LIMITATIONS.refusal });
  else intake = runIntake(submission, record, fxHash, rules, rp.problems, research ? { authorized: RESEARCH_AUTHORIZED_SCOPE, promptVersion: RESEARCH_PROMPT_VERSION, profileProblems: research.problems } : undefined);
  // 0.3.4 (RP-SRP-11): under an enabled research profile the research instruction screen adds its spans to the 0.3.2 list.
  const risk = record === null ? { record_instruction_risk: 'not_assessed', execution_boundary: 'preserved', spans: [] }
    : research && research.enabled ? (() => { const spans = researchInstructionSpans(record, research.rules); return { record_instruction_risk: spans.length ? 'detected' : 'not_detected', execution_boundary: 'preserved', spans }; })()
      : detectInstructionRisk(record);
  const findings = {};
  const finding = (c, status, proposed, reasons, explanation) => {
    findings[c] = { condition_id: c, status, proposed_status: proposed, reasons, explanation };
    node({ id: 'find:' + c, type: 'finding', condition_id: c, status, proposed_status: proposed, reasons, explanation });
    edge('RELATES_TO', 'find:' + c, 'cond:' + c);
    edge('ROUTES_TO_REVIEW', 'find:' + c, 'review');
  };
  const limit = (c, texts) => { node({ id: 'lim:' + c, type: 'limitation', text: texts.join(' ') }); edge('LIMITS', 'lim:' + c, 'find:' + c); };
  let controls = { controls: [], withheld: [] }, conflictsOut = [], candidate = { read: false, valid: null, reason: null, notes: [] };

  if (intake.decision !== 'proceed') {
    const ids = CONDITION_IDS.map((c) => 'find:' + c);
    for (const c of CONDITION_IDS) { finding(c, 'not_assessed', null, ['intake_' + intake.decision], 'Not assessed: the submission was stopped at intake. See refusals.'); limit(c, [LIMITATIONS.refusal]); }
    for (const t of intake.triggers) refusal(t.code, t.disposition, t.boundary, record !== null ? ['record', ...ids] : ids);
  } else {
    const sections = sectionsOf(record);
    for (const s of sections) {
      node({ id: 'sec:' + String(s.index).padStart(2, '0'), type: 'record_section', label: s.label, role: s.role, start: s.start, end: s.end, utf8_start: utf8Offset(record, s.start), utf8_end: utf8Offset(record, s.end) });
      edge('CONTAINS', 'record', 'sec:' + String(s.index).padStart(2, '0'));
    }
    const secId = (i) => sections.find((s) => i >= s.start && i < s.end);
    const contain = (spanId, start) => { const s = secId(start); if (s) edge('CONTAINS', 'sec:' + String(s.index).padStart(2, '0'), spanId); else edge('CONTAINS', 'record', spanId); };
    const { conflicts: defaultConflicts, events } = detectRecordConflicts(record, sections, rules);
    const units = research ? sentenceUnits(record, research.rules) : null;
    if (research) applyRelevanceAssessments(units, research.assessments, research.rules);   // 0.3.6 (RP-SRP-14)
    const revents = research ? researchEvents(record, units, research.rules) : null;
    const recordConflicts = research ? [...defaultConflicts, ...detectResearchConflicts(record, units, revents, research.rules)] : defaultConflicts;
    if (research) for (const ev of revents) contain(spanNode(ev.date_start, ev.date_end, 'compiler_research_dated_event'), ev.date_start);
    for (const ev of events) contain(spanNode(ev.start, ev.end, 'compiler_dated_event'), ev.start);
    // Timeline: explicitly dated events only, in workflow order.
    const ordered = [...events].sort((a, b) => ORDER[a.role] - ORDER[b.role] || a.start - b.start);
    for (let i = 0; i + 1 < ordered.length; i++) {
      const a = ordered[i], b = ordered[i + 1];
      if (a.role === b.role) continue;
      const ok = b.role === 'expiry' ? b.date > a.date : b.date >= a.date;
      edge(ok ? 'TEMPORALLY_PRECEDES' : 'TEMPORALLY_CONFLICTS', 'span:' + a.start + '-' + a.end, 'span:' + b.start + '-' + b.end);
    }
    const verifiedByCondition = Object.fromEntries(CONDITION_IDS.map((c) => [c, []]));
    const quoteFailures = Object.fromEntries(CONDITION_IDS.map((c) => [c, []]));
    const observationsByCondition = Object.fromEntries(CONDITION_IDS.map((c) => [c, []]));
    const defects = [];
    let candidateUsable = false;
    if (executionMode === 'local_mocked') {
      const v = validateCandidate(candidateResponseText, research ? { promptVersion: RESEARCH_PROMPT_VERSION } : undefined);
      candidate = { read: true, valid: v.ok, reason: v.ok ? null : v.reason, notes: v.notes };
      if (!v.ok) refusal('candidate_response_invalid', 'refuse', 'The candidate response failed the quote-only contract (' + v.reason + '). Nothing was repaired; no condition was assessed from it.', []);
      else {
        candidateUsable = true;
        for (const o of v.value.observations) {
          observationsByCondition[o.condition_id].push(o);
          const pq = 'pq:' + o.observation_id;
          const r = o.quote === null ? { quote_resolution_status: 'not_assessed', reason: 'no_quotation_proposed' } : resolveQuote(record, o.quote, o.disambiguator, sections);
          node({ id: pq, type: 'proposed_quote', observation_id: o.observation_id, condition_id: o.condition_id, proposed_status: o.proposed_status,
            quote: o.quote, assertion_type: o.assertion_type, quote_resolution_status: r.quote_resolution_status, reason: r.reason,
            occurrence_count: r.occurrence_count || 0, candidate_locations: (r.candidate_locations || []).map((l) => ({ start: l.start, end: l.end, section: l.section })) });
          edge('RELATES_TO', pq, 'cond:' + o.condition_id);
          if (USABLE_QUOTE_STATUSES.includes(r.quote_resolution_status)) {
            const sp = spanNode(r.location.start, r.location.end, 'candidate_quote');
            contain(sp, r.location.start);
            edge('LOCATES', pq, sp);
            const evId = 'ev:' + o.observation_id;
            node({ id: evId, type: 'verified_evidence', observation_id: o.observation_id, quote: o.quote, quote_resolution_status: r.quote_resolution_status,
              start: r.location.start, end: r.location.end, section: r.location.section });
            edge('QUOTES', evId, sp); edge('RELATES_TO', pq, evId);
            const a = compileAssertion({ observation: o, evidenceId: evId, quotedText: o.quote, spanId: sp, conditionId: o.condition_id, rules, markers: research ? RESEARCH_MARKERS : undefined });
            if (a.ok) {
              node(Object.assign({ id: a.assertion.assertion_id, type: 'assertion' }, a.assertion));
              edge('TEXTUALLY_SUPPORTS', evId, a.assertion.assertion_id);
              edge('RELATES_TO', a.assertion.assertion_id, 'cond:' + o.condition_id);
              verifiedByCondition[o.condition_id].push({ evidence_id: evId, assertion_id: a.assertion.assertion_id, assertion_type: o.assertion_type, quote: o.quote, condition_id: o.condition_id, span_id: sp, section: r.location.section });
            } else {
              quoteFailures[o.condition_id].push('assertion_rejected:' + a.problems.join(','));
              refusal('assertion_rejected', 'withhold', 'The quotation is present in the record, but its assertion was rejected (' + a.problems.join(', ') + '). It is not used for any finding.', [pq]);
            }
          } else if (r.quote_resolution_status !== 'not_assessed') {
            quoteFailures[o.condition_id].push('quote_' + r.quote_resolution_status + ':' + r.reason);
            for (const l of r.candidate_locations || []) { const sp = spanNode(l.start, l.end, 'candidate_quote_ambiguous'); contain(sp, l.start); edge('LOCATES', pq, sp); }
            refusal('quote_' + r.quote_resolution_status, 'withhold', 'The proposed quotation could not be used (' + r.quote_resolution_status + ': ' + r.reason + '). No location was chosen and nothing was repaired.', [pq]);
            defects.push({ defect: r.quote_resolution_status === 'ambiguous' ? 'ambiguous_quotation' : 'absent_quotation', condition_id: o.condition_id });
          }
        }
      }
    }
    // Conflicts: record-level and cited-evidence.
    const allVerified = Object.values(verifiedByCondition).flat();
    const conflicts = [...recordConflicts, ...(research ? detectResearchEvidenceConflicts(allVerified, record, units, revents, research.rules) : detectEvidenceConflicts(allVerified, events, rules))];
    const conflictAffects = Object.fromEntries(CONDITION_IDS.map((c) => [c, []]));
    conflicts.forEach((k, i) => {
      const id = 'conf:' + String(i + 1).padStart(2, '0');
      node({ id, type: 'conflict', kind: k.kind, summary: k.summary, statement: LIMITATIONS.conflict, affects: k.affects });
      if (k.spans) {
        const ids = k.spans.map((s) => { const sp = spanNode(s.start, s.end, 'compiler_conflict'); contain(sp, s.start); edge('CONTRADICTS', id, sp); return sp; });
        if (['decision_date_conflict', 'impossible_sequence'].includes(k.kind)) edge('TEMPORALLY_CONFLICTS', ids[0], ids[1]);
      }
      if (k.evidence) for (const e of k.evidence) edge('CONTRADICTS', id, e.evidence_id);
      edge('ROUTES_TO_REVIEW', id, 'review');
      for (const c of k.affects) conflictAffects[c].push(k.kind);
      defects.push({ defect: k.kind, condition_id: k.affects[0], span_ids: k.spans ? k.spans.map((s) => 'span:' + s.start + '-' + s.end) : [] });
      conflictsOut.push({ id, kind: k.kind, summary: k.summary, affects: k.affects });
    });
    const ruleResults = research ? evaluateResearchConditions(record, sections, units, revents, verifiedByCondition, research.rules) : evaluateConditions(record, sections, events, verifiedByCondition, rules);
    const defectReasons = ['conclusion_without_traceable_basis', 'conclusion_without_basis', 'basis_without_conclusion', 'basis_states_no_reason_or_source', ...(research ? RESEARCH_DEFECT_REVIEW_REASONS : [])];
    // 0.3.4 (RP-SRP-13): under the research profile each defect carries the record passages it concerns.
    const refSpans = (r, code) => (research && r.gap_spans && r.gap_spans[code] ? r.gap_spans[code] : []).map((x) => { const id = spanNode(x.start, x.end, 'compiler_control_reference'); contain(id, x.start); return id; });
    if (research && risk.record_instruction_risk === 'detected') defects.push({ defect: 'instruction_text_in_record', condition_id: 'reconstructability',
      span_ids: risk.spans.map((x) => { const id = spanNode(x.start, x.end, 'compiler_instruction_quarantine'); contain(id, x.start); return id; }) });
    for (const c of CONDITION_IDS) {
      const r = ruleResults[c];
      for (const g of r.visible_gaps) defects.push(research ? { defect: g, condition_id: c, span_ids: refSpans(r, g) } : { defect: g, condition_id: c });
      for (const rr of r.review_reasons) if (defectReasons.includes(rr)) defects.push(research ? { defect: rr, condition_id: c, span_ids: refSpans(r, rr) } : { defect: rr, condition_id: c });
      const obs = observationsByCondition[c];
      const reasons = [];
      let status, proposed = null;
      if (!candidateUsable) {
        status = 'not_assessed';
        reasons.push(executionMode === 'local_deterministic' ? 'deterministic_mode_no_candidate' : 'candidate_response_invalid');
      } else if (!obs.length) { status = 'review_required'; reasons.push('no_candidate_observation'); }
      else {
        const ps = [...new Set(obs.map((o) => o.proposed_status))];
        proposed = ps.length === 1 ? ps[0] : 'inconsistent';
        reasons.push(...quoteFailures[c]);
        for (const k of conflictAffects[c]) reasons.push('record_conflict:' + k);
        if (risk.record_instruction_risk === 'detected') reasons.push('record_instruction_risk_detected');
        const blocked = reasons.length > 0;
        if (proposed === 'inconsistent') { status = 'review_required'; reasons.push('inconsistent_candidate_statuses'); }
        else if (proposed === 'not_assessed') {
          if (obs.some((o) => o.quote !== null)) { status = 'review_required'; reasons.push('not_assessed_with_quotation'); } else { status = 'not_assessed'; reasons.push('candidate_did_not_assess'); }
        } else if (proposed === 'review_required') { status = 'review_required'; reasons.push('candidate_proposed_review_required'); }
        else if (proposed === 'supported') {
          if (c === 'sufficiency') { status = 'review_required'; reasons.push('sufficiency_not_determinable_by_engine'); }
          else if (blocked) status = 'review_required';
          else if (r.visible_gaps.length) { status = 'review_required'; reasons.push('candidate_supported_but_visible_gap:' + r.visible_gaps.join(',')); }
          else if (!r.requirement_visible) { status = 'review_required'; reasons.push(...r.review_reasons.map((x) => 'rule:' + x)); if (!r.review_reasons.length) reasons.push('rule:requirement_not_visible'); }
          else if (research && !researchLinked(c, verifiedByCondition[c], units, revents, research.rules)) { status = 'review_required'; reasons.push('evidence_not_in_research_linked_unit'); }
          else if (!research && rules.has('RP-EVL-01') && LINKED_SECTION_ROLES[c] && !verifiedByCondition[c].some((e) => LINKED_SECTION_ROLES[c].includes(roleOf(e.section || '')))) { status = 'review_required'; reasons.push('evidence_not_in_linked_section'); }
          else { status = 'supported'; reasons.push('verified_quotation_and_visible_rule_requirements'); }
        } else if (proposed === 'gap') {
          if (blocked) status = 'review_required';
          else if (r.visible_gaps.length && verifiedByCondition[c].length) { status = 'gap'; reasons.push('visible_gap:' + r.visible_gaps.join(',')); }
          else { status = 'review_required'; reasons.push(research && r.visible_gaps.length ? 'gap_without_verified_quotation' : 'gap_not_confirmed_by_rule'); }
        }
      }
      // 0.3.4: under the research profile a visible gap found by the rules is reported whenever the status is held
      // at review (a blocked condition, no observation, a review proposal) or not assessed, so a detected
      // instruction, a quotation failure or a silent candidate cannot hide it. The status itself is not changed.
      // A condition the candidate did not assess (or could not, its response being invalid) keeps its status; the
      // rules' visible gaps are stated after the first reason, which remains the refusal code.
      if (research && (status === 'review_required' || status === 'not_assessed') && r.visible_gaps.length && !reasons.some((x) => /^(?:visible_gap|candidate_supported_but_visible_gap):/.test(x))) reasons.push('visible_gap:' + r.visible_gaps.join(','));
      finding(c, status, proposed, reasons, r.explanation);
      const lims = [LIMITATIONS.presence];
      if (c === 'sufficiency') lims.push(LIMITATIONS.sufficiency);
      if (conflictAffects[c].length) lims.push(LIMITATIONS.conflict);
      if (risk.record_instruction_risk === 'detected') lims.push(LIMITATIONS.instruction);
      limit(c, lims);
      for (const e of verifiedByCondition[c]) edge('RELATES_TO', 'find:' + c, e.assertion_id);
      if (r.anchor) {
        const sp = spanNode(r.anchor.content_start, r.anchor.content_end, 'compiler_section');
        edge('CONTAINS', 'sec:' + String(r.anchor.index).padStart(2, '0'), sp);
        edge('RELATES_TO', 'find:' + c, sp);
      }
      if (status === 'not_assessed') refusal(reasons[0], 'refuse', 'Not assessed for ' + c + ' (' + reasons[0] + '). ' + LIMITATIONS.refusal, ['find:' + c]);
      else if (!verifiedByCondition[c].length && !r.anchor) {
        findings[c].status = 'review_required'; nodes.get('find:' + c).status = 'review_required';
        refusal('no_traceable_record_anchor', 'withhold', 'No verified quotation and no record section anchor exist for ' + c + '. The finding cannot be traced to record text and is routed to review.', ['find:' + c]);
      }
    }
    for (const s of certaintySpans(record)) { const sp = spanNode(s.start, s.end, 'compiler_certainty'); contain(sp, s.start); defects.push({ defect: 'certainty_language', condition_id: 'sufficiency', span_ids: [sp] }); }
    const wanted = new Set(Array.isArray(submission.requested_outputs) ? submission.requested_outputs : []);
    if (wanted.has('cognitive_controls')) controls = research ? buildResearchControls(defects, RESEARCH_DEFECT_TEMPLATES) : buildControls(defects);
  }
  if (record !== null && risk.spans.length) for (const s of risk.spans) edge('CONTAINS', 'record', spanNode(s.start, s.end, 'compiler_instruction_quarantine'));

  const graph = {
    graph_format_version: GRAPH_FORMAT_VERSION, contract_version: CONTRACT_VERSION, compiler_version: COMPILER_VERSION,
    prompt_version: research && research.enabled ? RESEARCH_PROMPT_VERSION : PROMPT_VERSION, codebook_version: CODEBOOK_VERSION, historical_reference_id: HISTORICAL_REFERENCE_ID, release_status: RELEASE_STATUS,
    rule_packs: { candidate_version: COMPILER_VERSION, valid: rp.ok, problem_count: rp.problems.length, packs: rp.identity, active_rules: [...rules].sort() },
    identity,
    intake: { decision: intake.decision, triggers: intake.triggers },
    record_instruction_risk: risk.record_instruction_risk, execution_boundary: 'preserved',
    instruction_quarantine: { spans: risk.spans, limitation: LIMITATIONS.instruction },
    candidate,
    findings: CONDITION_IDS.map((c) => findings[c]),
    conflicts: conflictsOut,
    refusals,
    cognitive_controls: controls.controls,
    controls_withheld: controls.withheld,
    human_review_route: HUMAN_REVIEW_ROUTE,
    nodes: [...nodes.values()].sort((a, b) => (a.id < b.id ? -1 : 1)),
    edges: [...edges.values()].sort((a, b) => (a.id < b.id ? -1 : 1)),
  };
  if (research) graph.research_profile = research.identity;   // present only when a research profile was passed
  graph.identity.graph_sha256 = sha(canonical(Object.assign({}, graph, { identity: Object.assign({}, graph.identity, { run_id: null, run_timestamp: null, graph_sha256: null }) })));
  const problems = validateGraph(graph, record);
  if (problems.length) { const e = new Error('graph_self_validation_failed: ' + problems.join('; ')); e.graph = graph; throw e; }
  return graph;
}
