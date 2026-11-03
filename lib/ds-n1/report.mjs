// Decision record report: the Issue 3.6 proposed eight-part structure.
// Deterministic: the same record + events + generated_at give identical bytes.
// The report never states that a human signed or approved anything unless a
// final_disposition event with that human's identity exists in the log.
import { CANDIDATE, REPORT_SCHEMA, EXPORT_SCHEMA, CONDITIONS, CONDITION_MAPPING_STATUS, READY_MEANING, STATUS } from './identity.mjs';
import { deriveState } from './session.mjs';
import { canonical, sha256, escapeHtml, slice } from './text.mjs';

export const LIMITATIONS = Object.freeze([
  'DS-N1 is a new experimental candidate. It is not the original Decision Spellchecker (DS-A) and carries no DS-A validation.',
  'All assessments are deterministic lexical rules. They do not understand meaning; a passage can pass these checks and still not support a claim.',
  'Relevance uses term overlap between the claim and the cited source sentence; paraphrased support may be reported as not established.',
  'Negation and qualification detection use fixed word lists and compare whole sentences; double negatives and implied conditions are not handled.',
  'Dates are recognised only in YYYY-MM-DD, "Month D, YYYY" and "D Month YYYY" forms. Event roles are checked only where the source supplies structured events.',
  'Sentence segmentation is rule-based; abbreviations may split sentences.',
  'Sufficiency is never decided by DS-N1 and always requires human judgment.',
  'Results were developed against developer-constructed fictional fixtures only. No independent or field validation exists.',
]);

