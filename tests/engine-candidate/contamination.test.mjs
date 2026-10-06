// Development-material contamination screen: false-negative and false-positive challenge tests. Added 2026-10-06.
// No sealed holdout is read, written or created: every text here is development material or written inline.
import { readFileSync } from 'node:fs';
import { t, done, net, ROOT } from './_harness.mjs';
import { buildIndex, screen, screenBatch, UNCERTAINTY, BOILERPLATE_DOCS } from '../../lib/engine-candidate/contamination.js';
import { loadDevelopmentTexts, DEVELOPMENT_LOCATIONS } from './shared/dev-index.mjs';

const dev = loadDevelopmentTexts();
const index = buildIndex(dev);
const byName = Object.fromEntries(dev.map((d) => [d.name, d.text]));
const flagged = (r) => r.status === 'possible_development_material';
const K05 = byName['confirmation/v0.1.0/K05'], CR3 = byName['corpus/v0.1.0/CR-003'], R07 = byName['regression/R07'];

// ---- the loader reads only fixed development locations ----------------------------------------
t('the loader lists exactly the four development locations', DEVELOPMENT_LOCATIONS.join('|') === 'fixtures/|regression/cases.json|corpus/v0.1.0/records/|confirmation/v0.1.0/cases.json');
t('no development location names a holdout or a sealed set', DEVELOPMENT_LOCATIONS.every((p) => !/holdout|sealed|private|real/i.test(p)));
const loaderSrc = readFileSync(new URL('./shared/dev-index.mjs', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
t('the loader only reads: no write, delete or create call, and no path argument', !/writeFile|appendFile|mkdir|rm\(|unlink|createWriteStream/.test(loaderSrc) && /export function loadDevelopmentTexts\(\)/.test(loaderSrc));
const modSrc = readFileSync(new URL('../../lib/engine-candidate/contamination.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
t('the screen module touches no file at all', !/node:fs|readFile|writeFile|readdir/.test(modSrc));
t('all 89 development texts are indexed', dev.length === 89 && index.docs.length === 89);

// ---- exact copies (retained checks) ----------------------------------------------------------------
t('an exact copy is an exact match, named', screen(K05, index).status === 'exact_match' && screen(K05, index).development_source === 'confirmation/v0.1.0/K05');
t('a whitespace-only copy is an exact match', screen('\n ' + K05.replace(/ /g, '  ') + '\n', index).status === 'exact_match');

// ---- false-negative challenges: edited copies must be flagged as possible ----------------------------
const edits = {
  'one word changed': CR3.replace('overdue', 'late'),
  'names and dates changed': CR3.replace(/Bramley Instruments/g, 'Bramwell Instruments').replace(/May 2026/g, 'June 2026'),
  'sentences reordered': (() => { const [head, ...rest] = CR3.split('\n'); const s = rest.join(' ').split(/(?<=\.)\s+/); return head + '\n' + s.reverse().join(' '); })(),
  'one sentence deleted': CR3.replace('The agreement was signed on 12 May 2026. ', ''),
  'embedded inside a longer new text': 'Covering note from the reviewing team, written for this test only, which adds several sentences of new material before the copied record begins in full below.\n' + CR3 + '\nClosing note: nothing further was received from the supplier after this point.',
  'confirmation record with one word changed': K05.replace('legible', 'readable'),
};
for (const [name, text] of Object.entries(edits)) {
  const r = screen(text, index);
  t(`edited copy flagged as possible (${name})`, flagged(r) && r.candidates[0]?.development_source !== undefined, JSON.stringify(r.candidates[0] || r.status));
}
const one = screen(edits['one word changed'], index);
t('an edited copy names the likely source', one.candidates[0].development_source === 'corpus/v0.1.0/CR-003');
t('an edited copy is never called certain: it carries the uncertainty statement', one.certainty === 'uncertain: needs human review' && one.uncertainty === UNCERTAINTY);

const longDev = byName['fixtures/SYNTHETIC-SAE-01.txt'];
const excerpt = longDev.slice(longDev.indexOf('The procurement lead approved'), longDev.indexOf('Access was granted'));
// Padding is new text built from stock template phrasing (shared by many development texts, so not distinctive),
// with new names; it is not itself development material.
const padding = ['Wexcombe Sensors', 'Yarrow Pumps', 'Zennor Glass'].map((n, i) => `On ${i + 4} February 2026 ${n} requested read access to the forecast workbook. The supplier-access standard requires a signed data-handling agreement. The exception was approved on ${i + 5} February 2026 by the engineering lead because`).join(' ');
const padded = screen(padding + ' ' + excerpt, index);
t('a few sentences copied word for word into a longer new text are flagged (long-run rule)', flagged(padded) && padded.candidates.some((c) => c.development_source === 'fixtures/SYNTHETIC-SAE-01.txt' && c.shared_distinctive_shingles >= 20), JSON.stringify(padded.candidates[0] || padded.status));
const shortExcerpt = longDev.slice(longDev.indexOf('The procurement lead approved'), longDev.indexOf('No record of'));
const stock = ['signed data-handling agreement', 'completed security questionnaire', 'current penetration-test summary', 'named technical contact', 'data-retention statement']
  .map((x) => 'The supplier-access standard requires a ' + x + '.').join(' ');
const diluted = screen(stock + ' ' + shortExcerpt, index);
t('a short excerpt padded with stock sentences is flagged: stock wording does not dilute the screened text', flagged(diluted) && diluted.candidates[0].development_source === 'fixtures/SYNTHETIC-SAE-01.txt' && diluted.candidates[0].shared_distinctive_shingles < 20, JSON.stringify(diluted.candidates[0] || diluted.status));
t('the stock sentences alone are not flagged', screen(stock, index).status === 'no_match_found');

// ---- false-positive challenges: new texts must not be flagged ----------------------------------------
const fresh = {
  'a new record in the same domain, written fresh': 'CONSTRUCTED TEST RECORD. Fictional. On 2 February 2026 Wexcombe Sensors asked to read the vibration-trend archive for a fortnight. Their contract obliges a yearly security attestation, and the 2025 attestation lapsed in January. The head of reliability allowed it anyway, writing that the trends were needed to diagnose a bearing fault on line 4. Read access runs to 16 February 2026.',
  'a different kind of document entirely': 'Minutes of the canteen committee. The committee agreed to move the salad bar nearer the window, to trial a vegetarian option on Thursdays, and to repaint the noticeboard before the summer open day.',
  'boilerplate header and stock phrases only': 'CONSTRUCTED CONFIRMATION RECORD K99. Fictional. Not a real record.\nThe supplier-access standard requires a signed data-handling agreement.',
  'a short text': 'Access ends on 31 March 2026.',
};
for (const [name, text] of Object.entries(fresh)) t(`new text not flagged (${name})`, screen(text, index).status === 'no_match_found', JSON.stringify(screen(text, index).candidates[0] || ''));
t('a no-match result says it is not proof the text is new', screen(fresh['a short text'], index).certainty === 'not proof that the text is new');
t(`shared structure is ignored: shingles in ${BOILERPLATE_DOCS} or more development texts do not count`,
  [...index.df.entries()].some(([, n]) => n >= BOILERPLATE_DOCS) && screen(fresh['boilerplate header and stock phrases only'], index).candidates.length === 0);

// ---- known limit, stated rather than hidden ----------------------------------------------------------
const paraphrase = 'CONSTRUCTED TEST RECORD. In May the calibration-records portal was opened to Bramley before Bramley had even asked, and before the lab manager signed off. Bramley asked a day later; sign-off came the day after that, citing overdue calibration. The confidentiality agreement was only signed after both.';
t('known limit: a heavy paraphrase of a development record is NOT detected', screen(paraphrase, index).status === 'no_match_found');

// ---- batch use ---------------------------------------------------------------------------------------
const batch = screenBatch([fresh['a short text'], K05, edits['one word changed']], index);
t('a batch separates exact copies from possible matches needing review', JSON.stringify(batch.exact_copies) === '[1]' && JSON.stringify(batch.needs_human_review) === '[2]');
t('a batch result admits nothing to a holdout by itself', /does not admit any text to a holdout/.test(batch.statement));
t('screening leaves the development texts unchanged', loadDevelopmentTexts().every((d, i) => d.text === dev[i].text));

t('no network call was made', net.calls === 0);
done();
