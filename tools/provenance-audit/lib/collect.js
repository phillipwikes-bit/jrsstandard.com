// Provenance audit: fact collection from one commit. INTERNAL, LOCAL ONLY.
//
// Everything is read from git objects at a named commit, never from the working tree, so a run
// against the same commit yields the same facts whatever state the checkout is in. Only text
// files of the scanned types are read, and their content never leaves this process: the
// analysis keeps paths, hashes, sizes and derived classifications, not text.
import { git, gitText } from './git.js';
import { parseIgnore, exclusionRule } from './ignore.js';

export const OUTPUT_PREFIXES = Object.freeze(['tools/provenance-audit/generated/']);
export const OUTPUT_FILES = Object.freeze([
  'docs/architecture/SOFTWARE_ASSET_AND_PROVENANCE_INVENTORY.md', 'docs/architecture/TECHNICAL_DILIGENCE_READINESS_REPORT.md',
  'docs/architecture/THIRD_PARTY_COMPONENTS_AND_NOTICES.md', 'docs/architecture/AI_ASSISTED_DEVELOPMENT_DISCLOSURE.md',
]);
export const isOutput = (p) => OUTPUT_FILES.includes(p) || OUTPUT_PREFIXES.some((x) => p.startsWith(x));
const SCAN_EXT = /\.(html?|js|mjs|cjs|ts|py|json|ya?ml|css|txt|xml|sql|sh|toml|md)$|(^|\/)(\.vercelignore|\.gitignore|CNAME)$/;
const MAX_SCAN = 3 * 1024 * 1024;

export function collectFacts(root, commitRef = 'HEAD') {
  const commit = gitText(root, ['rev-parse', '--verify', commitRef + '^{commit}']).trim();
  const shallow = gitText(root, ['rev-parse', '--is-shallow-repository']).trim() === 'true';
  const commitDate = gitText(root, ['log', '-1', '--format=%cs', commit]).trim();

  // Tree: mode, type, blob, size, path, for every tracked file at the commit.
  const files = parseTree(gitText(root, ['ls-tree', '-r', '-l', '--full-tree', commit]));

  // Deployment exclusion: .vercelignore at this commit, matched with gitignore semantics.
  const ignoreText = files.some((f) => f.path === '.vercelignore') ? gitText(root, ['show', commit + ':.vercelignore']) : '';
  const rules = parseIgnore(ignoreText);
  const exclusion = {};
  for (const f of files) { const r = exclusionRule(rules, f.path); if (r) exclusion[f.path] = r; }

  // Content of scanned text files, read in one batch from the object store.
  const toRead = files.filter((f) => SCAN_EXT.test(f.path) && f.size <= MAX_SCAN);
  const contents = readBlobs(root, toRead.map((f) => f.blob));
  const text = {};
  toRead.forEach((f) => { text[f.path] = contents.get(f.blob); });

  // History: every commit reachable from the commit, with its files and identity fields.
  const raw = gitText(root, ['log', '--no-renames', '--format=%x1e%H%x1f%an%x1f%ae%x1f%cn%x1f%cs%x1f%B%x1f', '--name-only', commit]);
  const commits = [];
  for (const rec of raw.split('\x1e').slice(1)) {
    const parts = rec.split('\x1f');
    commits.push({ hash: parts[0], author: parts[1], email: parts[2], committer: parts[3], date: parts[4], message: parts[5],
                   files: (parts[6] || '').split('\n').map((s) => s.trim()).filter(Boolean) });
  }
  return { commit, commit_date: commitDate, shallow, files, exclusion, vercelignore: ignoreText, text, commits };
}

// Parses `git ls-tree -r -l` output into sorted file records, leaving out the tool's own outputs.
export function parseTree(lsTree) {
  const files = [];
  for (const line of String(lsTree).split('\n')) {
    const m = /^(\d+) (\w+) ([0-9a-f]+)\s+(-|\d+)\t(.+)$/.exec(line);
    if (!m || m[2] !== 'blob') continue;
    if (isOutput(m[5])) continue;                       // the tool's own outputs are not inventoried
    files.push({ path: m[5], mode: m[1], blob: m[3], size: m[4] === '-' ? 0 : Number(m[4]) });
  }
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

function readBlobs(root, shas) {
  const map = new Map();
  if (!shas.length) return map;
  const buf = git(root, ['cat-file', '--batch'], shas.join('\n') + '\n');
  let pos = 0;
  while (pos < buf.length) {
    const nl = buf.indexOf(10, pos);
    const head = buf.slice(pos, nl).toString('utf8').split(' ');
    const size = Number(head[2]);
    map.set(head[0], buf.slice(nl + 1, nl + 1 + size).toString('utf8'));
    pos = nl + 1 + size + 1;
  }
  return map;
}