export function buildReport(session, { generated_at }) {
  const st = deriveState(session);
  const rec = st.record;
  const header = {
    schema: REPORT_SCHEMA,
    generated_at,
    generator: { candidate_id: CANDIDATE.candidate_id, version: CANDIDATE.version, rule_version: CANDIDATE.rule_version, model_calls: 0 },
  };
  if (!rec || st.status === STATUS.ERROR || st.status === STATUS.REFUSED) {
    return { ...header, status: st.status, reasons: st.reasons, parts: null, limitations: LIMITATIONS };
  }
  const roles = [];
  for (const s of rec.sources) for (const ev of s.events) roles.push({ date: ev.date, role: ev.role, actor: ev.actor || null, source_id: s.source_id });
  roles.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.role < b.role ? -1 : 1));
  const claimedEvents = [];
  for (const c of rec.claims) if (c.event) claimedEvents.push({ claim_id: c.claim_id, ...c.event });

  const byCond = {};
  for (const k of Object.keys(CONDITIONS)) {
    const fs = st.findings.filter((f) => f.condition === k && f.status !== 'SUPERSEDED');
    byCond[k] = {
      name: CONDITIONS[k],
      active_findings: fs.length,
      unresolved: fs.filter((f) => ['OPEN', 'AWAITING_EVIDENCE', 'ESCALATED'].includes(f.status)).map((f) => f.finding_id),
      resolved_by_human: fs.filter((f) => ['OVERRIDDEN', 'LIMITATION_RECORDED'].includes(f.status)).map((f) => f.finding_id),
    };
  }

  const reviewers = new Map();
  for (const e of st.events) if (e.reviewer) reviewers.set(e.reviewer.reviewer_id, e.reviewer.name);

  const parts = {
    '1_record_identification': {
      record_id: rec.record_id, record_version: rec.record_version, title: rec.title,
      record_class: rec.record_class, data_classification: rec.data_classification,
      record_digest: rec.record_digest, scope: 'Constructed fictional supplier-access exception drafts only.',
    },
    '2_evidence_inventory': rec.sources.map((s) => ({
      source_id: s.source_id, title: s.title, version: s.version, digest: s.digest,
      cited_by: rec.claims.filter((c) => c.citations.some((x) => x.source_id === s.source_id)).map((c) => c.claim_id),
      structured_events: s.events.length,
    })),
    '3_chronology': {
      source_events: roles, claimed_events: claimedEvents,
      chronology_findings: st.findings.filter((f) => f.condition === 'RC3').map((f) => ({ finding_id: f.finding_id, code: f.code, status: f.status })),
    },
    '4_claim_evidence_trace': st.claims.map((c) => ({
      claim_id: c.claim_id, kind: c.kind, original_text: c.original_text, current_text: c.text,
      record_span: c.record_span, revisions: c.revisions, reasoning: c.reasoning,
      citations: c.citations.map((a) => ({ source_id: a.source_id, quote: a.quote, quote_match: a.quote_match, source_span: a.source_span, source_digest: a.source_digest, relevance: a.relevance, checks: a.checks })),
      support: c.support, sufficiency: c.sufficiency,
      findings: st.findings.filter((f) => f.claim_id === c.claim_id).map((f) => ({ finding_id: f.finding_id, code: f.code, severity: f.severity, status: f.status, question: f.question, actions: f.actions })),
    })),
    '5_condition_review': { mapping_status: CONDITION_MAPPING_STATUS, conditions: byCond },
    '6_contradictions_and_gaps': {
      unresolved: st.findings.filter((f) => ['OPEN', 'AWAITING_EVIDENCE', 'ESCALATED'].includes(f.status)).map(slim),
      superseded: st.findings.filter((f) => f.status === 'SUPERSEDED').map(slim),
      unassessed_sentences: (st.unassessed_sentences || []).map((s) => ({ ...s, text: slice(rec.text, s.start, s.end) })),
    },
    '7_human_disposition': {
      machine_status: st.status,
      machine_status_meaning: st.status === STATUS.READY ? READY_MEANING : null,
      reasons: st.reasons,
      reviewers: [...reviewers].map(([reviewer_id, name]) => ({ reviewer_id, name })),
      actions: st.events.filter((e) => e.seq > 0).map((e) => { const { schema, prev_hash, ...r } = e; void schema; void prev_hash; return r; }),
      overrides_of_critical_findings: st.overrides_of_critical,
      // Present only when feedback exists, so reports of sessions without
      // feedback keep their existing shape.
      ...(st.events.some((e) => e.type === 'finding_feedback') ? { reviewer_feedback_on_findings: feedbackSummary(st.events) } : {}),
      final_disposition: st.final_disposition || 'NOT RECORDED. No human has recorded a final disposition; this report is not a signoff.',
    },
    '8_export_provenance': {
      generator: header.generator,
      event_count: st.events.length,
      event_chain_head: st.events[st.events.length - 1].hash,
      chain_verified: st.chain.ok,
      validation_status: 'DEVELOPER VERIFIED ON CONSTRUCTED FIXTURES ONLY; NOT INDEPENDENTLY VERIFIED',
    },
  };
  return { ...header, status: st.status, parts, limitations: LIMITATIONS };
}

function feedbackSummary(events) {
  const byCode = {};
  for (const e of events) if (e.type === 'finding_feedback') {
    byCode[e.code] ||= { useful: 0, not_useful: 0, wrong: 0 };
    byCode[e.code][e.usefulness]++;
  }
  return { note: 'Reviewer judgments about DS-N1 findings. They do not change any finding or the review status.', by_rule: byCode };
}

function slim(f) {
  return { finding_id: f.finding_id, code: f.code, severity: f.severity, condition: f.condition, claim_id: f.claim_id, source_id: f.source_id, status: f.status, explanation: f.explanation, question: f.question };
}

// Evidence package: record + events + report + checksums. An independent party
// can recompute the report from the record and the events.
export function buildExport(session, { generated_at }) {
  const report = buildReport(session, { generated_at });
  const body = { schema: EXPORT_SCHEMA, record: session.input, events: session.events, report };
  return { ...body, checksums: { report_sha256: sha256(canonical(report)), package_sha256: sha256(canonical(body)) } };
}

