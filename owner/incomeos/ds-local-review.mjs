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
export function runLocalReview(program, input, humanActions, at) {
  return runSyntheticReviewSequence(program, input, at, humanActions, at);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , inputPath, programPath, actionsPath, exportPath] = process.argv;
  if (!inputPath || !programPath) {
    console.error('Usage: node owner/incomeos/ds-local-review.mjs fictional-input.json ds-program.json [human-actions.json] [export-path.json]');
    process.exitCode = 2;
  } else {
    try {
      const input = loadJson(inputPath);
      if (input?.data_classification !== 'constructed_fictional') throw new TypeError('Fictional records only');
      const program = loadJson(programPath);
      const actions = actionsPath ? loadJson(actionsPath) : [];
      const result = runLocalReview(program, input, actions, new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
      if (exportPath && result.accepted) {
        const bundle = buildExport(result.session, { generated_at: result.report.header.generated_at });
        const verdict = verifyExport(bundle);
        if (verdict.verdict !== VERDICT.CONSISTENT) throw new Error('Internal export consistency verification failed');
        // Exclusive create prevents accidental overwrite. File permissions are
        // restrictive, but local filesystem security remains operator-managed.
        writeFileSync(resolve(exportPath), JSON.stringify(bundle, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      }
      // Emit only a summary, never the source record or owner programme.
      console.log(JSON.stringify({accepted:result.accepted, scope:result.scope ?? null, status:result.snapshot?.reviewStatus ?? result.status ?? null, findingCount:result.snapshot?.findings?.length ?? 0, disposition:result.snapshot?.finalDisposition ?? null, eventCount:result.session?.events?.length ?? 0, authenticity:result.authenticity ?? null},null,2));
    } catch (err) {
      console.error('Local synthetic review refused:', err.message);
      process.exitCode = 1;
    }
  }
}
