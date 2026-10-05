import { readFile } from 'node:fs/promises';

let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

const retired = [
  'pilot.html',
  'ai-records-pilot.html',
  'acquisition-9f3c2a7d4b.html',
  'licensing-acquisition.html',
  'controlled-evaluation-package.html',
  'platform-evaluation-001.html',
  'organizational-evaluation.html'
];

for (const path of retired) {
  const html = await readFile(path, 'utf8');
  test(`${path} is noindex`, html.includes('noindex,follow'));
  test(`${path} has a status redirect`, html.includes('meta http-equiv="refresh"'));
}

const [standard, training, handoff] = await Promise.all([
  readFile('jrsstandard.html', 'utf8'),
  readFile('training.html', 'utf8'),
  readFile('docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md', 'utf8')
]);

test('Standard does not describe a public Engine API', !standard.includes('It is an API that applies the defined review conditions'));
test('Training does not direct visitors to submit records', !training.includes('Submit records to the Record Review Workspace'));
test('Current Engine handoff preserves the no-public-intake boundary', handoff.includes('Public review routes must refuse submissions'));

console.log(`\n${retired.length * 2 + 3} checks, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
