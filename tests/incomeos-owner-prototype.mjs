// IncomeOS owner-only source QA. It checks source integrity, not private deployment access.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script, runInNewContext } from 'node:vm';

const root = resolve('owner/incomeos');
const read = (f) => readFileSync(resolve(root, f), 'utf8');
const page = read('index.html');
const styles = read('incomeos.css');
const js = read('incomeos.js');
const accountant = read('accountant.js');
const feed = JSON.parse(read('opportunities.json'));
const manifest = JSON.parse(read('manifest.webmanifest'));
const icon = read('icon.svg');
const instructions = read('README.md');

new Script(js, { filename: 'owner/incomeos/incomeos.js' });
new Script(accountant, { filename: 'owner/incomeos/accountant.js' });
assert.match(page, /<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.match(page, /<meta name="referrer" content="no-referrer">/);
assert.match(page, /id="view-research"/);
assert.match(page, /id="view-assets"/);
assert.match(page, /id="view-ledger"/);
assert.match(page, /id="view-compound"/);
assert.match(page, /id="view-about"/);
assert.match(page, /type="date"/);
assert.match(page, /incomeos\.js/);
assert.match(page, /accountant\.js/);
for (const id of ['report-year','receipt-form','cost-form','receipt-amount','cost-amount','cost-business-use','cost-evidence-status','download-template','import-csv','export-ledger','download-summary','backup-ledger','import-ledger','print-accountant','print-report']) assert.match(page, new RegExp('id="'+id+'"'));
assert.match(page, /Quick add:/);
assert.doesNotMatch(accountant, /\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket/);

// The feed URL is referenced by the script, not the HTML.
assert.match(js, /fetch\("\.\/opportunities\.json"/);
assert.doesNotMatch(page, /(?:Review Engine|review-engine\.html|Open AI-Assisted Record Reviewer|Paste & Assess)/i);
assert.doesNotMatch(page, /<script[^>]+src="https?:/i);
assert.doesNotMatch(page, /<form[^>]+action=/i);
assert.doesNotMatch(js, /\bfetch\(\s*["']https?:/i);
assert.doesNotMatch(js, /XMLHttpRequest|sendBeacon|WebSocket/);
assert.match(instructions, /STAGING ONLY/);
assert.match(instructions, /DO NOT MERGE/);
assert.match(instructions, /server-side/);
assert.match(styles, /@media\(max-width:350px\)/);
assert.equal(manifest.start_url, '/owner/incomeos/');
assert.equal(manifest.scope, '/owner/incomeos/');
assert.match(icon, /^<svg/);
assert.equal(feed.asOf, '2026-11-01');
assert.ok(feed.studies.length >= 4);
assert.ok(feed.assets.length >= 4);
const ids = new Set();
for (const item of [...feed.studies, ...feed.assets]) {
  assert.ok(/^[a-z0-9-]{4,90}$/.test(item.id), 'stable public record ID required');
  assert.ok(!ids.has(item.id), 'IDs must be unique');
  ids.add(item.id);
  assert.ok(item.reviewed === feed.asOf, 'Source review date must match snapshot');
  assert.ok(item.title.length > 3);
  for (const url of [item.sourceUrl, item.url ?? item.opportunityUrl]) {
    assert.ok(url?.startsWith('https://'), 'Source routes must use HTTPS');
    const u = new URL(url);
    assert.ok(!u.username && !u.password, 'Never place a credential in URLs');
    assert.ok(!/localhost|127\.0\.0\.1/.test(u.hostname), 'No local route');
  }
}
for (const s of feed.studies) {
  assert.ok(s.paymentUsd > 0 && s.minutes > 0, 'Paid study and time must be positive');
  assert.ok(s.eligibility.length > 0);
  assert.ok(s.status.toLowerCase().includes('unconfirmed'), 'Do not assert seats available');
  assert.ok(/\d{4}-\d{2}-\d{2}/.test(s.eventEnd));
  assert.ok(s.url.includes('/r/') || s.url.includes('next='), 'Specific screener or study-specific registration required');
  assert.ok(!s.url.endsWith('/register'), 'Reject generic registration links');
}
for (const a of feed.assets) {
  assert.ok(a.capitalUsd > 0, 'Asset price or entry threshold required');
  assert.ok(a.risks.length >= 2, 'Material risks required');
  assert.match(a.status, /unconfirmed|not verified/i);
  if (a.historicalUsd !== null) assert.ok(a.historicalUsd >= 0 && a.historicalMonths > 0);
}
const win={};
runInNewContext(accountant, {window:win, Intl, Date, Number, Math, String, Array, Object, Set, JSON, console});
assert.equal(typeof win.IncomeOSAccountant.totals,'function');
assert.equal(typeof win.IncomeOSAccountant.parseCsv,'function');
const totals=win.IncomeOSAccountant.totals([
  {kind:'income',status:'paid',scope:'income',grossUsd:100,feesUsd:5,reconciled:true},
  {kind:'income',status:'pending',scope:'income',grossUsd:200,reconciled:false},
  {kind:'income',status:'paid',scope:'nonincome',grossUsd:60,reconciled:false},
  {kind:'income',status:'paid',scope:'proceeds',grossUsd:150,reconciled:false},
  {kind:'outflow',type:'expense',amountUsd:30,businessUse:50,reconciled:false},
  {kind:'outflow',type:'taxpayment',amountUsd:10,reconciled:true},
  {kind:'outflow',type:'capital',amountUsd:70,reconciled:false}
]);
assert.equal(totals.gross,100,'Paid income excludes unreceived, refunded principal and sale proceeds');
assert.equal(totals.pending,200,'Pending reported separately');
assert.equal(totals.returned,60,'Refunded principal not counted as new earnings');
assert.equal(totals.proceeds,150,'Proceeds require basis accounting');
assert.equal(totals.fees,5);
assert.equal(totals.expenses,30,'Tax and capital outflow excluded from expense subtotal');
assert.equal(totals.possibleBusinessUse,15,'Business-use percentage remains an estimate');
assert.equal(totals.taxPaid,10);
assert.equal(totals.capital,70);
const parsed=win.IncomeOSAccountant.parseCsv('kind,date,description,amount_usd\r\nexpense,2026-11-01,"Monthly AI, Extra usage",12.50\r\n');
assert.equal(parsed[1][2],'Monthly AI, Extra usage','Quoted CSV commas must be preserved');
assert.equal(parsed[1][3],'12.50');
// Bank imports must keep distinct same-day, same-amount charges when source references differ.
const prompts=[];
const sandbox={
  window:{}, Intl, Date, Number, Math, String, Array, Object, Set, JSON, console,
  confirm:message=>{prompts.push(message);return false;}
};
runInNewContext(accountant,sandbox);
const header='kind,date,description,vendor,category,amount_usd,status,business_use_pct,evidence_ref,notes';
const twins=[
  'expense,2026-10-02,Anthropic API,Anthropic,software,20.60,paid,0,Bank txn A,receipt A',
  'expense,2026-10-02,Anthropic API,Anthropic,software,20.60,paid,0,Bank txn B,receipt B'
];
sandbox.window.IncomeOSAccountant.importCsv([header,...twins].join(String.fromCharCode(10)));
assert.match(prompts.pop(),/Import 2 new records/, 'Same-day identical payments with different bank references must survive import');
sandbox.window.IncomeOSAccountant.importCsv([header,twins[0],twins[0]].join(String.fromCharCode(10)));
assert.match(prompts.pop(),/Import 1 new records/, 'Repeated exact bank reference must be deduplicated');
console.log('IncomeOS source QA passed: 5 views, ' + feed.studies.length + ' studies, ' + feed.assets.length + ' asset candidates, syntax and privacy checks.');
