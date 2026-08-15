// TEST E: incomplete / malformed model responses, without contacting the model.
//
// Stubs global fetch so the handler receives a provider payload we control, then
// asserts the endpoint fails safely instead of throwing a raw exception or
// presenting a partial JRS analysis as a finished one.
import handler from '../api/review.js';

process.env.ANTHROPIC_API_KEY = 'test-not-a-real-key';

const REC = 'On 12 June the manager terminated the employee after reviewing the file. HR concurred.';

function provider(body) {
  globalThis.fetch = async () => new Response(JSON.stringify(body), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}

function req() {
  return new Request('https://www.jrsstandard.com/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'origin': 'https://www.jrsstandard.com',
               'x-forwarded-for': '203.0.113.' + Math.floor(Math.random() * 250) },
    body: JSON.stringify({ text: REC })
  });
}

// A real truncation: valid JSON opening, cut off mid-array, stop_reason max_tokens.
const TRUNCATED = '{"routing":"High","routingRationale":"x","conditions":[{"id":1,"label":"Reconstructability","status":"Fail","note":"aaa"},{"id":2,"label":"Basis Identification","status":"Fail","note":"bbb"';

const CASES = [
  ['stop_reason=max_tokens, cut mid-array',
   { stop_reason: 'max_tokens', usage: { output_tokens: 1024 }, content: [{ type: 'text', text: TRUNCATED }] },
   502, 'model_output_truncated'],

  // Braces present but the content between them is not valid JSON, so it
  // reaches the parser and must fail there. The earlier fixture had no closing
  // brace, so it never got past extraction: that was a bad test, not a bug.
  ['unparseable JSON, normal stop reason',
   { stop_reason: 'end_turn', usage: { output_tokens: 300 }, content: [{ type: 'text', text: '{"routing":"High", oops, }' }] },
   502, 'model_json_unparseable'],

  // THE SECOND FAILURE MODE, now fixed. Valid JSON with prose after it that
  // contains a brace. The old extractor was greedy from the first { to the LAST
  // }, so it swallowed the trailing prose and the parse failed even though the
  // model had finished normally with stop_reason=end_turn. The balanced-brace
  // scan takes the JSON and ignores what follows, so this must now SUCCEED.
  ['valid JSON followed by prose containing a brace',
   { stop_reason: 'end_turn', usage: { output_tokens: 500 }, content: [{ type: 'text', text:
     JSON.stringify({ routing: 'High', routingRationale: 'r',
       conditions: [1,2,3,4,5].map(i => ({ id: i, label: 'L' + i, status: 'Fail', note: 'n' })),
       flags: ['f'], revisions: ['v'], summary: 's' })
     + '\n\nNote: the schema above uses {status} values from the JRS scale.' }] },
   200, null],

  ['JSON inside a markdown code fence',
   { stop_reason: 'end_turn', usage: { output_tokens: 500 }, content: [{ type: 'text', text:
     '```json\n' + JSON.stringify({ routing: 'High', routingRationale: 'r',
       conditions: [1,2,3,4,5].map(i => ({ id: i, label: 'L' + i, status: 'Fail', note: 'n' })),
       flags: ['f'], revisions: ['v'], summary: 's' }) + '\n```' }] },
   200, null],

  ['no JSON object at all',
   { stop_reason: 'end_turn', usage: { output_tokens: 20 }, content: [{ type: 'text', text: 'I cannot help with that.' }] },
   502, 'no_json_object'],

  ['empty content array',
   { stop_reason: 'end_turn', usage: { output_tokens: 0 }, content: [] },
   502, 'empty_model_response'],

  ['content missing entirely',
   { stop_reason: 'end_turn' },
   502, 'empty_model_response'],

  ['well-formed response still succeeds',
   { stop_reason: 'end_turn', usage: { output_tokens: 400 },
     content: [{ type: 'text', text: JSON.stringify({
       routing: 'High', routingRationale: 'r',
       conditions: [1,2,3,4,5].map(i => ({ id: i, label: 'L' + i, status: 'Fail', note: 'n' })),
       flags: ['f'], revisions: ['v'], summary: 's' }) }] },
   200, null],
];

let pass = 0, fail = 0;
for (const [name, payload, wantStatus, wantReason] of CASES) {
  provider(payload);
  let res, body, threw = null;
  try {
    res = await handler(req());
    body = await res.json();
  } catch (e) { threw = e; }

  const okStatus = !threw && res.status === wantStatus;
  const okReason = !threw && (wantReason ? body.reason === wantReason : !('error' in body));
  // A truncated analysis must never come back looking finished.
  const noPartial = !threw && (wantStatus !== 200 ? !('conditions' in body) : true);
  const noLeak = !threw && !JSON.stringify(body).includes('terminated the employee');

  const ok = okStatus && okReason && noPartial && noLeak && !threw;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  console.log(`      status=${threw ? 'THREW ' + threw.message : res.status} reason=${threw ? '-' : (body.reason || 'none')} partialAnalysisReturned=${threw ? '?' : !noPartial} recordEchoed=${threw ? '?' : !noLeak}`);
  ok ? pass++ : fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
