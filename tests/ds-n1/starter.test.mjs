// Starter edition build (2026-11-24): browser-only modules, all embedded.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStarter } from '../../lib/ds-n1/package/build-starter.mjs';

test('starter edition embeds every module it needs and no Node-only code', () => {
  const b = buildStarter();
  assert.ok(b.html.includes('<script type="importmap">'));
  assert.ok(!b.html.includes('/lib/ui/read.mjs'));
  assert.ok(b.modules.includes('extract.mjs') && b.modules.includes('omissions.mjs') && b.modules.includes('docx.mjs'));
  assert.ok(!b.modules.some((m) => m.startsWith('enterprise/') || m === 'serve.mjs'));
  assert.doesNotMatch(b.html, /https?:\/\/(?!www\.w3\.org)/);
});
