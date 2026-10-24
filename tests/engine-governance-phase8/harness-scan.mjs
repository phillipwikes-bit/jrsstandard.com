// JRS PHASE 8: static source scanners used by the Phase 8 suite (test harness only).
//
// Process-execution scan (applies to lib/engine-governance-phase8/): forbids any use of
// child_process except a named import of execFileSync used with the literal 'git' as its
// first argument. Ordinary regular-expression .exec( calls are permitted.
// Provider scan (applies to every Phase 8 .mjs/.js file): forbids provider model
// identifiers, provider keys and key names, provider endpoints, provider environment
// access, provider SDK imports and string-concatenated forms of these.
//
// Every finding names the file and the rule. Patterns are assembled from fragments so
// this file and the suite never match their own detection text.
//
// Limitations (static, lexical): a module name assembled at run time
// (import('node:' + x)), eval or Function constructors, and indirect access through
// another module re-exporting child_process are not detected. Re-exports are covered
// only because every Phase 8 module is scanned.

const j = (...a) => a.join('');
const CP = j('(?:node:)?', 'child', '_process');
const MOD = "['\"`]" + CP + "['\"`]";
const PROC_FNS = ['exec', 'execSync', 'execFile', 'execFileSync', 'spawn', 'spawnSync', 'fork'];
const FN_ALT = PROC_FNS.join('|');

export const EXEC_RULES = Object.freeze([
  ['EXEC-NAMESPACE-IMPORT', new RegExp('import\\s*\\*\\s*as\\s+\\w+\\s+from\\s*' + MOD)],
  ['EXEC-DEFAULT-IMPORT', new RegExp('import\\s+[A-Za-z_$][\\w$]*\\s*(?:,\\s*\\{[^}]*\\})?\\s+from\\s*' + MOD)],
  ['EXEC-REQUIRE', new RegExp('require\\s*\\(\\s*' + MOD + '\\s*\\)')],
  ['EXEC-MODULE-MEMBER', new RegExp('\\b' + j('child', '_process') + '\\s*\\.\\s*(?:' + FN_ALT + ')\\b')],
  ['EXEC-MEMBER-CALL', new RegExp('\\.\\s*(?:execSync|execFile|execFileSync|spawn|spawnSync|fork)\\s*\\(')],
  ['EXEC-BARE-CALL', new RegExp('(?<![.\\w$])(?:exec|execSync|execFile|spawn|spawnSync|fork)\\s*\\(')],
]);

function namedImports(src) {
  const out = [];
  const re = new RegExp('(?:import\\s*\\{([^}]*)\\}\\s*from\\s*' + MOD + ')|(?:\\{([^}]*)\\}\\s*=\\s*(?:await\\s+)?(?:import|require)\\s*\\(\\s*' + MOD + '\\s*\\))', 'g');
  let m;
  while ((m = re.exec(src)) !== null) for (const part of (m[1] || m[2]).split(',')) { const p = part.trim(); if (p) out.push(p); }
  return out;
}

export function scanExecution(src, file) {
  const s = String(src);
  const f = [];
  const hit = (rule) => { if (!f.some((x) => x.rule === rule)) f.push({ file, rule }); };
  for (const [rule, re] of EXEC_RULES) if (re.test(s)) hit(rule);
  // Named imports and destructuring from child_process: only a plain execFileSync binding is permitted.
  const named = namedImports(s);
  for (const n of named) if (!/^execFileSync$/.test(n)) hit(/[:]|\bas\b/.test(n) ? 'EXEC-ALIASED-IMPORT' : 'EXEC-NAMED-IMPORT');
  // Destructuring from a binding that holds child_process (namespace or default import, or require).
  const holders = [];
  const hre = new RegExp('(?:import\\s*\\*\\s*as\\s+([A-Za-z_$][\\w$]*)|import\\s+([A-Za-z_$][\\w$]*))\\s+from\\s*' + MOD + '|(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*(?:await\\s+)?(?:import|require)\\s*\\(\\s*' + MOD + '\\s*\\)', 'g');
  let m;
  while ((m = hre.exec(s)) !== null) holders.push(m[1] || m[2] || m[3]);
  for (const h of holders) {
    if (new RegExp('\\{[^}]*\\}\\s*=\\s*' + h.replace(/\$/g, '\\$') + '\\b').test(s)) hit('EXEC-DESTRUCTURE');
    if (new RegExp('\\b' + h.replace(/\$/g, '\\$') + '\\s*(?:\\.\\s*exec\\b|\\[)').test(s)) hit('EXEC-HOLDER-ACCESS');
  }
  if (new RegExp('\\b(?:import|require)\\s*\\(\\s*' + MOD + '\\s*\\)').test(s) && !new RegExp('\\{\\s*execFileSync\\s*\\}\\s*=\\s*(?:await\\s+)?import\\s*\\(\\s*' + MOD).test(s)) hit('EXEC-DYNAMIC-IMPORT');
  // execFileSync is permitted only with the literal 'git' as its first argument.
  const efs = /(?<![.\w$])execFileSync\s*\(\s*([^,)]*)/g;
  while ((m = efs.exec(s)) !== null) if (!/^['"]git['"]$/.test(m[1].trim())) hit('EXEC-NON-GIT-EXECFILESYNC');
  if (/(?<![\w$])fetch\s*\(/.test(s)) hit('NET-FETCH');
  if (/https?:\/\//.test(s)) hit('NET-URL');
  return f;
}

const PROVIDER = [
  ['PROV-MODEL-ID', j('cla', 'ude-(?:haiku|sonnet|opus|fable|instant|\\d)[-.\\d]')],
  ['PROV-KEY', j('sk', '-ant-')],
  ['PROV-KEY-NAME', j('(?:ANTH', 'ROPIC_(?:API_KEY|AUTH_TOKEN)|CLA', 'UDE_API_KEY)')],
  ['PROV-ENDPOINT', j('api\\.', 'anth', 'ropic\\.com')],
  ['PROV-ENV-ACCESS', j('(?:process\\.env|Deno\\.env\\.get|\\benv)\\s*(?:\\.\\s*|\\[\\s*[\'"`]|\\(\\s*[\'"`])(?:ANTH', 'ROPIC|CLA', 'UDE)_')],
  ['PROV-SDK-IMPORT', j('(?:from\\s*|require\\s*\\(\\s*|import\\s*\\(\\s*)[\'"`](?:@anth', 'ropic-ai/[\\w-]+|anth', 'ropic)[\'"`]')],
].map(([id, src]) => [id, new RegExp(src)]);

// Removes string-concatenation joints so 'ab' + 'cd' reads as 'abcd'.
export function joinConcatenations(s) { return String(s).replace(/(['"`])\s*\+\s*\1/g, ''); }

export function scanProvider(src, file) {
  const s = String(src);
  const f = [];
  for (const [rule, re] of PROVIDER) if (re.test(s)) f.push({ file, rule });
  const joined = joinConcatenations(s);
  if (joined !== s) for (const [rule, re] of PROVIDER) if (!re.test(s) && re.test(joined)) f.push({ file, rule: 'PROV-SPLIT:' + rule });
  return f;
}

export const describe = (findings) => findings.map((x) => x.file + ': ' + x.rule).join('; ');
