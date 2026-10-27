// JRS EVIDENCE GRAPH 0.3.0: independent graph validation (fail closed).
//
// Re-checks a finished graph without trusting the compiler. Rules GV-01 to GV-14
// are listed in research/evidence-graph-compiler-2026-10-10/EVIDENCE_GRAPH_SPECIFICATION.md.

import {
  CONTRACT_VERSION, COMPILER_VERSION, PROMPT_VERSION, CODEBOOK_VERSION, GRAPH_FORMAT_VERSION, RELEASE_STATUS, HISTORICAL_REFERENCE_ID,
  NODE_TYPES, EDGE_TYPES, EDGE_SHAPES, EDGE_MEANINGS, CONDITION_IDS, STATUSES, USABLE_QUOTE_STATUSES, LIMITATIONS, ASSERTION_TYPES,
} from './contract.mjs';
import { scanProhibitedClaims } from '../engine-evidence-contract/claims.mjs';
import { checkRemediationNeutral } from '../engine-evidence-contract/remediation.mjs';
// The research prompt version string, duplicated here so that validation never imports the profile module.
const RESEARCH_PROMPT_VERSION = 'jrs-engine-local-0.3.3-research/prompt-1';

export function canonical(v) {
  const sort = (x) => Array.isArray(x) ? x.map(sort) : (x && typeof x === 'object'
    ? Object.fromEntries(Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => [k, sort(x[k])])) : x);
  return JSON.stringify(sort(v));
}

const NODE_FIELDS = {
  record: ['sha256', 'length_utf16', 'length_utf8'],
  record_section: ['label', 'role', 'start', 'end', 'utf8_start', 'utf8_end'],
  record_span: ['start', 'end', 'utf8_start', 'utf8_end', 'text', 'origins'],
  proposed_quote: ['observation_id', 'condition_id', 'proposed_status', 'quote', 'assertion_type', 'quote_resolution_status', 'reason', 'occurrence_count', 'candidate_locations'],
  verified_evidence: ['observation_id', 'quote', 'quote_resolution_status', 'start', 'end', 'section'],
  assertion: ['assertion_id', 'assertion_type', 'quoted_text', 'record_span_id', 'condition_id', 'assertion_scope', 'assertion_limit', 'requires_human_interpretation'],
  condition: ['condition_id'],
  finding: ['condition_id', 'status', 'proposed_status', 'reasons', 'explanation'],
  limitation: ['text'],
  conflict: ['kind', 'summary', 'statement', 'affects'],
  refusal: ['code', 'disposition', 'boundary'],
  human_review_route: ['route', 'statement'],
  run_identity: ['run_id', 'run_timestamp', 'fixture_id'],
};
// Authored text must not claim proof, truth, legal sufficiency, compliance, credibility or correctness.
const PROOF_CLAIM = /\b(?:proves?|proven|proof of|demonstrates that|establishes that the (?:decision|finding|record) (?:is|was)|true state|legally sufficient|is compliant|is credible|was correct|is correct)\b/i;
const VERBATIM = new Set(['text', 'quote', 'quoted_text', 'matched_text', 'candidate_locations']);
const NEGATOR = /\b(?:not|no|never|does not|do not|is not|cannot|without)\b/i;
// A proof claim counts only when it is not negated within the preceding eight
// words of its clause (the required conflict statement says "not the true state").
function assertsProof(text) {
  const re = new RegExp(PROOF_CLAIM.source, 'gi'); let m;
  while ((m = re.exec(text)) !== null) {
    let pre = text.slice(0, m.index); const cut = Math.max(pre.lastIndexOf('. '), pre.lastIndexOf('; ')); if (cut !== -1) pre = pre.slice(cut + 1);
    if (!NEGATOR.test(pre.trim().split(/\s+/).slice(-8).join(' '))) return true;
  }
  return false;
}

