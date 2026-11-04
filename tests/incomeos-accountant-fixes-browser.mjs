// Browser check for accountant.js review fixes at iPhone width: a half-typed report year
// must not break rendering or stop the ledger-updated event. Synthetic page state only.
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
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
await page.locator('.bottomnav button[data-view="ledger"]').click();
await page.evaluate(()=>{window.__ledgerEvents=0;window.addEventListener("incomeos:ledger-updated",()=>{window.__ledgerEvents++;});});
// R10-1/2: a two-digit year is reported in the panel; rendering finishes and the event still fires.
await page.locator("#report-year").fill("25");await page.locator("#report-year").dispatchEvent("change");
assert.match(await page.locator("#review-summary").textContent(),/four-digit report year/);
assert.ok(await page.evaluate(()=>window.__ledgerEvents)>0,"ledger-updated still dispatched");
await page.locator("#report-year").fill("2026");await page.locator("#report-year").dispatchEvent("change");
assert.doesNotMatch(await page.locator("#review-summary").textContent(),/four-digit/);
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS accountant browser check passed: invalid report year handled without breaking rendering.");
