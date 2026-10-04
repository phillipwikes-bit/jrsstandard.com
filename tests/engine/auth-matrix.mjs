let pass = 0, fail = 0;
const test = (name, ok) => {
  ok ? pass++ : fail++;
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name);
};

async function check(route, apiVersion) {
  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls++; throw new Error('network access is prohibited'); };
  try {
    const module = await import('../../' + route + '?case=' + Math.random());
    const response = await module.default(new Request('https://example.test/' + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'A sufficiently long record must still be refused by the controlled public boundary.' })
    }));
    const body = await response.json();
    test(route + ' refuses input', response.status === 503 && body.error === 'controlled_review_unavailable');
    test(route + ' has no outbound call', networkCalls === 0);
    test(route + ' declares the expected API version', apiVersion ? body.api_version === 'v1' : !('api_version' in body));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

await check('api/review-engine.js', false);
await check('api/v1/review-engine.js', true);
console.log('\n' + (pass + fail) + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
