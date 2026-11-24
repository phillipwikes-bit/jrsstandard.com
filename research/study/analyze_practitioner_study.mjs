#!/usr/bin/env node
// Practitioner study analysis (2026-11-24). Turns the survey rows into the
// study's numbers: counts, percentages and 95% Wilson intervals, always with
// the denominator. Code only; the data file is private and never committed.
//
// Input: a JSON array of rows exported without names or emails:
//   select id, created_at, source, (email <> '') as has_email,
//          message::jsonb - 'answer' as meta, length(message::jsonb->>'answer') as answer_len
//   from pilot_contacts where source in ('practitioner-review','practitioner-review-tap')
//   order by created_at;
// Optional second file: coded reliance for early answers given before the page
// asked question 1 (2026-11-21): { "<row id>": "Yes" | "Not without more" | "No" },
// coded from the written answer by the owner or a second coder, never guessed.
//
// Usage: node research/study/analyze_practitioner_study.mjs rows.json [coded.json] [--record AR-82]
import { readFileSync } from 'node:fs';

export function wilson(k, n, z = 1.96) {
  if (!n) return null;
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.round(((c - h) / d) * 1000) / 10, Math.round(((c + h) / d) * 1000) / 10];
}
const rate = (k, n) => ({ k, n, pct: n ? Math.round((k / n) * 1000) / 10 : null, wilson95_pct: wilson(k, n) });
const RELY = ['Yes', 'Not without more', 'No'];

export function analyze(rows, { coded = {}, record = null } = {}) {
  const meta = (r) => (typeof r.meta === 'string' ? JSON.parse(r.meta) : r.meta) || {};
  const mine = rows.filter((r) => !record || meta(r).record_id === record);
  const completes = mine.filter((r) => r.source === 'practitioner-review');
  const taps = mine.filter((r) => r.source === 'practitioner-review-tap');
  const completedRids = new Set(completes.map((r) => meta(r).rid).filter(Boolean));

  // One person per visit id; a person who changed their tap counts once, with their last tap.
  const lastTap = new Map();
  for (const t of [...taps].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))) lastTap.set(meta(t).rid, t);

  const people = [];
  for (const r of completes) {
    const m = meta(r);
    const rely = RELY.includes(m.rely) ? m.rely : (RELY.includes(coded[r.id]) ? coded[r.id] : null);
    people.push({ group: 'completed', rely, rely_basis: m.rely ? 'tapped' : (rely ? 'coded from written answer' : 'not asked'),
      country: m.country || '', us: m.country === 'US', role: m.role || '', years: m.years || '',
      commercial: m.commercial_contact === true, channel: m.channel || 'page', want_copy: m.want_copy === true,
      changed_tap: taps.filter((t) => meta(t).rid && meta(t).rid === m.rid).map((t) => meta(t).rely).filter((v, i, a) => a.indexOf(v) === i).length > 1 });
  }
  for (const [rid, t] of lastTap) {
    if (completedRids.has(rid)) continue;
    const m = meta(t);
    people.push({ group: 'question 1 only', rely: m.rely, rely_basis: 'tapped', country: m.country || '', us: m.country === 'US',
      role: '', years: '', commercial: false, channel: 'page', want_copy: false,
      changed_tap: taps.filter((x) => meta(x).rid === rid).map((x) => meta(x).rely).filter((v, i, a) => a.indexOf(v) === i).length > 1 });
  }

  const reliance = (ps) => {
    const answered = ps.filter((p) => p.rely);
    const notRely = answered.filter((p) => p.rely !== 'Yes').length;
    return {
      answered: answered.length, not_answered: ps.length - answered.length,
      yes: answered.filter((p) => p.rely === 'Yes').length,
      not_without_more: answered.filter((p) => p.rely === 'Not without more').length,
      no: answered.filter((p) => p.rely === 'No').length,
      would_not_rely_as_it_stands: rate(notRely, answered.length),
    };
  };
  const completed = people.filter((p) => p.group === 'completed');
  const countries = [...new Set(people.map((p) => p.country).filter(Boolean))].sort();
  const tally = (ps, f) => Object.fromEntries([...new Set(ps.map(f))].sort().map((v) => [v || '(not given)', ps.filter((p) => f(p) === v).length]));
  return {
    record: record || 'all',
    people: people.length,
    completed: completed.length,
    question_1_only: people.length - completed.length,
    countries: { n: countries.length, list: countries },
    completed_by_channel: tally(completed, (p) => p.channel),
    completed_wanting_free_copy: completed.filter((p) => p.want_copy).length,
    changed_their_tap: people.filter((p) => p.changed_tap).length,
    reliance: {
      completed: reliance(completed),
      completed_excluding_commercial_contacts: reliance(completed.filter((p) => !p.commercial)),
      everyone_who_answered_question_1: reliance(people),
      us: reliance(people.filter((p) => p.us)),
      outside_us: reliance(people.filter((p) => !p.us && p.country)),
    },
    completed_by_role: tally(completed, (p) => p.role),
    completed_by_years: tally(completed, (p) => p.years),
    reliance_basis: tally(people, (p) => p.rely_basis),
    reading_note: 'Would not rely = "Not without more" or "No". The tool\'s answer for AR-82, frozen before any review, was READY (rely). Percentages are of those who answered question 1; the interval is a 95% Wilson interval. Volunteers recruited from professional networks, not a random sample.',
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const args = process.argv.slice(2);
  const ri = args.indexOf('--record');
  const record = ri >= 0 ? args.splice(ri, 2)[1] : null;
  const rows = JSON.parse(readFileSync(args[0], 'utf8'));
  const coded = args[1] ? JSON.parse(readFileSync(args[1], 'utf8')) : {};
  console.log(JSON.stringify(analyze(rows, { coded, record }), null, 2));
}
