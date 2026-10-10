// Candidate Manifest adapter: incompatibility record. Added 2026-10-06.
//
// DECISION: the candidate is LEFT DISCONNECTED from the Manifest library. The library
// is not changed, and no candidate module imports it. This test keeps that decision
// checkable rather than asserted: it shows, against the real builder and schema, why
// a candidate result cannot be represented without inventing a verdict or changing
// public-facing code (api/_manifest/ is deployable). See ARCHITECTURE.md, "Manifest".
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { t, done, fixture, net, ROOT, PROFILE, NOW, cond, reply } from './_harness.mjs';
import { runCandidate } from '../../lib/engine-candidate/review-candidate.js';
import { buildManifest } from '../../api/_manifest/build.js';

const schema = JSON.parse(readFileSync(join(ROOT, 'schemas/jrs-decision-reconstruction-manifest.schema.json'), 'utf8'));
const r = await runCandidate({ text: fixture('SYNTHETIC-SAE-01.txt'), profile: PROFILE }, { adapter: reply({ conditions: cond('review', 'Partial.'), flaws: [] }), now: NOW });
const msg = async (opts) => { try { await buildManifest(opts); return 'built'; } catch (e) { return e.message; } };
const engine = { name: 'JRS Review Engine local candidate', version: r.review_identity.candidate_version, model: r.review_identity.model };
const asEngineResult = { result: { conditions: r.contextual_findings.conditions } };

t('the Manifest schema requires a routing value, i.e. an overall verdict', schema.required.includes('routing') && schema.properties.routing.required.includes('value'));
t('the Manifest schema allows no extra fields, so findings, dispositions and sign-off have nowhere to go', schema.additionalProperties === false && !('human_review' in schema.properties && schema.properties.human_review.properties?.disposition));
t('the Manifest requires an API version; the candidate has no API', schema.properties.engine.required.includes('api_version') && !('api_version' in r.review_identity));
t('the candidate result carries no determination and no routing, by design', !('determination' in r) && !('routing' in r) && !JSON.stringify(r).includes('"determination"'));
t('buildManifest refuses the candidate without an API version', /api_version are required/.test(await msg({ engineResult: asEngineResult, sourceText: 'x', jrsVersion: '1', codebookVersion: '1', engine })));
t('buildManifest refuses the candidate even with a stand-in API version, because there is no verdict to route',
  /no routing value/.test(await msg({ engineResult: asEngineResult, sourceText: 'x', jrsVersion: '1', codebookVersion: '1', engine: { ...engine, api_version: 'none' } })));
const dir = join(ROOT, 'lib/engine-candidate');
t('no candidate module imports the Manifest library', readdirSync(dir).filter((f) => f.endsWith('.js')).every((f) => !/_manifest|lib\/manifest|buildManifest/.test(readFileSync(join(dir, f), 'utf8').replace(/^\s*\/\/.*$/gm, ''))));

t('no network call was made', net.calls === 0);
done();
