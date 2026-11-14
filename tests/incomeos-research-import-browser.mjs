// Browser check: on the protected app (storage interlock active), a stale built-in study snapshot is announced, and a
// reviewed study file loads into page memory only. Simulated Chromium at phone width; synthetic studies only.
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
const snapshotAsOf=JSON.parse(readFileSync(join(root,"opportunities.json"),"utf8")).asOf;
const day=n=>new Date(Date.parse(snapshotAsOf+"T12:00:00")+n*86400000);
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const browser=await chromium.launch(launchOptions);
const origin=`http://127.0.0.1:${server.address().port}`;
async function open(at){
  const ctx=await browser.newContext({...devices["iPhone SE"]});const page=await ctx.newPage();const errors=[],external=[];
  page.on("pageerror",e=>errors.push(String(e)));page.on("dialog",d=>d.accept());
  page.on("request",r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith("blob:")&&!r.url().startsWith("data:"))external.push(r.url());});
  await page.clock.setFixedTime(at);await page.goto(origin+"/index.html");
  await page.locator('.bottomnav button[data-view="research"]').click();
  await page.waitForFunction(()=>/snapshot/.test(document.getElementById("radar-status").textContent));
  return {ctx,page,errors,external};
}
// Within the freshness window: no stale notice.
{const {ctx,page}=await open(day(1));
 assert.ok(await page.evaluate(()=>window.IncomeOSFinancialReadOnly===true),"storage interlock active, as on the hosted app");
 assert.doesNotMatch(await page.locator("#radar-status").textContent(),/out of date/);await ctx.close();}
// Five days after the snapshot: the notice says so, and a fresh study file loads for this visit only.
const at=day(5),today=iso(at);
const {ctx,page,errors,external}=await open(at);
assert.match(await page.locator("#radar-status").textContent(),new RegExp("built-in study snapshot is from "+snapshotAsOf+", 5 days ago.*on hold as out of date.*Load a fresh study file"));
assert.ok(!(await page.locator("#radar-import").isDisabled()),"import usable on the protected app");
const study={id:"synthetic-fresh-1001",title:"Synthetic usability interview",provider:"Synthetic Recruiter",paymentUsd:150,paymentMethod:"PayPal",minutes:60,screenMinutes:5,prepMinutes:0,adminMinutes:5,
  timeConfidence:"verified",mode:"online",eventEnd:null,dateType:"application-deadline",reviewed:today,url:"https://example.org/apply/1001",sourceUrl:"https://example.org/listing/1001",
  dates:"Flexible",linkKind:"Direct screener",eligibility:["Adults in the United States"],risk:[],status:"Open as posted"};
const bad={...study,id:"synthetic-bad-1002",ssn:"x"};
await page.locator("#radar-import-file").setInputFiles({name:"s.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify({asOf:today,studies:[study,bad]}))});
await page.locator("#radar-import").tap();
await page.waitForFunction(()=>/For this visit only/.test(document.getElementById("radar-status").textContent));
const status=await page.locator("#radar-status").textContent();
assert.match(status,/1 accepted, 1 rejected/);assert.match(status,/nothing was stored/);
const card=page.locator("#radar-results article",{hasText:"Synthetic usability interview"});
assert.equal(await card.count(),1);
assert.doesNotMatch(await card.locator(".radar-heading").textContent(),/HOLD/,"a study reviewed today is not held as stale");
assert.match(await card.textContent(),/Effective hourly yield \$128\.57\/hr/);
// Thresholds apply for this visit without storage.
await page.locator("#radar-min-ehy").fill("200");await page.locator("#radar-preferences button[type=submit]").tap();
assert.match(await page.locator("#radar-status").textContent(),/for this visit only; nothing was stored/);
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,"nothing in browser storage");
assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w,page.viewportSize().width),"no horizontal overflow");
await page.reload();await page.locator('.bottomnav button[data-view="research"]').click();
await page.waitForFunction(()=>/snapshot/.test(document.getElementById("radar-status").textContent));
assert.equal(await page.locator("#radar-results article",{hasText:"Synthetic usability interview"}).count(),0,"reload clears imported studies");
// With a workspace open, loaded studies are kept in it and come back after an encrypted save, reload and reopen.
await page.locator('.bottomnav button[data-view="research"]').click();
await page.locator("#briefing-new").tap();
await page.locator("#radar-import-file").setInputFiles({name:"s.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify({asOf:today,studies:[study]}))});
await page.locator("#radar-import").tap();
await page.waitForFunction(()=>/Kept in your open workspace/.test(document.getElementById("radar-status").textContent));
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#briefing-save").tap()]);
const saved=readFileSync(await dl.path(),"utf8");
assert.doesNotMatch(saved,/Synthetic usability interview/,"saved workspace is encrypted");
await page.reload();await page.locator('.bottomnav button[data-view="research"]').click();
await page.waitForFunction(()=>/snapshot/.test(document.getElementById("radar-status").textContent));
assert.equal(await page.locator("#radar-results article",{hasText:"Synthetic usability interview"}).count(),0);
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
await page.locator("#briefing-file").setInputFiles({name:"w.json",mimeType:"application/json",buffer:Buffer.from(saved)});
await page.locator("#briefing-load").tap();
await page.waitForFunction(()=>/memory only/.test(document.getElementById("briefing-status").textContent),null,{timeout:30000});
const back=page.locator("#radar-results article",{hasText:"Synthetic usability interview"});
await back.waitFor();
assert.match(await back.textContent(),/Effective hourly yield \$128\.57\/hr/,"study back from the workspace, still screened");
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,"nothing in browser storage after reopening");
assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
await ctx.close();await browser.close();server.close();
console.log("IncomeOS research import browser QA passed: stale snapshot announced, fresh study file loads in memory only on the protected app, private fields refused, nothing stored, reload clears.");
