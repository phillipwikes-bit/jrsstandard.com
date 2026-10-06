// Isolation: no network, git restricted to local read-only subcommands with transports disabled.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { t, done, DIR, REPO } from './_helpers.mjs';

const files = ['run.mjs', ...readdirSync(join(DIR, 'lib')).map((f) => 'lib/' + f)].filter((f) => /\.(js|mjs)$/.test(f));
const src = Object.fromEntries(files.map((f) => [f, readFileSync(join(DIR, f), 'utf8')]));
const all = Object.values(src).join('\n');
t('no module imports a network library', !/from ['"]node:(http|https|net|tls|dgram|dns|http2)['"]/.test(all));
t('no fetch, XMLHttpRequest or WebSocket call', !/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(all.replace(/\/\/.*$/gm, '')));
t('only lib/git.js starts a subprocess', Object.entries(src).filter(([, s]) => /from ['"]node:child_process['"]/.test(s)).map(([f]) => f).join() === 'lib/git.js');
t('git transports are disabled on every call', /'-c', 'protocol\.allow=never'/.test(src['lib/git.js']) && /GIT_ALLOW_PROTOCOL: ''/.test(src['lib/git.js']) && /GIT_TERMINAL_PROMPT: '0'/.test(src['lib/git.js']));
const git = await import(join(DIR, 'lib/git.js'));
t('the git allowlist is exactly six local read-only subcommands', JSON.stringify([...git.ALLOWED].sort()) === JSON.stringify(['cat-file', 'check-ignore', 'log', 'ls-tree', 'rev-parse', 'show']));
for (const sub of ['fetch', 'pull', 'clone', 'push', 'remote', 'ls-remote', 'submodule', 'archive', 'config', 'credential', 'init']) {
  let refused = false; try { git.git(REPO, [sub]); } catch (e) { refused = /refused git subcommand/.test(e.message); }
  t('refuses git ' + sub + ' before starting git', refused);
}
let opt = false; try { git.git(REPO, ['log', '--upload-pack=x']); } catch (e) { opt = /refused git option/.test(e.message); }
t('refuses a transport option', opt);
t('the tool reads the commit object store, not the working tree', /cat-file', '--batch'/.test(src['lib/collect.js']) && !/readFileSync/.test(src['lib/collect.js']));
t('the tool writes only through the permitted-path check', /WRITABLE/.test(src['run.mjs']) && /not a permitted output path/.test(src['run.mjs']));
const C = await import(join(DIR, 'lib/collect.js'));
const tree = ['100644 blob ' + 'a'.repeat(40) + '     10\tindex.html', '100644 blob ' + 'b'.repeat(40) + '     20\tdocs/architecture/SOFTWARE_ASSET_AND_PROVENANCE_INVENTORY.md',
  '100644 blob ' + 'c'.repeat(40) + '     30\ttools/provenance-audit/generated/snapshot.json', '040000 tree ' + 'd'.repeat(40) + '      -\tlib', '100644 blob ' + 'e'.repeat(40) + '      5\tapi/a.js'].join('\n');
const parsed = C.parseTree(tree);
t('the tool does not inventory its own outputs', parsed.map((f) => f.path).join() === 'api/a.js,index.html');
t('tree records keep blob, mode and size', parsed[1].blob === 'a'.repeat(40) && parsed[1].size === 10 && parsed[1].mode === '100644');
done();
