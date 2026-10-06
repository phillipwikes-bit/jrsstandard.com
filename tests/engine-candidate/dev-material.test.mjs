// Holdout-separation control: every development text is listed and detected. Added 2026-10-06.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { t, done, ROOT, net } from './_harness.mjs';
import { DEVELOPMENT_MATERIAL, isDevelopmentMaterial, assertNotDevelopmentMaterial, materialHash } from '../../lib/engine-candidate/dev-material.js';

const FIX = join(ROOT, 'tests/engine-candidate/fixtures');
const texts = readdirSync(FIX).map((f) => ['fixtures/' + f, readFileSync(join(FIX, f), 'utf8')])
  .concat(JSON.parse(readFileSync(join(ROOT, 'tests/engine-candidate/regression/cases.json'), 'utf8')).cases.map((c) => ['regression/' + c.id, c.text]));

const unlisted = texts.filter(([, x]) => !isDevelopmentMaterial(x)).map(([n, x]) => `${n} ${materialHash(x)}`);
t('every fixture and regression case is listed as development material', unlisted.length === 0, unlisted.join('; '));
t('the list has no entry for material that no longer exists', DEVELOPMENT_MATERIAL.every(([h]) => texts.some(([, x]) => materialHash(x) === h)));
t('a listed text is detected and named', isDevelopmentMaterial(texts[0][1]) === texts[0][0]);
t('a whitespace-only reformatting is still detected', isDevelopmentMaterial('  ' + texts[0][1].replace(/\s+/g, '\n\n') + '\n') !== null);
const sample = texts.find(([n]) => n === 'regression/R01')[1];
t('a holdout batch containing development material is refused', (() => {
  try { assertNotDevelopmentMaterial(['A new constructed record that is not development material.', sample]); return false; }
  catch (e) { return /development_material_in_holdout: 1 \(regression\/R01\)/.test(e.message); }
})());
t('a clean batch passes', assertNotDevelopmentMaterial(['A new constructed record that is not development material.']) === true);
t('known limit, stated rather than hidden: an edited copy is NOT detected', isDevelopmentMaterial(sample.replace('Corran', 'Corrin')) === null);

t('no network call was made', net.calls === 0);
done();
