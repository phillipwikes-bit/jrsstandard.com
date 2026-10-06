// Claim provenance: the governing claim rules. INTERNAL, LOCAL ONLY.
//
// The schema checks shape and the SUPPORTED_WITH_LIMITATION requirements. These rules check
// meaning, and each one is a governing rule of the package:
//   G01 detection performance is not inter-rater reliability;
//   G02 reviewer agreement is not correctness or psychometric validation;
//   G03 cross-model agreement is not accuracy, human reliability or independent validation;
//   G04 constructed-record findings are not real-world performance;
//   G05 a local test, fixture, mock or schema test does not validate the Engine;
//   G06 exact quotation presence is not semantic support;
//   G07 a research finding about JRS does not validate the Engine;
//   G08 a policy or website statement does not prove a live control executes;
//   G09 a required denominator and scope qualifier cannot be dropped from the permitted wording;
//   G10 historical language is not presented as current;
//   G11 no readiness, compliance or defensibility status for the Engine;
//   G12 the recorded limitation appears in the permitted wording;
//   G13 the record is bound to its evidence source at the reviewed hash.
import { checkSchema } from './schema-check.js';

export const STATUSES = Object.freeze(['SUPPORTED_WITH_LIMITATION', 'HISTORICAL_ONLY', 'SOURCE_REPORTED_NOT_REPRODUCED', 'NOT_SUPPORTED', 'NOT_ASSESSED', 'REQUIRES_WORDING_REPAIR', 'RETIRED']);
export const ENGINE_RELATIONSHIPS = Object.freeze(['NO_ENGINE_INFERENCE', 'ENGINE_DEVELOPMENT_ONLY', 'ENGINE_EVIDENCE_SEPARATE', 'NOT_APPLICABLE']);
export const RESEARCH_TOPICS = Object.freeze(['DETECTION', 'RELIABILITY', 'CROSS_MODEL', 'PARTICIPATION', 'CONDITION_BEHAVIOUR', 'DRR_STUDY', 'METHODOLOGY', 'RESEARCH_STATUS']);
export const ENGINE_TOPICS = Object.freeze(['ENGINE_SOURCE_GROUNDING', 'ENGINE_PROVENANCE', 'ENGINE_LOCAL_EVALUATION', 'ENGINE_REGRESSION', 'ENGINE_ROUTE_STATUS', 'ENGINE_STATUS', 'RELEASE_GATE']);
export const LOCAL_CLASSES = Object.freeze(['LOCAL_TEST', 'MOCK_OR_FIXTURE', 'SOURCE_GROUNDING_TEST', 'SCHEMA_TEST']);
export const RESEARCH_CLASSES = Object.freeze(['MANUSCRIPT_REPORTED', 'STRUCTURED_SECONDARY_ANALYSIS', 'AUTHORITATIVE_TABLE_READ_REPORTED', 'CONTEMPORANEOUS_PROJECT_RECORD', 'AUTHOR_STATEMENT', 'CONTEMPORANEOUS_COMMUNICATION']);
export const READINESS = /\b(production[- ]ready|enterprise[- ]ready|licensing[- ]ready|licen[cs]e[- ]ready|sale[- ]ready|acquisition[- ]ready|independently validated|compliant|defensible|court[- ]proof|audit[- ]proof|certified|in production)\b/i;
const NEG = /\b(not|no|never|nor|neither|without|cannot|isn't|aren't|doesn't|does not|is not|are not|none|nothing|unvalidated)\b/i;

// True when `re` matches `text` in a clause that is not negated. A clause runs back from the
// match to the nearest sentence or clause boundary (a negation governs the list that follows it).
export function asserts(text, re) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  for (const m of String(text).matchAll(g)) {
    const head = text.slice(0, m.index + m[0].length);
    const cut = Math.max(head.lastIndexOf('. '), head.lastIndexOf('; '), head.lastIndexOf(': '), head.lastIndexOf('('));
    if (!NEG.test(head.slice(cut + 1))) return true;
  }
  return false;
}

