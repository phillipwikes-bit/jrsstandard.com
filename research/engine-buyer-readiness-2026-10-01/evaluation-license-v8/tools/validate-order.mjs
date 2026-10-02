// Refuses to treat an order as issuable, activatable or sold while any required
// transaction input is missing or a placeholder. It checks completeness only; it
// cannot confirm that a signature or a payment is genuine.
//
// Usage: node validate-order.mjs <order.json>    exit 0 = issuable, 1 = not
//        node validate-order.mjs --selftest

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ISSUE_ONLY = new Set(['activation_date', 'signed_agreement_reference', 'payment_received_reference']);

export function validateOrder(order, stage = 'issue') {
  const missing = [];
  for (const [k, v] of Object.entries(order.required_inputs || {})) {
    if (stage === 'issue' && ISSUE_ONLY.has(k)) continue;
    const val = v && v.value;
    const blank = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
    if (blank || /^(REPLACE|TBD|TODO|\[)/i.test(String(val))) missing.push(k);
  }
  const f = order.fixed_terms || {};
  if (f.fee_usd !== 1000 || f.max_provider_attempts !== 300 || f.term_days !== 30) missing.push('fixed_terms_changed_without_record');
  if (Array.isArray(order.required_inputs?.named_evaluators?.value) && order.required_inputs.named_evaluators.value.length > (f.max_evaluators || 3)) missing.push('too_many_evaluators');
  if (order.required_inputs?.agreement_reviewed_by_lawyer?.value === false) missing.push('agreement_reviewed_by_lawyer');
  return { ok: missing.length === 0, stage, missing };
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
if (process.argv.includes('--selftest')) {
  const tmpl = JSON.parse(fs.readFileSync(path.join(HERE, '../track-b/ORDER-FORM-SPEC.json'), 'utf8'));
  let ok = 0, bad = 0; const t = (n, c) => { c ? ok++ : bad++; console.log((c ? 'PASS  ' : 'FAIL  ') + n); };
  t('the blank template is not issuable', !validateOrder(tmpl).ok);
  const full = JSON.parse(JSON.stringify(tmpl));
  for (const k of Object.keys(full.required_inputs)) full.required_inputs[k].value = k === 'named_evaluators' ? ['A', 'B'] : k === 'agreement_reviewed_by_lawyer' ? true : 'filled';
  t('a fully filled order is issuable', validateOrder(full).ok);
  t('a fully filled order is also complete at the sold stage', validateOrder(full, 'sold').ok);
  const noPay = JSON.parse(JSON.stringify(full)); noPay.required_inputs.payment_received_reference.value = null;
  t('missing payment record blocks the sold stage', !validateOrder(noPay, 'sold').ok && validateOrder(noPay, 'issue').ok);
  const ph = JSON.parse(JSON.stringify(full)); ph.required_inputs.licensee_legal_name.value = 'REPLACE: buyer';
  t('a placeholder value is rejected', validateOrder(ph).missing.includes('licensee_legal_name'));
  const fee = JSON.parse(JSON.stringify(full)); fee.fixed_terms.fee_usd = 500;
  t('a changed fee is rejected', validateOrder(fee).missing.includes('fixed_terms_changed_without_record'));
  const many = JSON.parse(JSON.stringify(full)); many.required_inputs.named_evaluators.value = ['A', 'B', 'C', 'D'];
  t('more than three evaluators is rejected', validateOrder(many).missing.includes('too_many_evaluators'));
  const nolaw = JSON.parse(JSON.stringify(full)); nolaw.required_inputs.agreement_reviewed_by_lawyer.value = false;
  t('an agreement not reviewed by a lawyer is not issuable', !validateOrder(nolaw).ok);
  console.log('\n' + (ok + bad) + ' checks, ' + bad + ' failed'); process.exit(bad ? 1 : 0);
} else if (process.argv[2]) {
  const r = validateOrder(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), process.argv[3] || 'issue');
  console.log(JSON.stringify(r, null, 2)); process.exit(r.ok ? 0 : 1);
}
