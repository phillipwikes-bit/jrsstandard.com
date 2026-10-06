// Mutation run for the provenance audit: each safeguard is removed, one at a time, from a
// throwaway copy of tools/provenance-audit/, and the suite (pointed at the copy through
// JRS_PA_DIR) must then FAIL. The working tree is never modified.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../../', import.meta.url).pathname;
const SRC = join(ROOT, 'tools/provenance-audit');
export const MUTATIONS = [
  ['P01', 'no-legal-conclusion guard', 'lib/guards.js', "export function languageProblems(text) {\n  const out = [];", "export function languageProblems(text) {\n  const out = []; return out;"],
  ['P02', 'an unknown dependency license is never RECORDED', 'lib/analyze.js', "status: builtin ? 'UNKNOWN' : 'MISSING_LOCAL_LICENSE_METADATA',", "status: 'RECORDED',"],
  ['P03', 'the Engine candidate directory is inventoried', 'lib/analyze.js', "under('lib/engine-candidate/')", "under('lib/engine-candidate-omitted/')"],
  ['P04', 'an excluded directory is never classified secret', 'lib/analyze.js', "if (['LOCAL_TOOL', 'ENGINE_CANDIDATE', 'SCHEMA_OR_PROTOCOL'].includes(area.asset_class)) return 'LOCAL_INTERNAL';", "if (['LOCAL_TOOL', 'ENGINE_CANDIDATE', 'SCHEMA_OR_PROTOCOL'].includes(area.asset_class)) return 'SECRET';"],
  ['P05', 'reports identify their source commit', 'lib/render.js', "') from commit `' + a.snapshot.source_commit + '` ('", "') from commit `' + 'HEAD' + '` ('"],
  ['P06', 'no raw record or packet text in reports', 'lib/analyze.js', "path: redact(f.path), blob: f.blob,", "path: redact(f.path), excerpt: typeof text === 'string' ? text.slice(0, 400) : null, blob: f.blob,"],
  ['P07', 'git transports disabled (no network)', 'lib/git.js', "const BASE = ['-c', 'protocol.allow=never', ", "const BASE = ["],
  ['P08', 'git limited to local read-only subcommands', 'lib/git.js', "'rev-parse', 'ls-tree',", "'rev-parse', 'ls-remote', 'fetch', 'ls-tree',"],
  ['P09', 'never declare transaction-ready', 'lib/render.js', "It may support future diligence preparation, but it does not make JRS transaction-ready.", "It may support future diligence preparation, and JRS is transaction-ready."],
  ['P10', 'credential values never reproduced', 'lib/analyze.js', "for (const [name, re] of SECRET_PATTERNS) if (re.test(t)) (hits[name] = hits[name] || []).push(redact(f.path));", "for (const [name, re] of SECRET_PATTERNS) if (re.test(t)) (hits[name] = hits[name] || []).push(redact(f.path) + ' ' + t.match(re)[0]);"],
  ['P11', 'opaque slugs redacted', 'lib/analyze.js', "export const redact = (p) => String(p).replace(", "export const redact = (p) => String(p); const _unused = (p) => String(p).replace("],
  ['P12', 'excluded directory decides for files beneath it', 'lib/ignore.js', "    if (r) return 'line ' + r.line + ': ' + r.pattern;\n  }", "  }"],
  ['P13', 'emails masked', 'lib/analyze.js', "const key = c.author + ' <' + maskEmail(c.email) + '>';", "const key = c.author + ' <' + c.email + '>';"],
  ['P14', 'outputs only to permitted paths', 'run.mjs', "if (!WRITABLE.some((re) => re.test(path))) problems.push(path + ': not a permitted output path');", ""],
  ['P15', 'the tool does not inventory its own outputs', 'lib/collect.js', "    if (isOutput(m[5])) continue;", ""],
];
const base = mkdtempSync(join(tmpdir(), 'jrs-pa-mutation-'));
const copy = join(base, 'provenance-audit');
const runSuite = () => {
  try { execFileSync(process.execPath, [join(ROOT, 'tests/provenance-audit/run-all.mjs'), '--quick'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, JRS_PA_DIR: copy + '/', JRS_PA_MUTATION_CHILD: '1' } }); return { failed: false, suites: [] }; }
  catch (e) { return { failed: true, suites: String(e.stdout || '').split('\n').filter((l) => /: FAILED$/.test(l)).map((l) => l.split(':')[0]) }; }
};
let survived = 0;
try {
  cpSync(SRC, copy, { recursive: true });
  const b = runSuite();
  console.log(`${b.failed ? 'FAIL' : 'PASS'}  baseline: the unmutated copy passes${b.failed ? ' (' + b.suites.join(', ') + ')' : ''}`);
  if (b.failed) survived++;
  for (const [id, what, file, find, repl] of MUTATIONS) {
    rmSync(copy, { recursive: true, force: true }); cpSync(SRC, copy, { recursive: true });
    const p = join(copy, file), s = readFileSync(p, 'utf8'), n = s.split(find).length - 1;
    if (n !== 1) { survived++; console.log(`FAIL  ${id} ${what}: the mutation text occurs ${n} times, so it was not applied`); continue; }
    writeFileSync(p, s.replace(find, repl));
    const r = runSuite();
    if (!r.failed) survived++;
    console.log(`${r.failed ? 'PASS' : 'FAIL'}  ${id} ${what}: ${r.failed ? 'caught by ' + r.suites.join(', ') : 'SURVIVED'}`);
  }
} finally { rmSync(base, { recursive: true, force: true }); }
console.log(`\n${MUTATIONS.length} mutations, ${MUTATIONS.length - survived} caught, ${survived} survived`);
process.exit(survived ? 1 : 0);
