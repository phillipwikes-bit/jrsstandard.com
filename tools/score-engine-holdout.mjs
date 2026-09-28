#!/usr/bin/env node
// Scores an externally prepared holdout. This does not create reference truth,
// establish independence, set acceptance criteria, or certify validation.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const keys = ['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity',
  'accountability_support', 'temporal_reconstructability'];
const labels = ['pass', 'review', 'gap'];
const routes = ['ready', 'review_required', 'gap_identified'];
const input = process.argv[2];
if (!input || process.argv.length !== 3) {
  console.error('Usage: node tools/score-engine-holdout.mjs holdout.json');
  process.exit(2);
}
const source = JSON.parse(await readFile(resolve(input), 'utf8'));
if (typeof source.protocol_id !== 'string' || !source.protocol_id
  || typeof source.locked_at !== 'string' || !Number.isFinite(Date.parse(source.locked_at))
  || !Array.isArray(source.cases) || !source.cases.length) {
  throw new Error('Holdout needs protocol_id, locked_at and a nonempty cases array');
}
const ids = new Set();
const counts = Object.fromEntries([...keys, 'routing'].map((k) => [k, {}]));
for (const c of source.cases) {
  if (!c || typeof c.id !== 'string' || !c.id || ids.has(c.id) || c.split !== 'holdout') {
    throw new Error('Duplicate, missing or non-holdout case ID');
  }
  ids.add(c.id);
  for (const k of keys) {
    const reference = c.reference?.conditions?.[k];
    const predicted = c.prediction?.conditions?.[k];
    if (!labels.includes(reference) || !labels.includes(predicted)) {
      throw new Error(`Missing or invalid status for ${c.id}/${k}`);
    }
    add(counts[k], reference, predicted);
  }
  const r = c.reference?.determination;
  const p = c.prediction?.determination;
  if (!routes.includes(r) || !routes.includes(p)) throw new Error(`Missing or invalid route for ${c.id}`);
  const derive = (conditions) => keys.some((k) => conditions[k] === 'gap') ? 'gap_identified'
    : keys.some((k) => conditions[k] === 'review') ? 'review_required' : 'ready';
  if (r !== derive(c.reference.conditions) || p !== derive(c.prediction.conditions)) {
    throw new Error(`Route conflicts with conditions for ${c.id}`);
  }
  add(counts.routing, r, p);
}

function add(matrix, reference, predicted) {
  matrix[reference] ||= {};
  matrix[reference][predicted] = (matrix[reference][predicted] || 0) + 1;
}
function wilson(successes, total) {
  if (!total) return null;
  const z = 1.95996398454, p = successes / total, z2 = z * z;
  const center = (p + z2 / (2 * total)) / (1 + z2 / total);
  const half = z * Math.sqrt(p * (1 - p) / total + z2 / (4 * total * total)) / (1 + z2 / total);
  return [Math.max(0, center - half), Math.min(1, center + half)];
}
function measures(matrix, vocabulary) {
  const perLabel = {};
  for (const label of vocabulary) {
    let tp = 0, fn = 0, fp = 0, tn = 0;
    for (const actual of vocabulary) for (const predicted of vocabulary) {
      const count = matrix[actual]?.[predicted] || 0;
      if (actual === label && predicted === label) tp += count;
      else if (actual === label) fn += count;
      else if (predicted === label) fp += count;
      else tn += count;
    }
    const ratio = (num, den) => den ? num / den : null;
    perLabel[label] = {
      tp, fn, fp, tn,
      sensitivity: ratio(tp, tp + fn), sensitivity_ci95: wilson(tp, tp + fn),
      specificity: ratio(tn, tn + fp), specificity_ci95: wilson(tn, tn + fp),
      precision: ratio(tp, tp + fp), precision_ci95: wilson(tp, tp + fp),
      false_negative_rate: ratio(fn, tp + fn), false_positive_rate: ratio(fp, tn + fp),
    };
  }
  return { confusion_matrix: matrix, per_label: perLabel };
}
const results = Object.fromEntries(keys.map((k) => [k, measures(counts[k], labels)]));
results.routing = measures(counts.routing, routes);
console.log(JSON.stringify({
  protocol_id: source.protocol_id,
  locked_at: source.locked_at,
  cases: ids.size,
  analysis: 'Exact three-class confusion matrices and one-versus-rest rates; Wilson 95% marginal intervals.',
  results,
  limitations: [
    'Input labels and independence were supplied by the caller, not verified by this script.',
    'Intervals ignore clustering, selection bias and multiplicity.',
    'No unsupported-finding, note fidelity, repeatability, workflow, subgroup or robustness assessment.',
    'No validation or pass/fail decision is made without a dated protocol and independent review.',
  ],
}, null, 2));
