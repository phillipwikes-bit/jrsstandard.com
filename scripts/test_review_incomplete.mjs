import handler from '../api/review.js';

const originalFetch = globalThis.fetch;
let networkCalls = 0;
globalThis.fetch = async () => { networkCalls++; throw new Error('network access is prohibited'); };
try {
  const response = await handler(new Request('https://example.test/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'This record must not leave the public boundary.' })
  }));
  const body = await response.json();
  if (response.status !== 503 || body.error !== 'controlled_review_unavailable' || networkCalls !== 0) {
    console.error('FAIL  public review route did not fail closed');
    process.exit(1);
  }
  console.log('PASS  public review route refuses input with no outbound call');
} finally {
  globalThis.fetch = originalFetch;
}
