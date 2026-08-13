// Exercises api/bench-score.js: refusal paths, scoring, and the guarantee that
// no per-record result or key material ever appears in a response.
const mod = await import('/home/user/jrsstandard.com/api/bench-score.js');
const post = (body, hdr={}) => new Request('https://x/api/bench-score', {
  method:'POST', headers:{'Content-Type':'application/json', ...hdr}, body: JSON.stringify(body)});
const checks=[]; const t=(n,g,w)=>checks.push([n,g,w]);

process.env.BENCH_SCORE_TOKENS=''; process.env.BENCH_KEY_JSON='';
let r=await mod.default(post({submissions:[{record_id:'a',determination:'ready'}]}));
t('no licensing -> 503', r.status, 503);

process.env.BENCH_SCORE_TOKENS='tok-live';
r=await mod.default(post({submissions:[]}));
t('no token -> 401', r.status, 401);

r=await mod.default(post({submissions:[{record_id:'a',determination:'ready'}]},{Authorization:'Bearer wrong'}));
t('wrong token -> 401', r.status, 401);

r=await mod.default(post({submissions:[{record_id:'a',determination:'ready'}]},{Authorization:'Bearer tok-live'}));
t('key absent -> 503', r.status, 503);
t('key absent names the reason', (await r.clone().json()).error, 'key_not_provisioned');

// Provision a key and score.
const KEY={r1:'ready',r2:'gap_identified',r3:'review_required',r4:'ready',r5:'gap_identified'};
process.env.BENCH_KEY_JSON=JSON.stringify(KEY);
const subs=[{record_id:'r1',determination:'Ready'},{record_id:'r2',determination:'gap identified'},
            {record_id:'r3',determination:'ready'},{record_id:'r4',determination:'ready'},
            {record_id:'r5',determination:'gap_identified'},{record_id:'ZZZ',determination:'ready'}];
r=await mod.default(post({submissions:subs},{Authorization:'Bearer tok-live'}));
const d=await r.json();
t('scores -> 200', r.status, 200);
t('records scored', d.calibration.records_scored, 5);
t('records not in set', d.calibration.records_not_in_set, 1);
t('agreement pct (4 of 5)', d.calibration.agreement_with_key_pct, 80);
t('ac1 present', typeof d.calibration.ac1_vs_key, 'number');

// THE SECURITY ASSERTION. No key material, no per-record result, in the body.
const body=JSON.stringify(d);
t('key values absent from response', Object.keys(KEY).some(k=>body.includes('"'+k+'"')), false);
t('no per-record array', /per_record|record_results|"r1"/.test(body), false);
// Leak markers only: real condition keys and gold verdicts. The word
// "five-condition scoring" appears in the DISCLOSURE saying it is not returned,
// which is not a leak; matching on it was a bug in this test, not in the code.
t('no condition keys leaked', /basis_identification|cold_reviewer|chronolog|traceab/i.test(body), false);
t('no gold verdict field', /"gold"|gold_|answer_key/i.test(body), false);
t('disclosure states the aggregate-only rule', /never returned/.test(body), true);

let fail=0;
for(const [n,g,w] of checks){const ok=g===w; if(!ok)fail++; console.log((ok?'PASS  ':'FAIL  ')+n+': got '+JSON.stringify(g)+', expected '+JSON.stringify(w));}
console.log(fail? '\n'+fail+' FAILED' : '\nALL '+checks.length+' ASSERTIONS PASSED');
process.exit(fail?1:0);