// evidence: [{ id, path, binding, evidence_class, current_hash, reviewed_hash }]
export function validateClaim(r, { schema, evidence }) {
  const where = (r && r.claim_id) || 'claim';
  const p = checkSchema(schema, r, where);
  if (p.length) return p;
  const both = r.claim_text + ' ' + r.permitted_wording, perm = r.permitted_wording;
  const ev = evidence.find((e) => e.id === r.evidence_id);
  if (!ev) return [where + ': names an unknown evidence source'];
  // G13 binding
  if (r.source_path !== ev.path || r.evidence_class !== ev.evidence_class) p.push(where + ': source path or evidence class differs from its evidence record');
  if (ev.binding !== 'NONE') {
    if (r.source_hash !== ev.binding + ':' + ev.reviewed_hash) p.push(where + ': source hash is not the reviewed hash of ' + ev.id);
    if (ev.current_hash !== ev.reviewed_hash) p.push(where + ': ' + ev.id + ' has changed since review (unreconciled source hash)');
  } else if (r.source_hash !== null) p.push(where + ': a source hash without a source');
  if (r.evidence_class === 'NONE' && !['NOT_SUPPORTED', 'NOT_ASSESSED', 'RETIRED'].includes(r.status)) p.push(where + ': a claim with no evidence source must be NOT_SUPPORTED, NOT_ASSESSED or RETIRED');
  // G01 to G08
  if (r.claim_topic === 'DETECTION' && asserts(both, /\b(reliab\w*|inter-rater|rater agreement)\b/i)) p.push(where + ': G01 detection performance labelled reliability');
  if (r.claim_topic === 'RELIABILITY' && asserts(perm, /\b(accura\w*|correct\w*|validat\w*|psychometric)\b/i)) p.push(where + ': G02 agreement labelled correctness or validation');
  if (r.claim_topic === 'CROSS_MODEL' && asserts(both, /\b(accura\w*|reliab\w*|validat\w*)\b/i)) p.push(where + ': G03 cross-model agreement labelled accuracy, reliability or validation');
  const constructed = /constructed/i.test((r.population || '') + ' ' + r.limitation + ' ' + r.claim_text);
  if (constructed && asserts(perm, /\b(real[- ]world|field performance|in practice|on real records)\b/i)) p.push(where + ': G04 constructed-record result presented as real-world');
  if (LOCAL_CLASSES.includes(r.evidence_class) && (asserts(both, /\b(production|validat\w*|accura\w*|reliab\w*)\b/i))) p.push(where + ': G05 local test, fixture, mock or schema evidence presented as production or validation evidence');
  if (r.evidence_class === 'SOURCE_GROUNDING_TEST' && (!/not semantic support/i.test(r.limitation) || asserts(perm, /\b(semantic(ally)?|proves?|correct)\b/i))) p.push(where + ': G06 source-grounding test presented as semantic validation');
  const engineClaim = asserts(r.claim_text, /\b(Review Engine|the Engine|Engine)\b[^.]{0,80}\b(validat\w*|accura\w*|reliab\w*|production|ready)\b/i) || asserts(r.claim_text, /\bvalidat\w*\b[^.]{0,40}\b(Review Engine|the Engine)\b/i);
  if (engineClaim && (RESEARCH_CLASSES.includes(r.evidence_class) || r.evidence_class === 'NONE' || LOCAL_CLASSES.includes(r.evidence_class)) && r.status !== 'NOT_SUPPORTED') p.push(where + ': G07 Engine validation claim without Engine evidence must be NOT_SUPPORTED');
  if (RESEARCH_TOPICS.includes(r.claim_topic) && r.engine_relationship !== 'NO_ENGINE_INFERENCE') p.push(where + ': G07 a research claim must carry NO_ENGINE_INFERENCE');
  if (ENGINE_TOPICS.includes(r.claim_topic) && !['ENGINE_DEVELOPMENT_ONLY', 'ENGINE_EVIDENCE_SEPARATE'].includes(r.engine_relationship)) p.push(where + ': G07 an Engine claim must be ENGINE_DEVELOPMENT_ONLY or ENGINE_EVIDENCE_SEPARATE');
  if (r.evidence_class === 'POLICY_OR_WEBSITE_STATEMENT' && ['SUPPORTED_WITH_LIMITATION', 'SOURCE_REPORTED_NOT_REPRODUCED'].includes(r.status)) p.push(where + ': G08 a policy or website statement cannot support a control claim');
  // G09 denominators and qualifiers
  const q = r.quantities;
  if (['SUPPORTED_WITH_LIMITATION', 'SOURCE_REPORTED_NOT_REPRODUCED', 'HISTORICAL_ONLY'].includes(r.status) && q && q.denominator_required && !(q.denominator && (q.denominator.match(/\d+/g) || []).some((d) => new RegExp('\\b' + d + '\\b').test(perm)))) p.push(where + ': G09 the permitted wording omits the required denominator');
  if (['SUPPORTED_WITH_LIMITATION', 'SOURCE_REPORTED_NOT_REPRODUCED', 'HISTORICAL_ONLY'].includes(r.status))
    for (const [name, re] of r.scan.qualifiers) if (!new RegExp(re, 'i').test(perm)) p.push(where + ': G09 the permitted wording lacks the qualifier "' + name + '"');
  // G10 to G12
  if (r.status === 'HISTORICAL_ONLY' && !/\b(historical|earlier|previously)\b/i.test(perm)) p.push(where + ': G10 historical claim without a historical marker in its permitted wording');
  if (asserts(perm, READINESS)) p.push(where + ': G11 the permitted wording asserts readiness, compliance or defensibility');
  if (asserts(r.claim_text, READINESS) && r.status !== 'NOT_SUPPORTED') p.push(where + ': G11 a readiness, compliance or defensibility claim must be NOT_SUPPORTED');
  if (r.limitation_key && !perm.toLowerCase().includes(r.limitation_key.toLowerCase())) p.push(where + ': G12 the permitted wording omits the recorded limitation ("' + r.limitation_key + '")');
  if (['SUPPORTED_WITH_LIMITATION', 'SOURCE_REPORTED_NOT_REPRODUCED'].includes(r.status) && !r.limitation_key) p.push(where + ': G12 a supported claim needs a limitation key');
  for (const w of r.prohibited_overstatement) if (perm.toLowerCase().includes(w.toLowerCase())) p.push(where + ': the permitted wording contains a prohibited overstatement');
  if (r.status === 'NOT_SUPPORTED' && !['MUST_NOT_STATE', 'MUST_NOT_STATE_AS_EVIDENCE'].includes(r.public_use)) p.push(where + ': a NOT_SUPPORTED claim must not be stated');
  if (r.status === 'RETIRED' && r.review_history.length < 2) p.push(where + ': a retired claim must record its retirement');
  if (r.reproduction === 'REPRODUCED_IN_REPOSITORY' && !LOCAL_CLASSES.includes(r.evidence_class) && r.evidence_class !== 'REPOSITORY_CONTROL_RECORD') p.push(where + ': only repository tests and control records are reproduced in the repository');
  for (const [, re] of r.scan.qualifiers.concat(r.scan.prohibited)) try { new RegExp(re); } catch (e) { p.push(where + ': invalid scan pattern'); }
  return p;
}

export function validateRegister(reg, ctx) {
  const p = [], ids = new Set();
  for (const r of reg.claims) { p.push(...validateClaim(r, ctx)); if (ids.has(r.claim_id)) p.push(r.claim_id + ': duplicate claim id'); ids.add(r.claim_id); }
  return p;
}

export function statusSummary(claims) {
  const out = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of claims) out[r.status] += 1;
  return out;
}
