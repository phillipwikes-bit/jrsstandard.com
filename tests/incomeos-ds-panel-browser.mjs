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
    const ctx=await browser.newContext({viewport:{width,height:812},isMobile:true,hasTouch:true});
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
    assert.match(t,/DS-N1 0\.7\.0-dev/);
    assert.match(t,/Original SP acceptance0 of 18/);
    assert.match(t,/AUTHENTIC_SOURCE_NOT_RECOVERED/);
    assert.match(t,/INTEGRATION_IN_PROGRESS/);
    assert.match(t,/Live GitHub CI connectionNOT_CONNECTED/);
    assert.match(t,/Recorded study runs, synthetic \/ independent0 \/ 0/);
    assert.match(t,/NOT_AUTHORIZED/);
    assert.equal(await page.locator('#ds-product-runtime button').isDisabled(),true);
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
      document.dispatchEvent(new CustomEvent('incomeos:workspace-changed',{detail:{dsProgram:p}}));
    });
    const updated=await page.locator('#ds-product-runtime').textContent();
    assert.match(updated,/BUG-SYN-01: Constructed source mismatch/);
    assert.match(updated,/TASK-SYN-01: Inspect synthetic evidence reference/);
    assert.match(updated,/NOT_AUTHORIZED/);
    await page.evaluate(() => {
      let p = window.IncomeOSDSProgram.newProgram('2026-11-05');
      p.acceptance[0].status='ACCEPTED';
      document.dispatchEvent(new CustomEvent('incomeos:workspace-changed',{detail:{dsProgram:p}}));
    });
    assert.match(await page.locator('#ds-product-runtime').textContent(),/Programme record cannot be verified/);

    assert.deepEqual(errors,[], 'page errors at '+width+'px');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'no horizontal overflow at '+width+'px');
    await ctx.close();
  }
  console.log('PASS: IncomeOS imported product source and fail-closed reviewer boundary at 320, 375, 430px');
} finally {await browser.close(); await new Promise(done=>server.close(done));}
