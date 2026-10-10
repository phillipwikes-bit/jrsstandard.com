// Language, credential and copied-text guards.
import { t, done, G } from './_helpers.mjs';

const bad = ['The JRS estate has clear title.', 'The code is commercially cleared.', 'JRS owned by the founder.', 'Components are safe to license.',
  'The package is approved for sale.', 'Dependencies are license compliant.', 'The repository is transaction-ready.', 'This file is secret.',
  'The library is permissive.', 'It is commercially usable.', 'A clean dependency tree.', 'This is safe.', 'The system is production-ready.', 'Sale-ready assets.', 'Licensing-ready.'];
for (const s of bad) t('rejects: ' + JSON.stringify(s), G.languageProblems(s).length > 0);
const ok = ['It does not make JRS transaction-ready.', 'This package does not establish clear title.', 'No component is recorded as commercially cleared.', 'Exclusion is not a claim that a file is secret.', 'The owner page is restricted.'];
for (const s of ok) t('allows a negated or neutral statement: ' + JSON.stringify(s), G.languageProblems(s).length === 0);
t('a negation in another sentence does not excuse the claim', G.languageProblems('This is not legal advice. The code is commercially cleared.').length === 1);
t('problems report a label and a line number, never the text', JSON.stringify(G.languageProblems('x\nThe repository is transaction-ready.')) === JSON.stringify([{ label: 'transaction-ready', line: 2 }]));
const fake = ['sk-' + 'ant-' + 'a'.repeat(30), 'gh' + 'p_' + 'b'.repeat(36), 'AK' + 'IA' + 'C'.repeat(16), '-----BEGIN ' + 'PRIVATE KEY-----', 'sb_' + 'secret_' + 'd'.repeat(20)];
for (const f of fake) t('detects a credential-like value (' + f.slice(0, 6) + '…)', G.credentialProblems('value: ' + f).length > 0);
t('a SHA-256 hex digest is not mistaken for a credential', G.credentialProblems('e'.repeat(64)).length === 0);
t('copied text from a protected source is detected', G.copiedTextProblems('report ... The approver wrote that the supplier is trusted by everyone ...', ['The approver wrote that the supplier is trusted by everyone']).length === 1);
t('short common fragments are not counted as copies', G.copiedTextProblems('the supplier', ['the supplier']).length === 0);
done();
