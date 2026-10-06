// Provenance audit: .vercelignore matcher. INTERNAL, LOCAL ONLY. Pure.
//
// Implements the gitignore rules .vercelignore uses: comments, blank lines, negation (!), a
// trailing slash for directories, a leading or inner slash for anchoring, and the wildcards *,
// ** and ?. The last matching rule wins. tests/provenance-audit cross-checks it against git's own
// matcher on every tracked file. As in git, rules are tested against each directory on the
// path first, and an excluded directory cannot be re-included by a later file rule.
function toRegex(pat) {
  let p = pat, dirOnly = false;
  if (p.endsWith('/')) { dirOnly = true; p = p.slice(0, -1); }
  const anchored = p.startsWith('/') || p.slice(0, -1).includes('/');
  if (p.startsWith('/')) p = p.slice(1);
  let re = '';
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === '*') {
      if (p[i + 1] === '*') { i++; if (p[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*'; }
      else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  const prefix = anchored ? '^' : '^(?:.*/)?';
  return { re: new RegExp(prefix + re + '$'), dirOnly };
}

export function parseIgnore(text) {
  const rules = [];
  String(text || '').split('\n').forEach((line, i) => {
    const raw = line.replace(/\r$/, '');
    if (!raw.trim() || raw.startsWith('#')) return;
    const t = raw.replace(/\s+$/, '');
    const negate = t.startsWith('!');
    const pat = negate ? t.slice(1) : t;
    rules.push({ line: i + 1, pattern: t, negate, ...toRegex(pat) });
  });
  return rules;
}

// The last matching rule for one name decides it; a directory-only rule matches directories only.
function decide(rules, name, isDir) {
  let hit = null;
  for (const r of rules) if ((!r.dirOnly || isDir) && r.re.test(name)) hit = r;
  return hit && !hit.negate ? hit : null;
}

// Returns the rule that excludes a path ("line N: pattern"), or null if the path is deployed.
// As in git, an excluded parent directory decides for everything beneath it.
export function exclusionRule(rules, path) {
  const parts = path.split('/');
  for (let i = 1; i < parts.length; i++) {
    const r = decide(rules, parts.slice(0, i).join('/'), true);
    if (r) return 'line ' + r.line + ': ' + r.pattern;
  }
  const r = decide(rules, path, false);
  return r ? 'line ' + r.line + ': ' + r.pattern : null;
}
