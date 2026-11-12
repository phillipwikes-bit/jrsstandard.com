import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

test('draft-builder URL is served directly rather than sent to Resources', () => {
  const cfg = JSON.parse(read('vercel.json'));
  const exact = cfg.redirects.find((x) => x.source === '/outreach-email-builder.html');
  assert.equal(exact, undefined, 'HTML draft-builder URL must not redirect');
  const alias = cfg.redirects.find((x) => x.source === '/outreach-email-builder');
  assert.equal(alias?.destination, '/outreach-email-builder.html');
  assert.match(read('outreach-email-builder.html'), /id="compose"/);
});

test('draft builder is a manual, local-only preparation aid', () => {
  const src = read('outreach-email-builder.html');
  assert.match(src, /No email is sent by this site/);
  assert.match(src, /navigator\.clipboard\.writeText/);
  assert.match(src, /mailto:/);
  assert.match(src, /PENDING|Before sending:/);
  assert.doesNotMatch(src, /fetch\s*\(|sendBeacon\s*\(|localStorage\.|sessionStorage\.|<form[^>]*action=/i);
  assert.doesNotMatch(src, /https:\/\/www\.googletagmanager\.com|gtag\s*\(/);
});

test('first-use instructions consistently begin with one record', () => {
  const check = read('check.html');
  assert.doesNotMatch(check, /Open five of your own closed matters/);
  assert.match(check, /Start with the fictional example or one authorized closed matter/);
  for (const path of ['decisions-you-can-defend.html','right-to-know-why.html']) {
    assert.match(read(path), /Suggested first use: examine the fictional excerpt/);
  }
});

test('engagement event remains a navigation click, with static allowlisted identifiers', () => {
  const events=read('assets/jrs-engagement.js');
  assert.match(events, /draft_builder_open/);
  assert.match(events, /if\(link\.pathname==='\/outreach-email-builder\.html'\)/);
  assert.match(events, /if\(link\.origin!==location\.origin\)return/);
  assert.doesNotMatch(events, /(?:searchParams|getAttribute\('data-email'\)|user_id|document\.cookie)/);
  const privacy=read('privacy-notice.html');
  assert.match(privacy,/navigation to the local email draft builder/);
});

test('outreach research plan disallows fabricated effectiveness', () => {
  const p = read('docs/outreach/JRS_INFLUENCE_AND_OUTREACH_MEASUREMENT_PROTOCOL_2026-11-09.md');
  assert.match(p,/NO CAUSAL RESULT/);
  assert.match(p,/intention to treat/);
  assert.match(p,/separately from reply, organizational use, and commercial agreements/);
  assert.match(p,/The protocol authorizes no outgoing messages/);
});
