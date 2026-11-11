import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ownerDesk = new URL('../../owner/incomeos/', import.meta.url);
const legacyVault = 'https://pmvqxdgvnwhckzxojioa.supabase.co';
const reservedRefs = new Set(['pmvqxdgvnwhckzxojioa', 'pjzxkeviouofdseagvpf', 'ndjoqlnztjcqtmbbwybv']);
const stagingScripts = ['workspace-revision-protocol.js', 'revision-store.js', 'revision-supabase-transport.js',
  'revision-workspace-bridge.js', 'revision-accounting-coordinator.js', 'revision-runtime-staging.js', 'revision-preview.js'];
const script = path => `<script defer src="./${path}"></script>`;

export async function prepareRevisionPreview({ output, origin, projectRef, publishableKey, browserFixture = false }) {
  const hostedOrigin = typeof origin === 'string' && /^https:\/\/incomeos-opportunity-desk-[a-z0-9-]+\.vercel\.app$/.test(origin);
  const fixtureOrigin = browserFixture === true && typeof origin === 'string' && /^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(origin);
  if (!hostedOrigin && !fixtureOrigin) throw Error('An exact protected IncomeOS preview origin is required');
  if (typeof projectRef !== 'string' || !/^[a-z]{20}$/.test(projectRef) || reservedRefs.has(projectRef)) {
    throw Error('An approved isolated Supabase project reference is required');
  }
  if (typeof publishableKey !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]{20,120}$/.test(publishableKey)) {
    throw Error('A staging Supabase publishable key is required');
  }
  if (typeof output !== 'string' || !output.trim()) throw Error('A new staging output directory is required');
  const dir = resolve(output);
  const url = `https://${projectRef}.supabase.co`;
  const originalPage = await readFile(new URL('index.html', ownerDesk), 'utf8');
  const originalHeaders = await readFile(new URL('vercel.json', ownerDesk), 'utf8');
  const cloud = script('vault-cloud.js');
  const briefing = script('briefing-ui.js');
  if (!originalPage.includes(cloud) || !originalPage.includes(briefing) ||
      !originalPage.includes(legacyVault) || !originalHeaders.includes(legacyVault)) {
    throw Error('Owner Desk entry or content policy changed. Review the staging composition');
  }
  const page = originalPage.replace(legacyVault, url)
    .replace(cloud, `${script('revision-preview-config.js')}\n${cloud}`)
    .replace(briefing, `${briefing}\n${stagingScripts.map(script).join('\n')}`);
  const files = (await readdir(ownerDesk, { withFileTypes: true })).filter(file => file.isFile() &&
    (/^[a-z0-9-]+\.(?:js|mjs|css|svg|webmanifest)$/.test(file.name) || file.name === 'opportunities.json'));
  // Assemble a fresh copy. The checked-in entry and deployment settings stay intact.
  await mkdir(dir, { mode: 0o700 });
  await Promise.all(files.map(file => cp(new URL(file.name, ownerDesk), resolve(dir, file.name), { errorOnExist: true, force: false })));
  await writeFile(resolve(dir, 'index.html'), page, { flag: 'wx' });
  await writeFile(resolve(dir, 'vercel.json'), originalHeaders.replace(legacyVault, url), { flag: 'wx' });
  await writeFile(resolve(dir, 'revision-preview-config.js'),
    `window.IncomeOSRevisionPreviewConfig=Object.freeze(${JSON.stringify({ stagingOnly: true, origin, url, key: publishableKey })});\n`, { flag: 'wx' });
  return dir;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.env.INCOMEOS_REVISION_PREVIEW_AUTHORIZED !== 'yes') throw Error('Staging preparation requires explicit operator configuration');
  const output = await prepareRevisionPreview({ output: process.argv[2], origin: process.env.INCOMEOS_REVISION_PREVIEW_ORIGIN,
    projectRef: process.env.INCOMEOS_REVISION_SUPABASE_REF, publishableKey: process.env.INCOMEOS_REVISION_SUPABASE_PUBLISHABLE_KEY });
  console.log(`Prepared local revision preview at ${output}`);
}
