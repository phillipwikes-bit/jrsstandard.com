// Correct + Connect. A review session is an append-only, hash-chained event log
// over an immutable record. All state is DERIVED by replaying the log, so the
// review can be reconstructed by anyone holding the record and the events.
//
// DS-N1 never synthesises a reviewer, a rationale, an approval or a signoff.
// Every human action must carry the identity and words the human supplied.
import { CANDIDATE, EVENT_SCHEMA, STATUS, LIMITS } from './identity.mjs';
import { validateRecord } from './record.mjs';
import { assessClaim, assessRecordLevel } from './assess.mjs';
import { sha256, canonical, nfc } from './text.mjs';

export class ReviewActionError extends Error {
  constructor(code, detail) { super(`${code}: ${detail}`); this.code = code; this.detail = detail; }
}

const ACTIONS = ['attach_citation', 'revise_claim', 'add_reasoning', 'request_evidence', 'record_limitation',
  'escalate', 'override', 'leave_pending', 'final_disposition'];
const FINDING_ACTIONS = ['request_evidence', 'record_limitation', 'escalate', 'override', 'leave_pending'];
const MIN_RATIONALE = 20;
const ISO_TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

function hashEvent(ev) { const { hash, ...rest } = ev; void hash; return sha256(canonical(rest)); }

export function openReview(input, { at }) {
  if (!ISO_TS.test(at || '')) throw new ReviewActionError('INVALID_TIMESTAMP', 'at must be an ISO-8601 UTC timestamp supplied by the caller');
  const v = validateRecord(input);
  const genesis = {
    schema: EVENT_SCHEMA, seq: 0, type: 'open', at,
    record_digest: v.record ? v.record.record_digest : null,
    candidate: `${CANDIDATE.candidate_id}@${CANDIDATE.version}`, rule_version: CANDIDATE.rule_version,
    prev_hash: null,
  };
  genesis.hash = hashEvent(genesis);
  return { input, events: [genesis] };
}

export function verifyChain(events, recordDigest) {
  const problems = [];
  if (!Array.isArray(events) || !events.length) return { ok: false, problems: [{ code: 'NO_EVENTS', at: null }] };
  if (events.length > LIMITS.events_max) problems.push({ code: 'TOO_MANY_EVENTS', at: null });
  events.forEach((ev, i) => {
    if (!ev || typeof ev !== 'object') { problems.push({ code: 'MALFORMED_EVENT', at: i }); return; }
    if (ev.seq !== i) problems.push({ code: 'SEQUENCE_BREAK', at: i });
    if (i === 0) {
      if (ev.type !== 'open' || ev.prev_hash !== null) problems.push({ code: 'BAD_GENESIS', at: 0 });
      if (ev.record_digest !== recordDigest) problems.push({ code: 'RECORD_DIGEST_MISMATCH', at: 0 });
    } else if (ev.prev_hash !== events[i - 1].hash) problems.push({ code: 'CHAIN_BREAK', at: i });
    let h;
    try { h = hashEvent(ev); } catch { h = null; }
    if (ev.hash !== h) problems.push({ code: 'HASH_MISMATCH', at: i });
  });
  return { ok: problems.length === 0, problems };
}

function claimRevisions(record, events) {
  // Returns Map claim_id -> array of revisions (index 0 = original).
  const revs = new Map(record.claims.map((c) => [c.claim_id, [{ revision: 0, text: c.quote, citations: c.citations, reasoning: c.reasoning, event_seq: 0, mode: 'original' }]]));
  for (const ev of events) {
    if (!['attach_citation', 'revise_claim', 'add_reasoning'].includes(ev.type)) continue;
    const list = revs.get(ev.claim_id);
    if (!list) continue;
    const prev = list[list.length - 1];
    const next = { revision: list.length, text: prev.text, citations: prev.citations, reasoning: prev.reasoning, event_seq: ev.seq, mode: ev.type };
    if (ev.type === 'attach_citation') next.citations = [...prev.citations, { source_id: ev.source_id, quote: ev.quote }];
    if (ev.type === 'add_reasoning') next.reasoning = ev.reasoning;
    if (ev.type === 'revise_claim') {
      next.text = ev.text; next.mode = ev.mode === 'qualify' ? 'qualify' : 'revise';
      if (ev.citations) next.citations = ev.citations;
      if (ev.reasoning !== undefined) next.reasoning = ev.reasoning;
    }
    list.push(next);
  }
  return revs;
}

