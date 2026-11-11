// Local engineering entry point only. Not imported by IncomeOS web pages.
// Usage: node owner/incomeos/ds-local-review.mjs fictional-input.json
// Requires the exact existing DS-N1 package schema and the authoritative
// IncomeOS dsProgram; never supply real records or owner financial data.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildExport, verifyExport, VERDICT } from '../../lib/ds-n1/index.mjs';
import './ds-program.js';
import { runSyntheticReviewSequence } from './ds-runtime-bridge.mjs';

function loadJson(path) { return JSON.parse(readFileSync(resolve(path), 'utf8')); }
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
function instant(value, label) {
  const ms = typeof value === 'string' && ISO_UTC.test(value) ? Date.parse(value) : NaN;
  if (!Number.isFinite(ms)) throw new TypeError(label + ' must be an ISO-8601 UTC timestamp');
  return ms;
}

// A human-actions file is either an array of DS-N1 actions, reviewed as of
// this run, or { "opened_at": "...Z", "actions": [...] } when replaying
// actions a human reviewer already recorded. opened_at is the operator's own
// statement of when that review was opened. It is never derived from the
// actions, and nothing here creates, reorders or re-dates a reviewer action.
// No timestamp may be later than this run: the export cannot predate its events.
export function readHumanActions(raw, now) {
  const nowMs = instant(now, 'Run time');
  let openedAt = now;
  let actions = raw;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const extra = Object.keys(raw).filter(k => k !== 'opened_at' && k !== 'actions');
    if (extra.length) throw new TypeError('Unsupported human-actions field: ' + extra[0]);
    if (instant(raw.opened_at, 'opened_at') > nowMs) throw new RangeError('opened_at is later than this run');
    openedAt = raw.opened_at;
    actions = raw.actions;
  }
  if (!Array.isArray(actions)) throw new TypeError('Human actions must be an array');
  for (const action of actions) {
    if (action && typeof action === 'object' && typeof action.at === 'string' &&
        ISO_UTC.test(action.at) && Date.parse(action.at) > nowMs) {
      throw new RangeError('A human action is dated later than this run');
    }
  }
  return { openedAt, actions };
}

export function runLocalReview(program, input, humanActions, at, generatedAt = at) {
  return runSyntheticReviewSequence(program, input, at, humanActions, generatedAt);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , inputPath, programPath, actionsPath, exportPath] = process.argv;
  if (!inputPath || !programPath) {
    console.error('Usage: node owner/incomeos/ds-local-review.mjs fictional-input.json ds-program.json [human-actions.json] [export-path.json]');
    console.error('human-actions.json: [actions] or {"opened_at":"...Z","actions":[...]} to replay recorded reviewer actions');
    process.exitCode = 2;
  } else {
    try {
      const input = loadJson(inputPath);
      if (input?.data_classification !== 'constructed_fictional') throw new TypeError('Fictional records only');
      const program = loadJson(programPath);
      const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const { openedAt, actions } = readHumanActions(actionsPath ? loadJson(actionsPath) : [], now);
      const result = runLocalReview(program, input, actions, openedAt, now);
      if (exportPath && result.accepted) {
        const bundle = buildExport(result.session, { generated_at: now });
        const verdict = verifyExport(bundle);
        if (verdict.verdict !== VERDICT.CONSISTENT) throw new Error('Internal export consistency verification failed');
        // Exclusive create prevents accidental overwrite. File permissions are
        // restrictive, but local filesystem security remains operator-managed.
        writeFileSync(resolve(exportPath), JSON.stringify(bundle, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      }
      // Emit only a summary, never the source record or owner programme. The
      // reviewer's identity and note stay in the controlled export, not on stdout.
      console.log(JSON.stringify({accepted:result.accepted, scope:result.scope ?? null, status:result.snapshot?.reviewStatus ?? result.status ?? null, findingCount:result.snapshot?.findings?.length ?? 0, disposition:result.snapshot?.finalDisposition?.disposition ?? null, eventCount:result.session?.events?.length ?? 0, authenticity:result.authenticity ?? null},null,2));
    } catch (err) {
      console.error('Local synthetic review refused:', err.message);
      process.exitCode = 1;
    }
  }
}
