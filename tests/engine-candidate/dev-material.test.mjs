// Holdout-separation control: every development text is listed and detected. Added 2026-10-06.
// Development texts come from the fixed loader (shared/dev-index.mjs); no holdout is read.
import { t, done, net } from './_harness.mjs';
import { DEVELOPMENT_MATERIAL, isDevelopmentMaterial, assertNotDevelopmentMaterial, materialHash } from '../../lib/engine-candidate/dev-material.js';
import { loadDevelopmentTexts } from './shared/dev-index.mjs';

const texts = loadDevelopmentTexts().map((d) => [d.name, d.text]);
const unlisted = texts.filter(([, x]) => !isDevelopmentMaterial(x)).map(([n, x]) => `${n} ${materialHash(x)}`);
t('every fixture, regression case, corpus record, confirmation case and frozen demonstration record is listed as development material', unlisted.length === 0, unlisted.join('; '));
t('the list has no entry for material that no longer exists', DEVELOPMENT_MATERIAL.every(([h]) => texts.some(([, x]) => materialHash(x) === h)));
t('the list and the loader agree on the count (94)', DEVELOPMENT_MATERIAL.length === texts.length && texts.length === 94);
t('a listed text is detected and named', isDevelopmentMaterial(texts[0][1]) === texts[0][0]);
t('a whitespace-only reformatting is still detected', isDevelopmentMaterial('  ' + texts[0][1].replace(/\s+/g, '\n\n') + '\n') !== null);
const sample = texts.find(([n]) => n === 'regression/R01')[1];
t('a holdout batch containing development material is refused', (() => {
  try { assertNotDevelopmentMaterial(['A new constructed record that is not development material.', sample]); return false; }
  catch (e) { return /development_material_in_holdout: 1 \(regression\/R01\)/.test(e.message); }
})());
t('a clean batch passes', assertNotDevelopmentMaterial(['A new constructed record that is not development material.']) === true);
t('exact check alone does not catch an edited copy (contamination.js screens those)', isDevelopmentMaterial(sample.replace('Corran', 'Corrin')) === null);
t('each set is present: 3 fixtures, 24 regression, 15 corpus, 47 confirmation, 5 frozen demonstration',
  ['fixtures/', 'regression/', 'corpus/', 'confirmation/', 'frozen-demo/'].map((p) => texts.filter(([n]) => n.startsWith(p)).length).join() === '3,24,15,47,5');
t('no network call was made', net.calls === 0);
done();