function assessAll(record, revs) {
  const claims = [];
  const findings = [];
  const supported = new Set();
  // Facts, chronology and authority first, then conclusions, so a conclusion's
  // reasoning can refer to claims that are themselves supported.
  const order = [...record.claims].sort((a, b) => (a.kind === 'conclusion') - (b.kind === 'conclusion'));
  for (const c of order) {
    const list = revs.get(c.claim_id);
    const cur = list[list.length - 1];
    const r = assessClaim(record, c, cur.revision === 0 ? null : cur, supported);
    if (r.summary.support === 'SUPPORTED_AS_CITED') supported.add(c.claim_id);
    r.summary.revisions = list.map((x) => ({ revision: x.revision, text: x.text, mode: x.mode, event_seq: x.event_seq }));
    claims.push(r.summary);
    findings.push(...r.findings);
  }
  claims.sort((a, b) => record.claims.findIndex((c) => c.claim_id === a.claim_id) - record.claims.findIndex((c) => c.claim_id === b.claim_id));
  const rl = assessRecordLevel(record, claims.map((c) => c.record_span));
  findings.push(...rl.findings);
  return { claims, findings, unassessed: rl.unassessed_sentences };
}

// Derive the complete review state from record + events.
export function deriveState(session) {
  const v = validateRecord(session.input);
  if (v.status) return { status: v.status, reasons: v.errors.map((e) => `${e.code} at ${e.path}: ${e.detail}`), validation_errors: v.errors, claims: [], findings: [], history: [], events: session.events };
  const record = v.record;
  const chain = verifyChain(session.events, record.record_digest);
  if (!chain.ok) {
    return { status: STATUS.ERROR, reasons: chain.problems.map((p) => `HISTORY_CORRUPTED: ${p.code} at event ${p.at}`), chain, record, claims: [], findings: [], history: [], events: session.events };
  }
  const revs = claimRevisions(record, session.events);

  // Replay assessments after each revision event so superseded findings are
  // preserved in history rather than disappearing.
  const everSeen = new Map();
  const checkpoints = [0, ...session.events.filter((e) => ['attach_citation', 'revise_claim', 'add_reasoning'].includes(e.type)).map((e) => e.seq)];
  for (const seq of checkpoints) {
    const partial = claimRevisions(record, session.events.filter((e) => e.seq <= seq));
    for (const f of assessAll(record, partial).findings) if (!everSeen.has(f.finding_id)) everSeen.set(f.finding_id, { ...f, first_seen_event: seq });
  }
  const current = assessAll(record, revs);
  const activeIds = new Set(current.findings.map((f) => f.finding_id));

  const dispositions = new Map();
  for (const ev of session.events) {
    if (!FINDING_ACTIONS.includes(ev.type)) continue;
    if (!dispositions.has(ev.finding_id)) dispositions.set(ev.finding_id, []);
    dispositions.get(ev.finding_id).push(ev);
  }
  const statusOf = (f) => {
    if (!activeIds.has(f.finding_id)) return 'SUPERSEDED';
    const d = dispositions.get(f.finding_id);
    if (!d) return 'OPEN';
    const last = d[d.length - 1];
    return { request_evidence: 'AWAITING_EVIDENCE', escalate: 'ESCALATED', override: 'OVERRIDDEN', record_limitation: 'LIMITATION_RECORDED', leave_pending: 'OPEN' }[last.type];
  };
  const findings = [...everSeen.values()].map((f) => {
    const cur = current.findings.find((x) => x.finding_id === f.finding_id) || f;
    const d = dispositions.get(f.finding_id) || [];
    return { ...cur, first_seen_event: f.first_seen_event, status: statusOf(f), actions: d.map(publicAction) };
  });

  const active = findings.filter((f) => f.status !== 'SUPERSEDED');
  const unresolved = active.filter((f) => ['OPEN', 'AWAITING_EVIDENCE', 'ESCALATED'].includes(f.status));
  const reasons = [];
  let status;
  if (!record.claims.length) { status = STATUS.INCOMPLETE; reasons.push('No claims were identified for review; DS-N1 cannot assess an unmapped record.'); }
  else if (active.some((f) => f.code === 'CLAIM_NOT_IN_RECORD')) { status = STATUS.INCOMPLETE; reasons.push('At least one claim could not be located in the record text.'); }
  else if (unresolved.some((f) => f.severity === 'critical') || unresolved.some((f) => f.status !== 'OPEN')) {
    status = STATUS.HOLD;
    const crit = unresolved.filter((f) => f.severity === 'critical').length;
    const waiting = unresolved.filter((f) => f.status !== 'OPEN').length;
    if (crit) reasons.push(`${crit} unresolved critical finding(s).`);
    if (waiting) reasons.push(`${waiting} finding(s) awaiting evidence or escalated.`);
  } else if (unresolved.length) { status = STATUS.REVIEW; reasons.push(`${unresolved.length} unresolved finding(s) require a reviewer decision.`); }
  else { status = STATUS.READY; reasons.push('No unresolved DS-N1 finding remains. A human must still finalise; this is not approval.'); }

  const finals = session.events.filter((e) => e.type === 'final_disposition');
  const lastFinal = finals.length ? finals[finals.length - 1] : null;
  const final = lastFinal ? { ...publicAction(lastFinal), stale: session.events.some((e) => e.seq > lastFinal.seq) } : null;
  return {
    status, reasons, record, chain, claims: current.claims, findings,
    unassessed_sentences: current.unassessed,
    final_disposition: final,
    overrides_of_critical: active.filter((f) => f.status === 'OVERRIDDEN' && f.severity === 'critical').map((f) => f.finding_id),
    events: session.events,
  };
}

