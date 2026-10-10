// Confirmation-corpus separation: the confirmation corpus must not copy the regression set, the
// 15-record corpus or the fixtures. Added 2026-10-06. Development material only; no holdout is read.
import { t, done, net } from './_harness.mjs';
import { buildIndex, screen } from '../../lib/engine-candidate/contamination.js';
import { materialHash } from '../../lib/engine-candidate/dev-material.js';
import { loadDevelopmentTexts } from './shared/dev-index.mjs';
import { readFileSync } from 'node:fs';

const dev = loadDevelopmentTexts();
const conf = dev.filter((d) => d.name.startsWith('confirmation/'));
const earlier = dev.filter((d) => !d.name.startsWith('confirmation/'));
const index = buildIndex(earlier);
const results = conf.map((c) => ({ name: c.name, r: screen(c.text, index) }));
const recorded = JSON.parse(readFileSync(new URL('./confirmation/v0.1.0/DIVERGENCES.json', import.meta.url), 'utf8')).separation_findings;

t('the confirmation corpus has 47 cases and they are distinct from one another', conf.length === 47 && new Set(conf.map((c) => materialHash(c.text))).size === 47);
t('no confirmation case is an exact copy of an earlier development text', results.every((x) => x.r.status !== 'exact_match'));
const possible = results.filter((x) => x.r.status === 'possible_development_material').map((x) => x.name + '~' + x.r.candidates[0].development_source);
t('the only possible overlap is the recorded one (K21 with R21)', JSON.stringify(possible) === JSON.stringify(['confirmation/v0.1.0/K21~regression/R21']), JSON.stringify(possible));
t('that overlap is recorded in the confirmation divergence file', recorded.length === 1 && /K21 reuses/.test(recorded[0].finding));
const set = JSON.parse(readFileSync(new URL('./confirmation/v0.1.0/cases.json', import.meta.url), 'utf8'));
t('the corpus labels itself confirmation material, never a holdout or validation set', /never a sealed holdout and never a real-world validation set/.test(set.status));
t('no network call was made', net.calls === 0);
done();