export function validateGraph(g, record) {
  const p = [];
  const add = (r, m) => p.push(r + ': ' + m);
  if (!g || typeof g !== 'object') return ['GV-00: graph is not an object'];
  // GV-01 identity.
  // 0.3.3: a graph compiled under an enabled research profile carries the research prompt version.
  const promptWanted = g.research_profile && g.research_profile.enabled === true ? RESEARCH_PROMPT_VERSION : PROMPT_VERSION;
  for (const [k, v] of [['graph_format_version', GRAPH_FORMAT_VERSION], ['contract_version', CONTRACT_VERSION], ['compiler_version', COMPILER_VERSION],
    ['prompt_version', promptWanted], ['codebook_version', CODEBOOK_VERSION], ['historical_reference_id', HISTORICAL_REFERENCE_ID], ['release_status', RELEASE_STATUS]]) {
    if (g[k] !== v) add('GV-01', k + ' is ' + JSON.stringify(g[k]));
  }
  const id = g.identity || {};
  for (const k of ['fixture_id', 'fixture_hash', 'compiler_sha256', 'run_id', 'run_timestamp']) if (!id[k]) add('GV-01', 'identity.' + k + ' missing');
  if (id.provider_calls !== 0 || id.network_calls !== 0) add('GV-01', 'provider or network calls recorded');
  // GV-02 nodes.
  const nodes = new Map();
  for (const n of g.nodes || []) {
    if (!n || !NODE_TYPES.includes(n.type)) { add('GV-02', 'unknown node type ' + (n && n.type)); continue; }
    if (nodes.has(n.id)) add('GV-02', 'duplicate node ' + n.id);
    nodes.set(n.id, n);
    const allowed = new Set(['id', 'type', ...NODE_FIELDS[n.type]]);
    for (const k of Object.keys(n)) if (!allowed.has(k)) add('GV-02', n.id + ' has undeclared field ' + k);
    for (const k of NODE_FIELDS[n.type]) if (!(k in n)) add('GV-02', n.id + ' missing ' + k);
  }
  if (record !== null && record !== undefined) {
    const rn = nodes.get('record');
    if (!rn) add('GV-01', 'record node missing');
  }
  // GV-03 edges.
  const out = new Map(), inc = new Map();
  for (const e of g.edges || []) {
    if (!EDGE_TYPES.includes(e.type)) { add('GV-03', 'unknown edge type ' + e.type); continue; }
    const a = nodes.get(e.from), b = nodes.get(e.to);
    if (!a || !b) { add('GV-03', 'dangling edge ' + e.id); continue; }
    if (!EDGE_SHAPES[e.type].some(([f, t]) => f === a.type && t === b.type)) add('GV-03', 'edge ' + e.type + ' not permitted from ' + a.type + ' to ' + b.type);
    if (e.meaning !== EDGE_MEANINGS[e.type]) add('GV-03', 'edge ' + e.id + ' carries a non-standard meaning');
    if (!out.has(e.from)) out.set(e.from, []); out.get(e.from).push(e);
    if (!inc.has(e.to)) inc.set(e.to, []); inc.get(e.to).push(e);
  }
  const outs = (nid, type) => (out.get(nid) || []).filter((e) => e.type === type).map((e) => nodes.get(e.to));
  const ins = (nid, type) => (inc.get(nid) || []).filter((e) => e.type === type).map((e) => nodes.get(e.from));
  // GV-04 spans are exact record text.
  for (const n of nodes.values()) if (n.type === 'record_span') {
    if (typeof record !== 'string' || record.slice(n.start, n.end) !== n.text || n.end <= n.start) add('GV-04', n.id + ' text does not match the record at its offsets');
    else if (Buffer.byteLength(record.slice(0, n.start), 'utf8') !== n.utf8_start || Buffer.byteLength(record.slice(0, n.end), 'utf8') !== n.utf8_end) add('GV-04', n.id + ' byte offsets inconsistent');
  }
  // GV-05 verified evidence.
  for (const n of nodes.values()) if (n.type === 'verified_evidence') {
    if (!USABLE_QUOTE_STATUSES.includes(n.quote_resolution_status)) add('GV-05', n.id + ' has unusable status ' + n.quote_resolution_status);
    const q = outs(n.id, 'QUOTES');
    if (q.length !== 1 || q[0].text !== n.quote || q[0].start !== n.start) add('GV-05', n.id + ' does not quote exactly one matching span');
  }
  for (const n of nodes.values()) if (n.type === 'assertion') {
    if (!ASSERTION_TYPES.includes(n.assertion_type)) add('GV-05', n.id + ' unknown assertion type');
    if (n.requires_human_interpretation !== true) add('GV-05', n.id + ' must require human interpretation');
    const src = ins(n.id, 'TEXTUALLY_SUPPORTS');
    if (src.length !== 1 || src[0].quote !== n.quoted_text) add('GV-05', n.id + ' not supported by exactly one matching verified evidence item');
  }
  // GV-06 to GV-08 findings.
  const fs = g.findings || [];
  if (fs.length !== 5 || CONDITION_IDS.some((c) => fs.filter((f) => f && f.condition_id === c).length !== 1)) add('GV-06', 'findings must be the five conditions once each');
  const stopped = !g.intake || g.intake.decision !== 'proceed';
  for (const f of fs) {
    if (!f) continue;
    const fid = 'find:' + f.condition_id, fn = nodes.get(fid);
    if (!fn || fn.status !== f.status) { add('GV-06', fid + ' node missing or status differs'); continue; }
    if (!STATUSES.includes(f.status)) add('GV-06', fid + ' status ' + f.status);
    const refused = ins(fid, 'REFUSES').length > 0;
    const viaAssertion = outs(fid, 'RELATES_TO').filter((n) => n.type === 'assertion')
      .flatMap((a) => ins(a.id, 'TEXTUALLY_SUPPORTS')).flatMap((ev) => outs(ev.id, 'QUOTES'));
    const direct = outs(fid, 'RELATES_TO').filter((n) => n.type === 'record_span');
    if (!refused && !viaAssertion.length && !direct.length) add('GV-06', fid + ' cannot be traversed to an exact record span');
    if (f.status === 'supported' || f.status === 'gap') {
      if (!viaAssertion.length) add('GV-07', fid + ' ' + f.status + ' without a verified evidence path');
      if (refused) add('GV-07', fid + ' ' + f.status + ' while refused');
      if (stopped) add('GV-07', fid + ' ' + f.status + ' after a stopped intake');
      if (g.record_instruction_risk === 'detected') add('GV-07', fid + ' ' + f.status + ' with instruction risk detected');
      if ((g.conflicts || []).some((k) => k.affects.includes(f.condition_id))) add('GV-07', fid + ' ' + f.status + ' despite a conflict affecting the condition');
      const pqs = [...nodes.values()].filter((n) => n.type === 'proposed_quote' && n.condition_id === f.condition_id);
      if (pqs.some((n) => !USABLE_QUOTE_STATUSES.includes(n.quote_resolution_status))) add('GV-07', fid + ' ' + f.status + ' with an unusable quotation for the condition');
      if (f.status === 'supported' && f.condition_id === 'sufficiency') add('GV-07', 'sufficiency can never be supported');
      if (f.proposed_status !== f.status) add('GV-07', fid + ' status raised or changed from proposed ' + f.proposed_status);
    }
    const lim = ins(fid, 'LIMITS');
    if (lim.length !== 1) add('GV-08', fid + ' must have exactly one limitation');
    else {
      if (f.status !== 'not_assessed' && !lim[0].text.includes(LIMITATIONS.presence)) add('GV-08', fid + ' presence limitation missing');
      if (f.condition_id === 'sufficiency' && f.status !== 'not_assessed' && !lim[0].text.includes(LIMITATIONS.sufficiency)) add('GV-08', fid + ' sufficiency limitation missing');
    }
    if (!outs(fid, 'ROUTES_TO_REVIEW').length) add('GV-08', fid + ' not routed to human review');
  }
  // GV-09 conflicts.
  for (const n of nodes.values()) if (n.type === 'conflict') {
    if (outs(n.id, 'CONTRADICTS').length < 2) add('GV-09', n.id + ' must link at least two items');
    if (n.statement !== LIMITATIONS.conflict) add('GV-09', n.id + ' statement altered');
    if (!outs(n.id, 'ROUTES_TO_REVIEW').length) add('GV-09', n.id + ' not routed to review');
    for (const c of n.affects) { const f = fs.find((x) => x && x.condition_id === c); if (f && (f.status === 'supported' || f.status === 'gap')) add('GV-09', c + ' not downgraded for ' + n.id); }
  }
  // GV-10 stopped intake.
  if (stopped && fs.some((f) => f && f.status !== 'not_assessed')) add('GV-10', 'stopped intake with an assessed finding');
  if (stopped && g.candidate && g.candidate.read) add('GV-10', 'candidate response read after a stopped intake');
  // GV-11 authored text.
  const scan = (v, path) => {
    if (typeof v === 'string') {
      if (assertsProof(v)) add('GV-11', path + ' claims proof or correctness');
      const h = scanProhibitedClaims(v); if (h.length) add('GV-11', path + ' "' + h[0].term + '"');
    } else if (Array.isArray(v)) v.forEach((x, i) => scan(x, path + '[' + i + ']'));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) if (!VERBATIM.has(k) && k !== 'instruction_quarantine') scan(v[k], path + '.' + k);
  };
  scan(Object.assign({}, g, { nodes: g.nodes.filter((n) => n.type !== 'proposed_quote') }), '$');
  // GV-12 deterministic ordering.
  const sorted = (arr) => arr.every((x, i) => !i || arr[i - 1].id < x.id);
  if (!sorted(g.nodes || []) || !sorted(g.edges || [])) add('GV-12', 'nodes and edges must be sorted by id');
  // GV-13 controls neutral.
  for (const c of g.cognitive_controls || []) { const n = checkRemediationNeutral(c); if (n.length) add('GV-13', c.control_id + ' ' + n.join(',')); }
  // GV-14 no overall result anywhere.
  const keys = (v, path) => { if (Array.isArray(v)) v.forEach((x, i) => keys(x, path + '[' + i + ']')); else if (v && typeof v === 'object') for (const k of Object.keys(v)) {
    if (/^(overall|determination|final_decision|recommendation|approved|readiness|certif|complian|validated|score)/i.test(k)) add('GV-14', 'prohibited key ' + path + '.' + k);
    keys(v[k], path + '.' + k); } };
  keys(g, '$');
  return p;
}