function publicAction(ev) {
  const { schema, prev_hash, hash, ...rest } = ev;
  void schema; void prev_hash;
  return { ...rest, event_hash: hash };
}

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

export function applyAction(session, action) {
  if (!action || !ACTIONS.includes(action.type)) throw new ReviewActionError('UNKNOWN_ACTION', `type must be one of ${ACTIONS.join(', ')}`);
  if (!ISO_TS.test(action.at || '')) throw new ReviewActionError('INVALID_TIMESTAMP', 'at must be an ISO-8601 UTC timestamp');
  const r = action.reviewer;
  if (!r || !nonEmpty(r.reviewer_id) || !nonEmpty(r.name)) throw new ReviewActionError('REVIEWER_REQUIRED', 'every action must identify the human reviewer (reviewer_id and name)');
  const state = deriveState(session);
  if (state.status === STATUS.ERROR || state.status === STATUS.REFUSED) throw new ReviewActionError('SESSION_NOT_ACTIONABLE', `session status is ${state.status}`);
  const prev = session.events[session.events.length - 1];
  if (action.at < prev.at) throw new ReviewActionError('TIMESTAMP_REGRESSION', 'action timestamp precedes the previous event');
  const ev = { schema: EVENT_SCHEMA, seq: session.events.length, type: action.type, at: action.at, reviewer: { reviewer_id: r.reviewer_id.trim(), name: nfc(r.name.trim()) } };
  const claim = (id) => {
    if (!state.record.claims.some((c) => c.claim_id === id)) throw new ReviewActionError('UNKNOWN_CLAIM', `no claim ${id}`);
    return id;
  };
  const activeFinding = (id) => {
    const f = state.findings.find((x) => x.finding_id === id);
    if (!f) throw new ReviewActionError('UNKNOWN_FINDING', `no finding ${id}`);
    if (f.status === 'SUPERSEDED') throw new ReviewActionError('FINDING_SUPERSEDED', `${id} no longer applies to the current claim text`);
    return f;
  };
  switch (action.type) {
    case 'attach_citation':
      ev.claim_id = claim(action.claim_id);
      if (!nonEmpty(action.source_id) || !nonEmpty(action.quote)) throw new ReviewActionError('INVALID_CITATION', 'source_id and quote are required');
      ev.source_id = action.source_id; ev.quote = nfc(action.quote);
      break;
    case 'revise_claim':
      ev.claim_id = claim(action.claim_id);
      if (!nonEmpty(action.text)) throw new ReviewActionError('INVALID_REVISION', 'revised text is required');
      ev.text = nfc(action.text); ev.mode = action.mode === 'qualify' ? 'qualify' : 'revise';
      if (action.citations !== undefined) {
        if (!Array.isArray(action.citations) || !action.citations.every((c) => c && nonEmpty(c.source_id) && nonEmpty(c.quote))) throw new ReviewActionError('INVALID_CITATION', 'citations must have source_id and quote');
        ev.citations = action.citations.map((c) => ({ source_id: c.source_id, quote: nfc(c.quote) }));
      }
      if (action.reasoning !== undefined) ev.reasoning = nfc(String(action.reasoning));
      break;
    case 'add_reasoning':
      ev.claim_id = claim(action.claim_id);
      if (!nonEmpty(action.reasoning)) throw new ReviewActionError('INVALID_REASONING', 'reasoning text is required');
      ev.reasoning = nfc(action.reasoning);
      break;
    case 'request_evidence':
      ev.finding_id = activeFinding(action.finding_id).finding_id;
      if (!nonEmpty(action.request)) throw new ReviewActionError('INVALID_REQUEST', 'describe the evidence requested');
      ev.request = nfc(action.request);
      break;
    case 'record_limitation': {
      const f = activeFinding(action.finding_id);
      if (f.severity === 'critical') throw new ReviewActionError('ACTION_NOT_PERMITTED', 'a critical finding cannot be closed as a limitation; correct it, request evidence, escalate, or record a reasoned override');
      if (!nonEmpty(action.limitation)) throw new ReviewActionError('INVALID_LIMITATION', 'state the limitation');
      ev.finding_id = f.finding_id; ev.limitation = nfc(action.limitation);
      break;
    }
    case 'escalate':
      ev.finding_id = activeFinding(action.finding_id).finding_id;
      if (!nonEmpty(action.to) || !nonEmpty(action.reason)) throw new ReviewActionError('INVALID_ESCALATION', 'escalation needs a recipient role and a reason');
      ev.to = nfc(action.to); ev.reason = nfc(action.reason);
      break;
    case 'override': {
      ev.finding_id = activeFinding(action.finding_id).finding_id;
      const rat = typeof action.rationale === 'string' ? action.rationale.trim() : '';
      if (rat.replace(/\s+/g, ' ').length < MIN_RATIONALE) throw new ReviewActionError('RATIONALE_REQUIRED', `a reasoned override needs the reviewer's own rationale (at least ${MIN_RATIONALE} characters)`);
      ev.rationale = nfc(action.rationale);
      break;
    }
    case 'leave_pending':
      ev.finding_id = activeFinding(action.finding_id).finding_id;
      if (action.note !== undefined) ev.note = nfc(String(action.note));
      break;
    case 'final_disposition':
      if (!['accepted_for_finalization', 'returned_to_author'].includes(action.disposition)) throw new ReviewActionError('INVALID_DISPOSITION', 'disposition must be accepted_for_finalization or returned_to_author');
      if (action.disposition === 'accepted_for_finalization' && state.status !== STATUS.READY) throw new ReviewActionError('NOT_READY', `cannot accept for finalisation while status is ${state.status}`);
      if (!nonEmpty(action.note)) throw new ReviewActionError('NOTE_REQUIRED', 'a final disposition needs the reviewer\'s note');
      ev.disposition = action.disposition; ev.note = nfc(action.note);
      break;
  }
  ev.prev_hash = prev.hash;
  ev.hash = hashEvent(ev);
  return { input: session.input, events: [...session.events, ev] };
}

export function resumeReview(input, events) {
  return { input, events: Array.isArray(events) ? events.map((e) => ({ ...e })) : [] };
}
