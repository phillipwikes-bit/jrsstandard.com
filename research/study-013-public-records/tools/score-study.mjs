#!/usr/bin/env node
// Study 013 scorer (PROTOCOL.md "Outcomes"). Deterministic: compares routes with KEY.json.
// Usage: node tools/score-study.mjs runs/<name>
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function wilson(k, n, z = 1.96) {
  if (!n) return [null, null];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Number(((c - h) / d).toFixed(3)), Number(((c + h) / d).toFixed(3))];
}

export function modal(routes) {
  const ok = routes.filter(Boolean);
  if (!ok.length) return null;
  const n = {}; ok.forEach((r) => { n[r] = (n[r] || 0) + 1; });
  const top = Math.max(...Object.values(n));
  const winners = Object.keys(n).filter((r) => n[r] === top);
  return winners.length === 1 ? winners[0] : 'review'; // a tie counts as review (PROTOCOL)
}

export function score(dir) {
  const key = JSON.parse(readFileSync(path.join(ROOT, 'KEY.json'), 'utf8')).key;
  const lab = Object.fromEntries(key.map((k) => [k.case, k]));
  const words = key.map((k) => k.words).sort((a, b) => a - b);
  const median = words[Math.floor(words.length / 2)];
  const rows = readFileSync(path.join(dir, 'results.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const by = {};
  for (const r of rows) ((by[r.arm] ||= {})[r.case] ||= []).push(r);
  const out = { dir, arms: {}, paired: {} };
  const caseRoute = {};
  for (const [arm, cases] of Object.entries(by)) {
    const per = {}, outcomes = {};
    for (const [c, rs] of Object.entries(cases)) {
      rs.forEach((r) => { outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1; });
      const routes = rs.map((r) => (r.outcome === 'ok' ? r.route : null));
      per[c] = { route: modal(routes), stable: routes.every((x) => x && x === routes[0]), runs: routes };
    }
    caseRoute[arm] = per;
    const m = (filter, pos) => {
      const g = Object.keys(per).filter((c) => filter(lab[c]) && lab[c].label === 'GAP' && per[c].route);
      const p = Object.keys(per).filter((c) => filter(lab[c]) && lab[c].label === 'PASS' && per[c].route);
      const tp = g.filter((c) => pos(per[c].route)).length, tn = p.filter((c) => !pos(per[c].route)).length;
      return { sensitivity: [tp, g.length, wilson(tp, g.length)], specificity: [tn, p.length, wilson(tn, p.length)] };
    };
    const flagged = (r) => r === 'gap' || r === 'review', strict = (r) => r === 'gap';
    const all = () => true;
    out.arms[arm] = {
      calls: rows.filter((r) => r.arm === arm).length,
      usd: Number(rows.filter((r) => r.arm === arm).reduce((a, r) => a + (r.usd || 0), 0).toFixed(4)),
      outcomes,
      primary_flag: m(all, flagged),
      secondary_strict: m(all, strict),
      stability: [Object.values(per).filter((x) => x.stable).length, Object.keys(per).length],
      unscored_cases: Object.keys(per).filter((c) => !per[c].route),
      bands: {
        short_text: m((k) => k.words < median, flagged), long_text: m((k) => k.words >= median, flagged),
        posted_before_2023: m((k) => k.posted < '2023', flagged), posted_2023_on: m((k) => k.posted >= '2023', flagged),
      },
      route_counts: Object.values(per).reduce((a, x) => { a[x.route] = (a[x.route] || 0) + 1; return a; }, {}),
    };
  }
  for (const [x, y] of [['A', 'B'], ['B', 'C'], ['C', 'D'], ['C0', 'C']]) {
    if (!caseRoute[x] || !caseRoute[y]) continue;
    const cs = Object.keys(caseRoute[x]).filter((c) => caseRoute[y][c]);
    const f = (r) => r === 'gap' || r === 'review';
    const t = { both_right: 0, only_first_right: 0, only_second_right: 0, both_wrong: 0 };
    for (const c of cs) {
      const want = lab[c].label === 'GAP';
      const a = f(caseRoute[x][c].route) === want, b = f(caseRoute[y][c].route) === want;
      t[a && b ? 'both_right' : a ? 'only_first_right' : b ? 'only_second_right' : 'both_wrong']++;
    }
    out.paired[`${x}_vs_${y}`] = t;
  }
  out.median_words = median;
  out.case_routes = caseRoute;
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const dir = path.resolve(ROOT, process.argv[2]);
  const s = score(dir);
  writeFileSync(path.join(dir, 'SCORES.json'), JSON.stringify(s, null, 1));
  for (const [a, v] of Object.entries(s.arms)) console.log(a, 'sens', v.primary_flag.sensitivity.slice(0, 2).join('/'), 'spec', v.primary_flag.specificity.slice(0, 2).join('/'), 'stable', v.stability.join('/'), 'usd', v.usd, JSON.stringify(v.outcomes));
  console.log(JSON.stringify(s.paired));
}
