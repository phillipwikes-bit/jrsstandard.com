// Browser checks for incomeos.js review fixes at iPhone width, using a synthetic hostile feed
// served in place of opportunities.json. No real opportunity data is changed.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync,existsSync} from "node:fs";
import {join,extname} from "node:path";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
let chromium,devices;
try{({chromium,devices}=require("playwright"));}
catch{try{({chromium,devices}=require("playwright-core"));}
  catch{if(process.env.CI){console.error("playwright-core is required in CI");process.exit(1);}console.log("SKIPPED: playwright not installed");process.exit(0);}}
const launchOptions=process.env.INCOMEOS_BROWSER?{executablePath:process.env.INCOMEOS_BROWSER,args:["--no-sandbox"]}:{};
const root=new URL("../owner/incomeos/",import.meta.url).pathname;
const types={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=createServer((req,res)=>{const p=join(root,decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/,"")||"index.html");
  if(!p.startsWith(root)||!existsSync(p)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{"content-type":types[extname(p)]||"application/octet-stream"});res.end(readFileSync(p));}).listen(0,"127.0.0.1");
await new Promise(r=>server.once("listening",r));
const browser=await chromium.launch(launchOptions);
const ctx=await browser.newContext({...devices["iPhone 13"],acceptDownloads:true});
const page=await ctx.newPage();const errors=[];page.on("pageerror",e=>errors.push(String(e)));
const dialogs=[];page.on("dialog",async d=>{dialogs.push(d.message());await d.dismiss();});
const feed={asOf:"2026-11-01",notice:"synthetic",studies:[
  {id:"syn-js",title:"Synthetic hostile link",provider:"Test",paymentUsd:100,minutes:60,mode:"online",eventEnd:"2099-12-31",dates:"Any",eligibility:["Anyone"],status:"Open",url:"javascript:alert(1)",sourceUrl:"javascript:alert(1)",linkKind:"Direct screener",risk:[],reviewed:"2026-11-01"},
  {id:"syn-nokind",title:"Synthetic no link kind",provider:"Test",paymentUsd:50,minutes:30,mode:"online",eventEnd:"2099-12-31",dates:"Any",eligibility:[],status:"Open",url:"https://example.org/apply",sourceUrl:"https://example.org/apply",risk:[],reviewed:"2026-11-01"}],
 assets:[{id:"syn-asset",title:"Synthetic asset",type:"Test",provider:"Test",capitalUsd:0,terms:"t",payout:"p",status:"s",linkKind:"k",risks:[],opportunityUrl:"data:text/html,x",reviewed:"2026-11-01"}]};
await page.route("**/opportunities.json",r=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(feed)}));
await page.goto(`http://127.0.0.1:${server.address().port}/index.html?study=syn-nokind`);
await page.waitForFunction(()=>document.querySelectorAll("#research-cards article").length===2);
// R14-4: no javascript: or data: link is ever rendered.
assert.equal(await page.locator('a[href^="javascript:"],a[href^="data:"]').count(),0);
assert.match(await page.locator("#research-cards").textContent(),/Link unavailable/);
// R14-2: the direct filter tolerates a study without a link kind.
await page.locator("#research-filter").selectOption("direct");
assert.equal(await page.locator("#research-cards article").count(),1);
// R14-3: the deep link applies once; a refresh keeps the owner's filter and view.
await page.locator("#research-filter").selectOption("online");
await page.locator("#refresh").click();await page.waitForTimeout(300);
assert.equal(await page.locator("#research-filter").inputValue(),"online");
// R14-5: no NaN or Infinity on asset cards.
await page.locator('.bottomnav button[data-view="assets"]').click();
assert.doesNotMatch(await page.locator("#asset-cards").textContent(),/NaN|Infinity/);
// R14-7: invalid calculator input clears the stale projection.
await page.locator('.bottomnav button[data-view="compound"]').click();
await page.locator("#assumed-return").fill("50");
assert.equal(await page.locator("#future-value").textContent(),"Check inputs");
// R14-8: clearing records is refused under the staging lock, before any confirmation.
await page.locator('.bottomnav button[data-view="about"]').click();
await page.locator("#clear-local").click();
assert.ok(dialogs.some(m=>/disabled in unapproved staging/.test(m)),dialogs.join(" | "));
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS main page browser checks passed: safe links, optional link kind, one-time deep link, finite asset figures, calculator reset, staging-locked clear.");