export function serializeExport(bundle) { return JSON.stringify(bundle, null, 2) + '\n'; }

// Human-readable HTML. Every value from the record, sources, or reviewer is
// escaped; the document has no scripts and no external resources.
export function renderReportHtml(report) {
  const e = escapeHtml;
  const p = report.parts;
  const out = [];
  out.push('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">');
  out.push('<meta name="robots" content="noindex,nofollow"><title>Decision record report</title>');
  out.push('<style>body{font:15px/1.5 system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;color:#111;background:#fff}h1{font-size:1.5rem}h2{font-size:1.15rem;border-top:1px solid #999;padding-top:.75rem;margin-top:1.75rem}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:.3rem .45rem;text-align:left;vertical-align:top;font-size:.9rem}code{font-size:.85em;word-break:break-all}.crit{font-weight:700}.note{border:1px solid #333;padding:.6rem .8rem}@media print{body{margin:0}}</style></head><body>');
  out.push(`<h1>Decision record report</h1><p class="note">Generated by ${e(report.generator.candidate_id)} ${e(report.generator.version)} (rules ${e(report.generator.rule_version)}) at ${e(report.generated_at)}. Machine status: <strong>${e(report.status)}</strong>. This report is not an approval or signoff.</p>`);
  if (!p) {
    out.push(`<h2>Not reviewed</h2><ul>${(report.reasons || []).map((r) => `<li>${e(r)}</li>`).join('')}</ul>`);
  } else {
    const r1 = p['1_record_identification'];
    out.push(`<h2>1. Record identification, scope and version</h2><table><tbody>${Object.entries(r1).map(([k, v]) => `<tr><th scope="row">${e(k)}</th><td>${k.includes('digest') ? `<code>${e(v)}</code>` : e(v)}</td></tr>`).join('')}</tbody></table>`);
    out.push(`<h2>2. Evidence and source inventory</h2><table><thead><tr><th>Source</th><th>Title</th><th>Version</th><th>SHA-256</th><th>Cited by</th></tr></thead><tbody>${p['2_evidence_inventory'].map((s) => `<tr><td>${e(s.source_id)}</td><td>${e(s.title)}</td><td>${e(s.version)}</td><td><code>${e(s.digest)}</code></td><td>${e(s.cited_by.join(', ') || 'none')}</td></tr>`).join('')}</tbody></table>`);
    const c3 = p['3_chronology'];
    out.push(`<h2>3. Chronology and event roles</h2><table><thead><tr><th>Date</th><th>Role</th><th>Recorded in</th></tr></thead><tbody>${c3.source_events.map((x) => `<tr><td>${e(x.date)}</td><td>${e(x.role)}</td><td>${e(x.source_id)}</td></tr>`).join('') || '<tr><td colspan="3">No structured events supplied.</td></tr>'}</tbody></table>`);
    if (c3.claimed_events.length) out.push(`<p>Events asserted by claims: ${c3.claimed_events.map((x) => `${e(x.claim_id)}: ${e(x.role)} on ${e(x.date)}`).join('; ')}.</p>`);
    out.push('<h2>4. Claim-to-evidence trace</h2>');
    for (const c of p['4_claim_evidence_trace']) {
      out.push(`<h3>${e(c.claim_id)} (${e(c.kind)}): ${e(c.support)}</h3><p>Original: &ldquo;${e(c.original_text)}&rdquo;</p>`);
      if (c.current_text !== c.original_text) out.push(`<p>Current revision: &ldquo;${e(c.current_text)}&rdquo;</p>`);
      if (c.reasoning) out.push(`<p>Stated reasoning: ${e(c.reasoning)}</p>`);
      out.push(`<ul>${c.citations.map((a) => `<li>${e(a.source_id)}: &ldquo;${e(a.quote)}&rdquo;, quote ${e(a.quote_match)}, relevance ${e(a.relevance)}</li>`).join('') || '<li>No citations.</li>'}</ul>`);
      out.push(`<p>Sufficiency: ${e(c.sufficiency)}.</p>`);
      if (c.findings.length) out.push(`<ul>${c.findings.map((f) => `<li class="${f.severity === 'critical' ? 'crit' : ''}">${e(f.code)} (${e(f.severity)}, ${e(f.status)}): ${e(f.question)}</li>`).join('')}</ul>`);
    }
    const c5 = p['5_condition_review'];
    out.push(`<h2>5. Five-condition review</h2><p>${e(c5.mapping_status)}</p><table><thead><tr><th>Condition</th><th>Active findings</th><th>Unresolved</th><th>Resolved by a human</th></tr></thead><tbody>${Object.entries(c5.conditions).map(([k, v]) => `<tr><td>${e(k)} ${e(v.name)}</td><td>${v.active_findings}</td><td>${v.unresolved.length}</td><td>${v.resolved_by_human.length}</td></tr>`).join('')}</tbody></table>`);
    const c6 = p['6_contradictions_and_gaps'];
    out.push(`<h2>6. Contradictions and unresolved gaps</h2>${c6.unresolved.length ? `<ul>${c6.unresolved.map((f) => `<li class="${f.severity === 'critical' ? 'crit' : ''}">${e(f.code)} [${e(f.status)}]: ${e(f.explanation)}</li>`).join('')}</ul>` : '<p>No unresolved finding.</p>'}`);
    if (c6.unassessed_sentences.length) out.push(`<p>${c6.unassessed_sentences.length} sentence(s) contained no assertion marker and were not assessed.</p>`);
    const c7 = p['7_human_disposition'];
    out.push(`<h2>7. Human reviewer disposition</h2><p>Machine status: ${e(c7.machine_status)}. ${e(c7.reasons.join(' '))}</p>`);
    if (c7.machine_status_meaning) out.push(`<p>${e(c7.machine_status_meaning)}</p>`);
    out.push(`<ol>${c7.actions.map((a) => `<li>${e(a.at)} ${e(a.reviewer ? a.reviewer.name : '')}: ${e(a.type)}${a.finding_id ? ' on ' + e(a.finding_id) : ''}${a.claim_id ? ' on ' + e(a.claim_id) : ''}${a.rationale ? ': ' + e(a.rationale) : ''}${a.limitation ? ': ' + e(a.limitation) : ''}${a.request ? ': ' + e(a.request) : ''}${a.reason ? ': ' + e(a.reason) : ''}${a.note ? ': ' + e(a.note) : ''}${a.usefulness ? ': finding marked ' + e(a.usefulness) : ''}${a.type === 'finding_feedback' && a.reason ? ' (' + e(a.reason) + ')' : ''}</li>`).join('') || '<li>No reviewer actions recorded.</li>'}</ol>`);
    if (c7.overrides_of_critical_findings.length) out.push(`<p class="crit">${c7.overrides_of_critical_findings.length} critical finding(s) were overridden by a reviewer; their rationales appear above.</p>`);
    const fd = c7.final_disposition;
    out.push(`<p>Final disposition: ${typeof fd === 'string' ? e(fd) : `${e(fd.disposition)} by ${e(fd.reviewer.name)} at ${e(fd.at)}: ${e(fd.note)}${fd.stale ? ' (STALE: actions were recorded after this disposition)' : ''}`}</p>`);
    const c8 = p['8_export_provenance'];
    out.push(`<h2>8. Export provenance and limitations</h2><p>Events: ${c8.event_count}; chain head <code>${e(c8.event_chain_head)}</code>; chain verified: ${c8.chain_verified}. ${e(c8.validation_status)}.</p>`);
  }
  out.push(`<ul>${report.limitations.map((l) => `<li>${e(l)}</li>`).join('')}</ul></body></html>\n`);
  return out.join('\n');
}
