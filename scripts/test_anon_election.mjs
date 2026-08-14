// Proves the two who elected anonymity now resolve to false (an election on
// file) rather than null (no election), and that nobody else changed.
import { ROSTER } from '/home/user/jrsstandard.com/api/_contributor-roster.js';
import fs from 'fs';
const src = fs.readFileSync('/home/user/jrsstandard.com/api/contributor.js','utf8');
const m = src.match(/const ANON_CODES = \[([^\]]*)\]/);
const ANON = (m[1].match(/'([^']+)'/g)||[]).map(s=>s.replace(/'/g,''));
const resolve = p => (ANON.indexOf(p.code) !== -1) ? false : p.named_on_file;

const checks=[]; const t=(n,g,w)=>checks.push([n,g,w]);
t('ANON_CODES contents', ANON.join(','), 'RR-130,RR-132');
const by = {}; Object.values(ROSTER).forEach(p => by[p.code]=p);
t('RR-130 resolves to false', resolve(by['RR-130']), false);
t('RR-132 resolves to false', resolve(by['RR-132']), false);
t('V-AI-23 stays null (genuinely no election)', resolve(by['V-AI-23']), null);
t('a named person stays true', resolve(by['RR-121']), true);
const changed = Object.values(ROSTER).filter(p => resolve(p) !== p.named_on_file).map(p=>p.code);
t('only those two changed', changed.sort().join(','), 'RR-130,RR-132');
t('nobody flips to true', Object.values(ROSTER).filter(p=>resolve(p)===true && p.named_on_file!==true).length, 0);

let fail=0;
for(const [n,g,w] of checks){const ok=g===w;if(!ok)fail++;console.log((ok?'PASS  ':'FAIL  ')+n+': got '+JSON.stringify(g)+', expected '+JSON.stringify(w));}
console.log(fail?'\n'+fail+' FAILED':'\nALL '+checks.length+' PASSED');
process.exit(fail?1:0);
