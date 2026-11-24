// The plain-text demo keeps working end to end (2026-11-24). Fictional case.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runDemo } from '../../lib/ds-n1/demo/run-demo.mjs';

test('the demo turns plain documents into a review that catches the planted gaps', () => {
  const out = runDemo(new URL('../../lib/ds-n1/demo/case-harbourline', import.meta.url).pathname);
  assert.equal(out.state.status, 'HOLD');
  assert.ok(out.state.findings.some((f) => f.code === 'UNSUPPORTED_CLAIM' && /certification/.test(f.explanation)));
  assert.ok(out.advisories.some((h) => h.template === 'hedged_source_stated_firmly'));
  assert.equal(out.extraction.claims.length, 6);
});
