// Exercises api/checkout.js: unknown offer, unconfigured fail-safe, and that a
// configured URL redirects. Proves it never invents a destination.
const cfgPath='/home/user/jrsstandard.com/api/_offer-config.js';
const cfg=await import(cfgPath);
const mod=await import('/home/user/jrsstandard.com/api/checkout.js');
const get=u=>new Request(u);
const checks=[];const t=(n,g,w)=>checks.push([n,g,w]);

let r=await mod.default(get('https://x/api/checkout?o=nope'));
t('unknown offer -> 404', r.status, 404);

r=await mod.default(get('https://x/api/checkout?o=audit&src=verify'));
t('unconfigured -> 503 not a redirect', r.status, 503);
t('unconfigured sends no Location', r.headers.get('location'), null);
const html=await r.text();
t('names the price', html.includes('$250'), true);
t('offers the invoice path', html.includes('info@jrsstandard.com'), true);
t('says nothing was charged', html.includes('Nothing was charged'), true);

t('POST rejected', (await mod.default(new Request('https://x/api/checkout?o=audit',{method:'POST'}))).status, 405);
t('isConfigured false on empty', cfg.isConfigured(cfg.OFFERS.audit), false);
t('isConfigured rejects non-https', cfg.isConfigured({checkout_url:'http://x'}), false);
t('isConfigured true on https', cfg.isConfigured({checkout_url:'https://buy.stripe.com/x'}), true);
t('prices are 250/500/750',
  [cfg.OFFERS.audit.price_usd,cfg.OFFERS.governance.price_usd,cfg.OFFERS.calibration.price_usd].join(','),
  '250,500,750');
t('free tier is ungated', cfg.FREE_TIER.gated, false);

let fail=0;
for(const [n,g,w] of checks){const ok=g===w;if(!ok)fail++;console.log((ok?'PASS  ':'FAIL  ')+n+': got '+JSON.stringify(g)+', expected '+JSON.stringify(w));}
console.log(fail?'\n'+fail+' FAILED':'\nALL '+checks.length+' ASSERTIONS PASSED');
process.exit(fail?1:0);
