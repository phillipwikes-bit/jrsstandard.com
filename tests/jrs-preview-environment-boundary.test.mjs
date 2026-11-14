import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// This guards the *code-level* boundary. GitHub environment required reviewers,
// deployment branch restrictions, and the secret itself must be configured by
// the owner and verified separately; source checks cannot certify those settings.
const yaml = readFileSync('.github/workflows/jrs-visual-snapshot.yml', 'utf8');
const localMarker = '\n  visual-snapshots:\n';
const protectedMarker = '\n  protected-preview:\n';
assert.equal(yaml.split(localMarker).length, 2, 'Expect exactly one local visual job');
assert.equal(yaml.split(protectedMarker).length, 2, 'Expect exactly one protected preview job');
const local = yaml.split(localMarker)[1].split(protectedMarker)[0];
const protectedJob = yaml.split(protectedMarker)[1];
assert.match(local, /name: Preserve local screenshot inventory/, 'Keep local visual evidence independent');
assert.doesNotMatch(local, /secrets\.JRS_VERCEL_PREVIEW_BYPASS/, 'PR local browser job must never receive the bypass secret');
assert.doesNotMatch(local, /id-token:\s*write/, 'Local PR job must not acquire an OIDC identity token');
assert.doesNotMatch(local, /Verify preview source identity before any release certification/, 'Hosted gate must not run in local job');
assert.match(protectedJob, /needs:\s*visual-snapshots/, 'Protected job must depend on local evidence');
assert.match(protectedJob, /environment:\s*jrs-protected-preview/, 'Keep reviewable environment boundary');
assert.match(protectedJob, /permissions:\s*\n\s+contents:\s*read\s*\n\s+deployments:\s*read/, 'Keep restricted workflow permissions');
assert.match(protectedJob, /persist-credentials:\s*false/, 'Do not leave checkout credentials in candidate source');
assert.match(protectedJob, /name: Require owner-approved environment credential/, 'Missing protected secret must fail closed');
assert.match(protectedJob, /if \[ -z "\$JRS_VERCEL_PREVIEW_BYPASS" \]; then/, 'Explicitly reject unset preview secret');
assert.match(protectedJob, /secrets\.JRS_VERCEL_PREVIEW_BYPASS/, 'Use dedicated environment-scoped secret only');
assert.doesNotMatch(protectedJob, /id-token:\s*write/, 'Do not silently broaden GitHub OIDC permissions');
const verified = protectedJob.indexOf('name: Verify preview source identity before any release certification');
const captured = protectedJob.indexOf('name: Capture verified exact-head preview screenshots');
assert.ok(verified > 0 && captured > verified, 'Byte and PDF verification must precede hosted screenshots');
const expectedRef = 'github.event.pull_request.head.sha || github.sha';
assert.ok((protectedJob.match(/github\.event\.pull_request\.head\.sha \|\| github\.sha/g) || []).length >= 2,
  'Compare against the exact selected candidate commit');
console.log('PASS: protected hosted verification stays separate, reviewed, exact-head and fail-closed.');
console.log('LIMITATION: required reviewers, branch rules and credential availability require owner-side configuration.');
