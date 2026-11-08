// Real same-origin DEVELOPMENT browser test for the existing IncomeOS product view.
// No real owner records or customer inputs. No customer route is enabled.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({chromium} = require('playwright-core')); }
catch { if (process.env.CI) throw Error('playwright-core required in CI'); console.log('SKIPPED: playwright-core unavailable'); process.exit(0); }
const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mime = {'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server = createServer((req,res) => {
  let requestPath;
  try {requestPath = decodeURIComponent((req.url||'/').split('?')[0]);} catch {res.writeHead(400);res.end();return;}
  const target=resolve(repoRoot, '.' + requestPath);
  if (!(target===repoRoot||target.startsWith(repoRoot+sep)) || !existsSync(target)) {res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':mime[extname(target)]||'application/octet-stream','cache-control':'no-store'});
  res.end(readFileSync(target));
}).listen(0,'127.0.0.1');
await new Promise(done=>server.once('listening',done));
const browser = await chromium.launch({ executablePath: process.env.INCOMEOS_BROWSER, args:['--no-sandbox']});
try {
  for (const width of [320,375,430]) {
    const ctx=await browser.newContext({viewport:{width,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await ctx.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:'+server.address().port+'/owner/incomeos/index.html');
    await page.waitForFunction(()=>document.querySelector('#ds-product-runtime')?.textContent?.includes('Load an IncomeOS owner workspace'));
    // No accidental direct client invocation, and no invented release authority.
    assert.equal(await page.locator('#ds-product-runtime button').count(),0);
    await page.locator('.bottomnav button[data-view="research"]').click();
    await page.locator('#briefing-new').click();
    await page.locator('.bottomnav button[data-view="ds"]').click();
    await page.locator('#ds-start').click();
    await page.waitForFunction(()=>document.querySelector('#ds-product-runtime')?.textContent?.includes('DS-N1'));
    const t=await page.locator('#ds-product-runtime').textContent();
    assert.match(t,/DS-N1 NOT_LOADED_IN_OWNER_DESK/, 'Hosted Owner Desk must not claim the unbundled DS-N1 engine is active');
    assert.match(t,/Original SP acceptance0 of 18/);
    assert.match(t,/AUTHENTIC_SOURCE_NOT_RECOVERED/);
    assert.match(t,/READ_ONLY_SOURCE_NOT_PACKAGED/);
    assert.match(t,/Live GitHub CI connectionNOT_CONNECTED/);
    assert.match(t,/Recorded study runs, synthetic \/ independent0 \/ 0/);
    assert.match(t,/NOT_AUTHORIZED/);
    assert.match(t,/Inspect product revenue and costs/);
    assert.match(t,/Product-tagged ledger rows0/);
    assert.match(t,/Recorded operating costs \(owner ledger\)\$0\.00/);
    // Every original acceptance status is visible on demand, without
    // disclosing case/source contents or treating DS-N1 results as DS-A.
    const spDetails = page.locator('#ds-product-runtime details').first();
    assert.equal(await page.locator('#ds-product-runtime details').count(),3,
      'SP acceptance, engineering provenance, and finance are separate disclosures');
    // The disclosure is near the top of the product card, clear of the
    // fixed bottom navigation, and has a mobile-sized native summary target.
    const spSummary = spDetails.locator('summary');
    assert.ok(await spSummary.evaluate(el => el.getBoundingClientRect().height >= 44),
      'SP disclosure must have a 44px tap target at '+width+'px');
    // Scroll the actual touch target clear of fixed navigation, verify its
    // center is unobstructed, then send a real emulated touch. Never force it.
    await spSummary.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
    const target=await spSummary.evaluate(el=>{
      const r=el.getBoundingClientRect();
      const x=r.left+r.width/2,y=r.top+r.height/2;
      const hit=document.elementFromPoint(x,y);
      return {x,y,receivesPointer:hit===el||el.contains(hit)};
    });
    assert.equal(target.receivesPointer,true,'SP disclosure center must receive pointer events at '+width+'px');
    // Send a real touch at freshly measured viewport coordinates. Locator.tap
    // repeatedly auto-scrolls this long mobile document after the hit test,
    // moving the target under unrelated status/header elements in Chromium.
    // Coordinate input still undergoes native browser hit-testing; no force,
    // DOM click, synthetic event dispatch or keyboard substitution is used.
    await page.touchscreen.tap(target.x,target.y);
    assert.equal(await spDetails.evaluate(el => el.open),true);
    const spRows = spDetails.locator('li');
    assert.equal(await spRows.count(),18);
    assert.match(await spRows.first().textContent(),/SP-01: NOT_ACCEPTED/);
    assert.match(await spRows.first().textContent(),/source: not available in repository/);
    assert.match(await spRows.first().textContent(),/linked evidence records: 0/);
    assert.match(await spRows.first().textContent(),/Verification blocked/);
    assert.match(await spRows.last().textContent(),/SP-18: NOT_ACCEPTED/);
    assert.equal(await spDetails.evaluate(el => el.open),true);
    await spDetails.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await spDetails.evaluate(el => el.open),false,
      'keyboard Enter should close the disclosure');
    await page.keyboard.press('Enter');
    assert.equal(await spDetails.evaluate(el => el.open),true,
      'keyboard Enter should reopen the disclosure');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),
      'SP acceptance detail must not overflow at '+width+'px');
    assert.equal(await page.locator('#ds-product-runtime button').isDisabled(),true);
    // Owner product finance uses the SAME workspace ledger, never the reviewer.
    await page.evaluate(() => {
      const W = window.IncomeOSWorkspace, D = window.IncomeOSDSProgram;
      let w = W.newWorkspace('2026-11-05');
      w.dsProgram = D.newProgram('2026-11-05');
      w = W.addRecord(w, 'ledger', {
        kind:'outflow',date:'2026-11-05',payer:'PRIVATE-VENDOR-DO-NOT-RENDER',
        amountUsd:'29.50',category:'software',dsDimension:'software_api'
      }, '2026-11-05');
      w = W.addRecord(w, 'ledger', {
        kind:'outflow',date:'2026-11-05',payer:'PRIVATE-UNPAID-DO-NOT-RENDER',
        amountUsd:'80.00',category:'software',dsDimension:'software_api'
      }, '2026-11-05');
      w.ledger[w.ledger.length-1].paymentStatus='scheduled';
      w = W.addRecord(w, 'ledger', {
        kind:'outflow',date:'2026-11-05',payer:'PRIVATE-TAX-DO-NOT-RENDER',
        amountUsd:'40.00',category:'tax',dsDimension:'testing_security'
      }, '2026-11-05');
      w.ledger[w.ledger.length-1].type='taxpayment';
      w = W.addRecord(w, 'ledger', {
        kind:'income',date:'2026-11-05',payer:'PRIVATE-PAYER-DO-NOT-RENDER',
        amountUsd:'150.00',category:'business',dsDimension:'licensing_revenue'
      }, '2026-11-05');
      document.dispatchEvent(new CustomEvent('incomeos:workspace-changed',{detail:w}));
    });
    const financial=page.locator('#ds-product-runtime details[aria-label="Decision Spellchecker product finance"]');
    const financialText=await financial.textContent();
    assert.match(financialText,/Product-tagged ledger rows4/);
    assert.match(financialText,/Recorded operating costs \(owner ledger\)\$29\.50/);
    assert.match(financialText,/Reported received revenue \(owner-reconciled\)\$0\.00/);
    assert.match(financialText,/Revenue recorded but not verified received\$150\.00/);
    assert.match(financialText,/Scheduled, disputed or reversed costs \(excluded\)\$80\.00/);
    assert.match(financialText,/Tax or unclassified outflows \(not operating costs\)\$40\.00/);
    assert.match(financialText,/Product accounting exceptions/);
    assert.match(financialText,/Owner-entered classifications and reconciliations are not independent bank verification/);
    assert.doesNotMatch(await page.locator('#ds-product-runtime').textContent(),/PRIVATE-VENDOR-DO-NOT-RENDER|PRIVATE-PAYER-DO-NOT-RENDER|PRIVATE-UNPAID-DO-NOT-RENDER|PRIVATE-TAX-DO-NOT-RENDER/);
    await page.evaluate(() => {
      const D=window.IncomeOSDSProgram, p=D.newProgram('2026-11-05');
      document.dispatchEvent(new CustomEvent('incomeos:workspace-changed',{
        detail:{schema:'incomeos.workspace.v1',dsProgram:p,
          ledger:[{kind:'outflow',program:'decision-spellchecker',amountUsd:'9999.99',dsDimension:'software_api'}]}
      }));
    });
    assert.match(await financial.textContent(),/Product accounting unavailable/);
    // The product view must follow the SAME workspace's changed programme record.
    await page.evaluate(() => {
      let p = window.IncomeOSDSProgram.newProgram('2026-11-05');
      p = window.IncomeOSDSProgram.add(p,'defects',{
        id:'BUG-SYN-01',title:'Constructed source mismatch',
        severity:'HIGH',identity:'DS-C'
      },'2026-11-05');
      p = window.IncomeOSDSProgram.add(p,'tasks',{
        id:'TASK-SYN-01',title:'Inspect synthetic evidence reference',
        module:'engineering',dependsOn:[],value:5,cost:1,risk:1
      },'2026-11-05');
      const ws=window.IncomeOSWorkspace.newWorkspace('2026-11-05');
      document.dispatchEvent(new CustomEvent('incomeos:workspace-changed',{detail:{...ws,dsProgram:p}}));
    });
    const updated=await page.locator('#ds-product-runtime').textContent();
    assert.match(updated,/BUG-SYN-01: Constructed source mismatch/);
    assert.match(updated,/TASK-SYN-01: Inspect synthetic evidence reference/);
    assert.match(updated,/NOT_AUTHORIZED/);
    await page.evaluate(() => {
      let p = window.IncomeOSDSProgram.newProgram('2026-11-05');
      p.acceptance[0].status='ACCEPTED';
      const ws=window.IncomeOSWorkspace.newWorkspace('2026-11-05');
      document.dispatchEvent(new CustomEvent('incomeos:workspace-changed',{detail:{...ws,dsProgram:p}}));
    });
    assert.match(await page.locator('#ds-product-runtime').textContent(),/Programme record cannot be verified/);

    assert.deepEqual(errors,[], 'page errors at '+width+'px');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'no horizontal overflow at '+width+'px');
    await ctx.close();
  }
  console.log('PASS: IncomeOS imported product source and fail-closed reviewer boundary at 320, 375, 430px');
} finally {await browser.close(); await new Promise(done=>server.close(done));}
